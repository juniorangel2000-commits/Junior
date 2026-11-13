import poses from '../data/cow-poses.json';
import {animalFrame} from '../data/animal-art';
import type {CharacterDirection} from '../character-directions';
export type CowRestPhase='awake'|'settling'|'lying'|'resting'|'rising';
export const COW_REST_TIMING={turn:.45,lieFps:6,restFps:2.5,riseFps:5}as const;
/** Complete authored transitions. Rest never advances the physical cow's position. */
export class CowRestCycle{
 phase:CowRestPhase='awake';direction:'down'|'left'|'right'='down';private elapsed=0;private idle=0;private delay:number;private wakeRequested=false;private readonly restDuration:number;
 constructor(id:string,firstRestSeconds?:number){let seed=0;for(const c of id)seed=(Math.imul(seed,31)+c.charCodeAt(0))>>>0;this.delay=firstRestSeconds??8+seed%8;this.restDuration=10+seed%7;}
 get locked():boolean{return this.phase!=='awake';}
 private transition(phase:CowRestPhase){this.phase=phase;this.elapsed=0;}
 update(delta:number,eligible:boolean,canLie:boolean,direction:CharacterDirection,standingStill:boolean):void{
  const dt=Math.max(0,Math.min(delta,.1));if(!dt)return;
  if(this.phase==='awake'){
   if(!eligible){this.idle=0;return;}this.idle+=dt;
   if(this.idle>=this.delay&&canLie&&standingStill){this.direction=direction.includes('left')?'left':direction.includes('right')?'right':direction==='up'?'left':'down';this.wakeRequested=false;this.transition('settling');}return;
  }
  this.elapsed+=dt;if(!eligible)this.wakeRequested=true;
  if(this.phase==='settling'){
   if(this.wakeRequested){this.transition('awake');this.idle=0;return;}
   if(this.elapsed>=COW_REST_TIMING.turn)this.transition('lying');
  }else if(this.phase==='lying'&&this.elapsed>=8/COW_REST_TIMING.lieFps)this.transition(this.wakeRequested?'rising':'resting');
  else if(this.phase==='resting'&&(this.wakeRequested||this.elapsed>=this.restDuration))this.transition('rising');
  else if(this.phase==='rising'&&this.elapsed>=6/COW_REST_TIMING.riseFps){this.transition('awake');this.idle=0;this.delay=12;}
 }
 frame():number|undefined{
  if(this.phase==='awake')return;
  if(this.phase==='settling')return animalFrame('cow',this.direction,false,0);
  const key=this.direction==='left'?'west':this.direction==='right'?'east':'south';
  const action=this.phase==='lying'?'Lie_Down':this.phase==='rising'?'Stand_Up':'Rest_Cycle',frames=poses.animations[action][key];
  const rate=this.phase==='lying'?COW_REST_TIMING.lieFps:this.phase==='rising'?COW_REST_TIMING.riseFps:COW_REST_TIMING.restFps;
  const index=this.phase==='resting'?Math.floor(this.elapsed*rate)%frames.length:Math.min(frames.length-1,Math.floor(this.elapsed*rate));return frames[index];
 }
}
