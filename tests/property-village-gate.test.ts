import {afterAll,beforeAll,beforeEach,describe,expect,it,vi} from 'vitest';
import type Phaser from 'phaser';
import {createWorld} from '../src/world';
import {defaultMap} from '../src/data/default-maps';
import {emptyMapEdits,validateMapEdits} from '../src/systems/map-editor';
import {PROPERTY_VILLAGE_ENTRY,PROPERTY_VILLAGE_EXIT,isPropertyVillagePassage,isPropertyVillageCanopyClearance,propertyVillageGateActive} from '../src/data/property-village-gate';
import {editorBaselineObjects} from '../src/map-editor-baseline';
import {drawExitSign} from '../src/exit-signs';
import {exitSignLayout} from '../src/data/exit-signs';
import previousProperty from '../src/data/maps/previous-property-v3.json';

vi.mock('../src/bridge-art',()=>({drawPropertyBridges:vi.fn()}));
vi.mock('../src/water-motion',()=>({addWaterMotion:vi.fn()}));
vi.mock('../src/exit-signs',()=>({drawExitSign:vi.fn()}));
vi.mock('../src/map-editor-terrain',()=>({drawMapTerrainEdits:vi.fn()}));
vi.mock('phaser',()=>({default:{Textures:{FilterMode:{NEAREST:0}}}}));
const object={
 setData(){return this;},setDisplaySize(){return this;},setOrigin(){return this;},setScale(){return this;},setDepth(){return this;},setFlipX(){return this;},setAlpha(){return this;},destroy(){return this;},
 fillStyle(){return this;},fillRect(){return this;},lineStyle(){return this;},lineBetween(){return this;},
};
const scene={
 textures:{exists:()=>false,addCanvas:()=>({setFilter(){return this;}})},
 add:{image:()=>Object.create(object),graphics:()=>Object.create(object),text:()=>Object.create(object)},
} as unknown as Phaser.Scene;
beforeAll(()=>vi.stubGlobal('document',{createElement:()=>({width:0,height:0,getContext:()=>({fillStyle:'',fillRect(){}})})}));
afterAll(()=>vi.unstubAllGlobals());
beforeEach(()=>vi.clearAllMocks());

describe('east property passage to the village',()=>{
 it('keeps the original western forest passage and adds one right-facing sign',()=>{
  const data=defaultMap('property');expect(validateMapEdits(data)).toBe(true);
  expect(data.points).toEqual(previousProperty.points);
  createWorld(scene,[],[],data);
  expect(drawExitSign).toHaveBeenCalledTimes(2);
  expect(drawExitSign).toHaveBeenCalledWith(scene,PROPERTY_VILLAGE_EXIT,PROPERTY_VILLAGE_ENTRY);
  expect(exitSignLayout(PROPERTY_VILLAGE_EXIT,PROPERTY_VILLAGE_ENTRY).direction).toBe('right');
 });
 it('leaves the approach, arrival and transition squares free in the authored map',()=>{
  const world=createWorld(scene,[],[],defaultMap('property'));
  for(let y=50;y<=54;y++)for(let x=84;x<=94;x++){
   expect(world.isSolid(x,y),`blocked ${x},${y}`).toBe(false);
   expect(world.isWater(x,y),`wet ${x},${y}`).toBe(false);
   expect(world.editorObjects.some(o=>o.x===x&&o.y===y),`prop ${x},${y}`).toBe(false);
  }
  expect(world.editorObjects.some(o=>isPropertyVillageCanopyClearance(o.x,o.y))).toBe(false);
 });
 it('preserves deliberate floor paint and explicitly placed or moved objects',()=>{
  const data=defaultMap('property');
  data.terrain['90,52']='wood';data.terrain['91,52']='water';
  data.objects['editor-oakA-village-player']={x:89,y:52,kind:'oakA'};
  const world=createWorld(scene,[],[],data);
  expect(world.isWater(90,52)).toBe(false);expect(world.isWater(91,52)).toBe(true);
  expect(world.editorObjects.find(o=>o.id==='editor-oakA-village-player')).toMatchObject({x:89,y:52});
  expect(world.isSolid(89,52)).toBe(true);
 });
 it('prevents saved natural resources reappearing in the passage',()=>{
  const world=createWorld(scene,[],[],defaultMap('property'));
  world.setNaturalResources([{id:'spawn-p-stone-1',kind:'stone',x:94,y:52},{id:'spawn-p-vein-2',kind:'vein',x:92,y:51}]);
  expect(world.resources.some(n=>isPropertyVillagePassage(n.x,n.y))).toBe(false);
 });
 it('uses the same implicit-object suppression in editor validation and runtime',()=>{
  const data=defaultMap('property');
  const tree={id:'standingTree-90-52',x:90,y:52,kind:'standingTree' as const,texture:''};
  const resource={id:'stone-90-53',x:90,y:53,kind:'stone' as const,texture:''};
  expect(editorBaselineObjects([tree,resource],data)).toEqual([]);
  data.objects[tree.id]={x:89,y:53};
  expect(editorBaselineObjects([tree,resource],data)).toEqual([tree]);
 });
 it('leaves sparse legacy drafts and the original baseline unchanged',()=>{
  expect(propertyVillageGateActive(undefined)).toBe(false);
  expect(propertyVillageGateActive(emptyMapEdits())).toBe(false);
  const original=createWorld(scene,[]),draft=createWorld(scene,[],[],emptyMapEdits());
  expect(draft.resources).toEqual(original.resources);
  expect(isPropertyVillagePassage(83,52)).toBe(false);
  expect(isPropertyVillagePassage(94,52)).toBe(true);
  expect(isPropertyVillagePassage(94,55)).toBe(false);
 });
});
