// ===== Day log for a habit (out duty): type, place, plan vs actual, monthly counts =====
const DLT=[['local','Local','🏙'],['out','Outstation','🚆'],['office','Office','🏢'],['hol','Holiday','🎉'],['leave','Leave','🌴'],['wo','WO','🛋']];
const dlName=k=>(DLT.find(t=>t[0]===k)||['','—',''])[1],dlIco=k=>(DLT.find(t=>t[0]===k)||['','',''])[2];
let dlMon=dAgo(0).slice(0,7);
const fmd=d=>new Date(d+'T00:00').toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short'});
function dlPanel(i){const h=H.habits[i],L=h.log||{},t=dAgo(0),ks=Object.keys(L).filter(d=>d.startsWith(dlMon)&&!L[d].del).sort();
 const cnt=Object.fromEntries(DLT.map(x=>[x[0],0]));ks.forEach(d=>{const e=L[d];if(e.type&&(e.act||d<=t))cnt[e.type]++});
 const plans=ks.filter(d=>d>t).length,ml=new Date(dlMon+'-01T00:00').toLocaleDateString('en-IN',{month:'long',year:'numeric'});
 return `<div class="dlp"><div class="dlh"><button data-dlm="-1" aria-label="Previous month">‹</button><b>${ml}</b><button data-dlm="1" aria-label="Next month">›</button><button class="dladd" data-dla="${i}">＋ Add day</button></div>
 <div class="dlc">${DLT.map(x=>`<div><b>${cnt[x[0]]}</b><span>${x[2]} ${x[1]}</span></div>`).join('')}</div>${plans?`<div class="dlpl">${plans} planned day${plans>1?'s':''} ahead</div>`:''}
 <ul class="dll">${ks.length?ks.map(d=>{const e=L[d];return `<li data-dle="${i}" data-d2="${d}" class="${d>t?'fut':''}${d===t?' tdy':''}"><div class="dld">${fmd(d)}<span>${dlIco(e.type)} ${dlName(e.type)}${e.place?' · '+esc(e.place):''}</span></div>
  <div class="dlpa"><div><i>Plan</i>${e.plan?esc(e.plan):'—'}</div><div><i>Actual</i>${e.act?esc(e.act):(d>t?'<em>upcoming</em>':'—')}</div></div></li>`}).join(''):'<li class="dlnone">No days logged this month.</li>'}</ul></div>`}
let dlCur=null;
function dlOpen(i,d){const h=H.habits[i],e=(h.log||{})[d]||{};dlCur={i};let g=document.getElementById('dlog');
 if(!g){g=document.createElement('dialog');g.id='dlog';document.body.appendChild(g);
  g.innerHTML=`<form method="dialog" id="dlForm"><h3>Day log</h3><label>Date<input type="date" name="d" required></label>
  <div class="dlty">${DLT.map(x=>`<label><input type="radio" name="type" value="${x[0]}"><span>${x[2]} ${x[1]}</span></label>`).join('')}</div>
  <label>Place<input name="place" maxlength="80" placeholder="e.g. NIT Karaikal, Chennai"></label>
  <label>Plan<textarea name="plan" rows="2" maxlength="400" placeholder="What is planned for the day"></textarea></label>
  <label>Actual activity<textarea name="act" rows="3" maxlength="600" placeholder="What actually happened"></textarea></label>
  <div class="row"><button value="del" class="danger" formnovalidate>Delete</button><button value="cancel" formnovalidate>Cancel</button><button value="save" class="primary">Save</button></div></form>`;
  g.addEventListener('close',dlClose);g.querySelector('[name=d]').addEventListener('change',ev=>{const f=g.querySelector('form'),x=(H.habits[dlCur.i].log||{})[ev.target.value]||{};dlFill(f,x)})}
 const f=g.querySelector('form');f.d.value=d;dlFill(f,e);g.returnValue='';g.showModal()}
function dlFill(f,e){f.querySelectorAll('[name=type]').forEach(r=>r.checked=r.value===(e.type||''));f.place.value=e.place||'';f.plan.value=e.plan||'';f.act.value=e.act||''}
function dlClose(){const g=document.getElementById('dlog'),r=g.returnValue,f=g.querySelector('form');if(!dlCur)return;const h=H.habits[dlCur.i],d=f.d.value;dlCur=null;if(!d||(r!=='save'&&r!=='del'))return;
 h.log=h.log||{};h.ts=h.ts||{};const now=Date.now(),t=dAgo(0);
 if(r==='del'){if(!h.log[d])return;h.log[d]={del:1,ts:now}}
 else{const ty=(f.querySelector('[name=type]:checked')||{}).value||'';h.log[d]={type:ty,place:f.place.value.trim(),plan:f.plan.value.trim(),act:f.act.value.trim(),ts:now};
  if(d<=t&&!h.days[d]&&['local','out','office'].includes(ty)){h.days[d]=1;h.ts[d]=now}dlMon=d.slice(0,7)}
 H.updatedAt=now;hsave();view==='travel'?renderTravel():renderHabits()}
$('#habits').addEventListener('click',e=>{const m=e.target.closest('[data-dlm]'),a=e.target.closest('[data-dla]'),l=e.target.closest('[data-dle]'),tg=e.target.closest('[data-dlt]');
 if(m){const[y,mo]=dlMon.split('-').map(Number),n=new Date(y,mo-1+Number(m.dataset.dlm),1);dlMon=n.getFullYear()+'-'+String(n.getMonth()+1).padStart(2,'0');renderHabits()}
 else if(a)dlOpen(+a.dataset.dla,dAgo(0).slice(0,7)===dlMon?dAgo(0):dlMon+'-01');
 else if(l)dlOpen(+l.dataset.dle,l.dataset.d2);
 else if(tg){const h=H.habits[tg.dataset.dlt];h.dl=!h.dl;H.updatedAt=Date.now();hsave();renderHabits()}});
// ===== Travel data view (built from the out duty day log) =====
const dlHi=()=>{const i=H.habits.findIndex(h=>h.dl);return i<0?null:i};
function dlCounts(h,mon){const L=h.log||{},t=dAgo(0),c=Object.fromEntries(DLT.map(x=>[x[0],0]));let od=0;
 Object.keys(L).filter(d=>d.startsWith(mon)&&!L[d].del&&d<=t).forEach(d=>{if(L[d].type)c[L[d].type]++});Object.keys(h.days).forEach(d=>{if(d.startsWith(mon)&&h.days[d])od++});return{c,od}}
function renderTravel(){const el=$('#travel'),i=dlHi();if(i===null){el.innerHTML=`<div class="hcard"><p>Turn on the day log on your out duty habit (Habits tab) to start your travel data.</p></div>`;return}
 const h=H.habits[i],L=h.log||{},mons=[...new Set(Object.keys(L).filter(d=>!L[d].del).map(d=>d.slice(0,7)))].sort().reverse(),pl=new Set();
 Object.keys(L).filter(d=>d.startsWith(dlMon)&&!L[d].del&&d<=dAgo(0)).forEach(d=>(L[d].place||'').split(',').map(s=>s.trim()).filter(s=>s&&s!=='Office').forEach(s=>pl.add(s)));
 const{od}=dlCounts(h,dlMon);
 el.innerHTML=`<div class="hcard" style="--c:${h.color}"><div class="hhead"><span class="hname static">🧳 Travel data</span><button class="dlcsv" data-csv="${i}">⬇ CSV</button></div>
 <div class="tvs"><div><b>${od}</b><span>out duty days</span></div><div><b>${pl.size}</b><span>places visited</span></div></div>${dlPanel(i)}</div>
 <div class="hcard"><div class="hhead"><span class="hname static">Month by month</span></div><table class="tvy"><tr><th>Month</th>${DLT.map(x=>`<th title="${x[1]}">${x[2]}</th>`).join('')}<th>OD</th></tr>
 ${mons.map(m=>{const{c,od}=dlCounts(h,m);return `<tr data-tvm="${m}" class="${m===dlMon?'on':''}"><td>${new Date(m+'-01T00:00').toLocaleDateString('en-IN',{month:'short',year:'2-digit'})}</td>${DLT.map(x=>`<td>${c[x[0]]||''}</td>`).join('')}<td><b>${od}</b></td></tr>`}).join('')||'<tr><td colspan="8">No data yet</td></tr>'}</table></div>`}
function dlCsv(i){const h=H.habits[i],L=h.log||{},q=s=>'"'+String(s||'').replace(/"/g,'""')+'"';
 const rows=Object.keys(L).filter(d=>d.startsWith(dlMon)&&!L[d].del).sort().map(d=>[d,dlName(L[d].type),L[d].place,L[d].plan,L[d].act,h.days[d]?'Yes':''].map(q).join(','));
 const txt='Date,Type,Place,Plan,Actual,Out duty\n'+rows.join('\n');if(typeof share==='function')share(`travel-${dlMon}.csv`,txt,'text/csv');else{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([txt],{type:'text/csv'}));a.download=`travel-${dlMon}.csv`;a.click()}}
$('#travel').addEventListener('click',e=>{const m=e.target.closest('[data-dlm]'),a=e.target.closest('[data-dla]'),l=e.target.closest('[data-dle]'),cv=e.target.closest('[data-csv]'),tm=e.target.closest('[data-tvm]');
 if(m){const[y,mo]=dlMon.split('-').map(Number),n=new Date(y,mo-1+Number(m.dataset.dlm),1);dlMon=n.getFullYear()+'-'+String(n.getMonth()+1).padStart(2,'0');renderTravel()}
 else if(a)dlOpen(+a.dataset.dla,dAgo(0).slice(0,7)===dlMon?dAgo(0):dlMon+'-01');else if(l)dlOpen(+l.dataset.dle,l.dataset.d2);else if(cv)dlCsv(+cv.dataset.csv);
 else if(tm){dlMon=tm.dataset.tvm;renderTravel()}});
function dlMini(i){const h=H.habits[i],{c,od}=dlCounts(h,dAgo(0).slice(0,7));return `<div class="dlmini"><span>This month: ${od} OD · ${c.out} 🚆 · ${c.local} 🏙 · ${c.office} 🏢</span><button data-tvgo="1">Travel data ›</button></div>`}
$('#habits').addEventListener('click',e=>{if(e.target.closest('[data-tvgo]')){view='travel';render()}});
