import {describe,it,expect} from 'vitest';
import {createNewSave,validateSave,migrateSave} from '../src/systems/save';
import {createCharacterProfile} from '../src/data/characters';
import {advanceClock} from '../src/systems/clock';
import {bentoSmithNavigation,bentoMapNavigation,bentoRoute} from '../src/systems/bento-navigation';
import {advanceBentoTravel,bentoTripGoal} from '../src/systems/bento-travel';
import {bentoMineDay,bentoAvailability,bentoSeed} from '../src/systems/bento-schedule';
import {BENTO_WEEKLY_PLAN as B} from '../src/data/bento-schedule';
import {validBentoTravel} from '../src/systems/bento-travel-state';
import {mineGasRegions,ensureMineHazards} from '../src/systems/underground-hazards';
import {ensureUndergroundWorld} from '../src/systems/underground';
import {mineProtectedActors} from '../src/systems/underground-renewal';
import {CITY_LAKE_EXIT,LAKE_CITY_ENTRY} from '../src/data/fishing-lake';
import {reserveTool,reserveSmelt,orderAction,startOwnSmelt,gameMinute,fulfillContract} from '../src/systems/economy';
import {performVillageService} from '../src/systems/village-services';
const fresh=()=>{const s=createNewSave(createCharacterProfile('Bento QA'));s.day=2;s.time=7*60;s.activeArea='property';const nav=bentoSmithNavigation(s);s.villageRoutines={bento:{area:'shop',...nav.entry,direction:'up',stop:0,wait:0,serviceUntil:0,socialUntil:0,socialDay:0}};return s;};
function road(){const s=fresh();advanceBentoTravel(s,.1);Object.assign(s.bentoTravel!.trip!,{area:'cityForest',leg:'city-out',x:1552,y:2192,route:[],index:0,wait:0,moving:false});return s;}
describe('Bento weekly travelling routine',()=>{
 it('uses two regular weekly days and a reproducible occasional third day',()=>{
  const seed=bentoSeed('Bento QA');for(let week=0;week<20;week++){const visits=Array.from({length:7},(_,i)=>bentoMineDay(week*7+i+1,seed));expect(visits[1]).toBe(true);expect(visits[4]).toBe(true);expect(visits.filter(Boolean).length).toBeGreaterThanOrEqual(2);expect(visits.filter(Boolean).length).toBeLessThanOrEqual(3);expect(visits).toEqual(Array.from({length:7},(_,i)=>bentoMineDay(week*7+i+1,seed)));}
 });
 it('walks every map outward and back, keeps movement bounded, uses only portals and grants no inventory',()=>{
  const s=fresh(),inventory=structuredClone(s.inventory),visited=new Set<string>();let completed=false;let previous:undefined|{x:number;y:number;area:string;at:number};
  for(let i=0;i<12000;i++){
   Object.assign(s,advanceClock(s,.1));advanceBentoTravel(s,.1);const trip=s.bentoTravel?.trip;
   if(trip){visited.add(trip.area+':'+trip.leg);expect(bentoMapNavigation(s,trip.area).fits(trip),trip.leg+':'+trip.x+','+trip.y).toBe(true);if(previous?.area===trip.area)expect(Math.hypot(previous.x-trip.x,previous.y-trip.y)).toBeLessThanOrEqual(B.speed*Math.max(.1,s.bentoTravel!.updatedAt-previous.at)+.001);previous={x:trip.x,y:trip.y,area:trip.area,at:s.bentoTravel!.updatedAt};}
   if(s.bentoTravel?.lastCompletedDay===2){completed=true;break;}
  }
  expect(completed,JSON.stringify({trip:s.bentoTravel?.trip,goal:s.bentoTravel?.trip&&bentoTripGoal(s,s.bentoTravel.trip),visited:[...visited]})).toBe(true);
  for(const area of ['shop','village','cityForest','fishingLake','highland','mine','mining'])expect([...visited].some(v=>v.startsWith(area+':')),area).toBe(true);
  expect(s.inventory).toEqual(inventory);expect(s.mineInterior).toBeUndefined();expect(s.miningInterior).toBeUndefined();expect(s.underground?.changes).toEqual({});expect(s.villageRoutines!.bento).toMatchObject({area:'shop'});expect(validateSave(s)).toBe(true);
 },90000);
 it('closes the workshop throughout a trip and does not re-create the same day after return',()=>{
  const s=fresh();advanceBentoTravel(s,.1);expect(bentoAvailability(s).open).toBe(false);expect(s.bentoTravel!.lastAttemptDay).toBe(2);
  delete s.bentoTravel!.trip;s.time=8*60;advanceBentoTravel(s,.1);expect(s.bentoTravel!.trip).toBeUndefined();expect(bentoAvailability(s).open).toBe(true);
 });
 it('never catches up a visible actor in one jump, even after changing day/hour',()=>{
  const s=road();s.activeArea='cityForest';let p={x:s.bentoTravel!.trip!.x,y:s.bentoTravel!.trip!.y};
  s.time+=90;for(let i=0;i<120;i++){Object.assign(s,advanceClock(s,.1));advanceBentoTravel(s,.1);const trip=s.bentoTravel!.trip!;expect(Math.hypot(trip.x-p.x,trip.y-p.y)).toBeLessThanOrEqual(B.speed*.1+.001);p={x:trip.x,y:trip.y};}
  s.day++;s.time=480;advanceBentoTravel(s,.1);const trip=s.bentoTravel!.trip!;expect(Math.hypot(trip.x-p.x,trip.y-p.y)).toBeLessThanOrEqual(B.speed*.1+.001);expect(trip.leg).toBe('city-back');
 });
 it('waits at the real portal when the arrival is occupied, then fades into the matching entrance',()=>{
  const s=road(),trip=s.bentoTravel!.trip!;trip.x=(CITY_LAKE_EXIT.x+.5)*32;trip.y=(CITY_LAKE_EXIT.y+.5)*32;trip.route=[{x:trip.x,y:trip.y}];s.activeArea='fishingLake';const player={x:(LAKE_CITY_ENTRY.x+.5)*32,y:(LAKE_CITY_ENTRY.y+.5)*32};
  for(let i=0;i<20;i++){Object.assign(s,advanceClock(s,.1));advanceBentoTravel(s,.1,player);}expect(trip.area).toBe('cityForest');
  for(let i=0;i<50&&trip.area==='cityForest';i++){Object.assign(s,advanceClock(s,.1));advanceBentoTravel(s,.1,{x:player.x-100,y:player.y});}
  expect(trip.area).toBe('fishingLake');expect(trip.x).toBe(player.x);expect(trip.y).toBe(player.y);expect(trip.transition).toBe('in');expect(trip.moving).toBe(false);
 });
 it('persists the route, exact position, weekday decision and progress through reload without restarting',()=>{
  const s=road();s.activeArea='cityForest';for(let i=0;i<90;i++){Object.assign(s,advanceClock(s,.1));advanceBentoTravel(s,.1);}const before=structuredClone(s.bentoTravel),loaded=migrateSave(JSON.parse(JSON.stringify(s)))!;
  expect(loaded.bentoTravel).toEqual(before);expect(validateSave(loaded)).toBe(true);advanceBentoTravel(loaded,.1);expect(loaded.bentoTravel!.trip!.day).toBe(2);expect(loaded.bentoTravel!.lastAttemptDay).toBe(2);expect(Math.hypot(loaded.bentoTravel!.trip!.x-before!.trip!.x,loaded.bentoTravel!.trip!.y-before!.trip!.y)).toBeLessThanOrEqual(4.801);
 });
 it('does not move, create resources or advance a route while paused or held in conversation',()=>{
  const s=road(),before=structuredClone(s);for(const dt of[0,-1,NaN])advanceBentoTravel(s,dt);expect(s).toEqual(before);advanceBentoTravel(s,.1,undefined,true);expect(s.bentoTravel!.trip).toEqual(before.bentoTravel!.trip);expect(s.inventory).toEqual(before.inventory);
 });
 it('leaves non-trip days to the existing routine and can start the next regular trip',()=>{
  const s=fresh();s.day=3;s.time=480;advanceBentoTravel(s,.1);expect(s.bentoTravel!.trip).toBeUndefined();s.day=5;s.time=420;advanceBentoTravel(s,.1);expect(s.bentoTravel!.trip?.day).toBe(5);expect(s.bentoTravel!.lastAttemptDay).toBe(5);
 });
 it('recognizes contaminated passages and reserves the real NPC position against renewal',()=>{
  const s=road(),mine=ensureUndergroundWorld(s),gas=mineGasRegions(mine)[0];expect(bentoMapNavigation(s,'mining').fits(gas)).toBe(false);expect(bentoRoute(s,'mining',{x:2544,y:5488},gas)).toEqual([]);
  Object.assign(s.bentoTravel!.trip!,{area:'mining',leg:'survey',x:2544,y:5488,route:[],index:0});expect(mineProtectedActors(s)).toContain(s.bentoTravel!.trip);expect(s.mineInterior).toBeUndefined();expect(s.miningInterior).toBeUndefined();
 });
 it('chooses a safe survey stop when a zombie occupies the centre of the first gallery',()=>{
  const s=road(),mine=ensureUndergroundWorld(s),hazards=ensureMineHazards(mine);hazards.zombies=[{id:1,x:2544,y:5296,hp:20,mode:'dormant',alert:0}];Object.assign(s.bentoTravel!.trip!,{area:'mining',leg:'survey',x:2544,y:5488,route:[],index:0});const goal=bentoTripGoal(s,s.bentoTravel!.trip!);expect(goal).toBeDefined();expect(goal).not.toEqual({x:2544,y:5296});expect(bentoMapNavigation(s,'mining').fits(goal!)).toBe(true);
 });
 it('rejects malformed or inconsistent travel states and accepts legacy saves without the extension',()=>{
  const s=road();expect(validBentoTravel(s.bentoTravel)).toBe(true);expect(validateSave(s)).toBe(true);
  for(const change of[(s:ReturnType<typeof road>)=>{s.bentoTravel!.trip!.area='shop';},(s:ReturnType<typeof road>)=>{s.bentoTravel!.trip!.index=9999;},(s:ReturnType<typeof road>)=>{s.bentoTravel!.trip!.x=NaN;},(s:ReturnType<typeof road>)=>{s.bentoTravel!.lastAttemptDay=999999;},(s:ReturnType<typeof road>)=>{(s.bentoTravel as unknown as {trip:unknown}).trip=null;}]){const copy=structuredClone(s);change(copy);expect(validateSave(copy)).toBe(false);}delete s.bentoTravel;expect(validateSave(s)).toBe(true);
 });
 it('blocks all smith services and paid-order transactions while he is absent, preserving balances',()=>{
  const s=fresh();s.time=480;s.inventory.pickaxe=1;s.inventory.wood=50;s.inventory.ironIngot=20;s.inventory.ironOre=3;expect(reserveSmelt(s,'iron',1).ok).toBe(true);const id=s.economy6!.orders[0].id;expect(orderAction(s,id,'pay').ok).toBe(true);s.time+=s.economy6!.orders[0].readyAt-gameMinute(s)+1;
  advanceBentoTravel(s,.1);const before=structuredClone(s);for(const action of[()=>reserveTool(s,'pickaxe',1),()=>reserveSmelt(s,'iron',1),()=>orderAction(s,id,'collect'),()=>performVillageService(s,'repair-pickaxe'),()=>fulfillContract(s,'bento')]){const result=action();expect(result.ok).toBe(false);expect(result.message).toMatch(/Bento|ferraria|mina/i);expect(s).toEqual(before);}
  expect(startOwnSmelt(s,'iron',1).ok).toBe(true);expect(s.economy6!.orders.some(o=>o.station==='own')).toBe(true);
 });
});
