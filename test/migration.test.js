import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareMigration} from '../public/migration.js';

const backup=()=>({version:1,project:{name:'Example',target:100000,reserve:10000,savings:50000},costs:[{id:'a',name:'Floor',category:'Renovation',status:'estimated',amount:1000}],payments:[{costId:'a',type:'payment',amount:100,date:''}],quotes:[],tasks:[]});
test('prepares an older local backup without writing or discarding its records',()=>{
  const original=backup(),result=prepareMigration(JSON.stringify(original),false);
  assert.equal(result.project.costs[0].amount,1000);assert.equal(result.project.payments[0].amount,100);assert.deepEqual(result.project.receipts,[]);assert.equal(result.summary.costs,1);assert.equal(result.cloudHasProject,false);
});
test('marks an existing cloud project for review and does not merge or overwrite it',()=>{
  const result=prepareMigration(JSON.stringify(backup()),true);assert.equal(result.cloudHasProject,true);assert.equal(result.project.project.name,'Example');
});
test('rejects malformed, oversized, duplicate and orphaned financial records',()=>{
  assert.throws(()=>prepareMigration('{',false),/JSON/);
  assert.throws(()=>prepareMigration(JSON.stringify(backup()),undefined),/status/);
  assert.throws(()=>prepareMigration('x'.repeat(4*1024*1024+1),false),/too large/);
  const duplicate=backup();duplicate.costs.push({...duplicate.costs[0]});assert.throws(()=>prepareMigration(JSON.stringify(duplicate),false),/cost/);
  const orphan=backup();orphan.payments[0].costId='missing';assert.throws(()=>prepareMigration(JSON.stringify(orphan),false),/payment/);
});
