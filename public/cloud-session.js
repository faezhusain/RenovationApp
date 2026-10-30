import {createVersionedSync} from './cloud-sync.js';
import {prepareMigration} from './migration.js';

// One durable draft per signed-in account. It is removed only after the
// service acknowledges the most recent save, or after explicit discard.
export function createCloudSession({userId,storage,fetcher,onStatus=()=>{},clientId=crypto.randomUUID()}){
  if(!userId)throw Error('Signed-in identity is required');
  const prefix=`renovation-cloud-draft-v1:${encodeURIComponent(userId)}:`;
  const key=prefix+clientId;
  let status={state:'loading'}, sync;
  const emit=next=>{status=next;if(next.state==='saved')storage.removeItem(key);onStatus(next);};
  sync=createVersionedSync({fetcher,onStatus:emit});
  function readDrafts(){
    const result=[];
    for(let i=0;i<storage.length;i++){
      const draftKey=storage.key(i);if(!draftKey?.startsWith(prefix))continue;
      const draft=JSON.parse(storage.getItem(draftKey));
      if(!draft||typeof draft!=='object'||!('baseVersion' in draft))throw Error('Saved draft could not be read.');
      prepareMigration(JSON.stringify(draft.project),false);result.push({...draft,key:draftKey});
    }
    return result;
  }
  async function load(){
    const drafts=readDrafts();
    const remote=await sync.load();
    if(remote)prepareMigration(JSON.stringify(remote),true);
    return {remote,drafts,canResume:drafts.length===1&&drafts[0].baseVersion===sync.getVersion()};
  }
  function stage(project){
    const text=JSON.stringify(project);prepareMigration(text,false);
    storage.setItem(key,JSON.stringify({baseVersion:sync.getVersion(),project}));
    sync.enqueue(project);
  }
  function resume(draft){if(!draft.key?.startsWith(prefix))throw Error('Invalid draft');stage(draft.project);if(draft.key!==key)storage.removeItem(draft.key);}
  function discardDraft(draftKey){if(!draftKey?.startsWith(prefix))throw Error('Invalid draft');storage.removeItem(draftKey);}
  function hasDraft(){return storage.getItem(key)!==null;}
  return {load,stage,resume,discardDraft,hasDraft,retry:sync.retry,getStatus:()=>status};
}
