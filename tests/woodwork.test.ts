import {it,expect} from 'vitest';
import {Inventory} from '../src/systems/inventory';
import {craft} from '../src/systems/crafting';
import {Building} from '../src/systems/building';
import {createNewSave,validateSave,migrateSave} from '../src/systems/save';

it.each(['furniture','fenceKit'] as const)('requires the real workbench and hammer to manufacture %s without losing materials on refusal',item=>{
 const inventory=new Inventory({wood:30,board:10});const before={...inventory.data};
 expect(craft(item,inventory,true).ok).toBe(false);expect(inventory.data).toEqual(before);
 inventory.add('hammer');const ready={...inventory.data};expect(craft(item,inventory,false).ok).toBe(false);expect(inventory.data).toEqual(ready);
 expect(craft(item,inventory,true).ok).toBe(true);expect(inventory.data[item]).toBe(1);expect(inventory.data.hammer).toBe(1);
 const building=new Building(),kind=item==='furniture'?'bench':'fence';
 expect(building.place(kind,10,10,inventory,true,{nearWorkbench:false,rotation:3,day:1}).ok).toBe(true);
 expect(inventory.data[item]).toBe(0);const remaining={...inventory.data};
 expect(building.place(kind,11,10,inventory,true).ok).toBe(false);expect(inventory.data).toEqual(remaining);
 expect(building.remove(10,10,inventory).ok).toBe(true);expect(inventory.data[item]).toBe(1);
});
it('does not hand-build old benches or fences from raw wood any more',()=>{
 const inventory=new Inventory({wood:100,stone:100,hammer:1}),before={...inventory.data},b=new Building();
 expect(b.place('bench',10,10,inventory,true).ok).toBe(false);expect(b.place('fence',11,10,inventory,true).ok).toBe(false);
 expect(inventory.data).toEqual(before);expect(b.buildings).toHaveLength(0);
});
it('saves all four bench views and preserves old placed objects at their original coordinates',()=>{
 const s=createNewSave({name:'Oficina',skin:'#e9bc98',hairColor:'#563b2c',outfit:'#457398',hairStyle:'preso'});
 const b=new Building([{kind:'bench',x:10,y:10},{kind:'fence',x:12,y:10}],1),inventory=new Inventory({furniture:4});
 for(const rotation of [0,1,2,3] as const)expect(b.place('bench',15+rotation,10,inventory,true,{nearWorkbench:false,rotation}).ok).toBe(true);
 s.buildings=b.buildings;expect(validateSave(s)).toBe(true);const loaded=migrateSave(JSON.parse(JSON.stringify(s)))!;
 expect(loaded.buildings).toEqual(s.buildings);expect(loaded.buildings[0]).toEqual({kind:'bench',x:10,y:10});
 const bad={...s,buildings:[{kind:'bench',x:10,y:10,rotation:4}]};expect(validateSave(bad)).toBe(false);
});
