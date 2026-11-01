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
  north:{foot:[405,595],head:167,height:48.75,ground:-3.5,tip:[557,160]},
  south:{foot:[210.5,595],head:168,height:48.5,ground:-3,tip:[445,620]},
  west:{foot:[418.5,553],head:114,height:48.75,ground:-3,tip:[132,25]},
  east:{foot:[186,553],head:114,height:48.75,ground:-3,tip:[497,26]},
 },
 'farmer-male':{
  north:{foot:[385,611],head:159,height:54.25,ground:-4.25,tip:[565,160]},
  south:{foot:[216.5,612],head:165,height:54,ground:-4.5,tip:[477,622]},
  west:{foot:[392,559],head:91,height:55,ground:-3,tip:[98,29]},
  east:{foot:[219,559],head:92,height:55,ground:-3,tip:[531,28]},
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
