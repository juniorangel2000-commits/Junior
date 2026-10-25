import property from './maps/property.json';
import forest from './maps/forest.json';
import previousProperty from './maps/previous-property-v1.json';
import previousForest from './maps/previous-forest-v1.json';
import type {MapEditData} from '../systems/map-editor';
import {repairPropertyShore} from './property-shore-repair';
export type MapArea='property'|'forest';
export const MAP_BASE_REVISION=2;
export function defaultMap(area:MapArea):MapEditData{
 return structuredClone((area==='forest'?forest:property) as MapEditData);
}
/** Revision one as it appeared in 0.9.6, before the author's finished maps. */
export function previousDefaultMap(area:MapArea):MapEditData {
 const map=structuredClone((area==='forest'?previousForest:previousProperty) as MapEditData);
 if(area==='property')repairPropertyShore(map);
 return map;
}
/** Apply the new author layout while keeping only actual player edits to the old one. */
export function upgradeAuthorMap(area:MapArea,local?:MapEditData,protectedCells:ReadonlySet<string>=new Set()):MapEditData {
 const next=defaultMap(area);if(!local)return next;
 const old=previousDefaultMap(area);
 for(const key of new Set([...Object.keys(old.terrain),...Object.keys(local.terrain)])){
  if(local.terrain[key]===old.terrain[key]&&!protectedCells.has(key))continue;
  if(local.terrain[key]===undefined)delete next.terrain[key];else next.terrain[key]=local.terrain[key];
 }
 for(const id of new Set([...Object.keys(old.objects),...Object.keys(local.objects)])){
  const before=old.objects[id],edit=local.objects[id];
  if(edit&&(!before||edit.x!==before.x||edit.y!==before.y||edit.kind!==before.kind||!!edit.removed!==!!before.removed)){delete next.objects[id];next.objects[id]={...edit};}
  else if(before&&!edit)delete next.objects[id];
 }
 for(const name of ['entry','exit'] as const){
  const point=local.points?.[name],before=old.points?.[name];
  if(point&&(point.x!==before?.x||point.y!==before?.y))next.points={...next.points,[name]:{...point}};
 }
 return resolveObjectOverlap(next);
}
/** New shared layout plus local edits; existing local object edits retain priority. */
export function mergeDefaultMap(area:MapArea,local?:MapEditData,keepLocalPoints=true):MapEditData {
 const base=defaultMap(area);if(!local)return base;
 const data={...base,terrain:{...base.terrain,...local.terrain},objects:{...base.objects,...local.objects},points:keepLocalPoints?{...base.points,...local.points}:base.points};
 return resolveObjectOverlap(data);
}
function resolveObjectOverlap(data:MapEditData):MapEditData {
 const occupied=new Map<string,string>();
 for(const [id,o] of Object.entries(data.objects))if(!o.removed){const key=`${o.x},${o.y}`,old=occupied.get(key);if(old)data.objects[old]={...data.objects[old],removed:true};occupied.set(key,id);}
 return data;
}
export function atMapExit(x:number,y:number,point:{x:number;y:number}):boolean{return Math.floor(x/32)===point.x&&Math.floor(y/32)===point.y;}
