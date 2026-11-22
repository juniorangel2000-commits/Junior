import type {CharacterDirection} from '../character-directions';

export type CritterArea='coast'|'orchard'|'swamp'|'ruins'|'railway'|'openFields';
/** walk: anda e foge correndo; burrow: foge e some (caranguejo na areia); fly: anda e levanta voo;
 * air: voa em torno de onde nasceu (borboleta, morcego); perch: vira e pisca (coruja);
 * ball: vira uma bola quando o jogador chega (ouriço). */
export type CritterMode='walk'|'burrow'|'fly'|'air'|'perch'|'ball';
export type CritterWhen='day'|'night'|'dusk'|'always';
export type CritterSpawn='land'|'shore'|'water';
export interface CritterSpecies{
 readonly id:CritterId;readonly name:string;readonly area:CritterArea;readonly mode:CritterMode;readonly when:CritterWhen;
 readonly count:number;readonly spawn:CritterSpawn;
 /** Região (px) onde aparecem; sem ela, o mapa todo. */
 readonly near?:{readonly x:number;readonly y:number;readonly r:number};
 readonly speed:number;readonly flee:number;readonly wander:number;
}
/** A numeração das linhas acompanha a folha de sprites em public/assets/visual/nature. */
const ART_ROWS={crab:0,gull:1,turtle:2,squirrel:3,hedgehog:4,heron:5,bat:6,lizard:7,owl:8,pigeon:9,rat:10,butterfly:11,partridge:12,fox:13} as const;
export type CritterId=keyof typeof ART_ROWS;
export const CRITTER_ART='assets/visual/nature/critters.png';
export const CRITTER_TEXTURE='valley-critters';
export const CRITTER_CELL=64;
export const CRITTER_POSES=5;
export const CRITTER_VIEWS=['right','down','up'] as const;
export const CRITTER_ROW_WIDTH=CRITTER_POSES*CRITTER_VIEWS.length;
export const BUTTERFLY_VARIANTS=4;
type CritterDirection=Extract<CharacterDirection,'right'|'left'|'down'|'up'>;
const VIEW_COLUMNS:Record<CritterDirection,number>={right:0,left:0,down:1,up:2};

export function critterDirection(x:number,y:number):CritterDirection {
 if(Math.abs(x)>Math.abs(y))return x<0?'left':'right';
 return y<0?'up':'down';
}

export function critterFrame(id:CritterId,direction:CritterDirection,pose:number,variant=0):number {
 const row=id==='butterfly'&&variant>0?CRITTERS.length+variant-1:ART_ROWS[id];
 return row*CRITTER_ROW_WIDTH+VIEW_COLUMNS[direction]*CRITTER_POSES+pose;
}

const T=32;
export const CRITTERS:readonly CritterSpecies[]=[
 {id:'crab',name:'Caranguejo',area:'coast',mode:'burrow',when:'always',count:7,spawn:'shore',speed:46,flee:110,wander:90},
 {id:'gull',name:'Gaivota',area:'coast',mode:'fly',when:'day',count:4,spawn:'shore',speed:28,flee:150,wander:120},
 {id:'turtle',name:'Tartaruga marinha',area:'coast',mode:'walk',when:'night',count:1,spawn:'shore',speed:10,flee:70,wander:60},
 {id:'squirrel',name:'Esquilo',area:'orchard',mode:'walk',when:'day',count:4,spawn:'land',speed:70,flee:120,wander:160},
 {id:'hedgehog',name:'Ouriço',area:'orchard',mode:'ball',when:'always',count:2,spawn:'land',near:{x:41*T,y:47*T,r:520},speed:18,flee:90,wander:80},
 {id:'heron',name:'Garça',area:'swamp',mode:'fly',when:'day',count:3,spawn:'shore',speed:14,flee:170,wander:70},
 {id:'bat',name:'Morcego',area:'ruins',mode:'air',when:'dusk',count:5,spawn:'land',near:{x:20*T,y:24*T,r:560},speed:60,flee:0,wander:260},
 {id:'lizard',name:'Lagartixa',area:'ruins',mode:'walk',when:'day',count:4,spawn:'land',near:{x:14*T,y:20*T,r:620},speed:90,flee:100,wander:120},
 {id:'owl',name:'Coruja',area:'ruins',mode:'perch',when:'always',count:1,spawn:'land',near:{x:23*T,y:19*T+20,r:40},speed:0,flee:0,wander:0},
 {id:'pigeon',name:'Pombo',area:'railway',mode:'fly',when:'day',count:7,spawn:'land',near:{x:48*T,y:35*T,r:560},speed:24,flee:120,wander:110},
 {id:'rat',name:'Rato',area:'railway',mode:'walk',when:'always',count:2,spawn:'land',near:{x:40*T,y:41*T,r:700},speed:95,flee:110,wander:240},
 {id:'butterfly',name:'Borboleta',area:'openFields',mode:'air',when:'day',count:12,spawn:'land',speed:22,flee:0,wander:140},
 {id:'partridge',name:'Perdiz',area:'openFields',mode:'fly',when:'day',count:4,spawn:'land',speed:26,flee:110,wander:120},
 {id:'fox',name:'Raposa',area:'openFields',mode:'walk',when:'dusk',count:1,spawn:'land',speed:80,flee:200,wander:500},
];
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
