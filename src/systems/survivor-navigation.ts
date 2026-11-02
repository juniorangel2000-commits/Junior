import type {SaveData} from '../types';
import type {SurvivorArea} from './survivor-camp';
import {defaultMap} from '../data/default-maps';
import {natureArt,collectibleKind} from '../data/nature-catalog';
import {forestWater,FOREST_TREES,FOREST_ROCKS} from '../data/ancient-forest';
import {campApproachDistance} from '../data/forest-camp-access';
import {campBlockedPoint} from '../data/survivor-camp';
import {villageBlockedAt} from '../data/village';
import {isWaterTile,isBridgeTile} from '../data/regions';
import {propertyHouseSolidTile} from '../data/property-collision';
import {wellSolidTile} from '../data/property-well';
import {mountainSolidTile} from '../data/homestead-landscape';
import {shelterSolid} from './pet-shelter';
import {buildingFootprint} from './building';
import {hasMapSeam,seamPassage,seamBand} from '../data/map-seam';
type Blocked=(x:number,y:number)=>boolean;
const active=new WeakMap<SaveData,Partial<Record<SurvivorArea,Blocked>>>();
const caches=new WeakMap<SaveData,Map<SurvivorArea,{until:number;blocked:Blocked}>>();
/** Visible actors use the real scene geometry; background routes use the same authored terrain and solid props. */
export function registerSurvivorNavigation(save:SaveData,area:SurvivorArea,blocked:Blocked):()=>void {
 const entry=active.get(save)??{};entry[area]=blocked;active.set(save,entry);
 return()=>{if(entry[area]===blocked)delete entry[area];};
}
export function survivorNavigation(save:SaveData,area:SurvivorArea):Blocked {
 const visible=save.activeArea===area&&active.get(save)?.[area];if(visible)return visible;
 if(area==='survivorCamp')return(x,y)=>campBlockedPoint((x+.5)*32,(y+.5)*32,save.survivorCampMapEdits);
 if(area==='village')return(x,y)=>villageBlockedAt(x,y,save.villageMapEdits);
 const minute=save.day*1440+save.time;let cache=caches.get(save);if(!cache){cache=new Map();caches.set(save,cache);}const previous=cache.get(area);if(previous&&minute<previous.until&&minute>=previous.until-5)return previous.blocked;
 const edits=(area==='forest'?save.forestMapEdits:save.mapEdits)??defaultMap(area),solid=new Set<string>(),depleted=new Set(save.depletedResources),seam=hasMapSeam(edits);
 const add=(id:string,kind:string,x:number,y:number)=>{const e=edits.objects[id];if(e?.removed||depleted.has((area==='forest'?'f-':'')+id))return;x=e?.x??x;y=e?.y??y;const type=e?.kind??kind;
  if(area==='forest'&&(campApproachDistance((x+.5)*32,(y+.5)*32)<34||!e&&seam&&(seamPassage(x,y,area)||seamBand(x,y,area))))return;
  if(natureArt(type)?.solid||['standingTree','pine','vein','fallenLog','stump'].includes(collectibleKind(type)??''))solid.add(`${x},${y}`);
 };
 if(area==='forest'){
  for(const p of FOREST_TREES)add(`standingTree-${p.x}-${p.y}`,p.pine?'pine':'standingTree',p.x,p.y);
  for(const p of FOREST_ROCKS)add(`lakeRock${String.fromCharCode(65+p.variant)}-${p.x}-${p.y}`,'vein',p.x,p.y);
 }
 for(const[id,p]of Object.entries(edits.objects))if(p.kind)add(id,p.kind,p.x,p.y);
 for(const p of save.resourceFields?.[area].nodes??[])if(['standingTree','vein','fallenLog','stump'].includes(p.kind))solid.add(`${p.x},${p.y}`);
 if(area==='property')for(const b of save.buildings)if(b.kind!=='floor'&&b.kind!=='roof'&&!(b.kind==='gate'&&b.open))for(const p of buildingFootprint(b))solid.add(`${p.x},${p.y}`);
 const blocked:Blocked=(x,y)=>{
  if(x<1||y<1||x>=95||y>=71||solid.has(`${x},${y}`))return true;
  const terrain=edits.terrain[`${x},${y}`],water=terrain?terrain==='water':area==='forest'?forestWater(x,y):isWaterTile(x,y);
  if(water&&(area==='forest'||!isBridgeTile(x,y)))return true;
  return area==='property'&&(propertyHouseSolidTile(x,y)||wellSolidTile(x,y)||!!save.petShelter&&(mountainSolidTile(save.petShelter,x,y)||shelterSolid(save.petShelter,(x+.5)*32,(y+.5)*32)));
 };
 cache.set(area,{until:minute+5,blocked});return blocked;
}
