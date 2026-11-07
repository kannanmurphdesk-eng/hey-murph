'use strict';
// ===== PO funnel information board (not a to-do list). Fields live on the item (flat) and sync via updatedAt.
const POF=[['pot','POT id'],['stage','Stage'],['cost','Cost to us (₹ L)'],['quoted','Quoted (₹ L)'],['cm','CM (₹ L)'],['prob','Probability %'],['due','Expected date'],['principal','Principal'],['model','Model no.'],['nxt','Next action']];
const POSW=[['swS','S · Strength'],['swW','W · Weakness'],['swO','O · Opportunity'],['swT','T · Threat']];
const POSTAGES=['Lead','Expected 75%','Expected 90%','Quoted 25%','Quoted 50%','Quoted 75%','Tender 50%','Public tender 75%','Limited tender 75%','Won','Lost'];
let poQ='',poAll=false,poInact=false,poEd=null;
const poAct=i=>i.active!==false;
const pv=v=>String(v==null?'':v).trim();
const isQ=v=>/(^|\s|\()\?($|\s|\))/.test(pv(v))||pv(v)==='?';
const isT=v=>/\bTBD\b/.test(pv(v));
function chip(v,unit){v=pv(v);if(!v)return'<span class="pbl">—</span>';if(v==='?')return'<span class="pq">?</span>';if(v==='TBD')return'<span class="pt">TBD</span>';
 let h=esc(v)+(unit&&/^[\d.]+$/.test(v)?unit:'');if(isQ(v))h+=' <span class="pq">?</span>';else if(isT(v))h+=' <span class="pt">TBD</span>';return h}
const pnum=v=>/^[\d.]+$/.test(pv(v))?+pv(v):0;
const poQs=i=>POF.concat(POSW).filter(([k])=>k!=='stage'&&k!=='pot'&&isQ(i[k])).length;
const poHay=i=>[i.title,i.customer,i.pot,i.principal,i.model,i.nxt,i.stage,i.notes].join(' ').toLowerCase();
function renderPO(){
 const all=items.filter(i=>i.list==='po'&&!i.done),q=poQ.toLowerCase().trim();
 let L=all.filter(i=>q?poHay(i).includes(q):(poInact?!poAct(i):poAct(i)));
 const act=all.filter(poAct);
 L.sort((a,b)=>(a.due||'9999').localeCompare(b.due||'9999')||pnum(b.cm)-pnum(a.cm));
 const tcm=act.reduce((a,x)=>a+pnum(x.cm),0),tq=act.reduce((a,x)=>a+pnum(x.quoted),0),nq=act.reduce((a,x)=>a+poQs(x),0),nin=all.length-act.length;
 let gl=[];if(q&&poAll)gl=items.filter(i=>i.list!=='po'&&!i.deleted&&[i.title,i.notes,i.customer].join(' ').toLowerCase().includes(q));
 $('#count').innerHTML=`<div class="pobar"><input id="poQ" type="search" placeholder="🔍 Search customer, product, principal, model, contact, POT…" value="${esc(poQ)}">
 <div class="pohd"><span>${act.length} active · CM <b>${fcm(tcm)||'₹0 L'}</b>${tq?` · Quoted <b>${fcm(tq)}</b>`:''}</span>${nq?`<span class="pq">${nq} ?</span>`:''}</div>
 <div class="poopt"><label><input type="checkbox" id="poAll"${poAll?' checked':''}> search all lists</label><label><input type="checkbox" id="poIn"${poInact?' checked':''}> Show inactive (${nin})</label><span class="plg"><span class="pq">?</span> find out ASAP <span class="pt">TBD</span> next meet — blank: not important</span></div></div>`;
 let pm=null;
 $('#list').innerHTML=L.map(i=>{const m=(i.due||'').slice(0,7);let h='';if(m!==pm){pm=m;const g=L.filter(x=>(x.due||'').slice(0,7)===m&&poAct(x));h=`<li class="mhd">${m?dmon(i.due):'No date'} · CM ${fcm(g.reduce((a,x)=>a+pnum(x.cm),0))||'₹0 L'}${g.some(x=>pnum(x.quoted))?' · Q '+fcm(g.reduce((a,x)=>a+pnum(x.quoted),0)):''}</li>`}
  const nqi=poQs(i);
  return h+`<li class="pocard${poAct(i)?'':' poin'}" data-po="${i.id}"><div class="pot1">${esc(i.title)}${nqi?` <span class="pq">${nqi}?</span>`:''}</div>
  <div class="pomt">${i.pot?`<span>${esc(i.pot)}</span>`:''}${i.stage?`<span class="pst">${esc(i.stage)}</span>`:''}${poAct(i)?'':'<span class="pt">Not active</span>'}</div>
  <div class="pogr"><div><small>Principal</small>${chip(i.principal)}</div><div><small>Model</small>${chip(i.model)}</div><div><small>Quoted</small>${chip(i.quoted,' L')}</div><div><small>CM</small>${chip(i.cm,' L')}</div><div><small>Prob</small>${chip(i.prob,'%')}</div><div><small>Expected</small>${i.due?esc(i.due):'<span class="pbl">—</span>'}</div></div>
  ${pv(i.nxt)?`<div class="ponx">➜ ${chip(i.nxt)}</div>`:''}</li>`}).join('')+(gl.length?`<li class="mhd">Other lists · ${gl.length}</li>`+gl.map(i=>`<li data-id="${i.id}"><div class="body" data-a="edit"><div class="t">${esc(i.title)}</div><div class="m">${LN[i.list]||''}${i.done?' · done':''}</div></div></li>`).join(''):'')||'<li class="empty">No matching opportunities.</li>';
 const qi=$('#poQ');qi.oninput=()=>{poQ=qi.value;const p=qi.selectionStart;renderPO();const n=$('#poQ');n.focus();n.setSelectionRange(p,p)};
 $('#poAll').onchange=e=>{poAll=e.target.checked;renderPO()};$('#poIn').onchange=e=>{poInact=e.target.checked;renderPO()};
}
$('#list').addEventListener('click',e=>{const c=e.target.closest('[data-po]');if(c)openPO(c.dataset.po)},true);
function openPO(id){poEd=items.find(x=>x.id===id);if(!poEd)return;const i=poEd;
 $('#poBody').innerHTML=`<div class="st-h">📋 Opportunity</div><label>Title (Customer - Product - Contact)<input name="title" value="${esc(i.title)}"></label>
 <label class="row"><input type="checkbox" name="active"${poAct(i)?' checked':''}> Active case</label>
 <div class="fpog">${POF.map(([k,n])=>k==='stage'?`<label>${n}<input name="stage" list="poStL" value="${esc(i.stage||'')}"></label>`:`<label>${n}<input name="${k}"${k==='due'?' type="date"':''} value="${esc(i[k]||'')}"></label>`).join('')}</div>
 <datalist id="poStL">${POSTAGES.map(s=>`<option value="${s}">`).join('')}</datalist>
 <div class="jlab">SWOT</div>${POSW.map(([k,n])=>`<label>${n}<textarea name="${k}" rows="2">${esc(i[k]||'')}</textarea></label>`).join('')}
 <label>Notes<textarea name="notes" rows="3">${esc(i.notes||'')}</textarea></label>
 <label>Move list<select name="list">${Object.keys(LN).map(l=>`<option value="${l}"${l==='po'?' selected':''}>${LN[l]}</option>`).join('')}</select></label>
 <div class="plg">Marks: <span class="pq">?</span> find out ASAP · <span class="pt">TBD</span> next customer meet · blank = not important</div>
 <div class="btns"><button value="delete" class="danger">Delete</button><button value="cancel" formnovalidate>Cancel</button><button value="save" class="primary">Save</button></div>`;
 $('#poEdit').showModal()}
$('#poEdit').addEventListener('close',()=>{const r=$('#poEdit').returnValue,f=$('#poForm'),i=poEd;poEd=null;if(!i)return;
 if(r==='delete'){if(confirm('Delete "'+i.title+'"?')){items=items.filter(x=>x!==i);save();render()}return}
 if(r!=='save')return;
 i.title=f.title.value.trim()||i.title;i.active=f.active.checked;
 for(const[k]of POF.concat(POSW))i[k]=f[k].value.trim();
 if(f.notes.value.trim()||i.notes)i.notes=f.notes.value;
 if(/^won$/i.test(i.stage)||/^lost$/i.test(i.stage)){i.done=true;i.doneAt=Date.now()}
 if(f.list.value!=='po'&&canIn(f.list.value))i.list=f.list.value;
 i.updatedAt=Date.now();save();render()});
