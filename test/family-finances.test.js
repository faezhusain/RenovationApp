import test from 'node:test';
import assert from 'node:assert/strict';
import {familySummary,validFamilyEntries,validFamilyTypes,prepareFamilyImport} from '../public/family-finances.js';
import {prepareMigration} from '../public/migration.js';

const row=(id,person,kind,amount)=>({id,person,kind,name:id,amount,due:'',notes:''});
test('family plans distinguish available money, expected income, outflows and potential refunds',()=>{
  const entries=[row('cash','Daddy','available',10000),row('bonus','Daddy','expected',3000),row('cost','Daddy','expense',4000),row('deposit','Daddy','refundable',2000),row('other','Mummy','expense',9000),{...row('deleted','Daddy','expense',8000),voided:true}];
  assert.deepEqual(familySummary(entries,'Daddy'),{available:10000,expected:3000,renovation:0,expenses:4000,deposits:2000,projected:7000,ifReturned:9000});
});
test('shared costs are a separate reference and odd cents are allocated exactly',()=>{
  const entries=[row('shared','Shared','shared',101),row('reference','Shared','reference',900),row('own','Mummy','expense',30)];
  assert.deepEqual(familySummary(entries,'Shared'),{shared:101,daddy:50,mummy:51});assert.equal(familySummary(entries,'Mummy').projected,-30);
});
test('family import is additive, repeatable and validates input',()=>{
  const entry=row('same','Daddy','available',1000),newEntry=row('new','Mummy','expected',2500);
  const plan=JSON.stringify({format:'renovation-family-finances-v1',entries:[entry,newEntry]});
  assert.deepEqual(prepareFamilyImport(plan,[{...entry,amount:1500}]),{added:[newEntry],skipped:1});
  assert.throws(()=>prepareFamilyImport(JSON.stringify({format:'renovation-family-finances-v1',entries:[entry,entry]}),[]));
  assert.equal(validFamilyEntries([row('bad','Shared','expense',100)]),false);assert.equal(validFamilyEntries([row('bad','Daddy','expense',-1)]),false);
});
test('old backups gain an empty family section and new family data survives validation',()=>{
  const old={version:1,project:{name:'Example',target:0,reserve:0,savings:0},costs:[],payments:[],quotes:[],tasks:[]};
  assert.deepEqual(prepareMigration(JSON.stringify(old),false).project.familyFinances,[]);
  const rowData=row('entry','Daddy','available',1000);const restored=prepareMigration(JSON.stringify({...old,familyFinances:[rowData]}),true).project;
  assert.deepEqual(restored.familyFinances,[rowData]);assert.throws(()=>prepareMigration(JSON.stringify({...old,familyFinances:[{...rowData,amount:-1}]}),true));
});
test('custom types survive backups and follow their selected incoming or outgoing section',()=>{
  const incoming={...row('savings','Daddy','available',10000),customType:'Gift'},outgoing={...row('moving','Daddy','expense',2500),customType:'Transport'};
  const familyTypes=[{name:'Gift',section:'incoming'},{name:'Transport',section:'outgoing'}];
  assert.equal(validFamilyEntries([incoming,outgoing]),true);assert.equal(validFamilyTypes(familyTypes),true);
  assert.equal(familySummary([incoming,outgoing],'Daddy').projected,7500);
  assert.equal(validFamilyEntries([{...incoming,kind:'refundable'}]),false);assert.equal(validFamilyTypes([...familyTypes,{name:'gift',section:'incoming'}]),false);
  const old={version:1,project:{name:'Example',target:0,reserve:0,savings:0},costs:[],payments:[],quotes:[],tasks:[]};
  const restored=prepareMigration(JSON.stringify({...old,familyFinances:[incoming,outgoing],familyTypes}),false).project;
  assert.deepEqual(restored.familyTypes,familyTypes);assert.deepEqual(restored.familyFinances,[incoming,outgoing]);
});
