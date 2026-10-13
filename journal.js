'use strict';
// ===== Journal (CODE: Capture, Organize, Distill, Express) =====
const JKEY='heymurph.journal.v1',BUCKETS=['Inbox','Projects','Areas','Resources','Archive'];
const BCOL={Inbox:'#9aa4c7',Projects:'#a58bff',Areas:'#3ddc84',Resources:'#2fd3e0',Archive:'#ffb547'};
const LVL=['Raw','Bolded','Highlighted','Summarised'],LCOL=['#7d86a8','#ff8a3d','#ffd84d','#3ddc84'];
function jload(){try{const j=JSON.parse(localStorage.getItem(JKEY));if(j&&Array.isArray(j.entries))return j}catch(e){}return{entries:[]}}
let J=jload();const jsave=()=>localStorage.setItem(JKEY,JSON.stringify(J));
let jf={bucket:'All',express:false,q:''},jsel=new Set(),jediting=null;
const pad=n=>String(n).padStart(2,'0');
const jDay=ts=>{const d=new Date(ts);return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`};
const jStamp=ts=>{const d=new Date(ts);return jDay(ts)+' '+pad(d.getHours())+':'+pad(d.getMinutes())};
const jLevel=e=>e.essence&&e.essence.trim()?3:/==[^=\n]+==/.test(e.body)?2:/\*\*[^*\n]+\*\*/.test(e.body)?1:0;
const jTags=s=>String(s||'').split(',').map(t=>t.trim()).filter(Boolean);
function jMd(s){return esc(s).replace(/==([^=\n]+)==/g,'<mark>$1</mark>').replace(/\*\*([^*\n]+)\*\*/g,'<b>$1</b>')
 .replace(/(https?:\/\/[^\s<]+)/g,'<a href="$1" target="_blank" rel="noopener">$1</a>').replace(/\n/g,'<br>')}
function jFiltered(){const q=jf.q.toLowerCase();return J.entries.filter(e=>(jf.express?e.packet:jf.bucket==='All'||e.bucket===jf.bucket)
 &&(!q||[e.body,e.essence,e.customer,e.type,e.bucket,(e.tags||[]).join(' ')].join(' ').toLowerCase().includes(q))).sort((a,b)=>b.ts-a.ts)}
function jCapture(){const t=$('#jText').value.trim();if(!t){toast('Write something first.');return null}
 const e={id:uid(),ts:Date.now(),body:t,type:$('#jType').value,customer:$('#jCust').value.trim(),tags:jTags($('#jTags').value),bucket:'Inbox',essence:'',packet:false};
 J.entries.push(e);jsave();$('#jText').value='';$('#jType').value='';$('#jCust').value='';$('#jTags').value='';toast('Captured to Inbox');renderJournal();return e}
function renderJournal(){
 const cnt=b=>J.entries.filter(e=>b==='All'||e.bucket===b).length;
 $('#jChips').innerHTML=['All',...BUCKETS].map(b=>`<button class="jchip${!jf.express&&jf.bucket===b?' on':''}" data-b="${b}" style="--c:${BCOL[b]||'#e8ecf8'}">${b} <small>${cnt(b)}</small></button>`).join('')
  +`<button class="jchip ex${jf.express?' on':''}" data-x="1" style="--c:#ff4fb4">★ Express <small>${J.entries.filter(e=>e.packet).length}</small></button>`;
 const L=jFiltered();
 $('#jBar').innerHTML=`<span>${L.length} entr${L.length===1?'y':'ies'}${jsel.size?` · ${jsel.size} selected`:''}</span>`
  +(jsel.size?`<button data-exp="sel" class="primary sm">Export selected</button><button data-exp="clr" class="sm">Clear</button>`:'')
  +`<button data-exp="flt" class="sm">Export shown</button><button data-exp="all" class="sm">Export all</button>`;
 let day='',h='';
 for(const e of L){const d=jDay(e.ts),lv=jLevel(e);if(d!==day){day=d;h+=`<div class="jday">${new Date(e.ts).toLocaleDateString(undefined,{weekday:'short',day:'numeric',month:'short',year:'numeric'})}</div>`}
  h+=`<article class="jent${jsel.has(e.id)?' sel':''}" data-id="${e.id}" style="--c:${BCOL[e.bucket]}">
  <div class="jtop"><button class="jck" data-j="sel" aria-label="Select">${jsel.has(e.id)?'✓':''}</button><span class="jt">${jStamp(e.ts).slice(11)}</span>
  ${e.type?`<span class="jb">${esc(e.type)}</span>`:''}<select class="jbk" data-j="move" aria-label="Bucket">${BUCKETS.map(b=>`<option${b===e.bucket?' selected':''}>${b}</option>`).join('')}</select>
  <span class="jl" style="--l:${LCOL[lv]}" title="Distil level">L${lv} ${LVL[lv]}</span><button class="jpk${e.packet?' on':''}" data-j="pk" aria-label="Intermediate packet">★</button></div>
  ${e.essence?`<div class="jess">${jMd(e.essence)}</div>`:''}<div class="jbody">${jMd(e.body)}</div>
  <div class="jmeta">${(e.tags||[]).map(t=>`<span class="tag">#${esc(t)}</span>`).join('')}${e.customer?`<span>👤 ${esc(e.customer)}</span>`:''}<button class="sm" data-j="edit">Edit / Distil</button></div></article>`}
 $('#jList').innerHTML=h||`<div class="empty jempty">${jf.express?'No intermediate packets yet. Star ★ an entry to send it to Express.':'Nothing captured here yet.'}</div>`}
function jToMd(list,title){return `# ${title}\n\n_Exported ${jStamp(Date.now())} · ${list.length} entr${list.length===1?'y':'ies'}_\n\n`+list.map(e=>
 `## ${jStamp(e.ts)} — ${e.type||'Note'}\n\n- PARA: ${e.bucket}\n`+(e.tags&&e.tags.length?`- Tags: ${e.tags.join(', ')}\n`:'')+(e.customer?`- Customer: ${e.customer}\n`:'')
 +(e.essence?`- Essence: ${e.essence}\n`:'')+`- Distil level: ${jLevel(e)}${e.packet?'\n- Intermediate packet: yes':''}\n\n${e.body}\n`).join('\n')}
function jExport(kind){let L,t;const d=today();
 if(kind==='clr'){jsel.clear();renderJournal();return}
 if(kind==='sel'){L=J.entries.filter(e=>jsel.has(e.id)).sort((a,b)=>a.ts-b.ts);t='Hey Murph Journal — Selection'}
 else if(kind==='flt'){L=jFiltered();t='Hey Murph Journal — '+(jf.express?'Express':jf.bucket)+(jf.q?` (search: ${jf.q})`:'')}
 else{L=[...J.entries].sort((a,b)=>b.ts-a.ts);t='Hey Murph Journal — All'}
 if(!L.length){toast('Nothing to export.');return}
 const md=jToMd(L,t);window.jLastExport=md;share(`hey-murph-journal-${kind}-${d}.md`,md,'text/markdown');return md}
$('#jSave').onclick=jCapture;
$('#jText').addEventListener('keydown',e=>{if(e.key==='Enter'&&(e.metaKey||e.ctrlKey))jCapture()});
$('#jSearch').oninput=e=>{jf.q=e.target.value;renderJournal()};
$('#jChips').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.x)jf.express=!jf.express;else{jf.express=false;jf.bucket=b.dataset.b}renderJournal()});
$('#jBar').addEventListener('click',e=>{const b=e.target.closest('[data-exp]');if(b)jExport(b.dataset.exp)});
$('#jList').addEventListener('change',e=>{if(e.target.dataset.j==='move'){const x=J.entries.find(z=>z.id===e.target.closest('[data-id]').dataset.id);x.bucket=e.target.value;jsave();toast('Moved to '+x.bucket);renderJournal()}});
$('#jList').addEventListener('click',e=>{const b=e.target.closest('[data-j]');if(!b||b.tagName==='SELECT')return;const id=b.closest('[data-id]').dataset.id,x=J.entries.find(z=>z.id===id);
 if(b.dataset.j==='sel'){jsel.has(id)?jsel.delete(id):jsel.add(id)}else if(b.dataset.j==='pk'){x.packet=!x.packet;jsave()}else if(b.dataset.j==='edit'){jOpen(x);return}renderJournal()});
function jOpen(x){jediting=x;const f=$('#jForm');f.body.value=x.body;f.essence.value=x.essence||'';f.type.value=x.type||'';f.bucket.value=x.bucket;f.customer.value=x.customer||'';f.tags.value=(x.tags||[]).join(', ');f.packet.checked=!!x.packet;$('#jEdit').showModal()}
$('#jForm').addEventListener('click',e=>{const b=e.target.closest('[data-w]');if(!b)return;const ta=$('#jForm').body,w=b.dataset.w,s=ta.selectionStart,en=ta.selectionEnd;
 if(s===en){toast('Select some text first.');return}const v=ta.value;ta.value=v.slice(0,s)+w+v.slice(s,en)+w+v.slice(en);ta.focus();ta.setSelectionRange(s,en+2*w.length)});
$('#jEdit').addEventListener('close',()=>{const r=$('#jEdit').returnValue,f=$('#jForm'),x=jediting;if(!x)return;jediting=null;
 if(r==='delete'){if(confirm('Delete this journal entry?')){J.entries=J.entries.filter(z=>z!==x);jsel.delete(x.id);jsave();renderJournal();toast('Entry deleted')}return}
 if(r!=='save')return;x.body=f.body.value.trim()||x.body;x.essence=f.essence.value.trim();x.type=f.type.value;x.bucket=f.bucket.value;x.customer=f.customer.value.trim();x.tags=jTags(f.tags.value);x.packet=f.packet.checked;jsave();renderJournal()});
if(view==='journal')renderJournal();
