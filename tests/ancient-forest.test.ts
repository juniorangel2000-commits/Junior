import { describe,it,expect } from 'vitest';
import { FOREST_ANIMALS, FOREST_ENTRY, FOREST_WIDTH, FOREST_HEIGHT, forestBlocked, recruitAnimal } from '../src/data/ancient-forest';
import {forestWater} from '../src/data/ancient-forest';
import { createNewSave, migrateSave, validateSave } from '../src/systems/save';
const profile={name:'Floresta',skin:'#e9bc98',hairColor:'#563b2c',outfit:'#457398',hairStyle:'preso' as const};
describe('Floresta Antiga',()=>{
  it('mantém somente o lago, com o antigo riacho transformado em terra',()=>{
    expect(forestWater(54,16)).toBe(true);
    for(let y=1;y<=13;y++)expect(forestWater(84-y,y),`antigo riacho em ${84-y},${y}`).toBe(false);
  });
  it('tem o tamanho da propriedade e todas as clareiras são alcançáveis pela entrada',()=>{
    expect([FOREST_WIDTH,FOREST_HEIGHT]).toEqual([96,72]);
    const visited=new Set<string>(),queue=[FOREST_ENTRY];
    for(let i=0;i<queue.length;i++){
      const p=queue[i],key=`${p.x},${p.y}`;if(visited.has(key)||forestBlocked(p.x,p.y))continue;
      visited.add(key);for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]])queue.push({x:p.x+dx,y:p.y+dy});
    }
    for(const a of FOREST_ANIMALS)expect(visited.has(`${a.x},${a.y}`),a.id).toBe(true);
    expect(visited.has('48,69')).toBe(true);
  });
  it('acolhe uma única vez e ignora IDs inexistentes',()=>{
    const id=FOREST_ANIMALS[0].id;
    const once=recruitAnimal([],id);expect(recruitAnimal(once,id)).toEqual(once);
    expect(recruitAnimal(once,'unknown')).toEqual(once);
  });
  it('salva a área e os animais sem alterar a propriedade ou repetir coletas',()=>{
    const state=createNewSave(profile);state.activeArea='forest';state.forestPosition={x:1552,y:2128,direction:'up'};
    state.recruitedAnimals=recruitAnimal([],FOREST_ANIMALS[0].id);state.homeSupplies={wateringCan:true,seedPacket:true};state.wateringCanWater=5;
    state.depletedResources=['tree-20-18'];state.crops=[{x:21,y:20,watered:true,growth:.3}];
    const restored=migrateSave(JSON.parse(JSON.stringify(state)))!;
    expect(restored.activeArea).toBe('forest');expect(restored.forestPosition).toEqual(state.forestPosition);
    expect(restored.player).toEqual(state.player);expect(restored.crops).toEqual(state.crops);expect(restored.depletedResources).toEqual(state.depletedResources);
    expect(restored.wateringCanWater).toBe(5);expect(restored.homeSupplies).toEqual(state.homeSupplies);
    expect(recruitAnimal(restored.recruitedAnimals!,FOREST_ANIMALS[0].id)).toEqual(state.recruitedAnimals);
  });
  it('aceita saves antigos e rejeita áreas, posições e animais inválidos',()=>{
    const state=createNewSave(profile);expect(validateSave(state)).toBe(true);
    for(const extra of [{activeArea:'unknown'},{forestPosition:{x:-1,y:10}},{recruitedAnimals:['bad']},{recruitedAnimals:[FOREST_ANIMALS[0].id,FOREST_ANIMALS[0].id]}])expect(validateSave({...state,...extra})).toBe(false);
  });
});


describe('forest tree art variety',()=>{
  it('uses all six tree sprites on the actual placement grid',async()=>{
    const {FOREST_TREES,forestTreeAppearance}=await import('../src/data/ancient-forest');
    const keys=new Set(FOREST_TREES.filter(t=>!t.ancient).map(t=>`${t.pine?'pine':'tree'}-${forestTreeAppearance(t).variant}`));
    expect(keys.size).toBe(6);
    const scales=new Set(FOREST_TREES.map(t=>forestTreeAppearance(t).scale));
    expect(scales.size).toBeGreaterThan(10);
  });
});
