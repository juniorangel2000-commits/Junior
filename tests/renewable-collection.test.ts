import {describe,it,expect} from 'vitest';
import {collectibleKind,NATURE_ART} from '../src/data/nature-catalog';
import {FIBER_PLANTS,nearRiverBank} from '../src/data/fiber-plants';
import {newResourceField,replenishResources,harvestSpawn,validateResourceField,RESOURCE_LIMITS,upgradeResourceTiming,upgradeResourceEcology,naturalResourceTexture,clockMinutes} from '../src/systems/resource-spawns';
import {Resources,RESOURCE_DEFINITIONS} from '../src/systems/resources';
import {Inventory,MAX_ITEM_COUNT} from '../src/systems/inventory';
import {createNewSave,migrateSave,validateSave} from '../src/systems/save';
import type {ResourceNode} from '../src/types';
const profile={name:'Recursos',skin:'#e9bc98',hairColor:'#563b2c',outfit:'#457398',hairStyle:'preso' as const};

describe('novas fontes de coleta',()=>{
 it('as quatro plantas fornecem fibras, e berries fornecem sementes e fibras atomicamente',()=>{
   for(const plant of FIBER_PLANTS)expect(collectibleKind(plant)).toBe('fiber');
   expect(collectibleKind('berryBush')).toBe('seeds');
   const inventory=new Inventory(),resources=new Resources(),berry:ResourceNode={id:'seeds-10-10',kind:'seeds',x:10,y:10};
   expect(resources.hit(berry,'hand',inventory)).toMatchObject({ok:true,depleted:true});
   expect(inventory.data).toMatchObject({seeds:3,fiber:2});
   expect(resources.hit(berry,'hand',inventory).ok).toBe(false);
   const full=new Inventory({fiber:MAX_ITEM_COUNT});expect(new Resources().hit(berry,'hand',full).ok).toBe(false);expect(full.data.seeds).toBe(0);
 });
 it('as quatro rochas fornecem pedra só com picareta e as pedras pequenas usam a nova arte',()=>{
   expect(naturalResourceTexture('stone')).toBe('asset-small-stones');expect(naturalResourceTexture('tree')).toBe('asset-new-branches');
   for(const kind of ['lakeRockA','lakeRockB','lakeRockC','lakeRockF'] as const){
     expect(collectibleKind(kind)).toBe('vein');expect(NATURE_ART[kind].texture).toMatch(/^lake-rock-/);
     const node:ResourceNode={id:`editor-${kind}-qa`,kind:'vein',x:10,y:10},inventory=new Inventory({pickaxe:1}),resources=new Resources();
     expect(resources.hit(node,'hand',inventory).ok).toBe(false);
     for(let i=0;i<5;i++)resources.hit(node,'pickaxe',inventory);
     expect(inventory.data.stone).toBe(4);expect(resources.hit(node,'pickaxe',inventory).ok).toBe(false);
   }
 });
 it.each(['fallenLog','stump'] as const)('%s exige machado, persiste golpes parciais e entrega madeira uma vez',kind=>{
   expect(collectibleKind(kind)).toBe(kind);
   const field=newResourceField(9);field.initialized=true;field.sequence=1;field.nodes=[{id:`spawn-p-${kind}-1`,kind,x:40,y:40}];
   const node=field.nodes[0],inventory=new Inventory({hatchet:1,pickaxe:1}),resources=new Resources();
   expect(resources.hit(node,'hand',inventory).ok).toBe(false);expect(resources.hit(node,'pickaxe',inventory).ok).toBe(false);
   expect(resources.hit(node,'hatchet',inventory).depleted).toBeUndefined();expect(inventory.data.wood).toBe(0);
   const state=createNewSave(profile);state.inventory=inventory.data;state.resourceFields={property:field,forest:newResourceField(1)};state.resourceProgress=resources.progress;
   const restored=migrateSave(JSON.parse(JSON.stringify(state)))!;expect(validateSave(restored)).toBe(true);
   const resumed=new Resources(restored.resourceProgress),bag=new Inventory(restored.inventory);
   expect(resumed.hit(node,'hatchet',bag).depleted).toBeUndefined();expect(resumed.hit(node,'hatchet',bag).depleted).toBe(true);
   expect(bag.data.wood).toBe(RESOURCE_DEFINITIONS[kind].drops.wood);expect(resumed.hit(node,'hatchet',bag).ok).toBe(false);
 });
});

describe('habitats, limites e prazo de três dias',()=>{
 it.each(['property','forest'] as const)('preenche %s com novas famílias e limita juncos às margens do rio',area=>{
   const field=newResourceField(35);replenishResources(field,area,0,()=>true);
   expect(field.nodes).toHaveLength(RESOURCE_LIMITS[area]);expect(validateResourceField(field,area)).toBe(true);
   for(const kind of ['fallenLog','stump','stone','seeds','tree'])expect(field.nodes.some(n=>n.kind===kind)).toBe(true);
   for(const plant of area==='property'?FIBER_PLANTS:FIBER_PLANTS.slice(0,3))expect(field.nodes.some(n=>n.plant===plant)).toBe(true);
   for(const n of field.nodes.filter(n=>n.plant==='reeds')){expect(area).toBe('property');expect(nearRiverBank(n.x,n.y)).toBe(true);}
 });
 it.each(['tree','stone','fiber','seeds','scrap'] as const)('%s só retorna após três dias completos, mesmo com recarga',kind=>{
   const now=clockMinutes({day:7,time:18*60}),field=newResourceField(58);field.initialized=true;field.sequence=1;
   field.nodes=[{id:`spawn-p-${kind}-1`,kind,x:20,y:30}];
   expect(harvestSpawn(field,field.nodes[0].id,now)).toBe(true);
   const restored=JSON.parse(JSON.stringify(field));
   expect(restored.waiting[0].at).toBe(now+4320);
   replenishResources(restored,'property',now+4319.99,()=>true,1);expect(restored.nodes).toEqual([]);
   replenishResources(restored,'property',now+4320,()=>true,1);expect(restored.nodes).toHaveLength(1);
   expect(restored.nodes[0].id).not.toBe(`spawn-p-${kind}-1`);expect(validateResourceField(restored,'property')).toBe(true);
 });
 it('estende os temporizadores antigos uma única vez, sem adiantar coletas já pendentes',()=>{
   const field=newResourceField(1);delete field.timingRevision;field.waiting=[{kind:'stone',at:250},{kind:'vein',at:250}];
   upgradeResourceTiming(field);expect(field.waiting.map(w=>w.at)).toEqual([4330,250]);
   upgradeResourceTiming(field);expect(field.waiting.map(w=>w.at)).toEqual([4330,250]);
 });
 it('inclui novas famílias em partidas antigas sem duplicar IDs nem entregar recursos',()=>{
   const field=newResourceField(3);replenishResources(field,'property',0,()=>true);delete field.ecologyRevision;
   field.nodes=field.nodes.filter(n=>n.kind!=='fallenLog'&&n.kind!=='stump'&&n.plant!=='reeds');
   const sequence=field.sequence;upgradeResourceEcology(field,'property',500);
   expect(field.waiting.some(w=>w.kind==='fallenLog')).toBe(true);expect(field.waiting.some(w=>w.kind==='stump')).toBe(true);expect(field.waiting.some(w=>w.plant==='reeds')).toBe(true);
   replenishResources(field,'property',500,()=>true);expect(field.sequence).toBeGreaterThan(sequence);
   const snapshot=JSON.stringify(field);upgradeResourceEcology(field,'property',500);expect(JSON.stringify(field)).toBe(snapshot);
   expect(validateResourceField(field,'property')).toBe(true);
 });
});
