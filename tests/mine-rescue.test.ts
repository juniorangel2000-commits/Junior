import {describe,it,expect} from 'vitest';
import {createNewSave,validateSave,migrateSave} from '../src/systems/save';
import {createCharacterProfile} from '../src/data/characters';
import {ensureUndergroundWorld} from '../src/systems/underground';
import {ensureMineHazards} from '../src/systems/underground-hazards';
import {recoverMineDefeat} from '../src/systems/underground-recovery';
import {acknowledgeMineRescue,rescueHomePlacement,rescueDialogue} from '../src/systems/mine-rescue-state';
import {advanceBentoTravel,bentoTripGoal} from '../src/systems/bento-travel';
import {bentoMapNavigation,bentoRoute,bentoSegment,bentoPlayerSpace} from '../src/systems/bento-navigation';
import {prepareVillageRoutines} from '../src/systems/village-background';
import {bentoAvailability} from '../src/systems/bento-schedule';
import {ensureBentoWork} from '../src/systems/bento-stock';
import {Home,HOME_INTERIOR_DOORWAY} from '../src/systems/home';
import {advanceClock,MAX_DAY} from '../src/systems/clock';
const fallen=()=>{const s=createNewSave(createCharacterProfile('Resgate QA'));s.day=3;s.time=600;s.activeArea='highland';const mine=ensureUndergroundWorld(s);ensureMineHazards(mine).hp=0;s.miningInterior=true;s.mineInterior={x:2544,y:5296};mine.expedition={id:1,inside:true,enteredDay:3};return s;};
describe('phase 9 persistent Bento rescue',()=>{
 it('commits all carried losses once, preserves permanent/private/base possessions and advances native time even on a non-mining day',()=>{
  const s=fallen();s.inventory.wood=81;s.inventory.ironOre=7;s.inventory.bandage=2;s.inventory.pickaxe=1;s.inventory.sword=1;s.inventory.fishingRod=1;
  const work=ensureBentoWork(s);work.depot.stone=22;work.pack.stone=3;work.ledger.collected.stone=25;const privateBefore=structuredClone(work),world=structuredClone(s.underground!.changes),home=structuredClone(new Home(s.home).data),economy=structuredClone(s.economy6);
  expect(recoverMineDefeat(s,validateSave)).toBe(true);expect(s.time).toBe(720);expect(s.mineRescue).toMatchObject({stage:'waking',elapsedMinutes:120,count:1});expect(s.inventory).toMatchObject({wood:0,ironOre:0,bandage:0,pickaxe:1,sword:1,fishingRod:1});expect(s.bentoWork).toEqual(privateBefore);expect(s.home).toEqual(home);expect(s.economy6).toEqual(economy);expect(s.underground!.changes).toEqual(world);expect(s.bentoTravel!.trip).toMatchObject({area:'home',leg:'rescue-dialogue',purpose:'rescue'});expect(bentoAvailability(s).open).toBe(false);
  const after=structuredClone(s);expect(recoverMineDefeat(s,()=>true)).toBe(false);expect(s).toEqual(after);expect(validateSave(s)).toBe(true);
 });
 it('is atomic on false/throw and does not restart or advance time on load',()=>{
  const s=fallen(),before=structuredClone(s);expect(recoverMineDefeat(s,()=>false)).toBe(false);expect(s).toEqual(before);expect(recoverMineDefeat(s,()=>{throw Error('quota');})).toBe(false);expect(s).toEqual(before);
  expect(recoverMineDefeat(s,validateSave)).toBe(true);const loaded=migrateSave(JSON.parse(JSON.stringify(s)))!;expect(loaded.mineRescue).toEqual(s.mineRescue);expect(loaded.time).toBe(s.time);expect(loaded.bentoTravel!.trip).toEqual(s.bentoTravel!.trip);
  const pending=structuredClone(loaded);advanceBentoTravel(loaded,100);expect(loaded.bentoTravel!.trip).toEqual(pending.bentoTravel!.trip);
  expect(acknowledgeMineRescue(loaded,()=>false)).toBe(false);expect(loaded).toEqual(pending);expect(acknowledgeMineRescue(loaded,validateSave)).toBe(true);expect(loaded.mineRescue!.stage).toBe('leaving');const ack=structuredClone(loaded);expect(acknowledgeMineRescue(loaded,()=>true)).toBe(false);expect(loaded).toEqual(ack);
 });
 it('uses the moved owned bed and puts both bodies on reachable, non-overlapping floor with a walkable door route',()=>{
  const s=fallen(),home=new Home(s.home),bed=home.data.furniture.find(f=>f.kind==='bed')!;expect(home.apply({type:'move',id:bed.id,x:6,y:2},{x:5,y:8}).ok).toBe(true);s.home=home.data;
  expect(recoverMineDefeat(s,validateSave)).toBe(true);expect(s.mineRescue!.bedId).toBe(bed.id);expect(home.bedNear({x:s.homePosition!.x/32,y:s.homePosition!.y/32},2)).toBeDefined();const b=s.bentoTravel!.trip!;expect(bentoMapNavigation(s,'home').fits(b)).toBe(true);expect(Math.hypot(b.x-s.homePosition!.x,b.y-s.homePosition!.y)).toBeGreaterThanOrEqual(30);
  const goal={x:HOME_INTERIOR_DOORWAY.x,y:HOME_INTERIOR_DOORWAY.y+8},route=bentoRoute(s,'home',b,goal);expect(route.length).toBeGreaterThan(0);let from=b;for(const point of route){expect(bentoSegment(bentoMapNavigation(s,'home'),from,point)).toBe(true);from={...b,...point};}expect(rescueHomePlacement(home)).toBeDefined();
 });
 it('crosses midnight safely, clamps the last supported day and varies only on actual committed rescues',()=>{
  const s=fallen();s.time=1430;expect(recoverMineDefeat(s,validateSave)).toBe(true);expect(s.day).toBe(4);expect(s.time).toBe(110);const first=rescueDialogue(s);s.mineRescue!.stage='complete';s.activeArea='highland';delete s.homePosition;s.underground!.hazards!.hp=0;expect(recoverMineDefeat(s,validateSave)).toBe(true);expect(s.mineRescue!.count).toBe(2);expect(rescueDialogue(s)).not.toEqual(first);
  const edge=fallen();edge.day=MAX_DAY;edge.time=1439;edge.underground!.expedition!.enteredDay=MAX_DAY;expect(recoverMineDefeat(edge,validateSave)).toBe(true);expect(edge.day).toBe(MAX_DAY);expect(edge.time).toBeLessThan(1440);expect(edge.mineRescue!.elapsedMinutes).toBeCloseTo(.999,3);
 });
 it('returns the same actor physically through home, property, village and smithy without snapping or granting player resources',()=>{
  const s=fallen();prepareVillageRoutines(s);expect(recoverMineDefeat(s,validateSave)).toBe(true);expect(acknowledgeMineRescue(s,validateSave)).toBe(true);
  const inv=structuredClone(s.inventory),seen=new Set<string>();let complete=false;
  for(let i=0;i<18000;i++){
   const previous=s.bentoTravel?.trip&&structuredClone(s.bentoTravel.trip);Object.assign(s,advanceClock(s,.1));advanceBentoTravel(s,.1);const trip=s.bentoTravel?.trip;
   if(trip){seen.add(trip.area);expect(bentoMapNavigation(s,trip.area).fits(trip),JSON.stringify(trip)).toBe(true);if(previous?.area===trip.area&&bentoPlayerSpace(s)===trip.area)expect(Math.hypot(trip.x-previous.x,trip.y-previous.y)).toBeLessThanOrEqual(4.801);}
   else{complete=true;break;}
  }
  expect(complete,JSON.stringify({trip:s.bentoTravel?.trip,goal:s.bentoTravel?.trip&&bentoTripGoal(s,s.bentoTravel.trip),seen:[...seen]})).toBe(true);expect([...seen]).toEqual(expect.arrayContaining(['home','property','village','shop']));expect(s.mineRescue!.stage).toBe('complete');expect(s.villageRoutines!.bento!.area).toBe('shop');expect(s.inventory).toEqual(inv);expect(validateSave(s)).toBe(true);
 },30000);
 it('rejects malformed optional state while keeping saves from older phases compatible',()=>{
  const s=fallen();expect(validateSave(s)).toBe(true);expect(recoverMineDefeat(s,validateSave)).toBe(true);
  for(const change of[(x:typeof s)=>{x.mineRescue!.elapsedMinutes=-1;},(x:typeof s)=>{x.mineRescue!.variant=3;},(x:typeof s)=>{x.mineRescue!.day=x.day+1;},(x:typeof s)=>{x.bentoTravel!.trip!.area='shop';}]){const draft=structuredClone(s);change(draft);expect(validateSave(draft)).toBe(false);}
 });
});
