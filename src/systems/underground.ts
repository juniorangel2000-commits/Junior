import {validMineHazards,type MineHazardState} from './underground-hazard-state';
import {mineMaterialAt,MINE_MATERIALS} from './underground-geology';
import type {MineMaterial} from '../data/underground-balance';
import {organicMineWallContains,organicMineFloorCornerRock} from '../data/mine-wall-shape';
import type {SaveData,ResourceNode,TilePoint,Tool} from '../types';
import {CHARACTER_DIRECTIONS} from '../character-directions';
import {Resources} from './resources';
import {Inventory} from './inventory';
import {MINE_ARRIVAL,mineResumePosition} from '../data/mine-room';
import {UNDERGROUND,mineDecorCell,mineDecorBlocked,mineCellIndex,mineCellPoint,mineZone,undergroundLayout,inMineEntrance,inMineConnector} from '../data/underground-layout';
import {mineBlockedPoint} from '../data/mine-room';
export interface MineCellChange{dug?:true;hits?:number;mineral?:MineMaterial;dugDay?:number;cycle?:number;renewedDay?:number}
export interface UndergroundState{access?:1;hazards?:MineHazardState;version:1;seed:number;changes:Record<string,MineCellChange>;revision:number;geology?:1;expedition?:{id:number;inside:boolean;enteredDay:number;exitedDay?:number};renewal?:{day:number;count:number;sequence:number;lastRegeneratedDay?:number}}
export const MINING_REACH=68; // Existing exploration gathering radius; does not change pickaxe rules.
export function ensureUndergroundWorld(save:SaveData):UndergroundState{
 if(!save.underground){
  let seed=2166136261;for(const c of save.profile.name+':'+save.day)seed=Math.imul(seed^c.charCodeAt(0),16777619);
  save.underground={version:1,seed:seed>>>0,changes:{},revision:0,geology:1};
  for(const pet of save.dungeons?.pets??[]){const p=pet.world;if(p?.area==='highland'&&p.space==='mine'){p.x+=UNDERGROUND.entryX;p.y+=UNDERGROUND.entryY;}}
 }
 const mine=save.underground;
 if(!mine.geology){
  for(const c of Object.values(mine.changes)){c.mineral??='stone';if(c.dug)c.dugDay??=save.day;}
  mine.geology=1;
 }
 return mine;
}
/** Player entry migrates the old reception coordinates; NPC simulation never moves the player. */
export function ensureUnderground(save:SaveData):UndergroundState{
 const first=!save.underground,mine=ensureUndergroundWorld(save);
 if(first){const p=mineResumePosition(save.mineInterior);save.mineInterior={...p,x:p.x+UNDERGROUND.entryX,y:p.y+UNDERGROUND.entryY};}
 return mine;
}
export function mineRockAt(mine:UndergroundState,x:number,y:number):boolean{
 if(x<0||y<0||x>=UNDERGROUND.width||y>=UNDERGROUND.height)return true;
 const px=x*32+16,py=y*32+16;
 if(inMineEntrance(px,py))return!inMineConnector(px,py)&&mineBlockedPoint(px-UNDERGROUND.entryX,py-UNDERGROUND.entryY);
 if(inMineConnector(px,py))return false;
 if(mineDecorCell(x,y))return false;
 const i=mineCellIndex(x,y);return !!undergroundLayout(mine.seed).rock[i]&&!mine.changes[i]?.dug;
}
export function mineWallMask(mine:UndergroundState,x:number,y:number):number{
 let mask=0;for(const [dx,dy,bit]of [[0,-1,1],[1,0,2],[0,1,4],[-1,0,8]])if(mineRockAt(mine,x+dx,y+dy))mask|=bit;return mask;
}
export function undergroundBlocked(mine:UndergroundState,x:number,y:number):boolean{
 if(!Number.isFinite(x)||!Number.isFinite(y)||x<0||y<0||x>=UNDERGROUND.width*32||y>=UNDERGROUND.height*32)return true;
 if(inMineEntrance(x,y))return !inMineConnector(x,y)&&mineBlockedPoint(x-UNDERGROUND.entryX,y-UNDERGROUND.entryY);
 if(inMineConnector(x,y))return false;
 if(mineDecorBlocked(x,y))return true;
 const tx=Math.floor(x/32),ty=Math.floor(y/32);
 if(!mineRockAt(mine,tx,ty))return organicMineFloorCornerRock(x-tx*32,y-ty*32,mineWallMask(mine,tx,ty),tx,ty);
 return organicMineWallContains(x-tx*32,y-ty*32,mineWallMask(mine,tx,ty),tx,ty);
}

export const undergroundFits=(mine:UndergroundState,x:number,y:number)=>[[-7,-5],[7,-5],[-7,3],[7,3]].every(([dx,dy])=>!undergroundBlocked(mine,x+dx,y+dy));
export function undergroundArrival(){return{...MINE_ARRIVAL,x:MINE_ARRIVAL.x+UNDERGROUND.entryX,y:MINE_ARRIVAL.y+UNDERGROUND.entryY};}
export function validUnderground(v:unknown,maxDay=999999):v is UndergroundState{
 if(!v||typeof v!=='object'||Array.isArray(v))return false;const m=v as UndergroundState;
 if(m.version!==1||!Number.isSafeInteger(m.seed)||m.seed<0||m.seed>4294967295||!Number.isSafeInteger(m.revision)||m.revision<0||m.revision>1e9||!m.changes||typeof m.changes!=='object'||Array.isArray(m.changes))return false;
 if(m.access!==undefined&&m.access!==1)return false;
 if(m.geology!==undefined&&m.geology!==1)return false;
 if(m.hazards!==undefined&&!validMineHazards(m.hazards))return false;
 const day=(v:unknown)=>Number.isSafeInteger(v)&&Number(v)>=1&&Number(v)<=maxDay;
 if(m.expedition!==undefined){const e=m.expedition;if(!e||typeof e!=='object'||!Number.isSafeInteger(e.id)||e.id<1||e.id>1e9||typeof e.inside!=='boolean'||!day(e.enteredDay)||e.exitedDay!==undefined&&(!day(e.exitedDay)||e.exitedDay<e.enteredDay)||!e.inside&&e.exitedDay===undefined)return false;}
 if(m.renewal!==undefined){const r=m.renewal;if(!r||typeof r!=='object'||!day(r.day)||!Number.isSafeInteger(r.count)||r.count<0||r.count>UNDERGROUND.width*UNDERGROUND.height||!Number.isSafeInteger(r.sequence)||r.sequence<1||r.sequence>1e9||r.lastRegeneratedDay!==undefined&&(!day(r.lastRegeneratedDay)||r.lastRegeneratedDay>r.day))return false;}
 const changes=Object.entries(m.changes);if(changes.length>UNDERGROUND.width*UNDERGROUND.height)return false;
 return changes.every(([key,c])=>{
  if(!/^(0|[1-9]\d{0,4})$/.test(key)||!c||typeof c!=='object'||Array.isArray(c)||Object.keys(c).some(k=>!['dug','hits','mineral','dugDay','cycle','renewedDay'].includes(k)))return false;
  const i=Number(key),p=mineCellPoint(i);if(i>=UNDERGROUND.width*UNDERGROUND.height||mineZone(m.seed,p.x,p.y)==='protected'||!undergroundLayout(m.seed).rock[i])return false;
  if(c.mineral!==undefined&&!MINE_MATERIALS.includes(c.mineral)||c.dugDay!==undefined&&(!day(c.dugDay)||c.dug!==true)||c.cycle!==undefined&&(!Number.isSafeInteger(c.cycle)||c.cycle<1||c.cycle>1e9)||c.renewedDay!==undefined&&(!day(c.renewedDay)||!c.cycle||!c.mineral)||c.cycle!==undefined&&c.renewedDay===undefined||c.dugDay!==undefined&&c.renewedDay!==undefined&&c.dugDay<c.renewedDay)return false;
  return c.dug===true?c.hits===undefined:c.dug===undefined&&(c.hits!==undefined?Number.isSafeInteger(c.hits)&&c.hits>0&&c.hits<5:!!c.cycle&&!!c.renewedDay);
 });
}
export function validUndergroundPosition(mine:UndergroundState,v:unknown):boolean{
 if(!v||typeof v!=='object')return false;const p=v as {x:number;y:number;direction?:string};
 return undergroundFits(mine,p.x,p.y)&&(p.direction===undefined||CHARACTER_DIRECTIONS.includes(p.direction as typeof CHARACTER_DIRECTIONS[number]));
}
/** Does not grant reach through an intervening intact block or decorative solid. */
export function mineTargetVisible(mine:UndergroundState,origin:TilePoint,target:TilePoint):boolean{
 if(!Number.isFinite(origin.x)||!Number.isFinite(origin.y)||!Number.isInteger(target.x)||!Number.isInteger(target.y)||mineWallMask(mine,target.x,target.y)===15)return false;
 const tx=target.x*32+16,ty=target.y*32+16,d=Math.hypot(tx-origin.x,ty-origin.y),steps=Math.max(1,Math.ceil(d/4));
 if(d>=MINING_REACH)return false;
 for(let i=0;i<steps;i++){
  const x=origin.x+(tx-origin.x)*i/steps,y=origin.y+(ty-origin.y)*i/steps;
  if(Math.floor(x/32)===target.x&&Math.floor(y/32)===target.y)break;
  if(undergroundBlocked(mine,x,y))return false;
 }
 return true;
}
export function mineBlockNode(mine:UndergroundState,x:number,y:number):ResourceNode|undefined{
 if(mineZone(mine.seed,x,y)==='protected'||!undergroundLayout(mine.seed).rock[mineCellIndex(x,y)]||mine.changes[mineCellIndex(x,y)]?.dug)return;
 const cycle=mine.changes[mineCellIndex(x,y)]?.cycle;const mineral=mineMaterialAt(mine,x,y);
 return{id:`mine-${mine.seed}-${mineCellIndex(x,y)}${cycle?'-r'+cycle:''}`,kind:'vein',x,y,...(mineral!=='stone'?{metal:mineral}:{})};
}
export function nearbyMineBlock(mine:UndergroundState,origin:TilePoint,facing:TilePoint):ResourceNode|undefined{
 const tx=Math.floor(origin.x/32),ty=Math.floor(origin.y/32),nodes:ResourceNode[]=[];
 for(let y=ty-2;y<=ty+2;y++)for(let x=tx-2;x<=tx+2;x++){const n=mineBlockNode(mine,x,y);if(n&&mineTargetVisible(mine,origin,n))nodes.push(n);}
 const score=(n:ResourceNode)=>{const dx=n.x*32+16-origin.x,dy=n.y*32+16-origin.y,d=Math.hypot(dx,dy);return d+28*(1-(dx*facing.x+dy*facing.y)/Math.max(1,d));};
 return nodes.sort((a,b)=>score(a)-score(b))[0];
}
export interface ExcavationResult{ok:boolean;message:string;depleted?:boolean;changed?:TilePoint[]}
/** Shared physical strike. Future NPC actors supply their own inventory and tool context. */
export function applyMineStrike(mine:UndergroundState,origin:TilePoint,target:TilePoint,tool:Tool,inventory:Inventory,context:SaveData):ExcavationResult{
 if(!undergroundFits(mine,origin.x,origin.y))return{ok:false,message:'Fique em um ponto livre para escavar.'};
 const node=mineBlockNode(mine,target.x,target.y);
 if(!node)return{ok:false,message:'Esta rocha é estrutural ou já foi escavada.'};
 if(!mineTargetVisible(mine,origin,target))return{ok:false,message:'Aproxime-se da rocha por um caminho livre.'};
 if(mine.revision>=1e9)return{ok:false,message:'O limite de alterações desta mina foi atingido.'};
 const key=mineCellIndex(target.x,target.y),old=mine.changes[key],resources=new Resources(old?.hits?[{id:node.id,hits:old.hits}]:[]);
 const result=resources.hit(node,tool,inventory,context,mineMaterialAt(mine,target.x,target.y));
 if(!result.ok)return result;
 mine.changes[key]={...(old?.cycle?{cycle:old.cycle,renewedDay:old.renewedDay}:{}),mineral:mineMaterialAt(mine,target.x,target.y),...(result.depleted?{dug:true,dugDay:context.day}:{hits:resources.progress[0].hits})};mine.revision++;
 return{...result,changed:[target,...(result.depleted?[{x:target.x-1,y:target.y},{x:target.x+1,y:target.y},{x:target.x,y:target.y-1},{x:target.x,y:target.y+1}]:[])]};
}
export function excavateMineBlock(save:SaveData,origin:TilePoint,target:TilePoint,tool:Tool,write:(draft:SaveData)=>boolean):ExcavationResult{
 if(!save.underground)return{ok:false,message:'Entre nas galerias para minerar.'};
 const draft=structuredClone(save),inventory=new Inventory(draft.inventory),result=applyMineStrike(draft.underground!,origin,target,tool,inventory,draft);
 if(!result.ok)return result;
 draft.inventory={...inventory.data};draft.progress.collected ||= draft.inventory.wood>0&&draft.inventory.stone>0&&draft.inventory.fiber>0;
 try{if(!write(draft))return{ok:false,message:'Não foi possível salvar. A rocha, a ferramenta e os materiais foram preservados.'};}catch{return{ok:false,message:'Não foi possível salvar. A ação foi revertida.'};}
 save.underground=draft.underground;save.inventory=draft.inventory;save.economy6=draft.economy6;save.progress=draft.progress;
 return result;
}
