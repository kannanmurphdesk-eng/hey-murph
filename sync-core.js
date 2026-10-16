'use strict';
// Pure sync helpers (no DOM) — shared by the browser and node tests.
(function(root){
const hashOf=o=>{const c=Object.assign({},o);delete c.updatedAt;return JSON.stringify(c)};
// Stamp updatedAt on changed/new items and create tombstones for removed ones.
// arr: current live items; shadow: {id:hash} from last stamp; tombs: {id:updatedAt}
function stampList(arr,shadow,tombs,now){const seen={},next={};let changed=false;
 for(const it of arr){if(!it||!it.id)continue;seen[it.id]=1;const h=hashOf(it);
  if(shadow[it.id]===undefined){if(!it.updatedAt){it.updatedAt=shadow.__init?now:(it.created||now);changed=true}}
  else if(shadow[it.id]!==h){it.updatedAt=Math.max(now,(it.updatedAt||0)+1);changed=true}
  next[it.id]=h;delete tombs[it.id]}
 for(const id in shadow){if(id!=='__init'&&!seen[id]){tombs[id]=now;changed=true}}
 next.__init=1;return{shadow:next,changed}}
function stampObj(obj,shadowHash,now){const h=hashOf(obj);if(shadowHash!==undefined&&shadowHash!==h){obj.updatedAt=now;}else if(!obj.updatedAt)obj.updatedAt=shadowHash===undefined?0:now;return hashOf(obj)}
// Merge two lists of items (incl. tombstones {id,deleted:true,updatedAt}) by id, newest updatedAt wins; ties keep local.
function mergeList(local,remote){const m=new Map();for(const it of local||[])if(it&&it.id)m.set(it.id,it);
 for(const r of remote||[]){if(!r||!r.id)continue;const l=m.get(r.id);if(!l||(r.updatedAt||0)>(l.updatedAt||0))m.set(r.id,r)}return[...m.values()]}
// Habits: merge per habit, per day (newest tick/untick wins; ties keep the tick) so no history is lost.
function mergeHabits(l,r){if(!r||!Array.isArray(r.habits))return l;if(!l||!Array.isArray(l.habits))return r;const newer=(r.updatedAt||0)>(l.updatedAt||0)?r:l;
 const n=Math.max(l.habits.length,r.habits.length),hs=[];
 for(let k=0;k<n;k++){const a=l.habits[k],b=r.habits[k];if(!a||!b){hs.push(JSON.parse(JSON.stringify(a||b)));continue}
  const base=newer===r?b:a,days={},ts={},at=a.ts||{},bt=b.ts||{};
  for(const d of new Set([...Object.keys(a.days||{}),...Object.keys(b.days||{})])){const ta=at[d]||0,tb=bt[d]||0,va=a.days&&a.days[d],vb=b.days&&b.days[d];
   const v=ta>tb?va:tb>ta?vb:(va||vb);if(v)days[d]=1;else days[d]=0;if(ta||tb)ts[d]=Math.max(ta,tb)}
  hs.push(Object.assign({},base,{days,ts}))}
 return{habits:hs,updatedAt:Math.max(l.updatedAt||0,r.updatedAt||0)}}
function mergeObj(l,r){if(!r)return l;if(!l)return r;return(r.updatedAt||0)>(l.updatedAt||0)?r:l}
const withTombs=(arr,tombs)=>arr.concat(Object.keys(tombs).filter(id=>!arr.some(x=>x.id===id)).map(id=>({id,deleted:true,updatedAt:tombs[id]})));
const split=list=>({live:list.filter(x=>!x.deleted),tombs:Object.fromEntries(list.filter(x=>x.deleted).map(x=>[x.id,x.updatedAt||0]))});
// Full doc merge. Doc = {items, habits, journal, updatedAt}
function mergeDoc(L,R){R=R||{};const items=mergeList(L.items,R.items),journal=mergeList(L.journal,R.journal),habits=mergeHabits(L.habits,R.habits),meta=mergeObj(L.meta,R.meta);
 const ts=[...items,...journal].map(x=>x.updatedAt||0).concat((habits&&habits.updatedAt)||0,(meta&&meta.updatedAt)||0,R.updatedAt||0,L.updatedAt||0);
 return{app:'hey-murph',version:2,updatedAt:Math.max(...ts),items,habits,journal,meta:meta||{lastReviewAt:0,updatedAt:0}}}
function sameDoc(a,b){if(!a||!b)return false;const sig=l=>JSON.stringify((l||[]).map(x=>[x.id,x.updatedAt||0,!!x.deleted]).sort());
 return sig(a.items)===sig(b.items)&&sig(a.journal)===sig(b.journal)&&JSON.stringify(a.habits||{})===JSON.stringify(b.habits||{})&&((a.meta||{}).updatedAt||0)===((b.meta||{}).updatedAt||0)}
const api={mergeHabits,sameDoc,hashOf,stampList,stampObj,mergeList,mergeObj,mergeDoc,withTombs,split};
if(typeof module!=='undefined')module.exports=api;else root.SyncCore=api})(this);
