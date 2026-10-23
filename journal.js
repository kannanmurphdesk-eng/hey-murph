'use strict';
// ===== Journal: Record → Process → Execute (key heymurph.journal.v1) =====
const JKEY='heymurph.journal.v1',JTYPES=['Idea','Quote','Note','Link','Decision','Review','Insight'];
const JF={inbox:'Record',processed:'Review',exec:'Execute',notes:'Notes',all:'All'};
const DEST={focus:'Focus List',next:'Next Action',radar:'Under Radar',cold:'Cold Storage',po:'PO funnel',del:'Delivery cases',pay:'Payment pending',notes:'Notes'};
function jload(){try{const j=JSON.parse(localStorage.getItem(JKEY));if(Array.isArray(j))return j}catch(e){}return[]}
let J=jload(),jf='inbox',jq='',jcur=null;
const jsave=()=>localStorage.setItem(JKEY,JSON.stringify(J));
const p2=n=>String(n).padStart(2,'0');
const jday=t=>{const d=new Date(t);return`${d.getFullYear()}-${p2(d.getMonth()+1)}-${p2(d.getDate())}`};
const jtime=t=>{const d=new Date(t);return`${p2(d.getHours())}:${p2(d.getMinutes())}`};
const jstage=e=>e.exec?'exec':e.stage==='processed'?'processed':'inbox';
const jlevel=e=>e.essence&&e.essence.trim()?'Summarised':/==[^=]+==/.test(e.text)?'Highlighted':/\*\*[^*]+\*\*/.test(e.text)?'Bolded':'Raw';
const jfmt=s=>esc(s).replace(/\*\*([^*]+?)\*\*/g,'<b>$1</b>').replace(/==([^=]+?)==/g,'<mark>$1</mark>').replace(/\n/g,'<br>');
const jtitle=e=>(e.essence&&e.essence.trim())||e.text.split('\n').find(l=>l.trim())?.replace(/\*\*|==/g,'').trim().slice(0,120)||'(empty)';
function jnorm(x){return{id:x.id||uid(),text:String(x.text||''),type:JTYPES.includes(x.type)?x.type:'',customer:String(x.customer||''),created:+x.created||Date.now(),
 stage:x.stage==='processed'?'processed':'record',...(x.tid?{tid:String(x.tid)}:{}),essence:String(x.essence||''),xnote:String(x.xnote||''),processedAt:x.processedAt||null,exec:x.exec&&DEST[x.exec.dest]?x.exec:null}}
function jlist(){let L=J.filter(e=>jf==='all'||(jf==='notes'?e.exec&&e.exec.dest==='notes':jf==='exec'?!!e.exec:jstage(e)===jf));
 if(jq){const q=jq.toLowerCase();L=L.filter(e=>(e.text+' '+e.essence+' '+e.type).toLowerCase().includes(q))}
 return L.sort((a,b)=>b.created-a.created)}
function renderJournal(){const c=k=>J.filter(e=>k==='all'||(k==='notes'?e.exec&&e.exec.dest==='notes':k==='exec'?!!e.exec:jstage(e)===k)).length;
 const box=$('#journal');if(!box.dataset.init){box.dataset.init=1;box.innerHTML=`
 <form id="jrec" class="jcard"><textarea id="jtext" rows="4" placeholder="Record a thought… (auto-stamped)"></textarea>
 <input type="hidden" id="jtype"><div class="jrow"><button class="primary">Save</button></div></form>
 <div id="jfilt"></div><div class="jrow"><input id="jsearch" type="search" placeholder="Search journal…"><button id="jmd" type="button">Export MD</button></div><div id="jlist"></div>`;
  $('#jrec').onsubmit=e=>{e.preventDefault();const t=$('#jtext').value.trim();if(!t)return;J.push(jnorm({text:t,type:$('#jtype').value}));jsave();$('#jtext').value='';$('#jtype').value='';toast('Recorded '+jtime(Date.now()));if(jf!=='inbox'&&jf!=='all')jf='inbox';renderJournal()};
  $('#jsearch').oninput=e=>{jq=e.target.value.trim();renderJournal()};
  $('#jfilt').onclick=e=>{const b=e.target.closest('[data-jf]');if(b){jf=b.dataset.jf;renderJournal()}};
  $('#jlist').onclick=e=>{const cv=e.target.closest('[data-jconv]');if(cv){e.stopPropagation();const id=cv.closest('[data-jid]').dataset.jid;cv.dataset.jconv==='task'?jtoTask(id):jtoNote(id);return}const b=e.target.closest('[data-jid]');if(b)jopen(b.dataset.jid)};
  $('#jmd').onclick=()=>{const all=confirm('Export ALL journal entries?\nOK = all, Cancel = current filter ('+JF[jf]+(jq?', search':'')+')');share(`hey-murph-journal-${today()}.md`,jmd(all?[...J].sort((a,b)=>b.created-a.created):jlist(),all?'All':JF[jf]),'text/markdown')}}
 $('#jfilt').innerHTML=Object.entries(JF).map(([k,n])=>`<button data-jf="${k}" class="s-${k}${jf===k?' on':''}">${n}<i>${c(k)}</i></button>`).join('');
 const L=jlist();let html='',day='';
 for(const e of L){const d=jday(e.created);if(d!==day){day=d;html+=`<h3 class="jday">${new Date(e.created).toLocaleDateString(undefined,{weekday:'short',day:'numeric',month:'short',year:'numeric'})}</h3>`}
  const st=jstage(e);html+=`<div class="jent s-${st}" data-jid="${e.id}"><div class="jm"><span class="jt">${jtime(e.created)}</span>${e.type?`<span class="jty">${e.type}</span>`:''}<span class="lvl l-${jlevel(e)}">${jlevel(e)}</span></div>
  ${e.essence?`<div class="jess">${esc(e.essence)}</div>`:''}<div class="jb">${jfmt(e.text)}</div>${e.xnote?`<div class="jess">Exec: ${esc(e.xnote)}</div>`:''}${e.exec?`<div class="jx d-${e.exec.dest}">→ ${DEST[e.exec.dest]} · ${jday(e.exec.at)} ${jtime(e.exec.at)}</div>`:''}</div<div class="jrow jconv"><button type="button" data-jconv="task" class="d-focus">✓ To task</button><button type="button" data-jconv="note" class="d-notes">📝 To note</button></div></div>`}
 $('#jlist').innerHTML=html||'<div class="empty">Nothing here yet.</div>'}
function jmd(L,label){return`# Hey Murph Journal — ${label}\n\nExported ${jday(Date.now())} ${jtime(Date.now())} (${L.length} entries)\n\n`+L.map(e=>`## ${jday(e.created)} ${jtime(e.created)} — ${e.type||'Entry'}\n\n- Stage: ${{inbox:'Record',processed:'Reviewed',exec:'Executed'}[jstage(e)]} (${jlevel(e)})\n`+(e.essence?`- Essence: ${e.essence}\n`:'')+`- Execute: ${e.exec?DEST[e.exec.dest]+' ('+jday(e.exec.at)+' '+jtime(e.exec.at)+')':'—'}\n\n${e.text}\n`).join('\n')}
// editor
function jopen(id){jcur=J.find(e=>e.id===id);const f=$('#jform');f.text.value=jcur.text;f.type.value=jcur.type;f.essence.value=jcur.essence;f.xnote.value=jcur.xnote||'';jprev();$('#jedit').showModal()}
function jprev(){const f=$('#jform'),tmp={text:f.text.value,essence:f.essence.value};$('#jprev').innerHTML=jfmt(tmp.text)||'<i>empty</i>';$('#jlvl').textContent=jlevel(tmp);$('#jlvl').className='lvl l-'+jlevel(tmp);
 $('#jst').textContent=jcur.exec?'Executed → '+DEST[jcur.exec.dest]+' · '+jday(jcur.exec.at)+' '+jtime(jcur.exec.at):jcur.stage==='processed'?'Reviewed':'Record (not reviewed)';$('#jexbox').hidden=true}
function jwrap(m){const t=$('#jform').text,a=t.selectionStart,b=t.selectionEnd;if(a===b){toast('Select some text first');return}
 t.setRangeText(m+t.value.slice(a,b)+m,a,b,'select');t.focus();jprev()}
function jcommit(){const f=$('#jform');jcur.text=f.text.value.trim()||jcur.text;jcur.type=f.type.value;jcur.essence=f.essence.value.trim();jcur.xnote=f.xnote.value.trim()}
function jexec(dest){jcommit();if(jcur.exec&&!confirm('Already sent to '+DEST[jcur.exec.dest]+'. Send again?'))return;
 if(dest!=='notes'){if(!canIn(dest))return;const t=mk(jtitle(jcur),dest,{});t.notes=jcur.text.replace(/\*\*|==/g,'');t.jid=jcur.id;items.push(t);save();jcur.exec={dest,at:Date.now(),taskId:t.id}}
 else jcur.exec={dest,at:Date.now()};
 if(jcur.stage!=='processed'){jcur.stage='processed';jcur.processedAt=Date.now()}jsave();$('#jedit').close('x');toast('Sent to '+DEST[dest]);render()}
$('#jform').addEventListener('input',jprev);
$('#jform').addEventListener('click',e=>{const a=e.target.closest('[data-j]');if(!a)return;e.preventDefault();const k=a.dataset.j;
 if(k==='b')jwrap('**');else if(k==='h')jwrap('==');else if(k==='proc'){jcommit();jcur.stage='processed';jcur.processedAt=Date.now();jsave();jprev();toast('Reviewed');render()}
 else if(k==='unproc'){jcommit();jcur.stage='record';jsave();jprev()}
 else if(DEST[k])jexec(k);else if(k==='del'){if(confirm('Delete this journal entry?')){J=J.filter(x=>x!==jcur);jsave();$('#jedit').close('x');render()}}
 else if(k==='save'){jcommit();jsave();$('#jedit').close('x');render()}else if(k==='cancel')$('#jedit').close('x')});
function jImport(arr){if(!Array.isArray(arr))return;J=arr.map(jnorm);jsave()}
$('#jform').addEventListener('submit',e=>e.preventDefault());

// ===== Journal → Task / Note (copy; entry stays in journal) =====
function jsplit(e){const ls=e.text.replace(/\*\*|==/g,'').split('\n');const i=ls.findIndex(l=>l.trim());if(i<0)return{title:'(empty)',rest:''};
 return{title:ls[i].trim().slice(0,200),rest:ls.slice(i+1).join('\n').trim()}}
function jtoTask(id){const e=J.find(x=>x.id===id);if(!e)return;let d=$('#jtodlg');
 if(!d){d=document.createElement('dialog');d.id='jtodlg';document.body.appendChild(d);
  d.addEventListener('click',ev=>{const b=ev.target.closest('[data-jl]');if(ev.target===d||(b&&b.dataset.jl==='x')){d.close();return}if(!b)return;
   const l=b.dataset.jl,je=J.find(x=>x.id===d.dataset.jid);if(!je||!canIn(l))return;const{title,rest}=jsplit(je);const t=mk(title,l,{customer:je.customer});
   if(rest)t.notes=rest;t.jid=je.id;items.push(t);save();je.exec={dest:l,at:Date.now(),taskId:t.id};jsave();d.close();toast('Task added to '+LN[l]+' (journal entry kept)');render()})}
 d.dataset.jid=id;const{title}=jsplit(e);
 d.innerHTML=`<div class="jlab">Copy to task</div><div class="jess">${esc(title)}</div><div class="jrow jconv">${Object.keys(LN).map(l=>`<button type="button" data-jl="${l}" class="${l==='cold'?'primary':''}">→ ${LN[l]}${CAPPED.includes(l)?' ('+openIn(l).length+'/'+CAP+')':''}</button>`).join('')}</div><div class="btns"><button type="button" data-jl="x">Cancel</button></div>`;
 d.showModal()}
function jtoNote(id){const e=J.find(x=>x.id===id);if(!e)return;if(e.exec&&e.exec.dest==='notes'){toast('Already in Notes');return}
 if(e.exec&&!confirm('Already sent to '+DEST[e.exec.dest]+' (that task stays). Also mark as Note?'))return;
 e.exec={dest:'notes',at:Date.now()};if(e.stage!=='processed'){e.stage='processed';e.processedAt=Date.now()}jsave();toast('Added to Journal → Notes');render()}
