'use strict';
// ===== Anytime Review loop (meta key heymurph.meta.v1: {lastReviewAt, updatedAt}) =====
const MKEY='heymurph.meta.v1';
let META=(()=>{try{const m=JSON.parse(localStorage.getItem(MKEY));if(m&&typeof m==='object')return m}catch(e){}return{lastReviewAt:0,updatedAt:0}})();
const msave=()=>localStorage.setItem(MKEY,JSON.stringify(META));
const RQ=['What got done, and did it move the needle?','What\'s been sitting too long? Drop it or demote it.','What did I learn that changes the next ten?'];
const daysSince=t=>Math.floor((new Date(jday(Date.now())+'T00:00')-new Date(jday(t)+'T00:00'))/864e5);
function lastReview(){const fromJ=Math.max(0,...J.filter(e=>e.type==='Review').map(e=>e.created||0));return Math.max(META.lastReviewAt||0,fromJ)}
function rBadge(){const t=lastReview();if(!t)return{cls:'rv-red',txt:'Never reviewed',cta:'Review now'};const n=daysSince(t),
 d=new Date(t).toLocaleDateString(undefined,{day:'numeric',month:'short'});
 return{cls:n<=3?'rv-green':n<=7?'rv-amber':n<=13?'rv-coral':'rv-red',txt:`Last review: ${n===0?'today':n===1?'1 day ago':n+' days ago'} (${d})`,cta:n>=14?'Review due':'Review'}}
const rvEl=document.createElement('button');rvEl.id='review';rvEl.type='button';document.querySelector('#count').before(rvEl);
const rvJ=rvEl.cloneNode();rvJ.id='reviewJ';
function drawReview(){const b=rBadge();for(const e of[rvEl,rvJ]){e.className='rvb '+b.cls;e.innerHTML=`<span class="rvd"></span><span class="rvt">${b.txt}</span><span class="rvc">${b.cta} ›</span>`}
 rvEl.hidden=view!=='focus';const js=document.querySelector('#journal');if(view==='journal'&&js.firstChild!==rvJ)js.prepend(rvJ)}
const _render=render;render=function(){_render.apply(this,arguments);drawReview()};
const ageD=t=>{const n=daysSince(t||Date.now());return n===0?'today':n+'d'};
function openReview(){const lr=lastReview(),fo=openIn('focus').sort((a,b)=>a.created-b.created),old=openIn('cold').filter(i=>daysSince(i.created)>30).sort((a,b)=>a.created-b.created),
 dn=items.filter(i=>i.done&&(i.doneAt||0)>lr).sort((a,b)=>b.doneAt-a.doneAt),un=J.filter(e=>!e.exec&&e.stage!=='processed');
 const sec=(t,L,f,c)=>`<details class="rvs" ${L.length&&L.length<=8?'open':''}><summary style="--c:${c}">${t} <b>${L.length}</b></summary>${L.length?'<ul>'+L.map(f).join('')+'</ul>':'<p class="mut">None.</p>'}</details>`;
 $('#rvCtx').innerHTML=`<div class="mut">${lr?'Since your last review on '+new Date(lr).toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'}):'First review'}</div>`
 +sec('Open in Focus',fo,i=>`<li>${i.top?'★ ':''}${esc(i.title)} <i>${ageD(i.created)}</i></li>`,'#5F7BFF')
 +sec('Done since last review',dn,i=>`<li>✓ ${esc(i.title)} <i>${new Date(i.doneAt).toLocaleDateString(undefined,{day:'numeric',month:'short'})}</i></li>`,'#3ddc84')
 +sec('Cold Storage older than 30 days',old,i=>`<li>${esc(i.title)} <i>${ageD(i.created)}</i></li>`,'#3ED1C0')
 +sec('Journal still unprocessed',un,e=>`<li>${esc(jtitle(e))} <i>${ageD(e.created)}</i></li>`,'#FFB83F');
 $('#rvForm').querySelectorAll('textarea').forEach(t=>t.value='');$('#rvSheet').showModal()}
rvEl.onclick=rvJ.onclick=openReview;
$('#rvSheet').addEventListener('close',()=>{if($('#rvSheet').returnValue!=='save')return;const a=[...$('#rvForm').querySelectorAll('textarea')].map(t=>t.value.trim());
 const now=Date.now(),text=RQ.map((q,i)=>`**${q}**\n${a[i]||'—'}`).join('\n\n');
 J.push(jnorm({text,type:'Review',created:now,stage:'processed',processedAt:now,essence:'Review '+jday(now),exec:{dest:'notes',at:now}}));jsave();
 META.lastReviewAt=now;META.updatedAt=now;msave();toast('Review saved to Journal → Notes');render()});
drawReview();
