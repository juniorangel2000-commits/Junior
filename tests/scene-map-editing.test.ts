import {describe,it,expect,vi,afterEach} from 'vitest';
import {defaultMap} from '../src/data/default-maps';
import {EDITOR_AREAS} from '../src/data/editor-areas';
import {validateMapEdits,cloneMapEdits,MapEditHistory,saveMapDraft,loadMapDraft} from '../src/systems/map-editor';
import {readSceneMap,writeSceneMap} from '../src/systems/scene-map-edits';
import {createNewSave,validateSave,saveGame,loadSave,SAVE_KEY,SAVE_BACKUP_KEY,SAVE_VERSION} from '../src/systems/save';
import {villageProps,villagePropAt,villagePointBlocked} from '../src/data/village';
import {plazaFurniture,plazaEditorId,plazaFurnitureBlockedPoint} from '../src/data/village-plaza';
import {cityMapObjects} from '../src/data/city-forest-layout';
import {cityForestBlockedPoint} from '../src/data/city-forest';
import {editedDungeonObstacles,dungeonObjectId,dungeonBlocked} from '../src/dungeons/maps';
import {dungeonLightSources} from '../src/dungeons/lighting';
import {dungeonSegmentClear,dungeonWaypoint} from '../src/dungeons/navigation';
import {DungeonRun} from '../src/dungeons/run';
import {createDungeonProgress} from '../src/dungeons/progression';
import {validDungeonSnapshot} from '../src/dungeons/snapshot';
const fresh=()=>createNewSave({name:'Editor',skin:'#e9bc98',hairColor:'#563b2c',outfit:'#457398',hairStyle:'preso'});
afterEach(()=>vi.unstubAllGlobals());
function storage(){const values=new Map<string,string>();const store={get length(){return values.size;},key:(i:number)=>[...values.keys()][i]??null,getItem:(k:string)=>values.get(k)??null,setItem:(k:string,v:string)=>{values.set(k,v);},removeItem:(k:string)=>{values.delete(k);}};vi.stubGlobal('localStorage',store);return store;}
describe('all editable scene maps',()=>{
 it('keeps independent maps and drafts compatible with the saved game',()=>{
  const store=storage(),s=fresh();
  for(const area of EDITOR_AREAS){
   const map=defaultMap(area);map.terrain['75,65']='wood';
   expect(validateMapEdits(map)).toBe(true);writeSceneMap(s,area,map);
   expect(saveMapDraft(map,store)).toBe(true);expect(loadMapDraft(store,map.area)).toEqual(cloneMapEdits(map));
  }
  expect(validateSave(s)).toBe(true);expect(saveGame(s)).toBe(true);const loaded=loadSave()!;
  for(const area of EDITOR_AREAS)expect(readSceneMap(loaded,area).terrain['75,65']).toBe('wood');
  const wrong=structuredClone(s);wrong.cityForestMapEdits!.area='forest';expect(validateSave(wrong)).toBe(false);
 });
 it('migrates preview.23 saves in memory and backs up the original bytes before writing the new format',()=>{
  const store=storage(),old={...fresh(),version:3},raw=JSON.stringify(old);store.setItem(SAVE_KEY,raw);
  const loaded=loadSave()!;expect(loaded.version).toBe(SAVE_VERSION);expect(store.getItem(SAVE_KEY)).toBe(raw);
  writeSceneMap(loaded,'cityForest',defaultMap('cityForest'));expect(saveGame(loaded)).toBe(true);
  expect(store.getItem(SAVE_BACKUP_KEY)).toBe(raw);expect(loadSave()!.cityForestMapEdits!.area).toBe('cityForest');
 });
 it('uses the complete urban prop footprint in the city, beyond its root tile',()=>{
  const map=defaultMap('cityForest');map.objects['editor-urban-van-qa']={x:80,y:10,kind:'urban-van'};
  expect(validateMapEdits(map)).toBe(true);
  expect(cityForestBlockedPoint(80.5*32,10*32-20,map)).toBe(true);
  expect(cityForestBlockedPoint(80.5*32,10*32-20)).toBe(false);
 });
 it('moves and removes village barrels, lamps and benches without changing the default layout',()=>{
  for(const kind of ['barrel','lantern','bench'] as const){
   const map=defaultMap('village'),prop=villageProps().find(p=>p.kind===kind)!;
   map.objects[prop.id]={x:75,y:65,kind:(kind==='bench'&&prop.facing?`village-bench-${prop.facing}`:`village-${kind}`)};
   expect(validateMapEdits(map)).toBe(true);expect(villagePropAt(75,65,map)).toBe(true);
   expect(villageProps(map).find(p=>p.id===prop.id)).toMatchObject({x:75,y:65});
   expect(villageProps().find(p=>p.id===prop.id)).toMatchObject({x:prop.x,y:prop.y});
   expect(villagePointBlocked(75.5*32,65*32+20,map)).toBe(true);
   const removed=structuredClone(map);removed.objects[prop.id].removed=true;
   expect(villageProps(removed).some(p=>p.id===prop.id)).toBe(false);
  }
 });
 it('moves the benches and shrubs in the plaza with their footprints, without drawing duplicates',()=>{
  const map=defaultMap('village'),prop=plazaFurniture()[0],id=plazaEditorId(prop);
  map.objects[id]={x:75,y:65,kind:'village-bench-south'};
  expect(validateMapEdits(map)).toBe(true);
  expect(plazaFurniture(map).find(p=>plazaEditorId(p)===id)).toMatchObject({x:75,y:65});
  expect(villageProps(map).some(p=>p.id===id)).toBe(false);
  expect(plazaFurnitureBlockedPoint(75.5*32,65*32+20,map)).toBe(true);
  expect(plazaFurnitureBlockedPoint((prop.x+.5)*32,prop.y*32+20,map)).toBe(false);
 });
 it('moves city trees, restores their old ground, and supports undo/redo without affecting another layout',()=>{
  const base=defaultMap('cityForest'),tree=cityMapObjects().find(p=>p.kind==='standingTree')!;
  const map=structuredClone(base);map.objects[tree.id]={x:75,y:65};
  expect(validateMapEdits(map)).toBe(true);const history=new MapEditHistory(base);expect(history.commit(map)).toBe(true);
  expect(cityMapObjects(history.current).find(p=>p.id===tree.id)).toMatchObject({x:75,y:65});
  expect(cityForestBlockedPoint(75.5*32,65.5*32,map)).toBe(true);
  expect(cityForestBlockedPoint((tree.x+.5)*32,(tree.y+.5)*32,map)).toBe(false);
  expect(cityMapObjects(history.undo()!).find(p=>p.id===tree.id)).toMatchObject({x:tree.x,y:tree.y});
  expect(cityMapObjects(history.redo()!).find(p=>p.id===tree.id)).toMatchObject({x:75,y:65});
 });
 it.each(['abandoned-central-square','mall-parking'] as const)('moves dungeon props and lights and keeps the collision and navigation local to %s',id=>{
  const map=defaultMap(id),lamp=editedDungeonObstacles(id).find(p=>p.kind==='lamp')!,key=dungeonObjectId(lamp);
  map.objects[key]={x:75,y:65};map.terrain['50,50']='water';
  expect(validateMapEdits(map)).toBe(true);
  const moved=editedDungeonObstacles(id,map).find(p=>p.id===lamp.id)!;expect(moved).toMatchObject({x:75.5*32,y:65*32+25});
  expect(dungeonBlocked(id,moved.x,moved.y,map)).toBe(true);expect(dungeonBlocked(id,lamp.x,lamp.y,map)).toBe(false);
  expect(dungeonBlocked(id,lamp.x,lamp.y)).toBe(true);
  expect(dungeonLightSources(id,map).some(p=>p.x===moved.x+18)).toBe(true);
  expect(dungeonBlocked(id,50.5*32,50.5*32,map)).toBe(true);expect(dungeonSegmentClear(id,49.5*32,50.5*32,51.5*32,50.5*32,map)).toBe(false);
  const waypoint=dungeonWaypoint(id,49.5*32,50.5*32,51.5*32,50.5*32,map);expect(waypoint).toBeDefined();
  const run=new DungeonRun('edited',id,createDungeonProgress(),undefined,123,true,map);
  const snapshot=run.snapshot();expect(validDungeonSnapshot(snapshot)).toBe(true);const other=new DungeonRun('other',id,createDungeonProgress());other.restore(snapshot);
  expect(other.snapshot()).toEqual(snapshot);expect(other.state.mapEdits).not.toBe(map);
 });
 it('rejects urban props in unrelated maps and edits over protected dungeon arrivals',()=>{
  const village=defaultMap('village');village.objects['editor-urban-sedan-one']={x:75,y:65,kind:'urban-sedan'};expect(validateMapEdits(village)).toBe(false);
  const dungeon=defaultMap('mall-parking');dungeon.terrain['48,58']='water';expect(validateMapEdits(dungeon)).toBe(false);
 });
});
