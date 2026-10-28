'use strict';
// ===== Dropbox two-way sync (OAuth2 PKCE, app folder, /heymurph-data.json) =====
(function(){
const SK='heymurph.sync.v1',FILE='/heymurph-data.json',KEYS=['heymurph.v1','heymurph.habits.v1','heymurph.journal.v1','heymurph.meta.v1','heymurph.flow.v1'];
const C=SyncCore,key=typeof DROPBOX_APP_KEY==='string'?DROPBOX_APP_KEY.trim():'',REDIR=typeof DROPBOX_REDIRECT_URI==='string'?DROPBOX_REDIRECT_URI:location.origin+location.pathname;
let S;try{S=JSON.parse(localStorage.getItem(SK))||{}}catch(e){S={}}S.sh=S.sh||{};S.tomb=S.tomb||{items:{},journal:{}};S.tomb.flow=S.tomb.flow||{};
const rawSet=Storage.prototype.setItem;let quiet=false,timer=null,busy=false,again=false,state='idle',errMsg='';
const PK='heymurph.sync.pending',pend=v=>{try{v?rawSet.call(localStorage,PK,String(Date.now())):localStorage.removeItem(PK)}catch(e){}},isPend=()=>!!localStorage.getItem(PK);let retryMs=0;
const ssave=()=>rawSet.call(localStorage,SK,JSON.stringify(S));
// --- stamp local changes (lazy migration: adds updatedAt, records tombstones)
function stamp(){if(window.__hmReset)return;const now=Date.now();
 const a=C.stampList(items,S.sh.items||{},S.tomb.items,now);S.sh.items=a.shadow;
 const b=C.stampList(J,S.sh.journal||{},S.tomb.journal,now);S.sh.journal=b.shadow;
 const fl=C.stampList(F,S.sh.flow||{},S.tomb.flow,now);S.sh.flow=fl.shadow;
 S.sh.habits=C.stampObj(H,S.sh.habits,now);
 quiet=true;try{localStorage.setItem('heymurph.v1',JSON.stringify(items));localStorage.setItem('heymurph.journal.v1',JSON.stringify(J));localStorage.setItem('heymurph.habits.v1',JSON.stringify(H));localStorage.setItem('heymurph.flow.v1',JSON.stringify(F))}finally{quiet=false}ssave()}
Storage.prototype.setItem=function(k,v){if(window.__hmReset&&KEYS.includes(k))return;rawSet.call(this,k,v);if(!quiet&&this===localStorage&&KEYS.includes(k)){clearTimeout(stamp.t);pend(1);stamp.t=setTimeout(()=>{stamp();schedule(2500)},0)}};
function localDoc(){return{items:C.withTombs(items,S.tomb.items),journal:C.withTombs(J,S.tomb.journal),flow:C.withTombs(F,S.tomb.flow),habits:H,meta:META}}
function applyDoc(d){const a=C.split(d.items),b=C.split(d.journal),fs=C.split(d.flow||[]);items=a.live;J=b.live;F=fs.live;if(d.habits&&Array.isArray(d.habits.habits))H=d.habits;if(d.meta&&typeof d.meta==='object')META=d.meta;S.tomb={items:a.tombs,journal:b.tombs,flow:fs.tombs};
 quiet=true;try{localStorage.setItem('heymurph.v1',JSON.stringify(items));localStorage.setItem('heymurph.journal.v1',JSON.stringify(J));localStorage.setItem('heymurph.habits.v1',JSON.stringify(H));localStorage.setItem('heymurph.meta.v1',JSON.stringify(META));localStorage.setItem('heymurph.flow.v1',JSON.stringify(F))}finally{quiet=false}
 S.sh.items=C.stampList(items,{},{},0).shadow;S.sh.journal=C.stampList(J,{},{},0).shadow;S.sh.flow=C.stampList(F,{},{},0).shadow;S.sh.habits=C.hashOf(H);ssave();
 try{render()}catch(e){}}
// --- UI
const btn=document.createElement('button');btn.id='syncBtn';btn.className='icon sync';btn.setAttribute('aria-label','Sync');
document.querySelector('#menuBtn').before(btn);const hb=document.createElement('div');hb.className='hbtns';btn.parentNode.insertBefore(hb,btn);hb.append(btn,document.querySelector('#menuBtn'));
const ago=t=>{if(!t)return'never';const s=(Date.now()-t)/1e3;return s<60?'just now':s<3600?Math.floor(s/60)+' min ago':new Date(t).toLocaleString(undefined,{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})};
function ui(st,msg){if(st)state=st;if(msg!==undefined)errMsg=msg;const lab0={nocfg:'Sync not configured',off:'Dropbox not connected — tap to connect',syncing:'Syncing…',synced:'Synced '+ago(S.last),offline:'Offline — will sync later',error:'Sync error: '+errMsg,idle:'Synced '+ago(S.last)}[state],lab=lab0+(isPend()&&state!=='syncing'?' · changes pending':'');
 btn.dataset.s=state;btn.title=lab;btn.innerHTML=`<span>${state==='syncing'?'⟳':state==='offline'?'⚡':state==='error'?'!':state==='nocfg'||state==='off'?'☁':'✓'}</span>`;
 const dl=document.querySelector('#dateLine');let sl=document.querySelector('#syncLine');if(!sl){sl=document.createElement('div');sl.id='syncLine';sl.className='date';dl.after(sl)}sl.textContent='☁ '+lab;sl.dataset.s=state}
// --- OAuth PKCE
const b64u=buf=>btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
async function connect(){const v=b64u(crypto.getRandomValues(new Uint8Array(48)));const ch=b64u(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v)));
 sessionStorage.setItem('hm.pkce',v);const st=b64u(crypto.getRandomValues(new Uint8Array(12)));sessionStorage.setItem('hm.state',st);
 location.href='https://www.dropbox.com/oauth2/authorize?'+new URLSearchParams({client_id:key,response_type:'code',code_challenge:ch,code_challenge_method:'S256',redirect_uri:REDIR,token_access_type:'offline',state:st})}
async function tokenReq(p){const r=await fetch('https://api.dropboxapi.com/oauth2/token',{method:'POST',body:new URLSearchParams(Object.assign({client_id:key},p))});const j=await r.json().catch(()=>({}));if(!r.ok)throw Object.assign(new Error(j.error_description||j.error||('token '+r.status)),{auth:r.status===400||r.status===401});return j}
async function handleRedirect(){const q=new URLSearchParams(location.search),code=q.get('code');if(!code&&!q.get('error'))return;if(/^vault\./.test(q.get('state')||''))return;history.replaceState(null,'',location.pathname);
 if(q.get('error')){toast('Dropbox: '+(q.get('error_description')||q.get('error')));return}
 const v=sessionStorage.getItem('hm.pkce');if(!v||q.get('state')!==sessionStorage.getItem('hm.state')){toast('Dropbox sign-in expired, try again');return}
 const j=await tokenReq({grant_type:'authorization_code',code,code_verifier:v,redirect_uri:REDIR});sessionStorage.removeItem('hm.pkce');
 if(sessionStorage.getItem('hm.pinreset')){sessionStorage.removeItem('hm.pinreset');
  if(S.acct&&S.acct!==j.account_id){toast('That is a different Dropbox account — PIN not reset');return}
  S.rt=j.refresh_token;S.at=j.access_token;S.exp=Date.now()+(j.expires_in-60)*1e3;S.acct=j.account_id;ssave();
  localStorage.removeItem('heymurph.pin.v1');localStorage.removeItem('heymurph.bio.v1');sessionStorage.setItem('heymurph.unlocked','1');
  setTimeout(()=>{window.HMLock&&HMLock.show('set',{title:'Verified ✓ Choose a new 4-digit PIN'})},200);return}
 S.rt=j.refresh_token;S.at=j.access_token;S.exp=Date.now()+(j.expires_in-60)*1e3;S.acct=j.account_id;ssave();toast('Dropbox connected')}
async function access(){if(S.at&&Date.now()<S.exp)return S.at;const j=await tokenReq({grant_type:'refresh_token',refresh_token:S.rt});S.at=j.access_token;S.exp=Date.now()+(j.expires_in-60)*1e3;ssave();return S.at}
async function dbx(url,opt,retry=true){const t=await access();const r=await fetch(url,Object.assign({},opt,{headers:Object.assign({Authorization:'Bearer '+t},opt.headers)}));
 if(r.status===401&&retry){S.at='';return dbx(url,opt,false)}return r}
async function download(path){const r=await dbx('https://content.dropboxapi.com/2/files/download',{method:'POST',headers:{'Dropbox-API-Arg':JSON.stringify({path:path||FILE})}});
 if(r.status===409){const e=await r.text();if(/not_found/.test(e))return null;throw new Error('download '+e.slice(0,120))}if(!r.ok)throw new Error('download '+r.status);
 const txt=await r.text();try{return JSON.parse(txt)}catch(e){throw new Error('heymurph-data.json is not valid JSON — not overwriting')}}
async function upload(doc){const r=await dbx('https://content.dropboxapi.com/2/files/upload',{method:'POST',headers:{'Content-Type':'application/octet-stream','Dropbox-API-Arg':JSON.stringify({path:FILE,mode:'overwrite',mute:true})},body:JSON.stringify(doc,null,1)});
 if(!r.ok)throw new Error('upload '+r.status+' '+(await r.text()).slice(0,120))}
// --- inbox: one-time data drops (e.g. day log entries added by the assistant)
async function inbox(){for(const P of['/heymurph-inbox.json','/heymurph-inbox-v41.json','/heymurph-inbox-v42.json','/heymurph-inbox-v45.json'])await inbox1(P);await opsInbox()}
// --- ops inbox: every file in /murph-ops is a list of operations from Murph, applied once then deleted
async function opsInbox(){let r;try{r=await dbx('https://api.dropboxapi.com/2/files/list_folder',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({path:'/murph-ops'})})}catch(e){return}if(!r.ok)return;
 const ents=((await r.json()).entries||[]).filter(e=>e['.tag']==='file'&&/\.json$/.test(e.name)).sort((a,b)=>a.name<b.name?-1:1);let n=0;
 for(const e of ents){let d;try{d=await download(e.path_lower)}catch(x){continue}if(!d)continue;try{(d.ops||[]).forEach(applyOp);n++}catch(x){console.warn('op',x)}
  try{await dbx('https://api.dropboxapi.com/2/files/delete_v2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({path:e.path_lower})})}catch(x){}}
 if(n){H.updatedAt=Date.now();localStorage.setItem('heymurph.habits.v1',JSON.stringify(H));try{save()}catch(x){}try{render()}catch(x){}toast('Updated from Murph')}}
window.HMApplyOp=(o)=>applyOp(o);
function applyOp(o){const now=Date.now(),hab=()=>{const k=typeof o.habit==='number'?o.habit:H.habits.findIndex(h=>h.name.toLowerCase()===String(o.habit||'').toLowerCase());return H.habits[k<0?0:k]};
 if(o.op==='log'){const h=hab();h.log=h.log||{};h.ts=h.ts||{};const p=h.log[o.date]&&!h.log[o.date].del?h.log[o.date]:{};h.log[o.date]={type:o.type??p.type??'',place:o.place??p.place??'',plan:o.remarks??p.plan??'',act:'',ts:now};
  if(o.date<=dAgo(0)){const on=['local','out','wo'].includes(h.log[o.date].type)?1:0;h.days[o.date]=on;h.ts[o.date]=now}}
 else if(o.op==='unlog'){const h=hab();if(h.log&&h.log[o.date])h.log[o.date]={del:1,ts:now}}
 else if(o.op==='tick'){const h=hab();h.ts=h.ts||{};h.days[o.date]=o.on===false?0:1;h.ts[o.date]=now}
 else if(o.op==='rename'){const h=hab();if(o.name)h.name=o.name}
 else if(o.op==='task'&&o.title&&typeof mk==='function'){const l=LN[o.list]?o.list:'focus';items.unshift(mk(o.title,l,o))}
 else if(o.op==='taskdone'&&o.id){const it=items.find(x=>x.id===o.id);if(it){it.done=true;it.doneAt=now}}}
async function inbox1(P){let d;try{d=await download(P)}catch(e){return}if(!d)return;const now=Date.now();
 if(d.untick&&H.habits[d.untick.habit||0]){const h=H.habits[d.untick.habit||0];h.ts=h.ts||{};(d.untick.dates||[]).forEach(dt=>{h.days[dt]=0;h.ts[dt]=now})}
 if(d.clearRemarks&&H.habits[d.clearRemarks.habit||0]){const h=H.habits[d.clearRemarks.habit||0],m=d.clearRemarks.month||'';Object.keys(h.log||{}).forEach(dt=>{if(dt.startsWith(m)&&!h.log[dt].del)h.log[dt]=Object.assign({},h.log[dt],{plan:'',act:'',ts:now})})}
 if(d.tick&&H.habits[d.tick.habit||0]){const h=H.habits[d.tick.habit||0];h.ts=h.ts||{};(d.tick.dates||[]).forEach(dt=>{h.days[dt]=1;h.ts[dt]=now})}
 if(Array.isArray(d.names))d.names.forEach((n,k)=>{if(n&&H.habits[k])H.habits[k].name=n});
 if(d.daylog){const L=d.daylog,h=H.habits[L.habit||0];if(h){if(L.rename&&/^Habit \d$/.test(h.name))h.name=L.rename;h.dl=true;h.log=h.log||{};h.ts=h.ts||{};
 for(const[dt,e]of Object.entries(L.entries||{})){h.log[dt]=Object.assign({},e,{ts:now});if(e.tick){h.days[dt]=1;h.ts[dt]=now}}}}
 H.updatedAt=now;localStorage.setItem('heymurph.habits.v1',JSON.stringify(H));
 try{await dbx('https://api.dropboxapi.com/2/files/delete_v2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({path:P})})}catch(e){}
 if(typeof renderHabits==='function'&&view==='habits')renderHabits();toast('Updated from Murph')}
// --- mail relay config: /mailrelay.json in the app folder ({"url","token"}); read-only, never deleted
let mrDone=false;async function mailRelay(){try{if(!window.HMMail||!HMMail.setCfg)return;if(mrDone&&HMMail.cfg())return;const d=await download('/mailrelay.json');mrDone=true;
 if(d&&typeof d.url==='string'&&/^https:\/\//.test(d.url.trim())&&typeof d.token==='string'&&d.token.trim())HMMail.setCfg(d.url.trim(),d.token.trim())}catch(e){console.warn('mailrelay',e)}}
// --- sync
async function sync(){if(window.__hmReset)return;if(!key){ui('nocfg');return}if(!S.rt){ui('off');return}if(!navigator.onLine){ui('offline');return}
 if(busy){again=true;return}busy=true;const t0=Date.now();ui('syncing');
 try{stamp();await inbox();await mailRelay();const remote=await download();const merged=C.mergeDoc(localDoc(),remote);
  const same=C.sameDoc(remote,merged);
  applyDoc(merged);if(!same)await upload(merged);S.last=Date.now();ssave();if(+(localStorage.getItem(PK)||0)<=t0)pend(0);retryMs=0;ui('synced')}
 catch(e){if(e.auth){S.rt='';S.at='';ssave();ui('off');toast('Dropbox sign-in expired — reconnect')}else if(!navigator.onLine||e instanceof TypeError)ui('offline');else ui('error',e.message);console.warn('sync',e);if(S.rt&&isPend()){retryMs=Math.min(retryMs?retryMs*2:5000,120000);schedule(retryMs)}}
 finally{busy=false;if(again){again=false;schedule(500)}}}
function schedule(ms){clearTimeout(timer);timer=setTimeout(sync,ms)}
btn.onclick=()=>{if(!key)return toast('Sync not configured: add DROPBOX_APP_KEY in config.js');if(!S.rt)return connect();sync()};
// menu entry
const col=document.querySelector('#stSync'),mb=document.createElement('button');mb.value='dbx';mb.type='submit';col.appendChild(mb);
const mlabel=()=>mb.textContent=!key?'Dropbox sync: not configured':S.rt?'Disconnect Dropbox':'Connect Dropbox';
document.querySelector('#menuBtn').addEventListener('click',mlabel);
document.querySelector('#menu').addEventListener('close',async()=>{if(document.querySelector('#menu').returnValue!=='dbx')return;
 if(!key)return toast('Sync not configured: add DROPBOX_APP_KEY in config.js');if(!S.rt)return connect();
 if(!confirm('Disconnect Dropbox? Local data stays on this device.'))return;try{await dbx('https://api.dropboxapi.com/2/auth/token/revoke',{method:'POST'})}catch(e){}
 S.rt=S.at='';S.exp=0;ssave();location.reload()});
addEventListener('online',()=>schedule(300));addEventListener('offline',()=>ui('offline'));
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')schedule(300);else if(isPend()){clearTimeout(stamp.t);stamp();clearTimeout(timer);sync()}});
addEventListener('pagehide',()=>{if(isPend()){stamp();sync()}});addEventListener('focus',()=>schedule(300));
setInterval(()=>{if(isPend()&&!busy&&navigator.onLine)schedule(0)},60000);
setInterval(()=>{if(state==='synced')ui()},60000);
window.HMSync={connect,linked:()=>!!(key&&S.rt),stamp,state:()=>state};
stamp();ui(!key?'nocfg':S.rt?'idle':'off');
(async()=>{try{await handleRedirect()}catch(e){ui('error',e.message)}sync();
 if(key&&!S.rt){const w=document.createElement('div');w.id='welcome';w.innerHTML=`<div class="wc-in"><img src="icons/logo.png" alt="" class="wc-logo"><h2>${localStorage.getItem('heymurph.welcomed')?'Connect Dropbox':'Hey Aspirants!'}</h2><p>Welcome to Hey Murph. Your focus list, habits and journal, in one place.</p>
<div class="wc-step"><b>Step 1</b> Connect Dropbox to keep your data backed up and synced across devices.</div>
<button id="wcGo" class="wc-go">Connect Dropbox</button><div class="wc-skip" style="font-size:.85em">Required — without it, your data could be lost if the phone or browser is cleared.</div></div>`;document.body.appendChild(w);
  const done=()=>{localStorage.setItem('heymurph.welcomed','1');w.remove()};
  w.querySelector('#wcGo').onclick=()=>connect()}})();
})();
