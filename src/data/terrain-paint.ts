import type {TerrainKind} from '../systems/map-editor';
import {TILE} from './world-size';
const smooth=(v:number)=>{const t=Math.max(0,Math.min(1,v));return t*t*(3-2*t);};

/** Feathers only the outside of a painted land patch; edited centres stay intact. */
export function terrainPaintAlpha(terrain:Readonly<Record<string,TerrainKind>>,x:number,y:number):number {
  const tx=Math.floor(x/TILE),ty=Math.floor(y/TILE),kind=terrain[`${tx},${ty}`];
  if(!kind)return 0;
  if(kind==='water'||kind==='wood'||kind==='paving')return 1;
  const px=x-tx*TILE,py=y-ty*TILE;
  const absent=(dx:number,dy:number)=>terrain[`${tx+dx},${ty+dy}`]===undefined;
  const l=absent(-1,0),r=absent(1,0),t=absent(0,-1),b=absent(0,1);
  let edge=Math.min(l?px:32,r?32-px:32,t?py:32,b?32-py:32);
  // Round convex corners, including diagonal gaps between painted clusters.
  for(const [cx,cy,open] of [[0,0,l&&t],[32,0,r&&t],[0,32,l&&b],[32,32,r&&b]] as const){
    if(open){const dx=Math.abs(px-cx),dy=Math.abs(py-cy);if(dx<12&&dy<12)edge=Math.min(edge,12-Math.hypot(12-dx,12-dy));}
  }
  const broken=Math.sin(x*.09+y*.065)*1.3+Math.sin(y*.16-x*.045)*.8;
  return smooth((edge+broken)/9);
}

export function paintedWaterPoint(terrain:Readonly<Record<string,TerrainKind>>|undefined,x:number,y:number,base:(x:number,y:number)=>boolean):boolean {
  const kind=terrain?.[`${Math.floor(x/TILE)},${Math.floor(y/TILE)}`];
  if(!kind)return base(x,y);
  if(kind==='water')return true;
  return terrainPaintAlpha(terrain!,x,y)<.5&&base(x,y);
}
