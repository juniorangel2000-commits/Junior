import type {CharacterDirection} from '../character-directions';
import {SWIMMING_CONFIG,type SwimState} from './config';
export class SwimmingController {
 depth=0;
 state:SwimState='land';
 isSwimming=false;
 update(targetDepth:number,moving:boolean,direction:CharacterDirection,delta:number):void {
  const target=Math.max(0,Math.min(1,targetDepth));
  this.depth=delta===0?target:this.depth+(target-this.depth)*(1-Math.exp(-SWIMMING_CONFIG.transitionRate*delta));
  if(this.depth<.002)this.depth=0;
  this.isSwimming=target>=SWIMMING_CONFIG.deepThreshold;
  this.state=this.isSwimming?moving?`swim_${direction}`:'swim_idle':target>0?'wading':'land';
 }
}
