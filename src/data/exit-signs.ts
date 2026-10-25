import {WORLD_WIDTH,WORLD_HEIGHT,TILE} from './world-size';
export type ExitDirection='left'|'right'|'up'|'down';
type Point={x:number;y:number};
/** The short entry→exit path determines the arrow, including relocated editor gates. */
export function exitSignLayout(exit:Point,entry?:Point):{direction:ExitDirection;x:number;y:number} {
 const dx=entry?exit.x-entry.x:0,dy=entry?exit.y-entry.y:0;
 let direction:ExitDirection;
 if(dx||dy)direction=Math.abs(dx)>=Math.abs(dy)?dx<0?'left':'right':dy<0?'up':'down';
 else {
  const edges=[{direction:'left' as const,distance:exit.x},{direction:'right' as const,distance:WORLD_WIDTH-1-exit.x},{direction:'up' as const,distance:exit.y},{direction:'down' as const,distance:WORLD_HEIGHT-1-exit.y}];
  direction=edges.sort((a,b)=>a.distance-b.distance)[0].direction;
 }
 // Set beside the approach, leaving both gate cells clear and the art on screen.
 const x=direction==='left'?(exit.x+1)*TILE:direction==='right'?exit.x*TILE:(exit.x+.5)*TILE+36;
 const y=direction==='up'?(exit.y+1)*TILE+38:direction==='down'?exit.y*TILE+38:(exit.y+.5)*TILE-28;
 return {direction,x:Math.max(32,Math.min(WORLD_WIDTH*TILE-32,x)),y:Math.max(68,Math.min(WORLD_HEIGHT*TILE-16,y))};
}
