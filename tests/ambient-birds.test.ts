import { expect, it, vi } from 'vitest';
import { createAmbientBird, createAmbientFlock, stepAmbientBird, ambientBirdLift, daylightBirds } from '../src/systems/ambient-bird';
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

it('spawns cohesive pairs far from the player and separates their flock centers',()=>{
 const player={x:1500,y:1100},first=createAmbientFlock(55,player,()=>true)!;
 expect(first).toHaveLength(2);expect(Math.hypot(first[0].x-first[1].x,first[0].y-first[1].y)).toBeLessThan(100);
 for(const bird of first)expect(Math.hypot(bird.x-player.x,bird.y-player.y)).toBeGreaterThanOrEqual(320);
 const second=createAmbientFlock(56,player,()=>true,[first[0].flock!])!;expect(second).toHaveLength(2);
 expect(Math.hypot(second[0].flock!.x-first[0].flock!.x,second[0].flock!.y-first[0].flock!.y)).toBeGreaterThanOrEqual(280);
 expect(createAmbientFlock(55,player,()=>false)).toBeUndefined();
 for(let i=0;i<3000;i++)for(const b of first){stepAmbientBird(b,.1,{x:0,y:0},()=>true);expect(Math.hypot(b.x-b.flock!.x,b.y-b.flock!.y)).toBeLessThanOrEqual(80);}
});

it('finds a different escape direction when the path directly away from the player is blocked',()=>{
 const birds=createAmbientFlock(91,{x:1500,y:1100},()=>true)!,b=birds[0],player={x:b.x,y:b.y};
 const anchor=b.flock!,dx=anchor.x-player.x,dy=anchor.y-player.y,d=Math.hypot(dx,dy),blockedCenter={x:anchor.x+dx/d*220,y:anchor.y+dy/d*220};
 const canLand=(x:number,y:number)=>Math.hypot(x-blockedCenter.x,y-blockedCenter.y)>130;
 stepAmbientBird(b,.1,player,canLand,true);expect(b.active).toBe(true);expect(b.phase).toBe('fly');expect(canLand(b.target.x,b.target.y)).toBe(true);
});
