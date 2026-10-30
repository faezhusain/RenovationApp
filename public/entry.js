import {createCloudSession} from './cloud-session.js';
import {prepareMigration} from './migration.js';

const container=document.querySelector('#app');
const local=['localhost','127.0.0.1','::1','[::1]'].includes(window.location.hostname);
const goApp=async()=>{const path='/app.js';await import(path);};
const escapeText=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function screen(title,description,body){container.innerHTML=`<main class="cloud-screen"><section class="card cloud-card"><div class="eyebrow">Renovation Companion</div><h1>${title}</h1><p class="muted">${description}</p>${body}<p class="error" role="alert" id="cloud-error"></p></section></main>`;}
function showError(message){const el=document.querySelector('#cloud-error');if(el)el.textContent=message;}
function downloadDraft(project){const url=URL.createObjectURL(new Blob([JSON.stringify(project,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='renovation-unsynced-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}

async function runCloud(identity){
  let callback;
  try{callback=await identity.handleAuthCallback();if(callback)history.replaceState(null,'',location.pathname+location.search);}catch{screen('Unable to complete sign-in','Please request a fresh link or try signing in again.','<button class="button" id="cloud-reload">Try again</button>');document.querySelector('#cloud-reload').onclick=()=>location.reload();return;}
  if(callback?.type==='invite'&&callback.token){
    const inviteToken=callback.token;
    screen('Set your password','Create a password to finish accepting your invitation.','<form id="cloud-invite"><label>Password<input type="password" name="password" minlength="8" autocomplete="new-password" required></label><button class="button">Set password</button></form>');
    document.querySelector('#cloud-invite').onsubmit=async e=>{e.preventDefault();const password=e.target.elements.password;try{await identity.acceptInvite(inviteToken,password.value);password.value='';await loadSession(identity);}catch{password.value='';showError('Could not accept the invitation. Try a fresh invitation.');}};return;
  }
  if(callback?.type==='recovery'){
    screen('Set a new password','Choose a new password for your account.','<form id="cloud-recover"><label>New password<input type="password" name="password" minlength="8" autocomplete="new-password" required></label><button class="button">Update password</button></form>');
    document.querySelector('#cloud-recover').onsubmit=async e=>{e.preventDefault();const password=e.target.elements.password;try{await identity.updateUser({password:password.value});password.value='';await loadSession(identity);}catch{password.value='';showError('Could not update the password. Try again.');}};return;
  }
  let user;try{user=await identity.getUser();}catch{screen('Sign-in unavailable','Please check your connection and try again.','<button class="button" id="cloud-reload">Try again</button>');document.querySelector('#cloud-reload').onclick=()=>location.reload();return;}
  if(user){await loadSession(identity,user);return;}
  screen('Sign in','Use the account invited to this private renovation project.','<form id="cloud-login"><label>Email<input name="email" type="email" autocomplete="username" required></label><label>Password<input name="password" type="password" autocomplete="current-password" required></label><button class="button">Sign in</button></form>');
  document.querySelector('#cloud-login').onsubmit=async e=>{e.preventDefault();const {email,password}=e.target.elements;try{const loggedIn=await identity.login(email.value,password.value);password.value='';await loadSession(identity,loggedIn);}catch{password.value='';showError('Sign-in failed. Check your details and try again.');}};
}
async function loadSession(identity,user){
  try{user=user||await identity.getUser();if(!user?.id)throw Error('No user');}catch{screen('Sign-in unavailable','Please sign in again.','<button class="button" id="cloud-reload">Try again</button>');document.querySelector('#cloud-reload').onclick=()=>location.reload();return;}
  screen('Opening your project','Checking your saved project and any unsent edits.','');
  const cloud={mode:'cloud',email:user.email||'',identity,status:{state:'loading'},initialProject:null,session:null};
  const session=createCloudSession({userId:user.id,storage:localStorage,fetcher:fetch,onStatus:status=>{cloud.status=status;const el=document.querySelector('#storage-status');if(el)el.textContent=cloudStatus(status);}});cloud.session=session;
  let loaded;
  try{loaded=await session.load();}catch{screen('Couldn’t open your project','Your existing data has not been changed. Check your connection and try again.','<button class="button" id="cloud-reload">Try again</button>');document.querySelector('#cloud-reload').onclick=()=>location.reload();return;}
  const launch=async project=>{cloud.initialProject=project;window.renovationCloud=cloud;await goApp();};
  if(!loaded.drafts.length){
    const legacy=localStorage.getItem('renovation-companion-v1');
    if(!legacy){await launch(loaded.remote);return;}
    let prior;
    try{prior=prepareMigration(legacy,!!loaded.remote).project;}catch{
      screen('Existing browser data found','The older browser data could not be read. It has not been removed.','<button class="button" id="cloud-open">Open cloud project</button>');
      document.querySelector('#cloud-open').onclick=()=>launch(loaded.remote);return;
    }
    screen('Existing browser project found',`Your previous browser project, ${escapeText(prior.project.name)}, is still stored here. Download a backup before choosing what to use.`,`<button class="button light" id="cloud-download-old">Download browser backup</button> ${loaded.remote?'':'<button class="button" id="cloud-use-old">Use browser project in cloud</button>'} <button class="button light" id="cloud-open">Open cloud project</button>`);
    document.querySelector('#cloud-download-old').onclick=()=>downloadDraft(prior);
    const useOld=document.querySelector('#cloud-use-old');if(useOld)useOld.onclick=async()=>{if(!confirm('Copy this browser project into your new cloud account?'))return;try{session.stage(prior);await launch(prior);}catch{showError('Could not queue this project. Download a backup and try again.');}};
    document.querySelector('#cloud-open').onclick=()=>launch(loaded.remote);return;
  }
  const list=loaded.drafts.map((draft,i)=>`<div class="list-row"><span>Unsent draft ${i+1}: ${escapeText(draft.project.project.name)}</span><button class="button light sm" data-download-draft="${i}">Download backup</button></div>`).join('');
  screen('Unsent changes found','Download a backup before resolving these edits. Your cloud project has not been replaced.',`${list}${loaded.canResume?'<button class="button" id="cloud-resume">Resume unsent changes</button>':''}<button class="button light" id="cloud-discard">Discard drafts and open cloud project</button>`);
  container.querySelectorAll('[data-download-draft]').forEach(el=>{el.onclick=()=>downloadDraft(loaded.drafts[Number(el.dataset.downloadDraft)].project);});
  const resume=document.querySelector('#cloud-resume');if(resume)resume.onclick=async()=>{try{session.resume(loaded.drafts[0]);await launch(loaded.drafts[0].project);}catch{showError('Could not resume the saved draft. Download a backup and try again.');}};
  document.querySelector('#cloud-discard').onclick=async()=>{if(!confirm('Discard the unsent drafts in this browser? Download any backup you need first.'))return;for(const draft of loaded.drafts)session.discardDraft(draft.key);await launch(loaded.remote);};
}
function cloudStatus(status){return status.state==='error'&&/^\d{3}$/.test(status.detail||'')?`Sync failed (HTTP ${status.detail}) · retry or export backup`:({loading:'Opening cloud project',ready:'Cloud ready',saving:'Saving to cloud…',saved:'Saved to cloud',offline:'Offline · changes not synced',conflict:'Conflict · export backup and reload',error:'Sync failed · retry or export backup'})[status.state]||'Cloud status unavailable';}
if(local)await goApp();else{
  try{const path='/identity-bundle.js';await runCloud(await import(path));}
  catch{screen('Cloud sign-in unavailable','Your project was not opened or changed. Please try again later.','<button class="button" id="cloud-reload">Try again</button>');document.querySelector('#cloud-reload').onclick=()=>location.reload();}
}
