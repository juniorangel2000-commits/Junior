import {describe,it,expect} from 'vitest';
import {DungeonRun} from '../src/dungeons/run';
import {PET_SPECIES,type DungeonId} from '../src/dungeons/config';
import {createDungeonProgress,applyDungeonResult} from '../src/dungeons/progression';
import {createNewSave,validateSave} from '../src/systems/save';
import {canAdoptPet,initializePetShelter} from '../src/systems/pet-shelter';

const fresh=()=>{const save=createNewSave({name:'Resgate',skin:'#e9bc98',hairColor:'#563b2c',outfit:'#457398',hairStyle:'preso'});initializePetShelter(save);save.dungeons=createDungeonProgress();return save;};
const event=(run:DungeonRun,speciesIndex=0)=>{
 run.state.elapsed=44.99;run.state.spawnClock=100;
 const rolls=[0,.3,0,(speciesIndex+.25)/PET_SPECIES.length];
 run.random=()=>rolls.shift()??.5;run.step(1/30);
 return run.state.pickups.find(p=>p.kind==='pet');
};
describe('pet appearance and adoption availability',()=>{
 for(const map of ['mall-parking','abandoned-central-square'] as DungeonId[])
  for(const [index,species] of PET_SPECIES.entries())
   it(`spawns, rescues and delivers ${species}, including its special variant, in ${map}`,()=>{
    for(const rare of [false,true]){
     const save=fresh();save.petShelter!.stage=3;
     const run=new DungeonRun('rescue-'+species+rare,map,save.dungeons!,undefined,123,canAdoptPet(save));
     const pickup=event(run,index);expect(pickup?.species).toBe(species);
     const restored=new DungeonRun('resume',map,save.dungeons!,undefined,123,canAdoptPet(save));restored.restore(run.snapshot());
     const target=restored.state.pickups.find(p=>p.kind==='pet')!;
     restored.state.player.x=target.x;restored.state.player.y=target.y;restored.random=()=>rare?.005:.5;restored.step(1/30);
     expect(restored.state.foundPet).toBe(species);expect(restored.state.foundPetRare).toBe(rare);
     restored.state.phase='victory';const result=restored.result();applyDungeonResult(save,result);applyDungeonResult(save,result);
     expect(save.dungeons!.pets).toHaveLength(1);
     expect(save.dungeons!.pets[0]).toMatchObject({species,rare,world:{mode:'shelter'}});
     expect(validateSave(save)).toBe(true);
    }
   });
 it('blocks appearances before the final repair and when all three places are occupied',()=>{
  for(const stage of [0,1,2,3] as const){
   const save=fresh();save.petShelter!.stage=stage;
   if(stage===3)for(let n=0;n<3;n++)applyDungeonResult(save,{id:'occupied-'+n,dungeon:'mall-parking',outcome:'victory',elapsed:900,kills:0,foundPet:'dog'});
   expect(canAdoptPet(save)).toBe(false);
   const run=new DungeonRun('locked','mall-parking',save.dungeons!,undefined,123,canAdoptPet(save));expect(event(run)).toBeUndefined();
  }
 });
 it('uses the chance gate rather than guaranteeing a companion every supply event',()=>{
  const save=fresh();save.petShelter!.stage=3;
  const run=new DungeonRun('no-roll','mall-parking',save.dungeons!,undefined,123,canAdoptPet(save));
  run.state.elapsed=44.99;run.state.spawnClock=100;run.random=()=>.5;run.step(1/30);
  expect(run.state.pickups.some(p=>p.kind==='pet')).toBe(false);
 });
});
