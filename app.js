'use strict';
const TAGS=['damage control','preventive damage control','overdue','quick wins','delegation','necessary task'];
const TC={'damage control':'#ff6b5e','preventive damage control':'#ffb547','overdue':'#ff4fb4','quick wins':'#3ddc84','delegation':'#2fd3e0','necessary task':'#a66bff'};
const CAP=10,TOPCAP=3,KEY='heymurph.v1';
const FTAGS=['damage control','preventive damage control','quick wins','necessary task'];
const LN={focus:'Focus',todo:'To do',cold:'Cold Storage',po:'PO funnel',del:'Delivery cases',pay:'Payment pending'},CAPPED=['focus'],FLOWV=['po','del','pay'];
const fmon=m=>{if(!m)return'';const[y,mo]=m.split('-');return new Date(+y,+mo-1,1).toLocaleString('en-IN',{month:'short',year:'numeric'})};
const dmon=d=>d?new Date(d.slice(0,7)+'-01T00:00').toLocaleString('en-US',{month:'short',year:'numeric'}):'',fcm=v=>v?'₹'+(+v).toLocaleString('en-IN',{maximumFractionDigits:2})+' L':'';
let fview='po';
let items=load(),view='home',tview='focus',hview='habits';
const SEG=v=>v==='home'?'home':v==='customers'?'customers':v==='journal'?'journal':(v==='habits'||v==='travel')?'habits':'tasks';
const TSEG=['focus','todo','cold','po','del','pay','done'],TSL={focus:'Focus',todo:'To do',cold:'Cold',po:'PO',del:'Delivery',pay:'Payment',done:'Done'};
const $=s=>document.querySelector(s);
function load(){try{return JSON.parse(localStorage.getItem(KEY))||[]}catch(e){return[]}}
function save(){localStorage.setItem(KEY,JSON.stringify(items))}
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const today=()=>new Date(Date.now()-new Date().getTimezoneOffset()*6e4).toISOString().slice(0,10);
const openIn=l=>items.filter(i=>!i.done&&i.list===l);
const isOver=i=>!i.done&&i.due&&i.due<today();
function toast(m){const t=$('#toast');t.textContent=m;t.style.display='block';clearTimeout(toast.h);toast.h=setTimeout(()=>t.style.display='none',2800)}
function canIn(l){if(CAPPED.includes(l)&&openIn(l).length>=CAP){toast(LN[l]+' is full (10). Move or finish something first.');return false}return true}
const canFocus=()=>canIn('focus');
const subsOf=o=>{const a=Array.isArray(o.subs)?o.subs:Array.isArray(o.subtasks)?o.subtasks:[];return a.map(s=>typeof s==='string'?{t:s,done:false}:{t:String(s.t||s.title||''),done:!!s.done}).filter(s=>s.t)};
function mk(title,list,o={}){return{id:uid(),title:title.trim(),list,tags:(o.tags||[]).filter(t=>TAGS.includes(t)),due:o.due||'',customer:(o.customer||'').trim(),top:!!o.top&&list==='focus',done:!!o.done,created:Date.now(),doneAt:o.done?Date.now():null,...(subsOf(o).length?{subs:subsOf(o)}:{}),...(o.important?{important:true}:{}),...(o.urgent?{urgent:true}:{}),...(o.topic?{topic:String(o.topic)}:{}),...(o.cm?{cm:String(o.cm)}:{}),...(o.month?{month:String(o.month)}:{})}}
function add(title,list){if(!title.trim())return false;if(!canIn(list))return false;items.push(mk(title,list));save();render();return true}
function move(id,to){const i=items.find(x=>x.id===id);if(i&&i.list==='focus'&&!i.done&&to!=='focus')return render();if(!to||to===i.list||!canIn(to))return render();i.list=to;if(to!=='focus')i.top=false;save();render()}
function toggleDone(id){const i=items.find(x=>x.id===id);if(i.done&&!canIn(i.list))return;i.done=!i.done;i.doneAt=i.done?Date.now():null;if(i.done)i.top=false;save();render()}
function esc(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
// v65: Under radar and Next action are retired; anything still there (old data or ops) goes to Cold storage.
function legacyMove(){let c=0;for(const i of items)if(i.list==='next'||i.list==='radar'){i.list='cold';i.top=false;i.updatedAt=Date.now();c++}if(c)save()}
// v65 one-time: open Focus tasks become topics (no tag) and their action goes to To do. Deterministic ids so it is safe to run on more than one device.
const V65T={mvor0n2bdv159:'NIT Calicut - Pario',mvmrzfi9ps583:'IIT Dharwad - Tempos',mvm34e7ado6yq:'ICAR-CICR - Atmos 41',mve8wcaxz4zdc:'IIT Palakkad - Hyprop 3',mvvpxntccgcbq:'BITS Pilani - DAQ',mvojuzk5ijutn:'ideaForge - Requirements',mvclmoz0umm3o:'NCESS - Hyprop',mv80tj7e9636n:'IIT Palakkad - Quote feedback',mvk4r2xk74jbn:'JTEKT - Torque',mvktkj5bmf2ru:'SRM - DT80'};
// v73: merge duplicate PO cards once (keep <- drop); drop goes Not active, nothing deleted
const V73M=[['mvgw5ekegfk6o','mv6ukfsqnfad3'],['mvgw5ekeey6p6','mv7s3u1rbmm81'],['mvgw5ekeaw7om','mv7rhqkopencx'],['mvgw5ekfd0pia','mv8abdqxkaqp8']];
function v73merge(){let c=0;const now=Date.now(),bl=v=>v==null||String(v).trim()==='';
 for(const[k,x]of V73M){const a=items.find(i=>i.id===k),b=items.find(i=>i.id===x);if(!a||!b||b.mrg)continue;
  for(const f of['customer','pot','cost','quoted','prob','due','principal','model','eu','nxt','notes','stage','month','cm'])if(bl(a[f])&&!bl(b[f]))a[f]=b[f];
  for(const f of['swS','swW','swO','swT']){if(bl(a[f])&&!bl(b[f]))a[f]=b[f];else if(!bl(b[f])&&a[f]!==b[f])a[f]=b[f]+' · '+a[f]}
  if(!bl(b.cm)&&!bl(a.cm)&&String(a.cm)!==String(b.cm))a.nxt=(a.nxt?a.nxt+' ':'')+'(Merged card had CM '+b.cm+' L.)';
  a.tags=[...new Set([...(a.tags||[]),...(b.tags||[])])];
  for(const i of items)if(i.po===x){i.po=k;i.updatedAt=now}
  b.active=false;b.mrg=k;a.updatedAt=now;b.updatedAt=now;c++}
 if(c)save()}
function v65mig(){let c=0;
 for(const i of items.filter(x=>x.list==='focus'&&!x.done&&!x.v65&&V65T[x.id])){const tid='td_'+i.id;
  if(!items.some(x=>x.id===tid)){const t=mk(i.title,'todo',{due:i.due,subs:i.subs,important:i.tags.includes('damage control'),urgent:i.tags.includes('damage control'),topic:i.id,customer:i.customer});t.id=tid;t.updatedAt=Date.now();if(i.notes)t.notes=i.notes;if(i.jid)t.jid=i.jid;items.push(t)}
  i.title=V65T[i.id];i.tags=[];i.due='';delete i.subs;i.top=false;i.v65=2;i.updatedAt=Date.now();c++}
 for(const i of items)if(i.v65===1&&V65T[i.id]&&i.list==='focus'){i.title=V65T[i.id];i.v65=2;i.updatedAt=Date.now();c++}

 const V69P={mvor0n2bdv159:'mvpario003696',mvmrzfi9ps583:'mvgw5ekegfk6o',mve8wcaxz4zdc:'mvgw5ekeu3yrx',mvvpxntccgcbq:'mvgw5ekfe5oq7',mvclmoz0umm3o:'mvgw5ekf9i8bu',mv80tj7e9636n:'mvgw5ekf0osmu'};
 for(const i of items)if(i.list==='focus'&&V69P[i.id]&&!i.poSet){if(!i.po)i.po=V69P[i.id];i.poSet=1;i.updatedAt=Date.now();c++}
 if(c)save()}
const todoRank=i=>(isOver(i)?0:10)+(i.important&&i.urgent?0:i.important?1:i.urgent?2:3);
const todoSort=(a,b)=>todoRank(a)-todoRank(b)||(a.due||'9999').localeCompare(b.due||'9999')||a.created-b.created;
function render(){
 legacyMove();v65mig();v73merge();if(typeof fmigrate==='function')fmigrate();
 if(view==='flow')view=fview;const flv=FLOWV.includes(view);if(flv)fview=view;
 const sg=SEG(view);if(sg==='tasks')tview=view;else if(sg==='habits')hview=view;
 const hv=sg!=='tasks';$('#home').hidden=view!=='home';if(view==='home'&&typeof renderHome==='function')renderHome();$('#habits').hidden=view!=='habits';$('#travel').hidden=view!=='travel';if(view==='travel'&&typeof renderTravel==='function')renderTravel();$('#journal').hidden=view!=='journal';$('#flow').hidden=!flv;if(flv&&typeof renderFlow==='function')renderFlow();['#filters','#count','#list'].forEach(q=>$(q).hidden=hv);if(view==='habits')renderHabits();if(view==='journal'&&typeof renderJournal==='function')renderJournal();
 const fv=CAPPED.includes(view);document.querySelectorAll('#tabs button').forEach(b=>b.classList.toggle('on',b.dataset.v===sg));
 const sb=$('#sub');sb.hidden=sg!=='tasks'&&sg!=='habits';sb.classList.toggle('two',sg==='habits');
 sb.innerHTML=sg==='tasks'?TSEG.map(l=>`<button data-s="${l}" class="${view===l?'on':''}">${TSL[l]} <small>${l==='done'?items.filter(i=>i.done).length:CAPPED.includes(l)?openIn(l).length+'/'+CAP:openIn(l).length}</small></button>`).join(''):sg==='habits'?[['habits','🔥 Habits'],['travel','🧳 Travel']].map(([k,n])=>`<button data-s="${k}" class="${view===k?'on':''}">${n}</button>`).join(''):'';
 const so=sb.querySelector('.on');if(so&&(so.offsetLeft<sb.scrollLeft||so.offsetLeft+so.offsetWidth>sb.scrollLeft+sb.clientWidth))sb.scrollLeft=so.offsetLeft-12;
 const tf=$('#tagFilter').value;
 let L=hv?[]:view==='done'?items.filter(i=>i.done):openIn(view);
 if(tf)L=L.filter(i=>i.tags.includes(tf));
 if(view==='done')L.sort((a,b)=>b.doneAt-a.doneAt);else if(view==='po')L.sort((a,b)=>(a.due||'9999-99-99').localeCompare(b.due||'9999-99-99')||((+b.cm||0)-(+a.cm||0)));else L.sort((a,b)=>(b.top-a.top));
 const f=openIn('focus').length;$('#count').textContent=view==='focus'?`${f}/${CAP} topics`:view==='todo'?`${L.length} to do${L.filter(isOver).length?' · '+L.filter(isOver).length+' overdue':''}`:fv?`${openIn(view).length}/${CAP} open`:flv?`${LN[view]} · ${L.length} open`:`${L.length} item(s)`;
 $('#quote').style.display=view==='home'?'':'none';
 $('#add').style.display=(fv||flv||view==='cold'||view==='todo')?'flex':'none';$('#addInput').placeholder='Quick add to '+(LN[view]||'list')+'…';
 $('#filters').hidden=hv||['po','focus','todo'].includes(view);if(view==='po'&&typeof renderPO==='function'){renderPO();return}
 if(view==='focus'){renderTopics();return}if(view==='todo'){renderTodo();return}
 let pm=null;$('#list').innerHTML=L.map(i=>`${view==='po'&&(i.due||'').slice(0,7)!==pm?(pm=(i.due||'').slice(0,7),`<li class="mhd">${pm?dmon(i.due):'No date'} · ₹${+L.filter(x=>(x.due||'').slice(0,7)===pm).reduce((a,x)=>a+(+x.cm||0),0).toLocaleString('en-IN',{maximumFractionDigits:2})}L</li>`):''}<li class="${i.top?'top':''}" data-id="${i.id}" style="--stripe:${i.tags[0]?TC[i.tags[0]]:i.top?'#f5c96a':'#8f6bff'}"><button class="chk${i.done?' on':''}" data-a="done" aria-label="${i.done?'Undo':'Done'}">${i.done?'✓':''}</button>
 <div class="body" data-a="edit"><div class="t">${esc(i.title)}${i.done&&typeof hasInsight==='function'&&hasInsight(i.id)?' <span class="insm" title="Has insight">💡</span>':''}</div><div class="m">${i.tags.map(t=>`<span class="tag" style="--c:${TC[t]||'#8f6bff'}">${esc(t)}</span>`).join('')}${i.list==='po'&&(i.cm||i.month)?`<span class="fpo">${[fcm(i.cm),fmon(i.month)].filter(Boolean).join(' · ')}</span> `:''}${i.subs&&i.subs.length?`☑ ${i.subs.filter(s=>s.done).length}/${i.subs.length} `:''}${i.notes?'📝 ':''}${i.jid?'📓 ':''}${i.list==='po'?(i.due?`<span class="fpo">Expected: ${dmon(i.due)}</span>`:''):i.due?`<span class="${isOver(i)?'od':''}">📅 ${i.due}${isOver(i)?' · overdue':''}</span>`:''}${view==='done'?' · '+(LN[i.list]||''):''}</div></div>
 ${i.done?(typeof hasInsight==='function'?`<button class="mv ins${hasInsight(i.id)?' has':''}" data-a="insight">${hasInsight(i.id)?'💡':'💡 Insight'}</button>`:''):`<select class="mv" data-mv aria-label="Move to"><option value="">Move ▾</option>${Object.keys(LN).filter(l=>l!==i.list).map(l=>`<option value="${l}">→ ${LN[l]}</option>`).join('')}</select>`}</li>`).join('')||'<li class="empty">Nothing here. Clear skies.</li>';
}
const tagChip=t=>t?`<span class="tag" style="--c:${TC[t]||'#8f6bff'}">${esc(t)}</span>`:'';
function renderTopics(){$('#list').innerHTML=openIn('focus').sort((a,b)=>b.top-a.top).map(topicRow).join('')||'<li class="empty">No topics yet.</li>'}
// menu-card rows: customer, principal (+ model if known), end user
const mcKnown=v=>v&&!/^(tbd|\?)$/i.test(String(v).trim())?String(v).trim():'';
const mcCust=i=>(i.title||'').split(' - ')[0].trim()||i.customer||'';
const mcEU=t=>{const p=(t||'').split(' - ');return p.length>2?p[p.length-1].trim():''};
function mcPO(i){const f=i.list==='focus'?i:i.topic&&items.find(x=>x.id===i.topic);return f&&f.po&&items.find(p=>p.id===f.po)||null}
function mcEndUser(i){if(i.eu)return i.eu;const po=mcPO(i);if(po&&po.eu)return po.eu;if(i.list==='todo')return mcEU(i.title);const t=openIn('todo').find(x=>x.topic===i.id);return t&&mcEU(t.title)||po&&mcEU(po.title)||''}
function mcLine(i){const po=mcPO(i),pr=po&&mcKnown(po.principal),md=po&&mcKnown(String(po.model||'').replace(/\s*\([^)]*\)/g,'').trim()),eu=mcEndUser(i);
 return {pr:[pr,md].filter(Boolean).join(' · '),eu}}
function topicRow(i){const {eu}=mcLine(i),po=mcPO(i),pr=po&&mcKnown(po.principal),tg=(i.tags||[]).find(x=>FTAGS.includes(x));
  return `<li class="ftop mc mc1" data-id="${i.id}"><div class="body" data-a="edit"><div class="mcr">${tg?`<span class="mdot" title="${esc(tg)}"></span>`:''}<b>${esc(mcCust(i))}${eu?` <em>· ${esc(eu)}</em>`:''}</b>${pr?`<i></i><span>${esc(pr)}</span>`:''}</div></div></li>`}
function todoRow(i){const {pr,eu}=mcLine(i),p=(i.title||'').split(' - '),act=p.length>2?p.slice(1,-1).join(' - '):p.slice(1).join(' - ');
 return `<li class="tdo mc" data-id="${i.id}" style="--stripe:${i.important&&i.urgent?'#ff6b5e':i.important?'#ffb547':i.urgent?'#ff4fb4':'#8f6bff'}"><button class="chk${i.done?' on':''}" data-a="done" aria-label="${i.done?'Undo':'Done'}">${i.done?'✓':''}</button><div class="body" data-a="edit"><div class="mcr"><b>${esc(mcCust(i))}</b>${pr?`<i></i><span>${esc(pr)}</span>`:''}</div>${act?`<div class="mca">${esc(act)}</div>`:''}<div class="mcs">${eu?'👤 '+esc(eu)+' ':''}${i.important?'<span class="mki">Important</span>':''}${i.urgent?'<span class="mku">Urgent</span>':''}${i.due?`<span class="${isOver(i)?'od':''}">📅 ${i.due}${isOver(i)?' · overdue':''}</span>`:''}</div></div></li>`}
function renderTodo(){const L=openIn('todo').sort(todoSort);$('#list').innerHTML=L.map(todoRow).join('')||'<li class="empty">Nothing to do. Clear skies.</li>'}
$('#list').addEventListener('click',e=>{const a=e.target.closest('[data-a]');if(!a)return;const id=a.dataset.tid||a.closest('li').dataset.id;
 if(a.dataset.a==='po'){openPO(a.dataset.pid);return}if(a.dataset.a==='done')toggleDone(id);else if(a.dataset.a==='move')move(id);else if(a.dataset.a==='insight')openInsight(id);else openEdit(id)});
$('#list').addEventListener('change',e=>{const s=e.target.closest('[data-mv]');if(s)move(s.closest('li').dataset.id,s.value)});
$('#tabs').addEventListener('click',e=>{const b=e.target.closest('[data-v]');if(b){const v=b.dataset.v;view=v==='tasks'?tview:v==='habits'?hview:v;render();scrollTo(0,0)}});
$('#sub').addEventListener('click',e=>{const b=e.target.closest('[data-s]');if(b){view=b.dataset.s;render()}});
$('#tagFilter').onchange=render;
$('#tagFilter').innerHTML+=TAGS.map(t=>`<option>${t}</option>`).join('');
$('#add').addEventListener('submit',e=>{e.preventDefault();if(add($('#addInput').value,LN[view]?view:'focus'))$('#addInput').value=''});
$('#tagBox').innerHTML+=TAGS.map(t=>`<label style="--c:${TC[t]}"><input type="checkbox" name="tag" value="${t}"><span>${t}</span></label>`).join('');

// ===== habits (separate key) =====
const HKEY='heymurph.habits.v1',HCOL=['#ff8a3d','#2fd3e0'];
function hload(){try{const h=JSON.parse(localStorage.getItem(HKEY));if(h&&Array.isArray(h.habits))return h}catch(e){}return{habits:[{name:'Habit 1',color:HCOL[0],days:{}},{name:'Habit 2',color:HCOL[1],days:{}}]}}
let H=hload();const hsave=()=>localStorage.setItem(HKEY,JSON.stringify(H));
const dAgo=n=>{const d=new Date();d.setDate(d.getDate()-n);return new Date(d-d.getTimezoneOffset()*6e4).toISOString().slice(0,10)};
const hoff=(h,d)=>!!(h.dl&&h.log&&h.log[d]&&!h.log[d].del&&['hol','leave','office'].includes(h.log[d].type)&&!h.days[d]);
function hstats(h){let cur=0;let n=h.days[dAgo(0)]||hoff(h,dAgo(0))?0:1;for(let g=0;g<400;g++){const d=dAgo(n);if(h.days[d])cur++;else if(!hoff(h,d))break;n++}
 const ks=Object.keys(h.days).filter(k=>h.days[k]).sort();let best=0,run=0,prev=null;
 for(const k of ks){let p=false;if(prev){let x=new Date(prev+'T00:00');for(let g=0;g<60;g++){x.setDate(x.getDate()+1);const xd=new Date(x-x.getTimezoneOffset()*6e4).toISOString().slice(0,10);if(xd===k){p=true;break}if(!hoff(h,xd))break}}run=p?run+1:1;best=Math.max(best,run);prev=k}
 let c=0,tot=0;for(let i=0;i<30;i++){const d=dAgo(i);if(hoff(h,d))continue;tot++;if(h.days[d])c++}return{cur,best,pct:tot?Math.round(c/tot*100):0}}
function strip(h,hi){let o='';for(let i=29;i>=0;i--){const x=(29-i)*11,on=h.days[dAgo(i)],ed=i<7;
 o+=`<rect x="${x}" y="0" width="9" height="28" rx="2.5" fill="${on||hoff(h,dAgo(i))?h.color:'rgba(255,255,255,.07)'}" ${ed?`data-h="${hi}" data-d="${dAgo(i)}" class="ed${i===0?' td':''}"`:''}><title>${dAgo(i)}</title></rect>`}
 return `<svg viewBox="0 0 329 28" class="strip" role="img" aria-label="30 day history">${o}</svg><div class="sl"><span>30 days ago</span><span>tap last 7 to edit</span><span>today</span></div>`}
function weekly(){const W=8,w=300,hh=90;let bars='',lab='';
 for(let k=W-1;k>=0;k--){const x=(W-1-k)*(w/W);H.habits.forEach((h,j)=>{let c=0;for(let i=0;i<7;i++)if(h.days[dAgo(k*7+i)])c++;const bh=c/7*(hh-14);
  bars+=`<rect x="${x+6+j*15}" y="${hh-12-bh}" width="13" height="${Math.max(bh,1.5)}" rx="3" fill="${h.color}"><title>${esc(h.name)}: ${c}/7</title></rect>`});
  lab+=`<text x="${x+20}" y="${hh}" text-anchor="middle">${k?'-'+k+'w':'now'}</text>`}
 return `<svg viewBox="0 0 ${w} ${hh+2}" class="wk" role="img" aria-label="Weekly completion">${[0,.5,1].map(f=>`<line x1="0" x2="${w}" y1="${hh-12-f*(hh-14)}" y2="${hh-12-f*(hh-14)}"/>`).join('')}${bars}${lab}</svg>`}
function hdlFix(){const on=H.habits.map((h,i)=>h.dl?i:-1).filter(i=>i>=0);if(on.length<2)return;const keep=on.find(i=>/duty/i.test(H.habits[i].name))??on[0];on.forEach(i=>{if(i!==keep)delete H.habits[i].dl});H.updatedAt=Date.now();hsave()}
function renderHabits(){hdlFix();const t=dAgo(0);const anyDl=H.habits.some(h=>h.dl);$('#habits').innerHTML=H.habits.map((h,i)=>{const s=hstats(h),on=h.days[t];
 return `<div class="hcard" style="--c:${h.color}"><div class="hhead"><button class="hname" data-hn="${i}" title="Tap to rename">${esc(h.name)} <span>✎</span></button><span class="hpct">${s.pct}%<small> 30d</small></span></div>
 <button class="hbig${on?' on':''}" data-ht="${i}">${on?'✓ Done today':'Mark today done'}${h.dl&&h.log&&h.log[t]&&!h.log[t].del&&h.log[t].type?' · '+dlName(h.log[t].type):''}</button>
 <div class="hst"><div><b>${s.cur}</b><span>current streak</span></div><div><b>${s.best}</b><span>best streak</span></div><div><b>${s.pct}%</b><span>last 30 days</span></div></div>${strip(h,i)}${h.dl||!anyDl?`<button class="dltg" data-dlt="${i}">${h.dl?'📍 Day log on':'📍 Add day log (place, remarks)'}</button>`:''}${h.dl?dlMini(i):''}</div>`}).join('')
 +`<div class="hcard wkc"><div class="hhead"><span class="hname static">Weekly completion</span><span class="leg">${H.habits.map(h=>`<i style="background:${h.color}"></i>${esc(h.name)}`).join(' ')}</span></div>${weekly()}</div>`}
$('#habits').addEventListener('click',e=>{if(e.target.closest('.dlp,.dltg'))return;const b=e.target.closest('[data-ht],[data-hn],[data-d]');if(!b)return;
 if(b.dataset.hn){const h=H.habits[b.dataset.hn],n=prompt('Habit name',h.name);if(n&&n.trim())h.name=n.trim().slice(0,40)}
 else if(!htick(+(b.dataset.ht??b.dataset.h),b.dataset.d||dAgo(0)))return;
 hsave();renderHabits()});
// tick/untick a habit day (shared by Habits and Home); a day-log habit opens the day log instead of ticking. Returns false if the dialog was opened.
function htick(i,d){const h=H.habits[i];if(h.dl&&!h.days[d]){dlOpen(i,d);return false}h.days[d]=h.days[d]?0:1;h.ts=h.ts||{};h.ts[d]=Date.now();return true}
let editing=null;
let esubs=[];
function drawSubs(){$('#eSubs').innerHTML=esubs.map((s,k)=>`<div class="fsub"><input type="checkbox" data-si="${k}"${s.done?' checked':''}><span class="${s.done?'dn':''}">${esc(s.t)}</span><button type="button" data-sd="${k}" aria-label="Delete">✕</button></div>`).join('')}
(function(){const f=$('#editForm'),n=f.notes.closest('label');const po=document.createElement('div');po.id='ePo';po.className='fpog';po.innerHTML='<label>Expected CM (₹ lakh)<input name="cm" type="number" step="0.01" min="0" inputmode="decimal" placeholder="e.g. 2.5"></label><label>Expected month<input name="month" type="month"></label>';
 const sb=document.createElement('div');sb.id='eSubBox';sb.innerHTML='<div class="fsl">Sub-tasks</div><div id="eSubs"></div><div class="fsadd"><input id="eSubIn" placeholder="Add sub-task…"><button type="button" id="eSubBtn">+</button></div>';
 const td=document.createElement('div');td.id='eTodo';td.className='etd';td.innerHTML='<label class="row"><input type="checkbox" name="imp"> Important</label><label class="row"><input type="checkbox" name="urg"> Urgent</label>';
 const ls=document.createElement('label');ls.id='eListL';ls.innerHTML='List<select name="list">'+Object.keys(LN).map(l=>`<option value="${l}">${LN[l]}</option>`).join('')+'</select>';
 f.title.closest('label').after(ls);ls.after(po);po.after(td);n.before(sb);
 const addS=()=>{const v=$('#eSubIn').value.trim();if(!v)return;esubs.push({t:v,done:false});$('#eSubIn').value='';drawSubs()};
 $('#eSubBtn').onclick=addS;$('#eSubIn').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();addS()}};
 $('#eSubs').onclick=e=>{const d=e.target.closest('[data-sd]');if(d){esubs.splice(+d.dataset.sd,1);drawSubs()}};
 $('#eSubs').onchange=e=>{const c=e.target.closest('[data-si]');if(c){esubs[+c.dataset.si].done=c.checked;drawSubs()}};
 f.list.onchange=()=>{po.hidden=f.list.value!=='po';dueMode(f,f.list.value==='po');editMode(f,f.list.value)}})();
function editMode(f,l){const fo=l==='focus';$('#eTodo').hidden=l!=='todo';$('#tagBox').hidden=l==='todo';f.top.closest('label').hidden=true;
 f.due.closest('label').hidden=fo;f.notes.closest('label').hidden=fo;$('#eSubBox').hidden=fo;$('#eListL').hidden=fo;
 let lk=$('#eLinks');if(!lk){lk=document.createElement('fieldset');lk.id='eLinks';lk.className='elk';$('#tagBox').after(lk)}lk.hidden=!fo;let pw=$('#ePoL');if(!pw){pw=document.createElement('label');pw.id='ePoL';pw.innerHTML='PO card<select name="pocard"></select>';$('#tagBox').before(pw)}pw.hidden=!fo;if(fo){const cur=editing&&editing.po||'';f.pocard.innerHTML='<option value="">— none —</option>'+items.filter(p=>p.list==='po'&&!p.done&&!p.deleted&&(p.active!==false||p.id===cur)).sort((a,b)=>a.title.localeCompare(b.title)).map(p=>`<option value="${p.id}"${p.id===cur?' selected':''}>${esc(p.title)}</option>`).join('')}
 if(fo){const T=openIn('todo').sort(todoSort),me=editing&&editing.id,lnk=T.filter(t=>t.topic===me),fr=T.filter(t=>t.topic!==me);
  lk.innerHTML='<legend>Linked to-dos</legend>'+lnk.map(t=>`<label class="row"><input type="checkbox" name="lk" value="${t.id}" checked> ${esc(t.title)}</label>`).join('')+(fr.length?`<select id="eLkAdd"><option value="">+ Link a to-do</option>${fr.map(t=>`<option value="${t.id}">${esc(t.title)}</option>`).join('')}</select>`:'');
  const ad=$('#eLkAdd');if(ad)ad.onchange=()=>{const o=ad.selectedOptions[0];if(!ad.value)return;const l=document.createElement('label');l.className='row';l.innerHTML=`<input type="checkbox" name="lk" value="${ad.value}" checked> ${esc(o.textContent)}`;ad.before(l);o.remove();ad.value=''}}
 f.querySelectorAll('[name=tag]').forEach(c=>{c.closest('label').hidden=l==='focus'&&!FTAGS.includes(c.value)});
}
function dueMode(f,po){const v=f.due.value;if(po===(f.due.type==='month'))return;f.due.type=po?'month':'date';f.due.value=po?v.slice(0,7):v?v+'-01':'';$('#eDueL').textContent=po?'Expected close month':'Due'}
function editItem(id){editing=items.find(x=>x.id===id);const f=$('#editForm');f.title.value=editing.title;f.due.type='date';$('#eDueL').textContent='Due';f.due.value=editing.due;dueMode(f,editing.list==='po');f.top.checked=editing.top;f.notes.value=editing.notes||'';
 f.list.value=editing.list;f.cm.value=editing.cm||'';f.month.value=editing.month||'';$('#ePo').hidden=editing.list!=='po';esubs=JSON.parse(JSON.stringify(editing.subs||[]));drawSubs();$('#eSubIn').value='';
 f.querySelectorAll('[name=tag]').forEach(c=>c.checked=editing.tags.includes(c.value));f.imp.checked=!!editing.important;f.urg.checked=!!editing.urgent;editMode(f,editing.list);$('#edit').showModal()}
$('#edit').addEventListener('close',()=>{const r=$('#edit').returnValue,f=$('#editForm'),i=editing;if(!i)return;editing=null;
 if(r==='delete'){if(confirm('Delete "'+i.title+'"?')){items=items.filter(x=>x!==i);save();render()}return}
 if(r!=='save')return;
 if(f.list.value!==i.list&&i.list!=='focus'){if(!i.done&&!canIn(f.list.value))return;i.list=f.list.value;if(i.list!=='focus')i.top=false}
 if(esubs.length||i.subs)i.subs=esubs;if(i.list==='todo'){i.important=f.imp.checked;i.urgent=f.urg.checked}if(i.list==='focus'){i.po=f.pocard.value;const on=new Set([...f.querySelectorAll('[name=lk]:checked')].map(c=>c.value)),now=Date.now();for(const t of openIn('todo')){if(on.has(t.id)&&t.topic!==i.id){t.topic=i.id;t.updatedAt=now}else if(!on.has(t.id)&&t.topic===i.id){t.topic='';t.updatedAt=now}}}if(i.list==='po'){if(f.cm.value||i.cm)i.cm=f.cm.value;if(f.month.value||i.month)i.month=f.month.value}
 if(f.top.checked&&!i.top){if(i.list!=='focus'||i.done)toast('Top priority only applies to open Focus items.');else if(items.filter(x=>x.top&&!x.done).length>=TOPCAP)toast('Max 3 top priority items.');else i.top=true}else if(!f.top.checked)i.top=false;
 i.title=f.title.value.trim()||i.title;i.due=f.due.type==='month'?(!f.due.value?'':(i.due||'').slice(0,7)===f.due.value?i.due:f.due.value+'-01'):f.due.value;if(f.notes.value.trim()||i.notes)i.notes=f.notes.value;i.tags=[...f.querySelectorAll('[name=tag]:checked')].map(c=>c.value);save();render()});
// export/import
function toMd(){const sec=(n,l)=>`## ${n}\n`+items.filter(i=>i.list===l).map(i=>`- [${i.done?'x':' '}] ${i.title.replace(/\[/g,'(').replace(/\]/g,')')}`+(i.tags.length?` [tags: ${i.tags.join(', ')}]`:'')+(i.due?` [due: ${i.due}]`:'')+(i.top?' [top]':'')).join('\n');
 return `# Hey Murph Export\n\n`+Object.keys(LN).map(l=>sec(l==='focus'?'Focus List':LN[l],l)).join('\n\n')+'\n'}
function parseMd(txt){let list=null;const out=[];for(const line of txt.split(/\r?\n/)){const h=line.match(/^#{1,6}\s*(.+)/);if(h){const n=h[1].toLowerCase();list=n.includes('focus')?'focus':n.includes('next')?'next':n.includes('radar')?'radar':n.includes('cold')?'cold':n.includes('po funnel')?'po':n.includes('delivery')?'del':n.includes('payment')?'pay':list;continue}
 const m=line.match(/^\s*[-*]\s*\[( |x|X)\]\s*(.+)$/);if(!m||!list)continue;let rest=m[2];const o={done:m[1]!==' '};
 rest=rest.replace(/\s*\[(tags|due|customer):\s*([^\]]*)\]/gi,(_,k,v)=>{k=k.toLowerCase();if(k==='tags')o.tags=v.split(',').map(s=>s.trim().toLowerCase());else o[k]=v.trim();return''}).replace(/\s*\[top\]/i,()=>{o.top=true;return''}).trim();
 if(rest)out.push(mk(rest,list,o))}return out}
function merge(newItems){let moved=0;for(const i of newItems){if(CAPPED.includes(i.list)&&!i.done&&openIn(i.list).length>=CAP){i.list='cold';i.top=false;moved++}
 if(i.top&&items.filter(x=>x.top&&!x.done).length>=TOPCAP)i.top=false;items.push(i)}save();render();toast(`Imported ${newItems.length}`+(moved?`; ${moved} sent to Cold Storage (Focus full)`:''))}
async function share(name,text,type){const file=new File([text],name,{type});
 try{if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({files:[file],title:name});return}}catch(e){if(e.name==='AbortError')return}
 const a=document.createElement('a');a.href=URL.createObjectURL(file);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),5000)}
$('#menuBtn').onclick=()=>$('#menu').showModal();
$('#menu').addEventListener('close',()=>{const r=$('#menu').returnValue,d=today();
 if(r==='md')share(`hey-murph-${d}.md`,toMd(),'text/markdown');
 if(r==='json')share(`hey-murph-backup-${d}.json`,JSON.stringify({app:'hey-murph',version:1,exported:new Date().toISOString(),items,habits:H,journal:typeof J!=='undefined'?J:[],flow:typeof F!=='undefined'?F:[],meta:typeof META!=='undefined'?META:undefined},null,1),'application/json');
 if(r==='importJson')$('#fileIn').click();if(r==='importMd'){$('#pasteText').value='';$('#paste').showModal()}});
$('#paste').addEventListener('close',()=>{if($('#paste').returnValue==='ok'){const n=parseMd($('#pasteText').value);n.length?merge(n):toast('No items found in Markdown.')}});
$('#fileIn').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;try{const d=JSON.parse(await f.text());const arr=Array.isArray(d)?d:d.items;if(!Array.isArray(arr))throw 0;
 if(!confirm(`Replace all current data with ${arr.length} items from backup?`))return;items=arr.map(x=>Object.assign(mk(x.title||'',LN[x.list]?x.list:'focus',x),{id:x.id||uid(),created:x.created||Date.now(),doneAt:x.doneAt||null},Array.isArray(x.subs)?{subs:x.subs}:{},x.cm?{cm:x.cm}:{},x.month?{month:x.month}:{},x.notes?{notes:String(x.notes)}:{},x.jid?{jid:x.jid}:{}));if(d&&Array.isArray(d.journal)&&typeof jImport==='function')jImport(d.journal);if(d&&d.habits&&Array.isArray(d.habits.habits)){H=d.habits;hsave()}if(d&&d.meta&&typeof META!=='undefined'){META=d.meta;msave()}if(d&&Array.isArray(d.flow)&&typeof F!=='undefined'){F=d.flow;fsave()}save();render();toast('Backup restored')}catch(_){toast('Not a valid Hey Murph backup.')}};
const QUOTES=[
"Life is a trade-off. Choose what you trade, and what you get for it. Trade wisely.",
"Your focus is like a boat with only ten seats. Choose who sits there carefully.",
"First stop the damage in front of you. Then make sure it doesn't happen again.",
"Not now doesn't mean never. Cold Storage is where good tasks wait.",
"Your list works for you. You don't work for your list.",
"Win one small thing now. It powers the next big thing.",
"Chaos and calm are both options. The choice is yours.",
"Busy isn't progress. Direction is.",
"Ignoring a small leak today will make you fight a flood tomorrow. Small misses grow into big storms, so catch them early.",
"Be the shark that keeps others moving and alive."];
let qi=(Math.floor(Date.now()/864e5)+Math.floor(Math.random()*QUOTES.length))%QUOTES.length;
function showQuote(){const b=$('#qText');b.classList.remove('in');void b.offsetWidth;b.textContent=QUOTES[qi];$('#quote').style.setProperty('--h',(qi*47)%360);b.classList.add('in')}
function nextQuote(){qi=(qi+1)%QUOTES.length;showQuote()}
$('#quote').addEventListener('click',nextQuote);$('#quote').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();nextQuote()}});
function greet(){const d=new Date(),h=d.getHours();$('#greet').textContent=(h<5?'Good night':h<12?'Good morning':h<17?'Good afternoon':'Good evening')+', sir';
 $('#dateLine').textContent=d.toLocaleDateString(undefined,{weekday:'long',day:'numeric',month:'long'})}
const APPV='v75';$('#appVer').textContent=APPV;greet();showQuote();
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js');
if(navigator.storage&&navigator.storage.persist)navigator.storage.persist();
render();

// v71: read-only view for Focus topics and To do items (like PO); Edit opens the edit screen.
function openEdit(id){const i=items.find(x=>x.id===id);if(i&&(i.list==='focus'||i.list==='todo'))openView(id);else editItem(id)}
function openView(id){const i=items.find(x=>x.id===id);if(!i)return;let d=$('#tView');if(!d){d=document.createElement('dialog');d.id='tView';d.className='poed';document.body.appendChild(d);
  d.addEventListener('click',e=>{const b=e.target.closest('[data-v]');if(!b)return;const k=b.dataset.v,x=b.dataset.x;if(k==='close')d.close();else if(k==='edit'){d.close();editItem(x)}else if(k==='done'){d.close();toggleDone(x)}else if(k==='po'){d.close();openPO(x)}else if(k==='open')openView(x)})}
 const row=(n,v)=>`<div class="pdr"><small>${n}</small><div>${v||'<span class="pbl">—</span>'}</div></div>`;let h=`<div class="pdh">${esc(i.title)}</div>`;
 if(i.list==='focus'){const t=(i.tags||[]).find(x=>FTAGS.includes(x)),po=i.po&&items.find(p=>p.id===i.po),td=openIn('todo').filter(x=>x.topic===i.id).sort(todoSort);
  h+=`<div class="pdg">${row('Tag',t?tagChip(t):'')}${row('PO card',po?`<a class="fpo" data-v="po" data-x="${po.id}">${esc(po.title)} ›</a>`:'')}</div>
  <div class="jlab">To do</div>${td.map(x=>`<div class="ftd" data-v="open" data-x="${x.id}">${esc(x.title)}</div>`).join('')||'<div class="pbl">None linked</div>'}`}
 else{const tp=i.topic&&items.find(x=>x.id===i.topic&&x.list==='focus'),ss=subsOf(i);
  h+=`<div class="pdg">${row('Important',i.important?'<span class="mki">Important</span>':'')}${row('Urgent',i.urgent?'<span class="mku">Urgent</span>':'')}${row('Due',i.due?`<span class="${isOver(i)?'od':''}">${esc(i.due)}${isOver(i)?' · overdue':''}</span>`:'')}${row('Focus topic',tp?`<a class="fpo" data-v="open" data-x="${tp.id}">${esc(tp.title)}</a>`:'')}</div>
  ${ss.length?`<div class="jlab">Sub-tasks</div>${ss.map(x=>`<div class="ftd">${x.done?'☑':'☐'} ${esc(x.t)}</div>`).join('')}`:''}${(i.notes||'').trim()?`<div class="jlab">Notes</div><div class="pdn">${esc(i.notes)}</div>`:''}`}
 h+=`<div class="btns"><button type="button" data-v="close">Close</button>${i.list==='todo'?`<button type="button" data-v="done" data-x="${i.id}">${i.done?'Undo done':'Done'}</button>`:''}<button type="button" class="primary" data-v="edit" data-x="${i.id}">Edit</button></div>`;
 d.innerHTML=h;if(!d.open)d.showModal()}
