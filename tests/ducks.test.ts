import {wildSpawns,wildTaken} from '../src/systems/wild-spawns';
import {startFieldEscort,transferFieldEscortToProperty,deliverAnimalEscort} from '../src/systems/animals';
import {describe,it,expect} from 'vitest';
import {createNewSave,validateSave,migrateSave} from '../src/systems/save';
import {createCharacterProfile} from '../src/data/characters';
import {FARM_BUILDINGS,farmAcceptsAnimal} from '../src/data/farm-buildings';
import {FARM_DUCKS,domesticAnimal} from '../src/data/domestic-animals';
import {processAnimalProduction,collectEgg,productionSummary,DUCK_FED_DAYS,FEATHER_EVERY} from '../src/systems/animal-production';
import {performVillageService} from '../src/systems/village-services';
import {MERCHANTS} from '../src/data/village-commerce';
import {FUTURE_INGREDIENTS} from '../src/data/kitchen';
import type {FarmSite} from '../src/systems/farm-construction';
import type {SaveData} from '../src/types';

const DUCK=FARM_DUCKS[0].id,HEN='forest-chicken-1';
const coop=(animals:string[]):FarmSite=>({id:1,kind:'coop',x:20,y:30,delivered:{...FARM_BUILDINGS.coop.cost},finished:true,animals,hay:0,gateOpen:true});
function farm(animals=[DUCK,HEN]):SaveData{
 const s=createNewSave(createCharacterProfile('Patos'));s.time=8*60;s.recruitedAnimals=[...animals];
 s.farmConstruction={version:1,nextId:2,sites:[coop([...animals])]};processAnimalProduction(s);return s;
}
const site=(s:SaveData)=>s.farmConstruction!.sites[0];
const morning=(s:SaveData)=>{s.day+=1;s.time=6*60;processAnimalProduction(s);};

describe('patos da criação',()=>{
 it('o pato vem dos Campos com a corda, vai para a Propriedade e mora no galinheiro',()=>{
  const s=createNewSave(createCharacterProfile('Rosa'));s.villageEconomy!.coins=1000;
  expect(performVillageService(s,'buy-duck').ok).toBe(false);
  // preview.48: só com a corda, trazendo dos Campos (beira do rio).
  let day=1,wild;while(!(wild=wildSpawns('openFields',day,wildTaken(s)).find(a=>a.kind==='duck')))day++;
  s.day=day;s.inventory.cord=1;s.activeArea='openFields';
  expect(startFieldEscort(s,{id:wild.id,x:wild.x,y:wild.y,direction:'down'}).ok).toBe(true);
  expect(validateSave(s)).toBe(true);
  s.activeArea='property';transferFieldEscortToProperty(s,{x:1500,y:1500});expect(deliverAnimalEscort(s)).toBe(true);
  expect(s.recruitedAnimals).toContain(wild.id);expect(s.villageEconomy!.coins).toBe(1000);
  expect(domesticAnimal(wild.id)?.kind).toBe('duck');
  expect(domesticAnimal(DUCK)?.kind).toBe('duck');expect(farmAcceptsAnimal('coop','duck')).toBe(true);expect(farmAcceptsAnimal('coop','chicken')).toBe(true);expect(farmAcceptsAnimal('barn','duck')).toBe(false);
  expect(validateSave(s)).toBe(true);
 });
 it(`bota um ovo de pato a cada ${DUCK_FED_DAYS} manhãs alimentado, num ninho diferente do ovo da galinha`,()=>{
  const s=farm();site(s).trough=12;
  morning(s);expect(site(s).eggs).toEqual([0]);expect(site(s).duckEggs).toBeUndefined();
  morning(s);expect(site(s).eggs).toHaveLength(2);expect(site(s).duckEggs).toHaveLength(1);
  expect(new Set([...site(s).eggs!,...site(s).duckEggs!]).size).toBe(3);
  expect(productionSummary(s,site(s)).eggs).toBe(3);expect(validateSave(s)).toBe(true);
 });
 it(`recolher dá ovo de pato; a cada ${FEATHER_EVERY} ovos de pato vem uma pena`,()=>{
  const s=farm([DUCK]);
  for(let n=1;n<=FEATHER_EVERY;n++){site(s).trough=2;morning(s);morning(s);const nest=site(s).duckEggs![0];expect(collectEgg(s,1,nest,()=>true).ok).toBe(true);}
  expect(s.inventory.duckEgg).toBe(FEATHER_EVERY);expect(s.inventory.feather).toBe(1);expect(site(s).duckCollected).toBe(FEATHER_EVERY);
 });
 it('o save recusa um ninho com dois ovos e ovos de pato fora do galinheiro',()=>{
  const s=farm();site(s).eggs=[0];site(s).duckEggs=[0];expect(validateSave(s)).toBe(false);
  site(s).duckEggs=[1];expect(validateSave(s)).toBe(true);
  s.animalCare!.animals[HEN]={duckDays:1};expect(validateSave(s)).toBe(false);
 });
 it('Rosa compra o ovo de pato e Celina a pena; o ovo de pato deixa de travar a torta',()=>{
  expect(MERCHANTS.seeds.sell.duckEgg).toBe(30);expect(MERCHANTS.tailor.sell.feather).toBe(12);
  expect(FUTURE_INGREDIENTS.duckEgg).toBeUndefined();
 });
 it('saves anteriores ganham a pena zerada',()=>{
  const old:any=farm();delete old.inventory.feather;expect(migrateSave(old)!.inventory.feather).toBe(0);
 });
});
