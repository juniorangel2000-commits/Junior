import {describe,it,expect,vi} from 'vitest';
import {createNewSave,validateSave,migrateSave} from '../src/systems/save';
import {createCharacterProfile} from '../src/data/characters';
import {toolCondition} from '../src/systems/economy';
import {trade} from '../src/systems/commerce';
import {Inventory} from '../src/systems/inventory';
import {createVillageEconomy,unitPrice} from '../src/data/village-commerce';
import {RECIPES} from '../src/data/recipes';
import {syncToolInstances} from '../src/systems/tool-instances';
import {existsSync} from 'node:fs';
vi.mock('../src/systems/bento-schedule',async o=>({...(await o() as object),bentoAvailability:()=>({open:true,message:''})}));

describe('foice e pá começam no ferro',()=>{
 it('o Bento vende desde o primeiro dia e a compra ensina a receita',()=>{
  const s=createNewSave(createCharacterProfile('Pá'));s.day=2;s.villageEconomy=createVillageEconomy();s.villageEconomy.coins=500;s.inventory.ironIngot=3;s.inventory.wood=2;
  expect(unitPrice('blacksmith','buy','sickle',2)).toBe(80);expect(unitPrice('blacksmith','buy','shovel',2)).toBe(90);
  const inv=new Inventory(s.inventory);const r=trade('blacksmith','buy','sickle',1,inv,s.villageEconomy,2,s);
  expect(r.ok).toBe(true);expect(r.message).toContain('aprendeu');s.inventory=inv.data;
  expect(s.villageProgress!.recipes).toContain('sickle');expect(toolCondition(s,'sickle').tier).toBe(1);expect(validateSave(s)).toBe(true);
 });
 it('a receita da bancada só depois de aprender, e já sai de ferro',()=>{
  expect(RECIPES.find(r=>r.id==='sickle')!.name).toBe('Foice de ferro');
  expect(RECIPES.some(r=>r.id==='upgrade-sickle-1'||r.id==='upgrade-shovel-1')).toBe(false);
 });
 it('partidas antigas: a foice de pedra vira de ferro e a receita fica aprendida',()=>{
  const s:any=createNewSave(createCharacterProfile('Antiga'));s.inventory.sickle=1;syncToolInstances(s.inventory);
  s.inventory.toolInstances.items[0].condition={tier:0,durability:40};
  const m=migrateSave(s)!;expect(m).toBeTruthy();expect(m.inventory.toolInstances!.items[0].condition).toEqual({tier:1,durability:250});
  expect(m.villageProgress!.recipes).toContain('sickle');
 });
 it('não há arte de foice nem de pá de pedra',()=>{
  expect(existsSync('public/assets/visual/economy/tools/stone-sickle.png')).toBe(false);expect(existsSync('public/assets/visual/economy/tools/stone-shovel.png')).toBe(false);
 });
});

describe('o Bento pede o ferro e a madeira',()=>{
 it('sem os 3 lingotes e as 2 madeiras, não faz; com eles, gasta o material e as moedas',()=>{
  const s=createNewSave(createCharacterProfile('Material'));s.day=2;s.villageEconomy=createVillageEconomy();s.villageEconomy.coins=500;s.inventory.wood=0;s.inventory.ironIngot=0;
  let inv=new Inventory(s.inventory);const no=trade('blacksmith','buy','shovel',1,inv,s.villageEconomy,2,s);
  expect(no.ok).toBe(false);expect(no.message).toContain('3 lingotes');expect(s.villageEconomy.coins).toBe(500);
  s.inventory.ironIngot=4;s.inventory.wood=5;inv=new Inventory(s.inventory);const ok=trade('blacksmith','buy','shovel',1,inv,s.villageEconomy,2,s);
  expect(ok.ok).toBe(true);expect(inv.data.ironIngot).toBe(1);expect(inv.data.wood).toBe(3);expect(inv.data.shovel).toBe(1);expect(s.villageEconomy.coins).toBe(410);
 });
});
