// Standalone sync protocol. It is not wired to the UI until identity and the
// production service have been integrated and tested.
export function createVersionedSync({fetcher, onStatus=()=>{}}) {
  let etag=null, loaded=false, inFlight=false, active=null, pending=null, stopped=false, conflict=false;
  const status=(state,detail='')=>onStatus({state,detail});
  async function load(){
    if(inFlight||pending)throw Error('Cannot load while unsynced changes exist');
    status('loading');
    let response;
    try{response=await fetcher('/api/project',{method:'GET',credentials:'same-origin',cache:'no-store'});}catch{status('offline');throw Error('Could not connect');}
    if(response.status===404){etag=null;loaded=true;status('ready');return null;}
    if(!response.ok){status('error',String(response.status));throw Error('Could not load project');}
    const value=await response.json(), version=response.headers.get('etag');
    if(!version){status('error','Missing version');throw Error('Project version is missing');}
    etag=version;loaded=true;status('ready');return value;
  }
  async function flush(){
    if(!loaded||inFlight||stopped||!pending)return;
    inFlight=true;const sent=pending;active=sent;pending=null;status('saving');
    try{
      const headers={'Content-Type':'application/json','X-Project-Version':etag||'new'};
      const response=await fetcher('/api/project',{method:'PUT',credentials:'same-origin',headers,body:sent});
      if(response.status===409){pending=pending||sent;stopped=true;conflict=true;status('conflict');return;}
      if(!response.ok){pending=pending||sent;stopped=true;status('error',String(response.status));return;}
      const next=response.headers.get('etag');
      if(!next){pending=pending||sent;stopped=true;status('error','Missing version');return;}
      etag=next;
      if(!pending)status('saved');
    }catch{pending=pending||sent;stopped=true;status('offline');}
    finally{active=null;inFlight=false;if(pending&&!stopped)void flush();}
  }
  function enqueue(snapshot){
    if(!loaded)throw Error('Load the cloud project before saving');
    pending=JSON.stringify(snapshot);
    if(!stopped)void flush();
  }
  function retry(){if(!conflict){stopped=false;void flush();}}
  function pendingData(){const data=pending||active;return data?JSON.parse(data):null;}
  function getVersion(){return etag;}
  return {load,enqueue,retry,pendingData,getVersion};
}
