import {exitSignLayout} from '../data/exit-signs';
import {TILE} from '../data/world-size';
type Point={x:number;y:number};
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
