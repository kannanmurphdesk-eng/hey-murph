'use strict';
// ===== PO funnel information board (not a to-do list). Fields live on the item (flat) and sync via updatedAt.
const POF=[['pot','POT id'],['cost','Cost to us (₹ L)'],['quoted','Quoted (₹ L)'],['cm','CM (₹ L)'],['prob','Probability %'],['due','Expected date'],['principal','Principal'],['model','Model no.'],['eu','End user'],['nxt','Next action']];
const POSW=[['swS','S · Strength'],['swW','W · Weakness'],['swO','O · Opportunity'],['swT','T · Threat']];
let poQ='',poAll=false,poInact=false,poEd=null;
const poAct=i=>i.active!==false;
const pv=v=>String(v==null?'':v).trim();
const isQ=v=>/(^|\s|\()\?($|\s|\))/.test(pv(v))||pv(v)==='?';
const isT=v=>/\bTBD\b/.test(pv(v));
function chip(v,unit){v=pv(v);if(!v)return'<span class="pbl">—</span>';if(v==='?')return'<span class="pq">?</span>';if(v==='TBD')return'<span class="pt">TBD</span>';
 let h=esc(v)+(unit&&/^[\d.]+$/.test(v)?unit:'');if(isQ(v))h+=' <span class="pq">?</span>';else if(isT(v))h+=' <span class="pt">TBD</span>';return h}
const pnum=v=>/^[\d.]+$/.test(pv(v))?+pv(v):0;
const poQs=i=>POF.concat(POSW).filter(([k])=>k!=='pot'&&isQ(i[k])).length;
const poHay=i=>[i.title,i.customer,i.pot,i.principal,i.model,i.nxt,i.notes].join(' ').toLowerCase();
function renderPO(){
 const all=items.filter(i=>i.list==='po'&&!i.done),q=poQ.toLowerCase().trim();
 let L=all.filter(i=>q?poHay(i).includes(q):(poInact?!poAct(i):poAct(i)));
 const act=all.filter(poAct);
 L.sort((a,b)=>(a.due||'9999').localeCompare(b.due||'9999')||pnum(b.cm)-pnum(a.cm));
 const tcm=act.reduce((a,x)=>a+pnum(x.cm),0),tq=act.reduce((a,x)=>a+pnum(x.quoted),0),nq=act.reduce((a,x)=>a+poQs(x),0),nin=all.length-act.length;
 let gl=[];if(q&&poAll)gl=items.filter(i=>i.list!=='po'&&!i.deleted&&[i.title,i.notes,i.customer].join(' ').toLowerCase().includes(q));
 $('#count').innerHTML=`<div class="pobar"><input id="poQ" type="search" placeholder="🔍 Search" value="${esc(poQ)}">
 <div class="pohd"><span>${act.length} active · CM <b>${fcm(tcm)||'₹0 L'}</b>${tq?` · Quoted <b>${fcm(tq)}</b>`:''}</span>${nq?`<span class="pq">${nq} ?</span>`:''}</div>
 <div class="poopt"><label><input type="checkbox" id="poAll"${poAll?' checked':''}> search all lists</label><label><input type="checkbox" id="poIn"${poInact?' checked':''}> Show inactive (${nin})</label></div></div>`;
 let pm=null;
 const sh=v=>{v=pv(v);return v==='?'||v==='TBD'?'':v};
 $('#list').innerHTML=L.map(i=>{const m=(i.due||'').slice(0,7);let h='';if(m!==pm){pm=m;const g=L.filter(x=>(x.due||'').slice(0,7)===m&&poAct(x));h=`<li class="mhd">${m?dmon(i.due):'No date'} · ${fcm(g.reduce((a,x)=>a+pnum(x.cm),0))||'₹0 L'} CM</li>`}
  const nqi=poQs(i),ln=[pnum(i.quoted)?'Q '+fcm(i.quoted):'',pnum(i.cm)?'CM '+fcm(i.cm):'',sh(i.prob)?sh(i.prob)+'%':'',i.due?dmon(i.due):''].filter(Boolean).join(' · ');
  return h+`<li class="pocard${poAct(i)?'':' poin'}" data-po="${i.id}"><div class="pot1">${esc(i.title)}${nqi?` <span class="pdot">${nqi}</span>`:''}</div>${stageRibbon(i,true)}<div class="poln">${ln||'—'}${poAct(i)?'':' · Not active'}</div></li>`}).join('')+(gl.length?`<li class="mhd">Other lists · ${gl.length}</li>`+gl.map(i=>`<li data-id="${i.id}"><div class="body" data-a="edit"><div class="t">${esc(i.title)}</div><div class="m">${LN[i.list]||''}${i.done?' · done':''}</div></div></li>`).join(''):'')||'<li class="empty">No matching opportunities.</li>';
 const qi=$('#poQ');qi.oninput=()=>{poQ=qi.value;const p=qi.selectionStart;renderPO();const n=$('#poQ');n.focus();n.setSelectionRange(p,p)};
 $('#poAll').onchange=e=>{poAll=e.target.checked;renderPO()};$('#poIn').onchange=e=>{poInact=e.target.checked;renderPO()};
}
$('#list').addEventListener('click',e=>{const c=e.target.closest('[data-po]');if(c)openPO(c.dataset.po)},true);
const LEG='<div class="plg">Marks: <span class="pq">?</span> find out ASAP · <span class="pt">TBD</span> next customer meet · blank = not important</div>';
function openPO(id){poEd=items.find(x=>x.id===id);if(!poEd)return;const i=poEd,u={cost:' L',quoted:' L',cm:' L',prob:'%'};
 const row=([k,n])=>`<div class="pdr"><small>${n.replace(/ \(₹ L\)| %/,'')}</small><div>${k==='due'?(i.due?esc(i.due):'<span class="pbl">—</span>'):chip(i[k],u[k])}</div></div>`;
 $('#poBody').innerHTML=`<div class="pdh">${esc(i.title)}</div><div class="pomt">${i.pot?esc(i.pot):''}${poAct(i)?'':' · <span class="pt">Not active</span>'}</div>
 ${stageRibbon(i,false)}
 <div class="pdg">${POF.filter(([k])=>k!=='pot'&&k!=='nxt').map(row).join('')}</div>
 <div class="jlab">SWOT</div><div class="pdg">${POSW.map(row).join('')}</div>${pv(i.notes)?`<div class="jlab">Notes</div><div class="pdn">${esc(i.notes)}</div>`:''}${LEG}
 <div class="btns"><button value="cancel">Close</button><button type="button" class="primary" id="poEditBtn">Edit</button></div>`;
 $('#poEditBtn').onclick=()=>{poEd=i;openPOEdit(i)};
 $('#poEdit').showModal()}
function openPOEdit(i){
 $('#poBody').innerHTML=`<div class="st-h">✏️ Edit opportunity</div><label>Title (Customer - Product - Contact)<input name="title" value="${esc(i.title)}"></label>
 <label class="row"><input type="checkbox" name="active"${poAct(i)?' checked':''}> Active case</label>
 ${stagePicker(i)}
 <div class="fpog">${POF.map(([k,n])=>`<label>${n}<input name="${k}"${k==='due'?' type="date"':''} value="${esc(i[k]||'')}"></label>`).join('')}</div>
 <div class="jlab">SWOT</div>${POSW.map(([k,n])=>`<label>${n}<textarea name="${k}" rows="2">${esc(i[k]||'')}</textarea></label>`).join('')}
 <label>Notes<textarea name="notes" rows="3">${esc(i.notes||'')}</textarea></label>
 <label>Move list<select name="list">${Object.keys(LN).map(l=>`<option value="${l}"${l==='po'?' selected':''}>${LN[l]}</option>`).join('')}</select></label>
 <div class="btns"><button value="delete" class="danger">Delete</button><button value="cancel" formnovalidate>Cancel</button><button value="save" class="primary">Save</button></div>`;
 if(!$('#poEdit').open)$('#poEdit').showModal()}
$('#poEdit').addEventListener('close',()=>{const r=$('#poEdit').returnValue,f=$('#poForm'),i=poEd;if(!i||!f.title)return;poEd=null;
 if(r==='delete'){if(confirm('Delete "'+i.title+'"?')){items=items.filter(x=>x!==i);save();render()}return}
 if(r!=='save')return;
 i.title=f.title.value.trim()||i.title;i.active=f.active.checked;
 for(const[k]of POF.concat(POSW))i[k]=f[k].value.trim();
 if(f.notes.value.trim()||i.notes)i.notes=f.notes.value;
 if(!(f.stage&&applyStagePick(i,f.stage.value))&&f.list.value!=='po'&&canIn(f.list.value))i.list=f.list.value;
 i.updatedAt=Date.now();save();render()});
