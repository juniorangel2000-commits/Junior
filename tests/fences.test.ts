import { describe, expect, it } from 'vitest';
import { fenceConnections, fenceStage } from '../src/data/fences';
import { Building } from '../src/systems/building';
import { advanceClock, sleepUntilMorning } from '../src/systems/clock';
import { createNewSave, migrateSave, validateSave } from '../src/systems/save';
import { Inventory, INITIAL_INVENTORY } from '../src/systems/inventory';
import type { BuildingData } from '../src/types';

const fence = (x:number,y:number,fenceBuiltDay=1):BuildingData => ({x,y,kind:'fence',fenceBuiltDay});

describe('cercas conectadas e desgaste no calendário', () => {
  it('liga os dezesseis arranjos cardinais, mesmo com idades diferentes', () => {
    const offsets=[[0,-1],[1,0],[0,1],[-1,0]];
    for(let mask=0;mask<16;mask++) {
      const neighbors=offsets.flatMap(([dx,dy],i)=>mask&(1<<i)?[fence(10+dx,10+dy,i+1)]:[]);
      expect(fenceConnections([fence(10,10),...neighbors],10,10)).toBe(mask);
    }
    expect(fenceConnections([fence(11,11),{x:11,y:10,kind:'bench'}],10,10)).toBe(0);
  });

  it('recalcula pontas ao colocar e remover e preserva o custo existente', () => {
    const world=new Building(),inventory=new Inventory({...INITIAL_INVENTORY,wood:30});
    for(const x of [9,10,11]) expect(world.place('fence',x,10,inventory,true,{nearWorkbench:false,day:5}).ok).toBe(true);
    expect(fenceConnections(world.buildings,10,10)).toBe(10);
    expect(fenceConnections(world.buildings,9,10)).toBe(2);
    expect(world.remove(10,10,inventory).ok).toBe(true);
    expect(fenceConnections(world.buildings,9,10)).toBe(0);
    expect(world.buildings[0].fenceBuiltDay).toBe(5);
    expect(world.isBlocked(9,10)).toBe(true);
  });

  it('avança a cada trinta dias e mantém o último estágio sem apagar a cerca', () => {
    const piece=fence(10,10,5);
    expect([5,34,35,64,65,94,95,500].map(day=>fenceStage(piece,day)))
      .toEqual(['new','new','worn','worn','damaged','damaged','ruined','ruined']);
    expect(fenceStage(piece,1)).toBe('new');
  });

  it('usa dias do jogo, inclusive passagem de meia-noite, sono e estadia na floresta', () => {
    const piece=fence(10,10);
    const clock=advanceClock({day:30,time:1439},1);
    expect(fenceStage(piece,clock.day)).toBe('worn');
    const sleep=sleepUntilMorning({day:60,time:1300});
    expect(sleep.ok).toBe(true);
    expect(fenceStage(piece,sleep.day)).toBe('damaged');
    expect(fenceStage(piece,advanceClock({day:61,time:800},1440*30).day)).toBe('ruined');
  });

  it('inicia cercas antigas no dia da atualização sem alterar a fonte', () => {
    const legacy:BuildingData[]=[{x:10,y:10,kind:'fence'},fence(11,10,4),{x:12,y:10,kind:'bench'}];
    const world=new Building(legacy,120);
    expect(world.buildings[0].fenceBuiltDay).toBe(120);
    expect(world.buildings[1].fenceBuiltDay).toBe(4);
    expect(legacy[0].fenceBuiltDay).toBeUndefined();
    expect(world.buildings[2].fenceBuiltDay).toBeUndefined();
  });

  it('salva a idade e recusa datas inválidas ou aplicadas a outras construções', () => {
    const state=createNewSave({name:'Cercas',skin:'#eac39a',hairColor:'#71462e',outfit:'#70a97c',hairStyle:'preso'});
    state.day=94;state.buildings=[fence(10,10,3)];
    expect(validateSave(state)).toBe(true);
    const restored=migrateSave(JSON.parse(JSON.stringify(state)))!;
    expect(fenceStage(restored.buildings[0],restored.day)).toBe('ruined');
    for(const invalid of [-1,0,1.5,95,'3']) expect(validateSave({...state,buildings:[{...state.buildings[0],fenceBuiltDay:invalid}]})).toBe(false);
    expect(validateSave({...state,buildings:[{...state.buildings[0],kind:'bench'}]})).toBe(false);
    delete state.buildings[0].fenceBuiltDay;
    expect(validateSave(state)).toBe(true);
  });
});
