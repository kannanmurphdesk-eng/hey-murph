'use strict';
// ===== Journal Review: triage Record → Process → Execute (meta key heymurph.meta.v1) =====
const MKEY='heymurph.meta.v1';
let META=(()=>{try{const m=JSON.parse(localStorage.getItem(MKEY));if(m&&typeof m==='object')return m}catch(e){}return{lastReviewAt:0,updatedAt:0}})();
const msave=()=>localStorage.setItem(MKEY,JSON.stringify(META));
const daysSince=t=>Math.floor((new Date(jday(Date.now())+'T00:00')-new Date(jday(t)+'T00:00'))/864e5);
function lastReview(){const fromJ=Math.max(0,...J.filter(e=>e.type==='Review').map(e=>e.created||0));return Math.max(META.lastReviewAt||0,fromJ)}
function rBadge(){const t=lastReview(),un=J.filter(rvUnproc).length,pe=J.filter(rvPend).length,q=un+pe?` · ${un+pe} to review`:'';
 if(!t)return{cls:'rv-red',txt:'Never reviewed'+q,cta:'Review now'};const n=daysSince(t),d=new Date(t).toLocaleDateString(undefined,{day:'numeric',month:'short'});
 return{cls:n<=3?'rv-green':n<=7?'rv-amber':n<=13?'rv-coral':'rv-red',txt:`Last review: ${n===0?'today':n===1?'1 day ago':n+' days ago'} (${d})${q}`,cta:n>=14?'Review due':'Review'}}
const rvUnproc=e=>!e.exec&&e.stage!=='processed',rvPend=e=>!e.exec&&e.stage==='processed';
const rvJ=document.createElement('button');rvJ.id='reviewJ';rvJ.type='button';
function drawReview(){const b=rBadge();rvJ.className='rvb '+b.cls;rvJ.innerHTML=`<span class="rvd"></span><span class="rvt">${b.txt}</span><span class="rvc">${b.cta} ›</span>`;
 const js=document.querySelector('#journal');if(view==='journal'&&js.firstChild!==rvJ)js.prepend(rvJ)}
const _render=render;render=function(){_render.apply(this,arguments);drawReview()};
// --- session
let RV=null;
function rvStart(){RV={q:J.filter(rvUnproc).sort((a,b)=>a.created-b.created).map(e=>e.id),i:0,stats:{processed:0,executed:0,deleted:0,skipped:0},done:false};rvDraw();$('#rvSheet').showModal()}
const rvCur=()=>RV&&RV.i<RV.q.length?J.find(e=>e.id===RV.q[RV.i]):null;
function rvNext(){RV.i++;while(RV.i<RV.q.length&&!J.find(e=>e.id===RV.q[RV.i]))RV.i++;rvDraw()}
function rvExec(e,dest){if(dest!=='notes'){if(dest==='focus'&&!canFocus())return false;const t=mk(jtitle(e),dest,{});t.notes=e.text.replace(/\*\*|==/g,'');t.jid=e.id;items.push(t);save();e.exec={dest,at:Date.now(),taskId:t.id}}
 else e.exec={dest,at:Date.now()};if(e.stage!=='processed'){e.stage='processed';e.processedAt=Date.now()}jsave();RV.stats.executed++;toast('Sent to '+DEST[dest]);return true}
function rvCommit(e){const t=$('#rvText'),es=$('#rvEss');if(!e||!t)return;e.text=t.value.trim()||e.text;e.essence=es.value.trim();jsave()}
const execBtns=id=>`<div class="jrow rvx"><button data-r="x-focus" data-id="${id}" class="d-focus">→ Focus List</button><button data-r="x-cold" data-id="${id}" class="d-cold">→ Cold Storage</button><button data-r="x-notes" data-id="${id}" class="d-notes">→ Notes</button></div>`;
function rvDraw(){const e=rvCur(),N=RV.q.length,b=$('#rvBody');let h=`<div class="rvtop"><div class="rvh">Journal review</div><button data-r="close" class="x" aria-label="Close">✕</button></div>`;
 if(e){const pos=RV.i+1;h+=`<div class="rvprog"><span>Record ${pos} of ${N}</span><div class="rvbar"><i style="width:${Math.round(RV.i/N*100)}%"></i></div></div>
 <div class="jm"><span class="jt">${jday(e.created)} ${jtime(e.created)}</span>${e.type?`<span class="jty">${e.type}</span>`:''}<span class="lvl" id="rvLvl"></span><span class="mut">${daysSince(e.created)}d old</span></div>
 <div class="jrow" style="margin-top:8px"><button data-r="b"><b>B</b> Bold</button><button data-r="h"><mark>H</mark> Highlight</button><button data-r="edit">Open editor</button></div>
 <textarea id="rvText" rows="5">${esc(e.text)}</textarea><div id="rvPrev" class="jb jprev" hidden></div><textarea id="rvEss" rows="3" placeholder="Review comments…">${esc(e.essence||'')}</textarea>
 ${e.stage==='processed'?`<div class="jlab">Execute</div>${execBtns(e.id)}`:''}
 <div class="jrow"><button data-r="proc" class="s-processed">Reviewed, decide later</button><button data-r="skip">Skip</button><button data-r="del" class="danger">Delete</button></div>`}
 else{const P=J.filter(rvPend).sort((a,b)=>a.created-b.created);
  h+=`<div class="rvprog"><span>${N?`All ${N} Record entr${N===1?'y':'ies'} reviewed`:'Nothing left in Record'}</span><div class="rvbar"><i style="width:100%"></i></div></div>
  <div class="jlab">Reviewed, not executed yet (${P.length})</div>${P.length?P.map(x=>`<div class="rvp"><div class="rvpt">${x.essence?`<b>${esc(x.essence)}</b> · `:''}${jfmt(x.text.split('\n')[0].slice(0,120))}</div>${execBtns(x.id)}</div>`).join(''):'<p class="mut">None. Everything reviewed has a destination.</p>'}
  <label class="rvins">Insight (optional)<textarea id="rvIns" rows="3" placeholder="Anything this review taught you…"></textarea></label>`}
 const s=RV.stats;h+=`<div class="rvfoot"><span class="mut">${s.processed} reviewed · ${s.executed} executed · ${s.deleted} deleted</span><button data-r="finish" class="primary">Finish review</button></div>`;
 b.innerHTML=h;if(e){rvPrev();$('#rvText').oninput=$('#rvEss').oninput=rvPrev}}
function rvPrev(){const t={text:$('#rvText').value,essence:$('#rvEss').value};$('#rvPrev').innerHTML=jfmt(t.text);const l=jlevel(t),L=$('#rvLvl');L.textContent=l;L.className='lvl l-'+l}
function rvWrap(m){const t=$('#rvText'),a=t.selectionStart,z=t.selectionEnd;if(a===z){toast('Select some text first');return}t.setRangeText(m+t.value.slice(a,z)+m,a,z,'select');t.focus();rvPrev()}
function rvFinish(){const ins=($('#rvIns')||{}).value;const e=rvCur();if(e)rvCommit(e);const now=Date.now();
 if(ins&&ins.trim())J.push(jnorm({text:ins.trim(),type:'Review',created:now,stage:'processed',processedAt:now,essence:'Review insight '+jday(now),exec:{dest:'notes',at:now}}));jsave();
 META.lastReviewAt=now;META.lastReview=Object.assign({},RV.stats);META.updatedAt=now;msave();$('#rvSheet').close();RV=null;toast('Review done');render()}
$('#rvBody').addEventListener('click',ev=>{const b=ev.target.closest('[data-r]');if(!b||!RV)return;const r=b.dataset.r,e=rvCur();
 if(r==='close'){if(e)rvCommit(e);$('#rvSheet').close();RV=null;render();return}
 if(r==='b')return rvWrap('**');if(r==='h')return rvWrap('==');
 if(r==='edit'){rvCommit(e);$('#rvSheet').close();RV=null;render();jopen(e.id);return}
 if(r==='finish')return rvFinish();
 if(r==='skip'){rvCommit(e);RV.stats.skipped++;return rvNext()}
 if(r==='proc'){rvCommit(e);e.stage='processed';e.processedAt=Date.now();jsave();RV.stats.processed++;return rvNext()}
 if(r==='del'){if(!confirm('Delete this journal entry?'))return;J=J.filter(x=>x!==e);jsave();RV.stats.deleted++;RV.q.splice(RV.i,1);RV.i--;return rvNext()}
 if(r.startsWith('x-')){const x=J.find(y=>y.id===b.dataset.id);if(!x)return;if(x===e)rvCommit(e);const wasRec=x.stage!=='processed';if(!rvExec(x,r.slice(2)))return;if(wasRec)RV.stats.processed++;if(x===e)rvNext();else rvDraw()}});
$('#rvSheet').addEventListener('cancel',()=>{const e=rvCur();if(e)rvCommit(e);RV=null;setTimeout(render,0)});
rvJ.onclick=rvStart;
drawReview();
