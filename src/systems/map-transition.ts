import {exitSignLayout} from '../data/exit-signs';
import {TILE} from '../data/world-size';
type Point={x:number;y:number};
/** Short matched fades avoid holding a black frame between small scenes. */
export const SCENE_FADE_MS=120;

export interface Doorway {
 x:number;
 y:number;
 halfWidth:number;
 depth:number;
 direction:'up'|'down';
}

/** A bounded door strip, armed only by a step through it in the travel direction.
 * Arrival and recovered saves cannot trigger merely by standing on the strip. */
export class DoorwayPassage {
 private pending=false;
 reset():void {this.pending=false;}
 update(from:Point,to:Point,door:Doorway):boolean {
  const sign=door.direction==='down'?1:-1;
  const inside=(x:number)=>x>=door.x-door.halfWidth&&x<door.x+door.halfWidth;
  const past=(to.y-door.y)*sign;
  if(!inside(to.x)||past<=0||past>door.depth){this.pending=false;return false;}
  if(inside(from.x)&&(to.y-from.y)*sign>0)this.pending=true;
  return this.pending;
 }
}

/** One marked passage, armed by an outward step past the sign, never by a key. */
export class MapExitPassage {
 private pending=false;
 reset():void {this.pending=false;}
 update(from:Point,to:Point,exit:Point,entry?:Point):boolean {
  const {direction}=exitSignLayout(exit,entry);
  const horizontal=direction==='left'||direction==='right',outward=direction==='left'||direction==='up'?-1:1;
  const boundary=(horizontal?exit.x:exit.y)*TILE+(outward<0?TILE:0);
  const along=horizontal?to.x:to.y,before=horizontal?from.x:from.y;
  const across=horizontal?to.y:to.x,previousAcross=horizontal?from.y:from.x;
  const low=(horizontal?exit.y:exit.x)*TILE,high=low+TILE;
  const inLane=across>=low&&across<high;
  const past=(along-boundary)*outward>0;
  if(!inLane||!past){this.pending=false;return false;}
  // Recovered saves already beyond the line can still leave by walking outward.
  // A sideways approach or simply standing near the sign does not arm it.
  if(previousAcross>=low&&previousAcross<high&&(along-before)*outward>0)this.pending=true;
  return this.pending;
 }
}
