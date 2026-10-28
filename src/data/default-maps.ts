import property from './maps/property.json';
import forest from './maps/forest.json';
import previousProperty from './maps/previous-property-v1.json';
import previousForest from './maps/previous-forest-v1.json';
import previousPropertyV2 from './maps/previous-property-v2.json';
import previousForestV2 from './maps/previous-forest-v2.json';
import previousPropertyV3 from './maps/previous-property-v3.json';
import previousForestV3 from './maps/previous-forest-v3.json';
import type {MapEditData} from '../systems/map-editor';
import {repairPropertyShore} from './property-shore-repair';
import {clearPropertyVillagePaths} from './property-village-gate';
export type MapArea='property'|'forest'|'village';
export const MAP_BASE_REVISION=4;
export function defaultMap(area:MapArea):MapEditData{
 if(area==='village')return{version:1,width:96,height:72,area:'village',terrain:{},objects:{},points:{entry:{x:2,y:52},exit:{x:1,y:52}}};
 const data=structuredClone((area==='forest'?forest:property) as MapEditData);
 if(area==='property')data.terrain=clearPropertyVillagePaths(data.terrain);
 return data;
}
/** The exact author layout a save was based on, before its local edits. */
export function previousDefaultMap(area:MapArea,revision:1|2|3=1):MapEditData {
 if(area==='village')return defaultMap(area);
 if(revision===3)return structuredClone((area==='forest'?previousForestV3:previousPropertyV3) as MapEditData);
 if(revision===2)return structuredClone((area==='forest'?previousForestV2:previousPropertyV2) as MapEditData);
 const map=structuredClone((area==='forest'?previousForest:previousProperty) as MapEditData);
 if(area==='property')repairPropertyShore(map);
 return map;
}
/** Apply the new author layout while keeping only actual player edits to the old one. */
export function upgradeAuthorMap(area:MapArea,local?:MapEditData,protectedCells:ReadonlySet<string>=new Set(),fromRevision:1|2|3=1):MapEditData {
 const next=defaultMap(area);
 const old=previousDefaultMap(area,fromRevision);
 local??=old;
 // An author-added/moved prop cannot bury a saved crop, tilled cell or building.
 // Local object overrides are applied below and retain their original priority.
 for(const [id,object] of Object.entries(next.objects)){
  if(object.removed||!protectedCells.has(`${object.x},${object.y}`))continue;
  const before=old.objects[id];
  if(!before||before.removed||before.x!==object.x||before.y!==object.y||before.kind!==object.kind)next.objects[id]={...object,removed:true};
 }
 for(const key of new Set([...Object.keys(old.terrain),...Object.keys(local.terrain),...protectedCells])){
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
