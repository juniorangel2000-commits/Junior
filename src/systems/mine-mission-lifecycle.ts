import {recordSocialMemory} from './npc-social';
import {mineMission,type MineMissionId} from '../data/mine-missions';
import type {SaveData} from '../types';
import {mineMissionOrigin} from '../data/mine-missions';
export function pauseMineMissions(save:SaveData):void{for(const[id,q]of Object.entries(save.mineMissions?.quests??{}))if(q.status==='active'){recordSocialMemory(save,'bento','request-interrupted',mineMission(id as MineMissionId).kind==='repeat'?(q.cycle??0)+1:1,id as MineMissionId);q.status='waiting';}}
export function resumeMineMissions(save:SaveData):void{for(const q of Object.values(save.mineMissions?.quests??{}))if(q.status==='waiting')q.status='active';}
/** Mission discoveries/deliveries remain; only the unique physical cargo returns to its origin. */
export function returnMineMissionObjects(save:SaveData):void{
 if(!save.mineMissions)return;for(const[id,q]of Object.entries(save.mineMissions.quests))if(q.object?.state==='carried'){
  recordSocialMemory(save,'bento','request-interrupted',mineMission(id as MineMissionId).kind==='repeat'?(q.cycle??0)+1:1,id as MineMissionId);
  q.object.state='world';q.object.position=mineMissionOrigin(id as keyof typeof save.mineMissions.quests,q.cycle??0)!;q.progress=0;if(q.status!=='available'&&q.status!=='completed')q.status='waiting';
 }
 pauseMineMissions(save);
}
