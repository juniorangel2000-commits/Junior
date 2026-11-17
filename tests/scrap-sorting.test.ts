import {describe,it,expect} from 'vitest';
import {createNewSave,validateSave} from '../src/systems/save';
import {createCharacterProfile} from '../src/data/characters';
import {performVillageService,listVillageServices} from '../src/systems/village-services';
import {sortScrap,SCRAP_SORT_FEE,SCRAP_SORT_MAX,validScrapSorting,PART_IDS} from '../src/systems/scrap-sorting';
import {createVillageEconomy,unitPrice} from '../src/data/village-commerce';
import {MACHINES} from '../src/data/machines';
import {ECONOMY_BALANCE as B} from '../src/data/economy-balance';
import {existsSync,readFileSync} from 'node:fs';

const save=(scrap:number,coins=500)=>{const s=createNewSave(createCharacterProfile('Sucata'));s.day=3;s.inventory.scrap=scrap;s.villageEconomy=createVillageEconomy();s.villageEconomy.coins=coins;return s;};

describe('Ícaro separa sucata',()=>{
 it('entrega até 10 por dia, cobra em moedas e devolve as peças na manhã seguinte',()=>{
  const s=save(14);
  const r=performVillageService(s,'scrap-sort');expect(r.ok).toBe(true);expect(r.message).toContain('volte amanhã');
  expect(s.inventory.scrap).toBe(14-SCRAP_SORT_MAX);expect(s.villageEconomy!.coins).toBe(500-SCRAP_SORT_MAX*SCRAP_SORT_FEE);
  expect(s.scrapSorting).toEqual({day:3,count:SCRAP_SORT_MAX});expect(validateSave(s)).toBe(true);
  // No mesmo dia: ainda separando.
  expect(performVillageService(s,'scrap-sort').ok).toBe(false);
  expect(listVillageServices('icaro',s).find(o=>o.id==='scrap-sort')?.disabled).toBe(true);
  // No dia seguinte: busca as peças.
  s.day=4;const expected=sortScrap(3,SCRAP_SORT_MAX);
  const got=performVillageService(s,'scrap-sort');expect(got.ok).toBe(true);expect(got.message).toContain('O Ícaro separou 10 sucatas');
  for(const p of PART_IDS)expect(s.inventory[p]??0).toBe(expected[p]??0);
  expect(s.scrapSorting).toBeUndefined();expect(validateSave(s)).toBe(true);
 });
 it('sem sucata ou sem moedas, não aceita',()=>{
  expect(performVillageService(save(0),'scrap-sort').ok).toBe(false);
  expect(performVillageService(save(4,10),'scrap-sort').ok).toBe(false);
 });
 it('pregos são os mais comuns e engrenagens as mais raras; o resultado do dia não muda',()=>{
  const total:Record<string,number>={nails:0,hinge:0,spring:0,gear:0};
  for(let d=1;d<=400;d++){const r=sortScrap(d,10);for(const p of PART_IDS)total[p]+=r[p]??0;}
  expect(total.nails).toBeGreaterThan(total.hinge);expect(total.hinge).toBeGreaterThan(total.gear);expect(total.spring).toBeGreaterThan(total.gear);
  expect(sortScrap(7,10)).toEqual(sortScrap(7,10));
 });
 it('o save só aceita um pedido válido',()=>{
  expect(validScrapSorting(undefined)).toBe(true);expect(validScrapSorting({day:2,count:3})).toBe(true);
  for(const bad of [{day:0,count:3},{day:2,count:0},{day:2,count:11},{day:2,count:3,x:1},[],'x'])expect(validScrapSorting(bad)).toBe(false);
 });
});
describe('peças de construção',()=>{
 it('o Bento vende caro; separar com o Ícaro sai mais barato',()=>{
  const day=B.mineralTradeDay;
  for(const p of PART_IDS)expect(unitPrice('blacksmith','buy',p,day)).toBeGreaterThan(SCRAP_SORT_FEE*3);
  expect(unitPrice('blacksmith','buy','gear',day)).toBeGreaterThan(unitPrice('blacksmith','buy','nails',day)!);
 });
 it('as máquinas pedem as peças e cada peça tem ícone',()=>{
  expect(MACHINES.cheesePress.cost).toMatchObject({spring:1,gear:1});expect(MACHINES.stoneMill.cost).toMatchObject({gear:2});
  const art=readFileSync('src/visual-assets.ts','utf8');
  for(const p of PART_IDS){expect(art).toContain(`'${p}'`);expect(existsSync(`public/assets/visual/items/${p}.png`)).toBe(true);}
 });
});
