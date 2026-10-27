import manifest from '../../public/assets/visual/architecture/well/manifest.json';
import {TILE} from './world-size';
import {HOMESTEAD_HOUSE} from './property-homestead';
import {wellFootprint} from './architecture-collision';

export const WELL_ROOT='assets/visual/architecture/well';
/** Dense grass/stone silhouette ends here in all eight supplied frames. */
export const WELL_SOURCE_FOOT=247;
export const WELL_SHADOW_FOOT=WELL_SOURCE_FOOT/256;
export const PROPERTY_WELL={x:31.5*TILE,y:HOMESTEAD_HOUSE.groundY+(256-WELL_SOURCE_FOOT)*.42,scale:.42} as const;
export const WELL_FRAME_DURATIONS=manifest.frame_duration_ms;
export const WELL_USE_MS=WELL_FRAME_DURATIONS.reduce((sum,ms)=>sum+ms,0);
export const WELL_BASE={x:PROPERTY_WELL.x,y:PROPERTY_WELL.y-(256-198)*PROPERTY_WELL.scale,rx:30,ry:16} as const;
/** World pixels: padding around both stonework and timber feet. */
export const PROPERTY_WELL_COLLISION_MARGIN=8;
export function wellSolidPoint(x:number,y:number):boolean {
 return wellFootprint(x,y,PROPERTY_WELL,PROPERTY_WELL.scale,PROPERTY_WELL_COLLISION_MARGIN);
}
/** Tile navigation is conservative; player movement uses the exact stone ellipse. */
export function wellSolidTile(x:number,y:number):boolean {
 return [0,8,16,24,31].some(dx=>[0,8,16,24,31].some(dy=>wellSolidPoint(x*TILE+dx,y*TILE+dy)));
}
export function wellSiteTile(x:number,y:number):boolean {return x>=30&&x<=33&&y>=13&&y<=18;}
export function nearPropertyWell(x:number,y:number):boolean {
 return Math.hypot(x-WELL_BASE.x,y-WELL_BASE.y)<=62&&!wellSolidPoint(x,y);
}
export function targetsPropertyWell(x:number,y:number):boolean {
 const px=(x+.5)*TILE,py=(y+.5)*TILE;
 return Math.abs(px-PROPERTY_WELL.x)<=256*PROPERTY_WELL.scale/2&&py>=PROPERTY_WELL.y-256*PROPERTY_WELL.scale&&py<=PROPERTY_WELL.y;
}

/** One completion pulse, exact supplied frame timings, no reward on start/cancel. */
export class WellUseCycle {
 busy=false;
 private elapsed=0;
 get frame():number {
  let time=this.elapsed;
  for(let i=0;i<WELL_FRAME_DURATIONS.length;i++){if(time<WELL_FRAME_DURATIONS[i])return i;time-=WELL_FRAME_DURATIONS[i];}
  return WELL_FRAME_DURATIONS.length-1;
 }
 start():boolean {if(this.busy)return false;this.busy=true;this.elapsed=0;return true;}
 advance(ms:number):boolean {
  if(!this.busy)return false;this.elapsed+=Math.max(0,ms);
  if(this.elapsed<WELL_USE_MS)return false;
  this.cancel();return true;
 }
 cancel():void {this.busy=false;this.elapsed=0;}
}
