import {describe,it,expect} from 'vitest';
import {defaultMap,atMapExit} from '../src/data/default-maps';
import {validateMapEdits,emptyMapEdits} from '../src/systems/map-editor';
import {createNewSave,migrateSave,validateSave} from '../src/systems/save';
const profile={name:'Mapas',characterId:'farmer-female' as const,skin:'#e9bc98',hairColor:'#563b2c',outfit:'#457398',hairStyle:'preso' as const};
describe('author supplied maps',()=>{
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
});
