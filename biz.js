'use strict';
// ===== Business Journal (editable; key heymurph.biz.v1, synced as businessJournal) =====
const BJKEY='heymurph.biz.v1';
const BJTAGS=['Damage control','PDC','NS'];
const BJSTATS=['Yet to start','In progress','Done'];
const BJTAG={'Damage control':'#ff6b5e',PDC:'#ffb547',NS:'#a66bff'};
const BJST={'Yet to start':'#8aa0c8','In progress':'#ffb547',Done:'#3ddc84'};
function bjload(){try{const a=JSON.parse(localStorage.getItem(BJKEY));if(Array.isArray(a))return a}catch(e){}return[]}
let BJ=typeof SyncCore!=='undefined'&&SyncCore.normBiz?SyncCore.normBiz(bjload()):bjload();
const isBizNote=e=>/^\s*>/.test(e&&e.text||'');
const bjfmt=d=>{const t=Date.parse(String(d||'')+'T12:00:00+05:30');if(isNaN(t))return String(d||'');
 return new Date(t).toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'})};
function bjsave(){if(typeof SyncCore!=='undefined'&&SyncCore.normBiz)BJ=SyncCore.normBiz(BJ);localStorage.setItem(BJKEY,JSON.stringify(BJ))}
function bjImport(arr){if(!Array.isArray(arr))return;BJ=typeof SyncCore!=='undefined'&&SyncCore.normBiz?SyncCore.normBiz(arr):arr;bjsave()}
function bjFind(id){return BJ.find(x=>x.id===id)}
function bjPatch(id,patch){const e=bjFind(id);if(!e||e.deleted)return;Object.assign(e,patch);
 if('done' in patch&&!('status' in patch))e.status=e.done?'Done':'Yet to start';
 if('status' in patch)e.done=e.status==='Done';
 bjsave();renderBiz()}
function bjAdd(date,text){text=String(text||'').trim();if(!text)return false;const note=/^\s*>/.test(text);
 const raw={date:date||today(),text,tag:'',status:note?'':'Yet to start',done:false};
 const e=typeof SyncCore!=='undefined'&&SyncCore.normBiz?SyncCore.normBiz([raw])[0]:raw;
 if(e&&!e.id)e.id=(typeof uid==='function'?uid():'bj-'+Date.now().toString(36));
 BJ.push(e);bjsave();renderBiz();return true}
function bjSel(opts,cur,empty){return(empty!==undefined?`<option value="">${empty}</option>`:'')+opts.map(o=>`<option value="${esc(o)}"${o===cur?' selected':''}>${esc(o)}</option>`).join('')}
function drawBjList(){const box=$('#bjList');if(!box)return;const L=(BJ||[]).filter(e=>e&&!e.deleted);
 const days=[...new Set(L.map(e=>e.date).filter(Boolean))].sort((a,b)=>String(b).localeCompare(String(a)));
 let h=days.length?'':'<div class="empty">No entries yet.</div>';
 for(const d of days){h+=`<h3 class="jday">${esc(bjfmt(d))}</h3>`;
  for(const e of L.filter(x=>x.date===d)){if(isBizNote(e)){h+=`<div class="bizn" data-id="${esc(e.id)}"><span class="bizt" data-bj="edit">${esc(String(e.text||'').replace(/^\s*>\s?/,''))}</span></div>`;continue}
   const done=!!e.done||e.status==='Done';
   h+=`<div class="bize${done?' done':''}" data-id="${esc(e.id)}"><label class="bizchk"><input type="checkbox" data-bj="done"${done?' checked':''}></label><div class="bizt" data-bj="edit">${esc(e.text||'')}</div><div class="bizm"><select data-bj="tag" aria-label="Task type" style="--c:${BJTAG[e.tag]||'#8aa0c8'}">${bjSel(BJTAGS,e.tag||'','None')}</select><select data-bj="status" aria-label="Status" style="--c:${BJST[e.status]||'#8aa0c8'}">${bjSel(BJSTATS,e.status||'Yet to start')}</select></div></div>`}}
 box.innerHTML=h}
function bjCommitEdit(inp){if(!inp||!inp.classList.contains('bjedit'))return;const wrap=inp.closest('[data-id]'),id=wrap&&wrap.dataset.id,e=bjFind(id);if(!e){renderBiz();return}
 let t=inp.value.trim();if(isBizNote(e))t=t?(/^\s*>/.test(t)?t:'> '+t):e.text;if(t&&t!==e.text)bjPatch(id,{text:t});else renderBiz()}
function renderBiz(){const box=$('#biz');if(!box)return;
 if(!box.dataset.init){box.dataset.init=1;box.innerHTML=`<div class="bizh">Business Journal</div>
  <form id="bjAdd" class="bjadd"><input id="bjDate" type="date" required aria-label="Date"><input id="bjText" placeholder="New entry…" autocomplete="off" aria-label="Entry"><button class="primary" type="submit">+ Add</button></form>
  <div id="bjList"></div>`;
  const dt=$('#bjDate');if(dt&&typeof today==='function')dt.value=today();
  $('#bjAdd').onsubmit=e=>{e.preventDefault();if(bjAdd($('#bjDate').value,$('#bjText').value)){$('#bjText').value='';if(typeof today==='function')$('#bjDate').value=today()}};
  box.addEventListener('change',e=>{const el=e.target.closest('[data-bj]'),row=e.target.closest('[data-id]');if(!el||!row)return;const id=row.dataset.id,k=el.dataset.bj;
   if(k==='done')bjPatch(id,{done:el.checked});else if(k==='tag')bjPatch(id,{tag:el.value});else if(k==='status')bjPatch(id,{status:el.value})});
  box.addEventListener('click',e=>{const t=e.target.closest('[data-bj=edit]');if(!t||t.tagName==='INPUT')return;const cur=t.textContent;t.replaceWith(Object.assign(document.createElement('input'),{className:'bjedit',value:cur}));box.querySelector('.bjedit').focus()});
  box.addEventListener('keydown',e=>{const inp=e.target.closest('.bjedit');if(!inp)return;if(e.key==='Enter'){e.preventDefault();inp.blur()}else if(e.key==='Escape'){e.preventDefault();renderBiz()}});
  box.addEventListener('focusout',e=>{if(e.target.classList&&e.target.classList.contains('bjedit'))bjCommitEdit(e.target)})}
 drawBjList()}
