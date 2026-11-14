import {describe,it,expect,vi} from 'vitest';
import {createNewSave,migrateSave,validateSave} from '../src/systems/save';
import {createCharacterProfile} from '../src/data/characters';
import {FARM_BUILDINGS,farmAcceptsAnimal} from '../src/data/farm-buildings';
import {FARM_INTERIORS,interiorBlocked,interiorSafe,interiorSpawn} from '../src/data/farm-interiors';
import {farmAnchor,assignFarmAnimal,unassignFarmAnimal,type FarmRuntime,type FarmSite} from '../src/systems/farm-construction';
import {processAnimalProduction,fillTrough,canMilk,milkCow,canShear,shearSheep,milkReady,woolReady,productionSummary} from '../src/systems/animal-production';
import {syncToolInstances,activeToolCopy} from '../src/systems/tool-instances';
import {Inventory,MAX_ITEM_COUNT,occupiedInventorySlots} from '../src/systems/inventory';
import {RECIPES} from '../src/data/recipes';
import {MERCHANTS} from '../src/data/village-commerce';
import type {SaveData} from '../src/types';
const SHEEP='forest-sheep-1',GOAT='forest-goat-1';
const site=(id=1,x=30):FarmSite=>({id,kind:'aprisco',x,y:30,finished:true,delivered:{...FARM_BUILDINGS.aprisco.cost},animals:[SHEEP,GOAT],hay:0,gateOpen:true});
function setup(){const s=createNewSave(createCharacterProfile('Aprisco'));s.recruitedAnimals=[SHEEP,GOAT];s.farmConstruction={version:1,nextId:2,sites:[site()]};s.inventory.hay=20;s.inventory.milkPail=1;s.inventory.shears=2;syncToolInstances(s.inventory);processAnimalProduction(s);return s;}
const home=(s:SaveData)=>s.farmConstruction!.sites[0];
function morning(s:SaveData,days=1){s.day+=days;s.time=360;processAnimalProduction(s);}
const rt=(s:SaveData):FarmRuntime=>({snapshot:()=>structuredClone(s),write:()=>true,apply:d=>{Object.assign(s,d);s.animalEscort=d.animalEscort;},player:()=>farmAnchor(home(s)),placement:()=>''});

describe('aprisco e alimentação',()=>{
 it('abriga as duas espécies, exige madeira nobre e rejeita animais incompatíveis',()=>{
  expect(FARM_BUILDINGS.aprisco).toMatchObject({capacity:4,cost:{hardwood:8}});
  expect(farmAcceptsAnimal('aprisco','sheep')).toBe(true);expect(farmAcceptsAnimal('aprisco','goat')).toBe(true);
  for(const kind of ['cow','chicken','horse'])expect(farmAcceptsAnimal('aprisco',kind)).toBe(false);
  expect(farmAcceptsAnimal('barn','goat')).toBe(false);expect(validateSave(setup())).toBe(true);
 });
 it('alimenta ambos individualmente e só a cabra fornece leite na primeira manhã',()=>{
  const s=setup();expect(fillTrough(s,1,()=>true).ok).toBe(true);expect(home(s).trough).toBe(8);morning(s);
  expect(home(s).trough).toBe(6);expect(milkReady(s,GOAT)).toBe(true);expect(woolReady(s,SHEEP)).toBe(false);
  expect(productionSummary(s,home(s))).toMatchObject({fed:2,milk:1,wool:0,capacity:8});
 });
 it('a lã exige três manhãs alimentadas, pausando sem palha',()=>{
  const s=setup();home(s).trough=2;morning(s);expect(s.animalCare!.animals[SHEEP].woolDays).toBe(1);
  morning(s,2);expect(s.animalCare!.animals[SHEEP].woolDays).toBe(1);expect(woolReady(s,SHEEP)).toBe(false);
  home(s).trough=4;morning(s,2);expect(woolReady(s,SHEEP)).toBe(true);expect(validateSave(s)).toBe(true);
 });
 it('leite e lã prontos não acumulam cargas durante dias fora e recarregamento',()=>{
  const s=setup();home(s).trough=8;morning(s,20);expect(woolReady(s,SHEEP)).toBe(true);expect(milkReady(s,GOAT)).toBe(true);
  const restored=migrateSave(JSON.parse(JSON.stringify(s)))!;expect(processAnimalProduction(restored)).toBe(false);
  expect(productionSummary(restored,home(restored))).toMatchObject({milk:1,wool:1,trough:0});
 });
 it('mudar de aprisco não reinicia o progresso da lã nem duplica a ordenha',()=>{
  const s=setup();home(s).trough=4;morning(s,2);milkCow(s,1,GOAT,()=>true);
  s.farmConstruction!.sites.push({...site(2,50),animals:[]});s.farmConstruction!.nextId=3;
  home(s).animals=[];s.farmConstruction!.sites[1].animals=[SHEEP,GOAT];s.farmConstruction!.sites[1].trough=2;
  expect(processAnimalProduction(s)).toBe(false);expect(milkReady(s,GOAT)).toBe(false);
  morning(s);expect(woolReady(s,SHEEP)).toBe(true);expect(validateSave(s)).toBe(true);
 });
 it('o alojamento real aceita ovelhas e cabras conduzidas até a obra e devolve a corda',()=>{
  const s=setup();home(s).animals=[];const p=farmAnchor(home(s));s.animalPositions={forest:[],property:[{id:SHEEP,...p,direction:'down'},{id:GOAT,...p,direction:'down'}]};
  s.animalEscort={id:GOAT,area:'property'};const cord=s.inventory.cord;
  expect(assignFarmAnimal(rt(s),1,GOAT).ok).toBe(true);expect(s.inventory.cord).toBe(cord+1);expect(s.animalEscort).toBeUndefined();
  expect(assignFarmAnimal(rt(s),1,SHEEP).ok).toBe(true);expect(home(s).animals).toEqual([GOAT,SHEEP]);expect(validateSave(s)).toBe(true);
  expect(unassignFarmAnimal(rt(s),1,SHEEP).ok).toBe(true);
 });
});

describe('coleta manual do aprisco',()=>{
 const ready=()=>{const s=setup();home(s).trough=8;morning(s,3);return s;};
 it('ordena o produto correto sem consumir o balde ou entregar leite comum',()=>{
  const s=ready();expect(canMilk(s,GOAT).ok).toBe(true);expect(milkCow(s,1,GOAT,()=>true).ok).toBe(true);
  expect(s.inventory.goatMilk).toBe(1);expect(s.inventory.milk).toBe(0);expect(s.inventory.milkPail).toBe(1);
  expect(milkCow(s,1,GOAT,()=>true).ok).toBe(false);expect(milkCow(s,1,SHEEP,()=>true).ok).toBe(false);
 });
 it('tosquia entrega uma lã e desgasta somente a tesoura selecionada',()=>{
  const s=ready(),book=s.inventory.toolInstances!,selected=activeToolCopy(s.inventory,'shears')!,other=book.items.find(t=>t.kind==='shears'&&t.id!==selected.id)!;
  expect(shearSheep(s,1,SHEEP,()=>true).ok).toBe(true);expect(s.inventory.wool).toBe(1);expect(s.inventory.shears).toBe(2);
  expect(activeToolCopy(s.inventory,'shears')!.condition.durability).toBe(99);expect(s.inventory.toolInstances!.items.find(t=>t.id===other.id)!.condition.durability).toBe(100);
  expect(woolReady(s,SHEEP)).toBe(false);expect(shearSheep(s,1,SHEEP,()=>true).ok).toBe(false);
  home(s).trough=8;morning(s,2);expect(woolReady(s,SHEEP)).toBe(false);morning(s);expect(woolReady(s,SHEEP)).toBe(true);
 });
 it('recusa tesoura ausente ou gasta, animal errado e moradia errada',()=>{
  const s=ready();s.inventory.shears=0;syncToolInstances(s.inventory);expect(canShear(s,SHEEP).message).toContain('tesoura');
  s.inventory.shears=1;syncToolInstances(s.inventory);activeToolCopy(s.inventory,'shears')!.condition.durability=0;expect(canShear(s,SHEEP).ok).toBe(false);
  expect(shearSheep(s,1,GOAT,()=>true).ok).toBe(false);expect(milkCow(s,99,GOAT,()=>true).ok).toBe(false);
 });
 it('falha ao salvar preserva produtos pendentes, inventário e durabilidade',()=>{
  const s=ready(),before=structuredClone(s),write=vi.fn(()=>false);
  expect(shearSheep(s,1,SHEEP,write).ok).toBe(false);expect(milkCow(s,1,GOAT,()=>{throw Error('disco');}).ok).toBe(false);expect(s).toEqual(before);
 });
 it('mochila cheia preserva a lã e o leite pendentes',()=>{
  const s=ready();s.inventory.wool=MAX_ITEM_COUNT;s.inventory.goatMilk=MAX_ITEM_COUNT;const before=structuredClone(s);
  expect(shearSheep(s,1,SHEEP,()=>true).ok).toBe(false);expect(milkCow(s,1,GOAT,()=>true).ok).toBe(false);expect(s).toEqual(before);
 });
 it('saves antigos recebem os itens zerados, e rejeita progressos inventados',()=>{
  const old:any=setup();for(const id of ['shears','wool','goatMilk'])delete old.inventory[id];delete old.inventory.toolInstances;
  expect(migrateSave(old)!.inventory).toMatchObject({shears:0,wool:0,goatMilk:0});
  const s=ready();s.animalCare!.animals[SHEEP].woolDays=3;expect(validateSave(s)).toBe(false);s.animalCare!.animals[SHEEP].woolDays=0;
  s.animalCare!.animals[GOAT].wool=true;expect(validateSave(s)).toBe(false);
 });
 it('cada tesoura ocupa um espaço, é fabricada na bancada e produtos só são comprados pelos NPCs',()=>{
  expect(occupiedInventorySlots(new Inventory({shears:2}).data)).toBe(2);
  expect(RECIPES.find(r=>r.id==='shears')).toMatchObject({requiresWorkbench:true,requiresTool:'hammer',output:{shears:1}});
  expect(MERCHANTS.tailor.sell.wool).toBe(36);expect(MERCHANTS.inn.sell.goatMilk).toBe(20);
  for(const m of Object.values(MERCHANTS)){expect(m.buy.wool).toBeUndefined();expect(m.buy.goatMilk).toBeUndefined();}
 });
});

it('todo o piso livre do aprisco é alcançável sem atravessar os fixos',()=>{
 const l=FARM_INTERIORS.aprisco!,start=interiorSpawn(l),seen=new Set<string>(),queue=[start],key=(x:number,y:number)=>`${x},${y}`;seen.add(key(start.x,start.y));
 for(let i=0;i<queue.length;i++){const p=queue[i];for(const[dx,dy]of [[8,0],[-8,0],[0,8],[0,-8]]){const q={x:p.x+dx,y:p.y+dy},k=key(q.x,q.y);if(q.y<l.height*32&&interiorSafe(l,q)&&!seen.has(k)){seen.add(k);queue.push(q);}}}
 for(let y=start.y%8;y<l.height*32;y+=8)for(let x=start.x%8;x<l.width*32;x+=8)if(interiorSafe(l,{x,y}))expect(seen.has(key(x,y)),`${x},${y}`).toBe(true);
 for(const f of l.fixtures.filter(f=>f.solid))expect(interiorBlocked(l,f.x+f.w/2,f.y+f.h/2)).toBe(true);
});
