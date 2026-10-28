'use strict';
// ===== Journal email backup: POSTs each NEW journal entry to a private Google Apps Script relay that emails it.
// Relay URL + token live only in this device's localStorage (never in the repo). One-time setup: open the app as
//   https://kannanmurphdesk-eng.github.io/hey-murph/#mailrelay=<APPS_SCRIPT_EXEC_URL>|<TOKEN>
(function(){
const CK='heymurph.mail.cfg',SK='heymurph.mail.sent',QK='heymurph.mail.q';
const get=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch(e){return d}},put=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const m=location.hash.match(/mailrelay=([^|]+)\|(.+)$/);
if(m){put(CK,{url:decodeURIComponent(m[1]),token:decodeURIComponent(m[2]),since:Date.now()-864e5});history.replaceState(null,'',location.pathname+location.search);try{toast('Journal email backup on')}catch(e){}}
const cfg=()=>get(CK,null);let busy=false;
const ist=t=>{const d=new Date(t+19800000),p=n=>String(n).padStart(2,'0');return`${d.getUTCFullYear()}-${p(d.getUTCMonth()+1)}-${p(d.getUTCDate())} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())} IST`};
function scan(){const c=cfg();if(!c)return;let L;try{L=JSON.parse(localStorage.getItem('heymurph.journal.v1'))||[]}catch(e){return}
 const sent=get(SK,{}),q=get(QK,[]),inq=new Set(q.map(x=>x.id));
 for(const e of L){if(!e||!e.id||e.del||sent[e.id]||inq.has(e.id)||!(e.text||'').trim()||(+e.created||0)<c.since)continue;
  const first=e.text.replace(/\s+/g,' ').trim().slice(0,40);q.push({id:e.id,subject:`Hey Murph Journal - ${ist(+e.created)} - ${first}`,body:`${e.text}\n\n---\nEntry id: ${e.id}`})}
 put(QK,q)}
async function flush(){const c=cfg();if(!c||busy||!navigator.onLine)return;busy=true;
 try{let q=get(QK,[]);while(q.length){const x=q[0];
  await fetch(c.url,{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain'},body:JSON.stringify(Object.assign({token:c.token},x))});
  const s=get(SK,{});s[x.id]=Date.now();put(SK,s);q=get(QK,[]).filter(y=>y.id!==x.id);put(QK,q)}}
 catch(e){console.warn('mail',e)}finally{busy=false}}
const run=()=>{scan();flush()};let t;
const raw=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){raw.call(this,k,v);if(k==='heymurph.journal.v1'){clearTimeout(t);t=setTimeout(run,3000)}};
addEventListener('online',run);document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')run();else{scan();flush()}});
setInterval(run,120000);run();
function setCfg(url,token){const c=cfg();if(c&&c.url===url&&c.token===token)return false;put(CK,{url,token,since:Date.now()-864e5});try{toast('Journal email backup on')}catch(e){}run();return true}
window.HMMail={run,cfg,setCfg,queue:()=>get(QK,[])};
})();
