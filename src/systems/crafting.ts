import { RECIPES, type CraftingRecipe } from '../data/recipes';
import type { ItemId } from '../types';
import type { ActionResult } from './farming';
import { Inventory, ITEM_NAMES, MAX_ITEM_COUNT } from './inventory';

const UNIQUE_TOOLS: ItemId[] = ['hatchet', 'pickaxe', 'hoe', 'hammer', 'handsaw'];

function missingRequirement(recipe: CraftingRecipe, inventory: Inventory, nearWorkbench: boolean): string | undefined {
  if (UNIQUE_TOOLS.some((item) => (recipe.output[item] ?? 0) > 0 && inventory.has(item))) {
    return 'Você já tem esta ferramenta. Ela não se desgasta com o uso.';
  }
  if (recipe.requiresTool && !inventory.has(recipe.requiresTool)) {
    return `Você precisa possuir: ${ITEM_NAMES[recipe.requiresTool]}.`;
  }
  if (recipe.requiresWorkbench && !nearWorkbench) {
    return 'Aproxime-se de uma bancada de trabalho para fabricar esta receita.';
  }
  return undefined;
}

export function canCraft(recipe: CraftingRecipe, inventory: Inventory, nearWorkbench: boolean): boolean {
  if (missingRequirement(recipe, inventory, nearWorkbench) || !inventory.canAfford(recipe.cost)) return false;
  return Object.entries(recipe.output).every(([key, amount]) => {
    const item = key as ItemId;
    const finalAmount = inventory.data[item] - (recipe.cost[item] ?? 0) + amount!;
    return Number.isSafeInteger(amount) && amount! >= 0 && Number.isSafeInteger(finalAmount)
      && finalAmount >= 0 && finalAmount <= MAX_ITEM_COUNT;
  });
}

export function craft(recipeId: string, inventory: Inventory, nearWorkbench: boolean): ActionResult {
  const recipe = RECIPES.find((candidate) => candidate.id === recipeId);
  if (!recipe) return { ok: false, message: 'Esta receita não está disponível.' };
  const requirement = missingRequirement(recipe, inventory, nearWorkbench);
  if (requirement) return { ok: false, message: requirement };
  if (!inventory.transact(recipe.cost, recipe.output)) {
    return { ok: false, message: 'Faltam materiais ou espaço na mochila para esta receita.' };
  }
  return { ok: true, message: `${recipe.name}: fabricação concluída.` };
}
