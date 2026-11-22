import {describe,it,expect,vi} from 'vitest';
import {createNewSave,validateSave,migrateSave} from '../src/systems/save';
import {createCharacterProfile} from '../src/data/characters';
import {FIELDS_SIZE,FIELDS_ENTRY,FIELDS_EXIT,FIELDS_SHED,MEADOW_PATCHES,VISIBLE_MEADOW_PATCHES,FIELDS_ANIMALS,fieldsBlocked,fieldsSafe,propertyFieldsApproach} from '../src/data/open-fields';
import {FIELDS_RIVER_BRIDGES,fieldsAllowsStep,fieldsRiverWater,fieldsSwimmingWater} from '../src/data/fields-river';
import {harvestMeadow,meadowGrowth} from '../src/systems/open-fields';
import {syncToolInstances,activeToolCopy} from '../src/systems/tool-instances';
import {farmHay,siloStock,farmAnchor,type FarmRuntime} from '../src/systems/farm-construction';
import {FARM_BUILDINGS} from '../src/data/farm-buildings';
import {DoorwayPassage} from '../src/systems/map-transition';
import {AnimalBrain} from '../src/systems/animals';
const setup=()=>{const s=createNewSave(createCharacterProfile('Campos'));s.activeArea='openFields';s.inventory.sickle=2;syncToolInstances(s.inventory);return s;};
const p=MEADOW_PATCHES.find(p=>p.kind==='grass')!;
describe('Campos Abertos',()=>{
 it('has the full property size, an open northern arrival and directional return',()=>{expect(FIELDS_SIZE).toEqual({width:3072,height:2304});expect(fieldsSafe(FIELDS_ENTRY)).toBe(true);for(let y=40;y<=180;y+=4)expect(fieldsSafe({x:FIELDS_ENTRY.x,y})).toBe(true);const door=new DoorwayPassage();expect(door.update(FIELDS_ENTRY,FIELDS_ENTRY,FIELDS_EXIT)).toBe(false);expect(door.update({x:FIELDS_ENTRY.x,y:72},{x:FIELDS_ENTRY.x,y:64},FIELDS_EXIT)).toBe(true);expect(propertyFieldsApproach(25,69)).toBe(true);});
 it('connects the harvest patches and shelter to the northern clearing',()=>{
  const start={x:FIELDS_ENTRY.x/16,y:9},queue=[start],seen=new Set([`${start.x},${start.y}`]);
  for(let i=0;i<queue.length;i++){
   const p=queue[i];
   for(const [dx,dy] of [[0,1],[0,-1],[1,0],[-1,0]]){
    const q={x:p.x+dx,y:p.y+dy},key=`${q.x},${q.y}`;
    if(!seen.has(key)&&fieldsSafe({x:q.x*16,y:q.y*16})&&fieldsAllowsStep({x:p.x*16,y:p.y*16},{x:q.x*16,y:q.y*16})){
     seen.add(key);queue.push(q);
    }
   }
  }
  for(const p of VISIBLE_MEADOW_PATCHES){
   const gx=Math.round(p.x/16),gy=Math.round(p.y/16);
   expect([[0,0],[1,0],[-1,0],[0,1],[0,-1],[2,0],[-2,0],[0,2],[0,-2]].some(([dx,dy])=>seen.has(`${gx+dx},${gy+dy}`)),p.id).toBe(true);
  }
  expect(seen.has(`${Math.round(FIELDS_SHED.x/16)},${Math.round((FIELDS_SHED.y+12)/16)}`)).toBe(true);
 });
 it('keeps bridge approaches dry and prevents entering a deck from the water',()=>{
  for(const deck of FIELDS_RIVER_BRIDGES){
   const west={x:deck.x*32-12,y:(deck.y+1)*32},east={x:(deck.x+deck.width)*32+12,y:west.y};
   const center={x:(west.x+east.x)/2,y:west.y},swimmer={x:center.x,y:deck.y*32-12};
   expect(fieldsSafe(west)).toBe(true);
   expect(fieldsSafe(east)).toBe(true);
   expect(fieldsAllowsStep(west,{...west,x:west.x+20})).toBe(true);
   expect(fieldsAllowsStep({x:east.x-20,y:east.y},east)).toBe(true);
   expect(fieldsRiverWater(center.x,center.y)).toBe(true);
   expect(fieldsSwimmingWater(center.x,center.y)).toBe(false);
   expect(fieldsSwimmingWater(swimmer.x,swimmer.y)).toBe(true);
   expect(fieldsAllowsStep(swimmer,center)).toBe(false);
   expect(fieldsAllowsStep(center,swimmer)).toBe(false);
  }
 });
 it('cuts once, drops capim, wears only the used sickle and regrows in three saved days',()=>{const s=setup(),tool=activeToolCopy(s.inventory,'sickle')!,other=s.inventory.toolInstances!.items.find(t=>t.id!==tool.id)!;expect(harvestMeadow(s,p.id,p,()=>true).ok).toBe(true);expect(tool.condition.durability).toBe(250);expect(activeToolCopy(s.inventory,'sickle')!.condition.durability).toBe(249);expect(s.inventory.toolInstances!.items.find(t=>t.id===other.id)!.condition.durability).toBe(250);expect(s.groundItems!.items[0]).toMatchObject({item:'freshGrass',amount:2,space:'openFields'});expect(harvestMeadow(s,p.id,p,()=>true).ok).toBe(false);expect(validateSave(s)).toBe(true);const loaded=migrateSave(structuredClone(s))!;expect(meadowGrowth(loaded,p)).toBe(0);loaded.day+=2;expect(meadowGrowth(loaded,p)).toBeLessThan(1);loaded.day++;expect(meadowGrowth(loaded,p)).toBe(1);expect(harvestMeadow(loaded,p.id,p,()=>true).ok).toBe(true);});
 it('keeps resources, tool and world intact on failed saves, missing or broken tools and distant hits',()=>{const s=setup(),before=structuredClone(s);expect(harvestMeadow(s,p.id,p,()=>false).ok).toBe(false);expect(s).toEqual(before);expect(harvestMeadow(s,p.id,{x:0,y:0},()=>true).ok).toBe(false);activeToolCopy(s.inventory,'sickle')!.condition.durability=0;expect(harvestMeadow(s,p.id,p,()=>true).ok).toBe(false);s.inventory.sickle=0;expect(harvestMeadow(s,p.id,p,()=>true).ok).toBe(false);});
 it('migrates previous saves and rejects invented patches or future cut dates',()=>{const old:any=setup();delete old.inventory.freshGrass;delete old.openFields;expect(migrateSave(old)?.inventory.freshGrass).toBe(0);const s=setup();s.openFields={version:1,cut:{unknown:1}};expect(validateSave(s)).toBe(false);s.openFields.cut={[p.id]:s.day+1};expect(validateSave(s)).toBe(false);});
 it('lets the player enter the shed from the front and blocks its timber walls',()=>{const s=FIELDS_SHED;for(let y=s.y+30;y>s.y-55;y-=4)expect(fieldsSafe({x:s.x,y})).toBe(true);expect(fieldsBlocked(s.x,s.y-75)).toBe(true);expect(fieldsBlocked(s.x-74,s.y-35)).toBe(true);expect(fieldsBlocked(s.x+74,s.y-35)).toBe(true);});
 it('keeps every animal on traversable ground during wandering and flight',()=>{const brains=FIELDS_ANIMALS.map(a=>new AnimalBrain(a.id,a.kind,a.x,a.y,true,(x,y)=>fieldsBlocked(x*32+16,y*32+16),84,()=>0,fieldsBlocked));for(let t=0;t<200;t++)for(const a of brains){a.update(.1,{x:1020+t,y:1700},brains);expect(a.canStand(a.x,a.y),a.id).toBe(true);}});
});
describe('capim drying in a silo',()=>{
 const silo=()=>{let s=setup();s.activeArea='property';s.inventory.freshGrass=30;s.farmConstruction={version:1,nextId:2,sites:[{id:1,kind:'silo',x:20,y:30,delivered:{...FARM_BUILDINGS.silo.cost},finished:true,animals:[],hay:0,gateOpen:true}]};const write=vi.fn(()=>true),rt:FarmRuntime={snapshot:()=>structuredClone(s),write,apply:d=>{s=d;},player:()=>farmAnchor(s.farmConstruction!.sites[0]),placement:()=>''};return{rt,write,get s(){return s;}};};
 it('consumes capim on deposit, reserves capacity and produces hay once after 24 game hours',()=>{const t=silo();expect(farmHay(t.rt,1,'dry',10).ok).toBe(true);expect(t.s.inventory.freshGrass).toBe(20);expect(siloStock(t.s.farmConstruction!.sites[0],t.s)).toMatchObject({hay:0,pending:10});expect(farmHay(t.rt,1,'withdraw',10).ok).toBe(false);t.s.day++;expect(siloStock(t.s.farmConstruction!.sites[0],t.s)).toMatchObject({hay:10,pending:0});expect(farmHay(t.rt,1,'withdraw',10).ok).toBe(true);expect(t.s.inventory.hay).toBe(10);expect(farmHay(t.rt,1,'withdraw',10).ok).toBe(false);expect(validateSave(t.s)).toBe(true);expect(validateSave(migrateSave(t.s))).toBe(true);});
 it('does not overfill with drying grass and preserves everything when saving fails',()=>{const t=silo();t.s.farmConstruction!.sites[0].hay=238;expect(farmHay(t.rt,1,'dry',10).ok).toBe(true);expect(t.s.inventory.freshGrass).toBe(28);expect(farmHay(t.rt,1,'prepare').ok).toBe(false);const before=structuredClone(t.s);t.write.mockReturnValue(false);t.s.day++;const next=structuredClone(t.s);expect(farmHay(t.rt,1,'withdraw').ok).toBe(false);expect(t.s).toEqual(next);expect(before.farmConstruction!.sites[0].drying![0].amount).toBe(2);});
});
