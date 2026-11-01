import { createNewSave } from '../src/systems/save';
import { expect, it } from 'vitest';
import { PET_SPECIES, PETS } from '../src/dungeons/config';
import { PET_ART, petSpritePose, petActionDuration } from '../src/dungeons/pet-sprites';
import { PET_DIRECTIONS } from '../src/dungeons/pet-directions';
import { petPlayerBonuses } from '../src/dungeons/pet-passives';
import { createDungeonProgress, validDungeonProgress, applyDungeonResult } from '../src/dungeons/progression';
import { DungeonRun } from '../src/dungeons/run';
import { validDungeonSnapshot } from '../src/dungeons/snapshot';
import { recolorPetPixels } from '../src/dungeons/pet-appearance';
import { petCollectionHTML } from '../src/dungeons/pet-menu';

const breeds=['golden-retriever','border-collie'] as const;
it.each(breeds)('%s provides both appearances and walking in eight directions',species=>{
 expect(PET_SPECIES).toContain(species);
 for(const direction of PET_DIRECTIONS) for(const action of ['walk','run','idle','attack'] as const){
  const common=petSpritePose(species,action,direction,.3),rare=petSpritePose(species,action,direction,.3,true,true);
  expect(PET_ART[species].frames).toHaveProperty(common.frame);
  expect({...rare,texture:common.texture}).toEqual(common);expect(rare.texture).toBe(common.texture+'-rare');
 }
 expect(petPlayerBonuses({species,rare:false})).toEqual(petPlayerBonuses({species:'dog',rare:false}));
 expect(petPlayerBonuses({species,rare:true})).toEqual(petPlayerBonuses({species:'dog',rare:true}));
 const pixels=new Uint8ClampedArray([220,190,150,255,100,100,100,120,1,2,3,0]);
 recolorPetPixels(pixels,species);expect(pixels[3]).toBe(255);expect(pixels[7]).toBe(120);expect([...pixels.slice(8)]).toEqual([1,2,3,0]);
});
it('interleaves golden bark with quiet idle but never replaces movement with barking',()=>{
 expect(petSpritePose('golden-retriever','idle','south',14.25).frame).toMatch(/^bark-/);
 expect(petSpritePose('golden-retriever','rest','south',14.25).frame).toMatch(/^bark-/);
 expect(petSpritePose('golden-retriever','idle','south',16).frame).toMatch(/^idle-/);
 expect(petSpritePose('golden-retriever','walk','south',14.25).frame).toMatch(/^walk-/);
 expect(petSpritePose('golden-retriever','attack','south',.3,false).frame).toMatch(/^attack-.*-3$/);
 expect(petActionDuration('golden-retriever','attack')).toBe(.6);
});
it.each(breeds)('rescues %s variants and keeps progress and collection valid',species=>{
 for(const rare of [false,true]){
  const save=createNewSave({name:'Pets',skin:'#e9bc98',hairColor:'#563b2c',outfit:'#457398',hairStyle:'preso'});
  save.petShelter={stage:3,x:960,y:352};
  applyDungeonResult(save,{id:'rescue-'+species+rare,dungeon:'mall-parking',outcome:'abandoned',elapsed:1,level:1,kills:0,round:1,foundPet:species,foundPetRare:rare});
  const progress=save.dungeons!;
  expect(progress.pets[0].species).toBe(species);expect(progress.pets[0].rare).toBe(rare);expect(validDungeonProgress(progress)).toBe(true);
  const html=petCollectionHTML({pets:progress.pets,icons:{},nearby:false});expect(html).toContain('1 de 8');expect(html).toContain(PETS[species].name);expect(html.toLowerCase()).not.toContain('shiny');
 }
});
it('golden bark deals damage once without lunging and restores a saved bark safely',()=>{
 const progress=createDungeonProgress();
 progress.pets.push({id:'golden',species:'golden-retriever',rare:false,xp:0,attributes:{speed:0,resistance:0,perception:0,protection:0,efficiency:0}});
 const run=new DungeonRun('golden-bark','abandoned-central-square',progress,'golden');const s=run.state,p=s.pet!;
 s.spawnClock=20;s.eventClock=1000;s.cooldowns.sword=30;p.attack=0;p.special=10;
 s.enemies=[{id:900,x:p.x+60,y:p.y,hp:1000,maxHp:1000,speed:1,damage:0,special:false,kind:'walker',streak:0,lastHit:0}];
 run.step(1/30);const origin={x:p.x,y:p.y};
 for(let i=1;i<14;i++)run.step(1/30);
 expect(s.enemies[0].hp).toBe(1000-PETS['golden-retriever'].damage);expect({x:p.x,y:p.y}).toEqual(origin);
 expect(p.action!.age).toBeGreaterThan(.3);const snapshot=run.snapshot();expect(validDungeonSnapshot(snapshot)).toBe(true);
 const restored=new DungeonRun('golden-restore','abandoned-central-square',progress,'golden');restored.restore(snapshot);
 for(let i=0;i<5;i++)restored.step(1/30);
 expect(restored.state.pet!.action).toBeUndefined();expect(restored.state.enemies[0].hp).toBe(snapshot.enemies[0].hp);
 expect(validDungeonSnapshot(restored.snapshot())).toBe(true);
});

it('enlarges every dog breed by 15% without changing the cat, pivots or special variant size',()=>{
 for(const species of PET_SPECIES){
  const art=PET_ART[species],factor=species==='cat'?1:1.15;
  for(const action of ['idle','walk','attack'] as const){
   const pose=petSpritePose(species,action,'south',.2),rare=petSpritePose(species,action,'south',.2,true,true);
   expect(pose.scale).toBeCloseTo(art.animation.bodyHeight/art.animation.referenceHeight*factor);
   expect(rare.scale).toBe(pose.scale);expect(rare.originX).toBe(pose.originX);expect(rare.originY).toBe(pose.originY);
  }
 }
});
