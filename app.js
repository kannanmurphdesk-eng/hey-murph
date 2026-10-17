'use strict';
const TAGS=['damage control','preventive damage control','overdue','quick wins','delegation','necessary task'];
const TC={'damage control':'#ff6b5e','preventive damage control':'#ffb547','overdue':'#ff4fb4','quick wins':'#3ddc84','delegation':'#2fd3e0','necessary task':'#a66bff'};
const CAP=10,TOPCAP=3,KEY='heymurph.v1';
const LN={focus:'Focus',next:'Next Action',radar:'Under Radar',cold:'Cold Storage',po:'PO funnel',del:'Delivery cases',pay:'Payment pending'},CAPPED=['focus','next','radar'],FLOWV=['po','del','pay'];
const fmon=m=>{if(!m)return'';const[y,mo]=m.split('-');return new Date(+y,+mo-1,1).toLocaleString('en-IN',{month:'short',year:'numeric'})};
const fcm=v=>v?'₹'+(+v).toLocaleString('en-IN',{maximumFractionDigits:2})+' L':'';
let fview='po';
let items=load(),view='focus';
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
function mk(title,list,o={}){return{id:uid(),title:title.trim(),list,tags:(o.tags||[]).filter(t=>TAGS.includes(t)),due:o.due||'',customer:(o.customer||'').trim(),top:!!o.top&&list==='focus',done:!!o.done,created:Date.now(),doneAt:o.done?Date.now():null,...(Array.isArray(o.subs)&&o.subs.length?{subs:o.subs}:{}),...(o.cm?{cm:String(o.cm)}:{}),...(o.month?{month:String(o.month)}:{})}}
function add(title,list){if(!title.trim())return false;if(!canIn(list))return false;items.push(mk(title,list));save();render();return true}
function move(id,to){const i=items.find(x=>x.id===id);if(!to||to===i.list||!canIn(to))return render();i.list=to;if(to!=='focus')i.top=false;save();render()}
function toggleDone(id){const i=items.find(x=>x.id===id);if(i.done&&!canIn(i.list))return;i.done=!i.done;i.doneAt=i.done?Date.now():null;if(i.done)i.top=false;save();render()}
function esc(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
function render(){
 if(typeof fmigrate==='function')fmigrate();
 if(view==='flow')view=fview;const flv=FLOWV.includes(view);if(flv)fview=view;
 const hv=view==='habits'||view==='journal'||view==='travel';$('#habits').hidden=view!=='habits';$('#travel').hidden=view!=='travel';if(view==='travel'&&typeof renderTravel==='function')renderTravel();$('#journal').hidden=view!=='journal';$('#flow').hidden=!flv;if(flv&&typeof renderFlow==='function')renderFlow();['#filters','#count','#list'].forEach(q=>$(q).hidden=hv);if(view==='habits')renderHabits();if(view==='journal'&&typeof renderJournal==='function')renderJournal();
 const fv=CAPPED.includes(view);document.querySelectorAll('#tabs button').forEach(b=>b.classList.toggle('on',b.dataset.v===view||(fv&&b.dataset.v==='focus')||(flv&&b.dataset.v==='flow')));
 let sb=$('#sub');if(!sb){sb=document.createElement('div');sb.id='sub';$('#filters').before(sb);sb.onclick=e=>{const b=e.target.closest('[data-s]');if(b){view=b.dataset.s;render()}}}
 sb.hidden=!fv;sb.innerHTML=CAPPED.map(l=>`<button data-s="${l}" class="${view===l?'on':''}">${LN[l]} <small>${openIn(l).length}/${CAP}</small></button>`).join('');
 const tf=$('#tagFilter').value;
 let L=hv?[]:view==='done'?items.filter(i=>i.done):openIn(view);
 if(tf)L=L.filter(i=>i.tags.includes(tf));
 if(view==='done')L.sort((a,b)=>b.doneAt-a.doneAt);else if(view==='po')L.sort((a,b)=>(a.month||'9999').localeCompare(b.month||'9999'));else L.sort((a,b)=>(b.top-a.top));
 const f=openIn('focus').length;$('#count').textContent=view==='focus'?`${f}/${CAP} open · ${openIn('focus').filter(i=>i.top).length}/${TOPCAP} top`:fv?`${openIn(view).length}/${CAP} open`:flv?`${LN[view]} · ${L.length} open`:`${L.length} item(s)`;
 $('#quote').style.display=view==='focus'?'':'none';
 $('#add').style.display=(fv||flv||view==='cold')?'flex':'none';$('#addInput').placeholder='Quick add to '+(LN[view]||'list')+'…';
 $('#list').innerHTML=L.map(i=>`<li class="${i.top?'top':''}" data-id="${i.id}" style="--stripe:${i.tags[0]?TC[i.tags[0]]:i.top?'#f5c96a':'#8f6bff'}"><button class="chk${i.done?' on':''}" data-a="done" aria-label="${i.done?'Undo':'Done'}">${i.done?'✓':''}</button>
 <div class="body" data-a="edit"><div class="t">${esc(i.title)}${i.done&&typeof hasInsight==='function'&&hasInsight(i.id)?' <span class="insm" title="Has insight">💡</span>':''}</div><div class="m">${i.tags.map(t=>`<span class="tag" style="--c:${TC[t]||'#8f6bff'}">${esc(t)}</span>`).join('')}${i.list==='po'&&(i.cm||i.month)?`<span class="fpo">${[fcm(i.cm),fmon(i.month)].filter(Boolean).join(' · ')}</span> `:''}${i.subs&&i.subs.length?`☑ ${i.subs.filter(s=>s.done).length}/${i.subs.length} `:''}${i.notes?'📝 ':''}${i.jid?'📓 ':''}${i.due?`<span class="${isOver(i)?'od':''}">📅 ${i.due}${isOver(i)?' · overdue':''}</span>`:''}${view==='done'?' · '+(LN[i.list]||''):''}</div></div>
 ${i.done?(typeof hasInsight==='function'?`<button class="mv ins${hasInsight(i.id)?' has':''}" data-a="insight">${hasInsight(i.id)?'💡':'💡 Insight'}</button>`:''):`<select class="mv" data-mv aria-label="Move to"><option value="">Move ▾</option>${Object.keys(LN).filter(l=>l!==i.list).map(l=>`<option value="${l}">→ ${LN[l]}</option>`).join('')}</select>`}</li>`).join('')||'<li class="empty">Nothing here. Clear skies.</li>';
}
$('#list').addEventListener('click',e=>{const a=e.target.closest('[data-a]');if(!a)return;const id=a.closest('li').dataset.id;
 if(a.dataset.a==='done')toggleDone(id);else if(a.dataset.a==='move')move(id);else if(a.dataset.a==='insight')openInsight(id);else openEdit(id)});
$('#list').addEventListener('change',e=>{const s=e.target.closest('[data-mv]');if(s)move(s.closest('li').dataset.id,s.value)});
$('#tabs').addEventListener('click',e=>{const b=e.target.closest('[data-v]');if(b){view=b.dataset.v;render()}});
$('#tagFilter').onchange=render;
$('#tagFilter').innerHTML+=TAGS.map(t=>`<option>${t}</option>`).join('');
$('#add').addEventListener('submit',e=>{e.preventDefault();if(add($('#addInput').value,LN[view]?view:'focus'))$('#addInput').value=''});
$('#tagBox').innerHTML+=TAGS.map(t=>`<label style="--c:${TC[t]}"><input type="checkbox" name="tag" value="${t}"><span>${t}</span></label>`).join('');

// ===== habits (separate key) =====
const HKEY='heymurph.habits.v1',HCOL=['#ff8a3d','#2fd3e0'];
function hload(){try{const h=JSON.parse(localStorage.getItem(HKEY));if(h&&Array.isArray(h.habits))return h}catch(e){}return{habits:[{name:'Habit 1',color:HCOL[0],days:{}},{name:'Habit 2',color:HCOL[1],days:{}}]}}
let H=hload();const hsave=()=>localStorage.setItem(HKEY,JSON.stringify(H));
const dAgo=n=>{const d=new Date();d.setDate(d.getDate()-n);return new Date(d-d.getTimezoneOffset()*6e4).toISOString().slice(0,10)};
const hoff=(h,d)=>!!(h.dl&&h.log&&h.log[d]&&!h.log[d].del&&['hol','leave','wo','office'].includes(h.log[d].type)&&!h.days[d]);
function hstats(h){let cur=0;let n=h.days[dAgo(0)]||hoff(h,dAgo(0))?0:1;for(let g=0;g<400;g++){const d=dAgo(n);if(h.days[d])cur++;else if(!hoff(h,d))break;n++}
 const ks=Object.keys(h.days).filter(k=>h.days[k]).sort();let best=0,run=0,prev=null;
 for(const k of ks){let p=false;if(prev){let x=new Date(prev+'T00:00');for(let g=0;g<60;g++){x.setDate(x.getDate()+1);const xd=new Date(x-x.getTimezoneOffset()*6e4).toISOString().slice(0,10);if(xd===k){p=true;break}if(!hoff(h,xd))break}}run=p?run+1:1;best=Math.max(best,run);prev=k}
 let c=0,tot=0;for(let i=0;i<30;i++){const d=dAgo(i);if(hoff(h,d))continue;tot++;if(h.days[d])c++}return{cur,best,pct:tot?Math.round(c/tot*100):0}}
function strip(h,hi){let o='';for(let i=29;i>=0;i--){const x=(29-i)*11,on=h.days[dAgo(i)],ed=i<7;
 o+=`<rect x="${x}" y="0" width="9" height="28" rx="2.5" fill="${on?h.color:hoff(h,dAgo(i))?'rgba(255,255,255,.32)':'rgba(255,255,255,.07)'}" ${ed?`data-h="${hi}" data-d="${dAgo(i)}" class="ed${i===0?' td':''}"`:''}><title>${dAgo(i)}</title></rect>`}
 return `<svg viewBox="0 0 329 28" class="strip" role="img" aria-label="30 day history">${o}</svg><div class="sl"><span>30 days ago</span><span>tap last 7 to edit</span><span>today</span></div>`}
function weekly(){const W=8,w=300,hh=90;let bars='',lab='';
 for(let k=W-1;k>=0;k--){const x=(W-1-k)*(w/W);H.habits.forEach((h,j)=>{let c=0;for(let i=0;i<7;i++)if(h.days[dAgo(k*7+i)])c++;const bh=c/7*(hh-14);
  bars+=`<rect x="${x+6+j*15}" y="${hh-12-bh}" width="13" height="${Math.max(bh,1.5)}" rx="3" fill="${h.color}"><title>${esc(h.name)}: ${c}/7</title></rect>`});
  lab+=`<text x="${x+20}" y="${hh}" text-anchor="middle">${k?'-'+k+'w':'now'}</text>`}
 return `<svg viewBox="0 0 ${w} ${hh+2}" class="wk" role="img" aria-label="Weekly completion">${[0,.5,1].map(f=>`<line x1="0" x2="${w}" y1="${hh-12-f*(hh-14)}" y2="${hh-12-f*(hh-14)}"/>`).join('')}${bars}${lab}</svg>`}
function renderHabits(){const t=dAgo(0);$('#habits').innerHTML=H.habits.map((h,i)=>{const s=hstats(h),on=h.days[t];
 return `<div class="hcard" style="--c:${h.color}"><div class="hhead"><button class="hname" data-hn="${i}" title="Tap to rename">${esc(h.name)} <span>✎</span></button><span class="hpct">${s.pct}%<small> 30d</small></span></div>
 <button class="hbig${on?' on':''}" data-ht="${i}">${on?'✓ Done today':'Mark today done'}${h.dl&&h.log&&h.log[t]&&!h.log[t].del&&h.log[t].type?' · '+dlName(h.log[t].type):''}</button>
 <div class="hst"><div><b>${s.cur}</b><span>current streak</span></div><div><b>${s.best}</b><span>best streak</span></div><div><b>${s.pct}%</b><span>last 30 days</span></div></div>${strip(h,i)}<button class="dltg" data-dlt="${i}">${h.dl?'📍 Day log on':'📍 Add day log (place, plan vs actual)'}</button>${h.dl?dlMini(i):''}</div>`}).join('')
 +`<div class="hcard wkc"><div class="hhead"><span class="hname static">Weekly completion</span><span class="leg">${H.habits.map(h=>`<i style="background:${h.color}"></i>${esc(h.name)}`).join(' ')}</span></div>${weekly()}</div>`}
$('#habits').addEventListener('click',e=>{if(e.target.closest('.dlp,.dltg'))return;const b=e.target.closest('[data-ht],[data-hn],[data-d]');if(!b)return;
 if(b.dataset.hn){const h=H.habits[b.dataset.hn],n=prompt('Habit name',h.name);if(n&&n.trim())h.name=n.trim().slice(0,40)}
 else{const h=H.habits[b.dataset.ht??b.dataset.h],d=b.dataset.d||dAgo(0);if(h.dl&&!h.days[d]){dlOpen(+(b.dataset.ht??b.dataset.h),d);return}h.days[d]=h.days[d]?0:1;h.ts=h.ts||{};h.ts[d]=Date.now()}
 hsave();renderHabits()});
let editing=null;
let esubs=[];
function drawSubs(){$('#eSubs').innerHTML=esubs.map((s,k)=>`<div class="fsub"><input type="checkbox" data-si="${k}"${s.done?' checked':''}><span class="${s.done?'dn':''}">${esc(s.t)}</span><button type="button" data-sd="${k}" aria-label="Delete">✕</button></div>`).join('')}
(function(){const f=$('#editForm'),n=f.notes.closest('label');const po=document.createElement('div');po.id='ePo';po.className='fpog';po.innerHTML='<label>Expected CM (₹ lakh)<input name="cm" type="number" step="0.01" min="0" inputmode="decimal" placeholder="e.g. 2.5"></label><label>Expected month<input name="month" type="month"></label>';
 const sb=document.createElement('div');sb.innerHTML='<div class="fsl">Sub-tasks</div><div id="eSubs"></div><div class="fsadd"><input id="eSubIn" placeholder="Add sub-task…"><button type="button" id="eSubBtn">+</button></div>';
 const ls=document.createElement('label');ls.innerHTML='List<select name="list">'+Object.keys(LN).map(l=>`<option value="${l}">${LN[l]}</option>`).join('')+'</select>';
 f.title.closest('label').after(ls);ls.after(po);n.before(sb);
 const addS=()=>{const v=$('#eSubIn').value.trim();if(!v)return;esubs.push({t:v,done:false});$('#eSubIn').value='';drawSubs()};
 $('#eSubBtn').onclick=addS;$('#eSubIn').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();addS()}};
 $('#eSubs').onclick=e=>{const d=e.target.closest('[data-sd]');if(d){esubs.splice(+d.dataset.sd,1);drawSubs()}};
 $('#eSubs').onchange=e=>{const c=e.target.closest('[data-si]');if(c){esubs[+c.dataset.si].done=c.checked;drawSubs()}};
 f.list.onchange=()=>{po.hidden=f.list.value!=='po'}})();
function openEdit(id){editing=items.find(x=>x.id===id);const f=$('#editForm');f.title.value=editing.title;f.due.value=editing.due;f.top.checked=editing.top;f.notes.value=editing.notes||'';
 f.list.value=editing.list;f.cm.value=editing.cm||'';f.month.value=editing.month||'';$('#ePo').hidden=editing.list!=='po';esubs=JSON.parse(JSON.stringify(editing.subs||[]));drawSubs();$('#eSubIn').value='';
 f.querySelectorAll('[name=tag]').forEach(c=>c.checked=editing.tags.includes(c.value));$('#edit').showModal()}
$('#edit').addEventListener('close',()=>{const r=$('#edit').returnValue,f=$('#editForm'),i=editing;if(!i)return;editing=null;
 if(r==='delete'){if(confirm('Delete "'+i.title+'"?')){items=items.filter(x=>x!==i);save();render()}return}
 if(r!=='save')return;
 if(f.list.value!==i.list){if(!i.done&&!canIn(f.list.value))return;i.list=f.list.value;if(i.list!=='focus')i.top=false}
 if(esubs.length||i.subs)i.subs=esubs;if(i.list==='po'){if(f.cm.value||i.cm)i.cm=f.cm.value;if(f.month.value||i.month)i.month=f.month.value}
 if(f.top.checked&&!i.top){if(i.list!=='focus'||i.done)toast('Top priority only applies to open Focus items.');else if(items.filter(x=>x.top&&!x.done).length>=TOPCAP)toast('Max 3 top priority items.');else i.top=true}else if(!f.top.checked)i.top=false;
 i.title=f.title.value.trim()||i.title;i.due=f.due.value;if(f.notes.value.trim()||i.notes)i.notes=f.notes.value;i.tags=[...f.querySelectorAll('[name=tag]:checked')].map(c=>c.value);save();render()});
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
