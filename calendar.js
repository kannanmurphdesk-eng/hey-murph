'use strict';
// ===== Travel calendar (Habits › Travel): month grid of the out duty day log + tasks due per day. UI only: reads habit log and task `due`, writes through dlOpen / mk / toggleDone / openEdit.
const CALC={local:'#2fd3e0',out:'#ff8a3d',office:'#8f9bb3',hol:'#ff7ad9',leave:'#3ddc84',wo:'#a58bff'};
const calIso=dt=>new Date(dt-dt.getTimezoneOffset()*6e4).toISOString().slice(0,10);
const calLog=d=>{const i=dlHi();if(i===null)return null;const e=(H.habits[i].log||{})[d];return e&&!e.del?e:null};
const calDue=d=>items.filter(x=>x.due===d);
let calV='grid'; // Grid | List (full month either way)
function calCell(d,t){const e=calLog(d),open=calDue(d).filter(x=>!x.done),od=d<t&&open.length,dn=+d.slice(8),dow=new Date(d+'T00:00').getDay();
 return `<button class="calc${d===t?' tdy':''}${dow===0?' sun':''}${e&&e.type?' lg':''}${d>t?' fut':''}" data-cal="${d}"${e&&e.type?` style="--tc:${CALC[e.type]||'#8f6bff'}"`:''} aria-label="${fmd(d)}${e&&e.type?', '+dlName(e.type):''}${open.length?', '+open.length+' task(s)':''}">
 <span class="cdn">${dn}</span>${e&&e.type?`<span class="cem">${dlIco(e.type)}</span>`:''}${e&&e.place?`<span class="cpl">${esc(e.place.split(',')[0])}</span>`:''}${open.length?`<span class="ctk${od?' od':''}">${open.length}</span>`:''}</button>`}
function calRow(d,t){const e=calLog(d),L=calDue(d).filter(x=>!x.done),dt=new Date(d+'T00:00'),dow=dt.getDay(),rm=e&&(e.plan||e.act);
 return `<button class="calr${d===t?' tdy':''}${dow===0?' sun':''}${e&&e.type?' lg':''}${d>t?' fut':''}" data-cal="${d}"${e&&e.type?` style="--tc:${CALC[e.type]||'#8f6bff'}"`:''}><span class="crd"><b>${dt.getDate()}</b><small>${dt.toLocaleDateString('en-IN',{weekday:'short'})}</small></span>
 <span class="crb">${e&&e.type?`<span class="crl">${dlIco(e.type)} ${dlName(e.type)}${e.place?' · '+esc(e.place):''}</span>`:''}${rm?`<span class="crm">${esc(rm)}</span>`:''}${L.map(x=>`<span class="crt${d<t?' od':''}">☐ ${esc(x.title)}</span>`).join('')}${!(e&&e.type)&&!rm&&!L.length?'<span class="cr0">—</span>':''}</span></button>`}
function calHtml(){const[y,m]=dlMon.split('-').map(Number),first=new Date(y,m-1,1),n=new Date(y,m,0).getDate(),lead=(first.getDay()+6)%7,t=dAgo(0),days=[];for(let dd=1;dd<=n;dd++)days.push(`${dlMon}-${String(dd).padStart(2,'0')}`);
 let cells='';for(let k=0;k<lead;k++)cells+='<span class="calc nil"></span>';cells+=days.map(d=>calCell(d,t)).join('');for(let k=(lead+n)%7?7-(lead+n)%7:0;k>0;k--)cells+='<span class="calc nil"></span>';
 const ml=first.toLocaleDateString('en-IN',{month:'long',year:'numeric'}),due=items.filter(x=>!x.done&&x.due&&x.due.startsWith(dlMon)).length;
 return `<div class="hcard calcard" id="calCard" style="--c:#FFB83F"><div class="calh"><button data-dlm="-1" aria-label="Previous month">‹</button><b>${ml}</b><button data-dlm="1" aria-label="Next month">›</button><button class="caltd" data-caltoday="1"${dlMon===t.slice(0,7)?' disabled':''}>Today</button></div>
 <div class="caltg"><button data-calv="grid" class="${calV==='grid'?'on':''}">▦ Month grid</button><button data-calv="list" class="${calV==='list'?'on':''}">☰ Month list</button></div>
 ${calV==='list'?`<div class="call">${days.map(d=>calRow(d,t)).join('')}</div>`:`<div class="calw">${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((w,k)=>`<span${k===6?' class="sun"':''}>${w}</span>`).join('')}</div><div class="calg">${cells}</div>`}
 <div class="calf"><span>${calV==='list'?'Every day of the month':'Full month · weeks Mon–Sun'} · tap a day to log or add tasks</span><span>${due?`${due} task${due>1?'s':''} due`:''}</span></div></div>`}
const _calRT=renderTravel;renderTravel=function(){_calRT.apply(this,arguments);$('#travel').insertAdjacentHTML('afterbegin',calHtml());const g=$('#calDay');if(g&&g.open)calDraw()};
$('#travel').addEventListener('click',e=>{const c=e.target.closest('[data-cal]'),td=e.target.closest('[data-caltoday]'),cv=e.target.closest('[data-calv]');if(cv){calV=cv.dataset.calv;renderTravel()}else if(c)calOpen(c.dataset.cal);else if(td){dlMon=dAgo(0).slice(0,7);renderTravel()}});
// ---- day sheet
let calD=null;
function calOpen(d){calD=d;let g=$('#calDay');if(g)g.innerHTML='';if(!g){g=document.createElement('dialog');g.id='calDay';document.body.appendChild(g);
  g.addEventListener('click',e=>{const a=e.target.closest('[data-ca]');if(!a)return;const k=a.dataset.ca;
   if(k==='close')g.close();else if(k==='dl'){const i=dlHi();if(i!==null)dlOpen(i,calD)}
   else if(k==='done')toggleDone(a.closest('[data-id]').dataset.id);else if(k==='edit')openEdit(a.closest('[data-id]').dataset.id)});
  g.addEventListener('submit',e=>{e.preventDefault();const f=e.target,t=f.t.value.trim(),l=f.l.value;if(!t||!calD)return;if(!canIn(l))return;
   items.push(mk(t,l,{due:calD}));save();f.t.value='';toast('Task added for '+fmd(calD)+' → '+LN[l]);render();calDraw()})}
 calDraw();if(!g.open)g.showModal()}
function calDraw(){const g=$('#calDay');if(!g||!calD)return;const d=calD,t=dAgo(0),i=dlHi(),e=calLog(d),L=calDue(d).sort((a,b)=>a.done-b.done);
 const def=openIn('focus').length>=CAP?'next':'focus',keep=g.querySelector('#calT'),kv=keep?keep.value:'',kl=g.querySelector('#calL');const lv=kl?kl.value:def;
 g.innerHTML=`<div class="rvtop"><div class="rvh">${new Date(d+'T00:00').toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}${d===t?' · Today':''}</div><button data-ca="close" class="x" aria-label="Close">✕</button></div>
 <div class="jlab">Day log</div>${i===null?'<p class="hmmut">Turn on the day log on your out duty habit to log days.</p>':e&&e.type?`<div class="cdl" style="--tc:${CALC[e.type]||'#8f6bff'}"><b>${dlIco(e.type)} ${dlName(e.type)}</b>${e.place?`<span>${esc(e.place)}</span>`:''}${e.plan||e.act?`<p>${esc(e.plan||e.act)}</p>`:''}<button data-ca="dl">✎ Edit day log</button></div>`:`<button class="cadd" data-ca="dl">＋ Add day log${d>t?' (plan)':''}</button>`}
 <div class="jlab">Tasks due (${L.filter(x=>!x.done).length})</div><ul class="calt">${L.map(x=>`<li class="${x.done?'dn':''}" data-id="${x.id}" style="--stripe:${x.tags[0]?TC[x.tags[0]]:x.top?'#f5c96a':'#8f6bff'}"><button class="chk${x.done?' on':''}" data-ca="done" aria-label="${x.done?'Undo':'Done'}">${x.done?'✓':''}</button><div class="body" data-ca="edit"><div class="t">${esc(x.title)}</div><div class="m">${LN[x.list]||''}${!x.done&&d<t?' · <span class="od">overdue</span>':''}</div></div></li>`).join('')||'<li class="empty">No tasks due this day.</li>'}</ul>
 <form class="caf"><div class="jlab">＋ Add task for this day</div><input name="t" id="calT" placeholder="Task title…" autocomplete="off" maxlength="200"><div class="cafr"><select name="l" id="calL">${Object.keys(LN).map(l=>`<option value="${l}"${l===lv?' selected':''}>${LN[l]}${CAPPED.includes(l)?` (${openIn(l).length}/${CAP})`:''}</option>`).join('')}</select><button class="primary">Add</button></div></form>`;
 g.querySelector('#calT').value=kv}
// ---- next 7 days strip (Home)
function cal7(){const t=new Date(),c=[];for(let k=0;k<7;k++){const dt=new Date(t);dt.setDate(t.getDate()+k);const d=calIso(dt),e=calLog(d),n=calDue(d).filter(x=>!x.done).length;
  c.push(`<button class="c7${k?'':' tdy'}" data-c7="${d}"${e&&e.type?` style="--tc:${CALC[e.type]}"`:''}><span>${k?dt.toLocaleDateString('en-IN',{weekday:'short'}):'Today'}</span><b>${e&&e.type?dlIco(e.type):dt.getDate()}</b><small>${n?n+' ✓':''}</small></button>`)}
 return `<div class="c7s" title="Next 7 days: tap to open the calendar">${c.join('')}</div>`}
function cal7Go(d){dlMon=d.slice(0,7);view='travel';render();scrollTo(0,0);calOpen(d)}
