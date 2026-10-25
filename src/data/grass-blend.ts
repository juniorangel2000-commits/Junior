import type {TerrainKind} from '../systems/map-editor';
import {TILE} from './world-size';
export const GRASS_KINDS=['grass','meadow','forest','moss'] as const;
export type GrassKind=typeof GRASS_KINDS[number];
export type GrassBlend=Record<GrassKind|'base',number>;
export const isGrassKind=(kind:string|undefined):kind is GrassKind=>GRASS_KINDS.some(value=>value===kind);
const smooth=(v:number)=>{const t=Math.max(0,Math.min(1,v));return t*t*(3-2*t);};

/** Mix materials, not neighboring pixels: blades stay crisp while the boundary softens. */
export function grassBlendAt(terrain:Readonly<Record<string,TerrainKind>>,x:number,y:number):GrassBlend|undefined {
 const current=terrain[`${Math.floor(x/TILE)},${Math.floor(y/TILE)}`];if(current&&!isGrassKind(current))return;
 const ex=1-Math.abs(x/TILE-Math.round(x/TILE))*2,ey=1-Math.abs(y/TILE-Math.round(y/TILE))*2;
 const nx=(Math.sin(x*.027+y*.019)*3.5+Math.sin(y*.073)*1.5)*ex;
 const ny=(Math.sin(y*.029-x*.017)*3.5+Math.sin(x*.067)*1.5)*ey;
 const gx=(x+nx)/TILE-.5,gy=(y+ny)/TILE-.5,tx=Math.floor(gx),ty=Math.floor(gy);
 const fx=smooth((gx-tx-.1)/.8),fy=smooth((gy-ty-.1)/.8);
 const result:GrassBlend={grass:0,meadow:0,forest:0,moss:0,base:0};
 for(const [dx,dy,weight] of [[0,0,(1-fx)*(1-fy)],[1,0,fx*(1-fy)],[0,1,(1-fx)*fy],[1,1,fx*fy]]){
  if(weight<.000001)continue;
  const kind=terrain[`${tx+dx},${ty+dy}`];
  if(kind&&!isGrassKind(kind))return;
  result[kind??'base']+=weight;
 }
 return result.base<.999999?result:undefined;
}
