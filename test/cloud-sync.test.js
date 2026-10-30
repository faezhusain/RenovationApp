import test from 'node:test';
import assert from 'node:assert/strict';
import {createVersionedSync} from '../public/cloud-sync.js';

const tick=()=>new Promise(resolve=>setTimeout(resolve,0));
test('coalesces edits while a save is in flight and uses the returned version',async()=>{
  const calls=[];let resolveFirst;
  const fetcher=async(url,request)=>{calls.push(request);if(request.method==='GET')return new Response(null,{status:404});if(calls.length===2)return new Promise(resolve=>{resolveFirst=resolve});return new Response(null,{status:204,headers:{etag:'"2"'}});};
  const states=[];const sync=createVersionedSync({fetcher,onStatus:x=>states.push(x.state)});
  assert.equal(await sync.load(),null);sync.enqueue({revision:1});assert.deepEqual(sync.pendingData(),{revision:1});sync.enqueue({revision:2});sync.enqueue({revision:3});assert.deepEqual(sync.pendingData(),{revision:3});
  resolveFirst(new Response(null,{status:204,headers:{etag:'"1"'}}));await tick();await tick();
  assert.equal(calls.length,3);assert.equal(calls[1].headers['If-None-Match'],'*');assert.equal(calls[2].headers['If-Match'],'"1"');assert.deepEqual(JSON.parse(calls[2].body),{revision:3});assert.equal(states.at(-1),'saved');
});
test('retains the newest unsynced edits on conflict and never overwrites on retry',async()=>{
  let puts=0;const fetcher=async(url,r)=>{if(r.method==='GET')return new Response('{"version":1}',{headers:{etag:'"old"'}});puts++;return new Response(null,{status:409});};
  const states=[];const sync=createVersionedSync({fetcher,onStatus:x=>states.push(x.state)});await sync.load();sync.enqueue({revision:1});await tick();sync.enqueue({revision:2});sync.retry();await tick();
  assert.equal(puts,1);assert.deepEqual(sync.pendingData(),{revision:2});assert.equal(states.at(-1),'conflict');
});
test('retains failed saves for retry after a network error',async()=>{
  let attempts=0;const fetcher=async(url,r)=>{if(r.method==='GET')return new Response(null,{status:404});if(++attempts===1)throw Error('offline');return new Response(null,{status:204,headers:{etag:'"saved"'}});};
  const states=[];const sync=createVersionedSync({fetcher,onStatus:x=>states.push(x.state)});await sync.load();sync.enqueue({revision:1});await tick();assert.equal(states.at(-1),'offline');assert.deepEqual(sync.pendingData(),{revision:1});sync.retry();await tick();assert.equal(attempts,2);assert.equal(states.at(-1),'saved');
});
