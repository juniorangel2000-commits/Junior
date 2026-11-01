import type {CharacterId} from './characters';
export const FISHING_DIRECTIONS=['north','south','west','east'] as const;
export type FishingDirection=typeof FISHING_DIRECTIONS[number];
export interface FishingCharacterPose {
 foot:readonly [number,number];
 head:number;
 height:number;
 ground:number;
 tip:readonly [number,number];
}
/** Authored 627px cells. Height and ground offset match each original idle silhouette. */
export const FISHING_CHARACTER_POSES:Record<CharacterId,Record<FishingDirection,FishingCharacterPose>>={
 'farmer-female':{
  north:{foot:[402.5,594],head:168,height:48.75,ground:-3.5,tip:[165,68]},
  south:{foot:[211,594],head:168,height:48.5,ground:-3,tip:[467,76]},
  west:{foot:[416.5,550],head:116,height:48.75,ground:-3,tip:[132,25]},
  east:{foot:[188.5,551],head:116,height:48.75,ground:-3,tip:[497,26]},
 },
 'farmer-male':{
  north:{foot:[385,610],head:161,height:54.25,ground:-4.25,tip:[177,86]},
  south:{foot:[216.5,611],head:169,height:54,ground:-4.5,tip:[499,107]},
  west:{foot:[391,558],head:94,height:55,ground:-3,tip:[98,29]},
  east:{foot:[218.5,558],head:95,height:55,ground:-3,tip:[531,28]},
 },
};
export const FISHING_POSE_CELL=627;
export const fishingCharacterKey=(id:CharacterId)=>`fishing-character-${id}`;
export const fishingCharacterFile=(id:CharacterId)=>`assets/visual/fishing/characters/${id}.png`;
export function fishingDirection(x:number,y:number):FishingDirection {
 return Math.abs(x)>Math.abs(y)?x<0?'west':'east':y<0?'north':'south';
}
export const fishingFacing=(direction:FishingDirection)=>({x:direction==='west'?-1:direction==='east'?1:0,y:direction==='north'?-1:direction==='south'?1:0});
export function fishingPoseScale(pose:FishingCharacterPose):number{return pose.height/(pose.foot[1]-pose.head);}
/** Foot-anchored transform, also used for the line's exact attachment to the drawn tip. */
export function fishingPosePoint(pose:FishingCharacterPose,point:readonly [number,number],x:number,y:number,rotation=0):{x:number;y:number}{
 const scale=fishingPoseScale(pose),dx=(point[0]-pose.foot[0])*scale,dy=(point[1]-pose.foot[1])*scale,c=Math.cos(rotation),s=Math.sin(rotation);
 return{x:x+dx*c-dy*s,y:y+pose.ground+dx*s+dy*c};
}
