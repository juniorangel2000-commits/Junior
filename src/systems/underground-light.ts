import type {TilePoint} from '../types';
import {MINE_HAZARDS} from '../data/underground-hazards';
import {UNDERGROUND,MINE_ROOMS,undergroundLayout,mineCellIndex} from '../data/underground-layout';
import {undergroundBlocked,type UndergroundState} from './underground';
export function mineDarkness(y:number,lantern=false):{alpha:number;radius:number}{
 if(y>=UNDERGROUND.entryY-80)return{alpha:0,radius:190};
 const samples=[{y:UNDERGROUND.entryY-80,alpha:0,radius:190},...(['surface','middle','deep','extreme'] as const).map((depth,i)=>({y:[165,110,65,22][i]*32,...MINE_HAZARDS.darkness[depth]}))];
 let alpha:number=MINE_HAZARDS.darkness.extreme.alpha,radius:number=MINE_HAZARDS.darkness.extreme.radius;
 for(let i=0;i<samples.length-1;i++){const a=samples[i],b=samples[i+1];if(y<=a.y&&y>=b.y){const t=(a.y-y)/(a.y-b.y);alpha=a.alpha+(b.alpha-a.alpha)*t;radius=a.radius+(b.radius-a.radius)*t;break;}}
 return{alpha,radius:radius*(lantern?1.3:1)};
}
/** Bounded ray casts are shared by every carried/fixed light in this mine. */
export function mineLightPolygon(mine:UndergroundState,source:TilePoint,radius:number,rays=96):TilePoint[]{
 return Array.from({length:rays},(_,i)=>{
  const angle=i/rays*Math.PI*2,dx=Math.cos(angle),dy=Math.sin(angle);let distance=radius;
  for(let d=8;d<radius;d+=8)if(undergroundBlocked(mine,source.x+dx*d,source.y+dy*d)){distance=Math.min(radius,d+8);break;}
  return{x:source.x+dx*distance,y:source.y+dy*distance};
 });
}

const fixtures=new Map<number,Array<TilePoint&{radius:number}>>();
/** Exact positions used by the rendered fixed lanterns. */
export function mineFixedLights(mine:UndergroundState):Array<TilePoint&{radius:number}>{
 const cached=fixtures.get(mine.seed);if(cached)return cached;
 const lights=MINE_ROOMS.map(r=>{let row=r.y;const col=r.x-2;while(row>4&&!undergroundLayout(mine.seed).rock[mineCellIndex(col,row)])row--;return{x:col*32+16,y:(row+1)*32+10,radius:80};});fixtures.set(mine.seed,lights);return lights;
}
