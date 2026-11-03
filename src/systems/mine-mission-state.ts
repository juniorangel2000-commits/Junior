import type {TilePoint} from '../types';
import {MINE_MISSION_IDS,MINE_MISSIONS,mineMission,mineMissionTarget,mineMissionOrigin,mineMissionObjectId,mineRequestCycle,type MineMissionId} from '../data/mine-missions';
export type MineMissionStatus='available'|'active'|'waiting'|'ready'|'completed';
export interface MineMissionObject{uid:string;state:'world'|'carried'|'delivered';position:TilePoint}
export interface MineMissionRecord{status:MineMissionStatus;progress:number;visited:number[];acceptedDay?:number;completedDay?:number;cycle?:number;object?:MineMissionObject}
export interface MineMissionsState{version:1;quests:Record<MineMissionId,MineMissionRecord>;repeatPaidCycle?:number;rewarded:number}
export const freshMineMission=(id:MineMissionId):MineMissionRecord=>({status:'available',progress:0,visited:[],...(mineMission(id).kind==='unique'&&mineMissionOrigin(id)?{object:{uid:mineMissionObjectId(id),state:'world' as const,position:mineMissionOrigin(id)!}}:{})});
export const newMineMissions=():MineMissionsState=>({version:1,quests:Object.fromEntries(MINE_MISSION_IDS.map(id=>[id,freshMineMission(id)]))as MineMissionsState['quests'],rewarded:0});
const int=(v:unknown,max=1e9)=>typeof v==='number'&&Number.isSafeInteger(v)&&v>=0&&v<=max;
const point=(p:unknown):p is TilePoint=>!!p&&typeof p==='object'&&typeof(p as TilePoint).x==='number'&&Number.isFinite((p as TilePoint).x)&&(p as TilePoint).x>=0&&(p as TilePoint).x<5120&&typeof(p as TilePoint).y==='number'&&Number.isFinite((p as TilePoint).y)&&(p as TilePoint).y>=0&&(p as TilePoint).y<5600;
export function validMineMissions(v:unknown,maxDay=999999):v is MineMissionsState{
 if(!v||typeof v!=='object'||Array.isArray(v))return false;const s=v as MineMissionsState;if(s.version!==1||!s.quests||typeof s.quests!=='object'||Array.isArray(s.quests)||Object.keys(s.quests).length!==MINE_MISSION_IDS.length||!int(s.rewarded)||s.repeatPaidCycle!==undefined&&!int(s.repeatPaidCycle,mineRequestCycle(maxDay)))return false;
 let unfinishedRepeats=0;const objectIds=new Set<string>();
 for(const def of MINE_MISSIONS){const q=s.quests[def.id],target=mineMissionTarget(def.id);if(!q||!['available','active','waiting','ready','completed'].includes(q.status)||!int(q.progress,target)||!Array.isArray(q.visited)||q.visited.some(n=>!int(n,(def.visits?.length??1)-1))||new Set(q.visited).size!==q.visited.length||q.visited.length>(def.visits?.length??0))return false;
  if(q.acceptedDay!==undefined&&(!int(q.acceptedDay,maxDay)||q.acceptedDay<1)||q.completedDay!==undefined&&(!int(q.completedDay,maxDay)||q.completedDay<1))return false;
  if(q.status==='available'&&(q.progress!==0||q.acceptedDay!==undefined||q.completedDay!==undefined||q.cycle!==undefined))return false;
  if(q.status!=='available'&&q.acceptedDay===undefined||q.status==='completed'&&q.completedDay===undefined||q.status!=='completed'&&q.completedDay!==undefined||q.completedDay!==undefined&&q.completedDay<(q.acceptedDay??1))return false;
  if(['ready','completed'].includes(q.status)&&q.progress!==target||['active','waiting'].includes(q.status)&&q.progress>=target)return false;
  if(def.visits&&q.progress!==q.visited.length)return false;
  if(def.kind==='repeat'){if(q.status!=='available'&&(!int(q.cycle,mineRequestCycle(maxDay))||q.cycle!==mineRequestCycle(q.acceptedDay!)))return false;if(['active','waiting','ready'].includes(q.status))unfinishedRepeats++;}else if(q.cycle!==undefined)return false;
  if(q.object){const o=q.object,origin=mineMissionOrigin(def.id,q.cycle??0);if(!origin||o.uid!==mineMissionObjectId(def.id,q.cycle??0)||objectIds.has(o.uid)||!['world','carried','delivered'].includes(o.state)||!point(o.position)||Math.hypot(o.position.x-origin.x,o.position.y-origin.y)>128)return false;objectIds.add(o.uid);
   if(q.status==='completed'&&o.state!=='delivered'||q.status!=='completed'&&o.state==='delivered'||o.state==='world'&&q.progress!==0||o.state!=='world'&&q.progress!==1||q.status==='available'&&o.state!=='world')return false;
  }else if(def.object&&(def.kind==='unique'||q.status!=='available'))return false;
 }
 return unfinishedRepeats<=1;
}
