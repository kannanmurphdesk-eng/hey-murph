'use strict';
// ===== Customer Universe: direct access to the Obsidian vault in Dropbox through a SEPARATE Dropbox app (Full Dropbox).
// Own PKCE OAuth (state prefix "vault."), own localStorage keys (heymurph.vault.*). Never touches sync.js or its tokens.
(function(){
const KEY=typeof VAULT_APP_KEY==='string'?VAULT_APP_KEY.trim():'',ROOT=typeof VAULT_ROOT==='string'?VAULT_ROOT:'/Murph Desk/Murph Vault',CU=typeof VAULT_CU==='string'?VAULT_CU:ROOT+'/Customer Universe';
const REDIR=typeof DROPBOX_REDIRECT_URI==='string'?DROPBOX_REDIRECT_URI:location.origin+location.pathname;
const AK='heymurph.vault.auth.v1',IK='heymurph.vault.index.v1',NK='heymurph.vault.notes.v1',SP='vault.',NMAX=40,STALE=6*36e5,CUl=CU.toLowerCase();
const jget=k=>{try{return JSON.parse(localStorage.getItem(k))}catch(e){return null}},jput=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return false}};
let A=jget(AK)||{},IDX=jget(IK),NC=jget(NK)||{};
let mode='browse',dir=CUl,q='',note=null,busy=false,offline=!navigator.onLine,err='';
// ---------- OAuth (PKCE, offline refresh token)
const b64u=buf=>btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
async function connect(){if(!KEY)return toast('Vault not connected yet: Murph will add the key');
 const v=b64u(crypto.getRandomValues(new Uint8Array(48))),ch=b64u(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v))),st=SP+b64u(crypto.getRandomValues(new Uint8Array(12)));
 sessionStorage.setItem('hm.vault.pkce',v);sessionStorage.setItem('hm.vault.state',st);
 location.href='https://www.dropbox.com/oauth2/authorize?'+new URLSearchParams({client_id:KEY,response_type:'code',code_challenge:ch,code_challenge_method:'S256',redirect_uri:REDIR,token_access_type:'offline',state:st})}
async function tokenReq(p){const r=await fetch('https://api.dropboxapi.com/oauth2/token',{method:'POST',body:new URLSearchParams(Object.assign({client_id:KEY},p))});const j=await r.json().catch(()=>({}));
 if(!r.ok)throw Object.assign(new Error(j.error_description||j.error||('token '+r.status)),{auth:r.status===400||r.status===401});return j}
async function handleRedirect(){const u=new URLSearchParams(location.search),st=u.get('state')||'';if(!st.startsWith(SP)||!(u.get('code')||u.get('error')))return;history.replaceState(null,'',location.pathname);
 if(u.get('error')){toast('Vault: '+(u.get('error_description')||u.get('error')));return}
 const v=sessionStorage.getItem('hm.vault.pkce');if(!v||st!==sessionStorage.getItem('hm.vault.state')){toast('Vault sign-in expired, try again');return}
 const j=await tokenReq({grant_type:'authorization_code',code:u.get('code'),code_verifier:v,redirect_uri:REDIR});sessionStorage.removeItem('hm.vault.pkce');sessionStorage.removeItem('hm.vault.state');
 A={rt:j.refresh_token,at:j.access_token,exp:Date.now()+(j.expires_in-60)*1e3,acct:j.account_id};jput(AK,A);err='';toast('Vault connected');view='customers';render();refreshIndex(true)}
async function access(){if(A.at&&Date.now()<A.exp)return A.at;if(!A.rt)throw Object.assign(new Error('Vault not connected'),{auth:true});
 const j=await tokenReq({grant_type:'refresh_token',refresh_token:A.rt});A.at=j.access_token;A.exp=Date.now()+(j.expires_in-60)*1e3;jput(AK,A);return A.at}
// ---------- Dropbox API
const harg=o=>JSON.stringify(o).replace(/[\u007f-\uffff]/g,c=>'\\u'+c.charCodeAt(0).toString(16).padStart(4,'0')); // HTTP header must be ASCII
async function call(url,opt,retry=true){const t=await access();const r=await fetch(url,Object.assign({method:'POST'},opt,{headers:Object.assign({Authorization:'Bearer '+t},opt.headers)}));
 if(r.status===401&&retry){A.at='';return call(url,opt,false)}if(r.status===401)throw Object.assign(new Error('unauthorized'),{auth:true});return r}
async function rpc(ep,body){const r=await call('https://api.dropboxapi.com/2/files/'+ep,{headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}),tx=await r.text();
 if(!r.ok)throw Object.assign(new Error(ep+' '+r.status+' '+tx.slice(0,160)),{status:r.status});return JSON.parse(tx)}
async function listAll(path,rec){let r=await rpc('list_folder',{path,recursive:rec,include_deleted:false,limit:2000}),out=r.entries||[];
 while(r.has_more){r=await rpc('list_folder/continue',{cursor:r.cursor});out=out.concat(r.entries||[])}return out}
async function upload(path,text,modeArg){const r=await call('https://content.dropboxapi.com/2/files/upload',{headers:{'Content-Type':'application/octet-stream','Dropbox-API-Arg':harg({path,mode:modeArg,autorename:false,mute:true,strict_conflict:true})},body:text});
 const tx=await r.text();if(r.status===409&&/conflict/.test(tx))return{conflict:true};if(!r.ok)throw new Error('upload '+r.status+' '+tx.slice(0,120));return JSON.parse(tx)}
function fail(e){if(e.auth){A={};jput(AK,A);err='Vault sign-in expired: reconnect'}else if(e instanceof TypeError||!navigator.onLine)offline=true;else err=e.message;console.warn('vault',e)}
// ---------- index (recursive listing of the CU folder + .md notes at vault root), cached with timestamp
const hidden=p=>p.split('/').some(s=>s.startsWith('.'))||/\.bak[^/]*$/i.test(p)||/\.backup-[^/]*\.md$/i.test(p)||/\.pre-[^/]*\.md$/i.test(p);
const ent=e=>({p:e.path_display,l:e.path_lower,n:e.name.replace(/\.md$/i,''),d:e['.tag']==='folder'?1:0,r:e.rev,m:e.server_modified});
const isNote=e=>e['.tag']==='file'&&/\.md$/i.test(e.name);
async function refreshIndex(force){if(!KEY||!A.rt||busy)return;if(!force&&IDX&&Date.now()-IDX.at<STALE)return;busy=true;err='';draw();
 try{const cu=(await listAll(CU,true)).filter(e=>e.path_lower!==CUl&&!hidden(e.path_display)&&(e['.tag']==='folder'||isNote(e)));
  let rt=[];try{rt=(await listAll(ROOT,false)).filter(e=>isNote(e)&&!hidden(e.path_display))}catch(x){if(x.auth||x instanceof TypeError)throw x}
  IDX={at:Date.now(),e:cu.map(ent).concat(rt.map(e=>Object.assign(ent(e),{v:1})))};jput(IK,IDX);offline=false}
 catch(e){fail(e)}finally{busy=false;draw();homeCard()}}
const E=()=>IDX?IDX.e:[],byL=l=>E().find(e=>e.l===l),par=l=>l.slice(0,l.lastIndexOf('/')),notes=()=>E().filter(e=>!e.d);
const rel=p=>p.toLowerCase().startsWith(CUl+'/')?p.slice(CU.length+1):p.slice(ROOT.length+1);
function resolve(name){const n=String(name).split('/').pop().replace(/\.md$/i,'').trim().toLowerCase();if(!n)return null;const L=notes().filter(e=>e.n.toLowerCase()===n);return L.find(e=>!e.v)||L[0]||null}
function search(s){const t=s.toLowerCase().split(/\s+/).filter(Boolean);return notes().filter(e=>{const n=e.n.toLowerCase();return t.every(x=>n.includes(x))}).sort((a,b)=>(b.n.toLowerCase().startsWith(t[0])-a.n.toLowerCase().startsWith(t[0]))||a.n.localeCompare(b.n))}
// ---------- note text cache (last opened notes, for offline reading)
function putNote(n){NC[n.l]={t:n.text,r:n.rev,m:n.m,p:n.p,n:n.n,at:Date.now()};const ks=Object.keys(NC).sort((a,b)=>NC[b].at-NC[a].at);ks.slice(NMAX).forEach(k=>delete NC[k]);
 while(!jput(NK,NC)&&Object.keys(NC).length>1){const o=Object.keys(NC).sort((a,b)=>NC[a].at-NC[b].at);delete NC[o[0]]}}
async function openNote(l){const e=byL(l),c=NC[l];note={l,p:e?e.p:c?c.p:l,n:e?e.n:c?c.n:l.split('/').pop().replace(/\.md$/i,''),edit:false,conflict:false,saving:false,loading:false};
 if(c)Object.assign(note,{text:c.t,rev:c.r,m:c.m,cached:c.at});mode='note';draw(true);scrollTo(0,0);await loadNote()}
async function loadNote(){const n=note;if(!n)return;if(!A.rt||!navigator.onLine){if(!navigator.onLine)offline=true;draw(true);return}n.loading=true;n.err='';draw(true);
 try{const DU='https://content.dropboxapi.com/2/files/download';let r=await call(DU,{headers:{'Dropbox-API-Arg':harg({path:n.p})}});
  if(r.status===400){r=await call(DU+'?arg='+encodeURIComponent(JSON.stringify({path:n.p})),{headers:{'Content-Type':'text/plain; charset=dropbox-cors-hack'}});
   if(r.status===400&&n.l)r=await call(DU+'?arg='+encodeURIComponent(JSON.stringify({path:n.l})),{headers:{'Content-Type':'text/plain; charset=dropbox-cors-hack'}})}
  if(!r.ok){const tx=await r.text();throw new Error(/not_found/.test(tx)?'Note not found in the vault (moved or renamed?). Tap ⟳ on the list to refresh.':'download '+r.status+' '+tx.slice(0,160))}
  let meta={};try{meta=JSON.parse(r.headers.get('Dropbox-API-Result')||'{}')}catch(x){}const t=await r.text(),ie=byL(n.l)||{};if(note!==n)return;
  Object.assign(n,{text:t,rev:meta.rev||ie.r,m:meta.server_modified||ie.m,cached:0});if(meta.path_display)n.p=meta.path_display;offline=false;putNote(n)}
 catch(e){if(note===n){if(e.auth||e instanceof TypeError)fail(e);else n.err=e.message}}finally{n.loading=false;if(note===n)draw()}}
async function save(){const n=note;if(!n||n.saving)return;const ta=$('#cuEd');if(ta)n.draft=ta.value;if(!n.rev){toast('Reload the note first');return}n.saving=true;draw(true);
 try{const r=await upload(n.p,n.draft,{'.tag':'update',update:n.rev});if(r.conflict){n.conflict=true;return}
  Object.assign(n,{text:n.draft,rev:r.rev,m:r.server_modified,edit:false,conflict:false,draft:null,cached:0});putNote(n);const ie=byL(n.l);if(ie){ie.r=r.rev;ie.m=r.server_modified;jput(IK,IDX)}toast('Saved to vault')}
 catch(e){if(e.auth||e instanceof TypeError){fail(e);toast(offline?'Offline: not saved':'Vault sign-in expired: not saved')}else toast('Save failed: '+e.message)}
 finally{n.saving=false;if(note===n)draw(true)}}
async function create(folderP,name){const p=folderP+'/'+name+'.md',t=`# ${name}\n\nTier: \nCity: \nContacts: \nProducts/Interest: \nNotes: \n`;
 try{const r=await upload(p,t,'add');if(r.conflict){toast(`A note named "${name}" already exists there`);return false}
  const e={p:r.path_display||p,l:r.path_lower||p.toLowerCase(),n:name,d:0,r:r.rev,m:r.server_modified};if(IDX){IDX.e.push(e);jput(IK,IDX)}
  note={l:e.l,p:e.p,n:name,text:t,rev:e.r,m:e.m,edit:false,conflict:false,saving:false};putNote(note);mode='note';dir=par(e.l);toast('Created '+name);draw(true);return true}
 catch(e){if(e.auth||e instanceof TypeError)fail(e);toast('Not created: '+(offline?'offline':e.message));return false}}
// ---------- markdown (Obsidian flavour, read-only rendering)
function inl(s){const ph=[],keep=h=>'\u0000'+(ph.push(h)-1)+'\u0000';
 s=s.replace(/`([^`]+)`/g,(_,c)=>keep('<code>'+esc(c)+'</code>'));
 s=s.replace(/!?\[\[([^\]]+)\]\]/g,(_,x)=>{const k=x.indexOf('|'),t=k<0?x:x.slice(0,k),al=k<0?'':x.slice(k+1),tg=t.split('#')[0].trim(),hit=resolve(tg);
  return keep(`<a class="wl${hit?'':' miss'}" data-wl="${esc(tg)}"${hit?` data-p="${esc(hit.l)}"`:''}>${esc((al||t).trim())}</a>`)});
 s=s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g,(_,t,u)=>/^(https?:|mailto:|tel:)/i.test(u)?keep(`<a href="${esc(u)}" target="_blank" rel="noopener">${esc(t)}</a>`):keep(esc(t)));
 s=s.replace(/\bhttps?:\/\/[^\s<>()]*[^\s<>().,;:!?'"]/g,u=>keep(`<a href="${esc(u)}" target="_blank" rel="noopener">${esc(u)}</a>`));
 s=s.replace(/(^|[^\w+])(\+?\d[\d \-]{8,16}\d)(?!\w)/g,(a,pre,num)=>{const d=num.replace(/\D/g,'');return d.length>=10&&d.length<=13&&!/\d{4}-\d\d-\d\d/.test(num)?pre+keep(`<a href="tel:${num.replace(/[ \-]/g,'')}">${esc(num)}</a>`):a});
 s=esc(s).replace(/\*\*(.+?)\*\*|__(.+?)__/g,(_,a,b)=>'<b>'+(a||b)+'</b>').replace(/(^|[^*\w])\*(?!\s)(.+?)\*(?!\w)/g,'$1<i>$2</i>').replace(/(^|[^\w])_(?!\s)(.+?)_(?!\w)/g,'$1<i>$2</i>').replace(/==(.+?)==/g,'<mark>$1</mark>').replace(/~~(.+?)~~/g,'<s>$1</s>');
 return s.replace(/\u0000(\d+)\u0000/g,(_,n)=>ph[n])}
function fmHtml(y){const kv=[];for(const l of y.split('\n')){const m=l.match(/^([^\s:#][^:]*):\s*(.*)$/),li=l.match(/^\s*-\s+(.*)$/);
  if(m)kv.push([m[1].trim(),m[2].trim()?[m[2].trim()]:[]]);else if(li&&kv.length)kv[kv.length-1][1].push(li[1].trim())}
 const v=x=>x.replace(/^\[(.*)\]$/,'$1').split(/,\s*(?![^\[]*\]\])/).map(s=>inl(s.trim().replace(/^["']|["']$/g,''))).join(', ');
 return kv.length?`<div class="cufm">${kv.map(([k,a])=>`<div><span>${esc(k)}</span><b>${a.map(v).join(', ')||'—'}</b></div>`).join('')}</div>`:''}
const cells=r=>r.replace(/\[\[[^\]]*\]\]/g,s=>s.replace(/\|/g,'\u0001')).replace(/\\\|/g,'\u0001').trim().replace(/^\|/,'').replace(/\|$/,'').split('|').map(c=>c.replace(/\u0001/g,'|').trim());
function md(src){src=String(src||'').replace(/\r\n?/g,'\n');let fm='';const f=src.match(/^---\n([\s\S]*?)\n---[ \t]*(?:\n|$)/);if(f){fm=fmHtml(f[1]);src=src.slice(f[0].length)}
 const L=src.split('\n'),o=[],LI=/^(\s*)([-*+]|\d+[.)])\s+(.*)$/,blk=l=>!l.trim()||/^\s*(#{1,6}\s|```|>|\|)/.test(l)||LI.test(l);let i=0;
 while(i<L.length){const l=L[i];
  if(/^\s*```/.test(l)){const b=[];i++;while(i<L.length&&!/^\s*```/.test(L[i]))b.push(L[i++]);i++;o.push('<pre><code>'+esc(b.join('\n'))+'</code></pre>');continue}
  if(!l.trim()){i++;continue}
  const h=l.match(/^(#{1,6})\s+(.*)$/);if(h){const n=h[1].length;o.push(`<h${Math.min(n+1,6)} class="mh${n}">${inl(h[2].replace(/\s+#+\s*$/,''))}</h${Math.min(n+1,6)}>`);i++;continue}
  if(/^\s*([-*_])(\s*\1){2,}\s*$/.test(l)){o.push('<hr>');i++;continue}
  if(/^\s*\|/.test(l)&&i+1<L.length&&/^\s*\|?\s*:?-{2,}/.test(L[i+1])){const hd=cells(l);i+=2;const rows=[];while(i<L.length&&/^\s*\|/.test(L[i]))rows.push(cells(L[i++]));
   o.push(`<div class="mdt"><table><tr>${hd.map(c=>`<th>${inl(c)}</th>`).join('')}</tr>${rows.map(r=>`<tr>${hd.map((_,k)=>`<td>${inl(r[k]||'')}</td>`).join('')}</tr>`).join('')}</table></div>`);continue}
  if(/^\s*>/.test(l)){const b=[];while(i<L.length&&/^\s*>/.test(L[i]))b.push(L[i++].replace(/^\s*>\s?/,''));const co=b[0].match(/^\[!(\w+)\][-+]?\s*(.*)$/);if(co)b[0]=co[2]?`**${co[2]}**`:`**${co[1]}**`;
   o.push(`<blockquote${co?' class="callout"':''}>${b.map(inl).join('<br>')}</blockquote>`);continue}
  if(LI.test(l)){const it=[];while(i<L.length&&(LI.test(L[i])||(it.length&&/^\s{2,}\S/.test(L[i])&&!LI.test(L[i])))){const m=L[i].match(LI);
    if(m){const ind=Math.min(4,Math.floor(m[1].replace(/\t/g,'    ').length/2));let t=m[3],pre=/\d/.test(m[2])?`<span class="mdn">${esc(m[2])}</span> `:'';const cb=t.match(/^\[( |x|X)\]\s*(.*)$/);if(cb){pre=cb[1]===' '?'☐ ':'☑ ';t=cb[2]}it.push([ind,pre+inl(t)])}
    else it[it.length-1][1]+='<br>'+inl(L[i].trim());i++}
   o.push(`<ul class="mdl">${it.map(([d,t])=>`<li class="lv${d}">${t}</li>`).join('')}</ul>`);continue}
  const b=[l];i++;while(i<L.length&&!blk(L[i]))b.push(L[i++]);o.push('<p>'+b.map(inl).join('<br>')+'</p>')}
 return fm+o.join('')}
// ---------- UI
const ago=t=>{if(!t)return'never';const s=(Date.now()-t)/1e3;return s<90?'just now':s<3600?Math.floor(s/60)+' min ago':s<86400?Math.floor(s/3600)+' h ago':new Date(t).toLocaleDateString(undefined,{day:'numeric',month:'short'})};
const fdt=iso=>iso?new Date(iso).toLocaleString(undefined,{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}):'—';
const canWrite=()=>!!(A.rt&&navigator.onLine&&!offline);
const el=$('#customers');el.innerHTML=`<div id="cuTop"></div><div class="cubar" id="cuBar"><input id="cuQ" type="search" placeholder="Search customers…" autocomplete="off"><button id="cuRef" data-cu="refresh" aria-label="Refresh list">⟳</button><button data-cu="new" aria-label="New customer">＋</button></div><div id="cuMeta" class="cumeta"></div><div id="cuBody"></div>`;
$('#cuQ').addEventListener('input',e=>{q=e.target.value.trim();mode='browse';draw(true)});
function crumbs(){const rp=dir.slice(CUl.length).split('/').filter(Boolean);let acc=CUl;const segs=[`<button data-crumb="${esc(CUl)}">👥 Customers</button>`];
 rp.forEach(s=>{acc+='/'+s;const e=byL(acc);segs.push(`<button data-crumb="${esc(acc)}">${esc(e?e.n:s)}</button>`)});return `<div class="cucrumb">${segs.join('<i>›</i>')}</div>`}
const row=(e,sub)=>e.d?`<button class="cui" data-dir="${esc(e.l)}"><span class="cuic">📁</span><span class="cun">${esc(e.n)}</span><small>${notes().filter(x=>!x.v&&x.l.startsWith(e.l+'/')).length}</small><span class="cuch">›</span></button>`
 :`<button class="cui" data-note="${esc(e.l)}"><span class="cuic">${e.v?'📚':'👤'}</span><span class="cun">${esc(e.n)}${sub?`<small class="cusub">${esc(sub)}</small>`:''}</span>${NC[e.l]?'<small title="Available offline">⬇</small>':''}</button>`;
function browse(){if(!IDX)return busy?'<div class="cuempty">Loading the Customer Universe…</div>':'<div class="cuempty">No customer list yet. Tap ⟳ when online.</div>';
 if(q){const R=search(q);return `<div class="cumeta">${R.length} match${R.length===1?'':'es'} for “${esc(q)}”</div><div class="culist">${R.slice(0,80).map(e=>row(e,par(rel(e.p))||'Vault')).join('')||'<div class="cuempty">No customer by that name.</div>'}</div>`}
 const ch=E().filter(e=>!e.v&&par(e.l)===dir),fo=ch.filter(e=>e.d).sort((a,b)=>a.n.localeCompare(b.n)),no=ch.filter(e=>!e.d).sort((a,b)=>a.n.localeCompare(b.n)),rt=dir===CUl?E().filter(e=>e.v).sort((a,b)=>a.n.localeCompare(b.n)):[];
 return crumbs()+`<div class="culist">${fo.map(e=>row(e)).join('')}${no.map(e=>row(e)).join('')}${fo.length+no.length?'':'<div class="cuempty">Empty folder.</div>'}</div>`+(rt.length?`<div class="cusec">📚 Vault index notes</div><div class="culist">${rt.map(e=>row(e)).join('')}</div>`:'')}
function noteView(){const n=note,back=byL(par(n.l)),ro=!canWrite();let b='';
 if(n.edit)b=`<textarea id="cuEd" spellcheck="false">${esc(n.draft??'')}</textarea>`;
 else if(n.text!=null)b=`<div class="md">${md(n.text)}</div>`;else b=`<div class="cuempty">${n.loading?'Loading note…':n.err?'':offline?'Not available offline: open it once while online.':'—'}</div>`;
 const act=n.edit?`<button data-cu="cancel">Cancel</button><button data-cu="save" class="primary"${n.saving||ro?' disabled':''}>${n.saving?'Saving…':'Save'}</button>`
  :`<button data-cu="reload"${n.loading||!A.rt?' disabled':''}>${n.loading?'Loading…':'⟳ Reload'}</button>${ro?'<span class="curo">Read-only</span>':`<button data-cu="edit" class="primary"${n.text==null||n.loading?' disabled':''}>✎ Edit</button>`}`;
 return `<div class="cucrumb"><button data-cu="back">‹ ${esc(back?back.n:q?'Search':'Customers')}</button></div><div class="hcard cunote" style="--c:#3ED1C0"><h2 class="cutitle">${esc(n.n)}</h2>
 <div class="cumod">${n.m?'Modified '+fdt(n.m):''}${n.cached?' · cached copy':''}<br><small>${esc(rel(n.p))}</small></div>
 ${offline&&!n.edit?`<div class="cuwarn amber">Offline: read-only${n.cached?' (copy saved '+ago(n.cached)+')':''}</div>`:''}${n.conflict?`<div class="cuwarn" id="cuConf">Changed elsewhere: reload <button data-cu="reload">Reload</button></div>`:''}${n.err?`<div class="cuwarn">${esc(n.err)}</div>`:''}
 <div class="cuact">${act}</div>${b}</div>`}
function draw(force){if(note&&note.edit&&mode==='note'&&!force)return;const top=$('#cuTop'),bar=$('#cuBar'),meta=$('#cuMeta'),body=$('#cuBody');
 if(!KEY){top.innerHTML='<div class="hcard cunote" style="--c:#3ED1C0"><b>👥 Customer Universe</b><p class="cumut">Vault not connected yet: Murph will add the key.</p></div>';bar.hidden=meta.hidden=true;body.innerHTML='';return}
 top.innerHTML=(!A.rt?`<div class="hcard cunote" style="--c:#3ED1C0"><b>👥 Customer Universe</b><p class="cumut">Open and edit customer notes straight from your Obsidian vault in Dropbox (${esc(ROOT)}).</p><button data-cu="connect" class="primary cuconn">🔗 Connect vault</button></div>`:'')+(err?`<div class="cuwarn">${esc(err)}</div>`:'');
 if(!A.rt&&!IDX){bar.hidden=meta.hidden=true;body.innerHTML='';return}
 bar.hidden=meta.hidden=mode==='note';$('#cuRef').classList.toggle('spin',busy);
 meta.innerHTML=IDX?`${notes().filter(e=>!e.v).length} customer notes · list updated ${ago(IDX.at)}${offline?' · <span class="cuoff">offline</span>':''}${A.rt?' · <button class="culink" data-cu="disconnect">disconnect</button>':''}`:'';
 body.innerHTML=mode==='note'&&note?noteView():browse()}
let nd=null;function newDlg(){if(!canWrite())return toast('Go online to add a customer');if(!IDX)return toast('Load the customer list first');
 if(!nd){nd=document.createElement('dialog');nd.id='cuNewD';document.body.appendChild(nd);nd.innerHTML=`<form method="dialog" id="cuNewF"><h3>New customer</h3><label>Region folder<select name="f"></select></label><label>Customer name<input name="n" maxlength="120" required placeholder="e.g. IISc Bangalore" autocomplete="off"></label><div class="btns"><button value="cancel" formnovalidate>Cancel</button><button value="ok" class="primary">Create</button></div></form>`;
  $('#cuNewF').addEventListener('submit',e=>{if(!e.submitter||e.submitter.value!=='ok')return;const f=e.target,n=f.n.value.trim().replace(/\s+/g,' ');
   if(/[\\/:*?"<>|#^\[\]]/.test(n)){e.preventDefault();toast('Name cannot contain \\ / : * ? " < > | # ^ [ ]');return}if(n)create(f.f.value,n)})}
 const fs=[{p:CU,l:CUl,n:'(Customer Universe top level)'}].concat(E().filter(e=>e.d&&!e.v).sort((a,b)=>a.p.localeCompare(b.p)));const f=$('#cuNewF');
 f.f.innerHTML=fs.map(e=>`<option value="${esc(e.p)}"${e.l===dir?' selected':''}>${esc(e.l===CUl?e.n:rel(e.p))}</option>`).join('');f.n.value='';nd.returnValue='';nd.showModal()}
el.addEventListener('click',async e=>{const t=e.target;let b;
 if((b=t.closest('a[data-wl]'))){e.preventDefault();if(b.dataset.p)openNote(b.dataset.p);else toast('No note named “'+b.dataset.wl+'” in the vault list');return}
 if((b=t.closest('[data-dir]'))){dir=b.dataset.dir;q='';$('#cuQ').value='';mode='browse';draw(true);scrollTo(0,0);return}
 if((b=t.closest('[data-crumb]'))){dir=b.dataset.crumb;mode='browse';draw(true);return}
 if((b=t.closest('[data-note]'))){openNote(b.dataset.note);return}
 if(!(b=t.closest('[data-cu]'))||b.disabled)return;const a=b.dataset.cu;
 if(a==='connect')connect();else if(a==='refresh')refreshIndex(true);else if(a==='new')newDlg();
 else if(a==='back'){if(note&&note.edit&&note.draft!==note.text&&!confirm('Discard your edits?'))return;note=null;mode='browse';draw(true)}
 else if(a==='edit'){if(!canWrite())return toast('Offline: read-only');note.edit=true;note.conflict=false;note.draft=note.text;draw(true);const x=$('#cuEd');if(x)x.focus()}
 else if(a==='cancel'){note.edit=false;note.conflict=false;note.draft=null;draw(true)}
 else if(a==='save')save();
 else if(a==='reload'){if(note.edit&&note.draft!==note.text&&!confirm('Discard your edits and load the latest version from the vault?'))return;note.edit=false;note.conflict=false;note.draft=null;loadNote()}
 else if(a==='disconnect'){if(!confirm('Disconnect the vault on this device? (Cached notes stay readable.)'))return;try{await call('https://api.dropboxapi.com/2/auth/token/revoke',{})}catch(x){}A={};jput(AK,A);draw(true);homeCard()}});
el.addEventListener('input',e=>{if(e.target.id==='cuEd'&&note)note.draft=e.target.value});
// ---------- Home card
function homeCard(){const h=$('#home');if(!h||!h.dataset.init)return;let c=$('#hcCard');
 if(!c){c=document.createElement('div');c.className='hcard hm';c.id='hcCard';c.style.setProperty('--c','#3ED1C0');
  c.innerHTML=`<div class="hmh"><b>👥 Customers</b><span id="hcMeta"></span></div><input id="hcQ" type="search" placeholder="Search customers…" autocomplete="off"><div id="hcRes" class="culist"></div><button type="button" class="hmgo full" data-go="customers">Open Customers ›</button>`;h.appendChild(c);
  const res=()=>{const v=$('#hcQ').value.trim();$('#hcRes').innerHTML=v&&IDX?search(v).slice(0,5).map(e=>row(e,par(rel(e.p))||'Vault')).join('')||'<div class="cuempty">No match</div>':''};
  $('#hcQ').addEventListener('input',res);$('#hcQ').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();q=e.target.value.trim();$('#cuQ').value=q;mode='browse';note=null;view='customers';render();scrollTo(0,0)}});
  $('#hcRes').addEventListener('click',e=>{const b=e.target.closest('[data-note]');if(b){view='customers';render();openNote(b.dataset.note)}})}
 $('#hcMeta').textContent=!KEY?'vault key pending':!A.rt?(IDX?notes().length+' cached · not connected':'not connected'):IDX?notes().filter(e=>!e.v).length+' customers':'—'}
// ---------- wiring
const _rv=render;render=function(){const was=!el.hidden;_rv.apply(this,arguments);const on=view==='customers';el.hidden=!on;if(on&&!was){draw(true);refreshIndex(false)}homeCard()};
addEventListener('online',()=>{offline=false;if(view==='customers')draw()});addEventListener('offline',()=>{offline=true;if(view==='customers')draw()});
window.HMVault={connect,linked:()=>!!(KEY&&A.rt),configured:()=>!!KEY};
homeCard();handleRedirect().catch(e=>{toast('Vault: '+e.message);console.warn('vault',e)});
})();
