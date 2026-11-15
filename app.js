'use strict';
/* ==========================================================
   LEVEL UP — прокачка себя как персонажа RPG.
   Данные хранятся локально (localStorage) по профилям семьи.
   ========================================================== */

// ---------- Справочники ----------
const ATTRS = [
  {id:'str', name:'Сила',         short:'СИЛ', sphere:'Тело и спорт',        color:'#b13e53'},
  {id:'end', name:'Выносливость', short:'ВЫН', sphere:'Здоровье и режим',    color:'#ef7d57'},
  {id:'int', name:'Интеллект',    short:'ИНТ', sphere:'Учёба и разум',       color:'#41a6f6'},
  {id:'cha', name:'Харизма',      short:'ХАР', sphere:'Семья и отношения',   color:'#f4f4f4'},
  {id:'wil', name:'Воля',         short:'ВОЛ', sphere:'Дисциплина',          color:'#3b5dc9'},
  {id:'cre', name:'Творчество',   short:'ТВР', sphere:'Хобби и творчество',  color:'#a7f070'},
  {id:'wea', name:'Достаток',     short:'ДОС', sphere:'Работа и финансы',    color:'#ffcd75'},
  {id:'spi', name:'Дух',          short:'ДУХ', sphere:'Осознанность',        color:'#73eff7'},
];
const ATTR = Object.fromEntries(ATTRS.map(a=>[a.id,a]));

const DIFF = {
  1:{name:'Легко',  xp:10, gold:2},
  2:{name:'Средне', xp:20, gold:5},
  3:{name:'Сложно', xp:40, gold:10},
};
const RANKS = {
  E:{xp:50,  gold:10,  name:'E — пустяк'},
  D:{xp:100, gold:20,  name:'D — простое'},
  C:{xp:200, gold:40,  name:'C — заметное'},
  B:{xp:400, gold:80,  name:'B — серьёзное'},
  A:{xp:800, gold:160, name:'A — большое'},
  S:{xp:1500,gold:300, name:'S — легендарное'},
};
const TITLES = [
  [1,'Новичок'],[3,'Искатель'],[5,'Ученик'],[8,'Подмастерье'],[12,'Боец'],
  [16,'Ветеран'],[20,'Мастер'],[25,'Магистр'],[30,'Герой'],[40,'Легенда'],[50,'Бессмертный'],
];
const WEEKDAYS = ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'];
const CLEAN_MILESTONES = [1,3,7,14,30,60,100,180,365];

const DAILY_POOL = [
  {t:'Сделай 30 приседаний',a:'str'},{t:'Пройди пешком 5000 шагов',a:'end'},{t:'Выпей 6 стаканов воды',a:'end'},
  {t:'Прочитай 15 страниц книги',a:'int'},{t:'Узнай одну новую вещь и расскажи о ней',a:'int'},
  {t:'Скажи близкому человеку что-то тёплое',a:'cha'},{t:'Позвони родственнику просто так',a:'cha'},
  {t:'Сделай самое неприятное дело дня первым',a:'wil'},{t:'Час без соцсетей',a:'wil'},
  {t:'Нарисуй, напиши или сыграй что-нибудь 15 минут',a:'cre'},{t:'Запиши 3 идеи',a:'cre'},
  {t:'Запиши все расходы за день',a:'wea'},{t:'Разбери один рабочий хвост',a:'wea'},
  {t:'5 минут тишины и дыхания',a:'spi'},{t:'Запиши 3 вещи, за которые благодарен',a:'spi'},
  {t:'Наведи порядок в одном ящике',a:'wil'},{t:'Сделай растяжку 10 минут',a:'str'},{t:'Ляг спать до 23:00',a:'end'},
];

const PRESET_HABITS = [
  {title:'Зарядка 10 минут',attr:'str',diff:1},
  {title:'Читать 20 минут',attr:'int',diff:2},
  {title:'Выпить 8 стаканов воды',attr:'end',diff:1},
  {title:'Лечь спать до 23:30',attr:'end',diff:2},
  {title:'Время с семьёй без телефона',attr:'cha',diff:2},
  {title:'Записать расходы',attr:'wea',diff:1},
  {title:'Медитация / тишина 5 минут',attr:'spi',diff:1},
];
const PRESET_BAD = [{title:'Думскроллинг'},{title:'Сладкое на ночь'}];
const PRESET_REWARDS = [
  {title:'30 минут любимой игры',cost:50},{title:'Серия сериала',cost:60},{title:'Вкусняшка',cost:80},
  {title:'Поход в кино',cost:250},{title:'Ленивый выходной',cost:400},{title:'Покупка мечты',cost:1500},
];

// ---------- Ачивки ----------
const ACHS = [
  {id:'first_step', name:'Первый шаг', desc:'Отметь первую привычку', icon:'check', xp:20, gold:10, test:p=>p.stats.habitDone>=1},
  {id:'h10', name:'Разгон', desc:'Выполни 10 привычек', icon:'bolt', xp:40, gold:20, test:p=>p.stats.habitDone>=10},
  {id:'h100', name:'Сотня', desc:'Выполни 100 привычек', icon:'star', xp:150, gold:80, test:p=>p.stats.habitDone>=100},
  {id:'h500', name:'Машина', desc:'Выполни 500 привычек', icon:'trophy', xp:500, gold:250, test:p=>p.stats.habitDone>=500},
  {id:'s3', name:'Искра', desc:'Серия 3 дня по одной привычке', icon:'flame', xp:30, gold:15, test:p=>maxStreak(p)>=3},
  {id:'s7', name:'Неделя огня', desc:'Серия 7 дней', icon:'flame', xp:80, gold:40, test:p=>maxStreak(p)>=7},
  {id:'s30', name:'Железная привычка', desc:'Серия 30 дней', icon:'wil', xp:300, gold:150, test:p=>maxStreak(p)>=30},
  {id:'s100', name:'Неудержимый', desc:'Серия 100 дней', icon:'crown', xp:1000, gold:500, test:p=>maxStreak(p)>=100},
  {id:'l5', name:'Уровень 5', desc:'Достигни 5 уровня', icon:'xp', xp:0, gold:50, test:p=>charLevel(p).level>=5},
  {id:'l10', name:'Уровень 10', desc:'Достигни 10 уровня', icon:'xp', xp:0, gold:120, test:p=>charLevel(p).level>=10},
  {id:'l20', name:'Корона', desc:'Достигни 20 уровня — получи корону на аватар', icon:'crown', xp:0, gold:300, test:p=>charLevel(p).level>=20},
  {id:'q1', name:'Квестовик', desc:'Заверши первый квест', icon:'scroll', xp:30, gold:20, test:p=>p.stats.questsDone>=1},
  {id:'q10', name:'Охотник за целями', desc:'Заверши 10 квестов', icon:'sword', xp:200, gold:100, test:p=>p.stats.questsDone>=10},
  {id:'qS', name:'Легендарный подвиг', desc:'Заверши квест ранга S', icon:'star', xp:300, gold:200, test:p=>p.stats.sDone>=1},
  {id:'harmony', name:'Гармония', desc:'Прокачай за один день 5 разных сфер', icon:'spi', xp:100, gold:50, test:p=>(p.stats.bestSpheresDay||0)>=5},
  {id:'all8', name:'Универсал', desc:'Каждая характеристика — хотя бы 3 уровня', icon:'hero', xp:300, gold:150, test:p=>ATTRS.every(a=>attrLevel(p,a.id).level>=3)},
  {id:'a10', name:'Специалист', desc:'Любая характеристика — 10 уровень', icon:'int', xp:200, gold:100, test:p=>ATTRS.some(a=>attrLevel(p,a.id).level>=10)},
  {id:'crit', name:'Везунчик', desc:'Получи критический успех', icon:'bolt', xp:20, gold:20, test:p=>p.stats.crits>=1},
  {id:'crit25', name:'Любимчик Фортуны', desc:'25 критических успехов', icon:'star', xp:150, gold:100, test:p=>p.stats.crits>=25},
  {id:'clean7', name:'Чистая неделя', desc:'7 дней без срыва по вредной привычке', icon:'skull', xp:100, gold:50, test:p=>p.bad.some(b=>cleanDays(b)>=7)},
  {id:'clean30', name:'Свобода', desc:'30 дней без срыва', icon:'wil', xp:400, gold:200, test:p=>p.bad.some(b=>cleanDays(b)>=30)},
  {id:'mood7', name:'Самопознание', desc:'7 раз отметь своё состояние', icon:'smile', xp:50, gold:20, test:p=>Object.keys(p.checkins).length>=7},
  {id:'daily5', name:'Агент Системы', desc:'Выполни 5 заданий дня', icon:'scroll', xp:80, gold:40, test:p=>p.stats.dailyDone>=5},
  {id:'buy1', name:'Заслужил', desc:'Купи первую награду в лавке', icon:'bag', xp:20, gold:0, test:p=>p.purchases.length>=1},
  {id:'rich', name:'Казначей', desc:'Накопи 1000 золота', icon:'coin', xp:100, gold:0, test:p=>p.gold>=1000},
  {id:'perfect', name:'Идеальный день', desc:'Выполни все привычки дня (минимум 3)', icon:'trophy', xp:60, gold:30, test:p=>p.stats.perfectDays>=1},
  {id:'perfect7', name:'Безупречность', desc:'7 идеальных дней', icon:'crown', xp:250, gold:120, test:p=>p.stats.perfectDays>=7},
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
function hashStr(s){ let h=2166136261; for(const c of s){ h^=c.charCodeAt(0); h=Math.imul(h,16777619);} return h>>>0; }
function plural(n,a,b,c){ n=Math.abs(n)%100; const n1=n%10; if(n>10&&n<20) return c; if(n1>1&&n1<5) return b; if(n1===1) return a; return c; }

// ---------- Хранилище ----------
const KEY = 'levelup.v1';
let DB = load();
function load(){
  try{ const d = JSON.parse(localStorage.getItem(KEY)); if(d && d.profiles) return d; }catch(e){}
  return {profiles:[], current:null, settings:{sound:true}};
}
function save(){ try{ localStorage.setItem(KEY, JSON.stringify(DB)); }catch(e){ toast('[Ошибка сохранения: '+esc(e.message)+']','bad'); } }
const P = ()=>DB.profiles.find(p=>p.id===DB.current);

function newProfile(name, av, presets){
  const p = {
    id:uid(), name, avatar:av, created:today(), lastDay:today(),
    xp:0, gold:0, hp:100, maxLevel:1, attrs:Object.fromEntries(ATTRS.map(a=>[a.id,0])), attrMax:{},
    habits:[], bad:[], quests:[], rewards:[], purchases:[], checkins:{}, ach:{}, log:[],
    stats:{habitDone:0,questsDone:0,sDone:0,crits:0,dailyDone:0,perfectDays:0,bestSpheresDay:0},
    spheresDay:{date:today(),set:[]}, perfectDay:null, daily:null,
  };
  if(presets){
    PRESET_HABITS.forEach(h=>p.habits.push({id:uid(),title:h.title,attr:h.attr,diff:h.diff,days:[0,1,2,3,4,5,6],done:{},created:today()}));
    PRESET_BAD.forEach(b=>p.bad.push({id:uid(),title:b.title,since:today(),slips:[],milestones:[]}));
  }
  PRESET_REWARDS.forEach(r=>p.rewards.push({id:uid(),...r}));
  addLog(p,'Интерфейс активирован. Добро пожаловать, '+name+'.','c');
  return p;
}

// ---------- Прогрессия ----------
const needChar = L=>Math.round(60*Math.pow(L,1.55));   // опыт с L до L+1
const needAttr = L=>Math.round(40*Math.pow(L,1.35));
function levelFrom(xp, need){ let L=1, rest=Math.max(0,xp); while(rest>=need(L)){ rest-=need(L); L++; } return {level:L, cur:rest, need:need(L)}; }
const charLevel = p=>levelFrom(p.xp, needChar);
const attrLevel = (p,a)=>levelFrom(p.attrs[a]||0, needAttr);
function titleOf(L){ let t=TITLES[0][1]; for(const [l,n] of TITLES) if(L>=l) t=n; return t; }

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

// Эффекты (баффы/дебаффы) и множитель опыта
function effects(p){
  const e=[]; const c=p.checkins[today()];
  if(p.hp<=0) e.push({bad:true,name:'Истощение',desc:'HP на нуле: опыт −50%. Отдыхай и выполняй привычки.',mult:-0.5});
  else if(p.hp<30) e.push({bad:true,name:'Усталость',desc:'HP ниже 30: опыт −20%.',mult:-0.2});
  if(c && c.mood>=4) e.push({name:'Хорошее настроение',desc:'Опыт +10% сегодня.',mult:0.1});
  if(c && c.energy>=4) e.push({name:'Бодрость',desc:'Золото +10% сегодня.',gold:0.1});
  if(c && c.mood<=2) e.push({bad:true,name:'Хандра',desc:'Сделай что-то приятное. Задание дня даст +50% опыта.',daily:0.5});
  const ms = maxStreak(p);
  if(ms>=7) e.push({name:'Вдохновение',desc:'Серия 7+ дней: опыт +'+(ms>=30?15:10)+'%.',mult:ms>=30?0.15:0.1});
  if(charLevel(p).level>=10) e.push({name:'Опытный',desc:'Шанс крита +3%.',crit:0.03});
  return e;
}
function xpMult(p){ return Math.max(0.2, 1+effects(p).reduce((s,e)=>s+(e.mult||0),0)); }
function goldMult(p){ return 1+effects(p).reduce((s,e)=>s+(e.gold||0),0); }
function critChance(p){ return 0.05 + effects(p).reduce((s,e)=>s+(e.crit||0),0); }

// ---------- Журнал ----------
function addLog(p,msg,cls=''){ p.log.unshift({t:Date.now(),msg,cls}); if(p.log.length>300) p.log.length=300; }

// ---------- Награда / откат ----------
// Возвращает фактически начисленное {xp,gold,attr,crit}
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
  // сферы за день
  if(attr){
    if(p.spheresDay.date!==today()) p.spheresDay={date:today(),set:[]};
    if(!p.spheresDay.set.includes(attr)) p.spheresDay.set.push(attr);
    p.stats.bestSpheresDay=Math.max(p.stats.bestSpheresDay||0,p.spheresDay.set.length);
  }
  const parts=[]; if(fx) parts.push(`+${fx} опыта`+(attr?` (${ATTR[attr].name})`:'')); if(fg) parts.push(`+${fg} золота`);
  if(parts.length){
    addLog(p,(isCrit?'КРИТ! ':'')+(reason?reason+': ':'')+parts.join(', '),'g');
    toast(`${isCrit?'<b style="color:var(--k3)">КРИТИЧЕСКИЙ УСПЕХ!</b> ':''}<span class="br">[</span>${esc(reason)}${reason?' — ':''}${parts.join(', ')}<span class="br">]</span>`, isCrit?'gold':'');
  }
  if(at){ if(fx) floatText(at,`+${fx} XP`, isCrit?'crit':''); if(fg) setTimeout(()=>floatText(at,`+${fg}`,'gold',14),180); }
  sfx(isCrit?'crit':'ok');
  // уровни
  const after = charLevel(p).level;
  if(after>before && after>(p.maxLevel||1)){ p.maxLevel=after; addLog(p,`НОВЫЙ УРОВЕНЬ: ${after}! Титул: ${titleOf(after)}`,'y'); queueLevelUp(after); }
  if(attr){ const aAfter=attrLevel(p,attr).level; const mx=p.attrMax[attr]||1;
    if(aAfter>aBefore && aAfter>mx){ p.attrMax[attr]=aAfter; addLog(p,`${ATTR[attr].name} повышена до ${aAfter}`,'y'); setTimeout(()=>toast(`<span class="br">[</span>Характеристика «${ATTR[attr].name}» повышена! Уровень ${aAfter}<span class="br">]</span>`,'gold'),400); sfx('attr'); }
  }
  return {xp:fx,gold:fg,attr,crit:isCrit};
}
function ungrant(p, g){
  if(!g) return;
  p.xp=Math.max(0,p.xp-(g.xp||0)); p.gold-= (g.gold||0);
  if(g.attr) p.attrs[g.attr]=Math.max(0,(p.attrs[g.attr]||0)-(g.xp||0));
  if(g.crit) p.stats.crits=Math.max(0,p.stats.crits-1);
  addLog(p,`Отменено: −${g.xp||0} опыта, −${g.gold||0} золота`,'b');
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
      addLog(p,`Достижение: «${a.name}»`,'y');
      setTimeout(()=>{ toast(`${icon(a.icon,2)} <span><span class="br">[</span>Достижение получено: <b style="color:var(--k4)">${esc(a.name)}</b><span class="br">]</span></span>`,'gold',3800); sfx('ach'); },700);
      if(a.xp||a.gold) grant(p,{xp:a.xp,gold:a.gold,reason:'Награда за достижение',noMult:true});
      if(a.id==='l20') p.avatar.crown=true;
    }
  }
}

// ---------- Новый день ----------
function dayTick(p){
  const t=today();
  if(p.lastDay===t) return;
  const passed = Math.max(1,daysBetween(p.lastDay,t));
  // штраф за пропущенные привычки вчера (только за вчера, мягко)
  const y = addDays(t,-1);
  if(daysBetween(p.lastDay,y)>=0){
    const missed = p.habits.filter(h=>isScheduled(h,y) && !h.done[y] && parseKey(h.created)<=parseKey(y)).length;
    if(missed){ p.hp=Math.max(0,p.hp-missed*4); addLog(p,`Вчера пропущено привычек: ${missed}. −${missed*4} HP`,'b'); }
  }
  heal(p, 15*passed);
  addLog(p,`Новый день. Восстановлено HP. Текущее HP: ${p.hp}`,'c');
  p.lastDay=t;
  save();
}
function cleanMilestones(p){
  for(const b of p.bad){
    const d=cleanDays(b);
    for(const m of CLEAN_MILESTONES){
      if(d>=m && !b.milestones.includes(m)){
        b.milestones.push(m);
        grant(p,{xp:15*m>600?600:15*m+10, gold:Math.min(300,5*m+5), attr:'wil', reason:`${m} ${plural(m,'день','дня','дней')} без «${b.title}»`, noMult:true});
      }
    }
  }
}
function dailyQuest(p){
  const t=today();
  if(!p.daily || p.daily.date!==t){
    const i = hashStr(p.id+t)%DAILY_POOL.length;
    p.daily={date:t, ...DAILY_POOL[i], done:false, grant:null};
  }
  return p.daily;
}

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
function queueLevelUp(L){ lvlQueue.push(L); if(lvlQueue.length===1) setTimeout(showLevelUp,600); }
function showLevelUp(){
  const L=lvlQueue[0]; if(!L) return;
  sfx('lvl');
  const f=document.createElement('div'); f.className='flash'; document.body.appendChild(f); setTimeout(()=>f.remove(),500);
  const el=document.createElement('div'); el.className='lvlup';
  el.innerHTML=`<div class="frame card">${icon('star',5)}<div class="big">НОВЫЙ УРОВЕНЬ!</div><div class="num">${L}</div>
    <p>Титул: <b style="color:var(--k4)">${titleOf(L)}</b></p><p class="muted small">Интерфейс фиксирует рост. Продолжай в том же духе.</p><p class="blinktxt">нажми, чтобы продолжить</p></div>`;
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
  modal(`<h2>Подтверждение</h2><p>${text}</p><div class="actions"><button class="btn gray" data-x="no">Отмена</button><button class="btn ${danger?'red':'green'}" data-x="yes">${okLabel}</button></div>`, bg=>{
    bg.querySelector('[data-x=no]').onclick=closeModal;
    bg.querySelector('[data-x=yes]').onclick=()=>{ closeModal(); cb(); };
  });
}
function optGroup(name, items, val){ // items: [{v,label,html}]
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
const attrOpts = ()=>ATTRS.map(a=>({v:a.id,label:a.sphere,html:icon(a.id,2)}));

// ---------- Состояние UI ----------
let TAB = 'hero';
let QTAB = 'active';

// ---------- Рендер ----------
function render(){
  const p=P();
  if(!p){ renderTitle(); return; }
  dayTick(p); dailyQuest(p); cleanMilestones(p); checkAchs(p); save();
  const cl=charLevel(p);
  const app=$('#app');
  app.innerHTML = `
    <header class="topbar">
      <button class="who" data-a="profiles">${avatarImg(p.avatar,2)}<div style="min-width:0"><div class="name">${esc(p.name)}</div><div class="lvl">УР ${cl.level} · ${titleOf(cl.level).toUpperCase()}</div></div></button>
      <div class="chip hp">${icon('heart',2)}${p.hp}</div>
      <div class="chip gold">${icon('coin',2)}${p.gold}</div>
      <button class="iconbtn" data-a="settings" aria-label="Настройки">${icon('gear',3)}</button>
    </header>
    <main>${({hero:viewHero,habits:viewHabits,quests:viewQuests,ach:viewAch,shop:viewShop})[TAB](p)}</main>`;
  document.querySelectorAll('nav.bottom button').forEach(b=>b.classList.toggle('on',b.dataset.tab===TAB));
  $('nav.bottom').style.display='';
}

function renderTitle(){
  $('nav.bottom').style.display='none';
  $('#app').innerHTML=`<div class="titlescreen">
    <div style="display:flex;justify-content:center;gap:8px;align-items:flex-end">${avatarImg({skin:0,hair:0,outfit:0},5)}${avatarImg({skin:1,hair:2,outfit:3,hairStyle:1},4)}${avatarImg({skin:2,hair:5,outfit:1,hairStyle:3},3)}</div>
    <div class="logo">LEVEL UP<small>ЖИЗНЬ — ЭТО ИГРА. ПРОКАЧАЙСЯ.</small></div>
    ${DB.profiles.length?`<div class="frame panel herolist"><div class="panel-title">${icon('hero',2)} Выбери героя</div>${DB.profiles.map(heroRow).join('')}</div>`:''}
    <button class="btn green" data-a="newhero" style="margin-top:18px">${DB.profiles.length?'+ Новый герой':'Начать игру'}</button>
    ${DB.profiles.length?'':'<p class="blinktxt" style="margin-top:28px">создай своего персонажа</p>'}
    <p class="muted tiny" style="margin-top:30px">По мотивам цикла «Level Up» Данияра Сугралинова</p>
  </div>`;
}
function heroRow(p){
  const cl=charLevel(p);
  return `<div class="item" data-a="pick" data-id="${p.id}">${avatarImg(p.avatar,2)}<div class="body"><div class="t">${esc(p.name)}</div><div class="sub"><span>Ур. ${cl.level} · ${titleOf(cl.level)}</span><span>${icon('coin',2)} ${p.gold}</span></div>${bar(cl.cur,cl.need,'var(--k9)','','thin')}</div></div>`;
}

// ----- Герой -----
function viewHero(p){
  const cl=charLevel(p); const ef=effects(p); const c=p.checkins[today()]||{};
  const dq=p.daily;
  return `
  <section class="frame panel">
    <div class="hero">
      <div class="avatar-box">${avatarImg(p.avatar,5)}</div>
      <div class="info">
        <div class="hname">${esc(p.name)}</div>
        <div class="lvlbadge">УРОВЕНЬ ${cl.level}</div>
        <div class="title">${titleOf(cl.level)}</div>
        <div class="statline">
          <span class="k">XP</span>${bar(cl.cur,cl.need,'var(--k9)',`${cl.cur}/${cl.need}`)}
          <span class="k">HP</span>${bar(p.hp,100,p.hp<30?'var(--k2)':'var(--k6)',`${p.hp}/100`)}
          ${c.energy?`<span class="k">БОД</span>${bar(c.energy,5,'var(--k4)',`${c.energy}/5`)}`:''}
          ${c.mood?`<span class="k">НАС</span>${bar(c.mood,5,'var(--kb)',`${c.mood}/5`)}`:''}
        </div>
      </div>
    </div>
  </section>

  <section class="frame panel sysq">
    <div class="panel-title">${icon('scroll',2)} Задание дня от Системы</div>
    <div class="sysmsg"><span class="br">[</span> ${esc(dq.t)} <span class="br">]</span></div>
    <div class="row mt"><span class="small muted grow">${icon(dq.a,2)} ${ATTR[dq.a].name} · +${dailyReward(p).xp} XP · +${dailyReward(p).gold} ${icon('coin',2)}</span>
      ${dq.done?`<button class="btn small gray" data-a="dailyundo">Выполнено ✓</button>`:`<button class="btn small green" data-a="dailydone">Выполнил</button>`}
    </div>
  </section>

  <section class="frame panel">
    <div class="panel-title">${icon('smile',2)} Состояние на сегодня</div>
    <div class="checkin">
      <span class="small">Настроение</span><div class="scale">${[1,2,3,4,5].map(n=>`<button class="${c.mood===n?'on':''}" data-a="mood" data-n="${n}" aria-label="${n}">${moodIcon(n)}</button>`).join('')}</div>
      <span class="small">Бодрость</span><div class="scale">${[1,2,3,4,5].map(n=>`<button class="${c.energy===n?'on':''}" data-a="energy" data-n="${n}" aria-label="${n}">${energyIcon(n)}</button>`).join('')}</div>
    </div>
  </section>

  <section class="frame panel">
    <div class="panel-title">${icon('hero',2)} Характеристики</div>
    <div class="attrs">${ATTRS.map(a=>{ const l=attrLevel(p,a.id); return `
      <div class="attr" data-a="attrinfo" data-id="${a.id}">${icon(a.id,3)}<div class="meta">
        <div class="row"><span class="nm">${a.name}</span><span class="lv">${l.level}</span></div>
        ${bar(l.cur,l.need,a.color,undefined,'thin')}<div class="sph">${a.sphere}</div></div></div>`;}).join('')}
    </div>
  </section>

  <section class="frame panel">
    <div class="panel-title">${icon('bolt',2)} Эффекты</div>
    ${ef.length?`<div class="effects">${ef.map(e=>`<div class="effect ${e.bad?'bad':''}" title="${esc(e.desc)}"><b>${e.bad?'▼':'▲'}</b>${esc(e.name)}</div>`).join('')}</div>
    <div class="tiny muted mt">${ef.map(e=>`<div>• <b>${esc(e.name)}</b>: ${esc(e.desc)}</div>`).join('')}</div>`:'<div class="muted small">Активных эффектов нет. Отметь состояние и держи серию, чтобы получить баффы.</div>'}
    <div class="tiny muted mt">Шанс критического успеха: ${Math.round(critChance(p)*100)}% · Множитель опыта: ×${xpMult(p).toFixed(2)}</div>
  </section>

  <section class="frame panel">
    <div class="panel-title">${icon('scroll',2)} Журнал системы</div>
    <div class="log">${p.log.slice(0,60).map(l=>`<div class="${l.cls}"><span class="d">${new Date(l.t).toLocaleString('ru-RU',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}</span>${esc(l.msg)}</div>`).join('')}</div>
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
  const t=today(); const todays=p.habits.filter(h=>isScheduled(h,t)); const other=p.habits.filter(h=>!isScheduled(h,t));
  const doneN=todays.filter(h=>h.done[t]).length;
  return `
  <section class="frame panel">
    <div class="panel-title">${icon('check',2)} Привычки на сегодня <span class="grow"></span><button class="btn small green" data-a="addhabit">+ Добавить</button></div>
    ${todays.length?`${bar(doneN,todays.length,'var(--k6)',`${doneN} / ${todays.length}`,'big')}`:''}
    ${todays.map(h=>habitRow(p,h,t)).join('') || '<div class="empty">Нет привычек на сегодня. Добавь первую — Система ждёт.</div>'}
    ${other.length?`<div class="panel-title mt" style="color:var(--muted)">Не сегодня</div>${other.map(h=>habitRow(p,h,t,true)).join('')}`:''}
  </section>
  <section class="frame panel" style="--c:var(--k2)">
    <div class="panel-title" style="color:var(--k3)">${icon('skull',2)} Дебаффы — вредные привычки <span class="grow"></span><button class="btn small red" data-a="addbad">+</button></div>
    <div class="tiny muted">Каждый чистый день приближает награду за Волю. Срыв — минус HP и серия с нуля. Честность важнее цифр.</div>
    ${p.bad.map(b=>{ const d=cleanDays(b); const next=CLEAN_MILESTONES.find(m=>m>d)||d;
      return `<div class="item"><div class="body"><div class="t">${esc(b.title)}</div>
        <div class="sub"><span>${icon('wil',2)} Чисто: <b style="color:var(--k5)">${d} ${plural(d,'день','дня','дней')}</b></span><span>Следующая награда: ${next} дн.</span>${b.slips.length?`<span>Срывов: ${b.slips.length}</span>`:''}</div>
        ${bar(d,next,'var(--k9)',undefined,'thin')}</div>
        <button class="btn small red" data-a="slip" data-id="${b.id}">Сорвался</button>
        <button class="more" data-a="badmenu" data-id="${b.id}">⋮</button></div>`; }).join('') || '<div class="empty">Нет отслеживаемых дебаффов.</div>'}
  </section>`;
}
function habitRow(p,h,t,off=false){
  const done=!!h.done[t], st=habitStreak(h), d=DIFF[h.diff];
  return `<div class="item ${done?'done':''}" ${off?'style="opacity:.6"':''}>
    ${off?`<div class="check" style="opacity:.4">${icon(h.attr,2)}</div>`:`<button class="check ${done?'on':''}" data-a="toggle" data-id="${h.id}" aria-label="Отметить">${done?icon('check',3):icon(h.attr,2)}</button>`}
    <div class="body"><div class="t">${esc(h.title)}</div>
      <div class="sub"><span>${ATTR[h.attr].name}</span><span>${d.name}</span><span>+${d.xp} XP</span>${st?`<span style="color:var(--k3)">${icon('flame',2)} ${st}</span>`:''}${h.days.length<7?`<span>${h.days.slice().sort((a,b)=>((a+6)%7)-((b+6)%7)).map(x=>WEEKDAYS[x]).join(' ')}</span>`:''}</div></div>
    <button class="more" data-a="habitmenu" data-id="${h.id}" aria-label="Меню">⋮</button></div>`;
}

// ----- Квесты -----
function viewQuests(p){
  const list=p.quests.filter(q=>QTAB==='active'?q.status==='active':q.status!=='active');
  const ord='SABCDE';
  list.sort((a,b)=> QTAB==='active' ? ((a.deadline||'9999')>(b.deadline||'9999')?1:-1) || ord.indexOf(a.rank)-ord.indexOf(b.rank) : (b.doneAt||'').localeCompare(a.doneAt||''));
  return `
  <div class="tabs2"><button class="${QTAB==='active'?'on':''}" data-a="qtab" data-v="active">Активные (${p.quests.filter(q=>q.status==='active').length})</button><button class="${QTAB!=='active'?'on':''}" data-a="qtab" data-v="done">Архив</button></div>
  <section class="frame panel">
    <div class="panel-title">${icon('sword',2)} Квесты — твои цели <span class="grow"></span>${QTAB==='active'?`<button class="btn small green" data-a="addquest">+ Квест</button>`:''}</div>
    ${list.map(q=>questRow(p,q)).join('') || `<div class="empty">${QTAB==='active'?'Нет активных квестов. Поставь цель, разбей на шаги и получи награду по рангу.':'Здесь будут завершённые квесты.'}</div>`}
  </section>
  <section class="frame panel"><div class="panel-title">${icon('star',2)} Ранги квестов</div>
    <div class="small">${Object.entries(RANKS).map(([k,r])=>`<div class="row" style="margin:6px 0"><span class="rank ${k}">${k}</span><span class="grow">${r.name.split('— ')[1]}</span><span class="muted">+${r.xp} XP · +${r.gold}</span></div>`).join('')}</div>
  </section>`;
}
function questRow(p,q){
  const r=RANKS[q.rank]; const steps=q.steps||[]; const sd=steps.filter(s=>s.done).length;
  let dl=''; if(q.deadline && q.status==='active'){ const left=daysBetween(today(),q.deadline); dl=`<span style="color:${left<0?'var(--k2)':left<=2?'var(--k3)':'inherit'}">${left<0?'просрочен':left===0?'сегодня':'осталось '+left+' дн.'}</span>`; }
  return `<div class="item ${q.status==='done'?'done':''}" style="align-items:flex-start">
    <span class="rank ${q.rank}">${q.rank}</span>
    <div class="body"><div class="t">${esc(q.title)}</div>
      ${q.desc?`<div class="small muted">${esc(q.desc)}</div>`:''}
      <div class="sub"><span>${icon(q.attr,2)} ${ATTR[q.attr].name}</span><span>+${r.xp} XP</span><span>${icon('coin',2)} ${r.gold}</span>${dl}${q.status==='failed'?'<span style="color:var(--k2)">провален</span>':''}${q.doneAt?`<span>${q.doneAt.split('-').reverse().join('.')}</span>`:''}</div>
      ${steps.length?`${bar(sd,steps.length,'var(--k9)',`${sd}/${steps.length}`,'thin')}<ul class="steps">${steps.map((s,i)=>`<li class="${s.done?'ok':''}" ${q.status==='active'?`data-a="step" data-id="${q.id}" data-i="${i}"`:''}><span class="box"></span>${esc(s.t)}</li>`).join('')}</ul>`:''}
      ${q.status==='active'?`<div style="margin-top:8px"><button class="btn small green" data-a="qdone" data-id="${q.id}">Завершить</button></div>`:''}
    </div>
    <button class="more" data-a="questmenu" data-id="${q.id}">⋮</button></div>`;
}

// ----- Ачивки -----
function viewAch(p){
  const got=ACHS.filter(a=>p.ach[a.id]).length;
  return `<section class="frame panel">
    <div class="panel-title">${icon('trophy',2)} Достижения <span class="grow"></span><span style="color:var(--kc)">${got}/${ACHS.length}</span></div>
    ${bar(got,ACHS.length,'var(--k4)',undefined,'')}
    <div class="achgrid mt">${ACHS.map(a=>`<button class="ach ${p.ach[a.id]?'got':'locked'}" data-a="achinfo" data-id="${a.id}">${p.ach[a.id]?icon(a.icon,4):icon('lock',4)}<div class="nm">${esc(a.name)}</div></button>`).join('')}</div>
  </section>`;
}

// ----- Лавка -----
function viewShop(p){
  return `<section class="frame panel">
    <div class="panel-title">${icon('bag',2)} Лавка наград <span class="grow"></span><button class="btn small green" data-a="addreward">+</button></div>
    <div class="tiny muted" style="margin-bottom:12px">Придумай, чем себя награждать. Золото зарабатывается привычками и квестами.</div>
    <div class="shopgrid">${p.rewards.map(r=>`<div class="ware">
      <button class="more x" data-a="rewardmenu" data-id="${r.id}">⋮</button>
      ${icon('gift',4)}<div class="t">${esc(r.title)}</div>
      <div class="price">${icon('coin',2)} ${r.cost}</div>
      <button class="btn small ${p.gold>=r.cost?'gold':'gray'} block" data-a="buy" data-id="${r.id}" ${p.gold>=r.cost?'':'disabled'}>Купить</button></div>`).join('') || '<div class="empty">Лавка пуста</div>'}</div>
  </section>
  <section class="frame panel"><div class="panel-title">${icon('scroll',2)} Покупки</div>
    ${p.purchases.slice(0,30).map(x=>`<div class="row small" style="padding:4px 0;border-bottom:2px dashed var(--kf)"><span class="grow">${esc(x.title)}</span><span class="muted">${x.at.split('-').reverse().join('.')}</span><span style="color:var(--k4)">−${x.cost}</span></div>`).join('') || '<div class="empty">Пока ничего не куплено</div>'}
  </section>`;
}

// ---------- Формы ----------
function heroForm(edit){
  const p=edit?P():null;
  const av = p? {...p.avatar} : {skin:0,hair:0,outfit:0,hairStyle:0};
  const sw=(arr,k)=>`<div class="opts" data-group="${k}">${arr.map((c,i)=>`<button type="button" class="opt swatch ${av[k]===i?'on':''}" data-v="${i}" style="background:${c[0]}"></button>`).join('')}</div>`;
  modal(`<h2>${edit?'Изменить героя':'Создание персонажа'}</h2>
    <div class="hero" style="justify-content:center"><div id="avprev" class="avatar-box">${avatarImg(av,6)}</div></div>
    <label class="f">Имя героя</label><input class="inp" id="hname" maxlength="24" value="${esc(p?.name||'')}" placeholder="Например: Фил">
    <label class="f">Кожа</label>${sw(SKINS,'skin')}
    <label class="f">Волосы</label>${sw(HAIRS,'hair')}
    <label class="f">Причёска</label>${optGroup('hairStyle',[{v:0,label:'Классика'},{v:1,label:'Длинные'},{v:2,label:'Ёжик'},{v:3,label:'Коротко'}],av.hairStyle||0)}
    <label class="f">Одежда</label>${sw(OUTFITS,'outfit')}
    ${edit?'':`<label class="f" style="display:flex;gap:8px;align-items:center;color:var(--kc)"><input type="checkbox" id="presets" checked style="width:20px;height:20px"> Добавить стартовый набор привычек</label>`}
    <div class="actions"><button class="btn gray" data-x="no">Отмена</button><button class="btn green" data-x="ok">${edit?'Сохранить':'В игру!'}</button></div>`, bg=>{
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
  modal(`<h2>${isNew?'Новая привычка':'Изменить привычку'}</h2>
    <label class="f">Что делаем?</label><input class="inp" id="ht" maxlength="60" value="${esc(h.title)}" placeholder="Например: 20 отжиманий">
    <label class="f">Сфера / характеристика</label>${optGroup('attr',attrOpts(),h.attr)}
    <label class="f">Сложность</label>${optGroup('diff',Object.entries(DIFF).map(([k,d])=>({v:k,label:`${d.name} (+${d.xp} XP)`})),h.diff)}
    <label class="f">Дни недели</label>${`<div class="opts" data-group="days">${[1,2,3,4,5,6,0].map(d=>`<button type="button" class="opt ${h.days.includes(d)?'on':''}" data-v="${d}">${WEEKDAYS[d]}</button>`).join('')}</div>`}
    <div class="actions"><button class="btn gray" data-x="no">Отмена</button><button class="btn green" data-x="ok">Сохранить</button></div>`, bg=>{
      bindOpts(bg,{days:true});
      bg.querySelector('[data-x=no]').onclick=closeModal;
      bg.querySelector('[data-x=ok]').onclick=()=>{
        const p=P(); const title=bg.querySelector('#ht').value.trim(); const days=getOpts(bg,'days').map(Number);
        if(!title){ bg.querySelector('#ht').focus(); return; } if(!days.length){ toast('[Выбери хотя бы один день]','bad'); return; }
        const data={title,attr:getOpt(bg,'attr'),diff:+getOpt(bg,'diff'),days};
        if(isNew){ p.habits.push({id:uid(),...data,done:{},created:today()}); addLog(p,`Новая привычка: «${title}»`,'c'); }
        else Object.assign(h,data);
        save(); closeModal(); render();
      };
    });
}

function questForm(q){
  const isNew=!q; q=q||{title:'',desc:'',attr:'wea',rank:'C',deadline:'',steps:[]};
  modal(`<h2>${isNew?'Новый квест':'Изменить квест'}</h2>
    <label class="f">Цель</label><input class="inp" id="qt" maxlength="80" value="${esc(q.title)}" placeholder="Например: Пробежать 10 км">
    <label class="f">Описание (необязательно)</label><textarea class="inp" id="qd" maxlength="400" placeholder="Зачем это мне и как пойму, что сделал">${esc(q.desc)}</textarea>
    <label class="f">Сфера</label>${optGroup('attr',attrOpts(),q.attr)}
    <label class="f">Ранг (масштаб цели)</label>${optGroup('rank',Object.keys(RANKS).map(k=>({v:k,label:k})),q.rank)}
    <div class="tiny muted" id="rankinfo"></div>
    <label class="f">Срок (необязательно)</label><input class="inp" type="date" id="qdl" value="${esc(q.deadline||'')}">
    <label class="f">Шаги — по одному на строку (каждый шаг +5 XP)</label><textarea class="inp" id="qs" placeholder="Купить кроссовки&#10;Пробежать 3 км&#10;Пробежать 5 км">${esc((q.steps||[]).map(s=>s.t).join('\n'))}</textarea>
    <div class="actions"><button class="btn gray" data-x="no">Отмена</button><button class="btn green" data-x="ok">${isNew?'Принять квест':'Сохранить'}</button></div>`, bg=>{
      bindOpts(bg);
      const upd=()=>{ const r=RANKS[getOpt(bg,'rank')]; bg.querySelector('#rankinfo').textContent=`${r.name}: +${r.xp} опыта, +${r.gold} золота`; };
      bg.querySelector('[data-group=rank]').addEventListener('change',upd); upd();
      bg.querySelector('[data-x=no]').onclick=closeModal;
      bg.querySelector('[data-x=ok]').onclick=()=>{
        const p=P(); const title=bg.querySelector('#qt').value.trim(); if(!title){ bg.querySelector('#qt').focus(); return; }
        const lines=bg.querySelector('#qs').value.split('\n').map(s=>s.trim()).filter(Boolean);
        const old=q.steps||[];
        const steps=lines.map(t=>{ const o=old.find(s=>s.t===t); return o?o:{t,done:false}; });
        const data={title,desc:bg.querySelector('#qd').value.trim(),attr:getOpt(bg,'attr'),rank:getOpt(bg,'rank'),deadline:bg.querySelector('#qdl').value,steps};
        if(isNew){ p.quests.push({id:uid(),...data,status:'active',created:today()}); addLog(p,`Квест принят: «${title}» [${data.rank}]`,'c'); toast(`<span class="br">[</span>Квест принят: ${esc(title)}<span class="br">]</span>`); sfx('attr'); }
        else Object.assign(q,data);
        QTAB='active'; save(); closeModal(); render();
      };
    });
}

function rewardForm(r){
  const isNew=!r; r=r||{title:'',cost:100};
  modal(`<h2>${isNew?'Новая награда':'Изменить награду'}</h2>
    <label class="f">Награда</label><input class="inp" id="rt" maxlength="50" value="${esc(r.title)}" placeholder="Например: Пицца в пятницу">
    <label class="f">Цена в золоте</label><input class="inp" id="rc" type="number" min="1" max="100000" value="${r.cost}">
    <div class="tiny muted mt">Ориентир: привычка «Средне» даёт 5 золота, квест ранга C — 40.</div>
    <div class="actions"><button class="btn gray" data-x="no">Отмена</button><button class="btn green" data-x="ok">Сохранить</button></div>`, bg=>{
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
  modal(`<h2>${isNew?'Новый дебафф':'Изменить'}</h2>
    <label class="f">От какой привычки избавляемся?</label><input class="inp" id="bt" maxlength="50" value="${esc(b?.title||'')}" placeholder="Например: Курение">
    ${isNew?`<label class="f">Сколько дней уже без неё?</label><input class="inp" id="bd" type="number" min="0" value="0">`:''}
    <div class="actions"><button class="btn gray" data-x="no">Отмена</button><button class="btn green" data-x="ok">Сохранить</button></div>`, bg=>{
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

function menu(title, items){ // items: [{label,cls,fn}]
  modal(`<h2>${esc(title)}</h2>${items.map((it,i)=>`<button class="btn block ${it.cls||'gray'}" data-i="${i}" style="margin:10px 4px">${it.label}</button>`).join('')}`, bg=>{
    bg.querySelectorAll('[data-i]').forEach(b=>b.onclick=()=>{ closeModal(); items[+b.dataset.i].fn(); });
  });
}

function settingsModal(){
  modal(`<h2>Настройки</h2>
    <button class="btn block ${DB.settings.sound?'green':'gray'}" data-x="sound">Звук: ${DB.settings.sound?'вкл':'выкл'}</button>
    <button class="btn block" data-x="edit">Изменить героя</button>
    <button class="btn block" data-x="profiles">Сменить героя / семья</button>
    <button class="btn block gray" data-x="export">Сохранить резервную копию</button>
    <button class="btn block gray" data-x="import">Загрузить из копии</button>
    <input type="file" id="impfile" accept="application/json,.json" hidden>
    <button class="btn block red" data-x="del">Удалить этого героя</button>
    <p class="tiny muted mt">Данные хранятся только на этом устройстве, в браузере. Чтобы не потерять прогресс, иногда сохраняй резервную копию.</p>`, bg=>{
      const on=(x,f)=>bg.querySelector(`[data-x=${x}]`).onclick=f;
      on('sound',()=>{ DB.settings.sound=!DB.settings.sound; save(); settingsModal(); });
      on('edit',()=>heroForm(true));
      on('profiles',()=>{ closeModal(); profilesModal(); });
      on('export',()=>{ const blob=new Blob([JSON.stringify(DB,null,1)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`levelup-backup-${today()}.json`; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),2000); });
      on('import',()=>bg.querySelector('#impfile').click());
      bg.querySelector('#impfile').onchange=async e=>{ const f=e.target.files[0]; if(!f) return;
        try{ const d=JSON.parse(await f.text()); if(!d.profiles) throw new Error('не тот файл');
          confirmBox(`Загрузить копию? Героев в файле: ${d.profiles.length}. Текущие данные на этом устройстве будут заменены.`,'Загрузить',()=>{ DB=d; DB.settings=DB.settings||{sound:true}; save(); render(); toast('[Копия загружена]'); });
        }catch(err){ toast('[Не удалось прочитать файл: '+esc(err.message)+']','bad'); } };
      on('del',()=>{ const p=P(); confirmBox(`Удалить героя <b>${esc(p.name)}</b> со всем прогрессом? Это нельзя отменить.`,'Удалить',()=>{ DB.profiles=DB.profiles.filter(x=>x.id!==p.id); DB.current=DB.profiles[0]?.id||null; save(); render(); }); });
    });
}
function profilesModal(){
  const sorted=[...DB.profiles].sort((a,b)=>b.xp-a.xp);
  modal(`<h2>Гильдия семьи</h2><div class="herolist">${sorted.map((p,i)=>`<div class="item" data-pick="${p.id}" style="cursor:pointer;${p.id===DB.current?'box-shadow:0 0 0 3px var(--k4)':''}"><span class="h" style="font-size:10px;color:var(--k4);width:20px">${i+1}</span>${avatarImg(p.avatar,2)}<div class="body"><div class="t">${esc(p.name)}</div><div class="sub"><span>Ур. ${charLevel(p).level} · ${titleOf(charLevel(p).level)}</span><span>${Object.keys(p.ach).length} ${icon('trophy',2)}</span></div></div></div>`).join('')}</div>
    <button class="btn green block mt" data-x="new">+ Новый герой</button>
    <p class="tiny muted">Каждый член семьи — отдельный герой со своим прогрессом.</p>`, bg=>{
      bg.querySelectorAll('[data-pick]').forEach(el=>el.onclick=()=>{ DB.current=el.dataset.pick; TAB='hero'; save(); closeModal(); render(); });
      bg.querySelector('[data-x=new]').onclick=()=>heroForm(false);
    });
}

// ---------- Действия ----------
const ACTIONS = {
  newhero:()=>heroForm(false),
  pick:(el)=>{ DB.current=el.dataset.id; TAB='hero'; save(); render(); },
  profiles:()=>profilesModal(),
  settings:()=>settingsModal(),
  qtab:(el)=>{ QTAB=el.dataset.v; render(); },

  toggle:(el,e)=>{
    const p=P(), h=p.habits.find(x=>x.id===el.dataset.id), t=today();
    if(h.done[t]){ ungrant(p,h.done[t]); p.stats.habitDone=Math.max(0,p.stats.habitDone-1); delete h.done[t]; sfx('undo'); }
    else {
      const d=DIFF[h.diff]; const st=habitStreak(h,addDays(t,-1)); const bonus=1+Math.min(st,30)*0.01;
      h.done[t]=grant(p,{xp:Math.round(d.xp*bonus),gold:d.gold,attr:h.attr,reason:h.title,crit:true,at:atFromEvent(e)});
      p.stats.habitDone++; heal(p,2);
      h.best=Math.max(h.best||0,habitStreak(h));
      const todays=p.habits.filter(x=>isScheduled(x,t));
      if(todays.length>=3 && todays.every(x=>x.done[t]) && p.perfectDay!==t){
        p.perfectDay=t; p.stats.perfectDays++;
        grant(p,{xp:30,gold:15,reason:'Идеальный день — все привычки выполнены',noMult:true}); heal(p,10);
      }
    }
    checkAchs(p); save(); render();
  },
  habitmenu:(el)=>{ const p=P(), h=p.habits.find(x=>x.id===el.dataset.id);
    menu(h.title,[{label:'Изменить',fn:()=>habitForm(h)},{label:`Рекорд серии: ${Math.max(h.best||0,habitStreak(h))}`,fn:()=>{}},
      {label:'Удалить',cls:'red',fn:()=>confirmBox(`Удалить привычку «${esc(h.title)}»? Полученный опыт сохранится.`,'Удалить',()=>{ p.habits=p.habits.filter(x=>x!==h); save(); render(); })}]); },
  addhabit:()=>habitForm(),

  addbad:()=>badForm(),
  slip:(el,e)=>{ const p=P(), b=p.bad.find(x=>x.id===el.dataset.id); const at=atFromEvent(e);
    confirmBox(`Срыв по «${esc(b.title)}»? Чистые дни (${cleanDays(b)}) обнулятся, −15 HP. Не страшно — главное, честно и дальше.`,'Да, было',()=>{
      b.slips.push(today()); b.since=today(); b.milestones=[]; hurt(p,15,`Срыв: ${b.title}`,at); save(); render(); }); },
  badmenu:(el)=>{ const p=P(), b=p.bad.find(x=>x.id===el.dataset.id);
    menu(b.title,[{label:'Переименовать',fn:()=>badForm(b)},{label:'Удалить',cls:'red',fn:()=>confirmBox('Удалить этот дебафф?','Удалить',()=>{ p.bad=p.bad.filter(x=>x!==b); save(); render(); })}]); },

  addquest:()=>questForm(),
  step:(el,e)=>{ const p=P(), q=p.quests.find(x=>x.id===el.dataset.id), s=q.steps[+el.dataset.i];
    if(s.done){ ungrant(p,s.g); s.done=false; s.g=null; sfx('undo'); }
    else { s.done=true; s.g=grant(p,{xp:5,gold:1,attr:q.attr,reason:'Шаг квеста',at:atFromEvent(e)}); }
    save(); render(); },
  qdone:(el,e)=>{ const p=P(), q=p.quests.find(x=>x.id===el.dataset.id); const at=atFromEvent(e);
    const left=(q.steps||[]).filter(s=>!s.done).length;
    confirmBox(`Завершить квест «${esc(q.title)}»?${left?` Невыполненных шагов: ${left}.`:''}`,'Завершить',()=>{
      const r=RANKS[q.rank]; q.status='done'; q.doneAt=today();
      q.g=grant(p,{xp:r.xp,gold:r.gold,attr:q.attr,reason:`Квест выполнен: ${q.title}`,crit:true,at});
      p.stats.questsDone++; if(q.rank==='S') p.stats.sDone++; heal(p,10);
      checkAchs(p); save(); render(); },false); },
  questmenu:(el)=>{ const p=P(), q=p.quests.find(x=>x.id===el.dataset.id);
    const items=[];
    if(q.status==='active'){
      items.push({label:'Изменить',fn:()=>questForm(q)});
      items.push({label:'Провалить / отказаться',cls:'red',fn:()=>confirmBox('Отметить квест как проваленный? Награды не будет, но и штрафа тоже.','Провалить',()=>{ q.status='failed'; q.doneAt=today(); addLog(p,`Квест провален: «${q.title}»`,'b'); save(); render(); })});
    } else if(q.status==='done'){
      items.push({label:'Вернуть в работу (отменить награду)',fn:()=>{ ungrant(p,q.g); q.g=null; q.status='active'; q.doneAt=null; p.stats.questsDone=Math.max(0,p.stats.questsDone-1); if(q.rank==='S') p.stats.sDone=Math.max(0,p.stats.sDone-1); save(); render(); }});
    } else items.push({label:'Вернуть в работу',fn:()=>{ q.status='active'; q.doneAt=null; save(); render(); }});
    items.push({label:'Удалить',cls:'red',fn:()=>confirmBox('Удалить квест навсегда?','Удалить',()=>{ p.quests=p.quests.filter(x=>x!==q); save(); render(); })});
    menu(q.title,items); },

  dailydone:(el,e)=>{ const p=P(), d=p.daily, r=dailyReward(p);
    d.done=true; d.grant=grant(p,{xp:r.xp,gold:r.gold,attr:d.a,reason:'Задание дня',crit:true,at:atFromEvent(e)}); p.stats.dailyDone++;
    checkAchs(p); save(); render(); },
  dailyundo:()=>{ const p=P(), d=p.daily; ungrant(p,d.grant); d.done=false; d.grant=null; p.stats.dailyDone=Math.max(0,p.stats.dailyDone-1); sfx('undo'); save(); render(); },

  mood:(el,e)=>checkin('mood',+el.dataset.n,e),
  energy:(el,e)=>checkin('energy',+el.dataset.n,e),
  attrinfo:(el)=>{ const p=P(), a=ATTR[el.dataset.id], l=attrLevel(p,a.id);
    const hs=p.habits.filter(h=>h.attr===a.id), qs=p.quests.filter(q=>q.attr===a.id&&q.status==='active');
    modal(`<h2>${icon(a.id,3)} ${a.name}</h2><p>Сфера жизни: <b>${a.sphere}</b></p>${bar(l.cur,l.need,a.color,`ур ${l.level} · ${l.cur}/${l.need}`,'big')}
      <p class="small muted">Всего опыта в этой сфере: ${p.attrs[a.id]||0}</p>
      <div class="panel-title mt">Привычки</div>${hs.map(h=>`<div class="small">• ${esc(h.title)}</div>`).join('')||'<div class="small muted">нет</div>'}
      <div class="panel-title mt">Активные квесты</div>${qs.map(q=>`<div class="small">• [${q.rank}] ${esc(q.title)}</div>`).join('')||'<div class="small muted">нет</div>'}
      <div class="actions"><button class="btn gray" onclick="closeModal()">Закрыть</button></div>`); },
  achinfo:(el)=>{ const p=P(), a=ACHS.find(x=>x.id===el.dataset.id), got=p.ach[a.id];
    modal(`<div class="center">${got?icon(a.icon,7):icon('lock',7)}<h2 class="mt">${esc(a.name)}</h2><p>${esc(a.desc)}</p>
      <p class="small muted">Награда: ${a.xp?`+${a.xp} XP `:''}${a.gold?`+${a.gold} золота`:''}</p>
      ${got?`<p style="color:var(--k5)">Получено ${got.split('-').reverse().join('.')}</p>`:'<p class="muted">Ещё не получено</p>'}</div>
      <div class="actions"><button class="btn gray" onclick="closeModal()">Закрыть</button></div>`); },

  addreward:()=>rewardForm(),
  rewardmenu:(el)=>{ const p=P(), r=p.rewards.find(x=>x.id===el.dataset.id);
    menu(r.title,[{label:'Изменить',fn:()=>rewardForm(r)},{label:'Удалить',cls:'red',fn:()=>{ p.rewards=p.rewards.filter(x=>x!==r); save(); render(); }}]); },
  buy:(el,e)=>{ const p=P(), r=p.rewards.find(x=>x.id===el.dataset.id); if(p.gold<r.cost) return;
    confirmBox(`Купить «${esc(r.title)}» за ${r.cost} золота?`,'Купить',()=>{
      p.gold-=r.cost; p.purchases.unshift({title:r.title,cost:r.cost,at:today()}); addLog(p,`Куплено: ${r.title} (−${r.cost} золота)`,'y');
      toast(`${icon('gift',2)} <span><span class="br">[</span>Награда получена: ${esc(r.title)}. Наслаждайся — заслужил!<span class="br">]</span></span>`,'gold'); sfx('coin');
      checkAchs(p); save(); render(); },false); },
};
function checkin(kind,n,e){
  const p=P(), t=today(); const c=p.checkins[t]=p.checkins[t]||{};
  const first=!c.mood && !c.energy; c[kind]=n;
  if(first){ grant(p,{xp:5,attr:'spi',reason:'Самонаблюдение',at:atFromEvent(e),noMult:true}); }
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
  const tabs=[['hero','hero','Герой'],['habits','check','Привычки'],['quests','sword','Квесты'],['ach','trophy','Ачивки'],['shop','bag','Лавка']];
  $('nav.bottom').innerHTML=`<div class="in">${tabs.map(([k,ic,l])=>`<button data-tab="${k}">${icon(ic,3)}<span>${l}</span></button>`).join('')}</div>`;
}

buildNav();
render();
if('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(()=>{});
