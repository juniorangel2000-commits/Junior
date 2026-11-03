import {returnMineMissionObjects} from './mine-mission-lifecycle';
import type {SaveData,ItemId} from '../types';
import {Home} from './home';
import {rescueHomePlacement,rescuePending} from './mine-rescue-state';
import {advanceClock,GAME_MINUTES_PER_SECOND} from './clock';
import {Farming} from './farming';
import {ensureBentoTravel} from './bento-travel';
import {endBentoParty} from './bento-expedition';
import {finishMineExpedition} from './underground-renewal';
import {MINE_HAZARDS} from '../data/underground-hazards';
const EQUIPMENT:ReadonlySet<ItemId>=new Set(['hatchet','pickaxe','hoe','handsaw','hammer','sickle','shovel','sword','lantern','backpack','boots','clothing','accessory','fishingRod','net']);
/** One atomic rescue: the darkened scene is the only off-screen relocation. */
export function recoverMineDefeat(save:SaveData,write:(draft:SaveData)=>boolean):boolean{
 if(rescuePending(save)||!save.underground?.hazards||save.underground.hazards.hp>0)return false;
 const draft=structuredClone(save),home=new Home(draft.home),placement=rescueHomePlacement(home);if(!placement)return false;
 const before=(draft.day-1)*1440+draft.time;Object.assign(draft,advanceClock(draft,120));
 const elapsedMinutes=Math.max(0,(draft.day-1)*1440+draft.time-before),farm=new Farming(draft.crops,draft.preparedSoil,draft.farmingProgress,draft.restoredFarmSoil);farm.update(elapsedMinutes/GAME_MINUTES_PER_SECOND);draft.crops=farm.crops;draft.farmingProgress=farm.progress;
 draft.home=home.data;draft.activeArea='property';draft.homePosition={...placement.player,direction:'down'};
 for(const id of Object.keys(draft.inventory) as ItemId[])if(!EQUIPMENT.has(id))draft.inventory[id]=0;
 if(draft.fishingProgress)draft.fishingProgress.basket=[];
 delete draft.lastFishingHaul;returnMineMissionObjects(draft);finishMineExpedition(draft);
 endBentoParty(draft,'danger');
 // Interrupt only the current mining action. His private pack, job and deposits survive.
 if(draft.bentoWork){delete draft.bentoWork.mining;delete draft.bentoWork.handling;}
 const count=(draft.mineRescue?.count??0)+1;
 draft.mineRescue={version:1,count,day:draft.day,time:draft.time,elapsedMinutes,bedId:placement.bedId,stage:'waking',variant:(count-1)%3};
 const travel=ensureBentoTravel(draft);travel.updatedAt=(draft.day-1)*1440+draft.time;travel.lastAttemptDay=draft.day;
 travel.trip={day:draft.day,area:'home',leg:'rescue-dialogue',...placement.bento,direction:'down',route:[],index:0,distance:0,moving:false,wait:0,blocked:false,purpose:'rescue'};
 const h=draft.underground!.hazards!;h.hp=MINE_HAZARDS.maxHealth;h.invulnerable=0;h.swordCooldown=0;
 // Leave the cave-in/enemies intact; a reload never respawns or erases a danger.
 for(const pet of draft.dungeons?.pets??[])if(pet.world?.mode==='follow')delete pet.world;
 try{if(!write(draft))return false;}catch{return false;}
 Object.assign(save,draft);delete save.mineInterior;delete save.miningInterior;delete save.lastFishingHaul;return true;
}
