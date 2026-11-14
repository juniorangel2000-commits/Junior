import {AnimalBrain,type AnimalPoint} from './animals';
export const FOREST_DUCK_SPAWNS=[{id:'forest-water-duck-1',x:1648,y:560},{id:'forest-water-duck-2',x:1872,y:496}] as const;
/** Patos usam o lago e uma pequena faixa da margem; sólidos continuam bloqueando. */
export function duckHabitatBlocked(x:number,y:number,water:(x:number,y:number)=>boolean,solid:(x:number,y:number)=>boolean):boolean{
 if(x<32||y<32||x>3040||y>2272||solid(x,y))return true;
 if(water(x,y))return false;
 return ![[32,0],[-32,0],[0,32],[0,-32],[24,24],[-24,24],[24,-24],[-24,-24]].some(([dx,dy])=>water(x+dx,y+dy));
}
export function createForestDuck(id:string,x:number,y:number,water:(x:number,y:number)=>boolean,solid:(x:number,y:number)=>boolean):AnimalBrain|undefined{
 const blockedPoint=(px:number,py:number)=>duckHabitatBlocked(px,py,water,solid);
 const brain=new AnimalBrain(id,'duck',x,y,true,(tx,ty)=>blockedPoint(tx*32+16,ty*32+16),84,(tx,ty)=>water(tx*32+16,ty*32+16)?0:6,blockedPoint);
 if(water(x,y)&&brain.canStand(x,y))return brain;
 for(let r=1;r<=6;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){
  if(Math.abs(dx)!==r&&Math.abs(dy)!==r)continue;const px=x+dx*32,py=y+dy*32;if(water(px,py)&&brain.canStand(px,py)){brain.x=px;brain.y=py;return brain;}
 }
}
export const ducksOnWater=(ducks:readonly AnimalPoint[],water:(x:number,y:number)=>boolean)=>ducks.filter(d=>water(d.x,d.y)).length;
