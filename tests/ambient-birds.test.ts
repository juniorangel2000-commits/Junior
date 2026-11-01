import { expect, it, vi } from 'vitest';
import { createAmbientBird, stepAmbientBird, ambientBirdLift, daylightBirds } from '../src/systems/ambient-bird';
it('lands only on allowed ground and does not consume gameplay randomness',()=>{
 const random=vi.spyOn(Math,'random');
 try{
  for(let id=1;id<30;id++){
   const bird=createAmbientBird(id,{x:1500,y:1100},(x,y)=>x<1600&&y>1000);
   expect(bird).toBeDefined();expect(bird!.x).toBeLessThan(1600);expect(bird!.y).toBeGreaterThan(1000);
  }
  expect(createAmbientBird(1,{x:1500,y:1100},()=>false)).toBeUndefined();expect(random).not.toHaveBeenCalled();
 }finally{random.mockRestore();}
});
it('flees when approached, lifts above the ground and lands without touching blocked terrain',()=>{
 const b=createAmbientBird(20,{x:1500,y:1100},()=>true)!;
 const player={x:b.x-10,y:b.y};stepAmbientBird(b,.1,player,()=>true);expect(b.phase).toBe('fly');
 for(let i=0;i<10;i++)stepAmbientBird(b,.1,player,()=>true);expect(ambientBirdLift(b)).toBeGreaterThan(20);
 for(let i=0;i<15;i++)stepAmbientBird(b,.1,player,()=>true);expect(b.phase).toBe('perched');expect(Math.hypot(b.x-player.x,b.y-player.y)).toBeGreaterThan(78);
 const blocked=createAmbientBird(3,{x:1500,y:1100},()=>true)!;stepAmbientBird(blocked,.1,{x:0,y:0},()=>true,true);
 for(let i=0;i<25;i++)stepAmbientBird(blocked,.1,{x:0,y:0},()=>false);
 expect(blocked.active).toBe(false);
});
it('freezes with the game and keeps ambient life deterministic',()=>{
 const a=createAmbientBird(40,{x:1500,y:1100},()=>true)!,b=structuredClone(a),before=structuredClone(a);
 stepAmbientBird(a,0,{x:a.x,y:a.y},()=>true);expect(a).toEqual(before);
 for(let i=0;i<100;i++){stepAmbientBird(a,.1,{x:100,y:100},()=>true);stepAmbientBird(b,.1,{x:100,y:100},()=>true);}
 expect(a).toEqual(b);expect(daylightBirds(600)).toBe(true);expect(daylightBirds(1200)).toBe(false);
});
