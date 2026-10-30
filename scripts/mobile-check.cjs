// Phone-size layout and interaction checks using synthetic project data only.
const {chromium}=require('playwright');
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');

const project={version:1,project:{name:'A long sample renovation project',type:'Condominium',location:'Kuala Lumpur',currency:'MYR',target:15000000,reserve:500000,savings:5000000,savingsDate:'2026-01-01',moveIn:''},
  costs:[{id:'c1',name:'A long sample appliance name',category:'Appliances',phase:'1',room:'Main bedroom',status:'agreed',amount:123450,notes:'A sample note'}, {id:'c2',name:'Kitchen cabinet',category:'Renovation',phase:'2',room:'Kitchen',status:'estimated',amount:500000}],
  payments:[{id:'p1',costId:'c1',type:'payment',date:'2026-01-01',amount:20000,reference:'Example payment'}],
  quotes:[{id:'q1',costId:'c1',supplier:'Example supplier',amount:123450,details:'Example quotation',accepted:false}],
  tasks:[{id:'t1',title:'Check the sample renovation plans',stage:'Planning',importance:'Must do',status:'Doing',description:'Sample notes',room:'Kitchen',due:''}],
  receipts:[],sellerCodes:[{id:'s1',seller:'Example seller',contact:'0123456789',code:'REF123',notes:'Example notes'}],paymentCorrections:[],research:[{topics:[{title:'Appliance research',entries:['Example appliance and option']}]}]};
const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json'};
const root=path.resolve('public');
const server=http.createServer((req,res)=>{const pathname=new URL(req.url,'http://localhost').pathname;const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);res.end();return;}res.writeHead(200,{'Content-Type':(types[path.extname(file)]||'application/octet-stream')+'; charset=utf-8'});res.end(data);});});
const pages=[['home','Home'],['checklist','Renovation checklist'],['budget','Your renovation budget'],['quotes','Quotations'],['more','More'],['appliances','Appliances & selections'],['receipts','Receipts'],['myhome','My home'],['guide','Your renovation guide'],['seller','Seller codes']];
const actions={checklist:['task'],budget:['cost','payment'],quotes:['quote'],receipts:['receipt'],myhome:['settings'],seller:['seller-code']};

(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const launch={headless:true};if(process.env.MOBILE_BROWSER_PATH)launch.executablePath=process.env.MOBILE_BROWSER_PATH;
  const browser=await chromium.launch(launch);
  try{
    for(const [width,height] of [[320,640],[375,667],[390,844],[430,932],[700,500],[844,390],[896,414]]){
      const ctx=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,hasTouch:true,isMobile:true});
      await ctx.addInitScript(({data,status})=>{window.renovationCloud={mode:'cloud',email:'example@example.com',status,initialProject:data,session:{stage(){},hasDraft(){return false},retry(){}},identity:{logout:async()=>{},requestPasswordRecovery:async email=>{window.resetRequestedFor=email}}};},{data:project,status:width===320?{state:'error',detail:'428'}:{state:'ready'}});
      const page=await ctx.newPage();const errors=[];page.on('pageerror',err=>errors.push(err.message));page.on('dialog',dialog=>dialog.accept());
      await page.goto(`http://127.0.0.1:${server.address().port}/`);
      for(const [id,title] of pages){
        if(id==='home'){} // The app opens on Home.
        else if(['checklist','budget','quotes','more'].includes(id))await page.locator(`.mobile-nav [data-nav="${id}"]`).click();
        else {await page.locator('.mobile-nav [data-nav="more"]').click();await page.locator(`.content [data-nav="${id}"]`).first().click();}
        if(id==='home')await page.locator('.hero h1').waitFor();else await page.getByRole('heading',{name:title,exact:true}).first().waitFor();
        const overflow=await page.evaluate(()=>({viewport:document.documentElement.clientWidth,page:document.documentElement.scrollWidth}));
        assert.ok(overflow.page<=overflow.viewport+1,`${width}px ${id}: page exceeds viewport (${JSON.stringify(overflow)})`);
        const nav=await page.locator('.mobile-nav').boundingBox();assert.ok(nav&&nav.x>=0&&nav.x+nav.width<=width+1,`${width}px ${id}: navigation outside viewport`);
        for(const action of actions[id]||[]){
          await page.locator(`.content [data-action="${action}"]`).first().click();
          const dialog=page.locator('dialog');await dialog.waitFor({state:'visible'});
          const box=await dialog.boundingBox();assert.ok(box.x>=0&&box.x+box.width<=width+1&&box.y>=0&&box.y+box.height<=height+1,`${width}px ${id}/${action}: dialog outside viewport`);
          assert.ok(await dialog.locator('[type="submit"]').count(),`${id}/${action}: missing save action`);
          await dialog.locator('[type="submit"]').scrollIntoViewIfNeeded();
          const save=await dialog.locator('[type="submit"]').boundingBox();assert.ok(save.y>=0&&save.y+save.height<=height+1,`${width}px ${id}/${action}: save action outside viewport`);
          if(process.env.MOBILE_SCREENSHOTS&&width===390)await page.screenshot({path:path.join(process.env.MOBILE_SCREENSHOTS,`${id}-${action}.png`),fullPage:false});
          await dialog.locator('[data-action="close"]').first().click();
        }
        if(id==='budget'){
          if(process.env.MOBILE_SCREENSHOTS&&width===390){await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:path.join(process.env.MOBILE_SCREENSHOTS,'budget-top.png')});}
          assert.equal(await page.locator('.budget-table tbody tr').count(),2);
          const dims=await page.locator('.budget-table').evaluate(el=>({width:el.clientWidth,scroll:el.scrollWidth}));assert.ok(dims.scroll<=dims.width+1,`${width}px budget rows overflow`);
          const search=page.getByRole('searchbox',{name:'Search budget items'});
          await search.fill('KITCHEN');assert.equal(await page.locator('.budget-table tbody tr').count(),1);assert.ok(await search.evaluate(el=>document.activeElement===el));
          assert.ok((await page.locator('.budget-total').textContent()).includes('5,000'));
          assert.ok(await page.locator('.budget-results-heading').getByText('1 of 2 items').isVisible());
          await page.locator('.budget-filter-panel summary').click();
          await page.locator('#phase-filter').selectOption('1');assert.equal(await page.locator('.budget-table tbody tr').count(),0);assert.ok((await page.locator('.budget-filter-panel summary').textContent()).includes('1 active'));
          await page.locator('[data-reset-filters]').click();assert.equal(await page.locator('.budget-table tbody tr').count(),2);
          assert.equal(await page.getByRole('searchbox',{name:'Search budget items'}).inputValue(),'');
          await page.locator('#budget-sort-mobile').selectOption('amount');assert.ok((await page.locator('.budget-table tbody tr').first().textContent()).includes('appliance'));
          await page.locator('[data-budget-sort-direction]').click();assert.ok((await page.locator('.budget-table tbody tr').first().textContent()).includes('Kitchen cabinet'));
          await page.getByRole('button',{name:'Edit phase for A long sample appliance name'}).click();await page.getByLabel('Phase for A long sample appliance name').selectOption('2');
          assert.ok(await page.getByRole('button',{name:'Edit phase for A long sample appliance name'}).getByText('Phase 2').isVisible());
          await page.getByRole('button',{name:'Edit amount for A long sample appliance name'}).click();await page.getByLabel('Amount for A long sample appliance name').fill('1234.50');await page.getByLabel('Amount for A long sample appliance name').press('Enter');
          assert.ok(await page.getByText('Total for displayed items').isVisible());
        }
        if(id==='more'){
          await page.getByRole('button',{name:'Send password reset email'}).click();
          assert.equal(await page.evaluate(()=>window.resetRequestedFor),'example@example.com');
        }
        if(process.env.MOBILE_SCREENSHOTS&&width===390)await page.screenshot({path:path.join(process.env.MOBILE_SCREENSHOTS,`${id}.png`),fullPage:false});
      }
      assert.deepEqual(errors,[],`${width}px page errors`);await ctx.close();console.log(`Mobile pages and forms passed at ${width}×${height}`);
    }
    const desktop=await browser.newContext({viewport:{width:1280,height:800}});
    await desktop.addInitScript(data=>{window.renovationCloud={mode:'cloud',email:'example@example.com',status:{state:'ready'},initialProject:data,session:{stage(){},hasDraft(){return false},retry(){}},identity:{logout:async()=>{},requestPasswordRecovery:async()=>{}}};},project);
    const page=await desktop.newPage();await page.goto(`http://127.0.0.1:${server.address().port}/`);await page.locator('.sidebar [data-nav="budget"]').click();
    await page.getByRole('searchbox',{name:'Search budget items'}).fill('sample note');assert.equal(await page.locator('.budget-table tbody tr').count(),1);
    await page.getByRole('searchbox',{name:'Search budget items'}).fill('not found');assert.ok(await page.getByText('No costs match these filters or search.').isVisible());
    await page.locator('[data-reset-filters]').click();await page.locator('[data-sort-table="cost"][data-sort-key="amount"]').click();assert.ok((await page.locator('.budget-table tbody tr').first().textContent()).includes('appliance'));
    await desktop.close();console.log('Desktop search, reset, and sorting passed');
  }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(err=>{console.error(err);server.close();process.exitCode=1;});
