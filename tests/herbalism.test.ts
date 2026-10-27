import {describe,it,expect} from 'vitest';
import {createNewSave,validateSave} from '../src/systems/save';
import {Inventory,MAX_ITEM_COUNT} from '../src/systems/inventory';
import {Resources} from '../src/systems/resources';
import {collectibleKind,natureArt} from '../src/data/nature-catalog';
import {newResourceField,replenishResources,harvestSpawn,RESOURCE_RESPAWN_MINUTES,validateResourceField} from '../src/systems/resource-spawns';
import {performVillageService} from '../src/systems/village-services';
import {craft} from '../src/systems/crafting';
import {useConsumable} from '../src/systems/consumables';
const create=()=>createNewSave({name:'Ervas',skin:'#e9bc98',hairColor:'#563b2c',outfit:'#457398',hairStyle:'preso'});
describe('medicinal foraging and Amelia preparations',()=>{
 it('uses dedicated herb art and collects existing mushrooms without tools exactly once',()=>{
  expect(natureArt('herbs')?.texture).toBe('ecology-herbs');expect(collectibleKind('herbs')).toBe('herb');expect(collectibleKind('mushrooms')).toBe('mushroom');
  for(const kind of ['herb','mushroom'] as const){const r=new Resources(),i=new Inventory(),n={id:`spawn-p-${kind}-1`,x:35,y:35,kind};expect(r.hit(n,'hand',i)).toMatchObject({ok:true,depleted:true});expect(i.data[kind]).toBe(2);expect(r.hit(n,'hand',i).ok).toBe(false);}
 });
 it.each(['property','forest'] as const)('spawns both ingredients in %s and respects the three-day cooldown after save/load',area=>{
  const f=newResourceField(891);replenishResources(f,area,0,()=>true);for(const kind of ['herb','mushroom'] as const){const n=f.nodes.find(n=>n.kind===kind)!;expect(n).toBeDefined();expect(harvestSpawn(f,n.id,100)).toBe(true);}
  const loaded=JSON.parse(JSON.stringify(f));replenishResources(loaded,area,99+RESOURCE_RESPAWN_MINUTES,()=>true);expect(loaded.nodes.length).toBe(f.nodes.length);replenishResources(loaded,area,100+RESOURCE_RESPAWN_MINUTES,()=>true);expect(loaded.nodes.length).toBe(f.nodes.length+2);expect(validateResourceField(loaded,area)).toBe(true);
 });
 it('introduces ingredients into old full fields without deleting nodes or advancing existing deadlines',()=>{
  const f=newResourceField(81);replenishResources(f,'property',0,()=>true);for(const n of f.nodes)if(n.kind==='herb'||n.kind==='mushroom')n.kind='fiber';for(const n of f.nodes)n.id=`spawn-p-${n.kind}-${n.id.split('-').at(-1)}`;delete f.herbalismRevision;
  const before=structuredClone(f.nodes);replenishResources(f,'property',20,()=>true);expect(f.nodes).toEqual(before);
  const n=f.nodes.find(n=>n.kind==='tree')!;harvestSpawn(f,n.id,40);const due=f.waiting[0].at;replenishResources(f,'property',50,()=>true);expect(f.waiting[0].at).toBe(due);expect(['herb','mushroom']).toContain(f.waiting[0].kind);
 });
 it('learns and crafts an infusion, consumes both ingredients and uses it to restore vigor',()=>{
  const s=create();s.inventory.herb=12;s.inventory.mushroom=8;
  expect(craft('fungalInfusion',new Inventory(s.inventory),false,s.villageProgress).ok).toBe(false);
  expect(performVillageService(s,'learn-infusion').ok).toBe(true);const before=structuredClone(s.inventory);expect(performVillageService(s,'learn-infusion').ok).toBe(false);expect(s.inventory).toEqual(before);
  const i=new Inventory(s.inventory);expect(craft('fungalInfusion',i,false,s.villageProgress).ok).toBe(true);expect(i.data.herb).toBe(6);expect(i.data.mushroom).toBe(4);s.inventory={...i.data};s.villageProgress!.vigor=30;
  expect(useConsumable(s,'fungalInfusion').ok).toBe(true);expect(s.villageProgress!.vigor).toBe(80);expect(s.inventory.fungalInfusion).toBe(0);expect(validateSave(JSON.parse(JSON.stringify(s)))).toBe(true);
 });
 it('brews with Amelia atomically and never charges for missing materials or overflowing output',()=>{
  const s=create(),before=structuredClone(s);expect(performVillageService(s,'brew-infusion').ok).toBe(false);expect(s).toEqual(before);
  s.inventory.herb=3;s.inventory.mushroom=2;const coins=s.villageEconomy!.coins;expect(performVillageService(s,'brew-infusion').ok).toBe(true);expect(s.villageEconomy!.coins).toBe(coins-8);expect(s.inventory.herb).toBe(0);expect(s.inventory.mushroom).toBe(0);expect(s.inventory.fungalInfusion).toBe(1);
  s.inventory.herb=3;s.inventory.mushroom=2;s.inventory.fungalInfusion=MAX_ITEM_COUNT;const full=structuredClone(s);expect(performVillageService(s,'brew-infusion').ok).toBe(false);expect(s).toEqual(full);
 });
});
