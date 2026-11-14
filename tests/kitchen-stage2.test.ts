import {describe,it,expect,vi} from 'vitest';
import fs from 'node:fs';
import {createNewSave,validateSave} from '../src/systems/save';
import {createCharacterProfile} from '../src/data/characters';
import {DISH_RECIPES,dishStation,dishSource} from '../src/data/kitchen';
import {MACHINE_RECIPES,MACHINES,OVEN_MINUTES} from '../src/data/machines';
import {placeMachine,loadMachine,loadOven,collectMachine,machineReady,nearEmptyOven,type MachineRuntime,type MachineSpace} from '../src/systems/machines';
import {cookDish,cookInScene,knownDishes,hiddenDishes,discoverDish,discoverDishAndSave,dishOfDay,validKitchenState,DISH_OF_DAY_FACTOR} from '../src/systems/kitchen';
import {applyDishEffect,activeFoodEffect,playerSpeedFactor,spendVigor,extraVigor,validFoodEffect,FOOD_EFFECTS,SPEED_BONUS,EXTRA_VIGOR} from '../src/systems/food-effects';
import {useConsumable} from '../src/systems/consumables';
import {performVillageService,listVillageServices} from '../src/systems/village-services';
import {FishingSession} from '../src/systems/fishing';
import {RECIPES} from '../src/data/recipes';
import type {SaveData} from '../src/types';

const fresh=():SaveData=>{const s=createNewSave(createCharacterProfile('Cozinha 2'));s.time=600;s.villageEconomy!.coins=3000;return s;};
const advance=(s:SaveData,minutes:number)=>{const n=(s.day-1)*1440+s.time+minutes;s.day=Math.floor(n/1440)+1;s.time=n%1440;};

describe('efeitos dos pratos',()=>{
 it('suco de melancia: anda 15% mais rápido por 4 horas; depois volta ao normal',()=>{
  const s=fresh();s.inventory.watermelonJuice=1;
  const r=useConsumable(s,'watermelonJuice');expect(r.ok).toBe(true);expect(r.message).toContain('Passo leve');
  expect(activeFoodEffect(s)?.id).toBe('watermelonJuice');expect(playerSpeedFactor(s)).toBeCloseTo(SPEED_BONUS);
  advance(s,4*60-1);expect(playerSpeedFactor(s)).toBeCloseTo(SPEED_BONUS);advance(s,1);expect(playerSpeedFactor(s)).toBe(1);
  s.inventory.boots=1;expect(playerSpeedFactor(s)).toBeCloseTo(1.08);
 });
 it('um efeito por vez: comer outro prato com efeito troca o anterior',()=>{
  const s=fresh();applyDishEffect(s,'watermelonJuice');applyDishEffect(s,'beanTropeiro');
  expect(activeFoodEffect(s)?.id).toBe('beanTropeiro');expect(activeFoodEffect(s)!.until).toBe((s.day-1)*1440+s.time+FOOD_EFFECTS.beanTropeiro.minutes);
 });
 it('café reforçado: 30 de vigor extra, gasto antes do vigor normal, que some com o efeito',()=>{
  const s=fresh();s.villageProgress!.vigor=100;s.inventory.heartyBreakfast=1;
  expect(useConsumable(s,'heartyBreakfast').ok).toBe(true);expect(extraVigor(s)).toBe(EXTRA_VIGOR);
  spendVigor(s,20);expect(extraVigor(s)).toBe(10);expect(s.villageProgress!.vigor).toBe(100);
  spendVigor(s,15);expect(extraVigor(s)).toBe(0);expect(s.villageProgress!.vigor).toBe(95);
  applyDishEffect(s,'heartyBreakfast');advance(s,8*60);expect(extraVigor(s)).toBe(0);
  spendVigor(s,5);expect(s.villageProgress!.vigor).toBe(90);
 });
 it('peixe assado deixa a faixa de controle da pesca maior',()=>{
  const normal=new FishingSession(1,false,false,()=>.5,'lake',{}),easy=new FishingSession(1,false,false,()=>.5,'lake',{bandBonus:.07});
  expect((easy as any).bandSize-(normal as any).bandSize).toBeCloseTo(.07);
 });
 it('o save guarda o efeito; valores inventados são recusados',()=>{
  const s=fresh();applyDishEffect(s,'heartyBreakfast');expect(validateSave(s)).toBe(true);
  expect(validFoodEffect({id:'voar',until:10})).toBe(false);
  expect(validFoodEffect({id:'watermelonJuice',until:10,extraVigor:5})).toBe(false);
  expect(validFoodEffect({id:'heartyBreakfast',until:10,extraVigor:99})).toBe(false);
 });
});

describe('fogueira portátil',()=>{
 it('monta-se sem bancada; os pratos da fogueira já vêm conhecidos',()=>{
  const r=RECIPES.find(r=>r.id==='campfire')!;expect(r.requiresWorkbench).toBeFalsy();expect(r.output).toEqual({campfire:1});
  const s=fresh();expect(knownDishes(s,'campfire').map(r=>r.id)).toEqual(['roastedFish','roastedCorn','roastedSweetPotato']);
 });
 it('assa na hora gastando 1 madeira; falha ao salvar desfaz tudo e sincroniza a mochila da cena',()=>{
  const s=fresh();s.inventory.fish=1;s.inventory.wood=1;let synced:SaveData['inventory']|undefined;
  const before=structuredClone(s.inventory);
  expect(cookInScene(s,'roastedFish','campfire',()=>false,i=>{synced=i;}).ok).toBe(false);
  expect(s.inventory).toEqual(before);expect(synced).toEqual(before);
  expect(cookInScene(s,'roastedFish','campfire',()=>true,i=>{synced=i;}).ok).toBe(true);
  expect(s.inventory).toMatchObject({fish:0,wood:0,roastedFish:1});expect(synced!.roastedFish).toBe(1);
  expect(cookInScene(s,'roastedCorn','campfire',()=>true).message).toContain('milho');
  expect(cookInScene(s,'kaleOmelette','campfire',()=>true).message).toContain('fogão');
 });
});

describe('forno de barro',()=>{
 function setup(){let s=fresh();const p={x:176,y:208,facing:{x:0,y:-1}};let space:MachineSpace|undefined='property';
  const rt:MachineRuntime={read:()=>s,snapshot:()=>structuredClone(s),write:vi.fn(()=>true),apply:d=>{s=d;},player:()=>p,space:()=>space,bounds:()=>({width:512,height:512}),blocked:(x,y)=>x<32||y<32||x>480||y>480,placement:()=>'',actors:()=>[],enabled:()=>true};
  s.inventory.clayOven=1;return{rt,get s(){return s;},space:(v:typeof space)=>{space=v;}};
 }
 it('a Helena ensina o projeto; pães e bolos passam ao forno',()=>{
  expect(MACHINES.clayOven.npc).toBe('helena');expect(listVillageServices('helena').some(o=>o.id==='learn-clayOven')).toBe(true);
  for(const id of ['homemadeBread','cornBroa','carrotCake','strawberryPie','honeyCake'])expect(dishStation(DISH_RECIPES.find(r=>r.id===id)!)).toBe('oven');
  const s=fresh();s.villageProgress!.recipes.push('homemadeBread');s.inventory.flour=2;s.inventory.egg=1;s.inventory.milk=1;s.inventory.wood=1;
  expect(cookDish(s,'homemadeBread',()=>true).message).toContain('forno');
 });
 it('fica só ao ar livre, na Propriedade',()=>{
  const t=setup();t.space('farm:1');expect(placeMachine(t.rt,'clayOven').message).toContain('Propriedade');
  t.space('property');expect(placeMachine(t.rt,'clayOven').ok).toBe(true);
 });
 it('assa a fornada em meio dia, com ingredientes e lenha; o item solto não carrega o forno',()=>{
  const t=setup();placeMachine(t.rt,'clayOven');const oven=nearEmptyOven(t.rt)!;expect(oven).toBeDefined();
  t.s.inventory.flour=2;t.s.inventory.egg=1;t.s.inventory.milk=1;t.s.inventory.wood=1;
  expect(loadMachine(t.rt,oven.id,'flour').ok).toBe(false);
  expect(loadOven(t.rt,oven.id,'homemadeBread').message).toContain('Helena');
  t.s.villageProgress!.recipes.push('homemadeBread');
  expect(loadOven(t.rt,oven.id,'homemadeBread').ok).toBe(true);expect(t.s.inventory).toMatchObject({flour:0,egg:0,milk:0,wood:0});
  expect(nearEmptyOven(t.rt)).toBeUndefined();expect(collectMachine(t.rt,oven.id).ok).toBe(false);
  advance(t.s,OVEN_MINUTES-1);expect(machineReady(t.s,t.s.machines!.items[0])).toBe(false);advance(t.s,1);
  expect(collectMachine(t.rt,oven.id).ok).toBe(true);expect(t.s.inventory.homemadeBread).toBe(1);expect(validateSave(t.s)).toBe(true);
 });
 it('cada fornada do forno corresponde a uma receita do caderno',()=>{
  const oven=MACHINE_RECIPES.filter(r=>r.machine==='clayOven');
  expect(oven.map(r=>r.output).sort()).toEqual(DISH_RECIPES.filter(r=>dishStation(r)==='oven').map(r=>r.id).sort());
  for(const r of oven){expect(r.minutes).toBe(OVEN_MINUTES);expect(r.ingredients!.wood).toBe(1);}
  expect(fs.existsSync('public/assets/visual/machines/clayOven.png')).toBe(true);
 });
});

describe('prato do dia e receitas escondidas',()=>{
 it('o prato do dia vem do calendário; a Helena paga o dobro uma vez por dia',()=>{
  const s=fresh();const r=dishOfDay(s.day);expect(dishOfDay(s.day)).toBe(r);expect(dishSource(r)).toBe('helena');
  expect(Object.keys(r.ingredients)).not.toContain('honey');
  const offer=()=>listVillageServices('helena',s).find(o=>o.id==='dish-of-day')!;expect(offer().disabled).toBe(true);
  s.inventory[r.id]=2;const coins=s.villageEconomy!.coins;expect(offer().disabled).toBe(false);
  expect(performVillageService(s,'dish-of-day').ok).toBe(true);expect(s.villageEconomy!.coins).toBe(coins+r.price*DISH_OF_DAY_FACTOR);
  expect(performVillageService(s,'dish-of-day').ok).toBe(false);expect(validateSave(s)).toBe(true);
  expect(validKitchenState({dishOfDaySold:s.day+1},s.day)).toBe(false);
 });
 it('três receitas escondidas aparecem como ??? até serem encontradas',()=>{
  const s=fresh();expect(hiddenDishes(s,'stove').map(r=>r.id).sort()).toEqual(['fishStew','minerBroth']);expect(hiddenDishes(s,'oven').map(r=>r.id)).toEqual(['honeyCake']);
  expect(discoverDish(s,'mine')!.id).toBe('minerBroth');expect(discoverDish(s,'mine')).toBeUndefined();
  expect(hiddenDishes(s,'stove').map(r=>r.id)).toEqual(['fishStew']);
 });
 it('se salvar falhar, a descoberta é desfeita para tentar de novo',()=>{
  const s=fresh();expect(discoverDishAndSave(s,'survivors',()=>false)).toBeUndefined();expect(s.villageProgress!.recipes).not.toContain('fishStew');
  expect(discoverDishAndSave(s,'survivors',()=>true)!.id).toBe('fishStew');
 });
 it('o mapa antigo revela o bolo de mel, inclusive para quem já tinha usado o mapa',()=>{
  const s=fresh();s.inventory.oldMap=1;expect(useConsumable(s,'oldMap').message).toContain('Bolo de mel');expect(s.villageProgress!.recipes).toContain('honeyCake');
  const old=fresh();old.villageProgress!.rumors.push('old-ruins');old.inventory.oldMap=1;
  expect(useConsumable(old,'oldMap').ok).toBe(true);expect(old.villageProgress!.recipes).toContain('honeyCake');
  old.inventory.oldMap=1;expect(useConsumable(old,'oldMap').ok).toBe(false);
 });
});
