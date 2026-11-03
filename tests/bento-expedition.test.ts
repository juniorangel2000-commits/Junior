import {describe,it,expect,vi} from 'vitest';
import {createNewSave,validateSave,migrateSave} from '../src/systems/save';
import {createSmithLayout} from '../src/systems/smith-layout';
import {createCharacterProfile} from '../src/data/characters';
import {ensureBentoTravel,advanceBentoTravel} from '../src/systems/bento-travel';
import {bentoSmithNavigation,bentoMapNavigation} from '../src/systems/bento-navigation';
import {commandBento,joinBentoTrip,ensureBentoExpedition,activeBentoParty,bentoCommandOptions,stepBentoParty} from '../src/systems/bento-expedition';
import {stepBentoSafety} from '../src/systems/bento-defense';
import {ensureUndergroundWorld,undergroundFits} from '../src/systems/underground';
import {ensureMineHazards,UndergroundHazards,mineGasRegions,mineContaminated} from '../src/systems/underground-hazards';
import {bentoMineLit} from '../src/systems/bento-mine-safety';
import {mineFixedLights} from '../src/systems/underground-light';
import {advanceClock} from '../src/systems/clock';
import {BENTO_EXPEDITION as B} from '../src/data/bento-expedition';
import {MINING_ENTRY} from '../src/data/mining-entry';
import {CITY_LAKE_EXIT,LAKE_CITY_ENTRY} from '../src/data/fishing-lake';
import {MINE_SPINE} from '../src/data/underground-layout';
import {validBentoExpedition} from '../src/systems/bento-expedition-state';
import type {BentoTrip} from '../src/systems/bento-travel-state';
import type {SaveData,TilePoint} from '../src/types';
const runtime={write:validateSave};
const point=(p:TilePoint)=>({x:p.x*32+16,y:p.y*32+16});
function fresh(){const s=createNewSave(createCharacterProfile('Expedição Bento'));s.day=2;s.time=420;s.activeArea='village';s.blacksmithScene=createSmithLayout();s.blacksmithLayoutRevision=3;const nav=bentoSmithNavigation(s);s.blacksmithInterior={...nav.entry,direction:'up'};s.villageRoutines={bento:{area:'shop',...nav.entry,direction:'up',stop:0,wait:0,serviceUntil:0,socialUntil:0,socialDay:0}};return s;}
function road(){const s=fresh();delete s.blacksmithInterior;const t:BentoTrip=ensureBentoTravel(s).trip={day:2,area:'cityForest' as const,leg:'city-out' as const,x:1552,y:2192,direction:'up' as const,route:[],index:0,distance:0,moving:false,wait:0,blocked:false};s.activeArea='cityForest';joinBentoTrip(s);return{s,t};}
function gallery(){const{s,t}=road();ensureUndergroundWorld(s);s.activeArea='highland';s.miningInterior=true;s.mineInterior={...MINING_ENTRY,direction:'up'};Object.assign(t,{area:'mining',leg:'survey',...point(MINE_SPINE[1])});const h=ensureMineHazards(s.underground!,[t]);h.zombies=[];h.bats=[];return{s,t,h};}
const tick=(s:SaveData,p?:TilePoint)=>{Object.assign(s,advanceClock(s,.1));advanceBentoTravel(s,.1,p,false,runtime);};
describe('Bento optional joint expeditions',()=>{
 it('durably queues a shop invitation and joins the next real weekly trip without moving the player',()=>{
  const s=fresh(),p={x:s.villageRoutines!.bento!.x+30,y:s.villageRoutines!.bento!.y-10},before=structuredClone(s.inventory),position=structuredClone(s.blacksmithInterior);expect(commandBento(s,'invite',p,runtime).ok).toBe(true);expect(s.bentoTravel?.trip).toBeUndefined();expect(s.bentoExpedition!.invitation).toEqual({day:2});advanceBentoTravel(s,.1,p,false,runtime);expect(activeBentoParty(s)).toMatchObject({mode:'guide',tripDay:2,status:'active'});expect(s.bentoExpedition!.invitation).toBeUndefined();expect(s.blacksmithInterior).toEqual(position);expect(s.inventory).toEqual(before);expect(validateSave(s)).toBe(true);
 });
 it('cancels an invitation, refuses distant commands and rolls back rejected durable commands',()=>{
  const s=fresh(),p=s.villageRoutines!.bento!;const before=structuredClone(s);expect(commandBento(s,'invite',p,{write:()=>false}).ok).toBe(false);expect(s).toEqual(before);expect(commandBento(s,'invite',{x:0,y:0},runtime).ok).toBe(false);expect(commandBento(s,'invite',p,runtime).ok).toBe(true);expect(commandBento(s,'cancel-invite',p,runtime).ok).toBe(true);expect(s.bentoExpedition!.invitation).toBeUndefined();
 });
 it('lets Bento lead the road, waits for a distant companion and resumes when they catch up',()=>{
  const{s,t}=road(),before={x:t.x,y:t.y};expect(bentoCommandOptions(s).find(o=>o.id==='follow')!.enabled).toBe(false);expect(commandBento(s,'follow',{x:t.x+30,y:t.y},runtime).ok).toBe(false);for(let i=0;i<20;i++)tick(s,{x:before.x-240,y:before.y});expect({x:t.x,y:t.y}).toEqual(before);expect(activeBentoParty(s)!.regrouping).toBe(true);for(let i=0;i<30;i++)tick(s,{x:t.x-40,y:t.y+30});expect(Math.hypot(t.x-before.x,t.y-before.y)).toBeGreaterThan(5);expect(activeBentoParty(s)!.regrouping).toBe(false);
 });
 it('crosses only the real road portal, then waits on the far side for the companion',()=>{const{s,t}=road();const gate=point(CITY_LAKE_EXIT);Object.assign(t,gate);t.route=[gate];for(let i=0;i<15&&t.area==='cityForest';i++)tick(s,{x:t.x-32,y:t.y+20});expect(t.area).toBe('fishingLake');expect({x:t.x,y:t.y}).toEqual(point(LAKE_CITY_ENTRY));const arrived={x:t.x,y:t.y};for(let i=0;i<20;i++)tick(s,gate);expect({x:t.x,y:t.y}).toEqual(arrived);expect(activeBentoParty(s)!.regrouping).toBe(true);expect(s.activeArea).toBe('cityForest');s.activeArea='fishingLake';for(let i=0;i<1800&&Math.hypot(t.x-arrived.x,t.y-arrived.y)<4;i++)tick(s,{x:t.x+40,y:t.y+30});expect(Math.hypot(t.x-arrived.x,t.y-arrived.y),JSON.stringify(t)).toBeGreaterThan(3);});
 it('keeps explicit waiting in the same world position through save/continue and menus',()=>{
  let{s}=gallery();const p={x:s.bentoTravel!.trip!.x+35,y:s.bentoTravel!.trip!.y+25};expect(commandBento(s,'wait',p,runtime).ok).toBe(true);const before=structuredClone(s.bentoTravel!.trip!);s=migrateSave(JSON.parse(JSON.stringify(s)))!;for(let i=0;i<80;i++)tick(s,p);expect(s.bentoTravel!.trip!.x).toBe(before.x);expect(s.bentoTravel!.trip!.y).toBe(before.y);expect(activeBentoParty(s)!.mode).toBe('wait');const held=structuredClone(s);advanceBentoTravel(s,.1,p,true,runtime);expect(s.bentoTravel!.trip).toEqual(held.bentoTravel!.trip);expect(s.bentoExpedition).toEqual(held.bentoExpedition);expect(validateSave(s)).toBe(true);
 });
 it('allows player leadership inside the mine, following actual accessible paths with bounded movement',()=>{
  const{s,t}=gallery(),p={x:t.x+112,y:t.y+48};expect(undergroundFits(s.underground!,p.x,p.y)).toBe(true);expect(commandBento(s,'follow',{x:t.x+30,y:t.y},runtime).ok).toBe(true);const actor=s.bentoTravel!.trip!,before={x:actor.x,y:actor.y};for(let i=0;i<100;i++){const previous={x:actor.x,y:actor.y};tick(s,p);expect(Math.hypot(actor.x-previous.x,actor.y-previous.y)).toBeLessThanOrEqual(4.801);expect(undergroundFits(s.underground!,actor.x,actor.y)).toBe(true);}
  expect(Math.hypot(actor.x-before.x,actor.y-before.y)).toBeGreaterThan(30);expect(Math.hypot(actor.x-p.x,actor.y-p.y)).toBeLessThan(80);expect(activeBentoParty(s)!.mode).toBe('follow');expect(s.underground!.changes).toEqual({});
 });
 it('switches back to the suggested path and returns without forcing the player to leave',()=>{
  const{s,t}=gallery(),p={x:t.x+30,y:t.y};expect(commandBento(s,'follow',p,runtime).ok).toBe(true);expect(commandBento(s,'guide',p,runtime).ok).toBe(true);expect(s.bentoTravel!.trip!.leg).toBe('survey');expect(commandBento(s,'return',p,runtime).ok).toBe(true);expect(s.bentoTravel!.trip!.leg).toBe('mining-back');expect(activeBentoParty(s)!.mode).toBe('return');expect(s.activeArea).toBe('highland');expect(s.miningInterior).toBe(true);expect(s.mineInterior).toEqual({...MINING_ENTRY,direction:'up'});
 });
 it('ends a prolonged separation and physically heads back, preserving player exploration and NPC cargo',()=>{
  const{s,t}=road(),before=structuredClone(s.inventory);s.activeArea='property';for(let i=0;i<610;i++)tick(s);expect(s.bentoExpedition!.party).toMatchObject({status:'ended',reason:'separated'});expect(t.leg).toBe('city-back');expect(s.inventory).toEqual(before);expect(s.activeArea).toBe('property');
 });
 it('uses the same cave portal when a following player changes between the mine and its reception',()=>{
  const{s,t}=gallery();expect(commandBento(s,'follow',{x:t.x+30,y:t.y},runtime).ok).toBe(true);delete s.miningInterior;s.mineInterior={x:2538,y:5804,direction:'up'};tick(s,s.mineInterior);expect(s.bentoTravel!.trip!.leg).toBe('mining-back');expect(s.bentoTravel!.trip!.area).toBe('mining');
 });
 it('considers actual darkness, fixed lanterns and the player equipped lantern when following',()=>{
  const{s}=gallery(),deep=point(MINE_SPINE[6]);expect(bentoMineLit(s,deep)).toBe(false);s.inventory.lantern=1;expect(bentoMineLit(s,deep,{x:deep.x+32,y:deep.y})).toBe(true);expect(bentoMapNavigation(s,'mining',{mode:'follow',player:{x:deep.x+32,y:deep.y}}).fits(deep)).toBe(true);s.inventory.lantern=0;expect(bentoMapNavigation(s,'mining',{mode:'follow',player:deep}).fits(deep)).toBe(false);
  const lamp=mineFixedLights(s.underground!)[5],lit={x:lamp.x,y:lamp.y+24};expect(bentoMineLit(s,lit)).toBe(true);
 });
 it('does not enter contaminated air just to follow a player across it',()=>{
  const{s}=gallery(),gas=mineGasRegions(s.underground!)[0];expect(mineContaminated(s.underground!,gas)).toBe(true);expect(bentoMapNavigation(s,'mining',{mode:'follow',player:gas}).fits(gas)).toBe(false);const safe=point(MINE_SPINE[1]);expect(bentoMapNavigation(s,'mining',{mode:'escape',from:safe}).fits(gas)).toBe(false);
 });
 it('waits safely and ends companionship if no accessible following goal can be found',()=>{const{s,t}=gallery(),lamp=mineFixedLights(s.underground!)[5];t.x=lamp.x;t.y=lamp.y+24;const p={x:t.x,y:t.y+144};expect(undergroundFits(s.underground!,p.x,p.y)).toBe(true);expect(bentoMineLit(s,t)).toBe(true);const party=activeBentoParty(s)!;party.mode='follow';for(let i=0;i<610;i++)stepBentoParty(s,t,.1,p);expect(s.bentoExpedition!.party).toMatchObject({status:'ended',reason:'separated'});expect(t.leg).toBe('mining-back');expect(s.miningInterior).toBe(true);});
 it('accepts legacy saves and rejects invalid leadership, health, clocks and defense impact snapshots',()=>{
  const s=fresh();expect(validateSave(s)).toBe(true);const e=ensureBentoExpedition(s);expect(validBentoExpedition(e,s.day)).toBe(true);for(const change of[(s:SaveData)=>s.bentoExpedition!.health=0,(s:SaveData)=>s.bentoExpedition!.invitation={day:9},(s:SaveData)=>s.bentoExpedition!.cooldown=NaN]){const copy=structuredClone(s);change(copy);expect(validateSave(copy)).toBe(false);}
  expect(validBentoExpedition({...e,defense:{target:1,kind:'zombie',elapsed:.4,impacted:false,direction:'up'}})).toBe(false);
 });
});
describe('Bento safety and reactive defense',()=>{
 it('never initiates combat against distant zombies or peaceful bats',()=>{const{s,t,h}=gallery();h.zombies=[{id:1,x:t.x+170,y:t.y,hp:20,mode:'dormant',alert:0}];h.bats=[{id:100,x:t.x+20,y:t.y,hp:6,home:{x:t.x+20,y:t.y},mood:'peaceful',state:'flight',remaining:2}];const before=structuredClone(h);expect(stepBentoSafety(s,t,.1,runtime,{x:t.x+40,y:t.y})).toBe(false);expect(h.zombies).toEqual(before.zombies);expect(s.bentoExpedition?.defense).toBeUndefined();});
 it('uses a single native hammer impact only when threatened, persists it and gives no combat rewards',()=>{
  let{s,t,h}=gallery();h.zombies=[{id:1,x:t.x+24,y:t.y,hp:20,mode:'alert',alert:10}];const before=structuredClone({inventory:s.inventory,economy:s.economy6}),fx=vi.fn();stepBentoSafety(s,t,.1,{...runtime,onBentoDefense:fx},t);expect(s.bentoExpedition!.defense).toBeDefined();for(let i=0;i<3;i++)stepBentoSafety(s,t,.1,{...runtime,onBentoDefense:fx},t);expect(s.underground!.hazards!.zombies[0].hp).toBe(0);expect(fx).toHaveBeenCalledTimes(1);s=migrateSave(JSON.parse(JSON.stringify(s)))!;t=s.bentoTravel!.trip!;for(let i=0;i<5;i++)stepBentoSafety(s,t,.1,{...runtime,onBentoDefense:fx},t);expect(fx).toHaveBeenCalledTimes(1);expect({inventory:s.inventory,economy:s.economy6}).toEqual(before);expect(validateSave(s)).toBe(true);
 });
 it('does not commit a defensive hit or effect when saving fails',()=>{const{s,t,h}=gallery();h.zombies=[{id:1,x:t.x+24,y:t.y,hp:20,mode:'alert',alert:10}];stepBentoSafety(s,t,.1,runtime,t);const fx=vi.fn();for(let i=0;i<5;i++)stepBentoSafety(s,t,.1,{write:()=>false,onBentoDefense:fx},t);expect(s.underground!.hazards!.zombies[0].hp).toBe(20);expect(s.bentoExpedition!.defense!.impacted).toBe(false);expect(fx).not.toHaveBeenCalled();});
 it('abandons a cave-in warning by walking and survives without teleporting or changing the player',()=>{
  const{s,t,h}=gallery(),p={...MINING_ENTRY};h.cave={sequence:1,cooldown:35,active:{x:t.x,y:t.y,stage:'warning',remaining:2.8}};const before={x:t.x,y:t.y},model=new UndergroundHazards(()=>s.underground!);for(let i=0;i<40;i++){model.advance(.1,p,t);const previous={x:t.x,y:t.y,area:t.area};tick(s,p);if(t.area===previous.area){expect(Math.hypot(t.x-previous.x,t.y-previous.y)).toBeLessThanOrEqual(B.fleeSpeed*.1+.001);expect(undergroundFits(s.underground!,t.x,t.y)).toBe(true);}}expect(Math.hypot(t.x-before.x,t.y-before.y)).toBeGreaterThan(60);expect(s.bentoExpedition!.health).toBe(100);expect(h.hp).toBe(100);expect(s.bentoExpedition!.party).toMatchObject({status:'ended',reason:'danger'});
 });
 it('takes native damage and physically escapes an extreme encounter through the real mine portal',()=>{
  const{s,t,h}=gallery(),p={...MINING_ENTRY};const e=ensureBentoExpedition(s);e.health=16;h.zombies=[{id:1,x:t.x+18,y:t.y,hp:20,mode:'alert',alert:10},{id:2,x:t.x-60,y:t.y,hp:20,mode:'alert',alert:10}];const model=new UndergroundHazards(()=>s.underground!);let escaped=false;
  for(let i=0;i<3000;i++){const actor=s.bentoTravel?.trip;if(!actor)break;const before={x:actor.x,y:actor.y,area:actor.area};if(actor.area==='mining')model.advance(.1,p,actor);tick(s,p);if(actor.area==='mining'&&before.area===actor.area){expect(Math.hypot(actor.x-before.x,actor.y-before.y)).toBeLessThanOrEqual(B.fleeSpeed*.1+.001);expect(undergroundFits(s.underground!,actor.x,actor.y)).toBe(true);}if(actor.area==='mine'){escaped=true;break;}}
  expect(escaped,JSON.stringify({trip:s.bentoTravel!.trip,exp:s.bentoExpedition})).toBe(true);expect(s.bentoExpedition!.health).toBeGreaterThan(0);expect(s.bentoExpedition!.health).toBeLessThan(16);expect(s.activeArea).toBe('highland');expect(s.miningInterior).toBe(true);expect(validateSave(s)).toBe(true);
 },30000);
 it('moves out of immediate danger promptly in deep galleries before planning the long escape route',()=>{const{s,t,h}=gallery();Object.assign(t,point(MINE_SPINE[6]));ensureBentoExpedition(s).health=16;h.zombies=[{id:1,x:t.x+18,y:t.y,hp:20,mode:'alert',alert:10},{id:2,x:t.x-60,y:t.y,hp:20,mode:'alert',alert:10}];const observer={...MINING_ENTRY},model=new UndergroundHazards(()=>s.underground!);let movedAt=0;for(let i=0;i<40;i++){model.advance(.1,observer,t);const before={x:t.x,y:t.y};tick(s,observer);if(Math.hypot(t.x-before.x,t.y-before.y)>1&&!movedAt)movedAt=i+1;expect(undergroundFits(s.underground!,t.x,t.y)).toBe(true);}expect(movedAt).toBeGreaterThan(0);expect(movedAt).toBeLessThan(20);expect(s.bentoExpedition!.health).toBeGreaterThan(0);});
 it('completes a physical retreat from the deep galleries to the mine reception',()=>{const{s,t,h}=gallery();Object.assign(t,point(MINE_SPINE[6]));ensureBentoExpedition(s).health=24;h.zombies=[{id:1,x:t.x+18,y:t.y,hp:20,mode:'alert',alert:10}];const observer={...MINING_ENTRY},model=new UndergroundHazards(()=>s.underground!);let escaped=false;for(let i=0;i<5000;i++){const actor=s.bentoTravel!.trip!;if(actor.area==='mining')model.advance(.1,observer,actor);tick(s,observer);if(actor.area==='mine'){escaped=true;break;}}expect(escaped,JSON.stringify({trip:s.bentoTravel!.trip,exp:s.bentoExpedition})).toBe(true);expect(s.bentoExpedition!.health).toBeGreaterThan(0);expect(validateSave(s)).toBe(true);},30000);
 it('reacts to an aggressive diving bat while leaving peaceful bats alone',()=>{const{s,t,h}=gallery();h.bats=[{id:100,x:t.x+18,y:t.y,hp:6,home:{x:t.x+18,y:t.y},mood:'aggressive',state:'dive',remaining:.5,struck:false}];stepBentoSafety(s,t,.1,runtime,t);expect(s.bentoExpedition!.health).toBe(97);expect(s.bentoExpedition!.defense?.kind).toBe('bat');expect(h.bats[0].struck).toBe(true);expect(s.bentoExpedition!.party).toMatchObject({status:'ended',reason:'danger'});});
 it('persists a cave impact on Bento so reloading cannot repeat its damage',()=>{let{s,t,h}=gallery();h.cave={sequence:3,cooldown:35,active:{x:t.x,y:t.y,stage:'impact',remaining:.7}};stepBentoSafety(s,t,.1,runtime,{x:t.x+100,y:t.y});expect(s.bentoExpedition!.health).toBe(55);s=migrateSave(JSON.parse(JSON.stringify(s)))!;t=s.bentoTravel!.trip!;stepBentoSafety(s,t,.1,runtime,{x:t.x+100,y:t.y});expect(s.bentoExpedition!.health).toBe(55);expect(s.bentoExpedition!.caveHit).toBe(3);expect(s.underground!.hazards!.hp).toBe(100);});
 it('runs native threats around Bento off-screen without reducing the saved player health',()=>{const{s,t,h}=gallery();s.activeArea='property';delete s.mineInterior;delete s.miningInterior;h.hp=47;h.zombies=[{id:1,x:t.x+110,y:t.y,hp:20,mode:'dormant',alert:0}];const before=h.zombies[0].x;for(let i=0;i<6;i++)stepBentoSafety(s,t,.1,runtime);expect(h.zombies[0].x).toBeLessThan(before);expect(h.hp).toBe(47);});
});
