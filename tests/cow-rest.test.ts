import {describe,it,expect}from'vitest';
import {CowRestCycle,COW_REST_TIMING}from'../src/systems/cow-rest';
import poses from'../src/data/cow-poses.json';
describe('authored cow rest transitions',()=>{
 it('turns, lies down once, loops breathing slowly and stands before walking again',()=>{
  const cow=new CowRestCycle('preview',0),seen=new Map<string,Set<number>>();let rested=false,rose=false;
  for(let i=0;i<700;i++){cow.update(.05,true,true,'up-left',true);const frame=cow.frame();if(frame!==undefined){const values=seen.get(cow.phase)??new Set();values.add(frame);seen.set(cow.phase,values);}rested ||=cow.phase==='resting';rose ||=cow.phase==='rising';if(rose&&cow.phase==='awake')break;}
  expect(rested&&rose).toBe(true);expect(cow.phase).toBe('awake');expect(cow.direction).toBe('left');expect([...seen.get('lying')!]).toEqual(poses.animations.Lie_Down.west);expect([...seen.get('rising')!]).toEqual(poses.animations.Stand_Up.west);expect(seen.get('resting')?.size).toBe(9);expect(COW_REST_TIMING.restFps).toBeLessThan(COW_REST_TIMING.lieFps);
 });
 it('finishes the lie-down and rise when the rope asks the cow to move, without sliding in a resting pose',()=>{
  const cow=new CowRestCycle('wake',0);while(cow.phase!=='lying')cow.update(.05,true,true,'right',true);const lying=new Set<number>(),rising=new Set<number>();
  for(let i=0;i<100&&String(cow.phase)!=='awake';i++){const frame=cow.frame();if(frame!==undefined)(cow.phase==='lying'?lying:rising).add(frame);cow.update(.05,false,true,'left',false);}
  expect([...lying]).toEqual(poses.animations.Lie_Down.east);expect([...rising]).toEqual(poses.animations.Stand_Up.east);expect(cow.phase).toBe('awake');expect(cow.locked).toBe(false);expect(cow.direction).toBe('right');
 });
 it('rests only after entry, while stationary and with clearance for the larger lying footprint',()=>{
  const cow=new CowRestCycle('blocked',0);for(let i=0;i<50;i++)cow.update(.1,false,true,'down',true);expect(cow.locked).toBe(false);for(let i=0;i<50;i++)cow.update(.1,true,false,'down',true);expect(cow.locked).toBe(false);for(let i=0;i<50;i++)cow.update(.1,true,true,'down',false);expect(cow.locked).toBe(false);cow.update(.1,true,true,'down',true);expect(cow.phase).toBe('settling');const frame=cow.frame();cow.update(0,false,false,'up',false);expect(cow.frame()).toBe(frame);
 });
});
