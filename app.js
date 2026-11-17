'use strict';
/* ==========================================================
   LEVEL UP — прокачка себя как персонажа RPG.
   Данные хранятся локально (localStorage) по профилям семьи.
   Тексты интерфейса — в i18n.js (ru / en / pt).
   ========================================================== */

// ---------- Справочники (числа и id; названия — в i18n.js) ----------
const ATTRS = [
  {id:'str', color:'#b13e53'},{id:'end', color:'#ef7d57'},{id:'int', color:'#41a6f6'},{id:'cha', color:'#f4f4f4'},
  {id:'wil', color:'#3b5dc9'},{id:'cre', color:'#a7f070'},{id:'wea', color:'#ffcd75'},{id:'spi', color:'#73eff7'},
];
const ATTR = Object.fromEntries(ATTRS.map(a=>[a.id,a]));
const DIFF = {1:{xp:10,gold:2}, 2:{xp:20,gold:5}, 3:{xp:40,gold:10}};
const RANKS = {E:{xp:50,gold:10},D:{xp:100,gold:20},C:{xp:200,gold:40},B:{xp:400,gold:80},A:{xp:800,gold:160},S:{xp:1500,gold:300}};
const TITLE_LEVELS = [1,3,5,8,12,16,20,25,30,40,50];
const CLEAN_MILESTONES = [1,3,7,14,30,60,100,180,365];
const DAILY_ATTRS = ['str','end','end','int','int','cha','cha','wil','wil','cre','cre','wea','wea','spi','spi','wil','str','end'];
const PRESET_HABITS = [{attr:'str',diff:1},{attr:'int',diff:2},{attr:'end',diff:1},{attr:'end',diff:2},{attr:'cha',diff:2},{attr:'wea',diff:1},{attr:'spi',diff:1}];
const PRESET_REWARD_COSTS = [50,60,80,250,400,1500];
const LANGS = ['ru','en','pt'];

// ---------- Ачивки (тексты — в i18n.js) ----------
const ACHS = [
  {id:'first_step', icon:'check', xp:20, gold:10, test:p=>p.stats.habitDone>=1},
  {id:'h10', icon:'bolt', xp:40, gold:20, test:p=>p.stats.habitDone>=10},
  {id:'h100', icon:'star', xp:150, gold:80, test:p=>p.stats.habitDone>=100},
  {id:'h500', icon:'trophy', xp:500, gold:250, test:p=>p.stats.habitDone>=500},
  {id:'s3', icon:'flame', xp:30, gold:15, test:p=>maxStreak(p)>=3},
  {id:'s7', icon:'flame', xp:80, gold:40, test:p=>maxStreak(p)>=7},
  {id:'s30', icon:'wil', xp:300, gold:150, test:p=>maxStreak(p)>=30},
  {id:'s100', icon:'crown', xp:1000, gold:500, test:p=>maxStreak(p)>=100},
  {id:'l5', icon:'xp', xp:0, gold:50, test:p=>charLevel(p).level>=5},
  {id:'l10', icon:'xp', xp:0, gold:120, test:p=>charLevel(p).level>=10},
  {id:'l20', icon:'crown', xp:0, gold:300, test:p=>charLevel(p).level>=20},
  {id:'q1', icon:'scroll', xp:30, gold:20, test:p=>p.stats.questsDone>=1},
  {id:'q10', icon:'sword', xp:200, gold:100, test:p=>p.stats.questsDone>=10},
  {id:'qS', icon:'star', xp:300, gold:200, test:p=>p.stats.sDone>=1},
  {id:'harmony', icon:'spi', xp:100, gold:50, test:p=>(p.stats.bestSpheresDay||0)>=5},
  {id:'all8', icon:'hero', xp:300, gold:150, test:p=>ATTRS.every(a=>attrLevel(p,a.id).level>=3)},
  {id:'a10', icon:'int', xp:200, gold:100, test:p=>ATTRS.some(a=>attrLevel(p,a.id).level>=10)},
  {id:'crit', icon:'bolt', xp:20, gold:20, test:p=>p.stats.crits>=1},
  {id:'crit25', icon:'star', xp:150, gold:100, test:p=>p.stats.crits>=25},
  {id:'clean7', icon:'skull', xp:100, gold:50, test:p=>p.bad.some(b=>cleanDays(b)>=7)},
  {id:'clean30', icon:'wil', xp:400, gold:200, test:p=>p.bad.some(b=>cleanDays(b)>=30)},
  {id:'mood7', icon:'smile', xp:50, gold:20, test:p=>Object.keys(p.checkins).length>=7},
  {id:'daily5', icon:'scroll', xp:80, gold:40, test:p=>p.stats.dailyDone>=5},
  {id:'buy1', icon:'bag', xp:20, gold:0, test:p=>p.purchases.length>=1},
  {id:'rich', icon:'coin', xp:100, gold:0, test:p=>p.gold>=1000},
  {id:'perfect', icon:'trophy', xp:60, gold:30, test:p=>p.stats.perfectDays>=1},
  {id:'perfect7', icon:'crown', xp:250, gold:120, test:p=>p.stats.perfectDays>=7},
];

// ---------- Утилиты ----------
const $ = s=>document.querySelector(s);
const esc = s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid = ()=>Math.random().toString(36).slice(2,9)+Date.now().toString(36).slice(-4);
function dkey(d=new Date()){ const z=n=>String(n).padStart(2,'0'); return `${d.getFullYear()}-${z(d.getMonth()+1)}-${z(d.getDate())}`; }
function parseKey(k){ const [y,m,d]=k.split('-').map(Number); return new Date(y,m-1,d); }
function addDays(k,n){ const d=parseKey(k); d.setDate(d.getDate()+n); return dkey(d); }
function daysBetween(a,b){ return Math.round((parseKey(b)-parseKey(a))/86400000); }
const today = ()=>dkey();
const fmtDate = k=>k?k.split('-').reverse().join('.'):'';
function hashStr(s){ let h=2166136261; for(const c of s){ h^=c.charCodeAt(0); h=Math.imul(h,16777619);} return h>>>0; }

// ---------- Хранилище ----------
const KEY = 'levelup.v1';
let DB = load();
function detectLang(){ const l=(navigator.language||'en').toLowerCase(); return l.startsWith('pt')?'pt':l.startsWith('ru')?'ru':'en'; }
function load(){
  let d=null;
  try{ d = JSON.parse(localStorage.getItem(KEY)); }catch(e){}
  if(!d || !d.profiles) d = {profiles:[], current:null, settings:{sound:true}};
  d.settings = d.settings || {sound:true};
  // У тех, кто уже играл до перевода, язык — русский.
  if(!LANGS.includes(d.settings.lang)) d.settings.lang = d.profiles.length ? 'ru' : detectLang();
  return d;
}
function save(){ try{ localStorage.setItem(KEY, JSON.stringify(DB)); }catch(e){ toast('['+t('saveErr',{e:esc(e.message)})+']','bad'); } }
const P = ()=>DB.profiles.find(p=>p.id===DB.current);

// ---------- Перевод ----------
const L = ()=>I18N[DB.settings.lang]||I18N.ru;
function t(k,v={}){ const s=L().s[k] ?? I18N.ru.s[k] ?? k; return s.replace(/\{(\w+)\}/g,(m,x)=>v[x]!==undefined?v[x]:m); }
const aName = id=>L().attrs[id][0];
const aSphere = id=>L().attrs[id][1];
const dName = n=>L().diff[n];
const rName = k=>L().ranks[k];
const achText = id=>L().ach[id]||['',''];
const dayWord = n=>L().days(n);
function setLang(l){ DB.settings.lang=l; document.documentElement.lang=l; save(); buildNav(); render(); }

function newProfile(name, av, presets){
  const p = {
    id:uid(), name, avatar:av, created:today(), lastDay:today(),
    xp:0, gold:0, hp:100, maxLevel:1, attrs:Object.fromEntries(ATTRS.map(a=>[a.id,0])), attrMax:{},
    habits:[], bad:[], quests:[], rewards:[], purchases:[], checkins:{}, ach:{}, log:[],
    stats:{habitDone:0,questsDone:0,sDone:0,crits:0,dailyDone:0,perfectDays:0,bestSpheresDay:0},
    spheresDay:{date:today(),set:[]}, perfectDay:null, daily:null,
  };
  if(presets){
    PRESET_HABITS.forEach((h,i)=>p.habits.push({id:uid(),title:L().presetHabits[i],attr:h.attr,diff:h.diff,days:[0,1,2,3,4,5,6],done:{},created:today()}));
    L().presetBad.forEach(title=>p.bad.push({id:uid(),title,since:today(),slips:[],milestones:[]}));
  }
  PRESET_REWARD_COSTS.forEach((cost,i)=>p.rewards.push({id:uid(),title:L().presetRewards[i],cost}));
  addLog(p,t('welcome',{name}),'c');
  return p;
}

// ---------- Прогрессия ----------
const needChar = L=>Math.round(60*Math.pow(L,1.55));   // опыт с L до L+1
const needAttr = L=>Math.round(40*Math.pow(L,1.35));
function levelFrom(xp, need){ let L=1, rest=Math.max(0,xp); while(rest>=need(L)){ rest-=need(L); L++; } return {level:L, cur:rest, need:need(L)}; }
const charLevel = p=>levelFrom(p.xp, needChar);
const attrLevel = (p,a)=>levelFrom(p.attrs[a]||0, needAttr);
function titleOf(lv){ let i=0; TITLE_LEVELS.forEach((l,j)=>{ if(lv>=l) i=j; }); return L().titles[i]; }

function isScheduled(h, k){ return h.days.includes(parseKey(k).getDay()); }
function habitStreak(h, ref=today()){
  let k = h.done[ref] ? ref : addDays(ref,-1), n=0, guard=0;
  while(guard++<2000){
    if(parseKey(k) < parseKey(h.created||k)) break;
    if(isScheduled(h,k)){ if(h.done[k]) n++; else break; }
    k = addDays(k,-1);
  }
  return n;
}
function maxStreak(p){ return Math.max(0,...p.habits.map(h=>Math.max(h.best||0,habitStreak(h)))); }
function cleanDays(b){ return daysBetween(b.since, today()); }

// Эффекты (баффы/дебаффы) и множители
function effects(p){
  const e=[]; const c=p.checkins[today()];
  if(p.hp<=0) e.push({bad:true,k:'ef_exhausted',mult:-0.5});
  else if(p.hp<30) e.push({bad:true,k:'ef_tired',mult:-0.2});
  if(c && c.mood>=4) e.push({k:'ef_mood',mult:0.1});
  if(c && c.energy>=4) e.push({k:'ef_energy',gold:0.1});
  if(c && c.mood<=2) e.push({bad:true,k:'ef_blues'});
  const ms = maxStreak(p);
  if(ms>=7) e.push({k:'ef_insp',mult:ms>=30?0.15:0.1,v:{p:ms>=30?15:10}});
  if(charLevel(p).level>=10) e.push({k:'ef_exp',crit:0.03});
  e.forEach(x=>{ x.name=t(x.k); x.desc=t(x.k+'_d',x.v); });
  return e;
}
function xpMult(p){ return Math.max(0.2, 1+effects(p).reduce((s,e)=>s+(e.mult||0),0)); }
function goldMult(p){ return 1+effects(p).reduce((s,e)=>s+(e.gold||0),0); }
function critChance(p){ return 0.05 + effects(p).reduce((s,e)=>s+(e.crit||0),0); }

// ---------- Журнал ----------
function addLog(p,msg,cls=''){ p.log.unshift({t:Date.now(),msg,cls}); if(p.log.length>300) p.log.length=300; }

// ---------- Награда / откат ----------
function grant(p, {xp=0, gold=0, attr=null, reason='', crit=false, noMult=false, at=null}){
  let isCrit=false;
  if(crit && Math.random()<critChance(p)){ isCrit=true; p.stats.crits++; }
  let fx = noMult? xp : Math.round(xp*xpMult(p));
  let fg = noMult? gold : Math.round(gold*goldMult(p));
  if(isCrit){ fx*=2; fg*=2; }
  const before = charLevel(p).level;
  const aBefore = attr? attrLevel(p,attr).level : 0;
  p.xp += fx; p.gold += fg;
  if(attr) p.attrs[attr] = (p.attrs[attr]||0)+fx;
  if(attr){
    if(p.spheresDay.date!==today()) p.spheresDay={date:today(),set:[]};
    if(!p.spheresDay.set.includes(attr)) p.spheresDay.set.push(attr);
    p.stats.bestSpheresDay=Math.max(p.stats.bestSpheresDay||0,p.spheresDay.set.length);
  }
  const parts=[]; if(fx) parts.push(t('xpGain',{n:fx})+(attr?` (${aName(attr)})`:'')); if(fg) parts.push(t('goldGain',{n:fg}));
  if(parts.length){
    addLog(p,(isCrit?t('crit')+' ':'')+(reason?reason+': ':'')+parts.join(', '),'g');
    toast(`${isCrit?`<b style="color:var(--k3)">${t('critBig')}</b> `:''}<span class="br">[</span>${esc(reason)}${reason?' — ':''}${parts.join(', ')}<span class="br">]</span>`, isCrit?'gold':'');
  }
  if(at){ if(fx) floatText(at,`+${fx} XP`, isCrit?'crit':''); if(fg) setTimeout(()=>floatText(at,`+${fg}`,'gold',14),180); }
  sfx(isCrit?'crit':'ok');
  const after = charLevel(p).level;
  if(after>before && after>(p.maxLevel||1)){ p.maxLevel=after; addLog(p,t('lvlLog',{l:after,t:titleOf(after)}),'y'); queueLevelUp(after); }
  if(attr){ const aAfter=attrLevel(p,attr).level; const mx=p.attrMax[attr]||1;
    if(aAfter>aBefore && aAfter>mx){ p.attrMax[attr]=aAfter; addLog(p,t('attrLog',{a:aName(attr),n:aAfter}),'y');
      setTimeout(()=>toast(`<span class="br">[</span>${esc(t('attrToast',{a:aName(attr),n:aAfter}))}<span class="br">]</span>`,'gold'),400); sfx('attr'); }
  }
  return {xp:fx,gold:fg,attr,crit:isCrit};
}
function ungrant(p, g){
  if(!g) return;
  p.xp=Math.max(0,p.xp-(g.xp||0)); p.gold-= (g.gold||0);
  if(g.attr) p.attrs[g.attr]=Math.max(0,(p.attrs[g.attr]||0)-(g.xp||0));
  if(g.crit) p.stats.crits=Math.max(0,p.stats.crits-1);
  addLog(p,t('undone',{xp:g.xp||0,g:g.gold||0}),'b');
}
function hurt(p,n,reason,at){
  p.hp=Math.max(0,p.hp-n); addLog(p,`${reason}: −${n} HP`,'b');
  toast(`<span class="br">[</span>${esc(reason)}: −${n} HP<span class="br">]</span>`,'bad');
  if(at) floatText(at,`−${n} HP`,'bad'); sfx('hurt');
  document.body.classList.remove('shake'); void document.body.offsetWidth; document.body.classList.add('shake');
}
function heal(p,n){ p.hp=Math.min(100,p.hp+n); }

// ---------- Ачивки ----------
function checkAchs(p){
  for(const a of ACHS){
    if(p.ach[a.id]) continue;
    let ok=false; try{ ok=a.test(p); }catch(e){}
    if(ok){
      p.ach[a.id]=today();
      const nm=achText(a.id)[0];
      addLog(p,t('achLog',{n:nm}),'y');
      setTimeout(()=>{ toast(`${icon(a.icon,2)} <span><span class="br">[</span>${t('achGot')} <b style="color:var(--k4)">${esc(nm)}</b><span class="br">]</span></span>`,'gold',3800); sfx('ach'); },700);
      if(a.xp||a.gold) grant(p,{xp:a.xp,gold:a.gold,reason:t('achReward'),noMult:true});
      if(a.id==='l20') p.avatar.crown=true;
    }
  }
}

// ---------- Новый день ----------
function dayTick(p){
  const tk=today();
  if(p.lastDay===tk) return;
  const passed = Math.max(1,daysBetween(p.lastDay,tk));
  const y = addDays(tk,-1);
  if(daysBetween(p.lastDay,y)>=0){
    const missed = p.habits.filter(h=>isScheduled(h,y) && !h.done[y] && parseKey(h.created)<=parseKey(y)).length;
    if(missed){ p.hp=Math.max(0,p.hp-missed*4); addLog(p,t('missed',{n:missed,hp:missed*4}),'b'); }
  }
  heal(p, 15*passed);
  addLog(p,t('newDay',{hp:p.hp}),'c');
  p.lastDay=tk;
  save();
}
function cleanMilestones(p){
  for(const b of p.bad){
    const d=cleanDays(b);
    for(const m of CLEAN_MILESTONES){
      if(d>=m && !b.milestones.includes(m)){
        b.milestones.push(m);
        grant(p,{xp:Math.min(600,15*m+10), gold:Math.min(300,5*m+5), attr:'wil', reason:t('cleanReason',{n:m,d:dayWord(m),t:b.title}), noMult:true});
      }
    }
  }
}
function dailyQuest(p){
  const tk=today();
  if(!p.daily || p.daily.date!==tk){
    const i = hashStr(p.id+tk)%DAILY_ATTRS.length;
    p.daily={date:tk, i, a:DAILY_ATTRS[i], done:false, grant:null};
  }
  return p.daily;
}
const dailyText = d=> d.i!==undefined ? L().daily[d.i] : d.t;

// ---------- Звук (8-bit) ----------
let AC=null;
function tone(f,d,t0=0,type='square',v=0.06){
  if(!DB.settings.sound) return;
  try{
    AC = AC || new (window.AudioContext||window.webkitAudioContext)();
    const o=AC.createOscillator(), g=AC.createGain(); o.type=type; o.frequency.value=f;
    const s=AC.currentTime+t0; g.gain.setValueAtTime(v,s); g.gain.exponentialRampToValueAtTime(0.0001,s+d);
    o.connect(g); g.connect(AC.destination); o.start(s); o.stop(s+d+0.02);
  }catch(e){}
}
function sfx(k){
  const S={
    ok:()=>{tone(660,.08);tone(990,.12,.07)},
    crit:()=>{[660,880,1320,1760].forEach((f,i)=>tone(f,.1,i*.06))},
    undo:()=>{tone(440,.08);tone(330,.1,.07)},
    hurt:()=>{tone(180,.15,0,'sawtooth',.07);tone(120,.2,.1,'sawtooth',.07)},
    coin:()=>{tone(988,.06);tone(1319,.25,.06)},
    ach:()=>{[523,659,784,1047,784,1047].forEach((f,i)=>tone(f,.12,i*.09))},
    attr:()=>{[392,523,659].forEach((f,i)=>tone(f,.1,i*.07,'triangle',.08))},
    lvl:()=>{[523,523,523,698,880,784,1047].forEach((f,i)=>tone(f,.16,i*.11));tone(131,.9,0,'triangle',.08)},
    click:()=>tone(520,.03,0,'square',.03),
  }; (S[k]||S.click)();
}

// ---------- UI-хелперы ----------
function toast(html, cls='', life=2600){
  const el=document.createElement('div'); el.className='toast '+cls; el.style.setProperty('--life',life+'ms'); el.innerHTML=html;
  $('#toasts').appendChild(el); setTimeout(()=>el.remove(), life+400);
  const all=$('#toasts').children; if(all.length>4) all[0].remove();
}
function floatText(at,txt,cls='',dy=0){
  const el=document.createElement('div'); el.className='float '+cls; el.textContent=txt;
  el.style.left=(at.x-20)+'px'; el.style.top=(at.y-20+dy)+'px'; document.body.appendChild(el); setTimeout(()=>el.remove(),1100);
}
let lvlQueue=[];
function queueLevelUp(lv){ lvlQueue.push(lv); if(lvlQueue.length===1) setTimeout(showLevelUp,600); }
function showLevelUp(){
  const lv=lvlQueue[0]; if(!lv) return;
  sfx('lvl');
  const f=document.createElement('div'); f.className='flash'; document.body.appendChild(f); setTimeout(()=>f.remove(),500);
  const el=document.createElement('div'); el.className='lvlup';
  el.innerHTML=`<div class="frame card">${icon('star',5)}<div class="big">${t('newLevel')}</div><div class="num">${lv}</div>
    <p>${t('titleLbl')} <b style="color:var(--k4)">${titleOf(lv)}</b></p><p class="muted small">${t('lvlFlavor')}</p><p class="blinktxt">${t('tapContinue')}</p></div>`;
  for(let i=0;i<36;i++){ const s=document.createElement('i'); s.className='spark'; const a=Math.random()*Math.PI*2, r=120+Math.random()*220;
    s.style.left='50%'; s.style.top='45%'; s.style.setProperty('--dx',Math.cos(a)*r+'px'); s.style.setProperty('--dy',Math.sin(a)*r+'px');
    s.style.background=['#ffcd75','#a7f070','#73eff7','#ef7d57','#f4f4f4'][i%5]; s.style.animationDelay=(Math.random()*.3)+'s'; el.appendChild(s); }
  el.onclick=()=>{ el.remove(); lvlQueue.shift(); if(lvlQueue.length) setTimeout(showLevelUp,200); };
  document.body.appendChild(el);
}
function bar(cur,max,color,label,cls=''){
  const pct=Math.max(0,Math.min(100,max?cur/max*100:0));
  return `<div class="bar ${cls}" style="--c:${color}"><i style="width:${pct}%"></i>${label!==undefined?`<span class="lbl">${label}</span>`:''}</div>`;
}
function atFromEvent(e){ const r=e.target.closest('button,li,.item')?.getBoundingClientRect(); return r?{x:r.left+r.width/2,y:r.top}:{x:innerWidth/2,y:innerHeight/2}; }

// ---------- Модалки ----------
function modal(html, onMount){
  closeModal();
  const bg=document.createElement('div'); bg.className='modal-bg'; bg.id='modal';
  bg.innerHTML=`<div class="frame modal">${html}</div>`;
  bg.addEventListener('click',e=>{ if(e.target===bg) closeModal(); });
  document.body.appendChild(bg);
  onMount && onMount(bg);
  const first=bg.querySelector('input.inp'); if(first && matchMedia('(pointer:fine)').matches) first.focus();
  return bg;
}
function closeModal(){ $('#modal')?.remove(); }
function confirmBox(text, okLabel, cb, danger=true){
  modal(`<h2>${t('confirm')}</h2><p>${text}</p><div class="actions"><button class="btn gray" data-x="no">${t('cancel')}</button><button class="btn ${danger?'red':'green'}" data-x="yes">${okLabel}</button></div>`, bg=>{
    bg.querySelector('[data-x=no]').onclick=closeModal;
    bg.querySelector('[data-x=yes]').onclick=()=>{ closeModal(); cb(); };
  });
}
function optGroup(name, items, val){
  return `<div class="opts" data-group="${name}">${items.map(i=>`<button type="button" class="opt ${String(i.v)===String(val)?'on':''}" data-v="${i.v}">${i.html||''}${esc(i.label||'')}</button>`).join('')}</div>`;
}
function bindOpts(root, multi={}){
  root.querySelectorAll('.opts').forEach(g=>{
    g.addEventListener('click',e=>{ const b=e.target.closest('.opt'); if(!b) return; sfx('click');
      if(multi[g.dataset.group]) b.classList.toggle('on'); else { g.querySelectorAll('.opt').forEach(x=>x.classList.remove('on')); b.classList.add('on'); }
      g.dispatchEvent(new Event('change')); });
  });
}
const getOpt = (root,name)=>root.querySelector(`[data-group="${name}"] .opt.on`)?.dataset.v;
const getOpts = (root,name)=>[...root.querySelectorAll(`[data-group="${name}"] .opt.on`)].map(b=>b.dataset.v);
const attrOpts = ()=>ATTRS.map(a=>({v:a.id,label:aSphere(a.id),html:icon(a.id,2)}));
const langOpts = ()=>LANGS.map(l=>({v:l,label:I18N[l]._name}));

// ---------- Состояние UI ----------
let TAB = 'hero';
let QTAB = 'active';

// ---------- Рендер ----------
function render(){
  document.documentElement.lang=DB.settings.lang;
  const p=P();
  if(!p){ renderTitle(); return; }
  dayTick(p); dailyQuest(p); cleanMilestones(p); checkAchs(p); save();
  const cl=charLevel(p);
  $('#app').innerHTML = `
    <header class="topbar">
      <button class="who" data-a="profiles">${avatarImg(p.avatar,2)}<div style="min-width:0"><div class="name">${esc(p.name)}</div><div class="lvl">${t('lvlShort')} ${cl.level} · ${titleOf(cl.level).toUpperCase()}</div></div></button>
      <div class="chip hp">${icon('heart',2)}${p.hp}</div>
      <div class="chip gold">${icon('coin',2)}${p.gold}</div>
      <button class="iconbtn" data-a="settings" aria-label="${t('settings')}">${icon('gear',3)}</button>
    </header>
    <main>${({hero:viewHero,habits:viewHabits,quests:viewQuests,ach:viewAch,shop:viewShop})[TAB](p)}</main>`;
  document.querySelectorAll('nav.bottom button').forEach(b=>b.classList.toggle('on',b.dataset.tab===TAB));
  $('nav.bottom').style.display='';
}

function renderTitle(){
  $('nav.bottom').style.display='none';
  $('#app').innerHTML=`<div class="titlescreen">
    <div class="opts" style="justify-content:center;margin-bottom:18px">${LANGS.map(l=>`<button class="opt ${DB.settings.lang===l?'on':''}" data-a="lang" data-v="${l}">${I18N[l]._name}</button>`).join('')}</div>
    <div style="display:flex;justify-content:center;gap:8px;align-items:flex-end">${avatarImg({skin:0,hair:0,outfit:0},5)}${avatarImg({skin:1,hair:2,outfit:3,hairStyle:1},4)}${avatarImg({skin:2,hair:5,outfit:1,hairStyle:3},3)}</div>
    <div class="logo">LEVEL UP<small>${t('tagline')}</small></div>
    ${DB.profiles.length?`<div class="frame panel herolist"><div class="panel-title">${icon('hero',2)} ${t('pickHero')}</div>${DB.profiles.map(heroRow).join('')}</div>`:''}
    <button class="btn green" data-a="newhero" style="margin-top:18px">${DB.profiles.length?t('newHero'):t('startGame')}</button>
    ${DB.profiles.length?'':`<p class="blinktxt" style="margin-top:28px">${t('createChar')}</p>`}
    <p class="muted tiny" style="margin-top:30px">${t('credit')}</p>
  </div>`;
}
function heroRow(p){
  const cl=charLevel(p);
  return `<div class="item" data-a="pick" data-id="${p.id}">${avatarImg(p.avatar,2)}<div class="body"><div class="t">${esc(p.name)}</div><div class="sub"><span>${t('lvlAbbr')} ${cl.level} · ${titleOf(cl.level)}</span><span>${icon('coin',2)} ${p.gold}</span></div>${bar(cl.cur,cl.need,'var(--k9)','','thin')}</div></div>`;
}

// ----- Герой -----
function viewHero(p){
  const cl=charLevel(p); const ef=effects(p); const c=p.checkins[today()]||{};
  const dq=p.daily, dr=dailyReward(p);
  return `
  <section class="frame panel">
    <div class="hero">
      <div class="avatar-box">${avatarImg(p.avatar,5)}</div>
      <div class="info">
        <div class="hname">${esc(p.name)}</div>
        <div class="lvlbadge">${t('level')} ${cl.level}</div>
        <div class="title">${titleOf(cl.level)}</div>
        <div class="statline">
          <span class="k">XP</span>${bar(cl.cur,cl.need,'var(--k9)',`${cl.cur}/${cl.need}`)}
          <span class="k">HP</span>${bar(p.hp,100,p.hp<30?'var(--k2)':'var(--k6)',`${p.hp}/100`)}
          ${c.energy?`<span class="k">${t('energyShort')}</span>${bar(c.energy,5,'var(--k4)',`${c.energy}/5`)}`:''}
          ${c.mood?`<span class="k">${t('moodShort')}</span>${bar(c.mood,5,'var(--kb)',`${c.mood}/5`)}`:''}
        </div>
      </div>
    </div>
  </section>

  <section class="frame panel sysq">
    <div class="panel-title">${icon('scroll',2)} ${t('dailyTitle')}</div>
    <div class="sysmsg"><span class="br">[</span> ${esc(dailyText(dq))} <span class="br">]</span></div>
    <div class="row mt"><span class="small muted grow">${icon(dq.a,2)} ${aName(dq.a)} · +${dr.xp} XP · +${dr.gold} ${icon('coin',2)}</span>
      ${dq.done?`<button class="btn small gray" data-a="dailyundo">${t('doneCheck')}</button>`:`<button class="btn small green" data-a="dailydone">${t('doneBtn')}</button>`}
    </div>
  </section>

  <section class="frame panel">
    <div class="panel-title">${icon('smile',2)} ${t('stateTitle')}</div>
    <div class="checkin">
      <span class="small">${t('mood')}</span><div class="scale">${[1,2,3,4,5].map(n=>`<button class="${c.mood===n?'on':''}" data-a="mood" data-n="${n}" aria-label="${n}">${moodIcon(n)}</button>`).join('')}</div>
      <span class="small">${t('energy')}</span><div class="scale">${[1,2,3,4,5].map(n=>`<button class="${c.energy===n?'on':''}" data-a="energy" data-n="${n}" aria-label="${n}">${energyIcon(n)}</button>`).join('')}</div>
    </div>
  </section>

  <section class="frame panel">
    <div class="panel-title">${icon('hero',2)} ${t('attrsTitle')}</div>
    <div class="attrs">${ATTRS.map(a=>{ const l=attrLevel(p,a.id); return `
      <div class="attr" data-a="attrinfo" data-id="${a.id}">${icon(a.id,3)}<div class="meta">
        <div class="row"><span class="nm">${aName(a.id)}</span><span class="lv">${l.level}</span></div>
        ${bar(l.cur,l.need,a.color,undefined,'thin')}<div class="sph">${aSphere(a.id)}</div></div></div>`;}).join('')}
    </div>
  </section>

  <section class="frame panel">
    <div class="panel-title">${icon('bolt',2)} ${t('effectsTitle')}</div>
    ${ef.length?`<div class="effects">${ef.map(e=>`<div class="effect ${e.bad?'bad':''}" title="${esc(e.desc)}"><b>${e.bad?'▼':'▲'}</b>${esc(e.name)}</div>`).join('')}</div>
    <div class="tiny muted mt">${ef.map(e=>`<div>• <b>${esc(e.name)}</b>: ${esc(e.desc)}</div>`).join('')}</div>`:`<div class="muted small">${t('noEffects')}</div>`}
    <div class="tiny muted mt">${t('critInfo',{c:Math.round(critChance(p)*100),m:xpMult(p).toFixed(2)})}</div>
  </section>

  <section class="frame panel">
    <div class="panel-title">${icon('scroll',2)} ${t('logTitle')}</div>
    <div class="log">${p.log.slice(0,60).map(l=>`<div class="${l.cls}"><span class="d">${new Date(l.t).toLocaleString(L()._locale,{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}</span>${esc(l.msg)}</div>`).join('')}</div>
  </section>`;
}
function moodIcon(n){
  const eyes = n===5 ? ["4044404","0404040"] : ["4444444","4044404"];
  const mouth = {1:["4400044","4044404"],2:["4444444","4400044"],3:["4444444","4000004"],4:["4044404","4400044"],5:["4000004","4400044"]}[n];
  const rows=[".44444.",eyes[0],eyes[1],n===1?"4b444b4":"4444444",mouth[0],mouth[1],".44444."];
  const s=spriteURL(rows); return `<img class="px" src="${s.url}" width="21" height="21" alt="">`; }
function energyIcon(n){ const full='4',emp='e'; const rows=[]; for(let y=0;y<6;y++){ let r=''; for(let x=0;x<5;x++){ r+= (5-y)<=n+0 && x>0&&x<4 ? full : (x>0&&x<4?emp:'.'); } rows.push(r);} rows.unshift('.ee..'); const s=spriteURL(rows); return `<img class="px" src="${s.url}" width="15" height="21" alt="">`; }
function dailyReward(p){ const c=p.checkins[today()]; const bonus = c&&c.mood<=2?1.5:1; return {xp:Math.round(30*bonus), gold:10}; }

// ----- Привычки -----
function viewHabits(p){
  const tk=today(); const todays=p.habits.filter(h=>isScheduled(h,tk)); const other=p.habits.filter(h=>!isScheduled(h,tk));
  const doneN=todays.filter(h=>h.done[tk]).length;
  return `
  <section class="frame panel">
    <div class="panel-title">${icon('check',2)} ${t('habitsToday')} <span class="grow"></span><button class="btn small green" data-a="addhabit">${t('add')}</button></div>
    ${todays.length?`${bar(doneN,todays.length,'var(--k6)',`${doneN} / ${todays.length}`,'big')}`:''}
    ${todays.map(h=>habitRow(p,h,tk)).join('') || `<div class="empty">${t('noHabits')}</div>`}
    ${other.length?`<div class="panel-title mt" style="color:var(--muted)">${t('notToday')}</div>${other.map(h=>habitRow(p,h,tk,true)).join('')}`:''}
  </section>
  <section class="frame panel" style="--c:var(--k2)">
    <div class="panel-title" style="color:var(--k3)">${icon('skull',2)} ${t('badTitle')} <span class="grow"></span><button class="btn small red" data-a="addbad">+</button></div>
    <div class="tiny muted">${t('badHint')}</div>
    ${p.bad.map(b=>{ const d=cleanDays(b); const next=CLEAN_MILESTONES.find(m=>m>d)||d;
      return `<div class="item"><div class="body"><div class="t">${esc(b.title)}</div>
        <div class="sub"><span>${icon('wil',2)} ${t('clean')} <b style="color:var(--k5)">${d} ${dayWord(d)}</b></span><span>${t('nextReward',{n:next})}</span>${b.slips.length?`<span>${t('slips',{n:b.slips.length})}</span>`:''}</div>
        ${bar(d,next,'var(--k9)',undefined,'thin')}</div>
        <button class="btn small red" data-a="slip" data-id="${b.id}">${t('slipBtn')}</button>
        <button class="more" data-a="badmenu" data-id="${b.id}">⋮</button></div>`; }).join('') || `<div class="empty">${t('noBad')}</div>`}
  </section>`;
}
function habitRow(p,h,tk,off=false){
  const done=!!h.done[tk], st=habitStreak(h), d=DIFF[h.diff];
  const wd=L().weekdays;
  return `<div class="item ${done?'done':''}" ${off?'style="opacity:.6"':''}>
    ${off?`<div class="check" style="opacity:.4">${icon(h.attr,2)}</div>`:`<button class="check ${done?'on':''}" data-a="toggle" data-id="${h.id}" aria-label="${t('mark')}">${done?icon('check',3):icon(h.attr,2)}</button>`}
    <div class="body"><div class="t">${esc(h.title)}</div>
      <div class="sub"><span>${aName(h.attr)}</span><span>${dName(h.diff)}</span><span>+${d.xp} XP</span>${st?`<span style="color:var(--k3)">${icon('flame',2)} ${st}</span>`:''}${h.days.length<7?`<span>${h.days.slice().sort((a,b)=>((a+6)%7)-((b+6)%7)).map(x=>wd[x]).join(' ')}</span>`:''}</div></div>
    <button class="more" data-a="habitmenu" data-id="${h.id}" aria-label="${t('menu')}">⋮</button></div>`;
}

// ----- Квесты -----
function viewQuests(p){
  const list=p.quests.filter(q=>QTAB==='active'?q.status==='active':q.status!=='active');
  const ord='SABCDE';
  list.sort((a,b)=> QTAB==='active' ? ((a.deadline||'9999')>(b.deadline||'9999')?1:-1) || ord.indexOf(a.rank)-ord.indexOf(b.rank) : (b.doneAt||'').localeCompare(a.doneAt||''));
  return `
  <div class="tabs2"><button class="${QTAB==='active'?'on':''}" data-a="qtab" data-v="active">${t('active',{n:p.quests.filter(q=>q.status==='active').length})}</button><button class="${QTAB!=='active'?'on':''}" data-a="qtab" data-v="done">${t('archive')}</button></div>
  <section class="frame panel">
    <div class="panel-title">${icon('sword',2)} ${t('questsTitle')} <span class="grow"></span>${QTAB==='active'?`<button class="btn small green" data-a="addquest">${t('addQuest')}</button>`:''}</div>
    ${list.map(q=>questRow(p,q)).join('') || `<div class="empty">${QTAB==='active'?t('noQuests'):t('noArchive')}</div>`}
  </section>
  <section class="frame panel"><div class="panel-title">${icon('star',2)} ${t('ranksTitle')}</div>
    <div class="small">${Object.entries(RANKS).map(([k,r])=>`<div class="row" style="margin:6px 0"><span class="rank ${k}">${k}</span><span class="grow">${rName(k)}</span><span class="muted">+${r.xp} XP · +${r.gold}</span></div>`).join('')}</div>
  </section>`;
}
function questRow(p,q){
  const r=RANKS[q.rank]; const steps=q.steps||[]; const sd=steps.filter(s=>s.done).length;
  let dl=''; if(q.deadline && q.status==='active'){ const left=daysBetween(today(),q.deadline); dl=`<span style="color:${left<0?'var(--k2)':left<=2?'var(--k3)':'inherit'}">${left<0?t('overdue'):left===0?t('dueToday'):t('daysLeft',{n:left})}</span>`; }
  return `<div class="item ${q.status==='done'?'done':''}" style="align-items:flex-start">
    <span class="rank ${q.rank}">${q.rank}</span>
    <div class="body"><div class="t">${esc(q.title)}</div>
      ${q.desc?`<div class="small muted">${esc(q.desc)}</div>`:''}
      <div class="sub"><span>${icon(q.attr,2)} ${aName(q.attr)}</span><span>+${r.xp} XP</span><span>${icon('coin',2)} ${r.gold}</span>${dl}${q.status==='failed'?`<span style="color:var(--k2)">${t('failed')}</span>`:''}${q.doneAt?`<span>${fmtDate(q.doneAt)}</span>`:''}</div>
      ${steps.length?`${bar(sd,steps.length,'var(--k9)',`${sd}/${steps.length}`,'thin')}<ul class="steps">${steps.map((s,i)=>`<li class="${s.done?'ok':''}" ${q.status==='active'?`data-a="step" data-id="${q.id}" data-i="${i}"`:''}><span class="box"></span>${esc(s.t)}</li>`).join('')}</ul>`:''}
      ${q.status==='active'?`<div style="margin-top:8px"><button class="btn small green" data-a="qdone" data-id="${q.id}">${t('finish')}</button></div>`:''}
    </div>
    <button class="more" data-a="questmenu" data-id="${q.id}">⋮</button></div>`;
}

// ----- Ачивки -----
function viewAch(p){
  const got=ACHS.filter(a=>p.ach[a.id]).length;
  return `<section class="frame panel">
    <div class="panel-title">${icon('trophy',2)} ${t('achTitle')} <span class="grow"></span><span style="color:var(--kc)">${got}/${ACHS.length}</span></div>
    ${bar(got,ACHS.length,'var(--k4)',undefined,'')}
    <div class="achgrid mt">${ACHS.map(a=>`<button class="ach ${p.ach[a.id]?'got':'locked'}" data-a="achinfo" data-id="${a.id}">${p.ach[a.id]?icon(a.icon,4):icon('lock',4)}<div class="nm">${esc(achText(a.id)[0])}</div></button>`).join('')}</div>
  </section>`;
}

// ----- Лавка -----
function viewShop(p){
  return `<section class="frame panel">
    <div class="panel-title">${icon('bag',2)} ${t('shopTitle')} <span class="grow"></span><button class="btn small green" data-a="addreward">+</button></div>
    <div class="tiny muted" style="margin-bottom:12px">${t('shopHint')}</div>
    <div class="shopgrid">${p.rewards.map(r=>`<div class="ware">
      <button class="more x" data-a="rewardmenu" data-id="${r.id}">⋮</button>
      ${icon('gift',4)}<div class="t">${esc(r.title)}</div>
      <div class="price">${icon('coin',2)} ${r.cost}</div>
      <button class="btn small ${p.gold>=r.cost?'gold':'gray'} block" data-a="buy" data-id="${r.id}" ${p.gold>=r.cost?'':'disabled'}>${t('buy')}</button></div>`).join('') || `<div class="empty">${t('shopEmpty')}</div>`}</div>
  </section>
  <section class="frame panel"><div class="panel-title">${icon('scroll',2)} ${t('purchases')}</div>
    ${p.purchases.slice(0,30).map(x=>`<div class="row small" style="padding:4px 0;border-bottom:2px dashed var(--kf)"><span class="grow">${esc(x.title)}</span><span class="muted">${fmtDate(x.at)}</span><span style="color:var(--k4)">−${x.cost}</span></div>`).join('') || `<div class="empty">${t('noPurchases')}</div>`}
  </section>`;
}

// ---------- Формы ----------
function heroForm(edit){
  const p=edit?P():null;
  const av = p? {...p.avatar} : {skin:0,hair:0,outfit:0,hairStyle:0};
  const sw=(arr,k)=>`<div class="opts" data-group="${k}">${arr.map((c,i)=>`<button type="button" class="opt swatch ${av[k]===i?'on':''}" data-v="${i}" style="background:${c[0]}"></button>`).join('')}</div>`;
  modal(`<h2>${edit?t('editHero'):t('createHero')}</h2>
    <div class="hero" style="justify-content:center"><div id="avprev" class="avatar-box">${avatarImg(av,6)}</div></div>
    <label class="f">${t('heroName')}</label><input class="inp" id="hname" maxlength="24" value="${esc(p?.name||'')}" placeholder="${esc(t('heroNamePh'))}">
    <label class="f">${t('skin')}</label>${sw(SKINS,'skin')}
    <label class="f">${t('hair')}</label>${sw(HAIRS,'hair')}
    <label class="f">${t('hairStyle')}</label>${optGroup('hairStyle',L().hairStyles.map((label,v)=>({v,label})),av.hairStyle||0)}
    <label class="f">${t('outfit')}</label>${sw(OUTFITS,'outfit')}
    ${edit?'':`<label class="f" style="display:flex;gap:8px;align-items:center;color:var(--kc)"><input type="checkbox" id="presets" checked style="width:20px;height:20px"> ${t('presets')}</label>`}
    <div class="actions"><button class="btn gray" data-x="no">${t('cancel')}</button><button class="btn green" data-x="ok">${edit?t('save'):t('play')}</button></div>`, bg=>{
      bindOpts(bg);
      const read=()=>({...av, skin:+getOpt(bg,'skin'), hair:+getOpt(bg,'hair'), outfit:+getOpt(bg,'outfit'), hairStyle:+getOpt(bg,'hairStyle')});
      bg.querySelectorAll('.opts').forEach(g=>g.addEventListener('change',()=>{ bg.querySelector('#avprev').innerHTML=avatarImg(read(),6); }));
      bg.querySelector('[data-x=no]').onclick=closeModal;
      bg.querySelector('[data-x=ok]').onclick=()=>{
        const name=bg.querySelector('#hname').value.trim(); if(!name){ bg.querySelector('#hname').focus(); return; }
        if(edit){ p.name=name; p.avatar=read(); }
        else { const np=newProfile(name, read(), bg.querySelector('#presets').checked); DB.profiles.push(np); DB.current=np.id; TAB='hero'; }
        save(); closeModal(); sfx('ach'); render();
      };
    });
}

function habitForm(h){
  const isNew=!h; h=h||{title:'',attr:'str',diff:1,days:[0,1,2,3,4,5,6]};
  const wd=L().weekdays;
  modal(`<h2>${isNew?t('newHabit'):t('editHabit')}</h2>
    <label class="f">${t('habitWhat')}</label><input class="inp" id="ht" maxlength="60" value="${esc(h.title)}" placeholder="${esc(t('habitPh'))}">
    <label class="f">${t('sphereAttr')}</label>${optGroup('attr',attrOpts(),h.attr)}
    <label class="f">${t('difficulty')}</label>${optGroup('diff',Object.entries(DIFF).map(([k,d])=>({v:k,label:`${dName(k)} (+${d.xp} XP)`})),h.diff)}
    <label class="f">${t('weekdaysLbl')}</label><div class="opts" data-group="days">${[1,2,3,4,5,6,0].map(d=>`<button type="button" class="opt ${h.days.includes(d)?'on':''}" data-v="${d}">${wd[d]}</button>`).join('')}</div>
    <div class="actions"><button class="btn gray" data-x="no">${t('cancel')}</button><button class="btn green" data-x="ok">${t('save')}</button></div>`, bg=>{
      bindOpts(bg,{days:true});
      bg.querySelector('[data-x=no]').onclick=closeModal;
      bg.querySelector('[data-x=ok]').onclick=()=>{
        const p=P(); const title=bg.querySelector('#ht').value.trim(); const days=getOpts(bg,'days').map(Number);
        if(!title){ bg.querySelector('#ht').focus(); return; } if(!days.length){ toast(`[${t('pickDay')}]`,'bad'); return; }
        const data={title,attr:getOpt(bg,'attr'),diff:+getOpt(bg,'diff'),days};
        if(isNew){ p.habits.push({id:uid(),...data,done:{},created:today()}); addLog(p,t('habitLog',{t:title}),'c'); }
        else Object.assign(h,data);
        save(); closeModal(); render();
      };
    });
}

function questForm(q){
  const isNew=!q; q=q||{title:'',desc:'',attr:'wea',rank:'C',deadline:'',steps:[]};
  modal(`<h2>${isNew?t('newQuest'):t('editQuest')}</h2>
    <label class="f">${t('goal')}</label><input class="inp" id="qt" maxlength="80" value="${esc(q.title)}" placeholder="${esc(t('goalPh'))}">
    <label class="f">${t('descOpt')}</label><textarea class="inp" id="qd" maxlength="400" placeholder="${esc(t('descPh'))}">${esc(q.desc)}</textarea>
    <label class="f">${t('sphere')}</label>${optGroup('attr',attrOpts(),q.attr)}
    <label class="f">${t('rankLbl')}</label>${optGroup('rank',Object.keys(RANKS).map(k=>({v:k,label:k})),q.rank)}
    <div class="tiny muted" id="rankinfo"></div>
    <label class="f">${t('deadlineOpt')}</label><input class="inp" type="date" id="qdl" value="${esc(q.deadline||'')}">
    <label class="f">${t('stepsLbl')}</label><textarea class="inp" id="qs" placeholder="${esc(t('stepsPh'))}">${esc((q.steps||[]).map(s=>s.t).join('\n'))}</textarea>
    <div class="actions"><button class="btn gray" data-x="no">${t('cancel')}</button><button class="btn green" data-x="ok">${isNew?t('acceptQuest'):t('save')}</button></div>`, bg=>{
      bindOpts(bg);
      const upd=()=>{ const k=getOpt(bg,'rank'), r=RANKS[k]; bg.querySelector('#rankinfo').textContent=t('rankInfo',{r:`${k} — ${rName(k)}`,xp:r.xp,g:r.gold}); };
      bg.querySelector('[data-group=rank]').addEventListener('change',upd); upd();
      bg.querySelector('[data-x=no]').onclick=closeModal;
      bg.querySelector('[data-x=ok]').onclick=()=>{
        const p=P(); const title=bg.querySelector('#qt').value.trim(); if(!title){ bg.querySelector('#qt').focus(); return; }
        const lines=bg.querySelector('#qs').value.split('\n').map(s=>s.trim()).filter(Boolean);
        const old=q.steps||[];
        const steps=lines.map(tx=>{ const o=old.find(s=>s.t===tx); return o?o:{t:tx,done:false}; });
        const data={title,desc:bg.querySelector('#qd').value.trim(),attr:getOpt(bg,'attr'),rank:getOpt(bg,'rank'),deadline:bg.querySelector('#qdl').value,steps};
        if(isNew){ p.quests.push({id:uid(),...data,status:'active',created:today()}); addLog(p,t('questLog',{t:title,r:data.rank}),'c'); toast(`<span class="br">[</span>${esc(t('questToast',{t:title}))}<span class="br">]</span>`); sfx('attr'); }
        else Object.assign(q,data);
        QTAB='active'; save(); closeModal(); render();
      };
    });
}

function rewardForm(r){
  const isNew=!r; r=r||{title:'',cost:100};
  modal(`<h2>${isNew?t('newReward'):t('editReward')}</h2>
    <label class="f">${t('reward')}</label><input class="inp" id="rt" maxlength="50" value="${esc(r.title)}" placeholder="${esc(t('rewardPh'))}">
    <label class="f">${t('price')}</label><input class="inp" id="rc" type="number" min="1" max="100000" value="${r.cost}">
    <div class="tiny muted mt">${t('priceHint')}</div>
    <div class="actions"><button class="btn gray" data-x="no">${t('cancel')}</button><button class="btn green" data-x="ok">${t('save')}</button></div>`, bg=>{
      bg.querySelector('[data-x=no]').onclick=closeModal;
      bg.querySelector('[data-x=ok]').onclick=()=>{
        const p=P(); const title=bg.querySelector('#rt').value.trim(); const cost=Math.max(1,parseInt(bg.querySelector('#rc').value)||0);
        if(!title) return; if(isNew) p.rewards.push({id:uid(),title,cost}); else Object.assign(r,{title,cost});
        save(); closeModal(); render();
      };
    });
}

function badForm(b){
  const isNew=!b;
  modal(`<h2>${isNew?t('newBad'):t('editBad')}</h2>
    <label class="f">${t('badWhat')}</label><input class="inp" id="bt" maxlength="50" value="${esc(b?.title||'')}" placeholder="${esc(t('badPh'))}">
    ${isNew?`<label class="f">${t('badDays')}</label><input class="inp" id="bd" type="number" min="0" value="0">`:''}
    <div class="actions"><button class="btn gray" data-x="no">${t('cancel')}</button><button class="btn green" data-x="ok">${t('save')}</button></div>`, bg=>{
      bg.querySelector('[data-x=no]').onclick=closeModal;
      bg.querySelector('[data-x=ok]').onclick=()=>{
        const p=P(); const title=bg.querySelector('#bt').value.trim(); if(!title) return;
        if(isNew){ const d=Math.max(0,parseInt(bg.querySelector('#bd').value)||0); const since=addDays(today(),-d);
          p.bad.push({id:uid(),title,since,slips:[],milestones:CLEAN_MILESTONES.filter(m=>m<=d)}); }
        else b.title=title;
        save(); closeModal(); render();
      };
    });
}

function menu(title, items){
  modal(`<h2>${esc(title)}</h2>${items.map((it,i)=>`<button class="btn block ${it.cls||'gray'}" data-i="${i}" style="margin:10px 4px">${it.label}</button>`).join('')}`, bg=>{
    bg.querySelectorAll('[data-i]').forEach(b=>b.onclick=()=>{ closeModal(); items[+b.dataset.i].fn(); });
  });
}

function exportBackup(){
  const name=`levelup-backup-${today()}.json`, text=JSON.stringify(DB,null,1);
  if(window.AndroidBridge){ // внутри APK: сохраняем через Android в «Загрузки»
    const path=window.AndroidBridge.save(name,text);
    toast(path?`[${esc(t('backupSaved',{p:path}))}]`:`[${t('saveErr',{e:'?'})}]`, path?'':'bad', 4000);
    return;
  }
  const blob=new Blob([text],{type:'application/json'}); const a=document.createElement('a');
  a.href=URL.createObjectURL(blob); a.download=name; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),2000);
}

function settingsModal(){
  modal(`<h2>${t('settings')}</h2>
    <label class="f">${t('language')}</label>${optGroup('lang',langOpts(),DB.settings.lang)}
    <div style="height:10px"></div>
    <button class="btn block ${DB.settings.sound?'green':'gray'}" data-x="sound">${t('sound',{v:DB.settings.sound?t('on'):t('off')})}</button>
    <button class="btn block" data-x="edit">${t('editHero')}</button>
    <button class="btn block" data-x="profiles">${t('switchHero')}</button>
    <button class="btn block gray" data-x="export">${t('backup')}</button>
    <button class="btn block gray" data-x="import">${t('restore')}</button>
    <input type="file" id="impfile" accept="application/json,.json" hidden>
    <button class="btn block red" data-x="del">${t('delHero')}</button>
    <p class="tiny muted mt">${t('dataNote')}</p>`, bg=>{
      bindOpts(bg);
      bg.querySelector('[data-group=lang]').addEventListener('change',()=>{ setLang(getOpt(bg,'lang')); settingsModal(); });
      const on=(x,f)=>bg.querySelector(`[data-x=${x}]`).onclick=f;
      on('sound',()=>{ DB.settings.sound=!DB.settings.sound; save(); settingsModal(); });
      on('edit',()=>heroForm(true));
      on('profiles',()=>{ closeModal(); profilesModal(); });
      on('export',exportBackup);
      on('import',()=>bg.querySelector('#impfile').click());
      bg.querySelector('#impfile').onchange=async e=>{ const f=e.target.files[0]; if(!f) return;
        try{ const d=JSON.parse(await f.text()); if(!d.profiles) throw new Error(t('wrongFile'));
          confirmBox(t('restoreAsk',{n:d.profiles.length}),t('load'),()=>{ const lang=DB.settings.lang; DB=d; DB.settings=DB.settings||{sound:true}; if(!LANGS.includes(DB.settings.lang)) DB.settings.lang=lang; save(); buildNav(); render(); toast(`[${t('restored')}]`); });
        }catch(err){ toast(`[${esc(t('readErr',{e:err.message}))}]`,'bad'); } };
      on('del',()=>{ const p=P(); confirmBox(t('delHeroAsk',{n:esc(p.name)}),t('del'),()=>{ DB.profiles=DB.profiles.filter(x=>x.id!==p.id); DB.current=DB.profiles[0]?.id||null; save(); render(); }); });
    });
}
function profilesModal(){
  const sorted=[...DB.profiles].sort((a,b)=>b.xp-a.xp);
  modal(`<h2>${t('guild')}</h2><div class="herolist">${sorted.map((p,i)=>`<div class="item" data-pick="${p.id}" style="cursor:pointer;${p.id===DB.current?'box-shadow:0 0 0 3px var(--k4)':''}"><span class="h" style="font-size:10px;color:var(--k4);width:20px">${i+1}</span>${avatarImg(p.avatar,2)}<div class="body"><div class="t">${esc(p.name)}</div><div class="sub"><span>${t('lvlAbbr')} ${charLevel(p).level} · ${titleOf(charLevel(p).level)}</span><span>${Object.keys(p.ach).length} ${icon('trophy',2)}</span></div></div></div>`).join('')}</div>
    <button class="btn green block mt" data-x="new">${t('newHero')}</button>
    <p class="tiny muted">${t('guildNote')}</p>`, bg=>{
      bg.querySelectorAll('[data-pick]').forEach(el=>el.onclick=()=>{ DB.current=el.dataset.pick; TAB='hero'; save(); closeModal(); render(); });
      bg.querySelector('[data-x=new]').onclick=()=>heroForm(false);
    });
}

// ---------- Действия ----------
const ACTIONS = {
  newhero:()=>heroForm(false),
  pick:(el)=>{ DB.current=el.dataset.id; TAB='hero'; save(); render(); },
  lang:(el)=>{ sfx('click'); setLang(el.dataset.v); },
  profiles:()=>profilesModal(),
  settings:()=>settingsModal(),
  qtab:(el)=>{ QTAB=el.dataset.v; render(); },

  toggle:(el,e)=>{
    const p=P(), h=p.habits.find(x=>x.id===el.dataset.id), tk=today();
    if(h.done[tk]){ ungrant(p,h.done[tk]); p.stats.habitDone=Math.max(0,p.stats.habitDone-1); delete h.done[tk]; sfx('undo'); }
    else {
      const d=DIFF[h.diff]; const st=habitStreak(h,addDays(tk,-1)); const bonus=1+Math.min(st,30)*0.01;
      h.done[tk]=grant(p,{xp:Math.round(d.xp*bonus),gold:d.gold,attr:h.attr,reason:h.title,crit:true,at:atFromEvent(e)});
      p.stats.habitDone++; heal(p,2);
      h.best=Math.max(h.best||0,habitStreak(h));
      const todays=p.habits.filter(x=>isScheduled(x,tk));
      if(todays.length>=3 && todays.every(x=>x.done[tk]) && p.perfectDay!==tk){
        p.perfectDay=tk; p.stats.perfectDays++;
        grant(p,{xp:30,gold:15,reason:t('perfectDay'),noMult:true}); heal(p,10);
      }
    }
    checkAchs(p); save(); render();
  },
  habitmenu:(el)=>{ const p=P(), h=p.habits.find(x=>x.id===el.dataset.id);
    menu(h.title,[{label:t('edit'),fn:()=>habitForm(h)},{label:t('bestStreak',{n:Math.max(h.best||0,habitStreak(h))}),fn:()=>{}},
      {label:t('del'),cls:'red',fn:()=>confirmBox(t('delHabitAsk',{t:esc(h.title)}),t('del'),()=>{ p.habits=p.habits.filter(x=>x!==h); save(); render(); })}]); },
  addhabit:()=>habitForm(),

  addbad:()=>badForm(),
  slip:(el,e)=>{ const p=P(), b=p.bad.find(x=>x.id===el.dataset.id); const at=atFromEvent(e);
    confirmBox(t('slipAsk',{t:esc(b.title),n:cleanDays(b)}),t('slipYes'),()=>{
      b.slips.push(today()); b.since=today(); b.milestones=[]; hurt(p,15,t('slipReason',{t:b.title}),at); save(); render(); }); },
  badmenu:(el)=>{ const p=P(), b=p.bad.find(x=>x.id===el.dataset.id);
    menu(b.title,[{label:t('rename'),fn:()=>badForm(b)},{label:t('del'),cls:'red',fn:()=>confirmBox(t('delBadAsk'),t('del'),()=>{ p.bad=p.bad.filter(x=>x!==b); save(); render(); })}]); },

  addquest:()=>questForm(),
  step:(el,e)=>{ const p=P(), q=p.quests.find(x=>x.id===el.dataset.id), s=q.steps[+el.dataset.i];
    if(s.done){ ungrant(p,s.g); s.done=false; s.g=null; sfx('undo'); }
    else { s.done=true; s.g=grant(p,{xp:5,gold:1,attr:q.attr,reason:t('stepReason'),at:atFromEvent(e)}); }
    save(); render(); },
  qdone:(el,e)=>{ const p=P(), q=p.quests.find(x=>x.id===el.dataset.id); const at=atFromEvent(e);
    const left=(q.steps||[]).filter(s=>!s.done).length;
    confirmBox(t('finishAsk',{t:esc(q.title)})+(left?t('stepsLeft',{n:left}):''),t('finish'),()=>{
      const r=RANKS[q.rank]; q.status='done'; q.doneAt=today();
      q.g=grant(p,{xp:r.xp,gold:r.gold,attr:q.attr,reason:t('questDone',{t:q.title}),crit:true,at});
      p.stats.questsDone++; if(q.rank==='S') p.stats.sDone++; heal(p,10);
      checkAchs(p); save(); render(); },false); },
  questmenu:(el)=>{ const p=P(), q=p.quests.find(x=>x.id===el.dataset.id);
    const items=[];
    if(q.status==='active'){
      items.push({label:t('edit'),fn:()=>questForm(q)});
      items.push({label:t('failQuest'),cls:'red',fn:()=>confirmBox(t('failAsk'),t('failBtn'),()=>{ q.status='failed'; q.doneAt=today(); addLog(p,t('failLog',{t:q.title}),'b'); save(); render(); })});
    } else if(q.status==='done'){
      items.push({label:t('reopenUndo'),fn:()=>{ ungrant(p,q.g); q.g=null; q.status='active'; q.doneAt=null; p.stats.questsDone=Math.max(0,p.stats.questsDone-1); if(q.rank==='S') p.stats.sDone=Math.max(0,p.stats.sDone-1); save(); render(); }});
    } else items.push({label:t('reopen'),fn:()=>{ q.status='active'; q.doneAt=null; save(); render(); }});
    items.push({label:t('del'),cls:'red',fn:()=>confirmBox(t('delQuestAsk'),t('del'),()=>{ p.quests=p.quests.filter(x=>x!==q); save(); render(); })});
    menu(q.title,items); },

  dailydone:(el,e)=>{ const p=P(), d=p.daily, r=dailyReward(p);
    d.done=true; d.grant=grant(p,{xp:r.xp,gold:r.gold,attr:d.a,reason:t('dailyReason'),crit:true,at:atFromEvent(e)}); p.stats.dailyDone++;
    checkAchs(p); save(); render(); },
  dailyundo:()=>{ const p=P(), d=p.daily; ungrant(p,d.grant); d.done=false; d.grant=null; p.stats.dailyDone=Math.max(0,p.stats.dailyDone-1); sfx('undo'); save(); render(); },

  mood:(el,e)=>checkin('mood',+el.dataset.n,e),
  energy:(el,e)=>checkin('energy',+el.dataset.n,e),
  attrinfo:(el)=>{ const p=P(), a=ATTR[el.dataset.id], l=attrLevel(p,a.id);
    const hs=p.habits.filter(h=>h.attr===a.id), qs=p.quests.filter(q=>q.attr===a.id&&q.status==='active');
    modal(`<h2>${icon(a.id,3)} ${aName(a.id)}</h2><p>${t('lifeSphere')} <b>${aSphere(a.id)}</b></p>${bar(l.cur,l.need,a.color,`${t('lvlLower')} ${l.level} · ${l.cur}/${l.need}`,'big')}
      <p class="small muted">${t('totalXp',{n:p.attrs[a.id]||0})}</p>
      <div class="panel-title mt">${t('habitsLbl')}</div>${hs.map(h=>`<div class="small">• ${esc(h.title)}</div>`).join('')||`<div class="small muted">${t('none')}</div>`}
      <div class="panel-title mt">${t('activeQuests')}</div>${qs.map(q=>`<div class="small">• [${q.rank}] ${esc(q.title)}</div>`).join('')||`<div class="small muted">${t('none')}</div>`}
      <div class="actions"><button class="btn gray" onclick="closeModal()">${t('close')}</button></div>`); },
  achinfo:(el)=>{ const p=P(), a=ACHS.find(x=>x.id===el.dataset.id), got=p.ach[a.id], [nm,desc]=achText(a.id);
    modal(`<div class="center">${got?icon(a.icon,7):icon('lock',7)}<h2 class="mt">${esc(nm)}</h2><p>${esc(desc)}</p>
      <p class="small muted">${t('rewardLbl')} ${a.xp?`+${a.xp} XP `:''}${a.gold?`+${a.gold} ${t('gold')}`:''}</p>
      ${got?`<p style="color:var(--k5)">${t('gotOn',{d:fmtDate(got)})}</p>`:`<p class="muted">${t('notYet')}</p>`}</div>
      <div class="actions"><button class="btn gray" onclick="closeModal()">${t('close')}</button></div>`); },

  addreward:()=>rewardForm(),
  rewardmenu:(el)=>{ const p=P(), r=p.rewards.find(x=>x.id===el.dataset.id);
    menu(r.title,[{label:t('edit'),fn:()=>rewardForm(r)},{label:t('del'),cls:'red',fn:()=>{ p.rewards=p.rewards.filter(x=>x!==r); save(); render(); }}]); },
  buy:(el,e)=>{ const p=P(), r=p.rewards.find(x=>x.id===el.dataset.id); if(p.gold<r.cost) return;
    confirmBox(t('buyAsk',{t:esc(r.title),c:r.cost}),t('buy'),()=>{
      p.gold-=r.cost; p.purchases.unshift({title:r.title,cost:r.cost,at:today()}); addLog(p,t('boughtLog',{t:r.title,c:r.cost}),'y');
      toast(`${icon('gift',2)} <span><span class="br">[</span>${esc(t('boughtToast',{t:r.title}))}<span class="br">]</span></span>`,'gold'); sfx('coin');
      checkAchs(p); save(); render(); },false); },
};
function checkin(kind,n,e){
  const p=P(), tk=today(); const c=p.checkins[tk]=p.checkins[tk]||{};
  const first=!c.mood && !c.energy; c[kind]=n;
  if(first){ grant(p,{xp:5,attr:'spi',reason:t('selfObs'),at:atFromEvent(e),noMult:true}); }
  else sfx('click');
  checkAchs(p); save(); render();
}

document.addEventListener('click',e=>{
  const nav=e.target.closest('nav.bottom button');
  if(nav){ TAB=nav.dataset.tab; sfx('click'); render(); scrollTo(0,0); return; }
  const el=e.target.closest('[data-a]'); if(!el || el.closest('#modal')) return;
  const fn=ACTIONS[el.dataset.a]; if(fn){ e.preventDefault(); fn(el,e); }
});
document.addEventListener('visibilitychange',()=>{ if(!document.hidden && P() && P().lastDay!==today()) render(); });

// ---------- Нижнее меню ----------
function buildNav(){
  const tabs=[['hero','hero'],['habits','check'],['quests','sword'],['ach','trophy'],['shop','bag']];
  $('nav.bottom').innerHTML=`<div class="in">${tabs.map(([k,ic])=>`<button data-tab="${k}">${icon(ic,3)}<span>${L().nav[k]}</span></button>`).join('')}</div>`;
}

buildNav();
render();
if('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(()=>{});
