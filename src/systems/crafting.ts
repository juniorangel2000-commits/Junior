import { RECIPES, type CraftingRecipe } from '../data/recipes';
import type { ItemId } from '../types';
import type { ActionResult } from './farming';
import { Inventory, ITEM_NAMES, MAX_ITEM_COUNT } from './inventory';
import {individualTool,inventoryToolCondition,wearInventoryTool} from './tool-instances';

export const UNIQUE_CRAFT_ITEMS: readonly ItemId[] = ['sword'];

function missingRequirement(recipe: CraftingRecipe, inventory: Inventory, nearWorkbench: boolean, progress?:{recipes:string[]}): string | undefined {
  if(recipe.unlock&&!progress?.recipes.includes(recipe.unlock))return 'Aprenda esta receita com os moradores da vila.';
  if (UNIQUE_CRAFT_ITEMS.some((item) => (recipe.output[item] ?? 0) > 0 && inventory.has(item))) {
    return inventory.has('sword')&&recipe.output.sword?'Você já tem uma espada. Equipe-a pela mochila ou pela barra rápida.':'Você já possui este equipamento.';
  }
  if (recipe.requiresTool && !inventory.has(recipe.requiresTool)) {
    return `Você precisa possuir: ${ITEM_NAMES[recipe.requiresTool]}.`;
  }
  if(recipe.requiresTool&&individualTool(recipe.requiresTool)&&inventoryToolCondition(inventory.data,recipe.requiresTool).durability<=0)return'Repare esta ferramenta antes de fabricar.';
  if (recipe.requiresWorkbench && !nearWorkbench) {
    return 'Aproxime-se de uma bancada de trabalho para fabricar esta receita.';
  }
  return undefined;
}

export function canCraft(recipe: CraftingRecipe, inventory: Inventory, nearWorkbench: boolean,progress?:{recipes:string[]}): boolean {
  if (missingRequirement(recipe, inventory, nearWorkbench,progress) || !inventory.canAfford(recipe.cost)) return false;
  return Object.entries(recipe.output).every(([key, amount]) => {
    const item = key as ItemId;
    const finalAmount = inventory.data[item] - (recipe.cost[item] ?? 0) + amount!;
    return Number.isSafeInteger(amount) && amount! >= 0 && Number.isSafeInteger(finalAmount)
      && finalAmount >= 0 && finalAmount <= MAX_ITEM_COUNT;
  })&&new Inventory(inventory.data).transact(recipe.cost,recipe.output);
}

export function craft(recipeId: string, inventory: Inventory, nearWorkbench: boolean,progress?:{recipes:string[]}): ActionResult {
  const recipe = RECIPES.find((candidate) => candidate.id === recipeId);
  if (!recipe) return { ok: false, message: 'Esta receita não está disponível.' };
  const requirement = missingRequirement(recipe, inventory, nearWorkbench,progress);
  if (requirement) return { ok: false, message: requirement };
  if (!inventory.transact(recipe.cost, recipe.output)) {
    return { ok: false, message: 'Faltam materiais ou espaço na mochila para esta receita.' };
  }
  if(recipe.requiresTool&&individualTool(recipe.requiresTool))wearInventoryTool(inventory.data,recipe.requiresTool);
  return { ok: true, message: `${recipe.name}: fabricação concluída.` };
}
