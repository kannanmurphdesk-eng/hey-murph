'use strict';
// ===== Local PIN lock (key heymurph.pin.v1: {salt,hash,fails,until}) =====
(function(){
const PK='heymurph.pin.v1',BG=60e3,MAXF=5,COOL=30e3;
const getP=()=>{try{return JSON.parse(localStorage.getItem(PK))}catch(e){return null}},putP=p=>localStorage.setItem(PK,JSON.stringify(p));
const hex=b=>[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');
const H=async(salt,pin)=>hex(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(salt+':'+pin)));
const el=document.createElement('div');el.id='lock';el.hidden=true;el.innerHTML=`<div class="lk-in"><img src="icons/logo.png" alt="" class="lk-logo"><div class="lk-t">Hey Murph</div><div class="lk-msg" id="lkMsg">Enter PIN</div>
<div class="lk-dots" id="lkDots"><i></i><i></i><i></i><i></i></div><div class="lk-pad">${[1,2,3,4,5,6,7,8,9].map(n=>`<button data-k="${n}">${n}</button>`).join('')}<button data-k="x" class="lk-sm" id="lkCancel">Cancel</button><button data-k="0">0</button><button data-k="b" class="lk-sm" aria-label="Delete">⌫</button></div>
<button class="lk-forgot" id="lkBio" style="font-size:1.05em">👆 Use fingerprint</button><button class="lk-forgot" id="lkForgot">Forgot PIN?</button></div>`;document.body.appendChild(el);
let mode=null,buf='',first='',cb=null,hiddenAt=0,ctimer=null;
const $l=s=>el.querySelector(s);
function dots(){$l('#lkDots').querySelectorAll('i').forEach((d,i)=>d.classList.toggle('on',i<buf.length))}
function msg(t,bad){const m=$l('#lkMsg');m.textContent=t;m.classList.toggle('bad',!!bad)}
function shake(){const d=$l('#lkDots');d.classList.remove('shake');void d.offsetWidth;d.classList.add('shake');navigator.vibrate&&navigator.vibrate(120)}
function show(m,opt={}){mode=m;buf='';first='';cb=opt.cb||null;el.hidden=false;document.documentElement.classList.add('locked');
 $l('#lkCancel').style.visibility=m==='unlock'?'hidden':'visible';$l('#lkForgot').style.display=m==='set'?'none':'';$l('#lkBio').style.display=(m==='unlock'&&getB()&&bioOK())?'':'none';if(m==='unlock'&&getB())setTimeout(bioUnlock,300);msg(opt.title||'Enter PIN');dots();cool()}
function hide(){el.hidden=true;mode=null;buf='';document.documentElement.classList.remove('locked')}
function cool(){clearInterval(ctimer);const p=getP();if(!p||!p.until||Date.now()>=p.until)return false;
 const tick=()=>{const s=Math.ceil((p.until-Date.now())/1e3);if(s<=0){clearInterval(ctimer);msg('Enter PIN');return}msg(`Too many tries — wait ${s}s`,true)};tick();ctimer=setInterval(tick,500);return true}
async function enter(){const p=getP();
 if(mode==='set'){if(!first){first=buf;buf='';dots();msg('Enter the same PIN again');return}
  if(buf!==first){shake();first='';buf='';setTimeout(()=>{dots();msg('PINs did not match — enter a new PIN',true)},300);return}
  const salt=hex(crypto.getRandomValues(new Uint8Array(16)));putP({salt,hash:await H(salt,buf),fails:0,until:0});hide();toast('PIN set');return}
 if(!p){hide();return}if(p.until&&Date.now()<p.until){buf='';dots();return}
 if(await H(p.salt,buf)===p.hash){p.fails=0;p.until=0;putP(p);try{sessionStorage.setItem('heymurph.unlocked','1')}catch(e){}const c=cb;hide();if(c)c();return}
 p.fails=(p.fails||0)+1;if(p.fails>=MAXF){p.fails=0;p.until=Date.now()+COOL}putP(p);shake();buf='';setTimeout(()=>{dots();if(!cool())msg(`Wrong PIN (${MAXF-((p.fails)||0)} tries left)`,true)},350)}
el.addEventListener('click',e=>{const b=e.target.closest('[data-k]');if(!b||!mode)return;const k=b.dataset.k;
 if(k==='x'){if(mode!=='unlock')hide();return}if(k==='b'){buf=buf.slice(0,-1);dots();return}
 const p=getP();if(mode!=='set'&&p&&p.until&&Date.now()<p.until)return;if(buf.length<4){buf+=k;dots();if(buf.length===4)setTimeout(enter,120)}});
document.addEventListener('keydown',e=>{if(!mode)return;if(/^\d$/.test(e.key))el.querySelector(`[data-k="${e.key}"]`).click();else if(e.key==='Backspace')el.querySelector('[data-k=b]').click()});
$l('#lkForgot').onclick=()=>{const t=prompt('Forgot PIN — Reset app?\n\nThis CLEARS ALL Hey Murph data on this device (tasks, habits, journal, PIN, Dropbox connection).\nIf you use Dropbox sync, reconnect Dropbox afterwards to re-sync your data from the Dropbox copy.\n\nType RESET to confirm:');
 if(t===null)return;if(t.trim()!=='RESET'){toast('Not reset (you must type RESET)');return}
 window.__hmReset=true;Object.keys(localStorage).filter(k=>k.startsWith('heymurph.')).forEach(k=>localStorage.removeItem(k));try{sessionStorage.clear()}catch(e){}location.reload()};
const BK='heymurph.bio.v1',getB=()=>localStorage.getItem(BK),b64=b=>btoa(String.fromCharCode(...new Uint8Array(b))),ub64=t=>Uint8Array.from(atob(t),c=>c.charCodeAt(0));
const bioOK=()=>!!(window.PublicKeyCredential&&navigator.credentials);
async function bioUnlock(){const id=getB();if(!id||!bioOK()||mode!=='unlock')return;try{const c=await navigator.credentials.get({publicKey:{challenge:crypto.getRandomValues(new Uint8Array(32)),allowCredentials:[{type:'public-key',id:ub64(id)}],userVerification:'required',timeout:60000}});
 if(c&&mode==='unlock'){const p=getP();if(p){p.fails=0;p.until=0;putP(p)}try{sessionStorage.setItem('heymurph.unlocked','1')}catch(e){}hide()}}catch(e){msg('Fingerprint cancelled — enter PIN')}}
async function bioEnroll(){try{const c=await navigator.credentials.create({publicKey:{challenge:crypto.getRandomValues(new Uint8Array(32)),rp:{name:'Hey Murph',id:location.hostname},user:{id:crypto.getRandomValues(new Uint8Array(16)),name:'kannan',displayName:'Hey Murph'},pubKeyCredParams:[{type:'public-key',alg:-7},{type:'public-key',alg:-257}],authenticatorSelection:{authenticatorAttachment:'platform',userVerification:'required',residentKey:'discouraged'},timeout:60000}});
 localStorage.setItem(BK,b64(c.rawId));toast('Fingerprint unlock on')}catch(e){toast('Fingerprint not set up')}}
$l('#lkBio').onclick=bioUnlock;
const lock=()=>{if(getP()&&mode!=='unlock')show('unlock')};

// menu
const col=document.querySelector('#menu .col'),mk=(v)=>{const b=document.createElement('button');b.value=v;b.type='submit';col.insertBefore(b,col.lastElementChild);return b};
const bSet=mk('pinset'),bRem=mk('pinrem'),bBio=mk('bio');
document.querySelector('#menuBtn').addEventListener('click',()=>{const p=getP();bSet.textContent=p?'Change PIN':'Set PIN';bRem.hidden=!p;bRem.textContent='Remove PIN';bBio.hidden=!p||!bioOK();bBio.textContent=getB()?'Turn off fingerprint':'Use fingerprint'});
document.querySelector('#menu').addEventListener('close',()=>{const r=document.querySelector('#menu').returnValue,p=getP();
 if(r==='pinset'){if(p)show('verify',{title:'Enter current PIN',cb:()=>setTimeout(()=>show('set',{title:'Enter new 4-digit PIN'}),150)});else show('set',{title:'Choose a 4-digit PIN'})}
 if(r==='bio'&&p){if(getB()){localStorage.removeItem(BK);toast('Fingerprint unlock off')}else show('verify',{title:'Enter PIN to enable fingerprint',cb:()=>setTimeout(bioEnroll,150)})}
 if(r==='pinrem'&&p)show('verify',{title:'Enter current PIN to remove',cb:()=>{localStorage.removeItem(PK);localStorage.removeItem(BK);toast('PIN removed')}})});
window.HMLock={lock,show};
let ok=false;try{ok=sessionStorage.getItem('heymurph.unlocked')==='1'}catch(e){}
if(getP()&&!ok)show('unlock');else document.documentElement.classList.remove('locked');
})();
