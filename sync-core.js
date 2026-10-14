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
function mergeObj(l,r){if(!r)return l;if(!l)return r;return(r.updatedAt||0)>(l.updatedAt||0)?r:l}
const withTombs=(arr,tombs)=>arr.concat(Object.keys(tombs).filter(id=>!arr.some(x=>x.id===id)).map(id=>({id,deleted:true,updatedAt:tombs[id]})));
const split=list=>({live:list.filter(x=>!x.deleted),tombs:Object.fromEntries(list.filter(x=>x.deleted).map(x=>[x.id,x.updatedAt||0]))});
// Full doc merge. Doc = {items, habits, journal, updatedAt}
function mergeDoc(L,R){R=R||{};const items=mergeList(L.items,R.items),journal=mergeList(L.journal,R.journal),habits=mergeObj(L.habits,R.habits);
 const ts=[...items,...journal].map(x=>x.updatedAt||0).concat((habits&&habits.updatedAt)||0,R.updatedAt||0,L.updatedAt||0);
 return{app:'hey-murph',version:2,updatedAt:Math.max(...ts),items,habits,journal}}
function sameDoc(a,b){if(!a||!b)return false;const sig=l=>JSON.stringify((l||[]).map(x=>[x.id,x.updatedAt||0,!!x.deleted]).sort());
 return sig(a.items)===sig(b.items)&&sig(a.journal)===sig(b.journal)&&((a.habits||{}).updatedAt||0)===((b.habits||{}).updatedAt||0)}
const api={sameDoc,hashOf,stampList,stampObj,mergeList,mergeObj,mergeDoc,withTombs,split};
if(typeof module!=='undefined')module.exports=api;else root.SyncCore=api})(this);
