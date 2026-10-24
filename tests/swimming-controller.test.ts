import {describe,it,expect} from 'vitest';
import {SwimmingController} from '../src/swimming/controller';
import {sampleWaterDepth,SWIMMING_CONFIG,HEAD_BOTTOM} from '../src/swimming/config';
import {CHARACTER_DIRECTIONS} from '../src/character-directions';
describe('depth-aware swimming',()=>{
 it('keeps walking in shallow water and swims only deeper in the navigable water',()=>{
  const water=(x:number,y:number)=>x>0&&x<200&&y>0&&y<200;
  expect(sampleWaterDepth(water,-1,80)).toBe(0);expect(sampleWaterDepth(water,4,80)).toBe(0);expect(sampleWaterDepth(water,80,80)).toBe(1);
  expect(sampleWaterDepth(water,16,80)).toBeGreaterThan(0);expect(sampleWaterDepth(water,16,80)).toBeLessThan(SWIMMING_CONFIG.deepThreshold);
 });
 it('keeps wading until the water reaches the neck, then changes to swimming',()=>{
  const state=new SwimmingController();
  for(const depth of [.25,.5,.75,.875]){state.update(depth,true,'down',0);expect(state.state).toBe('wading');expect(state.isSwimming).toBe(false);}
  state.update(1,true,'down',0);expect(state.state).toBe('swim_down');expect(state.isSwimming).toBe(true);
 });
 it('exposes idle and all eight directional swim states',()=>{
  const state=new SwimmingController();state.update(1,false,'down',0);expect(state.state).toBe('swim_idle');
  for(const direction of CHARACTER_DIRECTIONS){state.update(1,true,direction,.1);expect(state.state).toBe(`swim_${direction}`);}
 });
 it('smoothly submerges and returns to land without leaving residual effects',()=>{
  const state=new SwimmingController();state.update(1,true,'right',.016);expect(state.depth).toBeGreaterThan(0);expect(state.depth).toBeLessThan(1);
  state.update(0,false,'right',1);expect(state.depth).toBe(0);expect(state.isSwimming).toBe(false);expect(state.state).toBe('land');
 });
 it('uses individual native-pixel head crops for each official character and view',()=>{
  expect(HEAD_BOTTOM['farmer-female']).not.toEqual(HEAD_BOTTOM['farmer-male']);
  for(const crops of Object.values(HEAD_BOTTOM))for(const direction of CHARACTER_DIRECTIONS){expect(crops[direction]).toBeGreaterThan(90);expect(crops[direction]).toBeLessThan(140);}
 });
});
