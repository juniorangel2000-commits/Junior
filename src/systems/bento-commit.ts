import type {MineMissionRuntime} from './mine-missions';
import type {SaveData,TilePoint} from '../types';
export interface BentoWorkRuntime{
 missions?:MineMissionRuntime;
 write:(draft:SaveData)=>boolean;
 onMineImpact?:(target:TilePoint,changed:readonly TilePoint[],depleted:boolean)=>void;
 onBentoDefense?:(point:TilePoint,hits:number)=>void;
 protectedCells?:readonly TilePoint[];
}
/** Scene snapshots keep the player's live inventory/position authoritative while the NPC saves. */
export function bentoSceneWriter(snapshot:()=>SaveData,write:(save:SaveData)=>boolean):(draft:SaveData)=>boolean{
 return draft=>write({...snapshot(),underground:draft.underground,bentoWork:draft.bentoWork,bentoTravel:draft.bentoTravel,bentoExpedition:draft.bentoExpedition,mineMissions:draft.mineMissions});
}
export function commitBentoWork(save:SaveData,change:(draft:SaveData)=>boolean,runtime?:BentoWorkRuntime):boolean{
 if(!runtime)return false;const draft=structuredClone(save);if(!change(draft))return false;
 try{if(!runtime.write(draft))return false;}catch{return false;}
 save.mineMissions=draft.mineMissions;save.bentoExpedition=draft.bentoExpedition;save.bentoWork=draft.bentoWork;save.underground=draft.underground;return true;
}
