import {AnimalBrain,type AnimalPoint} from './animals';
export const FOREST_DUCK_SPAWNS=[{id:'forest-water-duck-1',x:1648,y:560},{id:'forest-water-duck-2',x:1872,y:496}] as const;
/** Até onde o pato passeia fora d'água: 3 blocos a partir da água. */
export const DUCK_SHORE_REACH=96;
const RING=[[1,0],[-1,0],[0,1],[0,-1],[.71,.71],[-.71,.71],[.71,-.71],[-.71,-.71]] as const;
/** Patos usam o lago e a margem em volta (até `DUCK_SHORE_REACH`); sólidos continuam bloqueando. */
export function duckHabitatBlocked(x:number,y:number,water:(x:number,y:number)=>boolean,solid:(x:number,y:number)=>boolean):boolean{
 if(x<32||y<32||x>3040||y>2272||solid(x,y))return true;
 if(water(x,y))return false;
 for(let r=32;r<=DUCK_SHORE_REACH;r+=32)for(const [dx,dy] of RING)if(water(x+dx*r,y+dy*r))return false;
 return true;
}
export function createForestDuck(id:string,x:number,y:number,water:(x:number,y:number)=>boolean,solid:(x:number,y:number)=>boolean):AnimalBrain|undefined{
 const blockedPoint=(px:number,py:number)=>duckHabitatBlocked(px,py,water,solid);
 // Terra um pouco mais "cara" que a água: passeiam pela margem às vezes e fogem pela água.
 const brain=new AnimalBrain(id,'duck',x,y,true,(tx,ty)=>blockedPoint(tx*32+16,ty*32+16),84,(tx,ty)=>water(tx*32+16,ty*32+16)?0:1.2,blockedPoint,solid);
 // Lago e margem não mudam enquanto a cena está aberta: a rota de fuga reaproveita as conferências.
 brain.staticWorld=true;
 if(water(x,y)&&brain.canStand(x,y))return brain;
 for(let r=1;r<=6;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){
  if(Math.abs(dx)!==r&&Math.abs(dy)!==r)continue;const px=x+dx*32,py=y+dy*32;if(water(px,py)&&brain.canStand(px,py)){brain.x=px;brain.y=py;return brain;}
 }
}
export const ducksOnWater=(ducks:readonly AnimalPoint[],water:(x:number,y:number)=>boolean)=>ducks.filter(d=>water(d.x,d.y)).length;
