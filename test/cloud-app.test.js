import test from 'node:test';
import assert from 'node:assert/strict';

test('cloud app opens the verified project and queues edits without overwriting browser-local data',async()=>{
  const handlers={};const app={innerHTML:'',addEventListener:(type,fn)=>(handlers[type]??=[]).push(fn)};
  const toast={classList:{add(){},remove(){}}};const dialog={open:false,addEventListener(){}};
  const elements={'#app':app,'#dialog':dialog,'#dialog-content':{},'#toast':toast};
  globalThis.document={querySelector:s=>elements[s]};
  const queued=[];
  const initialProject={version:1,project:{name:'Cloud home',target:10000,reserve:0,savings:0,currency:'MYR'},costs:[{id:'a',name:'Floor',category:'Renovation',room:'Kitchen',phase:'1',status:'estimated',amount:1000}],payments:[],quotes:[],tasks:[],receipts:[],sellerCodes:[],paymentCorrections:[]};
  globalThis.window={scrollTo(){},addEventListener(){},renovationCloud:{mode:'cloud',initialProject,status:{state:'ready'},session:{stage:x=>queued.push(structuredClone(x)),hasDraft:()=>false},identity:{}}};
  globalThis.localStorage={getItem(){throw Error('Cloud app must not read the old browser project')},setItem(){throw Error('Cloud app must use the sync session')}};
  await import('../public/app.js');assert.match(app.innerHTML,/Cloud home/);assert.match(app.innerHTML,/Cloud ready/);assert.equal(queued.length,0);
  const emit=(kind,event)=>handlers[kind].forEach(fn=>fn(event));
  emit('click',{target:{closest:s=>s==='[data-nav]'?{dataset:{nav:'budget'}}:null}});
  emit('click',{target:{closest:s=>s==='[data-inline-field]'?{dataset:{inlineField:'amount',id:'a'}}:null}});
  const form={dataset:{inlineForm:'amount',id:'a'},elements:{namedItem:()=>({value:'20.00'})},querySelector:()=>({textContent:''}),contains:()=>false};
  emit('focusout',{relatedTarget:null,target:{closest:s=>s==='[data-inline-form]'?form:null}});
  assert.equal(queued.length,1);assert.equal(queued[0].costs[0].amount,2000);assert.equal(queued[0].costs[0].amountHistory[0].previous,1000);
});
