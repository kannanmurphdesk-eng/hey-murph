'use strict';
const TAGS=['damage control','preventive damage control','overdue','quick wins','delegation'];
const TC={'damage control':'#ff6b5e','preventive damage control':'#ffb547','overdue':'#ff4fb4','quick wins':'#3ddc84','delegation':'#2fd3e0'};
const CAP=10,TOPCAP=3,KEY='heymurph.v1';
let items=load(),view='focus';
const $=s=>document.querySelector(s);
function load(){try{return JSON.parse(localStorage.getItem(KEY))||[]}catch(e){return[]}}
function save(){localStorage.setItem(KEY,JSON.stringify(items))}
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const today=()=>new Date(Date.now()-new Date().getTimezoneOffset()*6e4).toISOString().slice(0,10);
const openIn=l=>items.filter(i=>!i.done&&i.list===l);
const isOver=i=>!i.done&&i.due&&i.due<today();
function toast(m){const t=$('#toast');t.textContent=m;t.style.display='block';clearTimeout(toast.h);toast.h=setTimeout(()=>t.style.display='none',2800)}
function canFocus(){if(openIn('focus').length>=CAP){toast('Focus List is full (10). Move or finish something first.');return false}return true}
function mk(title,list,o={}){return{id:uid(),title:title.trim(),list,tags:(o.tags||[]).filter(t=>TAGS.includes(t)),due:o.due||'',customer:(o.customer||'').trim(),top:!!o.top&&list==='focus',done:!!o.done,created:Date.now(),doneAt:o.done?Date.now():null}}
function add(title,list){if(!title.trim())return false;if(list==='focus'&&!canFocus())return false;items.push(mk(title,list));save();render();return true}
function move(id){const i=items.find(x=>x.id===id);if(i.list==='cold'){if(!canFocus())return;i.list='focus'}else{i.list='cold';i.top=false}save();render()}
function toggleDone(id){const i=items.find(x=>x.id===id);if(i.done&&i.list==='focus'&&!canFocus())return;i.done=!i.done;i.doneAt=i.done?Date.now():null;if(i.done)i.top=false;save();render()}
function esc(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
function render(){
 const hv=view==='habits'||view==='journal';$('#habits').hidden=view!=='habits';$('#journal').hidden=view!=='journal';if(view==='journal'&&window.renderJournal)renderJournal();['#filters','#count','#list'].forEach(q=>$(q).hidden=hv);if(view==='habits')renderHabits();
 document.querySelectorAll('#tabs button').forEach(b=>b.classList.toggle('on',b.dataset.v===view));
 const cs=[...new Set(items.map(i=>i.customer).filter(Boolean))].sort(),cf=$('#custFilter'),cur=cf.value;
 cf.innerHTML='<option value="">All customers</option>'+cs.map(c=>`<option>${esc(c)}</option>`).join('');cf.value=cs.includes(cur)?cur:'';
 $('#custList').innerHTML=cs.map(c=>`<option value="${esc(c)}">`).join('');
 const tf=$('#tagFilter').value;
 let L=hv?[]:view==='done'?items.filter(i=>i.done):view==='overdue'?items.filter(isOver):openIn(view);
 if(cf.value)L=L.filter(i=>i.customer===cf.value);if(tf)L=L.filter(i=>i.tags.includes(tf));
 if(view==='overdue')L.sort((a,b)=>a.due<b.due?-1:1);else if(view==='done')L.sort((a,b)=>b.doneAt-a.doneAt);else L.sort((a,b)=>(b.top-a.top));
 const f=openIn('focus').length;$('#count').textContent=view==='focus'?`${f}/${CAP} open · ${openIn('focus').filter(i=>i.top).length}/${TOPCAP} top`:`${L.length} item(s)`;
 $('#quote').style.display=view==='focus'?'':'none';
 $('#add').style.display=(!hv&&view==='focus'||view==='focus'||view==='cold')?'flex':'none';
 $('#list').innerHTML=L.map(i=>`<li class="${i.top?'top':''}" data-id="${i.id}" style="--stripe:${i.tags[0]?TC[i.tags[0]]:i.top?'#f5c96a':'#8f6bff'}"><button class="chk${i.done?' on':''}" data-a="done" aria-label="${i.done?'Undo':'Done'}">${i.done?'✓':''}</button>
 <div class="body" data-a="edit"><div class="t">${esc(i.title)}</div><div class="m">${i.tags.map(t=>`<span class="tag" style="--c:${TC[t]||'#8f6bff'}">${esc(t)}</span>`).join('')}${i.customer?'👤 '+esc(i.customer)+' ':''}${i.due?`<span class="${isOver(i)?'od':''}">📅 ${i.due}</span>`:''}${view!=='focus'&&view!=='cold'?' · '+(i.list==='focus'?'Focus':'Cold'):''}</div></div>
 ${i.done?'':`<button class="mv" data-a="move">${i.list==='focus'?'→ Cold':'→ Focus'}</button>`}</li>`).join('')||'<li class="empty">Nothing here. Clear skies.</li>';
}
$('#list').addEventListener('click',e=>{const a=e.target.closest('[data-a]');if(!a)return;const id=a.closest('li').dataset.id;
 if(a.dataset.a==='done')toggleDone(id);else if(a.dataset.a==='move')move(id);else openEdit(id)});
$('#tabs').addEventListener('click',e=>{const b=e.target.closest('[data-v]');if(b){view=b.dataset.v;render()}});
$('#custFilter').onchange=$('#tagFilter').onchange=render;
$('#tagFilter').innerHTML+=TAGS.map(t=>`<option>${t}</option>`).join('');
$('#add').addEventListener('submit',e=>{e.preventDefault();if(add($('#addInput').value,view==='cold'?'cold':'focus'))$('#addInput').value=''});
$('#tagBox').innerHTML+=TAGS.map(t=>`<label style="--c:${TC[t]}"><input type="checkbox" name="tag" value="${t}"><span>${t}</span></label>`).join('');

// ===== habits (separate key) =====
const HKEY='heymurph.habits.v1',HCOL=['#ff8a3d','#2fd3e0'];
function hload(){try{const h=JSON.parse(localStorage.getItem(HKEY));if(h&&Array.isArray(h.habits))return h}catch(e){}return{habits:[{name:'Habit 1',color:HCOL[0],days:{}},{name:'Habit 2',color:HCOL[1],days:{}}]}}
let H=hload();const hsave=()=>localStorage.setItem(HKEY,JSON.stringify(H));
const dAgo=n=>{const d=new Date();d.setDate(d.getDate()-n);return new Date(d-d.getTimezoneOffset()*6e4).toISOString().slice(0,10)};
function hstats(h){let cur=0;let n=h.days[dAgo(0)]?0:1;while(h.days[dAgo(n)]){cur++;n++}
 const ks=Object.keys(h.days).filter(k=>h.days[k]).sort();let best=0,run=0,prev=null;
 for(const k of ks){const p=prev&&new Date(new Date(k)-864e5).toISOString().slice(0,10)===prev;run=p?run+1:1;best=Math.max(best,run);prev=k}
 let c=0;for(let i=0;i<30;i++)if(h.days[dAgo(i)])c++;return{cur,best,pct:Math.round(c/30*100)}}
function strip(h,hi){let o='';for(let i=29;i>=0;i--){const x=(29-i)*11,on=h.days[dAgo(i)],ed=i<7;
 o+=`<rect x="${x}" y="0" width="9" height="28" rx="2.5" fill="${on?h.color:'rgba(255,255,255,.07)'}" ${ed?`data-h="${hi}" data-d="${dAgo(i)}" class="ed${i===0?' td':''}"`:''}><title>${dAgo(i)}</title></rect>`}
 return `<svg viewBox="0 0 329 28" class="strip" role="img" aria-label="30 day history">${o}</svg><div class="sl"><span>30 days ago</span><span>tap last 7 to edit</span><span>today</span></div>`}
function weekly(){const W=8,w=300,hh=90;let bars='',lab='';
 for(let k=W-1;k>=0;k--){const x=(W-1-k)*(w/W);H.habits.forEach((h,j)=>{let c=0;for(let i=0;i<7;i++)if(h.days[dAgo(k*7+i)])c++;const bh=c/7*(hh-14);
  bars+=`<rect x="${x+6+j*15}" y="${hh-12-bh}" width="13" height="${Math.max(bh,1.5)}" rx="3" fill="${h.color}"><title>${esc(h.name)}: ${c}/7</title></rect>`});
  lab+=`<text x="${x+20}" y="${hh}" text-anchor="middle">${k?'-'+k+'w':'now'}</text>`}
 return `<svg viewBox="0 0 ${w} ${hh+2}" class="wk" role="img" aria-label="Weekly completion">${[0,.5,1].map(f=>`<line x1="0" x2="${w}" y1="${hh-12-f*(hh-14)}" y2="${hh-12-f*(hh-14)}"/>`).join('')}${bars}${lab}</svg>`}
function renderHabits(){const t=dAgo(0);$('#habits').innerHTML=H.habits.map((h,i)=>{const s=hstats(h),on=h.days[t];
 return `<div class="hcard" style="--c:${h.color}"><div class="hhead"><button class="hname" data-hn="${i}" title="Tap to rename">${esc(h.name)} <span>✎</span></button><span class="hpct">${s.pct}%<small> 30d</small></span></div>
 <button class="hbig${on?' on':''}" data-ht="${i}">${on?'✓ Done today':'Mark today done'}</button>
 <div class="hst"><div><b>${s.cur}</b><span>current streak</span></div><div><b>${s.best}</b><span>best streak</span></div><div><b>${s.pct}%</b><span>last 30 days</span></div></div>${strip(h,i)}</div>`}).join('')
 +`<div class="hcard wkc"><div class="hhead"><span class="hname static">Weekly completion</span><span class="leg">${H.habits.map(h=>`<i style="background:${h.color}"></i>${esc(h.name)}`).join(' ')}</span></div>${weekly()}</div>`}
$('#habits').addEventListener('click',e=>{const b=e.target.closest('[data-ht],[data-hn],[data-d]');if(!b)return;
 if(b.dataset.hn){const h=H.habits[b.dataset.hn],n=prompt('Habit name',h.name);if(n&&n.trim())h.name=n.trim().slice(0,40)}
 else{const h=H.habits[b.dataset.ht??b.dataset.h],d=b.dataset.d||dAgo(0);if(h.days[d])delete h.days[d];else h.days[d]=1}
 hsave();renderHabits()});
let editing=null;
function openEdit(id){editing=items.find(x=>x.id===id);const f=$('#editForm');f.title.value=editing.title;f.customer.value=editing.customer;f.due.value=editing.due;f.top.checked=editing.top;
 f.querySelectorAll('[name=tag]').forEach(c=>c.checked=editing.tags.includes(c.value));$('#edit').showModal()}
$('#edit').addEventListener('close',()=>{const r=$('#edit').returnValue,f=$('#editForm'),i=editing;if(!i)return;editing=null;
 if(r==='delete'){if(confirm('Delete "'+i.title+'"?')){items=items.filter(x=>x!==i);save();render()}return}
 if(r!=='save')return;
 if(f.top.checked&&!i.top){if(i.list!=='focus'||i.done)toast('Top priority only applies to open Focus items.');else if(items.filter(x=>x.top&&!x.done).length>=TOPCAP)toast('Max 3 top priority items.');else i.top=true}else if(!f.top.checked)i.top=false;
 i.title=f.title.value.trim()||i.title;i.customer=f.customer.value.trim();i.due=f.due.value;i.tags=[...f.querySelectorAll('[name=tag]:checked')].map(c=>c.value);save();render()});
// export/import
function toMd(){const sec=(n,l)=>`## ${n}\n`+items.filter(i=>i.list===l).map(i=>`- [${i.done?'x':' '}] ${i.title.replace(/\[/g,'(').replace(/\]/g,')')}`+(i.tags.length?` [tags: ${i.tags.join(', ')}]`:'')+(i.due?` [due: ${i.due}]`:'')+(i.customer?` [customer: ${i.customer}]`:'')+(i.top?' [top]':'')).join('\n');
 return `# Hey Murph Export\n\n${sec('Focus List','focus')}\n\n${sec('Cold Storage','cold')}\n`}
function parseMd(txt){let list=null;const out=[];for(const line of txt.split(/\r?\n/)){const h=line.match(/^#{1,6}\s*(.+)/);if(h){const n=h[1].toLowerCase();list=n.includes('focus')?'focus':n.includes('cold')?'cold':list;continue}
 const m=line.match(/^\s*[-*]\s*\[( |x|X)\]\s*(.+)$/);if(!m||!list)continue;let rest=m[2];const o={done:m[1]!==' '};
 rest=rest.replace(/\s*\[(tags|due|customer):\s*([^\]]*)\]/gi,(_,k,v)=>{k=k.toLowerCase();if(k==='tags')o.tags=v.split(',').map(s=>s.trim().toLowerCase());else o[k]=v.trim();return''}).replace(/\s*\[top\]/i,()=>{o.top=true;return''}).trim();
 if(rest)out.push(mk(rest,list,o))}return out}
function merge(newItems){let moved=0;for(const i of newItems){if(i.list==='focus'&&!i.done&&openIn('focus').length>=CAP){i.list='cold';i.top=false;moved++}
 if(i.top&&items.filter(x=>x.top&&!x.done).length>=TOPCAP)i.top=false;items.push(i)}save();render();toast(`Imported ${newItems.length}`+(moved?`; ${moved} sent to Cold (Focus full)`:''))}
async function share(name,text,type){const file=new File([text],name,{type});
 try{if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({files:[file],title:name});return}}catch(e){if(e.name==='AbortError')return}
 const a=document.createElement('a');a.href=URL.createObjectURL(file);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),5000)}
$('#menuBtn').onclick=()=>$('#menu').showModal();
$('#menu').addEventListener('close',()=>{const r=$('#menu').returnValue,d=today();
 if(r==='md')share(`hey-murph-${d}.md`,toMd(),'text/markdown');
 if(r==='json')share(`hey-murph-backup-${d}.json`,JSON.stringify({app:'hey-murph',version:1,exported:new Date().toISOString(),items,habits:H,journal:J},null,1),'application/json');
 if(r==='importJson')$('#fileIn').click();if(r==='importMd'){$('#pasteText').value='';$('#paste').showModal()}});
$('#paste').addEventListener('close',()=>{if($('#paste').returnValue==='ok'){const n=parseMd($('#pasteText').value);n.length?merge(n):toast('No items found in Markdown.')}});
$('#fileIn').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;try{const d=JSON.parse(await f.text());const arr=Array.isArray(d)?d:d.items;if(!Array.isArray(arr))throw 0;
 if(!confirm(`Replace all current data with ${arr.length} items from backup?`))return;items=arr.map(x=>Object.assign(mk(x.title||'',x.list==='cold'?'cold':'focus',x),{id:x.id||uid(),created:x.created||Date.now(),doneAt:x.doneAt||null}));if(d&&d.journal&&Array.isArray(d.journal.entries)){J=d.journal;jsave()}if(d&&d.habits&&Array.isArray(d.habits.habits)){H=d.habits;hsave()}save();render();toast('Backup restored')}catch(_){toast('Not a valid Hey Murph backup.')}};
const QUOTES=[
"Calm isn't the absence of chaos — it's the presence of a system.",
"A system with clarity on both the problem and the desired outcome has 80% solved its purpose.",
"Don't try to optimize what you should eliminate. Before asking 'How can I do this faster?', ask 'Does this need to be done at all?'",
"Daydreaming for applause is a trap; rehearsing for the real task is a tool.",
"Uncertainty is inevitable — the only real control is the system you build to handle it.",
"You can't stop things from going wrong, but you can build the sprinkler system before the fire.",
"You're not lazy. You're not lost. You're just carrying too many open tabs in your head, and no one taught you how to close them.",
"This book won't decide the path. It will give light so the aspirant can walk their own, with confidence and clarity.",
"Yes, fatigue isn't the problem — the way I'm dealing with it is.",
"Time is the most valuable resource we have.",
"Most of the time, we are like the Roman Emperor Nero, we forget what is important and give importance to things that are not worth our attention."];
let qi=(Math.floor(Date.now()/864e5)+Math.floor(Math.random()*QUOTES.length))%QUOTES.length;
function showQuote(){const b=$('#qText');b.classList.remove('in');void b.offsetWidth;b.textContent=QUOTES[qi];$('#quote').style.setProperty('--h',(qi*47)%360);b.classList.add('in')}
function nextQuote(){qi=(qi+1)%QUOTES.length;showQuote()}
$('#quote').addEventListener('click',nextQuote);$('#quote').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();nextQuote()}});
function greet(){const d=new Date(),h=d.getHours();$('#greet').textContent=(h<5?'Good night':h<12?'Good morning':h<17?'Good afternoon':'Good evening')+', sir';
 $('#dateLine').textContent=d.toLocaleDateString(undefined,{weekday:'long',day:'numeric',month:'long'})}
greet();showQuote();
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js');
if(navigator.storage&&navigator.storage.persist)navigator.storage.persist();
render();
