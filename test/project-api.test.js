import test from 'node:test';
import assert from 'node:assert/strict';
import {createProjectHandler} from '../server/project-api.js';

const project=name=>({version:1,project:{name,target:0,reserve:0,savings:0},costs:[],payments:[],quotes:[],tasks:[],receipts:[],sellerCodes:[],paymentCorrections:[]});
function fixture(){
  const data=new Map();let version=0,user={id:'owner'};
  const store={async getWithMetadata(key){return data.get(key)||null;},async setJSON(key,value,options){const existing=data.get(key);if(options.onlyIfNew&&existing||options.onlyIfMatch&&existing?.etag!==options.onlyIfMatch)return {modified:false};const etag=`"${++version}"`;data.set(key,{data:value,etag});return {modified:true,etag};}};
  const handler=createProjectHandler({getUser:async()=>user,verifyOrigin:async req=>{if(req.headers.get('origin')!=='https://app.example')throw Error('origin');},getStore:()=>store});
  return {handler,setUser:x=>user=x};
}
const request=(method,body,version)=>new Request('https://app.example/api/project',{method,headers:{origin:'https://app.example',...(body?{'content-type':'application/json'}:{}),...(version?version:{})},...(body?{body:JSON.stringify(body)}:{})});

test('authentication and user isolation prevent access to another project',async()=>{
  const f=fixture();f.setUser(null);assert.equal((await f.handler(request('GET'))).status,401);
  f.setUser({id:'owner'});assert.equal((await f.handler(request('PUT',project('Private'),{'x-project-version':'new'}))).status,204);
  f.setUser({id:'other'});assert.equal((await f.handler(request('GET'))).status,404);
  assert.equal((await f.handler(request('PUT',project('Other'),{'x-project-version':'new'}))).status,204);
  f.setUser({id:'owner'});const r=await f.handler(request('GET'));assert.equal((await r.json()).project.name,'Private');assert.equal(r.headers.get('cache-control'),'no-store');
});
test('conditional writes stop stale edits from replacing newer work',async()=>{
  const {handler}=fixture();const first=await handler(request('PUT',project('Initial'),{'x-project-version':'new'}));const old=first.headers.get('x-project-version');
  const second=await handler(request('PUT',project('Phone'),{'x-project-version':old}));assert.equal(second.status,204);
  assert.equal((await handler(request('PUT',project('Computer'),{'x-project-version':old}))).status,409);
  assert.equal((await handler(request('PUT',project('Duplicate'),{'x-project-version':'new'}))).status,409);
  assert.equal((await (await handler(request('GET'))).json()).project.name,'Phone');
});
test('write requests require an allowed origin, valid project and version precondition',async()=>{
  const {handler}=fixture();assert.equal((await handler(request('PUT',project('No version')))).status,428);
  const badOrigin=new Request('https://app.example/api/project',{method:'PUT',headers:{origin:'https://evil.example','x-project-version':'new','content-type':'application/json'},body:JSON.stringify(project('Bad'))});
  assert.equal((await handler(badOrigin)).status,403);
  assert.equal((await handler(request('PUT',{version:1},{'x-project-version':'new'}))).status,400);
  assert.equal((await handler(new Request('https://app.example/api/project',{method:'POST'}))).status,405);
});
