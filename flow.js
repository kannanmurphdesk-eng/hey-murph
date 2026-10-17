'use strict';
// ===== The Flow dashboard. Flow lists (po/del/pay) are ordinary tasks in `items`.
// Legacy heymurph.flow.v1 entries are migrated into items once.
const FKEY='heymurph.flow.v1',FC={po:'#5F7BFF',del:'#2fd3e0',pay:'#ffb547'};
let F=(()=>{try{const f=JSON.parse(localStorage.getItem(FKEY));if(Array.isArray(f))return f}catch(e){}return[]})();
const fsave=()=>localStorage.setItem(FKEY,JSON.stringify(F));
function fmigrate(){if(!F.length)return;for(const x of F){if(items.some(i=>i.id===x.id))continue;const t=mk(x.title||'',FLOWV.includes(x.list)?x.list:'po',{subs:x.subs,cm:x.cm,month:x.month,done:x.done});t.id=x.id;t.created=x.created||Date.now();if(x.notes)t.notes=x.notes;items.push(t)}F=[];fsave();save()}
fmigrate();
function renderFlow(){fmigrate();const sec=$('#flow');
 const subs=l=>{let o=0,t=0;openIn(l).forEach(x=>(x.subs||[]).forEach(s=>{t++;if(!s.done)o++}));return[o,t]};
 const tot=FLOWV.reduce((a,l)=>a+openIn(l).length,0);
 const dash=FLOWV.map(l=>{const[o,t]=subs(l);const cm=l==='po'?openIn('po').reduce((a,x)=>a+(+x.cm||0),0):0;return`<button class="fd${view===l?' on':''}" data-fl="${l}" style="--c:${FC[l]}"><b>${openIn(l).length}</b><span>${LN[l]}</span>${l==='po'?`<small class="fcm">${fcm(cm)||'₹0 L'} CM</small>`:''}<small>${o}/${t} sub-tasks open</small></button>`}).join('');
 const tl=CAPPED.concat('cold').map(l=>`${LN[l]} <b>${openIn(l).length}</b>`).join(' · ');
 sec.innerHTML=`<div class="fh">The Flow <span>${tot} open</span></div><div class="fdash">${dash}</div><div class="ftasks">Tasks: ${tl}</div>`;
 sec.querySelectorAll('[data-fl]').forEach(b=>b.onclick=()=>{view=b.dataset.fl;render()})}
