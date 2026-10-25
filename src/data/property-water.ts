import { TILE } from './world-size';
import { PROPERTY_BRIDGES } from './bridges';
import {lakeDistance} from './water-contours';

export const PROPERTY_RIVER_WIDTH = 5*TILE;
const smooth=(v:number):number=>{const t=Math.max(0,Math.min(1,v));return t*t*(3-2*t);};
export function riverBanksAt(y:number):{left:number;right:number} {
  const row=y/TILE-.5;
  let centre=(45.5+Math.sin(row*.24)*2+Math.sin(row*.61+1)*.5+Math.sin(row*.095-.5)*.35)*TILE;
  let half=PROPERTY_RIVER_WIDTH/2*(.96+.11*Math.sin(row*.31+.7)+.07*Math.sin(row*.74));
  for(const bridge of PROPERTY_BRIDGES) {
    const top=bridge.y*TILE,bottom=(bridge.y+bridge.height)*TILE;
    const reach=3*TILE;
    if(y<=top-reach||y>=bottom+reach)continue;
    const blend=y<top?smooth((y-top+reach)/reach):y>bottom?smooth((bottom+reach-y)/reach):1;
    centre+=((bridge.x+bridge.width/2)*TILE-centre)*blend;
    half+=(Math.min(half,bridge.width*TILE/2-16)-half)*blend;
  }
  return {left:centre-half,right:centre+half};
}
/** Rendering, swimming, navigation cells and sand all share this same contour. */
export function waterDistanceAt(x:number,y:number):number {
  if(!Number.isFinite(x)||!Number.isFinite(y))return Infinity;
  const {left,right}=riverBanksAt(y);
  const river=Math.max(left-x,x-right)/1.15;
  const pond=lakeDistance(x,y,36.5*TILE,30.5*TILE,Math.sqrt(33)*TILE,Math.sqrt(15)*TILE,1.8);
  const eastPond=lakeDistance(x,y,80.5*TILE,10.5*TILE,Math.sqrt(30)*TILE,Math.sqrt(10)*TILE,4.1);
  return Math.min(river,pond,eastPond);
}
export const isWaterPoint=(x:number,y:number):boolean=>waterDistanceAt(x,y)<0;

/** One irregular sandy bank, about one tile wide, with a darker damp inner edge. */
export function shoreSandAt(x:number,y:number,distance=waterDistanceAt(x,y)):{weight:number;moisture:number} {
  if(!Number.isFinite(distance)||distance<0)return {weight:0,moisture:.76};
  const width=32+Math.sin(x*.009+y*.004)*7+Math.sin(y*.015-x*.003)*4;
  return {weight:smooth((width-distance)/14),moisture:.76+.24*smooth((distance-1)/18)};
}
