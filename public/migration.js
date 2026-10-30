import {withNewSections,validNewSections} from './records.js';

const MAX_PROJECT_BYTES=4*1024*1024;
const amount=x=>Number.isSafeInteger(x)&&x>=0;
// Preparing a migration is read-only. The caller must still obtain explicit
// confirmation and must never overwrite an existing cloud project silently.
export function prepareMigration(text,cloudHasProject){
  if(typeof cloudHasProject!=='boolean')throw Error('Cloud project status must be checked before migration.');
  if(typeof text!=='string'||new TextEncoder().encode(text).length>MAX_PROJECT_BYTES)throw Error('Backup is too large to import.');
  let parsed;try{parsed=JSON.parse(text);}catch{throw Error('Backup is not valid JSON.');}
  if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))throw Error('Backup is not a project.');
  const p=withNewSections(parsed);
  if(p.version!==1||!p.project||typeof p.project.name!=='string'||!['target','reserve','savings'].every(k=>amount(p.project[k]))||p.project.reserve>p.project.target||
    !['costs','payments','quotes','tasks'].every(k=>Array.isArray(p[k])))throw Error('Backup has invalid project details.');
  const ids=new Set();
  if(!p.costs.every(c=>c&&typeof c.id==='string'&&c.id&&!ids.has(c.id)&&ids.add(c.id)&&typeof c.name==='string'&&typeof c.category==='string'&&['estimated','agreed'].includes(c.status)&&amount(c.amount)))throw Error('Backup has invalid cost records.');
  if(!p.payments.every(x=>x&&ids.has(x.costId)&&['payment','refund'].includes(x.type)&&Number.isSafeInteger(x.amount)&&x.amount>0&&typeof x.date==='string'))throw Error('Backup has invalid payments.');
  if(!p.quotes.every(x=>x&&ids.has(x.costId)&&typeof x.supplier==='string'&&amount(x.amount)))throw Error('Backup has invalid quotations.');
  if(!p.tasks.every(x=>x&&typeof x.title==='string'&&typeof x.stage==='string'&&typeof x.importance==='string'&&['Not started','Doing','Done','Skip'].includes(x.status)))throw Error('Backup has invalid tasks.');
  if(!validNewSections(p))throw Error('Backup has invalid receipts, contacts or corrections.');
  return {project:p,cloudHasProject:Boolean(cloudHasProject),summary:{name:p.project.name,costs:p.costs.length,payments:p.payments.length,receipts:p.receipts.length,tasks:p.tasks.length}};
}
