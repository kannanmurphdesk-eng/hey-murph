'use strict';
// ===== Home dashboard: Journal quick capture · Focus tasks · Habits & travel. UI only: reuses journal/task/habit/day-log functions, no new data.
function hmGo(v){view=v;render();scrollTo(0,0)}
function renderHome(){const el=$('#home'),t=dAgo(0),mon=t.slice(0,7);
 if(!el.dataset.init){el.dataset.init=1;el.innerHTML=`
 <div class="hstat" id="hStats"></div>
 <div class="hcard hm" style="--c:#ff7ad9"><div class="hmh"><b>📓 Journal</b><span id="hjMeta"></span></div>
  <form id="hjForm"><textarea id="hjText" rows="3" placeholder="Quick capture a thought… (auto-stamped)"></textarea>
  <div class="hmrow"><button class="primary" id="hjSave">Save</button><button type="button" class="hmgo" data-go="journal">Open Journal ›</button></div></form></div>
 <div class="hcard hm" style="--c:#5F7BFF"><div class="hmh"><b>◎ Focus</b><span id="htMeta"></span></div><ul id="htList"></ul>
  <button type="button" class="hmgo full" data-go="focus">Open Focus ›</button></div>
 <div class="hcard hm" id="hhCard" style="--c:#FFB83F"><div class="hmh"><b>🔥 Habits &amp; Travel</b><span id="hhMeta"></span></div><div id="hhTrav"></div><div id="hh7"></div><div class="hmticks" id="hhTicks"></div>
  <button type="button" class="hmgo full" data-go="habits">Open Habits &amp; Travel ›</button></div>`;
  $('#hjForm').onsubmit=e=>{e.preventDefault();const x=$('#hjText'),v=x.value.trim();if(!v)return;J.push(jnorm({text:v,type:''}));jsave();x.value='';toast('Recorded '+jtime(Date.now()));render()};
  el.addEventListener('click',e=>{const g=e.target.closest('[data-go]');if(g)hmGo(g.dataset.go==='tasks'?tview:g.dataset.go==='habits'?hview:g.dataset.go)});
  $('#htList').onclick=e=>{const a=e.target.closest('[data-a]');if(!a)return;if(a.dataset.a==='po'){openPO(a.dataset.pid);return}openEdit(a.dataset.tid||a.closest('li').dataset.id)};
  $('#hh7').onclick=e=>{const b=e.target.closest('[data-c7]');if(b&&typeof cal7Go==='function')cal7Go(b.dataset.c7)};
  $('#hhTicks').onclick=e=>{const b=e.target.closest('[data-hmt]');if(b&&htick(+b.dataset.hmt,dAgo(0))){hsave();renderHome()}}}
 // v80 stat strip (inspired by the Focus dashboard)
 {const TD=items.filter(i=>i.list==='todo'),dn=TD.filter(i=>i.done).length,TH=H.habits.filter(h=>!h.dl),el2=+t.slice(8);let tk=0,best=0;
  for(const h of TH){for(const k in h.days)if(h.days[k]&&k.startsWith(mon)&&k<=t)tk++;best=Math.max(best,hstats(h).cur)}
  const pc=TH.length?Math.round(tk/(TH.length*el2)*100):0,fp=TD.length?Math.round(dn/TD.length*100):0;
  $('#hStats').innerHTML=`<div class="hsc" data-go="focus"><b>${openIn('focus').length}/${CAP}</b><span>Focus topics</span></div><div class="hsc" data-go="todo"><b>${dn}/${TD.length}</b><span>To-dos done</span><i class="hsb"><i style="width:${fp}%"></i></i></div><div class="hsc" data-go="habits"><b>${pc}%</b><span>Habit check-ins this month</span></div><div class="hsc" data-go="habits"><b>${best}</b><span>Best current streak (days)</span></div>`}
 // journal
 const rec=J.filter(e=>jstage(e)==='inbox').length,pend=J.filter(e=>jstage(e)==='processed').length;
 $('#hjMeta').innerHTML=`<em class="${rec?'hmn':''}">${rec}</em> unprocessed${pend?` · ${pend} to execute`:''}`;
 // focus topics
 const L=openIn('focus').sort((a,b)=>b.top-a.top);
 $('#htMeta').textContent=`${L.length}/${CAP} topics`;
 $('#htList').innerHTML=L.map(topicRow).join('')||'<li class="empty">No topics yet.</li>';
 // habits & travel
 const di=dlHi(),dh=di===null?null:H.habits[di],ml=new Date(mon+'-01T00:00').toLocaleDateString('en-IN',{month:'long',year:'numeric'});
 $('#hhMeta').textContent=ml;
 if(dh){const{c,od:n}=dlCounts(dh,mon);$('#hhTrav').innerHTML=`<div class="hmod" style="--c:${dh.color}"><b>${n}</b><span>out duty days this month<small>🏙 Local ${c.local} + 🚆 Outstation ${c.out}</small></span></div><div class="dlc" style="--c:${dh.color}">${DLT.map(x=>`<div><b>${c[x[0]]}</b><span>${x[2]} ${x[1]}</span></div>`).join('')}</div>`}
 else $('#hhTrav').innerHTML='<p class="hmmut">Turn on the day log on your out duty habit (Habits) to see travel data here.</p>';
 $('#hh7').innerHTML=typeof cal7==='function'?cal7():'';
 $('#hhTicks').innerHTML=H.habits.map((h,i)=>{const on=h.days[t],lg=h.dl&&h.log&&h.log[t]&&!h.log[t].del&&h.log[t].type?dlName(h.log[t].type):'',s=hstats(h);
  return `<button class="hbig hmt${on?' on':''}" data-hmt="${i}" style="--c:${h.color}"><span>${on?'✓ ':''}${esc(h.name)}</span><small>${on?'Done today':h.dl?'Log today':'Mark today'}${lg?' · '+lg:''} · 🔥${s.cur}</small></button>`}).join('')}
// refresh Home after a day-log save/delete (dlClose re-renders habits)
const _rhab=renderHabits;renderHabits=function(){_rhab.apply(this,arguments);if(view==='home')renderHome()};
// Android back: from a segment, go back to Home instead of leaving the app
let hmSeg='home';const _r3=render;render=function(){_r3.apply(this,arguments);const s=SEG(view);
 if(s!==hmSeg){if(hmSeg==='home'&&s!=='home')history.pushState({hm:1},'');else if(s==='home'&&history.state&&history.state.hm)history.back();hmSeg=s}};
addEventListener('popstate',()=>{if(view!=='home'){view='home';render();scrollTo(0,0)}});
render();
