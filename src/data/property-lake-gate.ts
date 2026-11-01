import type {MapEditData} from '../systems/map-editor';
/** East of the river and mountain, this dry approach meets the existing east-bank trail. */
export const propertyLakeApproach=(x:number,y:number)=>x>=73&&x<=77&&y<=18;
export function withPropertyLakePath(map?:MapEditData):MapEditData {
 const next:MapEditData=map?{...map,terrain:{...map.terrain}}:{version:1,width:96,height:72,terrain:{},objects:{}};
 for(let y=1;y<=17;y++)for(let x=74;x<=76;x++)next.terrain[`${x},${y}`]='path';
 return next;
}
