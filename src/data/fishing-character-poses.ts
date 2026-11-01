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
export const fishingCastCharacterKey=(id:CharacterId)=>`fishing-character-cast-${id}`;
export const fishingCastCharacterFile=(id:CharacterId)=>`assets/visual/fishing/characters/${id}-cast.png`;
export type FishingCastStage='prepare'|'release'|'rest';
export const FISHING_CAST_TIMING={release:.3,launch:.35,rest:.72,land:.95} as const;
export const fishingCastStage=(seconds:number):FishingCastStage=>seconds<FISHING_CAST_TIMING.release?'prepare':seconds<FISHING_CAST_TIMING.rest?'release':'rest';
interface CastPose extends FishingCharacterPose {rect:readonly[number,number,number,number]}
/** Irregular atlas rectangles keep the long sideways poles whole. Coordinates are atlas pixels. */
export const FISHING_CAST_POSES:Record<CharacterId,Record<'prepare'|'release',Record<FishingDirection,CastPose>>>={
 'farmer-female':{
  prepare:{
   north:{rect:[152,25,285,431],foot:[236.5,456],head:148,height:48.75,ground:-3.5,tip:[431,85]},
   south:{rect:[573,92,271,366],foot:[674.5,458],head:158,height:48.5,ground:-3,tip:[838,155]},
   west:{rect:[1014,37,199,421],foot:[1108,458],head:155,height:48.75,ground:-3,tip:[1021,94]},
   east:{rect:[1407,37,265,421],foot:[1518,458],head:155,height:48.75,ground:-3,tip:[1666,91]},
  },
  release:{
   north:{rect:[150,468,162,397],foot:[241.5,865],head:590,height:48.75,ground:-3.5,tip:[209,524]},
   south:{rect:[596,538,273,313],foot:[678.5,848],head:538,height:48.5,ground:-3,tip:[860,844]},
   west:{rect:[869,539,354,310],foot:[1115.5,849],head:539,height:48.75,ground:-3,tip:[875,733]},
   east:{rect:[1399,539,364,311],foot:[1505.5,850],head:539,height:48.75,ground:-3,tip:[1755,731]},
  },
 },
 'farmer-male':{
  prepare:{
   north:{rect:[121,20,205,408],foot:[223,428],head:129,height:54.25,ground:-4.25,tip:[127,78]},
   south:{rect:[547,28,259,400],foot:[626,428],head:132,height:54,ground:-4.5,tip:[798,86]},
   west:{rect:[1482,36,243,400],foot:[1555.5,436],head:136,height:55,ground:-3,tip:[1716,89]},
   east:{rect:[948,47,252,387],foot:[1126.5,434],head:136,height:55,ground:-3,tip:[955,127]},
  },
  release:{
   north:{rect:[143,457,162,389],foot:[222.5,846],head:550,height:54.25,ground:-4.25,tip:[149,515]},
   south:{rect:[546,541,294,311],foot:[623,846],head:541,height:54,ground:-4.5,tip:[832,846]},
   west:{rect:[875,540,357,311],foot:[1138.5,851],head:540,height:55,ground:-3,tip:[881,771]},
   east:{rect:[1386,540,361,314],foot:[1472.5,854],head:540,height:55,ground:-3,tip:[1740,769]},
  },
 },
};
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
