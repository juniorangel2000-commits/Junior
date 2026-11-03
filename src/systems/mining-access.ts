import type {SaveData} from '../types';
import {ensureUnderground,undergroundArrival} from './underground';
import {finishMineExpedition} from './underground-renewal';
import {MINING_ENTRY,MINE_HALL_RETURN,inMiningGallery} from '../data/mining-entry';
/** Previous continuous-map saves retain all excavations and resume in the matching scene. */
export function upgradeMineAccess(save:SaveData):void{
 const mine=save.underground;if(!mine||mine.access===1)return;
 mine.access=1;
 if(save.mineInterior&&inMiningGallery(save.mineInterior)){save.miningInterior=true;if(save.mineInterior.y>MINING_ENTRY.y)save.mineInterior={...MINING_ENTRY};}
 else{delete save.miningInterior;if(mine.expedition?.inside){mine.expedition.inside=false;mine.expedition.exitedDay=save.day;}}
}
function commit(save:SaveData,draft:SaveData,write:(draft:SaveData)=>boolean):boolean{
 try{if(!write(draft))return false;}catch{return false;}
 save.mineMissions=draft.mineMissions;save.underground=draft.underground;save.mineInterior=draft.mineInterior;save.activeArea=draft.activeArea;save.dungeons=draft.dungeons;delete save.miningInterior;return true;
}
/** Entering the reception room does not begin or regenerate a mining expedition. */
export function enterMineHall(save:SaveData,write:(draft:SaveData)=>boolean):boolean{
 const draft=structuredClone(save);ensureUnderground(draft);upgradeMineAccess(draft);finishMineExpedition(draft);draft.mineInterior=undergroundArrival();draft.activeArea='highland';delete draft.miningInterior;return commit(save,draft,write);
}
export function returnToMineHall(save:SaveData,write:(draft:SaveData)=>boolean):boolean{
 if(!save.miningInterior)return false;const draft=structuredClone(save);finishMineExpedition(draft);delete draft.miningInterior;draft.mineInterior={...MINE_HALL_RETURN};return commit(save,draft,write);
}
