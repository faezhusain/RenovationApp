export const FAMILY_PEOPLE=['Daddy','Mummy','Shared'];
export const FAMILY_KINDS={available:'Available funds',expected:'Expected income',renovation:'Renovation/Moving In',expense:'Other planned expense',refundable:'Refundable deposit',shared:'Shared expense',reference:'Reference only'};

export function validFamilyTypes(types){
  if(!Array.isArray(types)||types.length>500)return false;
  const seen=new Set();
  return types.every(t=>{
    if(!t||!['incoming','outgoing','shared'].includes(t.section)||typeof t.name!=='string'||!t.name.trim()||t.name!==t.name.trim()||t.name.length>80)return false;
    const key=`${t.section}:${t.name.toLocaleLowerCase()}`;if(seen.has(key))return false;seen.add(key);return true;
  });
}

export function validFamilyEntries(entries){
  if(!Array.isArray(entries)||entries.length>5000)return false;
  const ids=new Set();
  return entries.every(x=>{
    if(!x||typeof x.id!=='string'||!x.id||x.id.length>160||ids.has(x.id))return false;
    ids.add(x.id);
    const allowed=x.person==='Shared'?['shared','reference']:['available','expected','renovation','expense','refundable'];
    return FAMILY_PEOPLE.includes(x.person)&&allowed.includes(x.kind)&&typeof x.name==='string'&&x.name.trim().length>0&&x.name.length<=160&&
      Number.isSafeInteger(x.amount)&&x.amount>=0&&x.amount<=900000000000&&typeof x.due==='string'&&x.due.length<=100&&
      typeof x.notes==='string'&&x.notes.length<=500&&(x.voided===undefined||typeof x.voided==='boolean')&&
      (x.customType===undefined||(typeof x.customType==='string'&&x.customType===x.customType.trim()&&x.customType.length>0&&x.customType.length<=80&&['available','expense','shared'].includes(x.kind)));
  });
}

export function familySummary(entries,person){
  const rows=entries.filter(x=>!x.voided&&x.person===person);
  const sum=kind=>rows.filter(x=>x.kind===kind).reduce((n,x)=>n+x.amount,0);
  if(person==='Shared'){
    const shared=sum('shared'),daddy=Math.floor(shared/2);
    return {shared,daddy,mummy:shared-daddy};
  }
  const available=sum('available'),expected=sum('expected'),renovation=sum('renovation'),expenses=sum('expense'),deposits=sum('refundable');
  const projected=available+expected-renovation-expenses-deposits;
  return {available,expected,renovation,expenses,deposits,projected,ifReturned:projected+deposits};
}

// Import adds previously unseen records only; it never overwrites existing edits.
export function prepareFamilyImport(text,existing){
  if(typeof text!=='string'||new TextEncoder().encode(text).length>128*1024)throw Error('Finance plan file is too large.');
  let data;try{data=JSON.parse(text)}catch{throw Error('Finance plan file is not valid JSON.')}
  if(!data||data.format!=='renovation-family-finances-v1'||!validFamilyEntries(data.entries)||!validFamilyEntries(existing))throw Error('This is not a valid family finance plan.');
  const ids=new Set(existing.map(x=>x.id));
  const added=data.entries.filter(x=>!ids.has(x.id));
  if(existing.length+added.length>5000)throw Error('Too many finance entries.');
  return {added,skipped:data.entries.length-added.length};
}
