import property from './maps/property.json';
import forest from './maps/forest.json';
import type {MapEditData} from '../systems/map-editor';
export type MapArea='property'|'forest';
export const MAP_BASE_REVISION=1;
export function defaultMap(area:MapArea):MapEditData{return structuredClone((area==='forest'?forest:property) as MapEditData);}
/** New shared layout plus local edits; existing local object edits retain priority. */
export function mergeDefaultMap(area:MapArea,local?:MapEditData,keepLocalPoints=true):MapEditData {
 const base=defaultMap(area);if(!local)return base;
 const data={...base,terrain:{...base.terrain,...local.terrain},objects:{...base.objects,...local.objects},points:keepLocalPoints?{...base.points,...local.points}:base.points};
 const occupied=new Map<string,string>();
 for(const [id,o] of Object.entries(data.objects))if(!o.removed){const key=`${o.x},${o.y}`,old=occupied.get(key);if(old)data.objects[old]={...data.objects[old],removed:true};occupied.set(key,id);}
 return data;
}
export function atMapExit(x:number,y:number,point:{x:number;y:number}):boolean{return Math.floor(x/32)===point.x&&Math.floor(y/32)===point.y;}
