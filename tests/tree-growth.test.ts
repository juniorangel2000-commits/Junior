import {describe,it,expect} from 'vitest';
import {createNewSave,validateSave} from '../src/systems/save';
import {Inventory} from '../src/systems/inventory';
import {Resources} from '../src/systems/resources';
import {plantTree,ensureTreeGrowth,growingTreeResources,treeClock,treeStage,harvestGrowingTree,migrateTreeStumps,validTreeGrowth} from '../src/systems/tree-growth';
import {ResourceLifecycle} from '../src/resource-lifecycle';
import {drawTreePlantingSoil} from '../src/tree-planting-soil';
import type Phaser from 'phaser';
import type {ResourceNode} from '../src/types';
const create=()=>createNewSave({name:'Bosque',skin:'#e9bc98',hairColor:'#563b2c',outfit:'#457398',hairStyle:'preso'});
describe('tree seeds, stages and collectible stumps',()=>{
 it('shows planted ground only on the first growth day and never under older trees or stumps',()=>{
  let added=0;const image={setOrigin(){return this;},setDisplaySize(){return this;},setDepth(){return this;},setData(){return this;}},scene={textures:{exists:()=>true},add:{image:()=>{added++;return image;}}} as unknown as Phaser.Scene;
  const s=create();s.inventory.oakSeed=1;plantTree(s,'oakSeed',{x:35,y:35},()=>false);expect(drawTreePlantingSoil(scene,growingTreeResources(s,'property')[0])).toBeDefined();expect(added).toBe(1);
  s.day=2;s.time=0;expect(growingTreeResources(s,'property')[0].treeStage).toBe(0);expect(drawTreePlantingSoil(scene,growingTreeResources(s,'property')[0])).toBeUndefined();s.time=480;
  for(const day of [2,4,8]){s.day=day;expect(drawTreePlantingSoil(scene,growingTreeResources(s,'property')[0])).toBeUndefined();}
  harvestGrowingTree(s,'property',growingTreeResources(s,'property')[0]);expect(drawTreePlantingSoil(scene,growingTreeResources(s,'property')[0])).toBeUndefined();expect(added).toBe(1);
 });
 it('plants both species atomically and grows on the game calendar at one, three and seven days',()=>{
  const s=create();s.inventory.oakSeed=2;s.inventory.pineSeed=1;
  expect(plantTree(s,'oakSeed',{x:35,y:35},()=>true).ok).toBe(false);expect(s.inventory.oakSeed).toBe(2);expect(s.treeGrowth).toBeUndefined();
  expect(plantTree(s,'oakSeed',{x:35,y:35},()=>false).ok).toBe(true);expect(s.inventory.oakSeed).toBe(1);
  expect(plantTree(s,'pineSeed',{x:36,y:35},()=>false).ok).toBe(false);expect(s.inventory.pineSeed).toBe(1);
  expect(plantTree(s,'pineSeed',{x:39,y:35},()=>false).ok).toBe(true);expect(s.inventory.pineSeed).toBe(0);
  const t=s.treeGrowth!.property[0],start=treeClock(s);expect([0,1,3,7].map(day=>treeStage(t,start+day*1440))).toEqual([0,1,2,3]);
  expect(treeStage(t,start+7*1440-1)).toBe(2);expect(validTreeGrowth(s.treeGrowth)).toBe(true);expect(validateSave(JSON.parse(JSON.stringify(s)))).toBe(true);
 });
 it('felling returns a species seed and leaves exactly one persistent stump, which needs an axe',()=>{
  const s=create(),i=new Inventory({hatchet:1}),resources=new Resources(),tree:ResourceNode={id:'standingTree-35-35',kind:'standingTree',x:35,y:35,treeSpecies:'pine'};
  for(let n=0;n<4;n++)resources.hit(tree,'hatchet',i,s);expect(i.data.pineSeed).toBe(1);expect(i.data.oakSeed).toBe(0);
  expect(harvestGrowingTree(s,'property',tree)).toEqual({handled:true,managed:false});s.depletedResources.push(tree.id);s.inventory={...i.data};
  const loaded=JSON.parse(JSON.stringify(s));expect(validateSave(loaded)).toBe(true);const stump=growingTreeResources(loaded,'property')[0];expect(stump.kind).toBe('stump');
  const r=new Resources();expect(r.hit(stump,'hand',i,loaded).ok).toBe(false);for(let n=0;n<3;n++)r.hit(stump,'hatchet',i,loaded);expect(harvestGrowingTree(loaded,'property',stump).managed).toBe(true);expect(loaded.treeGrowth.property).toHaveLength(0);expect(r.hit(stump,'hatchet',i,loaded).ok).toBe(false);
 });
 it('removes an immature tree without granting mature wood, and allows replanting after clearing',()=>{
  const s=create();s.inventory.oakSeed=1;plantTree(s,'oakSeed',{x:35,y:35},()=>false);const n=growingTreeResources(s,'property')[0],i=new Inventory({...s.inventory,hatchet:1}),r=new Resources();
  expect(r.hit(n,'hatchet',i,s)).toMatchObject({ok:true,depleted:true});expect(i.data.oakSeed).toBe(1);expect(i.data.log).toBe(0);expect(harvestGrowingTree(s,'property',n).managed).toBe(true);expect(s.treeGrowth!.property).toHaveLength(0);
  s.inventory={...i.data};expect(plantTree(s,'oakSeed',{x:35,y:35},()=>false).ok).toBe(true);expect(growingTreeResources(s,'property')[0].id).not.toBe(n.id);
 });
 it('migrates old decorative stumps once, so removing one never recreates it on reload',()=>{
  const s=create(),objects=[{id:'standingTree-35-35',x:35,y:35,kind:'standingTree',depleted:true}];s.depletedResources.push(objects[0].id);
  migrateTreeStumps(s,'property',objects);const id=ensureTreeGrowth(s).property[0].id;migrateTreeStumps(s,'property',objects);expect(s.treeGrowth!.property).toHaveLength(1);
  harvestGrowingTree(s,'property',{id,x:35,y:35,kind:'stump'});const loaded=JSON.parse(JSON.stringify(s));migrateTreeStumps(loaded,'property',objects);expect(loaded.treeGrowth.property).toHaveLength(0);expect(validateSave(loaded)).toBe(true);
 });
 it('refreshes the rendered resource stage and preserves partial axe damage in a saved managed tree',()=>{
  const s=create();s.inventory.oakSeed=1;plantTree(s,'oakSeed',{x:35,y:35},()=>false);
  const world={resources:[] as ResourceNode[],editorObjects:[],removeResource(id:string){this.resources=this.resources.filter(n=>n.id!==id);},setNaturalResources(nodes:readonly ResourceNode[]){this.resources=nodes.map(n=>({...n}));}};
  const lifecycle=new ResourceLifecycle(s,'property',world,()=>false);expect(world.resources.find(n=>n.id.startsWith('growth-'))!.treeStage).toBe(0);
  s.day+=7;lifecycle.tick(true);const n=world.resources.find(n=>n.id.startsWith('growth-'))!;expect(n.treeStage).toBe(3);
  const i=new Inventory({...s.inventory,hatchet:1}),r=new Resources();r.hit(n,'hatchet',i,s);s.inventory={...i.data};s.resourceProgress=structuredClone(r.progress);expect(validateSave(JSON.parse(JSON.stringify(s)))).toBe(true);
 });
 it('rejects malformed, overlapping and duplicated tree states',()=>{
  const s=create();s.inventory.oakSeed=1;plantTree(s,'oakSeed',{x:35,y:35},()=>false);const d=structuredClone(s.treeGrowth!);
  expect(validTreeGrowth({...d,property:[...d.property,{...d.property[0]}]})).toBe(false);expect(validTreeGrowth({...d,property:[{...d.property[0],species:'willow'}]})).toBe(false);expect(validTreeGrowth({...d,property:[{...d.property[0],plantedAt:NaN}]})).toBe(false);
 });
 it('keeps planting transactional at identifier limits and stores only coordinate data',()=>{
  const s=create();s.inventory.oakSeed=1;const d=ensureTreeGrowth(s);d.sequence=1e9;expect(plantTree(s,'oakSeed',{x:35,y:35},()=>false).ok).toBe(false);expect(s.inventory.oakSeed).toBe(1);
  d.sequence=0;const point=Object.assign(Object.create({x:35,y:35}),{scene:{bad:()=>undefined}});expect(plantTree(s,'oakSeed',point,()=>false).ok).toBe(true);expect(s.treeGrowth!.property[0]).toMatchObject({x:35,y:35,planted:true});expect(()=>structuredClone(s.treeGrowth)).not.toThrow();
 });
});
