// Browser test with synthetic data and a simulated identity and cloud API.
// It does not contact Netlify or the user's project.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';

const origin='http://app.localhost:4173';
for(let i=0;i<50;i++){try{const r=await fetch('http://127.0.0.1:4173/');if(r.ok)break;}catch{}await new Promise(r=>setTimeout(r,100));if(i===49)throw Error('Local test server did not start');}
let version=0,project=null;
const identity=`export async function handleAuthCallback(){return null} export async function getUser(){return sessionStorage.getItem('signed-in')?{id:'test-user',email:'test@example.com'}:null} export async function login(){sessionStorage.setItem('signed-in','yes');return {id:'test-user',email:'test@example.com'}} export async function logout(){sessionStorage.removeItem('signed-in')} export async function acceptInvite(){throw Error('not used')} export async function updateUser(){throw Error('not used')}`;
const browser=await chromium.launch({headless:true});
async function context(){
  const ctx=await browser.newContext();
  await ctx.route('**/identity-bundle.js',route=>route.fulfill({status:200,contentType:'text/javascript',body:identity}));
  await ctx.route('**/api/project',async route=>{
    const req=route.request();
    if(req.method()==='GET')return project?route.fulfill({status:200,contentType:'application/json',headers:{etag:`"${version}"`},body:JSON.stringify(project)}):route.fulfill({status:404});
    if(req.method()==='PUT'){
      const headers=req.headers(),expected=version?headers['x-project-version']===`"${version}"`:headers['x-project-version']==='new';
      if(!expected)return route.fulfill({status:409});
      project=JSON.parse(req.postData());version++;return route.fulfill({status:204,headers:{etag:`"${version}"`}});
    }
    return route.fulfill({status:405});
  });
  return ctx;
}
async function login(page){await page.goto(origin);await page.getByLabel('Email').fill('test@example.com');await page.getByLabel('Password').fill('test-password');await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.getByText('Cloud ready',{exact:true}).waitFor();}
try{
  const first=await context(),page=await first.newPage();await login(page);
  await page.getByRole('button',{name:'More',exact:true}).click();page.on('dialog',d=>d.accept());
  const data={version:1,project:{name:'Example project',type:'',location:'',currency:'MYR',target:100000,reserve:0,savings:0,savingsDate:'',moveIn:''},costs:[{id:'floor',name:'Floor',category:'Renovation',status:'estimated',amount:1000,room:'Hall',phase:'1'}],payments:[],quotes:[],tasks:[],receipts:[],sellerCodes:[],paymentCorrections:[]};
  await page.locator('#import-file').setInputFiles({name:'example-backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(data))});
  await page.getByText('Saved to cloud',{exact:true}).waitFor();assert.equal(project.project.name,'Example project');
  await page.reload();await page.getByText('Example project',{exact:true}).first().waitFor();
  const second=await context(),other=await second.newPage();await login(other);
  await page.getByRole('button',{name:'Budget',exact:true}).click();await other.getByRole('button',{name:'Budget',exact:true}).click();
  await page.getByRole('button',{name:'Edit amount for Floor'}).click();await page.getByLabel('Amount for Floor').fill('20.00');await page.getByLabel('Amount for Floor').press('Enter');await page.getByText('Saved to cloud',{exact:true}).waitFor();assert.equal(project.costs[0].amount,2000);
  await other.getByRole('button',{name:'Edit amount for Floor'}).click();await other.getByLabel('Amount for Floor').fill('30.00');await other.getByLabel('Amount for Floor').press('Enter');await other.getByText('Conflict · export backup and reload',{exact:true}).waitFor();assert.equal(project.costs[0].amount,2000);
  await other.reload();await other.getByText('Unsent changes found',{exact:true}).waitFor();assert.equal(await other.getByRole('button',{name:'Resume unsent changes'}).count(),0);
  await first.close();await second.close();console.log('Browser sync smoke test passed with simulated identity and storage.');
}finally{await browser.close();}
