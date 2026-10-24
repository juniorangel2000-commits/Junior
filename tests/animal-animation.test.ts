import {describe,it,expect} from 'vitest';
import {AnimalWalkCycle} from '../src/systems/animal-animation';
import {AnimalBrain,animalMovementDirection} from '../src/systems/animals';
import {ANIMAL_ART} from '../src/data/animal-art';

describe('animal heading and gait',()=>{
 it('selects eight angular sectors instead of diagonals from tiny steering corrections',()=>{
  expect(animalMovementDirection(8,.01,'right')).toBe('right');expect(animalMovementDirection(-8,.01,'left')).toBe('left');
  expect(animalMovementDirection(.01,8,'down')).toBe('down');expect(animalMovementDirection(.01,-8,'up')).toBe('up');
  expect(animalMovementDirection(8,8,'right')).toBe('down-right');expect(animalMovementDirection(-8,8,'left')).toBe('down-left');
  expect(animalMovementDirection(8,-8,'right')).toBe('up-right');expect(animalMovementDirection(-8,-8,'left')).toBe('up-left');
 });
 it('keeps a stable heading around a sector boundary and changes on a real turn',()=>{
  const vector=(degrees:number)=>({x:Math.cos(degrees*Math.PI/180),y:Math.sin(degrees*Math.PI/180)});
  let heading='right' as const;const a=vector(25),b=vector(30),c=vector(90);
  expect(animalMovementDirection(a.x,a.y,heading)).toBe('right');
  expect(animalMovementDirection(b.x,b.y,heading)).toBe('down-right');
  expect(animalMovementDirection(a.x,a.y,'down-right')).toBe('down-right');
  expect(animalMovementDirection(c.x,c.y,'down-right')).toBe('down');
 });
 it('follows an open stretch directly, without zigzagging between tile centers',()=>{
  const a=new AnimalBrain('direct-follow','cow',990,990,true,(x,y)=>x<1||y<1||x>90||y>68),p={x:1080,y:993};
  for(let i=0;i<20;i++){
   a.update(1/60,p,[a],true);
   expect(a.direction).toBe('right');expect((a.y-990)/(a.x-990)).toBeCloseTo(3/90,4);
  }
 });
 it('uses a follow-distance margin instead of restarting at every tiny gap',()=>{
  const a=new AnimalBrain('follow-margin','chicken',976,976,true,()=>false);
  a.update(1/60,{x:a.x+36,y:a.y},[a],true);expect(a.moving).toBe(false);
  a.update(1/60,{x:a.x+41,y:a.y},[a],true);expect(a.moving).toBe(true);
  a.update(1/60,{x:a.x+35,y:a.y},[a],true);expect(a.moving).toBe(true);
  a.update(1/60,{x:a.x+31,y:a.y},[a],true);expect(a.moving).toBe(false);
  a.update(1/60,{x:a.x+35,y:a.y},[a],true);expect(a.moving).toBe(false);
 });
 it.each(['chicken','cow'] as const)('limits the %s gait rate and preserves the original frame order',kind=>{
  const cycle=new AnimalWalkCycle(kind),frames:number[]=[];
  for(let i=1;i<=120;i++){cycle.advance(1/60,true,i*80/60);frames.push(cycle.frame('right')-18);}
  let transitions=0;for(let i=1;i<frames.length;i++)if(frames[i]!==frames[i-1]){transitions++;expect(frames[i]).toBe(frames[i-1]%8+1);}
  expect(new Set(frames).size).toBe(8);expect(transitions).toBeGreaterThanOrEqual(ANIMAL_ART[kind].maxWalkFps*2-2);expect(transitions).toBeLessThanOrEqual(ANIMAL_ART[kind].maxWalkFps*2);
 });
 it('holds the current contact pose during a short steering pause and settles to idle afterward',()=>{
  const cycle=new AnimalWalkCycle('cow');cycle.advance(.1,true,8);const frame=cycle.frame('left');expect(frame%9).toBeGreaterThan(0);
  cycle.advance(.05,false,8);expect(cycle.frame('left')).toBe(frame);
  cycle.advance(0,false,8);expect(cycle.frame('left')).toBe(frame);
  cycle.advance(.1,false,8);expect(cycle.frame('left')).toBe(9);
  cycle.advance(.1,true,16);expect(cycle.frame('left')%9).toBeGreaterThan(0);
 });
});
