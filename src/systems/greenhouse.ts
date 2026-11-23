import type {CropData,SaveData,TilePoint} from '../types';
import {Farming,type ActionResult} from './farming';
import type {Inventory} from './inventory';
import {CROPS,cropDefinition,type CropId} from '../data/crops';
import {projectDone} from './projects';
import {SHOP_FACADES,facadeBlockedPoint} from '../data/shop-facades';

/** Estufa (obra do Tobias, preview.48): canteiros que plantam qualquer semente em qualquer estação.
 * Não murcha na virada nem recebe chuva: só cresce nos dias regados. Fica num ponto livre da
 * propriedade, escolhido quando a obra termina (`x`, `y` = bloco da porta). */
export interface GreenhouseState{x:number;y:number;crops:CropData[]}
export const greenhouseLevel=(s:Pick<SaveData,'projects'|'day'>)=>projectDone(s,'greenhouse-2')?2:projectDone(s,'greenhouse')?1:0;
/** Interior em blocos: 12 × 9 com 24 canteiros; ampliada, 16 × 11 com 48. Porta no meio da parede sul. */
export const greenhouseRoom=(level:number)=>level>=2?{width:16,height:11}:{width:12,height:9};
export function greenhousePlots(level:number):TilePoint[]{
 const rows=level>=2?[2,4,6,8]:[2,4,6],cols=level>=2?12:8,x0=2;
 return rows.flatMap(y=>Array.from({length:cols},(_,i)=>({x:x0+i,y})));
}
export const greenhouseDoor=(level:number)=>{const r=greenhouseRoom(level);return{x:Math.floor(r.width/2),y:r.height-1};};
/** Barril d'água ao lado da porta: enche o regador. */
export const greenhouseBarrel=(level:number)=>{const r=greenhouseRoom(level);return{x:r.width-2,y:r.height-2};};

/** Horta da estufa: mesmo código da horta, sem estação, sem chuva e só nos canteiros fixos. */
export class GreenhouseFarm extends Farming{
 private readonly plots:Set<string>;
 constructor(crops:CropData[],private readonly level:number){super(crops,[],undefined,[]);this.plots=new Set(greenhousePlots(level).map(p=>`${p.x},${p.y}`));}
 override isPrepared(x:number,y:number):boolean{return this.plots.has(`${x},${y}`);}
 override get soilTiles():TilePoint[]{return greenhousePlots(this.level);}
 override plant(x:number,y:number,inventory:Inventory,day=1,id:CropId='turnip'):ActionResult{
  const def=CROPS[id];if(!def)return{ok:false,message:'Esta semente não é conhecida.'};
  if(!this.isPrepared(x,y))return{ok:false,message:'Plante nos canteiros da estufa.'};
  if(this.cropAt(x,y))return{ok:false,message:'Já existe uma plantinha aqui.'};
  if(!inventory.spend({[def.seed]:1}))return{ok:false,message:`Faltam sementes de ${def.name.toLowerCase()}.`};
  this.crops.push({x,y,growth:0,watered:false,crop:id,days:0,day,care:{missed:0}});
  return{ok:true,message:`${def.name} plantado na estufa: cresce em qualquer estação. Regue todos os dias (${def.days} dias regados).`};
 }
 /** Avança os dias: só conta o dia regado; nada murcha e a chuva não entra. */
 override update(_seconds:number,day?:number):string[]{
  if(day===undefined||!Number.isSafeInteger(day)||day<1)return[];
  for(const c of this.crops){
   if(c.day===undefined){c.day=day;continue;}
   const def=cropDefinition(c.crop);
   while(c.day<day){if(c.watered)c.days=Math.min(def.days,(c.days??0)+1);else if(c.care&&(c.days??0)<def.days)c.care.missed=Math.min(999,c.care.missed+1);c.watered=false;c.day++;}
   c.growth=Math.min(1,(c.days??0)/def.days);
  }
  return[];
 }
}
/** Ponto da porta para uma estufa nova: o primeiro retângulo livre perto da casa. `free(x,y)` diz
 * se o bloco da propriedade pode receber a construção. */
export function findGreenhouseSpot(free:(x:number,y:number)=>boolean,footprint:{left:number;top:number;width:number;height:number}):TilePoint|undefined{
 const candidates:TilePoint[]=[];
 for(let y=12;y<66;y++)for(let x=6;x<90;x++)candidates.push({x,y});
 // Mais perto da casa (24, 16) primeiro.
 candidates.sort((a,b)=>Math.hypot(a.x-30,a.y-22)-Math.hypot(b.x-30,b.y-22));
 for(const c of candidates){
  let ok=true;
  for(let dy=footprint.top;dy<footprint.top+footprint.height&&ok;dy++)for(let dx=footprint.left;dx<footprint.left+footprint.width&&ok;dx++)if(!free(c.x+dx,c.y+dy))ok=false;
  // Um corredor livre de 3 blocos na frente da porta.
  if(ok&&[1,2,3].every(d=>[-1,0,1].every(dx=>free(c.x+dx,c.y+d))))return c;
 }
}
export function validGreenhouse(v:unknown,s:Pick<SaveData,'projects'|'day'>):boolean{
 if(v===undefined)return true;
 if(!v||typeof v!=='object'||Array.isArray(v))return false;const g=v as GreenhouseState,level=greenhouseLevel(s);
 if(level<1||!Number.isInteger(g.x)||!Number.isInteger(g.y)||g.x<1||g.y<1||g.x>94||g.y>70||!Array.isArray(g.crops))return false;
 const plots=new Set(greenhousePlots(level).map(p=>`${p.x},${p.y}`)),seen=new Set<string>();
 return g.crops.length<=plots.size&&g.crops.every(c=>{
  if(!c||typeof c!=='object')return false;const k=`${c.x},${c.y}`;if(!plots.has(k)||seen.has(k))return false;seen.add(k);
  return typeof c.crop==='string'&&c.crop in CROPS&&Number.isInteger(c.days)&&(c.days as number)>=0&&(c.days as number)<=CROPS[c.crop as CropId].days&&Number.isInteger(c.day)&&(c.day as number)>=1&&(c.day as number)<=s.day&&typeof c.watered==='boolean'&&typeof c.growth==='number'&&c.growth>=0&&c.growth<=1;
 });
}

/** Por fora, a estufa usa a fachada da estufa da Rosa (arte provisória) com a mesma geometria de colisão. */
export const GREENHOUSE_FACADE=SHOP_FACADES.rosa;
/** Área reservada em blocos, relativa ao bloco da porta (inclui o telhado). */
export const GREENHOUSE_FOOTPRINT={left:-6,top:-6,width:13,height:7} as const;
const placed=(s:Pick<SaveData,'greenhouse'>)=>s.greenhouse;
export function greenhousePointBlocked(s:Pick<SaveData,'greenhouse'>,x:number,y:number):boolean{
 const g=placed(s);if(!g)return false;
 if(Math.abs(x-(g.x+.5)*32)>230||Math.abs(y-g.y*32)>240)return false;
 return facadeBlockedPoint(GREENHOUSE_FACADE,x,y,{x:g.x,y:g.y});
}
export const greenhouseTileBlocked=(s:Pick<SaveData,'greenhouse'>,x:number,y:number)=>greenhousePointBlocked(s,x*32+16,y*32+16);
export function greenhouseReserved(s:Pick<SaveData,'greenhouse'>,x:number,y:number):boolean{
 const g=placed(s);if(!g)return false;const f=GREENHOUSE_FOOTPRINT;
 return x>=g.x+f.left&&x<g.x+f.left+f.width&&y>=g.y+f.top&&y<g.y+f.top+f.height||x===g.x&&(y===g.y+1||y===g.y+2);
}
/** Porta (em px): passar por ela entra na estufa. */
export const greenhouseDoorway=(g:GreenhouseState)=>({x:(g.x+.5)*32,y:g.y*32+24,halfWidth:20,depth:14,direction:'up' as const});
