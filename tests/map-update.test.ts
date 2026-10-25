import {describe,it,expect} from 'vitest';
import {defaultMap,previousDefaultMap,atMapExit,MAP_BASE_REVISION} from '../src/data/default-maps';
import property from '../src/data/maps/property.json';
import forest from '../src/data/maps/forest.json';
import {validateMapEdits,emptyMapEdits} from '../src/systems/map-editor';
import {createNewSave,migrateSave,validateSave} from '../src/systems/save';
const profile={name:'Mapas',characterId:'farmer-female' as const,skin:'#e9bc98',hairColor:'#563b2c',outfit:'#457398',hairStyle:'preso' as const};
describe('author supplied maps',()=>{
 it('uses the final author exports unchanged and returns independent copies',()=>{
  expect(defaultMap('property')).toEqual(property);expect(defaultMap('forest')).toEqual(forest);
  const copy=defaultMap('property');copy.terrain['10,10']='wood';expect(defaultMap('property')).toEqual(property);
 });
 it.each(['property','forest'] as const)('validates %s and preserves independent arrival and exit points',area=>{
  const data=defaultMap(area);expect(validateMapEdits(data)).toBe(true);
  expect(data.points).toEqual(area==='forest'?{entry:{x:93,y:46},exit:{x:94,y:46}}:{entry:{x:2,y:52},exit:{x:1,y:52}});
  const p=data.points!.exit!;expect(atMapExit(p.x*32+16,p.y*32+16,p)).toBe(true);expect(atMapExit((p.x+1)*32+16,p.y*32+16,p)).toBe(false);
 });
 it('closes the former southern exit with forest ground and varied trees',()=>{
  const map=defaultMap('forest');expect(map.terrain['48,69']).toBe('forest');expect(Object.values(map.objects).some(o=>!o.removed&&o.x===48&&o.y===69)).toBe(true);
 });
 it('upgrades old maps once, without changing rewards or subsequent local edits',()=>{
  const save=createNewSave(profile);delete save.mapBaseRevision;save.mapEdits=emptyMapEdits();save.mapEdits.points={exit:{x:75,y:18}};save.depletedResources=['standingTree-17-11'];
  const upgraded=migrateSave(save)!;expect(validateSave(upgraded)).toBe(true);expect(upgraded.mapEdits?.points?.exit).toEqual({x:1,y:52});expect(upgraded.depletedResources).toEqual(save.depletedResources);
  upgraded.mapEdits!.points!.exit={x:5,y:50};expect(migrateSave(upgraded)?.mapEdits?.points?.exit).toEqual({x:5,y:50});
 });
 it('updates a 0.9.6 save to both finished maps without retaining outdated baseline paint',()=>{
  const old=createNewSave(profile);old.mapBaseRevision=1;old.mapEdits=previousDefaultMap('property');old.forestMapEdits=previousDefaultMap('forest');
  old.inventory.stone=19;old.depletedResources=['standingTree-17-11'];old.homeSupplies={wateringCan:true,seedPacket:true};
  const result=migrateSave(old)!;expect(validateSave(result)).toBe(true);expect(result.mapBaseRevision).toBe(MAP_BASE_REVISION);
  expect(result.mapEdits).toEqual(defaultMap('property'));expect(result.forestMapEdits).toEqual(defaultMap('forest'));
  expect(result.inventory).toEqual(old.inventory);expect(result.homeSupplies).toEqual(old.homeSupplies);expect(result.depletedResources).toEqual(old.depletedResources);
  expect(old.mapEdits).toEqual(previousDefaultMap('property'));
 });
 it('keeps player painting, erased paint, resources and custom gates across the update and later reloads',()=>{
  const old=createNewSave(profile);old.mapBaseRevision=1;old.mapEdits=previousDefaultMap('property');old.forestMapEdits=previousDefaultMap('forest');
  const erased=Object.keys(old.mapEdits.terrain).find(k=>defaultMap('property').terrain[k]!==undefined)!;
  delete old.mapEdits.terrain[erased];old.mapEdits.terrain['10,10']='wood';old.mapEdits.points!.exit={x:5,y:50};
  old.forestMapEdits.objects['editor-fiber-kept']={kind:'fiber',x:3,y:5};
  const result=migrateSave(old)!;expect(validateSave(result)).toBe(true);expect(result.mapEdits!.terrain[erased]).toBeUndefined();
  expect(result.mapEdits!.terrain['10,10']).toBe('wood');expect(result.mapEdits!.points!.exit).toEqual({x:5,y:50});
  expect(result.forestMapEdits!.objects['editor-fiber-kept']).toEqual(old.forestMapEdits.objects['editor-fiber-kept']);
  result.mapEdits!.terrain['10,10']='sand';expect(migrateSave(result)!.mapEdits!.terrain['10,10']).toBe('sand');
 });
});
