import {depositMetal} from './mining';
import {ECONOMY_BALANCE as EB} from '../data/economy-balance';
import type {ResourceNode,ResourceKind} from '../types';
import {FIBER_PLANTS,isFiberPlant,fiberPlantFor,nearRiverBank,type FiberPlant} from '../data/fiber-plants';
export type ResourceArea='property'|'forest';
export const SPAWN_KINDS=['tree','stone','fiber','seeds','scrap','vein','fallenLog','stump'] as const;
export type SpawnKind=typeof SPAWN_KINDS[number];
export const RESOURCE_LIMITS={property:96,forest:80} as const;
export const HAND_GATHERING_KINDS=['tree','stone','fiber','seeds','scrap'] as const;
const HAND_MIX:SpawnKind[]=['fiber','tree','stone','seeds','fiber','tree','stone','scrap'];
export const RESOURCE_RESPAWN_MINUTES=3*24*60;
export const resourceRespawnMinutes=(kind:SpawnKind):number=>kind==='vein'?240:RESOURCE_RESPAWN_MINUTES;
export interface ResourceWait {kind:SpawnKind;at:number;plant?:FiberPlant}
export interface ResourceField {version:1;seed:number;sequence:number;nodes:ResourceNode[];waiting:ResourceWait[];initialized:boolean;timingRevision?:2;ecologyRevision?:2;gatheringRevision?:1}
export function newResourceField(seed:number):ResourceField{return {version:1,seed:seed>>>0,sequence:0,nodes:[],waiting:[],initialized:false,timingRevision:2,ecologyRevision:2,gatheringRevision:1};}
export const clockMinutes=(clock:{day:number;time:number}):number=>(clock.day-1)*1440+clock.time;
/** Previous waits used four hours. Extend hand-gathered resources once, in memory. */
export function upgradeResourceTiming(field:ResourceField):void {
 if(field.timingRevision===2)return;
 for(const wait of field.waiting)if(wait.kind!=='vein')wait.at+=RESOURCE_RESPAWN_MINUTES-240;
 field.timingRevision=2;
}
/** Add new resource families to old fields without touching collected IDs or due times. */
export function upgradeResourceEcology(field:ResourceField,area:ResourceArea,now:number):void {
 if(field.ecologyRevision===2)return;
 for(const node of field.nodes)if(node.kind==='fiber')node.plant??=fiberPlantFor(node);
 if(field.initialized)for(const desired of [{kind:'fallenLog' as const},{kind:'stump' as const},...(area==='property'?[{kind:'fiber' as const,plant:'reeds' as const}]:[])]){
  if(field.nodes.some(n=>n.kind===desired.kind&&(!('plant' in desired)||n.plant===desired.plant))||field.waiting.some(n=>n.kind===desired.kind&&(!('plant' in desired)||n.plant===desired.plant)))continue;
  const index=field.nodes.findIndex(n=>['tree','stone','fiber','seeds','scrap'].includes(n.kind)&&!(n.kind==='fiber'&&n.plant==='reeds'));
  if(index>=0){field.nodes.splice(index,1);field.waiting.push({...desired,at:now});}
  else {
   const waiting=field.waiting.find(w=>['tree','stone','seeds','scrap'].includes(w.kind));
   if(waiting){waiting.kind=desired.kind;if('plant' in desired)waiting.plant=desired.plant;else delete waiting.plant;}
   else if(field.nodes.length+field.waiting.length<RESOURCE_LIMITS[area])field.waiting.push({...desired,at:now});
  }
 }
 field.ecologyRevision=2;
}
function random(field:ResourceField):number {field.seed=(Math.imul(field.seed,1664525)+1013904223)>>>0;return field.seed/4294967296;}
export function replenishResources(field:ResourceField,area:ResourceArea,now:number,canPlace:(x:number,y:number,kind:SpawnKind,plant?:FiberPlant)=>boolean,budget:number=RESOURCE_LIMITS[area],placementCost:(x:number,y:number,kind:SpawnKind)=>number=()=>0):boolean {
 upgradeResourceTiming(field);upgradeResourceEcology(field,area,now);
 const cap=Math.max(0,Math.min(RESOURCE_LIMITS[area],budget)),occupied=new Set(field.nodes.map(n=>`${n.x},${n.y}`));let changed=false;
 // Only the new capacity is seeded on an old save. Existing harvest timers stay intact.
 if(field.gatheringRevision!==1){
  field.gatheringRevision=1;
  if(field.initialized){const extra=Math.max(0,Math.min(cap-field.nodes.length,RESOURCE_LIMITS[area]-field.nodes.length-field.waiting.length));for(let i=0;i<extra;i++)field.waiting.push({kind:HAND_MIX[i%HAND_MIX.length],at:now});}
 }
 const add=(kind:SpawnKind,plant?:FiberPlant):boolean=>{
  if(kind==='fiber')plant??=FIBER_PLANTS[Math.floor(random(field)*(area==='property'?4:3))];
  let best:{x:number;y:number;score:number}|undefined;
  for(let tries=0;tries<1800;tries++){
   const x=2+Math.floor(random(field)*92),y=2+Math.floor(random(field)*68),key=`${x},${y}`;
   if(occupied.has(key)||(plant==='reeds'&&(area!=='property'||!nearRiverBank(x,y)))||!canPlace(x,y,kind,plant))continue;
   const sectorX=Math.floor(x/16),sectorY=Math.floor(y/18);
   let crowd=0;for(const node of field.nodes){if(Math.floor(node.x/16)===sectorX&&Math.floor(node.y/18)===sectorY)crowd+=8;if(Math.hypot(node.x-x,node.y-y)<3)crowd+=12;}
   const score=crowd+placementCost(x,y,kind);if(!best||score<best.score)best={x,y,score};
   if(tries>=160)break;
  }
  if(!best)return false;
  field.nodes.push({id:`spawn-${area==='forest'?'f':'p'}-${kind}-${++field.sequence}`,kind,x:best.x,y:best.y,...(plant?{plant}:{})});occupied.add(`${best.x},${best.y}`);changed=true;return true;
 };
 if(!field.initialized){
  const plants=area==='property'?FIBER_PLANTS:FIBER_PLANTS.slice(0,3);
  for(let i=0;i<cap;i++) {
   const starters:SpawnKind[]=['seeds','tree','stone','fallenLog','stump','vein','scrap'];
   const kind:SpawnKind=i<plants.length?'fiber':starters[i-plants.length]??(i%4===3?(['vein','fallenLog','stump'] as const)[Math.floor(random(field)*3)]:HAND_MIX[(i-Math.floor(i/4))%HAND_MIX.length]);
   const plant=i<plants.length?plants[i]:undefined;
   if(!add(kind,plant)){field.waiting.push({kind,at:now+30,...(plant?{plant}:{})});}
  }
  field.initialized=true;
 }
 for(let i=field.waiting.length-1;i>=0&&field.nodes.length<cap;i--){
  const due=field.waiting[i];if(due.at>now)continue;
  if(add(due.kind,due.plant))field.waiting.splice(i,1);else due.at=now+30;
 }
 return changed;
}
export function harvestSpawn(field:ResourceField,id:string,now:number):boolean {
 const index=field.nodes.findIndex(n=>n.id===id);if(index<0)return false;
 const [node]=field.nodes.splice(index,1);const kind=node.kind as SpawnKind;
 field.waiting.push({kind,at:now+(depositMetal(node)==='blackMetal'?EB.rareDepositRespawnDays*1440:resourceRespawnMinutes(kind)),...(kind==='fiber'?{plant:fiberPlantFor(node)}:{})});return true;
}
export function validateResourceField(value:unknown,area:ResourceArea):value is ResourceField {
 if(!value||typeof value!=='object')return false;const f=value as ResourceField,cap=RESOURCE_LIMITS[area];
 if(f.version!==1||(f.timingRevision!==undefined&&f.timingRevision!==2)||(f.ecologyRevision!==undefined&&f.ecologyRevision!==2)||(f.gatheringRevision!==undefined&&f.gatheringRevision!==1)||!Number.isInteger(f.seed)||f.seed<0||f.seed>0xffffffff||!Number.isSafeInteger(f.sequence)||f.sequence<0||typeof f.initialized!=='boolean'||!Array.isArray(f.nodes)||!Array.isArray(f.waiting)||f.nodes.length+f.waiting.length>cap)return false;
 const ids=new Set<string>(),tiles=new Set<string>();
 const validPlant=(kind:string,plant:unknown)=>plant===undefined||kind==='fiber'&&isFiberPlant(plant)&&(area==='property'||plant!=='reeds');
 for(const n of f.nodes){if(!n||typeof n!=='object'||typeof n.id!=='string')return false;const kind=n.kind as SpawnKind,prefix=`spawn-${area==='forest'?'f':'p'}-${kind}-`,suffix=n.id.slice(prefix.length),tile=`${n.x},${n.y}`;
  if(!SPAWN_KINDS.includes(kind)||(n.metal!==undefined&&!['iron','gold','blackMetal'].includes(n.metal))||!validPlant(kind,n.plant)||!n.id.startsWith(prefix)||!/^\d+$/.test(suffix)||Number(suffix)>f.sequence||Number(suffix)<1||ids.has(n.id)||tiles.has(tile)||!Number.isSafeInteger(n.x)||!Number.isSafeInteger(n.y)||n.x<1||n.x>=95||n.y<1||n.y>=71)return false;
  ids.add(n.id);tiles.add(tile);
 }
 return f.waiting.every(w=>!!w&&typeof w==='object'&&SPAWN_KINDS.includes(w.kind)&&validPlant(w.kind,w.plant)&&Number.isFinite(w.at)&&w.at>=0);
}
export function isSpawnId(id:string):boolean{return /^spawn-[pf]-(tree|stone|fiber|seeds|scrap|vein|fallenLog|stump)-\d+$/.test(id);}
export function naturalResourceTexture(kind:ResourceKind):string{return ({tree:'asset-new-branches',stone:'asset-small-stones',fiber:'forest-detail-fern',seeds:'asset-berry-bush',scrap:'asset-scrap',vein:'lake-rock-0',standingTree:'asset-tree-0',fallenLog:'forest-detail-log',stump:'forest-detail-stump'})[kind];}
