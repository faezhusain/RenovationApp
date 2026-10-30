import test from 'node:test';
import assert from 'node:assert/strict';
import {createNetlifyProjectHandler} from '../server/netlify-adapter.js';

test('adapter does not access storage when the visitor is not authenticated',async()=>{
  let stores=0;
  const handler=createNetlifyProjectHandler({identity:{getUser:async()=>null,verifyRequestOrigin(){}},blobs:{getStore(){stores++;return {};}}});
  const r=await handler(new Request('https://example.netlify.app/api/project'));
  assert.equal(r.status,401);assert.equal(stores,0);
});
test('adapter uses a strongly consistent store and checks origin on writes',async()=>{
  let opts,checked=false;
  const handler=createNetlifyProjectHandler({identity:{getUser:async()=>({id:'owner'}),verifyRequestOrigin(){checked=true;}},blobs:{getStore(options){opts=options;return {setJSON:async()=>({modified:true,etag:'"v1"'})};}}});
  const body={version:1,project:{name:'Test'},costs:[],payments:[],quotes:[],tasks:[],receipts:[],sellerCodes:[],paymentCorrections:[]};
  const request=new Request('https://example.netlify.app/api/project',{method:'PUT',headers:{'content-type':'application/json','if-none-match':'*'},body:JSON.stringify(body)});
  assert.equal((await handler(request)).status,204);assert.deepEqual(opts,{name:'renovation-projects',consistency:'strong'});assert.equal(checked,true);
});
