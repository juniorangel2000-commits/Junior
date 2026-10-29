import type {CharacterDirection} from '../character-directions';

/** Slow, continuous ambient motion; no tweens, timers or saved gameplay state. */
export function windmillAngle(timeMs:number):number{
 return (timeMs%120000)/120000*Math.PI*2;
}
/** A resident may briefly look to the side after standing still. Walking,
 * conversation and the player's nearby interaction always keep priority. */
export function villageIdleDirection(base:CharacterDirection,stillSeconds:number,seed:number,blocked=false):CharacterDirection{
 if(blocked||stillSeconds<4)return base;
 const phase=(stillSeconds+seed*1.7)%19;
 return phase>12&&phase<14.2?(seed%2?'left':'right'):base;
}
