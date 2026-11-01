import { expect, it } from 'vitest';
import { createNewSave, validateSave } from '../src/systems/save';
import { prepareVillageRoutines, advanceBackgroundVillage } from '../src/systems/village-background';
import { merchantPeriod } from '../src/systems/merchant-routine';
const make=()=>createNewSave({name:'Rotinas',skin:'#e9bc98',hairColor:'#563b2c',outfit:'#457398',hairStyle:'preso'});
it('places a first morning visit at the current schedule instead of all shop doorsteps',()=>{
 const save=make();save.time=600;save.activeArea='village';prepareVillageRoutines(save);
 expect(Object.keys(save.villageRoutines!)).toHaveLength(10);
 for(const [id,state] of Object.entries(save.villageRoutines!)){
  expect(merchantPeriod(id as never,save.time)).toBe('work');expect(state!.area).toBe('shop');expect(state!.updatedAt).toBe(save.day*1440+save.time);
 }
 expect(validateSave(save)).toBe(true);
});
it('continues movement offscreen and preserves the exact saved positions when entering the village',()=>{
 const save=make();save.time=600;save.activeArea='property';advanceBackgroundVillage(save,.1);
 const first=structuredClone(save.villageRoutines);
 for(let i=0;i<200;i++){save.time+=.1;advanceBackgroundVillage(save,.1);}
 expect(Object.values(save.villageRoutines!).some((state,i)=>state!.x!==Object.values(first!)[i]!.x||state!.y!==Object.values(first!)[i]!.y)).toBe(true);
 const arrival=structuredClone(save);arrival.activeArea='village';const before=structuredClone(arrival.villageRoutines);prepareVillageRoutines(arrival);
 expect(arrival.villageRoutines).toEqual(before);expect(validateSave(arrival)).toBe(true);
 const visible=structuredClone(arrival.villageRoutines);advanceBackgroundVillage(arrival,.1);expect(arrival.villageRoutines).toEqual(visible);
});
it('resynchronizes long clock jumps and legacy saves without replaying hours of walking',()=>{
 const save=make();save.time=600;save.activeArea='property';advanceBackgroundVillage(save,.1);
 save.day++;save.time=300;advanceBackgroundVillage(save,.1);
 expect(Object.values(save.villageRoutines!).every(s=>s!.area==='shop')).toBe(true);
 expect(Object.values(save.villageRoutines!).every(s=>s!.updatedAt===save.day*1440+save.time)).toBe(true);
 for(const state of Object.values(save.villageRoutines!))delete state!.updatedAt;
 const legacy=structuredClone(save);legacy.time=600;prepareVillageRoutines(legacy);
 expect(Object.values(legacy.villageRoutines!).every(s=>s!.updatedAt===legacy.day*1440+legacy.time)).toBe(true);expect(validateSave(legacy)).toBe(true);
});
