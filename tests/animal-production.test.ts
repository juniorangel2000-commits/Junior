import {describe,it,expect,vi} from 'vitest';
import {createNewSave,validateSave,migrateSave} from '../src/systems/save';
import {createCharacterProfile} from '../src/data/characters';
import {FARM_BUILDINGS} from '../src/data/farm-buildings';
import {RECIPES} from '../src/data/recipes';
import {MERCHANTS} from '../src/data/village-commerce';
import {processAnimalProduction,productionDay,productionSummary,fillTrough,collectEgg,canMilk,milkCow,milkReady,MAX_CATCH_UP} from '../src/systems/animal-production';
import type {FarmSite} from '../src/systems/farm-construction';
import type {SaveData} from '../src/types';

const site=(id:number,kind:'coop'|'barn',animals:string[],extra:Partial<FarmSite>={}):FarmSite=>({id,kind,x:20+id*10,y:30,delivered:{...FARM_BUILDINGS[kind].cost},finished:true,animals,hay:0,gateOpen:true,...extra});
const HENS=['forest-chicken-1','forest-chicken-2'],COWS=['forest-cow-1','forest-cow-2'];
function farm(day=1,time=8*60):SaveData{
 const s=createNewSave(createCharacterProfile('Produção'));s.day=day;s.time=time;s.recruitedAnimals=[...HENS,...COWS];
 s.farmConstruction={version:1,nextId:3,sites:[site(1,'coop',[...HENS]),site(2,'barn',[...COWS])]};
 processAnimalProduction(s);return s;
}
const coop=(s:SaveData)=>s.farmConstruction!.sites[0],barn=(s:SaveData)=>s.farmConstruction!.sites[1];
const nextMorning=(s:SaveData,days=1)=>{s.day+=days;s.time=6*60;processAnimalProduction(s);};

describe('produção animal: ciclo diário',()=>{
 it('o dia de produção vira às 06:00',()=>{
  expect(productionDay({day:3,time:5*60+59})).toBe(2);
  expect(productionDay({day:3,time:6*60})).toBe(3);
 });
 it('um save sem registro começa hoje, sem produção retroativa',()=>{
  const s=farm(10);coop(s).trough=12;
  expect(s.animalCare).toEqual({day:10,animals:{}});
  expect(processAnimalProduction(s)).toBe(false);expect(coop(s).trough).toBe(12);expect(coop(s).eggs).toBeUndefined();
 });
 it('na manhã seguinte cada animal come 1 palha; galinha bota e vaca fica pronta',()=>{
  const s=farm();coop(s).trough=12;barn(s).trough=8;nextMorning(s);
  expect(coop(s).trough).toBe(10);expect(barn(s).trough).toBe(6);
  expect(coop(s).eggs).toEqual([0,1]);
  expect(COWS.every(id=>milkReady(s,id))).toBe(true);
  expect(productionSummary(s,coop(s))).toMatchObject({fed:2,animals:2,eggs:2,trough:10,capacity:12});
 });
 it('sem palha não há produção; com pouca palha come primeiro quem está há mais tempo sem comer',()=>{
  const s=farm();nextMorning(s);expect(coop(s).eggs).toBeUndefined();expect(milkReady(s,COWS[0])).toBe(false);
  barn(s).trough=1;nextMorning(s);const first=COWS.find(id=>milkReady(s,id))!;expect(first).toBeDefined();
  delete s.animalCare!.animals[first].milk;barn(s).trough=1;nextMorning(s);
  const second=COWS.find(id=>id!==first)!;expect(milkReady(s,second)).toBe(true);expect(milkReady(s,first)).toBe(false);
 });
 it('ovos e leite não se acumulam: no máximo um leite por vaca e um ovo por ninho',()=>{
  const s=farm();coop(s).trough=12;barn(s).trough=8;nextMorning(s,3);
  expect(coop(s).trough).toBe(6);expect(barn(s).trough).toBe(2);
  expect(coop(s).eggs).toHaveLength(6);
  expect(s.animalCare!.animals[COWS[0]]).toEqual({fed:4,milk:true});
 });
 it(`dias fora são recuperados com o estoque real, até ${MAX_CATCH_UP} manhãs`,()=>{
  const s=farm();barn(s).trough=8;nextMorning(s,30);
  expect(barn(s).trough).toBe(0);expect(s.animalCare!.day).toBe(31);
  expect(s.animalCare!.animals[COWS[0]].fed).toBe(28);
 });
 it('animais liberados do jogador deixam de ter registro',()=>{
  const s=farm();barn(s).trough=8;nextMorning(s);s.recruitedAnimals=[...HENS,COWS[0]];barn(s).animals=[COWS[0]];nextMorning(s);
  expect(Object.keys(s.animalCare!.animals)).not.toContain(COWS[1]);
 });
});

describe('produção animal: ações no interior',()=>{
 it('coloca a palha da mochila no cocho até a capacidade',()=>{
  const s=farm();s.inventory.hay=20;const write=vi.fn(()=>true);
  expect(fillTrough(s,1,write)).toMatchObject({ok:true});expect(coop(s).trough).toBe(12);expect(s.inventory.hay).toBe(8);
  expect(fillTrough(s,1,write).ok).toBe(false);
  s.inventory.hay=0;expect(fillTrough(s,2,write).message).toContain('Traga palha');
 });
 it('recolhe o ovo do ninho para a mochila',()=>{
  const s=farm();coop(s).trough=2;nextMorning(s);
  expect(collectEgg(s,1,0,()=>true).ok).toBe(true);expect(s.inventory.egg).toBe(1);expect(coop(s).eggs).toEqual([1]);
  expect(collectEgg(s,1,0,()=>true).ok).toBe(false);
 });
 it('ordenha exige o balde e uma vaca alimentada',()=>{
  const s=farm();barn(s).trough=2;
  expect(canMilk(s,COWS[0]).ok).toBe(false);nextMorning(s);
  expect(canMilk(s,COWS[0]).message).toContain('balde');
  s.inventory.milkPail=1;expect(milkCow(s,2,COWS[0],()=>true).ok).toBe(true);
  expect(s.inventory.milk).toBe(1);expect(s.inventory.milkPail).toBe(1);expect(milkReady(s,COWS[0])).toBe(false);
  expect(canMilk(s,COWS[0]).message).toContain('já foi ordenhada');
 });
 it('falha ao salvar preserva palha, ovos e leite',()=>{
  const s=farm();s.inventory.hay=5;coop(s).trough=1;barn(s).trough=1;s.inventory.milkPail=1;nextMorning(s);const before=structuredClone(s);
  expect(fillTrough(s,1,()=>false).ok).toBe(false);
  expect(collectEgg(s,1,coop(s).eggs![0],()=>{throw new Error('disco cheio');}).ok).toBe(false);
  expect(milkCow(s,2,COWS.find(id=>milkReady(s,id))!,()=>false).ok).toBe(false);
  expect(s).toEqual(before);
 });
});

describe('produção animal: save, receita e comércio',()=>{
 it('o save com cocho, ovos e registro valida; valores inventados são recusados',()=>{
  const s=farm();coop(s).trough=4;barn(s).trough=8;nextMorning(s);expect(validateSave(s)).toBe(true);
  const bad=(f:(d:SaveData)=>void)=>{const d=structuredClone(s);f(d);return validateSave(d);};
  expect(bad(d=>{barn(d).trough=9;})).toBe(false);
  expect(bad(d=>{coop(d).eggs=[0,0];})).toBe(false);
  expect(bad(d=>{barn(d).eggs=[0];})).toBe(false);
  expect(bad(d=>{d.animalCare!.day=d.day+1;})).toBe(false);
  expect(bad(d=>{d.animalCare!.animals[COWS[0]]={fed:1,milk:false};})).toBe(false);
 });
 it('saves anteriores ganham ovo, leite e balde zerados, sem registro de produção',()=>{
  const old:any=farm();delete old.inventory.egg;delete old.inventory.milk;delete old.inventory.milkPail;delete old.animalCare;
  const m=migrateSave(old)!;expect(m).not.toBeNull();expect(m.inventory).toMatchObject({egg:0,milk:0,milkPail:0});expect(m.animalCare).toBeUndefined();
 });
 it('o balde é feito na bancada; Helena compra ovo e leite, Rosa compra ovo',()=>{
  const r=RECIPES.find(r=>r.id==='milkPail')!;expect(r).toMatchObject({cost:{board:4,ironShard:2},output:{milkPail:1},requiresWorkbench:true});
  expect(MERCHANTS.inn.sell).toMatchObject({egg:8,milk:16});expect(MERCHANTS.seeds.sell.egg).toBe(8);
  for(const m of Object.values(MERCHANTS))for(const id of ['egg','milk'] as const)expect(m.buy[id]).toBeUndefined();
 });
});
