import {describe,it,expect,vi} from 'vitest';
import {createNewSave,validateSave,migrateSave} from '../src/systems/save';
import {createCharacterProfile} from '../src/data/characters';
import {FARM_BUILDINGS,farmAcceptsAnimal} from '../src/data/farm-buildings';
import {FARM_INTERIORS} from '../src/data/farm-interiors';
import {FARM_PIGS,domesticAnimal} from '../src/data/domestic-animals';
import {processAnimalProduction,fillTrough,collectManure,productionSummary,PIG_FOOD,MANURE_SPOTS} from '../src/systems/animal-production';
import {placeMachine,loadMachine,collectMachine,type MachineRuntime} from '../src/systems/machines';
import {MACHINES} from '../src/data/machines';
import {performVillageService,listVillageServices} from '../src/systems/village-services';
import type {FarmSite} from '../src/systems/farm-construction';
import type {SaveData} from '../src/types';

const PIG=FARM_PIGS[0].id;
const sty=(animals:string[]):FarmSite=>({id:1,kind:'pigsty',x:20,y:30,delivered:{...FARM_BUILDINGS.pigsty.cost},finished:true,animals,hay:0,gateOpen:true});
function farm(animals=[PIG]):SaveData{const s=createNewSave(createCharacterProfile('Porcos'));s.time=8*60;s.recruitedAnimals=[...animals];s.farmConstruction={version:1,nextId:2,sites:[sty([...animals])]};processAnimalProduction(s);return s;}
const site=(s:SaveData)=>s.farmConstruction!.sites[0];
const morning=(s:SaveData)=>{s.day+=1;s.time=6*60;processAnimalProduction(s);};

describe('porcos e chiqueiro',()=>{
 it('a Rosa vende o porco; ele mora no chiqueiro, que tem interior com cocho e lamaçal',()=>{
  const s=createNewSave(createCharacterProfile('Rosa'));s.villageEconomy!.coins=1000;
  expect(performVillageService(s,'buy-pig').ok).toBe(true);expect(s.recruitedAnimals).toContain(PIG);expect(s.villageEconomy!.coins).toBe(600);
  expect(domesticAnimal(PIG)?.kind).toBe('pig');expect(farmAcceptsAnimal('pigsty','pig')).toBe(true);expect(farmAcceptsAnimal('coop','pig')).toBe(false);
  const l=FARM_INTERIORS.pigsty!;expect(l.fixtures.map(f=>f.kind)).toEqual(expect.arrayContaining(['trough','water','manure']));
  // O Junior preferiu o chão de palha sem a mancha de lama no centro (16/11/2026).
  expect(l.fixtures.some(f=>f.kind==='mud')).toBe(false);
  expect(l.fixtures.filter(f=>f.kind==='manure')).toHaveLength(MANURE_SPOTS);expect(validateSave(s)).toBe(true);
 });
 it('o cocho aceita só sobras da horta (legumes, frutas e grãos), não palha nem flores',()=>{
  const s=farm();s.inventory.hay=10;s.inventory.daisy=5;
  expect(fillTrough(s,1,()=>true).message).toContain('sobras');expect(s.inventory.hay).toBe(10);
  expect(PIG_FOOD).toEqual(expect.arrayContaining(['carrot','strawberry','corn']));expect(PIG_FOOD).not.toContain('daisy');
  s.inventory.carrot=3;s.inventory.corn=10;expect(fillTrough(s,1,()=>true).ok).toBe(true);expect(site(s).trough).toBe(8);
  expect(s.inventory.carrot+s.inventory.corn).toBe(5);
 });
 it('porco alimentado deixa 1 esterco por manhã no chão; E recolhe',()=>{
  const s=farm();site(s).trough=2;morning(s);expect(site(s).manure).toEqual([0]);expect(productionSummary(s,site(s)).manure).toBe(1);
  morning(s);expect(site(s).manure).toEqual([0,1]);morning(s);expect(site(s).manure).toEqual([0,1]);
  expect(collectManure(s,1,1,()=>true).ok).toBe(true);expect(s.inventory.manure).toBe(1);expect(collectManure(s,1,1,()=>true).ok).toBe(false);
  expect(validateSave(s)).toBe(true);
  const bad=structuredClone(s);bad.farmConstruction!.sites[0].manure=[9];expect(validateSave(bad)).toBe(false);
 });
});

describe('composteira',()=>{
 function setup(){let s=createNewSave(createCharacterProfile('Adubo'));s.time=600;s.inventory.composter=1;const p={x:176,y:208,facing:{x:0,y:-1}};
  const rt:MachineRuntime={read:()=>s,snapshot:()=>structuredClone(s),write:vi.fn(()=>true),apply:d=>{s=d;},player:()=>p,space:()=>'property',bounds:()=>({width:512,height:512}),blocked:()=>false,placement:()=>'',actors:()=>[],enabled:()=>true};
  return{rt,get s(){return s;}};}
 it('o Tobias ensina; 2 estercos + 3 capins (ou 3 fibras) viram 2 adubos em 2 dias',()=>{
  expect(MACHINES.composter.npc).toBe('tobias');expect(listVillageServices('tobias').some(o=>o.id==='learn-composter')).toBe(true);
  const t=setup();expect(placeMachine(t.rt,'composter').ok).toBe(true);const id=t.s.machines!.items[0].id;
  t.s.inventory.manure=2;expect(loadMachine(t.rt,id,'manure').message).toContain('Capim fresco ou 3 × Fibras');expect(t.s.inventory.manure).toBe(2);
  t.s.inventory.fiber=3;expect(loadMachine(t.rt,id,'manure').ok).toBe(true);expect(t.s.inventory).toMatchObject({manure:0,fiber:0});
  t.s.day+=2;expect(collectMachine(t.rt,id).ok).toBe(true);expect(t.s.inventory.fertilizer).toBe(2);
  t.s.inventory.manure=2;t.s.inventory.freshGrass=3;expect(loadMachine(t.rt,id,'manure').ok).toBe(true);expect(t.s.inventory.freshGrass).toBe(0);
  expect(validateSave(t.s)).toBe(true);
 });
 it('saves anteriores ganham esterco e composteira zerados',()=>{
  const old:any=createNewSave(createCharacterProfile('Antigo'));delete old.inventory.manure;delete old.inventory.composter;
  expect(migrateSave(old)!.inventory).toMatchObject({manure:0,composter:0});
 });
});
