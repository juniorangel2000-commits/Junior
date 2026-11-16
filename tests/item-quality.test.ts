import {describe,it,expect,vi} from 'vitest';
import {createNewSave,validateSave} from '../src/systems/save';
import {createCharacterProfile} from '../src/data/characters';
import {FARM_BUILDINGS} from '../src/data/farm-buildings';
import {MERCHANTS,unitPrice,createVillageEconomy} from '../src/data/village-commerce';
import {qualityCounts,gainQuality,takeBest,peekBest,syncQuality,qualityLabel,averageQuality,bondQuality,validQualityLedger,MAX_BOND} from '../src/systems/item-quality';
import {processAnimalProduction,collectEgg,milkCow,petAnimal,animalQuality} from '../src/systems/animal-production';
import {placeMachine,loadMachine,collectMachine,type MachineRuntime} from '../src/systems/machines';
import {cookDish,dishVigor} from '../src/systems/kitchen';
import {dishRecipe} from '../src/data/kitchen';
import {useConsumable} from '../src/systems/consumables';
import {trade} from '../src/systems/commerce';
import {Inventory} from '../src/systems/inventory';
import type {FarmSite} from '../src/systems/farm-construction';
import type {SaveData,ItemId} from '../src/types';

const ok=()=>true;
const site=(id:number,kind:'coop'|'barn',animals:string[]):FarmSite=>({id,kind,x:20+id*10,y:30,delivered:{...FARM_BUILDINGS[kind].cost},finished:true,animals,hay:0,gateOpen:true});
const HEN='forest-chicken-1',COW='forest-cow-1';
function farm():SaveData{
 const s=createNewSave(createCharacterProfile('Qualidade'));s.day=1;s.time=8*60;s.recruitedAnimals=[HEN,COW];
 s.farmConstruction={version:1,nextId:3,sites:[site(1,'coop',[HEN]),site(2,'barn',[COW])]};processAnimalProduction(s);return s;
}
const morning=(s:SaveData)=>{s.day+=1;s.time=6*60;processAnimalProduction(s);s.time=8*60;};
const feed=(s:SaveData)=>{s.farmConstruction!.sites[0].trough=12;s.farmConstruction!.sites[1].trough=8;};

describe('registro de qualidade da mochila',()=>{
 it('o resto é comum; um gasto que não conhece qualidade tira primeiro as comuns',()=>{
  const s=createNewSave(createCharacterProfile('Mochila'));s.inventory.egg=3;gainQuality(s,'egg',3,2,1);gainQuality(s,'egg',3,1,1);
  expect(qualityCounts(s.itemQuality,'egg',3)).toEqual({common:1,good:1,excellent:1});
  s.inventory.egg=2;expect(qualityCounts(s.itemQuality,'egg',2)).toEqual({common:0,good:1,excellent:1});
  s.inventory.egg=1;expect(qualityCounts(s.itemQuality,'egg',1)).toEqual({common:0,good:0,excellent:1});
  // O registro é conferido a cada save; depois disso, o que entra na mochila é comum.
  syncQuality(s);s.inventory.egg=4;expect(qualityCounts(s.itemQuality,'egg',4)).toEqual({common:3,good:0,excellent:1});
  syncQuality(s);expect(s.itemQuality).toEqual({egg:{good:0,excellent:1,seen:4}});
  expect(qualityLabel(s.itemQuality,'egg',4)).toBe('1 excelente · 3 comuns');
  s.inventory.egg=0;syncQuality(s);expect(s.itemQuality).toBeUndefined();
 });
 it('venda, cozinha e máquinas usam primeiro as melhores unidades',()=>{
  const h:{itemQuality?:any}={};gainQuality(h,'milk',4,1,2);gainQuality(h,'milk',4,2,1);
  expect(peekBest(h.itemQuality,'milk',4,3)).toEqual([2,1,1]);
  expect(takeBest(h,'milk',4,2)).toEqual([2,1]);expect(qualityCounts(h.itemQuality,'milk',2)).toEqual({common:1,good:1,excellent:0});
  expect(averageQuality([2,0])).toBe(1);expect(averageQuality([1,0,0])).toBe(0);expect(averageQuality([])).toBe(0);
 });
 it('o save valida o registro e aceita saves sem ele',()=>{
  const s=createNewSave(createCharacterProfile('Save'));expect(validateSave(s)).toBe(true);
  s.inventory.egg=2;gainQuality(s,'egg',2,1,2);expect(validateSave(s)).toBe(true);
  expect(validQualityLedger({egg:{good:-1,excellent:0,seen:0}})).toBe(false);
  expect(validQualityLedger({naoExiste:{good:1,excellent:0,seen:1}})).toBe(false);
  expect(validQualityLedger({egg:{good:1,excellent:0,seen:1,extra:1}})).toBe(false);
 });
});

describe('amizade dos animais',()=>{
 it('sobe 1 por manhã alimentado, 1 com o carinho do dia e cai 2 sem comer',()=>{
  const s=farm();feed(s);morning(s);expect(s.animalCare!.animals[HEN].bond).toBe(1);
  expect(petAnimal(s,1,HEN,ok).ok).toBe(true);expect(s.animalCare!.animals[HEN].bond).toBe(2);
  expect(petAnimal(s,1,HEN,ok).message).toContain('Já recebeu carinho hoje');expect(s.animalCare!.animals[HEN].bond).toBe(2);
  s.farmConstruction!.sites[0].trough=0;morning(s);expect(s.animalCare!.animals[HEN].bond).toBeUndefined();
  expect(validateSave(s)).toBe(true);
 });
 it('bom com 10 pontos e excelente com 25; o limite é 30',()=>{
  expect([0,9,10,24,25,30].map(bondQuality)).toEqual([0,0,1,1,2,2]);
  const s=farm();for(let d=0;d<40;d++){feed(s);morning(s);petAnimal(s,1,HEN,ok);}
  expect(s.animalCare!.animals[HEN].bond).toBe(MAX_BOND);expect(animalQuality(s,HEN)).toBe(2);
  const bad=structuredClone(s);bad.animalCare!.animals[HEN].bond=31;expect(validateSave(bad)).toBe(false);
 });
 it('a galinha amiga bota ovo excelente; a vaca amiga dá leite excelente',()=>{
  const s=farm();s.animalCare!.animals[HEN]={bond:25};s.animalCare!.animals[COW]={bond:12};feed(s);morning(s);
  expect(s.farmConstruction!.sites[0].nestQuality).toEqual({0:2});expect(validateSave(s)).toBe(true);
  const r=collectEgg(s,1,0,ok);expect(r.message).toBe('Você recolheu 1 ovo excelente.');
  expect(qualityCounts(s.itemQuality,'egg',s.inventory.egg).excellent).toBe(1);expect(s.farmConstruction!.sites[0].nestQuality).toBeUndefined();
  s.inventory.milkPail=1;expect(milkCow(s,2,COW,ok).message).toBe('Você ordenhou 1 leite bom.');
  expect(qualityCounts(s.itemQuality,'milk',s.inventory.milk).good).toBe(1);
 });
 it('animal sem amizade produz comum, como antes',()=>{
  const s=farm();feed(s);morning(s);expect(s.farmConstruction!.sites[0].nestQuality).toBeUndefined();
  expect(collectEgg(s,1,0,ok).message).toBe('Você recolheu 1 ovo.');expect(s.itemQuality).toBeUndefined();
 });
});

describe('qualidade herdada',()=>{
 function machine(kind:'cheesePress'){let s=createNewSave(createCharacterProfile('Queijo'));s.time=600;s.inventory[kind]=1;const p={x:176,y:208,facing:{x:0,y:-1}};
  const rt:MachineRuntime={read:()=>s,snapshot:()=>structuredClone(s),write:vi.fn(()=>true),apply:d=>{s=d;},player:()=>p,space:()=>'property',bounds:()=>({width:512,height:512}),blocked:()=>false,placement:()=>'',actors:()=>[],enabled:()=>true};
  return{rt,get s(){return s;}};}
 it('o queijo herda a qualidade do leite',()=>{
  const t=machine('cheesePress');expect(placeMachine(t.rt,'cheesePress').ok).toBe(true);const id=t.s.machines!.items[0].id;
  t.s.inventory.milk=2;gainQuality(t.s,'milk',2,2,1);
  expect(loadMachine(t.rt,id,'milk').ok).toBe(true);expect(t.s.machines!.items[0].job!.quality).toBe(2);
  expect(qualityCounts(t.s.itemQuality,'milk',t.s.inventory.milk)).toEqual({common:1,good:0,excellent:0});expect(validateSave(t.s)).toBe(true);
  t.s.day+=1;const r=collectMachine(t.rt,id);expect(r.message).toBe('Você recolheu 1 × Queijo excelente.');
  expect(qualityCounts(t.s.itemQuality,'cheese',t.s.inventory.cheese).excellent).toBe(1);
 });
 it('o prato herda a média dos ingredientes de animal e dá mais vigor',()=>{
  const s=createNewSave(createCharacterProfile('Cozinha'));s.villageProgress!.recipes.push('kaleOmelette');
  // Desde a preview.40 a couve também conta: ovos excelentes com couve comum dão prato bom.
  const t=createNewSave(createCharacterProfile('Couve'));t.villageProgress!.recipes.push('kaleOmelette');Object.assign(t.inventory,{egg:2,kale:1,wood:1});gainQuality(t,'egg',2,2,2);
  expect(cookDish(t,'kaleOmelette',ok).message).toContain('Omelete de couve bom pronto');
  Object.assign(s.inventory,{egg:2,kale:1,wood:1});gainQuality(s,'egg',2,2,2);gainQuality(s,'kale',1,2,1);
  const r=cookDish(s,'kaleOmelette',ok);expect(r.ok).toBe(true);expect(r.message).toContain('Omelete de couve excelente pronto');
  expect(qualityCounts(s.itemQuality,'kaleOmelette',1).excellent).toBe(1);
  const base=dishRecipe('kaleOmelette')!;expect(dishVigor(base,2)).toBe(Math.round(base.vigor*1.5));
  s.villageProgress!.vigor=10;const eat=useConsumable(s,'kaleOmelette');expect(eat.message).toContain(`+${dishVigor(base,2)} de vigor`);
  expect(s.villageProgress!.vigor).toBe(10+dishVigor(base,2));expect(s.itemQuality).toBeUndefined();
 });
});

describe('venda com qualidade',()=>{
 it('as melhores unidades saem primeiro e valem 1,25× (bom) e 1,5× (excelente)',()=>{
  const buyer=(Object.keys(MERCHANTS) as (keyof typeof MERCHANTS)[]).find(m=>unitPrice(m,'sell','egg',1)!==undefined)!;expect(buyer).toBeTruthy();
  const price=unitPrice(buyer,'sell','egg',1)!;
  const s=createNewSave(createCharacterProfile('Venda'));s.inventory.egg=3;gainQuality(s,'egg',3,2,1);gainQuality(s,'egg',3,1,1);
  const economy=createVillageEconomy(),inv=new Inventory(s.inventory);
  const r=trade(buyer,'sell','egg' as ItemId,2,inv,economy,1,s);expect(r.ok).toBe(true);
  expect(r.ok&&r.total).toBe(Math.round(price*1.5)+Math.round(price*1.25));expect(r.message).toContain('Qualidade: 1 excelente e 1 bom');
  s.inventory=inv.data;expect(qualityCounts(s.itemQuality,'egg',1)).toEqual({common:1,good:0,excellent:0});
 });
});
