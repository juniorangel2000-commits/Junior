import {describe,it,expect} from 'vitest';
import {LAKE_CITY_ENTRY,LAKE_PROPERTY_ENTRY,LAKE_OBJECTS,lakeBlockedPoint,lakeWater,lakeWaterDistance,lakeTrailDistance,LAKE_PIER,LAKE_BRIDGE,lakeTerrace,lakeStairs,lakePier,lakeBridge,lakeObjects,lakeLowVegetationClear,lakeWestCliff} from '../src/data/fishing-lake';
import {createNewSave,validateSave,migrateSave} from '../src/systems/save';
import {defaultMap} from '../src/data/default-maps';
import {readSceneMap,writeSceneMap} from '../src/systems/scene-map-edits';
import {cityForestBlockedPoint} from '../src/data/city-forest';
function reachable(){const queue=[LAKE_CITY_ENTRY],visited=new Set<string>();for(let at=0;at<queue.length;at++){const p=queue[at],key=`${p.x},${p.y}`;if(visited.has(key)||lakeBlockedPoint((p.x+.5)*32,(p.y+.5)*32))continue;visited.add(key);for(const[dx,dy]of[[0,1],[0,-1],[1,0],[-1,0]])queue.push({x:p.x+dx,y:p.y+dy});}return visited;}
describe('Lago entre as Serras',()=>{
 it('connects east entrance, south exit, terrace staircase and pier without crossing cliffs or lake',()=>{
  const connected=reachable();for(const p of[LAKE_CITY_ENTRY,LAKE_PROPERTY_ENTRY,{x:34,y:20},{x:28,y:5},{x:67,y:46},{x:32,y:60}])expect(connected.has(`${p.x},${p.y}`),JSON.stringify(p)).toBe(true);
  expect(lakeBlockedPoint(48*32,40*32)).toBe(true);expect(lakeBlockedPoint(40*32,10*32)).toBe(true);
 });
 it('keeps river aligned with the property and supports bridge and pier over real water',()=>{
  expect(lakeWater(45.5,71.5)).toBe(true);expect(lakeWater(48,1)).toBe(true);
  expect(lakePier(67,46)).toBe(true);expect(lakeBlockedPoint(67*32,46*32)).toBe(false);
  expect(lakeBridge(32,60)).toBe(true);expect(lakeBlockedPoint(32*32,60*32)).toBe(false);
  expect(lakeTerrace(28,5)).toBe(true);expect(lakeStairs(34,20)).toBe(true);
 });
 it('keeps the stair landing out of the water and aligns both ends of the bridge with the trail',()=>{
  expect(lakeTrailDistance(34,23.3)).toBeLessThan(.1);
  expect(lakeWater(49,20)).toBe(true);expect(lakeWater(49,23)).toBe(true);
  expect(lakeWaterDistance(34.5,23)).toBeGreaterThan(0);expect(lakeWaterDistance(34.5,25)).toBeGreaterThan(.5);expect(lakeWaterDistance(34.5,27)).toBeLessThan(0);
  for(const x of[LAKE_BRIDGE.x,LAKE_BRIDGE.x+LAKE_BRIDGE.width]){
   expect(lakeTrailDistance(x,LAKE_BRIDGE.centerY)).toBeLessThan(5/32);
   expect(lakeBlockedPoint(x*32,LAKE_BRIDGE.centerY*32)).toBe(false);
  }
  const pierEnd=LAKE_PIER.x/32+18.5;
  expect(pierEnd).toBe(79.5);expect(lakePier(pierEnd,46.5)).toBe(true);
  expect(lakePier(82,46.5)).toBe(false);
 });
 it('keeps tree roots on land and avoids paths, stairs, decks and water',()=>{
  expect(LAKE_OBJECTS.filter(p=>p.kind==='standingTree'||p.kind==='pine').length).toBeGreaterThan(100);
  for(const p of LAKE_OBJECTS.filter(p=>p.kind==='standingTree'||p.kind==='pine'))expect(lakeWaterDistance(p.x+.5,p.y+.5)).toBeGreaterThan(1.8);
  for(let x=1;x<=5;x++)expect(cityForestBlockedPoint((x+.5)*32,33.5*32)).toBe(false);
 });
 it('keeps low vegetation in irregular dry patches clear of paths and entrances',()=>{
  const plants=LAKE_OBJECTS.filter(p=>p.kind.startsWith('tallGrass')||['fern','whiteFlowers','bush','mushrooms'].includes(p.kind));
  expect(plants.length).toBeGreaterThan(40);for(const p of plants)expect(lakeLowVegetationClear(p.x,p.y),p.id).toBe(true);
  const map=defaultMap('fishingLake'),plant=plants[0];map.terrain[`${plant.x},${plant.y}`]='water';expect(lakeLowVegetationClear(plant.x,plant.y,map)).toBe(false);
  expect(lakeWestCliff(94.5,33.5)).toBe(false);
 });
 it('persists independent edits, lake position and validates compatibility without altering older maps',()=>{
  const save=createNewSave({name:'Lago',skin:'#e9bc98',hairColor:'#563b2c',outfit:'#457398',hairStyle:'preso'}),map=defaultMap('fishingLake');
  save.activeArea='fishingLake';save.fishingLakePosition={x:92.5*32,y:33.5*32,direction:'left'};
  map.objects['editor-whiteFlowers-clearing']={x:88,y:64,kind:'whiteFlowers'};writeSceneMap(save,'fishingLake',map);
  expect(validateSave(save)).toBe(true);expect(migrateSave(save)).not.toBeNull();expect(readSceneMap(save,'fishingLake')).toEqual(map);expect(save.cityForestMapEdits).toBeUndefined();
  const native=LAKE_OBJECTS.find(p=>p.kind==='standingTree')!;const moved=defaultMap('fishingLake');moved.objects[native.id]={x:90,y:61};expect(lakeObjects(moved).find(p=>p.id===native.id)?.x).toBe(90);expect(native.x).not.toBe(90);
  save.fishingLakeMapEdits!.area='forest';expect(validateSave(save)).toBe(false);
 });
});
