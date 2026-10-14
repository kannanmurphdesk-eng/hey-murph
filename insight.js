'use strict';
// ===== Done → Insight loop: insights from completed tasks become journal Notes (type Insight, tid = task id) =====
const hasInsight=id=>J.some(e=>e.type==='Insight'&&e.tid===id);
const INS_DAYS=30;
let INS=null; // {queue:[ids], i, mode:'one'|'step', saved}
const insQueue=()=>items.filter(i=>i.done&&!hasInsight(i.id)&&(i.doneAt||0)>Date.now()-INS_DAYS*864e5).sort((a,b)=>b.doneAt-a.doneAt).map(i=>i.id);
function saveInsight(t,text){const now=Date.now();
 J.push(jnorm({text:`From done: ${t.title}\n\n${text.trim()}`,type:'Insight',created:now,stage:'processed',processedAt:now,essence:text.trim().split('\n')[0].slice(0,120),exec:{dest:'notes',at:now},tid:t.id}));jsave()}
function openInsight(id){INS={queue:[id],i:0,mode:'one',saved:0};insDraw();$('#insSheet').showModal()}
function startCapture(){const q=insQueue();if(!q.length)return toast('No recent done tasks without an insight 🎉');INS={queue:q,i:0,mode:'step',saved:0};insDraw();$('#insSheet').showModal()}
function insDraw(){const b=$('#insBody'),N=INS.queue.length,t=items.find(x=>x.id===INS.queue[INS.i]);
 if(!t){b.innerHTML=`<div class="rvtop"><div class="rvh">💡 Insights</div><button data-i="close" class="x">✕</button></div><p>${INS.saved} insight${INS.saved===1?'':'s'} saved to Journal → Notes.</p><div class="btns"><button data-i="close" class="primary">Done</button></div>`;return}
 const prev=J.filter(e=>e.type==='Insight'&&e.tid===t.id);
 b.innerHTML=`<div class="rvtop"><div class="rvh">💡 Insight</div><button data-i="close" class="x" aria-label="Close">✕</button></div>
 ${INS.mode==='step'?`<div class="rvprog"><span>${INS.i+1} of ${N} recently done</span><div class="rvbar"><i style="width:${Math.round(INS.i/N*100)}%"></i></div></div>`:''}
 <div class="insT">✓ ${esc(t.title)}</div><div class="mut">Done ${t.doneAt?new Date(t.doneAt).toLocaleDateString(undefined,{day:'numeric',month:'short'}):''}${prev.length?` · ${prev.length} insight${prev.length>1?'s':''} already`:''}</div>
 <textarea id="insText" rows="4" placeholder="What did finishing this teach you? What would you do differently?"></textarea>
 <div class="btns">${INS.mode==='step'?'<button data-i="skip">Skip</button>':'<button data-i="close">Cancel</button>'}<button data-i="save" class="primary">Save insight</button></div>`;setTimeout(()=>{const x=$('#insText');if(x)x.focus()},50)}
$('#insBody').addEventListener('click',e=>{const b=e.target.closest('[data-i]');if(!b||!INS)return;const k=b.dataset.i;
 if(k==='close'){$('#insSheet').close();return}
 if(k==='save'){const v=$('#insText').value;if(!v.trim())return toast('Write the insight first, or Skip');saveInsight(items.find(x=>x.id===INS.queue[INS.i]),v);INS.saved++;toast('Insight saved to Notes');
  if(INS.mode==='one'){$('#insSheet').close();return}}
 INS.i++;insDraw()});
$('#insSheet').addEventListener('close',()=>{INS=null;render()});
// Capture bar on Done tab
const capEl=document.createElement('button');capEl.id='capIns';capEl.type='button';capEl.className='rvb rv-amber';document.querySelector('#count').before(capEl);capEl.onclick=startCapture;
function drawCap(){const n=view==='done'?insQueue().length:0;capEl.hidden=view!=='done';capEl.className='rvb '+(n?'rv-amber':'rv-green');
 capEl.innerHTML=`<span class="rvd"></span><span class="rvt">${n?`${n} recently done task${n>1?'s':''} without an insight`:'All recent done tasks have insights'}</span><span class="rvc">${n?'Capture insights ›':'✓'}</span>`}
const _render2=render;render=function(){_render2.apply(this,arguments);drawCap()};
drawCap();
