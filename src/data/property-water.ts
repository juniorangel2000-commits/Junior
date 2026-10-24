import { TILE } from './world-size';
import { PROPERTY_BRIDGES } from './bridges';

export const PROPERTY_RIVER_WIDTH = 5*TILE;
const smooth=(v:number):number=>{const t=Math.max(0,Math.min(1,v));return t*t*(3-2*t);};
export function riverBanksAt(y:number):{left:number;right:number} {
  const phase=(y/TILE-.5)*.24;
  let left=(43+Math.sin(phase)*2)*TILE,right=left+PROPERTY_RIVER_WIDTH;
  for(const bridge of PROPERTY_BRIDGES) {
    const top=bridge.y*TILE,bottom=(bridge.y+bridge.height)*TILE;
    if(y<=top-TILE||y>=bottom+TILE)continue;
    const blend=y<top?smooth((y-top+TILE)/TILE):y>bottom?smooth((bottom+TILE-y)/TILE):1;
    left+=Math.max(bridge.x*TILE-left,0)*blend;
    right-=Math.max(right-(bridge.x+bridge.width)*TILE,0)*blend;
  }
  return {left,right};
}
function ellipseDistance(x:number,y:number,cx:number,cy:number,rx:number,ry:number):number {
  return (Math.hypot((x-cx)/rx,(y-cy)/ry)-1)*Math.min(rx,ry);
}
/** Rendering, swimming, navigation cells and sand all share this same contour. */
export function waterDistanceAt(x:number,y:number):number {
  if(!Number.isFinite(x)||!Number.isFinite(y))return Infinity;
  const {left,right}=riverBanksAt(y),phase=(y/TILE-.5)*.24;
  const river=Math.max(left-x,x-right)/Math.hypot(1,Math.cos(phase)*.48);
  const pond=ellipseDistance(x,y,36.5*TILE,30.5*TILE,Math.sqrt(33)*TILE,Math.sqrt(15)*TILE);
  const eastPond=ellipseDistance(x,y,80.5*TILE,10.5*TILE,Math.sqrt(30)*TILE,Math.sqrt(10)*TILE);
  return Math.min(river,pond,eastPond);
}
export const isWaterPoint=(x:number,y:number):boolean=>waterDistanceAt(x,y)<0;

/** One irregular sandy bank, about one tile wide, with a darker damp inner edge. */
export function shoreSandAt(x:number,y:number,distance=waterDistanceAt(x,y)):{weight:number;moisture:number} {
  if(!Number.isFinite(distance)||distance<0)return {weight:0,moisture:.76};
  const width=32+Math.sin(x*.009+y*.004)*7+Math.sin(y*.015-x*.003)*4;
  return {weight:smooth((width-distance)/14),moisture:.76+.24*smooth((distance-1)/18)};
}
