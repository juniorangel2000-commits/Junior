import {urbanFrame,type DungeonObstacle} from '../dungeons/maps';
import {CITY_FOREST_TREES,CITY_FOREST_OBSTACLES} from './city-forest';
import {natureArt} from './nature-catalog';
import {URBAN_PROP_SIZES} from './editor-props';
import type {MapEditData,EditorObjectKind} from '../systems/map-editor';
export interface CityMapObject {id:string;kind:EditorObjectKind;x:number;y:number;variant?:number;scale?:number}
const layouts=new WeakMap<MapEditData,CityMapObject[]>();let original:CityMapObject[]|undefined;
export function cityMapObjects(edits?:MapEditData):CityMapObject[]{
 if(!original)original=[...CITY_FOREST_TREES.map(p=>({...p,id:`${p.pine?'pine':'standingTree'}-${p.x}-${p.y}`,kind:(p.pine?'pine':'standingTree') as EditorObjectKind})),...CITY_FOREST_OBSTACLES.map(p=>({...p,id:`${p.kind}-${p.x}-${p.y}`}))];
 if(!edits)return original;const cached=layouts.get(edits);if(cached)return cached;
 const ids=new Set(original.map(p=>p.id));
 const result=original.flatMap(p=>{const e=edits.objects[p.id];return e?.removed?[]:[{...p,x:e?.x??p.x,y:e?.y??p.y}];});
 for(const [id,e] of Object.entries(edits.objects))if(!ids.has(id)&&!e.removed&&e.kind)result.push({id,kind:e.kind,x:e.x,y:e.y});
 layouts.set(edits,result);return result;
}
export function cityObjectSolid(p:CityMapObject):boolean {
 return p.kind==='standingTree'||p.kind==='pine'||p.kind==='vein'||(p.kind.startsWith('urban-')?URBAN_PROP_SIZES[p.kind as keyof typeof URBAN_PROP_SIZES][2]:!!natureArt(p.kind)?.solid);
}
interface CityCollisions {cells:Set<string>;boxes:Array<{x:number;top:number;bottom:number;halfWidth:number}>}
const solids=new WeakMap<MapEditData,CityCollisions>();
export function editedCityObjectBlocked(px:number,py:number,edits:MapEditData):boolean {
 let collision=solids.get(edits);
 if(!collision){
  const objects=cityMapObjects(edits).filter(cityObjectSolid);
  const cells=new Set(objects.filter(p=>!p.kind.startsWith('urban-')).map(p=>`${p.x},${p.y}`));
  const boxes=objects.filter(p=>p.kind.startsWith('urban-')).map(p=>{
   const [w,h]=URBAN_PROP_SIZES[p.kind as keyof typeof URBAN_PROP_SIZES],kind=p.kind.slice(6) as DungeonObstacle['kind'],frame=urbanFrame(kind),scale=Math.min(w/frame.width,h/frame.height),x=p.x*32+16,y=p.y*32+25;
   if(kind==='lamp')return{x,top:y-9,bottom:y+4,halfWidth:9};
   const depth=frame.height*scale*(['sedan','hatchback','van','suv'].includes(kind)?.85:kind==='bench-vertical'?.9:.6);
   return{x,top:y-depth,bottom:y+6,halfWidth:frame.width*scale*.36};
  });
  collision={cells,boxes};solids.set(edits,collision);
 }
 return collision.cells.has(`${Math.floor(px/32)},${Math.floor(py/32)}`)||collision.boxes.some(b=>Math.abs(px-b.x)<b.halfWidth&&py>b.top&&py<b.bottom);
}
