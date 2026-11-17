'use strict';
// ===== Business Journal (read-only; key heymurph.biz.v1, synced as businessJournal) =====
const BJKEY='heymurph.biz.v1';
function bjload(){try{const a=JSON.parse(localStorage.getItem(BJKEY));if(Array.isArray(a))return a}catch(e){}return[]}
let BJ=bjload();
const BJTAG={'Damage control':'#ff6b5e',PDC:'#ffb547',NS:'#a66bff'};
const BJST={'Yet to start':'#8aa0c8','In progress':'#ffb547',Done:'#3ddc84'};
const isBizNote=e=>/^\s*>/.test(e&&e.text||'')||!(e&&e.status);
const bjfmt=d=>{const t=Date.parse(String(d||'')+'T12:00:00+05:30');if(isNaN(t))return String(d||'');
 return new Date(t).toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'})};
function bjsave(){localStorage.setItem(BJKEY,JSON.stringify(BJ))}
function bjImport(arr){if(!Array.isArray(arr))return;BJ=arr;bjsave()}
function renderBiz(){const box=$('#biz');if(!box)return;const L=Array.isArray(BJ)?BJ:[];
 const days=[...new Set(L.map(e=>e.date).filter(Boolean))].sort((a,b)=>String(b).localeCompare(String(a)));
 let h='<div class="bizh">Business Journal <small>read-only</small></div>';
 if(!days.length)h+='<div class="empty">No entries yet.</div>';
 for(const d of days){h+=`<h3 class="jday">${esc(bjfmt(d))}</h3>`;
  for(const e of L.filter(x=>x.date===d)){if(isBizNote(e)){h+=`<div class="bizn">${esc(String(e.text||'').replace(/^\s*>\s?/,''))}</div>`;continue}
   const done=!!e.done||e.status==='Done';
   h+=`<div class="bize${done?' done':''}"><span class="bizchk" aria-hidden="true">${done?'☑':'☐'}</span><div class="bizt">${esc(e.text||'')}</div><div class="bizm">${e.tag?`<span class="tag" style="--c:${BJTAG[e.tag]||'#8f6bff'}">${esc(e.tag)}</span>`:''}${e.status?`<span class="tag" style="--c:${BJST[e.status]||'#8aa0c8'}">${esc(e.status)}</span>`:''}</div></div>`}}
 box.innerHTML=h}
