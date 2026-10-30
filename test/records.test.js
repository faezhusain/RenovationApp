import test from 'node:test';
import assert from 'node:assert/strict';
import { withNewSections, validNewSections, fileMatchesType, MAX_RECEIPT_BYTES } from '../public/records.js';

test('old projects gain empty sections without losing existing records', () => {
  const old = { costs: [{id:'c'}], payments: [], tasks: [{title:'Paint'}] };
  const migrated = withNewSections(old);
  assert.deepEqual(migrated.receipts, []); assert.deepEqual(migrated.sellerCodes, []);
  assert.deepEqual(migrated.tasks, old.tasks); assert.equal(validNewSections(migrated), true);
});
test('accepts linked receipt and rejects broken links and oversize files', () => {
  const project = {costs:[{id:'c'}],payments:[{id:'p',costId:'c'}],paymentCorrections:[],sellerCodes:[],receipts:[{id:'r',title:'Receipt',filename:'r.png',date:'2026-10-28',notes:'',type:'image/png',size:8,data:'iVBORw0KGgo=',costId:'c',paymentId:'p'}]};
  assert.equal(validNewSections(project), true);
  assert.equal(validNewSections({...project,receipts:[{...project.receipts[0],paymentId:'missing'}]}), false);
  assert.equal(validNewSections({...project,receipts:[{...project.receipts[0],size:MAX_RECEIPT_BYTES+1}]}), false);
});
test('seller contact or reference is retained in backups', () => {
  const p={costs:[],payments:[],paymentCorrections:[],receipts:[],sellerCodes:[{id:'s',seller:'Supplier',contact:'01234',code:'',notes:''}]};
  assert.equal(validNewSections(p),true);
  assert.equal(validNewSections({...p,sellerCodes:[{...p.sellerCodes[0],contact:''}]}),false);
});
test('validates paid corrections and rejects dangling or zero corrections', () => {
  const p=withNewSections({costs:[{id:'a'}],payments:[]});
  const correction={id:'c',costId:'a',amount:-100,createdAt:'2026-10-29T00:00:00.000Z'};
  assert.equal(validNewSections({...p,paymentCorrections:[correction]}),true);
  assert.equal(validNewSections({...p,paymentCorrections:[{...correction,costId:'missing'}]}),false);
  assert.equal(validNewSections({...p,paymentCorrections:[{...correction,amount:0}]}),false);
});
test('checks signatures against selected document types', () => {
  assert.equal(fileMatchesType('image/png', Uint8Array.from([137,80,78,71,13,10,26,10])),true);
  assert.equal(fileMatchesType('image/jpeg', Uint8Array.from([255,216,255,1])),true);
  assert.equal(fileMatchesType('application/pdf', Uint8Array.from([37,80,68,70,45])),true);
  assert.equal(fileMatchesType('image/png', Uint8Array.from([37,80,68,70,45])),false);
});
