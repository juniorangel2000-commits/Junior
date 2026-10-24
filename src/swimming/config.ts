import type {CharacterDirection} from '../character-directions';
import type {CharacterId} from '../data/characters';
export const SWIMMING_CONFIG={speedFactor:.55,bodyOpacity:.45,bodyTint:0x164f5a,surfaceOpacity:.22,shallowDistance:8,deepDistance:40,deepThreshold:.35,transitionRate:12,bobAmplitude:.65,idleRippleHz:.38,movingRippleHz:.95} as const;
/** Native 192×256 frame coordinates, measured from each official character's head. */
export const HEAD_BOTTOM:Record<CharacterId,Record<CharacterDirection,number>>={
 'farmer-female':{down:129,up:122,left:125,right:125,'down-left':126,'down-right':128,'up-left':119,'up-right':119},
 'farmer-male':{down:110,up:107,left:111,right:111,'down-left':111,'down-right':111,'up-left':108,'up-right':110},
};
export type SwimState='land'|'wading'|'swim_idle'|`swim_${CharacterDirection}`;
export function sampleWaterDepth(contains:(x:number,y:number)=>boolean,x:number,y:number):number {
 if(!contains(x,y))return 0;
 let nearest:number=SWIMMING_CONFIG.deepDistance;
 for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[.707,.707],[-.707,.707],[.707,-.707],[-.707,-.707]]){
  for(let distance=4;distance<=SWIMMING_CONFIG.deepDistance;distance+=4)if(!contains(x+dx*distance,y+dy*distance)){nearest=Math.min(nearest,distance);break;}
 }
 return Math.max(0,Math.min(1,(nearest-SWIMMING_CONFIG.shallowDistance)/(SWIMMING_CONFIG.deepDistance-SWIMMING_CONFIG.shallowDistance)));
}
