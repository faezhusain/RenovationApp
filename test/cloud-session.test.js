import test from 'node:test';
import assert from 'node:assert/strict';
import {createCloudSession} from '../public/cloud-session.js';

const example=name=>({version:1,project:{name,target:100,reserve:0,savings:0},costs:[],payments:[],quotes:[],tasks:[],receipts:[],sellerCodes:[],paymentCorrections:[]});
const storage=()=>{const data=new Map();return {get length(){return data.size;},key:i=>[...data.keys()][i]??null,getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};};
const tick=()=>new Promise(r=>setTimeout(r,0));
test('a failed write leaves a durable user-scoped draft and reports a stale cloud version on restart',async()=>{
  const local=storage();let online=true;
  const fetcher=async(url,r)=>{if(r.method==='GET')return online?new Response(JSON.stringify(example('Cloud')),{headers:{'x-project-version':'"cloud"'}}):new Response(JSON.stringify(example('Changed')),{headers:{'x-project-version':'"new"'}});throw Error('offline');};
  const first=createCloudSession({userId:'alice',storage:local,fetcher});await first.load();first.stage(example('Local edit'));await tick();assert.equal(first.hasDraft(),true);
  online=false;const restarted=createCloudSession({userId:'alice',storage:local,fetcher});const result=await restarted.load();assert.equal(result.drafts[0].project.project.name,'Local edit');assert.equal(result.canResume,false);assert.equal(result.remote.project.name,'Changed');
  const other=createCloudSession({userId:'bob',storage:local,fetcher});assert.deepEqual((await other.load()).drafts,[]);
});
test('acknowledged writes clear the draft and unchanged remote versions can safely resume',async()=>{
  const local=storage();let fail=true;
  const fetcher=async(url,r)=>{if(r.method==='GET')return new Response(null,{status:404});if(fail)throw Error('offline');return new Response(null,{status:204,headers:{'x-project-version':'"created"'}});};
  const first=createCloudSession({userId:'alice',storage:local,fetcher});await first.load();first.stage(example('Draft'));await tick();
  const restarted=createCloudSession({userId:'alice',storage:local,fetcher});const {drafts,canResume}=await restarted.load();assert.equal(canResume,true);fail=false;restarted.resume(drafts[0]);await tick();assert.equal(restarted.hasDraft(),false);
});
test('separate tabs retain separate drafts so one cannot erase the other',async()=>{
  const local=storage(),fetcher=async(url,r)=>r.method==='GET'?new Response(null,{status:404}):Promise.reject(Error('offline'));
  const one=createCloudSession({userId:'alice',clientId:'tab1',storage:local,fetcher});const two=createCloudSession({userId:'alice',clientId:'tab2',storage:local,fetcher});
  await one.load();await two.load();one.stage(example('First'));two.stage(example('Second'));await tick();
  const third=createCloudSession({userId:'alice',clientId:'tab3',storage:local,fetcher});const result=await third.load();
  assert.equal(result.drafts.length,2);assert.equal(result.canResume,false);
  assert.deepEqual(result.drafts.map(x=>x.project.project.name).sort(),['First','Second']);
});
