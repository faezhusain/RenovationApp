import test from 'node:test';
import assert from 'node:assert/strict';

test('code-only app starts without a private workbook and opens budget', async () => {
  const handlers={};
  const app={innerHTML:'',addEventListener:(type,fn)=>(handlers[type]??=[]).push(fn)};
  const dialog={open:false,addEventListener(){}};
  const toast={classList:{add(){},remove(){}}};
  const elements={'#app':app,'#dialog':dialog,'#dialog-content':{},'#toast':toast};
  globalThis.document={querySelector:selector=>elements[selector]};
  globalThis.window={scrollTo(){},addEventListener(){}};
  globalThis.localStorage={getItem:()=>null,setItem(){}};
  globalThis.fetch=()=>{throw new Error('The code-only app should not fetch private project data');};
  await import('../public/app.js');
  assert.match(app.innerHTML,/Your renovation/);
  for(const fn of handlers.click)fn({target:{closest:selector=>selector==='[data-nav]'?{dataset:{nav:'budget'}}:null}});
  assert.match(app.innerHTML,/Your renovation budget/);
  assert.match(app.innerHTML,/No costs yet/);
});
