import test from 'node:test';
import assert from 'node:assert/strict';
import { totals, progress, parseMoney } from '../public/calculations.js';

test('reconciles reference values and keeps savings outside payment calculations', () => {
  const s = { project: { target: 15000000, reserve: 450000, savings: 300000 }, costs: [{ id:'a', status:'agreed', amount:11080000 }], payments: [{costId:'a', amount:10790000, type:'payment'}] };
  const t = totals(s);
  assert.equal(t.outstanding, 290000); assert.equal(t.unallocated, 3470000); assert.equal(Math.round(t.agreed / t.target * 100), 74); assert.equal(s.project.savings, 300000);
});
test('refunds increase the balance and overpayments do not offset another cost', () => {
  const s = { project:{target:0,reserve:0}, costs:[{id:'a',status:'agreed',amount:1000},{id:'b',status:'agreed',amount:5000}], payments:[{costId:'a',type:'payment',amount:1200},{costId:'a',type:'refund',amount:100}] };
  const t=totals(s); assert.equal(t.paid,1100); assert.equal(t.outstanding,5000); assert.equal(t.overpaid,100);
});
test('estimates and accepted costs appear once in forecast', () => {
  const s={project:{target:20000,reserve:1000},costs:[{id:'a',status:'estimated',amount:3000},{id:'b',status:'agreed',amount:5000}],payments:[]};
  const t=totals(s); assert.equal(t.agreed,5000); assert.equal(t.forecast,8000); assert.equal(t.forecastHeadroom,11000);
});
test('skipped and archived tasks do not count in progress', () => {
  const p=progress([{status:'Done'},{status:'Doing'},{status:'Skip'},{status:'Done',archived:true}]); assert.deepEqual(p,{done:1,total:2,remaining:1,percent:50}); assert.equal(progress([]).percent,null);
});
test('money parser rejects rounding and negative inputs', () => { assert.equal(parseMoney('12.3'),1230); assert.equal(parseMoney('0.01'),1); assert.equal(parseMoney('1.001'),null); assert.equal(parseMoney('-1'),null); });
test('paid-total corrections affect net paid and balances without changing payment records', () => {
  const s={project:{target:10000,reserve:0},costs:[{id:'a',status:'agreed',amount:10000}],payments:[{id:'p',costId:'a',type:'payment',amount:4000}],paymentCorrections:[{costId:'a',amount:-1000}]};
  const t=totals(s);assert.equal(t.paid,3000);assert.equal(t.outstanding,7000);assert.equal(s.payments[0].amount,4000);
});
test('deleted payments exclude dependent refunds and deleted corrections until restored',()=>{
  const s={project:{target:0,reserve:0},costs:[{id:'a',status:'agreed',amount:10000}],payments:[{id:'p',costId:'a',type:'payment',amount:4000},{id:'r',costId:'a',type:'refund',originalId:'p',amount:1000}],paymentCorrections:[{id:'c',costId:'a',amount:500}]};
  assert.equal(totals(s).paid,3500);s.payments[0].voided=true;assert.equal(totals(s).paid,500);s.paymentCorrections[0].voided=true;assert.equal(totals(s).paid,0);
  s.payments[0].voided=false;assert.equal(totals(s).paid,3000);s.payments[1].voided=true;assert.equal(totals(s).paid,4000);s.paymentCorrections[0].voided=false;assert.equal(totals(s).paid,4500);
});
