import type {ItemId} from '../src/types';
import {describe,it,expect} from 'vitest';
import {createNewSave,validateSave} from '../src/systems/save';
import {initializePetShelter,SHELTER_STEPS,shelterUpgrade,canAdoptPet,homePet,validPetShelter,shelterSolid,deliverShelterMaterial} from '../src/systems/pet-shelter';
import {applyDungeonResult} from '../src/dungeons/progression';
import {performVillageService} from '../src/systems/village-services';
import {Inventory} from '../src/systems/inventory';
import {craft} from '../src/systems/crafting';
import {DungeonRun} from '../src/dungeons/run';
import {createDungeonProgress} from '../src/dungeons/progression';
import {createResidentBrain,stepResident} from '../src/dungeons/shelter-residents';
import {validWorldPetState} from '../src/dungeons/world-pet-state';
const fresh=()=>createNewSave({name:'Abrigo',skin:'#e9bc98',hairColor:'#563b2c',outfit:'#457398',hairStyle:'preso'});
const reward=(id:string)=>({id,dungeon:'mall-parking' as const,outcome:'victory' as const,elapsed:900,kills:100,foundPet:'cat' as const});
describe('pet shelter',()=>{
 it('requires three paid repairs, keeps the hammer and rejects repeated or incomplete upgrades atomically',()=>{
  const s=fresh();initializePetShelter(s);expect(s.petShelter?.stage).toBe(0);
  const before=structuredClone(s);expect(shelterUpgrade(s).ok).toBe(false);expect(s).toEqual(before);
  s.inventory.hammer=1;
  for(let stage=0;stage<3;stage++){
   expect(canAdoptPet(s)).toBe(false);
   Object.assign(s.inventory,SHELTER_STEPS[stage].cost);
   expect(shelterUpgrade(s).ok).toBe(true);expect(s.petShelter?.stage).toBe(stage+1);
   for(const id of Object.keys(SHELTER_STEPS[stage].cost))expect(s.inventory[id as ItemId]).toBe(0);
   expect(s.inventory.hammer).toBe(1);
  }
  expect(canAdoptPet(s)).toBe(true);const done=structuredClone(s);expect(shelterUpgrade(s).ok).toBe(false);expect(s).toEqual(done);expect(validateSave(s)).toBe(true);
 });
 it('saves separate partial deliveries without a hammer and charges only the remainder on completion',()=>{
  const s=fresh();initializePetShelter(s);Object.assign(s.inventory,{plank:6,stone:8,cord:2});
  expect(deliverShelterMaterial(s,'plank',2).ok).toBe(true);
  expect(s.inventory.plank).toBe(4);expect(s.petShelter!.delivered).toEqual({plank:2});
  expect(validateSave(JSON.parse(JSON.stringify(s)))).toBe(true);
  expect(shelterUpgrade(s).ok).toBe(false);
  expect(deliverShelterMaterial(s,'stone',8).ok).toBe(true);
  expect(deliverShelterMaterial(s,'plank',4).ok).toBe(true);
  s.inventory.hammer=1;
  expect(shelterUpgrade(s).ok).toBe(true);
  expect(s.petShelter!.stage).toBe(1);expect(s.petShelter!.delivered).toEqual({});
  expect(s.inventory.plank+s.inventory.stone+s.inventory.cord).toBe(0);expect(s.inventory.hammer).toBe(1);
  expect(validateSave(s)).toBe(true);
 });
 it('supports individual deliveries and completion in every repair stage',()=>{
  const s=fresh();initializePetShelter(s);s.inventory.hammer=1;
  for(let stage=0;stage<3;stage++){
   for(const [id,total] of Object.entries(SHELTER_STEPS[stage].cost)){
    const item=id as ItemId;s.inventory[item]=total!;
    expect(deliverShelterMaterial(s,item,1).ok).toBe(true);
    expect(validateSave(s)).toBe(true);
    expect(deliverShelterMaterial(s,item,total!-1).ok).toBe(true);
    expect(s.inventory[item]).toBe(0);
   }
   expect(shelterUpgrade(s).ok).toBe(true);expect(s.petShelter!.stage).toBe(stage+1);
   expect(s.petShelter!.delivered).toEqual({});expect(validateSave(s)).toBe(true);
  }
 });
 it('rejects wrong materials, invalid amounts and repeated deliveries without losing stock',()=>{
  const s=fresh();initializePetShelter(s);s.inventory.plank=3;
  for(const [id,amount] of [['board',1],['plank',0],['plank',-1],['plank',1.5],['plank',7],['plank',4],['plank',NaN]] as const){
   const before=structuredClone(s);expect(deliverShelterMaterial(s,id,amount).ok).toBe(false);expect(s).toEqual(before);
  }
  expect(deliverShelterMaterial(s,'plank',3).ok).toBe(true);s.inventory.plank=6;
  expect(deliverShelterMaterial(s,'plank',3).ok).toBe(true);
  const before=structuredClone(s);expect(deliverShelterMaterial(s,'plank',1).ok).toBe(false);expect(s).toEqual(before);
 });
 it('accepts old shelter saves but rejects corrupt or out-of-stage deposits',()=>{
  const base={stage:0,x:960,y:352};expect(validPetShelter(base)).toBe(true);
  expect(validPetShelter({...base,delivered:{plank:3,cord:2}})).toBe(true);
  for(const delivered of [null,[],{plank:-1},{plank:7},{plank:1.5},{board:1},{hammer:1},{plank:'2'}])
   expect(validPetShelter({...base,delivered})).toBe(false);
  expect(validPetShelter({...base,stage:3,delivered:{plank:1}})).toBe(false);
 });
 it('rejects adoption before completion, accepts three, preserves existing pets and rejects the fourth',()=>{
  const s=fresh();initializePetShelter(s);applyDungeonResult(s,reward('locked'));expect(s.dungeons!.pets).toHaveLength(0);
  s.petShelter!.stage=3;
  for(let n=0;n<3;n++)applyDungeonResult(s,reward('pet-'+n));
  expect(s.dungeons!.pets).toHaveLength(3);expect(s.dungeons!.pets.every(p=>p.world?.mode==='shelter')).toBe(true);
  const ids=s.dungeons!.pets.map(p=>p.id);applyDungeonResult(s,reward('fourth'));expect(s.dungeons!.pets.map(p=>p.id)).toEqual(ids);expect(canAdoptPet(s)).toBe(false);expect(validateSave(s)).toBe(true);
 });
 it('does not place over existing player crops, buildings or map edits',()=>{
  const s=fresh();s.buildings.push({kind:'workbench',x:30,y:10});initializePetShelter(s);expect(s.petShelter).toBeDefined();expect(s.petShelter?.x).not.toBe(960);expect(s.buildings).toContainEqual({kind:'workbench',x:30,y:10});
  const old=structuredClone(s.petShelter);initializePetShelter(s);expect(s.petShelter).toEqual(old);
 });
 it('validates shelter state and shelter residents without accepting arbitrary travel spaces',()=>{
  expect(validPetShelter({stage:3,x:960,y:352})).toBe(true);
  for(const stage of [-1,4,1.5,'3'])expect(validPetShelter({stage,x:960,y:352})).toBe(false);
  const s=fresh();s.petShelter={stage:3,x:960,y:352};applyDungeonResult(s,reward('one'));
  expect(homePet(s,s.dungeons!.pets[0].id).ok).toBe(true);expect(validWorldPetState(s.dungeons!.pets[0].world)).toBe(true);
  expect(validWorldPetState({...s.dungeons!.pets[0].world,area:'village'})).toBe(false);
 });
 it('sources materials through NPC services and learned crafting, and cancels failed services without loss',()=>{
  const s=fresh();s.villageEconomy={coins:1000,met:[]};Object.assign(s.inventory,{log:4,wood:12,fiber:16,scrap:8});
  for(const id of ['shelter-carpentry','shelter-textiles','shelter-fittings'])expect(performVillageService(s,id).ok).toBe(true);
  expect(s.inventory.board).toBe(6);expect(s.inventory.peg).toBe(6);expect(s.inventory.cloth).toBe(4);expect(s.inventory.metalPart).toBe(2);
  const before=structuredClone(s);s.inventory.scrap=0;const empty=structuredClone(s);expect(performVillageService(s,'shelter-fittings').ok).toBe(false);expect(s).toEqual(empty);
  const inventory=new Inventory({fiber:4,cord:1});expect(craft('pet-bedding-cloth',inventory,false).ok).toBe(false);expect(craft('pet-bedding-cloth',inventory,false,{recipes:['backpack']}).ok).toBe(true);expect(inventory.data.cloth).toBe(2);expect(before.villageEconomy!.coins).toBe(938);
 });
 it('blocks rescue pickups even when an old expedition resumes with one on the ground',()=>{
  const run=new DungeonRun('locked','mall-parking',createDungeonProgress(),undefined,123,false),s=run.state;
  s.pickups.push({id:999,kind:'pet',species:'dog',amount:0,x:s.player.x,y:s.player.y});run.step(.1);expect(s.foundPet).toBeUndefined();
 });
 it('lets three residents roam, visit both bowls, rest and play while respecting collision and pause',()=>{
  const site={x:960,y:352};const brains=Array.from({length:3},(_,index)=>createResidentBrain({world:{mode:'shelter',area:'property',space:'outdoors',x:936+index*24,y:376,direction:'south'}} as Parameters<typeof createResidentBrain>[0]));
  const activities=new Set<string>();const blocked=(x:number,y:number)=>shelterSolid(site,x,y);
  for(let frame=0;frame<6000;frame++)for(let i=0;i<3;i++){
   stepResident(brains[i],.1,i,site,brains,blocked);if(Math.hypot(brains[i].goal.x-brains[i].x,brains[i].goal.y-brains[i].y)<5)activities.add(brains[i].activity);
   expect(blocked(brains[i].x,brains[i].y)).toBe(false);expect(Math.abs(brains[i].x-site.x)).toBeLessThanOrEqual(120);expect(brains[i].y).toBeLessThanOrEqual(site.y+110);
  }
  expect([...activities]).toEqual(expect.arrayContaining(['roam','water','food','rest','play']));const frozen=structuredClone(brains);brains.forEach((b,i)=>stepResident(b,0,i,site,brains,blocked));expect(brains).toEqual(frozen);
 });
});
