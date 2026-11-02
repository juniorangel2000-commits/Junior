import type {SaveData} from '../types';
import {defaultMap,type MapArea} from '../data/default-maps';
import type {MapEditData} from './map-editor';
export function readSceneMap(save:SaveData,area:MapArea):MapEditData {
 const data=area==='property'?save.mapEdits:area==='forest'?save.forestMapEdits:area==='village'?save.villageMapEdits:area==='cityForest'?save.cityForestMapEdits:area==='fishingLake'?save.fishingLakeMapEdits:area==='survivorCamp'?save.survivorCampMapEdits:area==='highland'?save.highlandMapEdits:save.dungeonMapEdits?.[area];
 return structuredClone(data??defaultMap(area));
}
export function writeSceneMap(save:SaveData,area:MapArea,map:MapEditData):void {
 if(area==='property')save.mapEdits=map;else if(area==='forest')save.forestMapEdits=map;else if(area==='village')save.villageMapEdits=map;else if(area==='cityForest')save.cityForestMapEdits=map;else if(area==='fishingLake')save.fishingLakeMapEdits=map;else if(area==='survivorCamp')save.survivorCampMapEdits=map;else if(area==='highland')save.highlandMapEdits=map;else{save.dungeonMapEdits??={};save.dungeonMapEdits[area]=map;}
}
