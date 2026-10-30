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
        if(id==='home'){
          const budget=page.locator('.planned-budget');assert.match(await budget.textContent(),/Total planned\s*RM\s*6,234\.5/);assert.match(await budget.textContent(),/Paid\s*RM\s*200/);assert.match(await budget.textContent(),/Remaining\s*RM\s*6,034\.5/);assert.match(await budget.textContent(),/3\.2%/);
          if(process.env.MOBILE_SCREENSHOTS&&width===390)await budget.screenshot({path:path.join(process.env.MOBILE_SCREENSHOTS,'planned-budget.png')});
        }
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
    for(const width of [320,390,1280]){
      const deletionProject=structuredClone(project);
      deletionProject.payments[0].date=new Date().toISOString().slice(0,10);
      deletionProject.paymentCorrections=[{id:'adj',costId:'c1',amount:1000,createdAt:'2026-01-01T00:00:00Z'}];
      deletionProject.receipts=[{id:'receipt',title:'Example receipt',filename:'receipt.png',date:'2026-01-01',notes:'',type:'image/png',size:8,data:'iVBORw0KGgo=',costId:'c1',paymentId:'p1'}];
      const ctx=await browser.newContext({viewport:{width,height:844}});
      await ctx.addInitScript(data=>{window.renovationCloud={mode:'cloud',email:'example@example.com',status:{state:'ready'},initialProject:data,session:{stage(value){window.lastStaged=structuredClone(value)},hasDraft(){return false},retry(){}},identity:{logout:async()=>{}}};},deletionProject);
      const page=await ctx.newPage();let approve=false;page.on('dialog',dialog=>approve?dialog.accept():dialog.dismiss());
      const navigate=async id=>{
        if(width>900)await page.locator(`.sidebar [data-nav="${id}"]`).click();
        else if(['home','checklist','budget','quotes','more'].includes(id))await page.locator(`.mobile-nav [data-nav="${id}"]`).click();
        else{await page.locator('.mobile-nav [data-nav="more"]').click();await page.locator(`.content [data-nav="${id}"]`).first().click();}
      };
      await page.goto(`http://127.0.0.1:${server.address().port}/`);await navigate('budget');
      const item=page.locator('.budget-table tbody tr').filter({hasText:'A long sample appliance name'});
      await item.getByRole('button',{name:'Edit',exact:true}).click();await page.getByRole('button',{name:'Delete cost'}).click();
      assert.ok(await page.getByRole('dialog').isVisible(),'cancelling deletion should keep the dialog open');
      approve=true;await page.getByRole('button',{name:'Delete cost'}).click();assert.equal(await item.count(),0);
      assert.ok(await page.getByText('Your deposits, payments and refunds will appear here.').isVisible());
      const deleted=await page.evaluate(()=>window.lastStaged);assert.equal(deleted.costs.find(c=>c.id==='c1').voided,true);assert.equal(deleted.payments.length,1);assert.equal(deleted.paymentCorrections.length,1);assert.equal(deleted.receipts.length,1);assert.equal(deleted.quotes.length,1);
      const {prepareMigration}=await import('../public/migration.js');prepareMigration(JSON.stringify(deleted),true);
      await navigate('home');assert.match(await page.locator('.metric').filter({hasText:'Already paid'}).textContent(),/RM\s*0/);assert.match(await page.locator('.planned-budget').textContent(),/Total planned\s*RM\s*5,000/);assert.match(await page.locator('.planned-budget').textContent(),/0%/);
      for(const title of await page.locator('.bar-col').evaluateAll(els=>els.map(el=>el.title)))assert.match(title,/RM\s*0$/,'Deleted payment still appears in chart');
      await navigate('receipts');assert.ok(await page.getByText('Example receipt').isVisible());await page.getByRole('button',{name:'Edit',exact:true}).click();assert.equal(await page.locator('select[name="costId"]').inputValue(),'c1');assert.equal(await page.locator('select[name="paymentId"]').inputValue(),'p1');await page.locator('dialog [data-action="close"]').first().click();
      await navigate('quotes');assert.ok(await page.getByText('No quotations yet.').isVisible());
      await navigate('more');await page.getByRole('heading',{name:'Deleted costs'}).waitFor();await page.locator('.list-row').filter({hasText:'A long sample appliance name'}).getByRole('button',{name:'Restore'}).click();
      const restored=await page.evaluate(()=>window.lastStaged);assert.equal(restored.costs.find(c=>c.id==='c1').voided,false);prepareMigration(JSON.stringify(restored),true);
      await navigate('home');assert.match(await page.locator('.metric').filter({hasText:'Already paid'}).textContent(),/RM\s*210/);
      await navigate('budget');assert.ok(await page.getByText('Example payment').isVisible());await navigate('quotes');assert.ok(await page.getByText('Example supplier').isVisible());
      await ctx.close();console.log(`Cost deletion and restoration passed at ${width}px`);
    }
    for(const width of [390,1280]){
      const data=structuredClone(project);
      data.payments.push({id:'refund',costId:'c1',type:'refund',originalId:'p1',date:'2026-01-02',amount:5000,reference:'Example refund'});
      data.paymentCorrections=[{id:'adjust',costId:'c1',amount:1000,createdAt:'2026-01-01T00:00:00Z'}];
      data.quotes.push({id:'accepted',costId:'c1',supplier:'Accepted supplier',amount:123450,details:'Accepted quotation',accepted:true});
      data.receipts=[{id:'receipt',title:'Example receipt',filename:'receipt.png',date:'2026-01-01',notes:'',type:'image/png',size:8,data:'iVBORw0KGgo=',costId:'c1',paymentId:'p1'}];
      const ctx=await browser.newContext({viewport:{width,height:844}});
      await ctx.addInitScript(data=>{window.renovationCloud={mode:'cloud',email:'example@example.com',status:{state:'ready'},initialProject:data,session:{stage(value){window.lastStaged=structuredClone(value)},hasDraft(){return false},retry(){}},identity:{logout:async()=>{}}};},data);
      const page=await ctx.newPage();const messages=[];page.on('dialog',d=>{messages.push(d.message());return d.accept();});
      const nav=async id=>{if(width>900)await page.locator(`.sidebar [data-nav="${id}"]`).click();else if(['home','checklist','budget','quotes','more'].includes(id))await page.locator(`.mobile-nav [data-nav="${id}"]`).click();else{await page.locator('.mobile-nav [data-nav="more"]').click();await page.locator(`.content [data-nav="${id}"]`).first().click();}};
      await page.goto(`http://127.0.0.1:${server.address().port}/`);
      await nav('quotes');await page.getByRole('button',{name:'Delete quotation from Example supplier'}).click();await page.getByRole('button',{name:'Delete quotation from Accepted supplier'}).click();
      assert.ok(messages.some(x=>x.includes('agreed cost and payments stay unchanged')));assert.ok(await page.getByText('No quotations yet.').isVisible());
      let snapshot=await page.evaluate(()=>window.lastStaged);assert.equal(snapshot.costs.find(x=>x.id==='c1').amount,123450);assert.equal(snapshot.costs.find(x=>x.id==='c1').status,'agreed');
      await nav('budget');await page.getByRole('button',{name:'Delete payment for A long sample appliance name'}).click();assert.ok(messages.some(x=>x.includes('Related refunds will also be excluded')));assert.equal(await page.getByRole('button',{name:'Delete refund for A long sample appliance name'}).count(),0);
      await nav('home');assert.match(await page.locator('.metric').filter({hasText:'Already paid'}).textContent(),/RM\s*10/);
      await nav('more');await page.locator('.list-row').filter({hasText:'payment - RM'}).getByRole('button',{name:'Restore'}).click();
      await nav('budget');await page.getByRole('button',{name:'Delete refund for A long sample appliance name'}).click();await page.getByRole('button',{name:'Delete payment for A long sample appliance name'}).click();await page.getByRole('button',{name:'Delete paid correction for A long sample appliance name'}).click();
      await nav('home');assert.match(await page.locator('.metric').filter({hasText:'Already paid'}).textContent(),/RM\s*0/);
      await nav('receipts');await page.getByRole('button',{name:'Edit',exact:true}).click();assert.equal(await page.locator('select[name="paymentId"]').inputValue(),'p1');await page.getByRole('button',{name:'Delete receipt'}).click();assert.ok(await page.getByText('No receipts yet.').isVisible());
      await nav('seller');await page.getByRole('button',{name:'Edit',exact:true}).click();await page.getByRole('button',{name:'Delete seller'}).click();assert.ok(await page.getByText('No sellers yet.').isVisible());
      await nav('checklist');await page.getByRole('button',{name:'Edit Check the sample renovation plans'}).click();await page.getByRole('button',{name:'Delete task'}).click();assert.ok(await page.getByText('No tasks match your search.').isVisible());
      snapshot=await page.evaluate(()=>window.lastStaged);const {prepareMigration}=await import('../public/migration.js');prepareMigration(JSON.stringify(snapshot),true);assert.ok(snapshot.quotes.every(x=>x.voided));assert.ok(snapshot.payments.every(x=>x.voided));assert.ok(snapshot.receipts[0].voided&&snapshot.sellerCodes[0].voided&&snapshot.tasks[0].archived);
      await nav('more');await page.locator('.list-row').filter({hasText:'Example supplier'}).getByRole('button',{name:'Restore'}).click();await page.locator('.list-row').filter({hasText:'Accepted supplier'}).getByRole('button',{name:'Restore'}).click();
      await page.locator('.list-row').filter({hasText:'refund - RM'}).getByRole('button',{name:'Restore'}).click();assert.ok(messages.some(x=>x.includes('Restore the original payment')));
      await page.locator('.list-row').filter({hasText:'payment - RM'}).getByRole('button',{name:'Restore'}).click();await page.locator('.list-row').filter({hasText:'refund - RM'}).getByRole('button',{name:'Restore'}).click();
      await page.locator('.list-row').filter({hasText:'A long sample appliance name'}).getByRole('button',{name:'Restore'}).click();
      await page.locator('.list-row').filter({hasText:'Example receipt'}).getByRole('button',{name:'Restore'}).click();await page.locator('.list-row').filter({hasText:'Example seller'}).getByRole('button',{name:'Restore'}).click();await page.locator('.list-row').filter({hasText:'Check the sample renovation plans'}).getByRole('button',{name:'Restore'}).click();
      snapshot=await page.evaluate(()=>window.lastStaged);prepareMigration(JSON.stringify(snapshot),true);assert.ok(snapshot.quotes.every(x=>!x.voided));assert.ok(snapshot.payments.every(x=>!x.voided));assert.ok(!snapshot.receipts[0].voided&&!snapshot.sellerCodes[0].voided&&!snapshot.tasks[0].archived);
      await nav('home');assert.match(await page.locator('.metric').filter({hasText:'Already paid'}).textContent(),/RM\s*160/);await nav('quotes');assert.ok(await page.getByText('Example supplier').isVisible());assert.ok(await page.getByText('Accepted supplier').isVisible());
      await ctx.close();console.log(`Manual entry deletion and restoration passed at ${width}px`);
    }
  }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(err=>{console.error(err);server.close();process.exitCode=1;});
