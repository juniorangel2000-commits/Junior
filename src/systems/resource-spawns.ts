import type {ResourceNode,ResourceKind} from '../types';
export type ResourceArea='property'|'forest';
export const SPAWN_KINDS=['tree','stone','fiber','seeds','scrap','vein'] as const;
export type SpawnKind=typeof SPAWN_KINDS[number];
export const RESOURCE_LIMITS={property:64,forest:48} as const;
export const RESOURCE_RESPAWN_MINUTES=240;
export interface ResourceField {version:1;seed:number;sequence:number;nodes:ResourceNode[];waiting:Array<{kind:SpawnKind;at:number}>;initialized:boolean}
export function newResourceField(seed:number):ResourceField{return {version:1,seed:seed>>>0,sequence:0,nodes:[],waiting:[],initialized:false};}
export const clockMinutes=(clock:{day:number;time:number}):number=>(clock.day-1)*1440+clock.time;
function random(field:ResourceField):number {field.seed=(Math.imul(field.seed,1664525)+1013904223)>>>0;return field.seed/4294967296;}
export function replenishResources(field:ResourceField,area:ResourceArea,now:number,canPlace:(x:number,y:number)=>boolean,budget:number=RESOURCE_LIMITS[area]):boolean {
 const cap=Math.max(0,Math.min(RESOURCE_LIMITS[area],budget)),occupied=new Set(field.nodes.map(n=>`${n.x},${n.y}`));let changed=false;
 const add=(kind:SpawnKind):boolean=>{
  for(let tries=0;tries<1800;tries++){
   const x=2+Math.floor(random(field)*92),y=2+Math.floor(random(field)*68),key=`${x},${y}`;
   if(occupied.has(key)||!canPlace(x,y))continue;
   field.nodes.push({id:`spawn-${area==='forest'?'f':'p'}-${kind}-${++field.sequence}`,kind,x,y});occupied.add(key);changed=true;return true;
  }return false;
 };
 if(!field.initialized){
  for(let i=0;i<cap;i++)if(!add(SPAWN_KINDS[Math.floor(random(field)*SPAWN_KINDS.length)])){for(let j=i;j<cap;j++)field.waiting.push({kind:SPAWN_KINDS[j%SPAWN_KINDS.length],at:now+30});break;}
  field.initialized=true;
 }
 for(let i=field.waiting.length-1;i>=0&&field.nodes.length<cap;i--){
  const due=field.waiting[i];if(due.at>now)continue;
  if(add(due.kind))field.waiting.splice(i,1);else due.at=now+30;
 }
 return changed;
}
export function harvestSpawn(field:ResourceField,id:string,now:number):boolean {
 const index=field.nodes.findIndex(n=>n.id===id);if(index<0)return false;
 const [node]=field.nodes.splice(index,1);field.waiting.push({kind:node.kind as SpawnKind,at:now+RESOURCE_RESPAWN_MINUTES});return true;
}
export function validateResourceField(value:unknown,area:ResourceArea):value is ResourceField {
 if(!value||typeof value!=='object')return false;const f=value as ResourceField,cap=RESOURCE_LIMITS[area];
 if(f.version!==1||!Number.isInteger(f.seed)||f.seed<0||f.seed>0xffffffff||!Number.isSafeInteger(f.sequence)||f.sequence<0||typeof f.initialized!=='boolean'||!Array.isArray(f.nodes)||!Array.isArray(f.waiting)||f.nodes.length+f.waiting.length>cap)return false;
 const ids=new Set<string>(),tiles=new Set<string>();
 for(const n of f.nodes){if(!n||typeof n!=='object'||typeof n.id!=='string')return false;const kind=n.kind as SpawnKind,prefix=`spawn-${area==='forest'?'f':'p'}-${kind}-`,suffix=n.id?.slice(prefix.length),tile=`${n.x},${n.y}`;
  if(!SPAWN_KINDS.includes(kind)||!n.id?.startsWith(prefix)||!/^\d+$/.test(suffix)||Number(suffix)>f.sequence||Number(suffix)<1||ids.has(n.id)||tiles.has(tile)||!Number.isSafeInteger(n.x)||!Number.isSafeInteger(n.y)||n.x<1||n.x>=95||n.y<1||n.y>=71)return false;
  ids.add(n.id);tiles.add(tile);
 }
 return f.waiting.every(w=>!!w&&typeof w==='object'&&SPAWN_KINDS.includes(w.kind)&&Number.isFinite(w.at)&&w.at>=0);
}
export function isSpawnId(id:string):boolean{return /^spawn-[pf]-(tree|stone|fiber|seeds|scrap|vein)-\d+$/.test(id);}
export function naturalResourceTexture(kind:ResourceKind):string{return ({tree:'asset-branch',stone:'asset-stone',fiber:'asset-fiber',seeds:'asset-seeds',scrap:'asset-scrap',vein:'asset-vein',standingTree:'asset-tree-0'})[kind];}
