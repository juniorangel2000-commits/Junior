import {describe,it,expect} from 'vitest';
import {defaultMap,previousDefaultMap,atMapExit,MAP_BASE_REVISION} from '../src/data/default-maps';
import property from '../src/data/maps/property.json';
import forest from '../src/data/maps/forest.json';
import {validateMapEdits,emptyMapEdits} from '../src/systems/map-editor';
import {createNewSave,migrateSave,validateSave} from '../src/systems/save';
import {FOREST_ANIMALS} from '../src/data/ancient-forest';
const profile={name:'Mapas',characterId:'farmer-female' as const,skin:'#e9bc98',hairColor:'#563b2c',outfit:'#457398',hairStyle:'preso' as const};
const newAuthorObjects=(area:'property'|'forest')=>{
 const old=previousDefaultMap(area,2).objects;
 return Object.entries(defaultMap(area).objects).filter(([id,object])=>!object.removed&&!old[id]);
};
describe('author supplied maps',()=>{
 it('preserves author geometry with only the requested grassy village approach and returns independent copies',()=>{
  const baseline=defaultMap('property'),original=property.terrain as Record<string,string>;
  expect(baseline.objects).toEqual(property.objects);expect(baseline.points).toEqual(property.points);expect(defaultMap('forest')).toEqual(forest);
  const changed=Object.entries(baseline.terrain).filter(([key,value])=>value!==original[key]);expect(changed.length).toBeGreaterThan(0);
  for(const [key,value]of changed){const [x,y]=key.split(',').map(Number);expect(value).toBe('grass');expect(x>=80&&x<=95&&y>=48&&y<=56).toBe(true);}
  const copy=defaultMap('property');copy.terrain['10,10']='wood';expect(defaultMap('property')).toEqual(baseline);expect(property.terrain['90,52']).toBe('path');
 });
 it.each(['property','forest'] as const)('validates %s and preserves independent arrival and exit points',area=>{
  const data=defaultMap(area);expect(validateMapEdits(data)).toBe(true);
  expect(data.points).toEqual(area==='forest'?{entry:{x:93,y:52},exit:{x:94,y:52}}:{entry:{x:2,y:52},exit:{x:1,y:52}});
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
 it('upgrades the untouched 0.9.8 maps and aligns their passages without changing saved progress',()=>{
  const old=createNewSave(profile);old.mapBaseRevision=2;
  old.mapEdits=previousDefaultMap('property',2);old.forestMapEdits=previousDefaultMap('forest',2);
  old.inventory.stone=31;old.depletedResources=['standingTree-17-11'];old.homeSupplies={wateringCan:true,seedPacket:true};
  const before=structuredClone(old),result=migrateSave(old)!;
  expect(validateSave(result)).toBe(true);expect(result.mapBaseRevision).toBe(MAP_BASE_REVISION);
  expect(result.mapEdits).toEqual(defaultMap('property'));expect(result.forestMapEdits).toEqual(defaultMap('forest'));
  expect(result.forestMapEdits!.points).toEqual({entry:{x:93,y:52},exit:{x:94,y:52}});
  expect(result.mapEdits!.points).toEqual({entry:{x:2,y:52},exit:{x:1,y:52}});
  expect(result.inventory).toEqual(old.inventory);expect(result.homeSupplies).toEqual(old.homeSupplies);
  expect(result.depletedResources).toEqual(old.depletedResources);expect(old).toEqual(before);
 });
 it('keeps revision-two edits, erased paint, custom portals and occupied ground across the seam upgrade',()=>{
  const old=createNewSave(profile);old.mapBaseRevision=2;
  old.mapEdits=previousDefaultMap('property',2);old.forestMapEdits=previousDefaultMap('forest',2);
  const erased=Object.keys(old.mapEdits.terrain).find(k=>defaultMap('property').terrain[k]!==undefined)!;
  delete old.mapEdits.terrain[erased];old.mapEdits.terrain['3,55']='wood';old.mapEdits.points!.exit={x:2,y:55};
  old.forestMapEdits.terrain['91,49']='sand';old.forestMapEdits.points={entry:{x:92,y:44},exit:{x:94,y:44}};
  old.forestMapEdits.objects['editor-fiber-kept']={kind:'fiber',x:91,y:49};
  old.preparedSoil=[{x:4,y:54}];old.crops=[{x:4,y:54,growth:.4,watered:true}];
  old.buildings=[{x:5,y:54,kind:'fence',fenceBuiltDay:1}];
  const oldGround=old.mapEdits.terrain['4,54'],oldBuildingGround=old.mapEdits.terrain['5,54'];
  const result=migrateSave(old)!;
  expect(validateSave(result)).toBe(true);expect(result.mapEdits!.terrain[erased]).toBeUndefined();
  expect(result.mapEdits!.terrain['3,55']).toBe('wood');expect(result.mapEdits!.points!.exit).toEqual({x:2,y:55});
  expect(result.forestMapEdits!.terrain['91,49']).toBe('sand');expect(result.forestMapEdits!.points).toEqual(old.forestMapEdits.points);
  expect(result.forestMapEdits!.objects['editor-fiber-kept']).toEqual(old.forestMapEdits.objects['editor-fiber-kept']);
  expect(result.mapEdits!.terrain['4,54']).toBe(oldGround);expect(result.mapEdits!.terrain['5,54']).toBe(oldBuildingGround);
  expect(result.crops).toEqual(old.crops);expect(result.buildings).toEqual(old.buildings);expect(result.preparedSoil).toEqual(old.preparedSoil);
  result.forestMapEdits!.points!.exit={x:90,y:40};result.mapEdits!.terrain['3,55']='moss';
  const reloaded=migrateSave(result)!;expect(reloaded.forestMapEdits!.points!.exit).toEqual({x:90,y:40});expect(reloaded.mapEdits!.terrain['3,55']).toBe('moss');
 });
 it('does not add a new seam tree on saved cultivated ground, while explicit object edits still win',()=>{
  const [id,tree]=newAuthorObjects('property')[0];expect(tree).toBeDefined();
  const old=createNewSave(profile);old.mapBaseRevision=2;old.mapEdits=previousDefaultMap('property',2);old.forestMapEdits=previousDefaultMap('forest',2);
  old.preparedSoil=[{x:tree.x,y:tree.y}];old.crops=[{x:tree.x,y:tree.y,growth:.3,watered:true}];
  const ground=old.mapEdits.terrain[`${tree.x},${tree.y}`],result=migrateSave(old)!;
  expect(validateSave(result)).toBe(true);expect(result.mapEdits!.objects[id].removed).toBe(true);
  expect(result.mapEdits!.terrain[`${tree.x},${tree.y}`]).toBe(ground);expect(result.crops).toEqual(old.crops);
  old.mapEdits.objects[id]={...tree,removed:false};
  const custom=migrateSave(old)!;expect(custom.mapEdits!.objects[id]).toEqual(old.mapEdits.objects[id]);
 });
 it.each(['property','forest'] as const)('keeps new trees off saved player and animal feet in %s',area=>{
  const [[playerTreeId,playerTree],[animalTreeId,animalTree]]=newAuthorObjects(area);expect(animalTree).toBeDefined();
  const old=createNewSave(profile);old.mapBaseRevision=2;old.mapEdits=previousDefaultMap('property',2);old.forestMapEdits=previousDefaultMap('forest',2);old.activeArea=area;
  const player={x:playerTree.x*32+2,y:playerTree.y*32+16,direction:'down' as const};
  if(area==='forest')old.forestPosition=player;else old.player=player;
  const animalId=FOREST_ANIMALS.find(animal=>animal.kind==='cow')!.id;
  const animal={id:animalId,x:animalTree.x*32+2,y:animalTree.y*32+16,direction:'left' as const};
  old.recruitedAnimals=area==='property'?[animalId]:[];
  old.animalPositions={property:area==='property'?[animal]:[],forest:area==='forest'?[animal]:[]};
  expect(validateSave(old)).toBe(true);
  const result=migrateSave(old)!,map=area==='property'?result.mapEdits!:result.forestMapEdits!;
  expect(validateSave(result)).toBe(true);expect(map.objects[playerTreeId].removed).toBe(true);expect(map.objects[animalTreeId].removed).toBe(true);
  expect(area==='property'?result.player:result.forestPosition).toEqual(player);expect(result.animalPositions).toEqual(old.animalPositions);
 });
 it('still protects a recovered forest player when its revision-two map field is absent',()=>{
  const [id,tree]=newAuthorObjects('forest')[0];
  const old=createNewSave(profile);old.mapBaseRevision=2;old.activeArea='forest';delete old.forestMapEdits;
  old.forestPosition={x:tree.x*32+16,y:tree.y*32+16,direction:'left'};
  const result=migrateSave(old)!;
  expect(validateSave(result)).toBe(true);expect(result.forestMapEdits!.objects[id].removed).toBe(true);
  expect(result.forestPosition).toEqual(old.forestPosition);
 });
 it('opens the village approach for an untouched revision-three save and keeps the saved village state',()=>{
  const old=createNewSave(profile);old.mapBaseRevision=3;
  old.mapEdits=previousDefaultMap('property',3);old.forestMapEdits=previousDefaultMap('forest',3);
  old.activeArea='village';old.villagePosition={x:1200,y:1300,direction:'down-left'};
  old.villageEconomy={coins:201,met:['rosa','bento']};old.inventory.turnip=6;
  old.homeSupplies={wateringCan:true,seedPacket:true};old.depletedResources=['standingTree-17-11'];
  const before=structuredClone(old),result=migrateSave(old)!;
  expect(validateSave(result)).toBe(true);expect(result.mapBaseRevision).toBe(MAP_BASE_REVISION);
  expect(result.mapEdits).toEqual(defaultMap('property'));expect(result.forestMapEdits).toEqual(defaultMap('forest'));
  const cleared=Object.entries(previousDefaultMap('property',3).objects).filter(([id,object])=>!object.removed&&defaultMap('property').objects[id]?.removed);
  expect(cleared.length).toBeGreaterThanOrEqual(5);
  expect(result.activeArea).toBe('village');expect(result.villagePosition).toEqual(old.villagePosition);
  expect(result.villageEconomy).toEqual(old.villageEconomy);expect(result.inventory).toEqual(old.inventory);
  expect(result.homeSupplies).toEqual(old.homeSupplies);expect(result.depletedResources).toEqual(old.depletedResources);
  expect(old).toEqual(before);
 });
 it('keeps local ground, moved objects, portals and cultivated cells while upgrading revision three',()=>{
  const old=createNewSave(profile);old.mapBaseRevision=3;
  old.mapEdits=previousDefaultMap('property',3);old.forestMapEdits=previousDefaultMap('forest',3);
  const erased=Object.keys(old.mapEdits.terrain).find(key=>defaultMap('property').terrain[key]!==undefined)!;
  delete old.mapEdits.terrain[erased];old.mapEdits.terrain['93,52']='wood';
  old.mapEdits.points={entry:{x:3,y:48},exit:{x:2,y:48}};
  const [movedId,moved]=Object.entries(old.mapEdits.objects).find(([,object])=>!object.removed&&object.x===92&&object.y===52)!;
  old.mapEdits.objects[movedId]={...moved,x:91};
  old.forestMapEdits.objects['editor-bush-village-kept']={x:80,y:60,kind:'bush'};
  old.forestMapEdits.points={entry:{x:92,y:44},exit:{x:94,y:44}};
  old.preparedSoil=[{x:89,y:52}];old.crops=[{x:89,y:52,growth:.4,watered:true}];
  old.buildings=[{x:88,y:52,kind:'fence',fenceBuiltDay:1}];
  old.resourceProgress=[{id:movedId,hits:2}];old.villageEconomy={coins:173,met:['tobias']};
  old.villagePosition={x:1000,y:1100,direction:'left'};
  const original=structuredClone(old),result=migrateSave(old)!;
  expect(validateSave(old)).toBe(true);expect(validateSave(result)).toBe(true);
  expect(result.mapEdits!.terrain[erased]).toBeUndefined();expect(result.mapEdits!.terrain['93,52']).toBe('wood');
  expect(result.mapEdits!.objects[movedId]).toEqual(old.mapEdits.objects[movedId]);
  expect(result.mapEdits!.points).toEqual(old.mapEdits.points);expect(result.forestMapEdits!.points).toEqual(old.forestMapEdits.points);
  expect(result.forestMapEdits!.objects['editor-bush-village-kept']).toEqual(old.forestMapEdits.objects['editor-bush-village-kept']);
  expect(result.mapEdits!.terrain['89,52']).toBe(old.mapEdits.terrain['89,52']);expect(result.mapEdits!.terrain['88,52']).toBe(old.mapEdits.terrain['88,52']);
  expect(result.preparedSoil).toEqual(old.preparedSoil);expect(result.crops).toEqual(old.crops);expect(result.buildings).toEqual(old.buildings);
  expect(result.resourceProgress).toEqual(old.resourceProgress);expect(result.villageEconomy).toEqual(old.villageEconomy);expect(result.villagePosition).toEqual(old.villagePosition);
  result.mapEdits!.terrain['93,52']='sand';result.mapEdits!.objects[movedId].removed=true;
  expect(migrateSave(result)).toEqual(result);expect(old).toEqual(original);
 });
});
