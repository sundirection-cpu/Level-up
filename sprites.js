// Pixel-art sprites. Each sprite is an array of strings; each char is a palette key ('.' = transparent).
// Palette: Sweetie 16.
const PAL = {
  '0':'#1a1c2c','1':'#5d275d','2':'#b13e53','3':'#ef7d57','4':'#ffcd75','5':'#a7f070','6':'#38b764','7':'#257179',
  '8':'#29366f','9':'#3b5dc9','a':'#41a6f6','b':'#73eff7','c':'#f4f4f4','d':'#94b0c2','e':'#566c86','f':'#333c57',
  'y':'#c98a2e','w':'#ffffff','n':'#8b5a3c','N':'#5e3a28'
};

const ICONS = {
  // Сила — гантель
  str:[
    "..........",
    ".dd....dd.",
    "dccd..dccd",
    "dccd..dccd",
    "dccdeedccd",
    "dccdeedccd",
    "dccd..dccd",
    "dccd..dccd",
    ".dd....dd.",
    "..........",
  ],
  // Выносливость / здоровье — сердце
  end:[
    "..........",
    ".22....22.",
    "2c322.2222",
    "2c3222222f",
    "2332222222",
    ".22222222.",
    "..222222..",
    "...2222...",
    "....22....",
    "..........",
  ],
  // Интеллект — книга
  int:[
    "..........",
    ".99999999.",
    ".9aaaaaa9c",
    ".9a4aa4a9c",
    ".9aaaaaa9c",
    ".9a4444a9c",
    ".9aaaaaa9c",
    ".99999999c",
    "..cccccccc",
    "..........",
  ],
  // Харизма — облачко речи
  cha:[
    "..........",
    "..cccccc..",
    ".cccccccc.",
    "cc0cc0cc0c",
    "cccccccccc",
    ".cccccccc.",
    "..ccccc...",
    "..cc......",
    ".c........",
    "..........",
  ],
  // Воля — щит
  wil:[
    "..........",
    ".dddddddd.",
    ".d999a99d.",
    ".d99aaa9d.",
    ".d9aaaaad.",
    ".d99aaa9d.",
    "..d99a9d..",
    "...d99d...",
    "....dd....",
    "..........",
  ],
  // Творчество — кисть
  cre:[
    "........11",
    ".......1b1",
    "......1b1.",
    ".....1b1..",
    "....nN1...",
    "...nnN....",
    "..33n.....",
    ".333......",
    ".33.......",
    "..........",
  ],
  // Достаток — мешок монет
  wea:[
    "..........",
    "...nnnn...",
    "....44....",
    "..nnnnnn..",
    ".nnn44nnn.",
    ".nn4nnnnn.",
    ".nnn44nnn.",
    ".nnnnn4nn.",
    "..nn44nn..",
    "..........",
  ],
  // Дух — луна и звезда
  spi:[
    "..........",
    "...bbb..4.",
    "..bb.....4",
    ".bb.......",
    ".bb.......",
    ".bb.....b.",
    ".bbb...bb.",
    "..bbbbbb..",
    "...bbbb...",
    "..........",
  ],
  coin:[
    "..4444..",
    ".4yyyy4.",
    "4yy44yy4",
    "4y4yyyy4",
    "4y4yyyy4",
    "4yy44yy4",
    ".4yyyy4.",
    "..4444..",
  ],
  heart:[
    ".22.22.",
    "2c22222",
    "2222222",
    ".22222.",
    "..222..",
    "...2...",
  ],
  xp:[
    "...4...",
    "...4...",
    "..444..",
    "4444444",
    ".44444.",
    ".4...4.",
    "4.....4",
  ],
  bolt:[
    "...44",
    "..44.",
    ".444.",
    "44444",
    ".444.",
    ".44..",
    "44...",
  ],
  smile:[
    ".4444.",
    "444444",
    "40440 4".replace(' ',''),
    "444444",
    "404404",
    ".4004.",
  ],
  flame:[
    "...3...",
    "..33...",
    "..333.3",
    ".33433.",
    "3344433",
    "3344433",
    ".34443.",
    "..333..",
  ],
  check:[
    "........",
    ".......c",
    "......cc",
    "c....cc.",
    "cc..cc..",
    ".cccc...",
    "..cc....",
    "........",
  ],
  cross:[
    "c.....c",
    "cc...cc",
    ".cc.cc.",
    "..ccc..",
    ".cc.cc.",
    "cc...cc",
    "c.....c",
  ],
  skull:[
    ".cccccc.",
    "cccccccc",
    "c00cc00c",
    "c00cc00c",
    "cccc0ccc",
    ".cccccc.",
    "..c0c0..",
  ],
  lock:[
    "..eee..",
    ".e...e.",
    ".e...e.",
    "ddddddd",
    "dd000dd",
    "ddd0ddd",
    "ddddddd",
  ],
  trophy:[
    "4444444444",
    "y44444444y",
    "y.444444.y",
    ".y444444y.",
    "..y4444y..",
    "....44....",
    "....yy....",
    "...4444...",
    "..yyyyyy..",
  ],
  scroll:[
    ".nnnnnnnn.",
    "n44444444n",
    ".4444444n.",
    ".4n0n04 4.".replace(' ',''),
    ".44444444.",
    ".4n0n0n44.",
    ".44444444.",
    ".4n0n0444.",
    "n44444444n",
    ".nnnnnnnn.",
  ],
  sword:[
    "........dc",
    ".......dcd",
    "......dcd.",
    ".....dcd..",
    "y...dcd...",
    ".y.dcd....",
    "..ycd.....",
    "..ny......",
    ".n..y.....",
    "n.........",
  ],
  bag:[
    "...nnnn...",
    "..n....n..",
    "..n....n..",
    ".2222222..",
    "2322222222".slice(0,10),
    "2222442222",
    "2222442222",
    "2222222222",
    ".22222222.",
  ],
  hero:[
    "..4444....",
    ".4cccc4...",
    ".4c00c4...",
    ".4cccc4...",
    "..4444....",
    ".999999...",
    "9.9999.9..",
    "..9..9....",
    "..9..9....",
  ],
  star:[
    "....4....",
    "....4....",
    "...444...",
    "444444444",
    ".4444444.",
    "..44444..",
    "..44.44..",
    ".44...44.",
    "4.......4",
  ],
  plus:[
    "..cc..",
    "..cc..",
    "cccccc",
    "cccccc",
    "..cc..",
    "..cc..",
  ],
  gear:[
    "...dd...",
    ".d.dd.d.",
    "..dddd..",
    "ddd..ddd",
    "ddd..ddd",
    "..dddd..",
    ".d.dd.d.",
    "...dd...",
  ],
  crown:[
    "4..4..4",
    "44.4.44",
    "4444444",
    "4242424",
    "yyyyyyy",
  ],
  gift:[
    "..2..2..",
    "...22...",
    "44422444",
    "44422444",
    ".442244.",
    ".442244.",
    ".442244.",
    ".442244.",
  ],
};

// ---------- Avatar ----------
const AV_BASE = [
  "....oooooooo....",
  "...ohhhhhhhho...",
  "..ohhhhhhhhhho..",
  "..ohhHhhhhHhho..",
  "..ohhsssssshho..",
  "..ohssssssssho..",
  "..ohsessssesho..",
  "..oSssssssssSo..",
  "...osssSSssso...",
  "....ooSSSSoo....",
  "...ottTttTtto...",
  "..otttttttttto..",
  ".otottttttttoto.",
  ".osotwwwwwwtoso.",
  "...otTttttTto...",
  "...oppppppppo...",
  "...opppoopppo...",
  "...oppo..oppo...",
  "..obbbo..obbbo..",
  "..ooooo..ooooo..",
];

const SKINS = [['#ffd8b8','#e8b48f'],['#f2c29b','#d29a6f'],['#c98f63','#a06a45'],['#8d5a3b','#6b4029']];
const HAIRS = [['#3a2a1e','#22170f'],['#7a4a26','#5a331a'],['#e8c060','#c09030'],['#b13e53','#7d2a3a'],['#94b0c2','#566c86'],['#1a1c2c','#333c57']];
const OUTFITS = [['#3b5dc9','#29366f'],['#38b764','#257179'],['#b13e53','#5d275d'],['#ef7d57','#b13e53'],['#5d275d','#333c57'],['#566c86','#333c57']];

function avatarRows(av){
  let rows = AV_BASE.map(r=>r.split(''));
  const style = av.hairStyle||0;
  if(style===1){ // long hair
    for(let y=4;y<=10;y++){ rows[y][2]='h'; rows[y][13]='h'; rows[y][1]='o'; rows[y][14]='o'; }
    rows[9][3]='h';rows[9][12]='h';rows[10][2]='h';rows[10][13]='h';
    rows[11][1]='o';rows[11][14]='o';
  } else if(style===2){ // spiky
    rows[0] = "..o..o.oo.o..o..".split('');
    rows[1] = "..ohohhhhhhoho..".split('');
  } else if(style===3){ // short / buzz
    rows[0] = "................".split('');
    rows[1] = "....oooooooo....".split('');
    rows[2] = "...ohhhhhhhho...".split('');
  }
  if(av.crown){
    rows.unshift("................".split(''),"................".split(''));
    rows[0] = "....4..44..4....".split('');
    rows[1] = "....44444444....".split('');
  } else {
    rows.unshift("................".split(''),"................".split(''));
  }
  return rows.map(r=>r.join(''));
}
function avatarPal(av){
  const s=SKINS[av.skin||0], h=HAIRS[av.hair||0], t=OUTFITS[av.outfit||0];
  return {o:'#1a1c2c',s:s[0],S:s[1],h:h[0],H:h[1],e:'#1a1c2c',t:t[0],T:t[1],w:'#ffcd75',p:'#333c57',b:'#5e3a28','4':'#ffcd75','y':'#c98a2e'};
}

const _spriteCache = new Map();
function spriteURL(rows, pal){
  const key = rows.join('|') + JSON.stringify(pal||'');
  if(_spriteCache.has(key)) return _spriteCache.get(key);
  const h = rows.length, w = Math.max(...rows.map(r=>r.length));
  const c = document.createElement('canvas'); c.width=w; c.height=h;
  const g = c.getContext('2d');
  rows.forEach((r,y)=>{ for(let x=0;x<r.length;x++){ const ch=r[x]; if(ch==='.'||ch===' ') continue;
    const col=(pal&&pal[ch])||PAL[ch]; if(!col) continue; g.fillStyle=col; g.fillRect(x,y,1,1);} });
  const url = c.toDataURL();
  const out = {url,w,h};
  _spriteCache.set(key,out); return out;
}
// returns <img> html
function icon(name, scale=3, extra=''){
  const rows = ICONS[name]; if(!rows) return '';
  const s = spriteURL(rows);
  return `<img class="px" src="${s.url}" width="${s.w*scale}" height="${s.h*scale}" alt="" ${extra}>`;
}
function avatarImg(av, scale=4){
  const s = spriteURL(avatarRows(av), avatarPal(av));
  return `<img class="px" src="${s.url}" width="${s.w*scale}" height="${s.h*scale}" alt="">`;
}
