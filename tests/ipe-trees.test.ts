import {describe,it,expect} from 'vitest';
import {createNewSave,validateSave,migrateSave} from '../src/systems/save';
import {createCharacterProfile} from '../src/data/characters';
import {FIELDS_IPES,IPE_HITS,IPE_REGROW_DAYS,MEADOW_PATCHES,FIELDS_SHED,FIELDS_ANIMALS,fieldsBlocked,fieldsSafe,fieldsPathDistance} from '../src/data/open-fields';
import {chopIpe,ipeStanding,ipeHits,hardwoodYield} from '../src/systems/open-fields';
import {syncToolInstances,activeToolCopy} from '../src/systems/tool-instances';
import {configureTool} from '../src/systems/economy';
import {FARM_BUILDINGS,FARM_KINDS,ANIMAL_BUILDING_MATERIAL} from '../src/data/farm-buildings';
import {farmReady} from '../src/systems/farm-construction';
import {ITEM_IDS,ITEM_NAMES} from '../src/data/items';
import type {SaveData} from '../src/types';

const ipe=FIELDS_IPES[0],stand={x:ipe.x,y:ipe.y+40};
const setup=(tier=1)=>{const s=createNewSave(createCharacterProfile('Ipê'));s.activeArea='openFields';s.inventory.hatchet=1;syncToolInstances(s.inventory);configureTool(s,'hatchet',tier);return s;};
const fell=(s:SaveData,id=ipe.id,at=stand)=>{let last;for(let i=0;i<IPE_HITS;i++)last=chopIpe(s,id,at,()=>true);return last!;};
const dropped=(s:SaveData,item:string)=>(s.groundItems?.items??[]).filter(d=>d.item===item).reduce((n,d)=>n+d.amount,0);

describe('ipês-amarelos dos Campos Abertos',()=>{
 it('places six rare ipês in clearings without moving any existing capim, path, shelter or animal',()=>{
  expect(FIELDS_IPES).toHaveLength(6);
  // Patch ids from preview.33 saves must keep meaning the same moitas.
  expect(MEADOW_PATCHES).toHaveLength(1269);
  for(const p of FIELDS_IPES){
   expect(fieldsBlocked(p.x,p.y),p.id).toBe(true);
   expect(fieldsSafe({x:p.x,y:p.y+40}),p.id).toBe(true);
   expect(fieldsPathDistance(p.x,p.y)).toBeGreaterThan(100);
   expect(Math.hypot(p.x-FIELDS_SHED.x,p.y-FIELDS_SHED.y)).toBeGreaterThan(250);
   for(const a of FIELDS_ANIMALS)expect(Math.hypot(a.x-p.x,a.y-p.y)).toBeGreaterThan(150);
   for(const g of MEADOW_PATCHES)expect(Math.hypot(g.x-p.x,g.y-p.y)).toBeGreaterThan(50);
  }
 });
 it('can be reached on foot from the northern arrival',()=>{
  const queue=[{x:96,y:9}],seen=new Set(['96,9']);
  for(let i=0;i<queue.length;i++){const p=queue[i];for(const[dx,dy]of[[0,1],[0,-1],[1,0],[-1,0]]){const q={x:p.x+dx,y:p.y+dy},key=`${q.x},${q.y}`;if(!seen.has(key)&&fieldsSafe({x:q.x*16,y:q.y*16})){seen.add(key);queue.push(q);}}}
  for(const p of FIELDS_IPES)expect(seen.has(`${Math.round(p.x/16)},${Math.round((p.y+40)/16)}`),p.id).toBe(true);
 });
 it('refuses stone hatchets and missing tools without changing the game',()=>{
  const s=setup(0),before=structuredClone(s);
  const r=chopIpe(s,ipe.id,stand,()=>true);expect(r.ok).toBe(false);expect(r.message).toContain('ferro');expect(s).toEqual(before);
  s.inventory.hatchet=0;syncToolInstances(s.inventory);expect(chopIpe(s,ipe.id,stand,()=>true).ok).toBe(false);
 });
 it('takes six saved blows with an iron hatchet, wearing it once per blow, and drops one hardwood',()=>{
  const s=setup(1),start=activeToolCopy(s.inventory,'hatchet')!.condition.durability;
  for(let i=1;i<IPE_HITS;i++){expect(chopIpe(s,ipe.id,stand,()=>true)).toMatchObject({ok:true,felled:false});expect(ipeHits(s,ipe.id)).toBe(i);expect(validateSave(s)).toBe(true);}
  const r=chopIpe(s,ipe.id,stand,()=>true);expect(r).toMatchObject({ok:true,felled:true,hardwood:1});
  expect(activeToolCopy(s.inventory,'hatchet')!.condition.durability).toBe(start-IPE_HITS);
  expect(dropped(s,'hardwood')).toBe(1);expect(dropped(s,'branch')).toBe(2);
  expect(ipeStanding(s,ipe.id)).toBe(false);expect(s.openFields?.hits).toBeUndefined();expect(validateSave(s)).toBe(true);
 });
 it('yields more hardwood with better metals',()=>{
  expect([0,1,2,3].map(hardwoodYield)).toEqual([0,1,2,3]);
  for(const tier of [2,3]){const s=setup(tier);expect(fell(s)).toMatchObject({felled:true,hardwood:tier});expect(dropped(s,'hardwood')).toBe(tier);}
 });
 it(`regrows after ${IPE_REGROW_DAYS} saved days and refuses blows while it is a stump`,()=>{
  const s=setup(1);fell(s);expect(chopIpe(s,ipe.id,stand,()=>true).ok).toBe(false);
  s.day+=IPE_REGROW_DAYS-1;expect(ipeStanding(s,ipe.id)).toBe(false);
  s.day++;expect(ipeStanding(s,ipe.id)).toBe(true);expect(fell(s)).toMatchObject({felled:true,hardwood:1});
 });
 it('keeps everything intact on failed saves, distant blows and other scenes',()=>{
  const s=setup(1),before=structuredClone(s);
  expect(chopIpe(s,ipe.id,stand,()=>false).ok).toBe(false);expect(s).toEqual(before);
  expect(chopIpe(s,ipe.id,{x:0,y:0},()=>true).ok).toBe(false);
  s.activeArea='property';expect(chopIpe(s,ipe.id,stand,()=>true).ok).toBe(false);expect(s.inventory).toEqual(before.inventory);
 });
 it('rejects invented ipês, future cuts and impossible blow counts',()=>{
  const s=setup(1);
  s.openFields={version:1,cut:{},felled:{nope:1}};expect(validateSave(s)).toBe(false);
  s.openFields={version:1,cut:{},felled:{[ipe.id]:s.day+1}};expect(validateSave(s)).toBe(false);
  s.openFields={version:1,cut:{},hits:{[ipe.id]:IPE_HITS}};expect(validateSave(s)).toBe(false);
  s.openFields={version:1,cut:{},hits:{[ipe.id]:2},felled:{[ipe.id]:1}};expect(validateSave(s)).toBe(true);
 });
});

describe('madeira nobre nas construções dos animais',()=>{
 it('is a named item that older saves receive with zero stock',()=>{
  expect(ITEM_IDS).toContain('hardwood');expect(ITEM_NAMES.hardwood).toBe('Madeira nobre');
  const old:any=setup();delete old.inventory.hardwood;expect(migrateSave(old)?.inventory.hardwood).toBe(0);
 });
 it('is required by every animal building, including future ones',()=>{
  const animal=FARM_KINDS.filter(k=>FARM_BUILDINGS[k].animal);expect(animal).toEqual(expect.arrayContaining(['coop','barn']));
  for(const k of animal)expect(FARM_BUILDINGS[k].cost[ANIMAL_BUILDING_MATERIAL],k).toBeGreaterThan(0);
  expect(FARM_BUILDINGS.coop.cost.hardwood).toBe(6);expect(FARM_BUILDINGS.barn.cost.hardwood).toBe(10);
 });
 it('keeps buildings finished before the change and asks unfinished work for the new wood',()=>{
  const s:any=setup();s.activeArea='property';delete s.inventory.hardwood;
  const {hardwood:_c,...coop}=FARM_BUILDINGS.coop.cost,{hardwood:_b,...barn}=FARM_BUILDINGS.barn.cost;
  s.farmConstruction={version:1,nextId:3,sites:[{id:1,kind:'coop',x:20,y:30,delivered:coop,finished:true,animals:[],hay:0,gateOpen:true},{id:2,kind:'barn',x:40,y:30,delivered:barn,finished:false,animals:[],hay:0,gateOpen:true}]};
  const m=migrateSave(s)!;expect(m).not.toBeNull();
  expect(m.farmConstruction!.sites[0].delivered.hardwood).toBe(6);
  expect(m.farmConstruction!.sites[1].delivered.hardwood).toBeUndefined();expect(farmReady(m.farmConstruction!.sites[1])).toBe(false);
 });
});
