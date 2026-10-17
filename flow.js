'use strict';
// ===== The Flow: PO funnel / Delivery cases / Payment pending (key heymurph.flow.v1) =====
const FKEY='heymurph.flow.v1',FL={po:'PO funnel',del:'Delivery cases',pay:'Payment pending'},FC={po:'#5F7BFF',del:'#2fd3e0',pay:'#ffb547'};
function fload(){try{const f=JSON.parse(localStorage.getItem(FKEY));if(Array.isArray(f))return f}catch(e){}return[]}
let F=fload(),fv='po',fcur=null;
const fmon=m=>{if(!m)return'';const[y,mo]=m.split('-');return new Date(+y,+mo-1,1).toLocaleString('en-IN',{month:'short',year:'numeric'})};
const fcm=v=>v?'₹'+(+v).toLocaleString('en-IN',{maximumFractionDigits:2})+' L':'';
const fsave=()=>localStorage.setItem(FKEY,JSON.stringify(F));
const fopen=l=>F.filter(x=>x.list===l&&!x.done);
function renderFlow(){const sec=$('#flow');
 const subs=l=>{let o=0,t=0;fopen(l).forEach(x=>(x.subs||[]).forEach(s=>{t++;if(!s.done)o++}));return[o,t]};
 const tot=Object.keys(FL).reduce((a,l)=>a+fopen(l).length,0);
 const dash=Object.keys(FL).map(l=>{const[o,t]=subs(l);const cm=l==='po'?fopen('po').reduce((a,x)=>a+(+x.cm||0),0):0;return`<button class="fd${fv===l?' on':''}" data-fl="${l}" style="--c:${FC[l]}"><b>${fopen(l).length}</b><span>${FL[l]}</span>${l==='po'?`<small class="fcm">${fcm(cm)||'₹0 L'} CM</small>`:''}<small>${o}/${t} sub-tasks open</small></button>`}).join('');
 const tl=typeof LN!=='undefined'?Object.keys(LN).map(l=>`${LN[l]} <b>${openIn(l).length}</b>`).join(' · '):'';
 const L=fopen(fv).sort(fv==='po'?((a,b)=>(a.month||'9999').localeCompare(b.month||'9999')||b.created-a.created):((a,b)=>b.created-a.created));
 sec.innerHTML=`<div class="fh">The Flow <span>${tot} open</span></div><div class="fdash">${dash}</div><div class="ftasks">Tasks: ${tl}</div>
 <form id="fadd" class="fadd"><input id="faddIn" placeholder="Add to ${FL[fv]}…" autocomplete="off"><button>Add</button></form>
 <ul class="flist">${L.map(x=>{const s=x.subs||[],d=s.filter(y=>y.done).length;return`<li data-fid="${x.id}" style="--c:${FC[x.list]}"><div class="ft">${esc(x.title)}</div><div class="fm">${x.list==='po'&&(x.cm||x.month)?`<b class="fpo">${[fcm(x.cm),fmon(x.month)].filter(Boolean).join(' · ')}</b> `:''}${s.length?`☑ ${d}/${s.length}`:''}${x.notes?' · 📝 '+esc(x.notes.split('\n')[0].slice(0,60)):''}</div>${s.length?`<div class="fbar"><i style="width:${Math.round(d/s.length*100)}%"></i></div>`:''}</li>`}).join('')||'<li class="empty">Nothing here yet.</li>'}</ul>
 ${F.some(x=>x.list===fv&&x.done)?`<details class="fclosed"><summary>Closed (${F.filter(x=>x.list===fv&&x.done).length})</summary>${F.filter(x=>x.list===fv&&x.done).map(x=>`<div data-fid="${x.id}">✓ ${esc(x.title)}</div>`).join('')}</details>`:''}`;
 sec.querySelectorAll('[data-fl]').forEach(b=>b.onclick=()=>{fv=b.dataset.fl;renderFlow()});
 $('#fadd').onsubmit=e=>{e.preventDefault();const t=$('#faddIn').value.trim();if(!t)return;F.push({id:uid(),list:fv,title:t,notes:'',subs:[],done:false,created:Date.now()});fsave();renderFlow()};
 sec.querySelectorAll('[data-fid]').forEach(li=>li.onclick=()=>fedit(li.dataset.fid))}
function fedit(id){fcur=F.find(x=>x.id===id);if(!fcur)return;let d=$('#fdlg');if(!d){d=document.createElement('dialog');d.id='fdlg';document.body.appendChild(d)}
 const draw=()=>{const x=fcur;d.innerHTML=`<form method="dialog" class="fform"><input name="title" value="${esc(x.title)}" class="fti">
 <label>List <select name="list">${Object.keys(FL).map(l=>`<option value="${l}"${l===x.list?' selected':''}>${FL[l]}</option>`).join('')}</select></label>
 ${x.list==='po'?`<div class="fpog"><label>Expected CM (₹ lakh)<input name="cm" type="number" step="0.01" min="0" inputmode="decimal" value="${x.cm||''}" placeholder="e.g. 2.5"></label><label>Expected month<input name="month" type="month" value="${x.month||''}"></label></div>`:''}
 <div class="fsl">Sub-tasks</div><div class="fsubs">${(x.subs||[]).map((s,i)=>`<div class="fsub"><input type="checkbox" data-si="${i}"${s.done?' checked':''}><span class="${s.done?'dn':''}">${esc(s.t)}</span><button type="button" data-sd="${i}" aria-label="Delete">✕</button></div>`).join('')}</div>
 <div class="fsadd"><input id="fsIn" placeholder="Add sub-task…"><button type="button" id="fsBtn">+</button></div>
 <div class="fsl">Notes</div><textarea name="notes" rows="5" placeholder="Notes…">${esc(x.notes||'')}</textarea>
 <div class="frow"><button value="del" class="danger">Delete</button><button value="close">${x.done?'Reopen':'Close case'}</button><button value="save" class="pri">Save</button></div></form>`;
  const keep=()=>{const f=d.querySelector('form');x.title=f.title.value.trim()||x.title;x.notes=f.notes.value;if(f.cm){x.cm=f.cm.value;x.month=f.month.value}};
  d.querySelectorAll('[data-si]').forEach(c=>c.onchange=()=>{x.subs[c.dataset.si].done=c.checked;keep();fsave();draw()});
  d.querySelectorAll('[data-sd]').forEach(b=>b.onclick=()=>{x.subs.splice(b.dataset.sd,1);keep();fsave();draw()});
  const addS=()=>{const v=d.querySelector('#fsIn').value.trim();if(!v)return;keep();(x.subs=x.subs||[]).push({t:v,done:false});fsave();draw();d.querySelector('#fsIn').focus()};
  d.querySelector('#fsBtn').onclick=addS;d.querySelector('#fsIn').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();addS()}}};
 draw();d.onclose=()=>{const r=d.returnValue,x=fcur,f=d.querySelector('form');fcur=null;if(!x)return;
  if(r==='del'){if(confirm('Delete "'+x.title+'"?')){F=F.filter(y=>y!==x);fsave()}renderFlow();return}
  x.title=f.title.value.trim()||x.title;x.notes=f.notes.value;if(f.cm){x.cm=f.cm.value;x.month=f.month.value}x.list=f.list.value;if(r==='close')x.done=!x.done;fsave();renderFlow()};
 d.returnValue='';d.showModal()}
