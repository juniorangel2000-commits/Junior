import {describe,it,expect,vi} from 'vitest';
import {createNewSave,validateSave} from '../src/systems/save';
import {createCharacterProfile} from '../src/data/characters';
import {reserveTool,orderAction,toolCondition,workbenchUpgrade,learnedUpgrades,upgradeProblem,toolUpgradeCost,configureTool} from '../src/systems/economy';
import {RECIPES} from '../src/data/recipes';
import {recipeStation,recipeCategory,recipeTeacher} from '../src/data/recipe-groups';
import {craft} from '../src/systems/crafting';
import {Inventory} from '../src/systems/inventory';
import {TOOL_IDS} from '../src/data/economy-balance';
vi.mock('../src/systems/bento-schedule',async o=>({...(await o() as object),bentoAvailability:()=>({open:true,message:''})}));
const save=()=>{const s=createNewSave(createCharacterProfile('Melhoria'));s.inventory.pickaxe=1;s.villageEconomy!.coins=100000;s.inventory.backpack=2;return s;};
/** O Bento entrega a picareta de ferro uma vez: a melhoria de ferro fica aprendida. */
function learnIron(s:ReturnType<typeof save>){s.inventory.ironIngot=4;s.inventory.wood=2;expect(reserveTool(s,'pickaxe',1).ok).toBe(true);expect(orderAction(s,1,'pay').ok).toBe(true);s.day=2;expect(orderAction(s,1,'collect').ok).toBe(true);}
describe('melhorias de ferramentas na bancada de trabalho',()=>{
 it('15 receitas (5 ferramentas × ferro, ouro e metal negro), na bancada de trabalho, categoria Melhorias, ensinadas pelo Bento',()=>{
  const up=RECIPES.filter(r=>r.upgrade);expect(up).toHaveLength(TOOL_IDS.length*3);
  for(const r of up){expect(recipeStation(r)).toBe('workbench');expect(recipeCategory(r)).toBe('upgrades');expect(recipeTeacher(r)).toBe('Bento');expect(r.cost).toEqual(toolUpgradeCost(r.upgrade!.tool,r.upgrade!.tier));}
  expect(craft('upgrade-pickaxe-1',new Inventory({ironIngot:9,wood:9,pickaxe:1}),true).ok).toBe(false);
 });
 it('só depois da primeira encomenda retirada com o Bento',()=>{
  const s=save();expect(upgradeProblem(s,'pickaxe',1)).toContain('Bento');s.inventory.ironIngot=4;s.inventory.wood=2;
  expect(workbenchUpgrade(s,'pickaxe',1,true).ok).toBe(false);expect(s.inventory.ironIngot).toBe(4);
  learnIron(s);expect(learnedUpgrades(s)).toEqual(['upgrade-pickaxe-1']);expect(toolCondition(s,'pickaxe').tier).toBe(1);
 });
 it('na bancada: mesmos materiais, sem moedas nem espera, e respeita a ordem dos metais',()=>{
  const s=save();learnIron(s);s.inventory.pickaxe=2;
  // Outra picareta, ainda de pedra, ativa na mochila.
  configureTool(s,'pickaxe',0);s.inventory.ironIngot=4;s.inventory.wood=2;const coins=s.villageEconomy!.coins;
  expect(workbenchUpgrade(s,'pickaxe',1,false).ok).toBe(false);
  const r=workbenchUpgrade(s,'pickaxe',1,true);expect(r.ok).toBe(true);expect(toolCondition(s,'pickaxe').tier).toBe(1);
  expect(s.inventory.ironIngot).toBe(0);expect(s.inventory.wood).toBe(0);expect(s.villageEconomy!.coins).toBe(coins);expect(validateSave(s)).toBe(true);
  expect(workbenchUpgrade(s,'pickaxe',1,true).message).toContain('já está');
  expect(upgradeProblem(s,'pickaxe',2)).toContain('Bento');
 });
 it('sem materiais não muda nada',()=>{const s=save();learnIron(s);configureTool(s,'pickaxe',0);const before=structuredClone(s.inventory);expect(workbenchUpgrade(s,'pickaxe',1,true).ok).toBe(false);expect(s.inventory).toEqual(before);});
});
