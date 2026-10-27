import {CHARACTER_DIRECTIONS,type CharacterDirection} from '../character-directions';
import {VILLAGE_NPCS,VILLAGE_BUILDINGS,villageGround,villageBlockedAt,type VillageNPC} from '../data/village';
import {VillageWalk,villageRoute} from './village-walk';
import type {Doorway} from './map-transition';
export type ResidentId=VillageNPC['id'];
export interface ShopResident {id:ResidentId;x:number;y:number;direction:CharacterDirection;shop:boolean}
export interface ShopVisit {owner:ResidentId;x:number;y:number;direction?:CharacterDirection}
export const merchantDoor=(id:ResidentId):Doorway=>{const npc=VILLAGE_NPCS.find(n=>n.id===id)!,b=VILLAGE_BUILDINGS.find(b=>b.shop===npc.merchantId)!;return{x:(b.x+.5)*32,y:b.y*32+29,halfWidth:16,depth:12,direction:'up'};};
export const merchantOutside=(id:ResidentId)=>{const p=merchantDoor(id);return{x:p.x,y:p.y+26};};
export const merchantCanTrade=(npc:ResidentId,room?:ResidentId)=>npc===room;
export const validResidentId=(v:unknown):v is ResidentId=>VILLAGE_NPCS.some(n=>n.id===v);
export function validShopResidents(value:unknown):value is ShopResident[]{
 if(!Array.isArray(value)||value.length>9)return false;const seen=new Set<string>();
 return value.every(p=>{if(!p||!validResidentId(p.id)||p.id==='bento'||seen.has(p.id)||typeof p.shop!=='boolean'||!Number.isFinite(p.x)||!Number.isFinite(p.y)||!CHARACTER_DIRECTIONS.includes(p.direction))return false;seen.add(p.id);return p.shop?p.x>=36&&p.x<=540&&p.y>=118&&p.y<=350:p.x>=32&&p.x<=3040&&p.y>=32&&p.y<=2272;});
}

/** Opt-in guidance. The player keeps control; the guide waits if left behind. */
export class MerchantGuide {
 readonly walker:VillageWalk;waiting=false;private pausedForPlayer=false;
 constructor(readonly owner:ResidentId){const p=merchantOutside(owner);this.walker=new VillageWalk([{x:Math.floor(p.x/32),y:Math.floor(p.y/32)}],34,0,0);}
 static canStart(id:ResidentId,position:{x:number;y:number},blocked=villageBlockedAt){const end=merchantOutside(id),start={x:position.x/32,y:position.y/32},goal={x:Math.floor(end.x/32),y:Math.floor(end.y/32)};return !blocked(goal.x,goal.y)&&(Math.floor(start.x)===goal.x&&Math.floor(start.y)===goal.y||villageRoute(start,goal,blocked).length>0);}
 step(seconds:number,position:{x:number;y:number},player:{x:number;y:number},blocked=villageBlockedAt){
  const distance=Math.hypot(player.x-position.x,player.y-position.y);
  if(distance>180)this.pausedForPlayer=true;else if(distance<130)this.pausedForPlayer=false;
  const result=this.walker.step(seconds,position,blocked,(x,y)=>['path','paving'].includes(villageGround(x,y))?1:2.4,this.waiting||this.pausedForPlayer);
  if(result.arrived)this.waiting=true;
  return{...result,waiting:this.waiting,waitingForPlayer:this.pausedForPlayer};
 }
}
