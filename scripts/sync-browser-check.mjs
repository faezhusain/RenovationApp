// Browser test with synthetic data and a simulated identity and cloud API.
// It does not contact Netlify or the user's project.
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('playwright');
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,sep,extname} from 'node:path';

const port=process.env.SYNC_TEST_PORT||'4173',origin=`http://app.localhost:${port}`;
let standalone;
if(process.env.SYNC_TEST_STANDALONE){
  const root=resolve('public'),types={'.html':'text/html','.css':'text/css','.js':'text/javascript'};
  standalone=createServer(async(req,res)=>{try{const pathname=new URL(req.url,'http://localhost').pathname,file=resolve(root,'.'+(pathname==='/'?'/index.html':pathname));if(!file.startsWith(root+sep))throw Error('Invalid path');const contents=await readFile(file);res.writeHead(200,{'Content-Type':`${types[extname(file)]||'application/octet-stream'}; charset=utf-8`});res.end(contents);}catch{res.writeHead(404);res.end();}});
  await new Promise(resolve=>standalone.listen(Number(port),'127.0.0.1',resolve));
}
for(let i=0;i<50;i++){try{const r=await fetch(`http://127.0.0.1:${port}/`);if(r.ok)break;}catch{}await new Promise(r=>setTimeout(r,100));if(i===49)throw Error('Local test server did not start');}
let version=0,project=null;
const identity=`export async function handleAuthCallback(){return location.hash==='#fake-recovery'?{type:'recovery'}:null} export async function getUser(){return sessionStorage.getItem('signed-in')?{id:'test-user',email:'test@example.com'}:null} export async function login(){sessionStorage.setItem('signed-in','yes');return {id:'test-user',email:'test@example.com'}} export async function logout(){sessionStorage.removeItem('signed-in')} export async function acceptInvite(){throw Error('not used')} export async function updateUser({password}){sessionStorage.setItem('test-reset-password',password);sessionStorage.setItem('signed-in','yes')} export async function requestPasswordRecovery(email){sessionStorage.setItem('test-reset-email',email)}`;
const launch={headless:true};if(process.env.MOBILE_BROWSER_PATH)launch.executablePath=process.env.MOBILE_BROWSER_PATH;
const browser=await chromium.launch(launch);
async function context(){
  const ctx=await browser.newContext();
  await ctx.route('**/',async route=>{
    const response=await route.fetch({url:`http://127.0.0.1:${port}/`});
    await route.fulfill({response,headers:{...response.headers(),'content-security-policy':"script-src 'self'"}});
  });
  await ctx.route('**/identity-bundle.js',route=>route.fulfill({status:200,contentType:'text/javascript',body:identity}));
  await ctx.route('**/api/project',async route=>{
    const req=route.request();
    if(req.method()==='GET')return project?route.fulfill({status:200,contentType:'application/json',headers:{'x-project-version':`"${version}"`},body:JSON.stringify(project)}):route.fulfill({status:404});
    if(req.method()==='PUT'){
      const headers=req.headers(),expected=version?headers['x-project-version']===`"${version}"`:headers['x-project-version']==='new';
      if(!expected)return route.fulfill({status:409});
      project=JSON.parse(req.postData());version++;return route.fulfill({status:204,headers:{'x-project-version':`"${version}"`}});
    }
    return route.fulfill({status:405});
  });
  return ctx;
}
async function login(page){await page.goto(origin);await page.getByLabel('Email').fill('test@example.com');await page.getByLabel('Password').fill('test-password');await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.getByText('Cloud ready',{exact:true}).waitFor();}
try{
  const first=await context(),page=await first.newPage();page.on('pageerror',error=>console.error('Browser error:',error.message));await login(page);
  await page.getByRole('button',{name:'More',exact:true}).click();page.on('dialog',d=>d.accept());
  await page.getByRole('button',{name:'Send password reset email'}).click();assert.equal(await page.evaluate(()=>sessionStorage.getItem('test-reset-email')),'test@example.com');
  const data={version:1,project:{name:'Example project',type:'',location:'',currency:'MYR',target:100000,reserve:0,savings:0,savingsDate:'',moveIn:''},costs:[{id:'floor',name:'Floor',category:'Renovation',status:'estimated',amount:1000,room:'Hall',phase:'1'}],payments:[],quotes:[],tasks:[],receipts:[],sellerCodes:[],paymentCorrections:[]};
  await page.locator('#import-file').setInputFiles({name:'example-backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(data))});
  await page.getByText('Saved to cloud',{exact:true}).waitFor();assert.equal(project.project.name,'Example project');
  await page.reload();await page.getByText('Example project',{exact:true}).first().waitFor();
  await page.locator('.sidebar [data-nav="family"]').click();await page.getByRole('button',{name:'Add entry'}).click();
  await page.getByRole('dialog').waitFor({timeout:5000});
  await page.locator('dialog select[name="kind"]').selectOption('available');await page.locator('dialog input[name="name"]').fill('Sample savings');await page.locator('dialog input[name="amount"]').fill('1200.00');await page.getByRole('button',{name:'Save',exact:true}).click();
  await page.getByText('Saved to cloud',{exact:true}).waitFor();assert.equal(project.familyFinances[0].amount,120000);
  const plan={format:'renovation-family-finances-v1',entries:[{id:'imported',person:'Mummy',kind:'expected',name:'Example income',amount:50000,due:'Later',notes:''}]};
  await page.locator('#family-import-file').setInputFiles({name:'example-finances.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(plan))});await page.getByText('Saved to cloud',{exact:true}).waitFor();assert.equal(project.familyFinances.length,2);
  await page.locator('#family-import-file').setInputFiles({name:'example-finances.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(plan))});assert.equal(project.familyFinances.length,2);
  await page.getByRole('button',{name:'Edit Sample savings'}).click();await page.getByRole('button',{name:'Delete entry'}).click();await page.getByText('Saved to cloud',{exact:true}).waitFor();assert.equal(project.familyFinances.find(x=>x.name==='Sample savings').voided,true);
  await page.locator('.sidebar [data-nav="more"]').click();await page.locator('.list-row').filter({hasText:'Sample savings'}).getByRole('button',{name:'Restore'}).click();await page.getByText('Saved to cloud',{exact:true}).waitFor();assert.equal(project.familyFinances.find(x=>x.name==='Sample savings').voided,false);
  const {prepareMigration}=await import('../public/migration.js');assert.equal(prepareMigration(JSON.stringify(project),true).project.familyFinances.length,2);
  const second=await context(),other=await second.newPage();await login(other);
  await other.locator('.sidebar [data-nav="family"]').click();await other.getByText('Sample savings').waitFor();await other.locator('[data-family-person="Mummy"]').click();await other.getByText('Example income').waitFor();
  await page.getByRole('button',{name:'Budget',exact:true}).click();await other.getByRole('button',{name:'Budget',exact:true}).click();
  await page.getByRole('button',{name:'Edit amount for Floor'}).click();await page.getByLabel('Amount for Floor').fill('20.00');await page.getByLabel('Amount for Floor').press('Enter');await page.getByText('Saved to cloud',{exact:true}).waitFor();assert.equal(project.costs[0].amount,2000);
  await other.getByRole('button',{name:'Edit amount for Floor'}).click();await other.getByLabel('Amount for Floor').fill('30.00');await other.getByLabel('Amount for Floor').press('Enter');await other.getByText('Conflict · export backup and reload',{exact:true}).waitFor();assert.equal(project.costs[0].amount,2000);
  await other.reload();await other.getByText('Unsent changes found',{exact:true}).waitFor();assert.equal(await other.getByRole('button',{name:'Resume unsent changes'}).count(),0);
  const recovery=await context(),reset=await recovery.newPage();await reset.goto(origin+'/#fake-recovery');await reset.getByLabel('New password').fill('sample-password');await reset.getByRole('button',{name:'Update password'}).click();await reset.getByText('Cloud ready',{exact:true}).waitFor();assert.equal(await reset.evaluate(()=>sessionStorage.getItem('test-reset-password')),'sample-password');
  await first.close();await second.close();await recovery.close();console.log('Browser sync and recovery smoke tests passed with simulated identity and storage.');
}finally{await browser.close();if(standalone)await new Promise(resolve=>standalone.close(resolve));}
