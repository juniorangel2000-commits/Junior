import {describe,it,expect,vi} from 'vitest';
import {sortBagEntries,bagCategory,bagItemId,nextBagSort,loadBagSort,saveBagSort} from '../src/systems/bag-sort';
import type {QuickSlot} from '../src/types';

type Slot=Exclude<QuickSlot,null>;
const entries=['item:wood','tool:hatchet:1','item:cornSeeds','item:egg','item:honey','item:wateringCan','item:stone'] as Slot[];
const amounts:Record<string,number>={'item:wood':24,'tool:hatchet:1':1,'item:cornSeeds':9,'item:egg':6,'item:honey':2,'item:wateringCan':1,'item:stone':12};
const amount=(s:Slot)=>amounts[s];

describe('Organizar a mochila',()=>{
 it('reconhece ferramentas, sementes, comida e materiais',()=>{
  expect(bagItemId('tool:hatchet:1' as Slot)).toBe('hatchet');expect(bagItemId('item:wood' as Slot)).toBe('wood');
  expect(bagCategory('hatchet')).toBe('tool');expect(bagCategory('wateringCan')).toBe('tool');expect(bagCategory('sword')).toBe('tool');
  expect(bagCategory('cornSeeds')).toBe('seed');expect(bagCategory('egg')).toBe('food');for(const fruit of ['apple','pear','orange'])expect(bagCategory(fruit),fruit).toBe('food');expect(bagCategory('turnip')).toBe('food');
  expect(bagCategory('wood')).toBe('material');expect(bagCategory('ironIngot')).toBe('material');
 });
 it('ordena por tipo, nome e quantidade sem perder nem repetir itens',()=>{
  const type=sortBagEntries(entries,'type',amount);
  expect(type.slice(0,2)).toEqual(['tool:hatchet:1','item:wateringCan']);expect(type[2]).toBe('item:cornSeeds');
  expect(type.slice(-2)).toEqual(['item:wood','item:stone']);
  expect(sortBagEntries(entries,'name',amount).slice(0,3)).toEqual(['tool:hatchet:1','item:wood','item:honey']);
  expect(sortBagEntries(entries,'amount',amount).slice(0,3)).toEqual(['item:wood','item:stone','item:cornSeeds']);
  for(const s of ['default','type','name','amount'] as const)expect([...sortBagEntries(entries,s,amount)].sort()).toEqual([...entries].sort());
  expect(sortBagEntries(entries,'default',amount)).toEqual(entries);
 });
 it('o botão alterna tipo → nome → quantidade e lembra a escolha',()=>{
  expect(nextBagSort('default')).toBe('type');expect(nextBagSort('type')).toBe('name');expect(nextBagSort('name')).toBe('amount');expect(nextBagSort('amount')).toBe('type');
  const store=new Map<string,string>();vi.stubGlobal('localStorage',{getItem:(k:string)=>store.get(k)??null,setItem:(k:string,v:string)=>void store.set(k,v)});
  expect(loadBagSort()).toBe('default');saveBagSort('name');expect(loadBagSort()).toBe('name');
  store.set('after-rain-bag-sort','qualquer');expect(loadBagSort()).toBe('default');
  vi.stubGlobal('localStorage',{getItem:()=>{throw Error('bloqueado');},setItem:()=>{throw Error('bloqueado');}});
  expect(loadBagSort()).toBe('default');expect(()=>saveBagSort('type')).not.toThrow();
  vi.unstubAllGlobals();
 });
});
