import {HOME_INTERIOR_DOORWAY,HOME_OUTDOOR_SPAWN} from './home';
import {PROPERTY_VILLAGE_EXIT} from '../data/property-village-gate';
import {defaultMap} from '../data/default-maps';
import {joinBentoTrip,activeBentoParty,endBentoParty,stepBentoParty} from './bento-expedition';
import {stepBentoSafety} from './bento-defense';
import {changeBentoLeg as changeLeg,bentoReturnLeg} from './bento-travel-state';
import {ensureBentoWork,beginBentoWorkTrip,bentoDepositKind,planBentoPersonalJob} from './bento-stock';
import {stepBentoMining} from './bento-mining';
import {bentoFixture} from './bento-fixtures';
import {stepBentoHandling,stepBentoForge} from './bento-workshop';
import {bentoAvailability} from './bento-schedule';
import {BENTO_WORK} from '../data/bento-work';
import {bentoIronUnits} from './bento-work-state';
import type {BentoWorkRuntime} from './bento-commit';
import type {SaveData,TilePoint} from '../types';
import {BENTO_WEEKLY_PLAN as B} from '../data/bento-schedule';
import {bentoSeed,bentoTripPending} from './bento-schedule';
import type {BentoTravelState,BentoTravelArea,BentoTravelLeg,BentoTrip} from './bento-travel-state';
import {bentoMapNavigation,bentoActorFits,bentoPlayerSpace,bentoSmithNavigation,planBentoRoute} from './bento-navigation';
import {advanceWorldRoute} from './world-route';
import {merchantOutside} from './merchant-visit';
import {CITY_FOREST_ENTRY,CITY_FOREST_EXIT,VILLAGE_NORTH_GATE,VILLAGE_NORTH_ARRIVAL} from '../data/city-forest';
import {CITY_LAKE_ENTRY,CITY_LAKE_EXIT,LAKE_CITY_ENTRY,LAKE_CITY_EXIT} from '../data/fishing-lake';
import {LAKE_HIGHLAND_EXIT,LAKE_HIGHLAND_RETURN,HIGHLAND_LAKE_PASSAGE,highlandArrivalPosition,highlandMineApproach} from '../data/highland';
import {ensureUndergroundWorld,undergroundArrival} from './underground';
import {UNDERGROUND} from '../data/underground-layout';
import {MINING_ENTRY,MINING_EXIT,MINE_HALL_RETURN} from '../data/mining-entry';
const center=(p:TilePoint)=>({x:(p.x+.5)*32,y:(p.y+.5)*32});
const now=(save:SaveData)=>(save.day-1)*1440+save.time;
const nextLeg:Partial<Record<BentoTravelLeg,BentoTravelLeg>>={'prepare':'shop-exit','survey':'explore','shop-back':'settle'};
export function ensureBentoTravel(save:SaveData):BentoTravelState{return save.bentoTravel??={version:1,seed:bentoSeed(save.profile.name),updatedAt:now(save)};}
export function bentoTripGoal(save:SaveData,trip:BentoTrip):TilePoint|undefined{
 const nav=bentoSmithNavigation(save),stop=nav.stops[3];
 switch(trip.leg){
  case'rescue-home-exit':return{x:HOME_INTERIOR_DOORWAY.x,y:HOME_INTERIOR_DOORWAY.y+8};
  case'rescue-property-out':return center(PROPERTY_VILLAGE_EXIT);
  case'prepare':case'shop-back':return{x:(stop.x+.5)*8,y:(stop.y+.5)*8};
  case'shop-exit':return nav.exit;
  case'unload':{const w=ensureBentoWork(save),kind=w.handling?.action==='deposit'?w.handling.kind:bentoDepositKind(w);return kind?bentoFixture(save,kind)?.point:undefined;}
  case'withdraw':{const job=ensureBentoWork(save).job;return job?bentoFixture(save,job.kind)?.point:undefined;}
  case'forge':return bentoFixture(save,'anvil')?.point;
  case'village-out':return center(VILLAGE_NORTH_GATE);
  case'city-out':return center(CITY_LAKE_EXIT);
  case'lake-out':return center(LAKE_HIGHLAND_EXIT);
  case'highland-out':return highlandMineApproach(save.highlandMapEdits);
  case'hall-out':return{x:UNDERGROUND.entryX+362,y:UNDERGROUND.entryY+174};
  case'survey':{const navigation=bentoMapNavigation(save,'mining');for(const[x,y]of[[79,165],[80,168],[77,168],[82,166],[76,164],[79,170]]){const p={x:x*32+16,y:y*32+16};if(navigation.fits(p))return p;}return;}
  case'mining-back':return{...MINING_EXIT};
  case'hall-back':return{x:UNDERGROUND.entryX+347,y:UNDERGROUND.entryY+470};
  case'highland-back':return{x:HIGHLAND_LAKE_PASSAGE.x,y:HIGHLAND_LAKE_PASSAGE.y-5};
  case'lake-back':return center(LAKE_CITY_EXIT);
  case'city-back':return center(CITY_FOREST_EXIT);
  case'village-back':return merchantOutside('bento');
 }
}
interface Portal{area:BentoTravelArea;spawn:TilePoint;leg:BentoTravelLeg}
function portal(save:SaveData,leg:BentoTravelLeg):Portal|undefined{
 switch(leg){
  case'rescue-home-exit':return{area:'property',spawn:{...HOME_OUTDOOR_SPAWN},leg:'rescue-property-out'};
  case'rescue-property-out':return{area:'village',spawn:center(save.villageMapEdits?.points?.entry??defaultMap('village').points!.entry!),leg:'village-back'};
  case'shop-exit':return{area:'village',spawn:merchantOutside('bento'),leg:'village-out'};
  case'village-out':return{area:'cityForest',spawn:center(CITY_FOREST_ENTRY),leg:'city-out'};
  case'city-out':return{area:'fishingLake',spawn:center(LAKE_CITY_ENTRY),leg:'lake-out'};
  case'lake-out':return{area:'highland',spawn:highlandArrivalPosition(save.highlandMapEdits),leg:'highland-out'};
  case'highland-out':ensureUndergroundWorld(save);return{area:'mine',spawn:undergroundArrival(),leg:'hall-out'};
  case'hall-out':return{area:'mining',spawn:{...MINING_ENTRY},leg:'survey'};
  case'mining-back':return{area:'mine',spawn:{...MINE_HALL_RETURN},leg:'hall-back'};
  case'hall-back':{const p=highlandMineApproach(save.highlandMapEdits);return p?{area:'highland',spawn:{x:p.x,y:p.y+20},leg:'highland-back'}:undefined;}
  case'highland-back':return{area:'fishingLake',spawn:center(LAKE_HIGHLAND_RETURN),leg:'lake-back'};
  case'lake-back':return{area:'cityForest',spawn:center(CITY_LAKE_ENTRY),leg:'city-back'};
  case'city-back':return{area:'village',spawn:center(VILLAGE_NORTH_ARRIVAL),leg:'village-back'};
  case'village-back':return{area:'shop',spawn:bentoSmithNavigation(save).entry,leg:'shop-back'};
 }
}

function finish(save:SaveData,state:BentoTravelState,trip:BentoTrip):void{
 const r=save.villageRoutines?.bento;if(r){Object.assign(r,{area:'shop',x:trip.x,y:trip.y,direction:trip.direction,stop:0,wait:1,serviceUntil:0,socialUntil:0,updatedAt:save.day*1440+save.time});delete r.roomOwner;}
 if(save.bentoRoutine)Object.assign(save.bentoRoutine,{area:'blacksmith-home',x:trip.x,y:trip.y,direction:trip.direction,stop:4,wait:1,doorway:false});
 if(trip.purpose==='rescue'&&save.mineRescue)save.mineRescue.stage='complete';
 if(!trip.purpose)state.lastCompletedDay=trip.day;endBentoParty(save,'returned');const expedition=save.bentoExpedition;if(expedition){expedition.health=100;expedition.grace=0;expedition.cooldown=0;delete expedition.safety;delete expedition.defense;}delete state.trip;
}
function start(save:SaveData,state:BentoTravelState,held:boolean):void{
 if(held||!bentoTripPending(save))return;const r=save.villageRoutines?.bento;
 if(!r||r.area!=='shop'||r.roomOwner&&r.roomOwner!=='bento')return;
 const navigation=bentoMapNavigation(save,'shop');if(!navigation.fits(r))return;
 state.lastAttemptDay=save.day;state.trip={day:save.day,area:'shop',leg:'prepare',x:r.x,y:r.y,direction:r.direction,route:[],index:0,distance:0,moving:false,wait:0,blocked:false};if(save.bentoExpedition?.invitation)joinBentoTrip(save);
}
/** One saved identity owns the journey; the ordinary merchant routine is suspended meanwhile. */
export function advanceBentoTravel(save:SaveData,seconds:number,player?:TilePoint,held=false,runtime?:BentoWorkRuntime):void{
 if(!Number.isFinite(seconds)||seconds<=0)return;const state=ensureBentoTravel(save),at=now(save);
 if(!state.trip){
  const r=save.villageRoutines?.bento,own=r?.area==='shop'&&(!r.roomOwner||r.roomOwner==='bento');
  if(runtime&&own&&!held){const work=ensureBentoWork(save);if(bentoDepositKind(work)){state.trip={day:save.day,area:'shop',leg:'unload',x:r!.x,y:r!.y,direction:r!.direction,route:[],index:0,distance:0,moving:false,wait:0,blocked:false,purpose:'workshop'};}}
  if(!state.trip&&runtime&&own&&!held&&bentoAvailability(save).open){const work=ensureBentoWork(save),full=work.depot.stone>=BENTO_WORK.depotStoneUnits||bentoIronUnits(work.depot)>=BENTO_WORK.depotIronUnits;if(full&&planBentoPersonalJob(save))state.trip={day:save.day,area:'shop',leg:work.job?.phase==='carrying'?'forge':'withdraw',x:r!.x,y:r!.y,direction:r!.direction,route:[],index:0,distance:0,moving:false,wait:0,blocked:false,purpose:'workshop'};}
  if(!state.trip)start(save,state,held);
  if(!state.trip&&runtime&&own&&!held&&bentoAvailability(save).open&&planBentoPersonalJob(save))state.trip={day:save.day,area:'shop',leg:ensureBentoWork(save).job?.phase==='carrying'?'forge':'withdraw',x:r!.x,y:r!.y,direction:r!.direction,route:[],index:0,distance:0,moving:false,wait:0,blocked:false,purpose:'workshop'};
  state.updatedAt=at;if(!state.trip)return;
 }
 if(runtime&&!state.trip.purpose)beginBentoWorkTrip(save,state.trip.day);
 let trip=state.trip;trip.moving=false;if(trip.leg==='rescue-dialogue'){state.updatedAt=at;return;}if(held){state.updatedAt=at;return;}
 const visible=bentoPlayerSpace(save)===trip.area;
 // Sleeping or another off-screen time jump advances the same path, not a destination snap.
 let budget=visible||activeBentoParty(save)||state.trip.area==='mining'?Math.min(seconds,.1):Math.min(300,Math.max(seconds,at-state.updatedAt));
 const initial=budget;
 let iterations=0;
 while(budget>1e-6&&state.trip&&iterations++<1200){
  trip=state.trip;
  if(at>=(trip.day-1)*1440+B.latestReturn&&['prepare','shop-exit','village-out','city-out','lake-out','highland-out','hall-out','survey','explore','inspect'].includes(trip.leg)){
   endBentoParty(save,'time');changeLeg(trip,bentoReturnLeg(trip.area));
  }
  if(!trip.transition&&runtime&&stepBentoSafety(save,trip,Math.min(.1,budget),runtime,player)){budget-=Math.min(.1,budget);break;}
  if(!trip.transition&&stepBentoParty(save,trip,Math.min(.1,budget),player)){trip.moving=trip.moving&&activeBentoParty(save)?.mode==='follow';budget-=Math.min(.1,budget);break;}
  if(trip.leg==='explore'&&runtime){
   trip.wait=0;const result=stepBentoMining(save,trip,Math.min(.1,budget),runtime,player);budget-=result.used;
   if(result.done){const work=ensureBentoWork(save),inspect=work.trip.blocks===0&&bentoMapNavigation(save,'mining').fits(trip);delete work.mining;changeLeg(trip,inspect?'inspect':'mining-back',inspect?B.explorationMinutes:0);if(!inspect){const p=activeBentoParty(save);if(p)p.mode='return';}continue;}break;
  }
  if(trip.leg==='unload'&&runtime&&!ensureBentoWork(save).handling&&!bentoDepositKind(ensureBentoWork(save))){
   if(trip.purpose==='rescue'&&save.mineRescue)save.mineRescue.stage='complete';if(!trip.purpose)state.lastCompletedDay=trip.day;trip.purpose='workshop';
   if(bentoAvailability(save).open&&planBentoPersonalJob(save)){changeLeg(trip,ensureBentoWork(save).job?.phase==='carrying'?'forge':'withdraw');continue;}
   changeLeg(trip,'settle',B.returnPreparationSeconds);continue;
  }
  if(trip.wait>0){const used=Math.min(budget,trip.wait);trip.wait=Math.max(0,trip.wait-used);budget-=used;if(trip.wait>1e-6)break;trip.wait=0;}
  if(trip.transition==='out'){
   const destination=portal(save,trip.leg);
   if(destination){const arrived={...trip,area:destination.area,x:destination.spawn.x,y:destination.spawn.y};
    if(bentoActorFits(save,arrived,destination.spawn,player)){trip.area=destination.area;trip.x=destination.spawn.x;trip.y=destination.spawn.y;changeLeg(trip,destination.leg);trip.transition='in';trip.wait=B.portalPause;if(bentoPlayerSpace(save)===trip.area)break;continue;}
   }
   trip.transition='in';trip.wait=B.portalPause;trip.blocked=true;continue;
  }
  if(trip.transition==='in'){delete trip.transition;}
  if(trip.leg==='explore'||trip.leg==='inspect'){changeLeg(trip,'mining-back');continue;}
  if(trip.leg==='settle'){finish(save,state,trip);break;}
  if(trip.blocked){trip.route=[];trip.index=0;trip.blocked=false;}
  const goal=bentoTripGoal(save,trip),navigation=bentoMapNavigation(save,trip.area);
  if(!goal){trip.blocked=true;trip.wait=B.routeRetrySeconds;break;}
  if(!trip.route.length){const result=planBentoRoute(save,trip,goal,{avoid:visible?player:undefined});if(result.planning)break;trip.route=result.route;trip.index=0;}
  if(!trip.route.length){trip.blocked=true;trip.wait=B.routeRetrySeconds;break;}
  const step=advanceWorldRoute(trip,budget,B.speed,(to,from)=>bentoActorFits(save,trip,to,player,navigation)&&navigation.allows(from,to));budget-=step.used;
  if(step.blocked){trip.blocked=true;trip.wait=B.routeRetrySeconds;trip.moving=false;break;}
  if(!step.arrived)break;
  if(runtime&&['unload','withdraw','forge'].includes(trip.leg)){
   const work=ensureBentoWork(save),dt=Math.min(.1,budget);trip.moving=false;
   const kind=trip.leg==='unload'?(work.handling?.kind??bentoDepositKind(work)):work.job?.kind;
   const result=trip.leg==='forge'?stepBentoForge(save,dt,runtime):kind?stepBentoHandling(save,kind,trip.leg==='unload'?'deposit':'withdraw',dt,runtime):'done';budget-=dt;
   if(result==='done'){
    if(trip.leg==='unload'){trip.route=[];trip.index=0;}
    else if(trip.leg==='withdraw')changeLeg(trip,'forge');
    else changeLeg(trip,'settle',B.returnPreparationSeconds);
   }else if(result==='blocked'){trip.wait=B.routeRetrySeconds;trip.blocked=true;}break;
  }
  if(trip.leg==='shop-back'&&runtime){changeLeg(trip,'unload');continue;}
  const next=nextLeg[trip.leg];
  if(next){changeLeg(trip,next,next==='explore'?B.explorationMinutes:next==='settle'?B.returnPreparationSeconds:B.preparationSeconds);continue;}
  if(portal(save,trip.leg)){trip.transition='out';trip.wait=B.portalPause;trip.moving=false;continue;}
  trip.blocked=true;trip.wait=B.routeRetrySeconds;break;
 }
 // Keep a bounded catch-up backlog off screen; loading/pausing never grants resources.
 state.updatedAt=visible?at:Math.min(at,state.updatedAt+(initial-budget));
}
