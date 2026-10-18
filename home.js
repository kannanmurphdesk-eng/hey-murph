'use strict';
// ===== Home dashboard: Journal quick capture · Focus tasks · Habits & travel. UI only: reuses journal/task/habit/day-log functions, no new data.
function hmGo(v){view=v;render();scrollTo(0,0)}
function renderHome(){const el=$('#home'),t=dAgo(0),mon=t.slice(0,7);
 if(!el.dataset.init){el.dataset.init=1;el.innerHTML=`
 <div class="hcard hm" style="--c:#ff7ad9"><div class="hmh"><b>📓 Journal</b><span id="hjMeta"></span></div>
  <form id="hjForm"><textarea id="hjText" rows="3" placeholder="Quick capture a thought… (auto-stamped)"></textarea>
  <div class="hmrow"><button class="primary" id="hjSave">Save</button><button type="button" class="hmgo" data-go="journal">Open Journal ›</button></div></form></div>
 <div class="hcard hm" style="--c:#5F7BFF"><div class="hmh"><b>◎ Focus list</b><span id="htMeta"></span></div><ul id="htList"></ul>
  <button type="button" class="hmgo full" data-go="tasks">Open Tasks ›</button></div>
 <div class="hcard hm" id="hhCard" style="--c:#FFB83F"><div class="hmh"><b>🔥 Habits &amp; Travel</b><span id="hhMeta"></span></div><div id="hhTrav"></div><div class="hmticks" id="hhTicks"></div>
  <button type="button" class="hmgo full" data-go="habits">Open Habits &amp; Travel ›</button></div>`;
  $('#hjForm').onsubmit=e=>{e.preventDefault();const x=$('#hjText'),v=x.value.trim();if(!v)return;J.push(jnorm({text:v,type:''}));jsave();x.value='';toast('Recorded '+jtime(Date.now()));render()};
  el.addEventListener('click',e=>{const g=e.target.closest('[data-go]');if(g)hmGo(g.dataset.go==='tasks'?tview:g.dataset.go==='habits'?hview:g.dataset.go)});
  $('#htList').onclick=e=>{const a=e.target.closest('[data-a]');if(!a)return;const id=a.closest('li').dataset.id;if(a.dataset.a==='done'){const it=items.find(x=>x.id===id);toggleDone(id);if(it&&it.done)toast('Done ✓ '+it.title.slice(0,40))}else openEdit(id)};
  $('#hhTicks').onclick=e=>{const b=e.target.closest('[data-hmt]');if(b&&htick(+b.dataset.hmt,dAgo(0))){hsave();renderHome()}}}
 // journal
 const rec=J.filter(e=>jstage(e)==='inbox').length,pend=J.filter(e=>jstage(e)==='processed').length;
 $('#hjMeta').innerHTML=`<em class="${rec?'hmn':''}">${rec}</em> unprocessed${pend?` · ${pend} to execute`:''}`;
 // tasks
 const L=openIn('focus').sort((a,b)=>b.top-a.top).slice(0,CAP),od=L.filter(isOver).length;
 $('#htMeta').innerHTML=`${L.length}/${CAP} open${od?` · <span class="od">${od} overdue</span>`:''}`;
 $('#htList').innerHTML=L.slice(0,3).map(i=>`<li class="${i.top?'top':''}" data-id="${i.id}" style="--stripe:${i.tags[0]?TC[i.tags[0]]:i.top?'#f5c96a':'#8f6bff'}"><button class="chk" data-a="done" aria-label="Done"></button><div class="body" data-a="edit"><div class="t">${esc(i.title)}</div>${i.due||i.subs&&i.subs.length?`<div class="m">${i.subs&&i.subs.length?`☑ ${i.subs.filter(s=>s.done).length}/${i.subs.length} `:''}${i.due?`<span class="${isOver(i)?'od':''}">📅 ${i.due}${isOver(i)?' · overdue':''}</span>`:''}</div>`:''}</div></li>`).join('')||'<li class="empty">Focus list is clear.</li>';
 // habits & travel
 const di=dlHi(),dh=di===null?null:H.habits[di],ml=new Date(mon+'-01T00:00').toLocaleDateString('en-IN',{month:'long',year:'numeric'});
 $('#hhMeta').textContent=ml;
 if(dh){const{c,od:n}=dlCounts(dh,mon);$('#hhTrav').innerHTML=`<div class="hmod" style="--c:${dh.color}"><b>${n}</b><span>out duty days this month<small>🏙 Local ${c.local} + 🚆 Outstation ${c.out}</small></span></div><div class="dlc" style="--c:${dh.color}">${DLT.map(x=>`<div><b>${c[x[0]]}</b><span>${x[2]} ${x[1]}</span></div>`).join('')}</div>`}
 else $('#hhTrav').innerHTML='<p class="hmmut">Turn on the day log on your out duty habit (Habits) to see travel data here.</p>';
 $('#hhTicks').innerHTML=H.habits.map((h,i)=>{const on=h.days[t],lg=h.dl&&h.log&&h.log[t]&&!h.log[t].del&&h.log[t].type?dlName(h.log[t].type):'',s=hstats(h);
  return `<button class="hbig hmt${on?' on':''}" data-hmt="${i}" style="--c:${h.color}"><span>${on?'✓ ':''}${esc(h.name)}</span><small>${on?'Done today':h.dl?'Log today':'Mark today'}${lg?' · '+lg:''} · 🔥${s.cur}</small></button>`}).join('')}
// refresh Home after a day-log save/delete (dlClose re-renders habits)
const _rhab=renderHabits;renderHabits=function(){_rhab.apply(this,arguments);if(view==='home')renderHome()};
// Android back: from a segment, go back to Home instead of leaving the app
let hmSeg='home';const _r3=render;render=function(){_r3.apply(this,arguments);const s=SEG(view);
 if(s!==hmSeg){if(hmSeg==='home'&&s!=='home')history.pushState({hm:1},'');else if(s==='home'&&history.state&&history.state.hm)history.back();hmSeg=s}};
addEventListener('popstate',()=>{if(view!=='home'){view='home';render();scrollTo(0,0)}});
render();
