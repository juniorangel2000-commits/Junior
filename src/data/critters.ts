/** Bichos dos cenários novos, com desenho provisório em pixel art feito no código.
 * Quando as artes definitivas chegarem, troque `art` pela folha de sprites; o comportamento fica. */
export type CritterArea='coast'|'orchard'|'swamp'|'ruins'|'railway'|'openFields';
/** walk: anda e foge correndo; burrow: foge e some (caranguejo na areia); fly: anda e levanta voo;
 * air: voa à toa (borboleta, morcego, vaga-lume); perch: parado, só vira (coruja, gato dormindo);
 * ball: vira uma bola quando o jogador chega (ouriço). */
export type CritterMode='walk'|'burrow'|'fly'|'air'|'perch'|'ball';
export type CritterWhen='day'|'night'|'dusk'|'always';
export type CritterSpawn='land'|'shore'|'water';
export interface CritterSpecies{
 readonly id:string;readonly name:string;readonly area:CritterArea;readonly mode:CritterMode;readonly when:CritterWhen;
 readonly count:number;readonly spawn:CritterSpawn;
 /** Região (px) onde aparecem; sem ela, o mapa todo. */
 readonly near?:{readonly x:number;readonly y:number;readonly r:number};
 readonly speed:number;readonly flee:number;readonly wander:number;
 /** Quadros: cada um é uma lista de linhas; letras = cores da paleta, '.' = vazio. 'l' = pernas
 * (no segundo quadro do andar elas se alternam sozinhas). */
 readonly art:readonly (readonly string[])[];readonly palette:Readonly<Record<string,string>>;
 /** Quadros extras: voo, bolinha, dormindo. */
 readonly special?:readonly (readonly string[])[];
 readonly scale?:number;
}
const T=32;
export const CRITTERS:readonly CritterSpecies[]=[
 {id:'crab',name:'Caranguejo',area:'coast',mode:'burrow',when:'always',count:7,spawn:'shore',speed:46,flee:110,wander:90,
  palette:{c:'#d0582c',d:'#a8401f',e:'#1b1410',l:'#b5482a'},
  art:[['..e......e..','..d......d..','dd.cccccc.dd','ddccccccccdd','.dccccccccd.','..cccccccc..','.l.l.l.l.l.l','l.l......l.l']]},
 {id:'gull',name:'Gaivota',area:'coast',mode:'fly',when:'day',count:4,spawn:'shore',speed:28,flee:150,wander:120,
  palette:{w:'#f2f0ea',g:'#b9bec4',k:'#2b2b2b',y:'#e8b830',l:'#d58a3a'},
  art:[['......ww..','.....wkwyy','.....ww...','.gggwww...','ggggwwww..','.gkgwwww..','..kgwww...','....l.l...']],
  special:[['k.........k','gg.......gg','.gg..w..gg.','..ggwwwgg..','....www....','.....w.....'],['....www....','..ggwwwgg..','.gg..w..gg.','gg.......gg','k.........k']]},
 {id:'turtle',name:'Tartaruga marinha',area:'coast',mode:'walk',when:'night',count:1,spawn:'shore',speed:10,flee:70,wander:60,
  palette:{s:'#5e4f28',S:'#8a7640',g:'#7c8f4a',k:'#1f1a10',l:'#6a7c3c'},
  art:[['....sSsSs.....','..lsSsSsSsl...','..sSsSsSsSsgg.','..sSsSsSsSsgkg','..lsSsSsSsl...','....sSsSs.....']],scale:2.6},
 {id:'squirrel',name:'Esquilo',area:'orchard',mode:'walk',when:'day',count:4,spawn:'land',speed:70,flee:120,wander:160,
  palette:{t:'#b8652f',r:'#a8552a',c:'#e8cfa0',e:'#1b1410',l:'#7a3a1a'},
  art:[['.tt........','tttt.......','ttttt...rr.','.tttt..rrer','..tttrrrrrr','...rrrrccr.','...rrrcc...','...l...l...']]},
 {id:'hedgehog',name:'Ouriço',area:'orchard',mode:'ball',when:'always',count:2,spawn:'land',near:{x:41*T,y:47*T,r:520},speed:18,flee:90,wander:80,
  palette:{s:'#6a4a2c',S:'#b09060',f:'#d8b890',n:'#2a1a10',l:'#4a3020'},
  art:[['..sSsSs....','.SsSsSsS...','sSsSsSsSff.','SsSsSsSsffn','.sSsSsSff..','..l..l.l...']],
  special:[['..sSsS..','.SsSsSs.','sSsSsSsS','SsSsSsSs','.sSsSsS.','..SsSs..']]},
 {id:'heron',name:'Garça',area:'swamp',mode:'fly',when:'day',count:3,spawn:'shore',speed:14,flee:170,wander:70,
  palette:{w:'#f4f2ec',g:'#c8ccd0',y:'#e0b030',k:'#2a2a26',l:'#3a3a32'},
  art:[['.......ww...','......wkwyyy','......ww....','......w.....','.....ww.....','..gwwwww....','.ggwwwww....','..gwwww.....','....l.l.....','....l.l.....','....l.l.....','...ll.ll....']],
  special:[['w...........w','gw.........wg','.gww..w..wwg.','...wwwwwww...','.....www.....','......k......'],['......k......','.....www.....','...wwwwwww...','.gww..w..wwg.','gw.........wg','w...........w']],scale:2.4},
 {id:'bat',name:'Morcego',area:'ruins',mode:'air',when:'dusk',count:5,spawn:'land',near:{x:20*T,y:24*T,r:560},speed:60,flee:0,wander:260,
  palette:{b:'#3a2a2a',B:'#5a4040',e:'#e0a040'},
  art:[['B.........B','BB..beb..BB','.BBbbbbbBB.','..BBbbbBB..','....bbb....'],['....beb....','...bbbbb...','.BBBbbbBBB.','BB..bbb..BB','B.........B']]},
 {id:'lizard',name:'Lagartixa',area:'ruins',mode:'walk',when:'day',count:4,spawn:'land',near:{x:14*T,y:20*T,r:620},speed:90,flee:100,wander:120,
  palette:{g:'#6f7a3e',G:'#a3a866',e:'#1b1410',l:'#55602e'},
  art:[['..........ggg.','.......gGgGgge','ggggggGgGgGgg.','.....l..l..l..']]},
 {id:'owl',name:'Coruja',area:'ruins',mode:'perch',when:'always',count:1,spawn:'land',near:{x:23*T,y:19*T+20,r:40},speed:0,flee:0,wander:0,
  palette:{o:'#8a6a44',O:'#6a4e30',c:'#e0cba0',y:'#e8c040',k:'#1b1410',b:'#c89a40'},
  art:[['.o......o.','.oo....oo.','.occccccO.','occykcykcO','oocccbcccO','.oOoooooO.','.oOoOoOoO.','..oOoOoO..','...b..b...'],['.o......o.','.oo....oo.','.occccccO.','occkkcckkO','oocccbcccO','.oOoooooO.','.oOoOoOoO.','..oOoOoO..','...b..b...']]},
 {id:'pigeon',name:'Pombo',area:'railway',mode:'fly',when:'day',count:7,spawn:'land',near:{x:48*T,y:35*T,r:560},speed:24,flee:120,wander:110,
  palette:{g:'#8a93a3',G:'#6f7888',n:'#5f8a7a',k:'#1b1410',y:'#3a3a3a',l:'#d08080'},
  art:[['......gg.','.....gkgy','.....nn..','.GGGgnn..','GGGGggg..','.GGgggg..','...l.l...']],
  special:[['G.......G','GG.....GG','.GGgggGG.','...ggg...','....g....'],['....g....','...ggg...','.GGgggGG.','GG.....GG','G.......G']]},
 {id:'rat',name:'Rato',area:'railway',mode:'walk',when:'always',count:2,spawn:'land',near:{x:40*T,y:41*T,r:700},speed:95,flee:110,wander:240,
  palette:{g:'#7a6a5a',p:'#d9a0a0',k:'#1b1410',l:'#5a4a3a'},
  art:[['.......pp..','..gggggggk.','pggggggggggp','..l.l..l.l..']]},
 {id:'butterfly',name:'Borboleta',area:'openFields',mode:'air',when:'day',count:12,spawn:'land',speed:22,flee:0,wander:140,
  palette:{W:'#e8c23a',k:'#2a1a10'},
  art:[['WW.k.WW','WWWkWWW','.WWkWW.','WW.k.WW'],['..WkW..','..WkW..','..WkW..','..WkW..']]},
 {id:'partridge',name:'Perdiz',area:'openFields',mode:'fly',when:'day',count:4,spawn:'land',speed:26,flee:110,wander:120,
  palette:{p:'#9a7044',d:'#5a4028',c:'#e0c890',k:'#1b1410',y:'#c89a40',l:'#c89a40'},
  art:[['.....pp.','....pkpy','.dpdppp.','pdpdpdpc','.pdpdpc.','..l..l..']],
  special:[['d......d','dp....pd','.dppppd.','...pp...'],['...pp...','.dppppd.','dp....pd','d......d']]},
 {id:'fox',name:'Raposa',area:'openFields',mode:'walk',when:'dusk',count:1,spawn:'land',speed:80,flee:200,wander:500,
  palette:{r:'#c06a34',w:'#e8dcc8',k:'#2a1a10',l:'#3a2418'},
  art:[['..............r.r.','..............rrr.','.............rrkrw','rrw..........rrrrk','.rrrrrrrrrrrrrrr..','..rrrrrrrrrrrww...','...l.l.....l.l....']],scale:2.4},
];
/** Cores das borboletas: cada uma sorteia a sua. */
export const BUTTERFLY_COLORS=['#e8c23a','#e0822c','#4a7ad8','#f0efe4'] as const;
export const crittersOf=(area:string)=>CRITTERS.filter(c=>c.area===area);

/** Hora do dia em que a espécie aparece (minutos do relógio do jogo). */
export function critterActive(when:CritterWhen,time:number):boolean{
 const h=time/60;
 if(when==='day')return h>=6&&h<19;
 if(when==='night')return h>=20||h<5;
 if(when==='dusk')return h>=17.5&&h<22||h<4;
 return true;
}
export interface CritterTerrain{width:number;height:number;land:(x:number,y:number)=>boolean;water:(x:number,y:number)=>boolean}
/** Gerador determinístico, para os bichos aparecerem nos mesmos lugares a cada visita. */
export function critterRandom(seed:number){let s=seed>>>0||1;return()=>((s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296);}
const nearWater=(t:CritterTerrain,x:number,y:number)=>[0,1,2,3,4,5,6,7].some(i=>{const a=i*Math.PI/4;return[50,90].some(r=>t.water(x+Math.cos(a)*r,y+Math.sin(a)*r));});
/** Um ponto válido para a espécie (ou undefined se o mapa não tiver lugar). */
export function critterSpot(sp:CritterSpecies,t:CritterTerrain,random:()=>number,avoid?:{x:number;y:number;r:number}):{x:number;y:number}|undefined{
 for(let i=0;i<600;i++){
  const x=sp.near?sp.near.x+(random()*2-1)*sp.near.r:40+random()*(t.width-80),y=sp.near?sp.near.y+(random()*2-1)*sp.near.r:40+random()*(t.height-80);
  if(x<40||y<40||x>t.width-40||y>t.height-40)continue;
  if(avoid&&Math.hypot(x-avoid.x,y-avoid.y)<avoid.r)continue;
  if(sp.spawn==='water'){if(t.water(x,y))return{x,y};continue;}
  if(!t.land(x,y))continue;
  if(sp.spawn==='shore'&&!nearWater(t,x,y))continue;
  return{x,y};
 }
}
/** Converte um quadro em pixels: [x, y, cor] já com contorno escuro e luz de cima. */
export function critterPixels(rows:readonly string[],palette:Readonly<Record<string,string>>):{width:number;height:number;pixels:[number,number,string][]}{
 const width=Math.max(...rows.map(r=>r.length))+2,height=rows.length+2;
 const at=(x:number,y:number)=>{const ch=rows[y-1]?.[x-1];return ch&&ch!=='.'&&palette[ch]?ch:undefined;};
 const shade=(hex:string,k:number)=>{const n=parseInt(hex.slice(1),16),f=(v:number)=>Math.max(0,Math.min(255,Math.round(v*k)));return'#'+[f(n>>16),f(n>>8&255),f(n&255)].map(v=>v.toString(16).padStart(2,'0')).join('');};
 const pixels:[number,number,string][]=[];
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const ch=at(x,y);
  if(ch){const base=palette[ch];pixels.push([x,y,!at(x,y-1)?shade(base,1.16):!at(x,y+1)?shade(base,.8):base]);}
  else if(at(x-1,y)||at(x+1,y)||at(x,y-1)||at(x,y+1))pixels.push([x,y,'#2a1a10']);
 }
 return{width,height,pixels};
}
/** Segundo quadro do andar: cada perna ('l') dá um passo de 1 pixel, alternando o lado. */
export function critterStep(rows:readonly string[]):string[]{
 return rows.map(r=>{
  if(!r.includes('l'))return r;
  const out=[...r].map(c=>c==='l'?'.':c);
  [...r].forEach((c,i)=>{if(c!=='l')return;const j=i+(i%2?-1:1);out[j>=0&&j<r.length&&out[j]==='.'?j:i]='l';});
  return out.join('');
 });
}
