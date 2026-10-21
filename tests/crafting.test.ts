import { describe, expect, it } from 'vitest';
import { RECIPES } from '../src/data/recipes';
import { Building } from '../src/systems/building';
import { canCraft, craft } from '../src/systems/crafting';
import { Inventory, MAX_ITEM_COUNT } from '../src/systems/inventory';
import { Resources } from '../src/systems/resources';
import type { ResourceNode } from '../src/types';

describe('fabricação', () => {
  it('mantém materiais intactos ao recusar uma receita desconhecida ou incompleta', () => {
    const inventory = new Inventory({ handle: 1, cord: 1 });
    const before = { ...inventory.data };
    expect(craft('desconhecida', inventory, false).ok).toBe(false);
    expect(craft('hatchet', inventory, false).ok).toBe(false);
    expect(inventory.data).toEqual(before);
  });

  it.each([
    { id: 'hatchet', cost: { handle: 1, flakedStone: 1, cord: 1 } },
    { id: 'pickaxe', cost: { handle: 1, flakedStone: 2, cord: 1 } },
    { id: 'hammer', cost: { handle: 1, stone: 1, cord: 1 } },
  ] as const)('consome os componentes exatos de $id e impede fabricar uma segunda ferramenta', ({ id, cost }) => {
    const inventory = new Inventory({ handle: 3, flakedStone: 4, cord: 3, stone: 2 });
    const initial = { ...inventory.data };
    expect(craft(id, inventory, false).ok).toBe(true);
    for (const [key, amount] of Object.entries(cost)) {
      const item = key as keyof typeof inventory.data;
      expect(inventory.data[item]).toBe(initial[item] - amount);
    }
    expect(inventory.data[id]).toBe(1);
    const before = { ...inventory.data };
    expect(craft(id, inventory, false).ok).toBe(false);
    expect(inventory.data).toEqual(before);
  });

  it.each([
    { id: 'cord', input: 'fiber', amount: 3, output: 'cord', yield: 1 },
    { id: 'flaked-stone', input: 'stone', amount: 2, output: 'flakedStone', yield: 1 },
    { id: 'handle', input: 'branch', amount: 1, output: 'handle', yield: 1 },
    { id: 'pegs', input: 'branch', amount: 1, output: 'peg', yield: 4 },
  ] as const)('prepara $id com materiais comuns, sem exigir estação', (recipe) => {
    const inventory = new Inventory({ [recipe.input]: recipe.amount + 1 });
    expect(craft(recipe.id, inventory, false).ok).toBe(true);
    expect(inventory.data[recipe.input]).toBe(1);
    expect(inventory.data[recipe.output]).toBe(recipe.yield);
  });

  it('permite tábuas iniciais com machadinha sem exigir bancada ou serrote', () => {
    const inventory = new Inventory({ log: 2 });
    expect(craft('rough-planks', inventory, false).ok).toBe(false);
    expect(inventory.data.log).toBe(2);
    inventory.add('hatchet');
    expect(craft('rough-planks', inventory, false).ok).toBe(true);
    expect(inventory.data.log).toBe(1);
    expect(inventory.data.plank).toBe(2);
    expect(inventory.data.hatchet).toBe(1);
  });

  it('exige bancada para fabricar o serrote e bancada com serrote para serrar', () => {
    const inventory = new Inventory({ blade: 1, handle: 1, cord: 1, log: 1 });
    const before = { ...inventory.data };
    expect(craft('handsaw', inventory, false).ok).toBe(false);
    expect(craft('sawn-planks', inventory, true).ok).toBe(false);
    expect(inventory.data).toEqual(before);
    expect(craft('handsaw', inventory, true).ok).toBe(true);
    expect(inventory.data.blade).toBe(0);
    expect(inventory.data.handle).toBe(0);
    expect(inventory.data.cord).toBe(0);
    const withSaw = { ...inventory.data };
    expect(craft('sawn-planks', inventory, false).ok).toBe(false);
    expect(inventory.data).toEqual(withSaw);
    expect(craft('sawn-planks', inventory, true).ok).toBe(true);
    expect(inventory.data.log).toBe(0);
    expect(inventory.data.board).toBe(3);
    expect(inventory.data.plank).toBe(0);
    expect(inventory.data.handsaw).toBe(1);
  });

  it('exige bancada para transformar sucata em lâmina, sem cobrar materiais longe dela', () => {
    const inventory = new Inventory({ scrap: 2 });
    expect(craft('blade', inventory, false).ok).toBe(false);
    expect(inventory.data.scrap).toBe(2);
    expect(craft('blade', inventory, true).ok).toBe(true);
    expect(inventory.data.scrap).toBe(1);
    expect(inventory.data.blade).toBe(1);
  });

  it('não duplica serrote nem cobra materiais quando a saída não cabe na mochila', () => {
    const inventory = new Inventory({ log: 1, plank: MAX_ITEM_COUNT - 1, board: MAX_ITEM_COUNT - 1, hatchet: 1, blade: 1, handle: 1, cord: 1, handsaw: 1 });
    const before = { ...inventory.data };
    expect(craft('handsaw', inventory, true).ok).toBe(false);
    expect(craft('rough-planks', inventory, false).ok).toBe(false);
    expect(craft('sawn-planks', inventory, true).ok).toBe(false);
    expect(inventory.data).toEqual(before);
  });

  it('calcula disponibilidade sem modificar o inventário', () => {
    const recipe = RECIPES.find((candidate) => candidate.id === 'sawn-planks')!;
    const inventory = new Inventory({ log: 1, handsaw: 1 });
    const before = { ...inventory.data };
    expect(canCraft(recipe, inventory, false)).toBe(false);
    expect(canCraft(recipe, inventory, true)).toBe(true);
    expect(inventory.data).toEqual(before);
    inventory.add('board', MAX_ITEM_COUNT);
    expect(canCraft(recipe, inventory, true)).toBe(false);
  });

  it('progride da mochila vazia até três ferramentas, bancada, serrote e tábuas regulares', () => {
    const inventory = new Inventory({});
    const resources = new Resources();
    const node = (id: string, kind: ResourceNode['kind']): ResourceNode => ({ id, kind, x: 1, y: 1 });
    expect(resources.hit(node('fallen-1', 'tree'), 'hand', inventory).depleted).toBe(true);
    expect(resources.hit(node('fallen-2', 'tree'), 'hand', inventory).depleted).toBe(true);
    expect(resources.hit(node('stone-1', 'stone'), 'hand', inventory).depleted).toBe(true);
    expect(resources.hit(node('stone-2', 'stone'), 'hand', inventory).depleted).toBe(true);
    expect(resources.hit(node('stone-3', 'stone'), 'hand', inventory).depleted).toBe(true);
    expect(resources.hit(node('fiber-1', 'fiber'), 'hand', inventory).depleted).toBe(true);
    expect(resources.hit(node('fiber-2', 'fiber'), 'hand', inventory).depleted).toBe(true);
    for (let i = 0; i < 3; i++) {
      expect(craft('handle', inventory, false).ok).toBe(true);
      expect(craft('cord', inventory, false).ok).toBe(true);
      expect(craft('flaked-stone', inventory, false).ok).toBe(true);
    }
    expect(craft('hatchet', inventory, false).ok).toBe(true);
    expect(craft('pickaxe', inventory, false).ok).toBe(true);
    expect(craft('hammer', inventory, false).ok).toBe(true);
    expect(craft('pegs', inventory, false).ok).toBe(true);
    const tree = node('standing-1', 'standingTree');
    for (let i = 0; i < 3; i++) expect(resources.hit(tree, 'hatchet', inventory).ok).toBe(true);
    expect(resources.hit(tree, 'hatchet', inventory).depleted).toBe(true);
    expect(craft('rough-planks', inventory, false).ok).toBe(true);
    expect(craft('rough-planks', inventory, false).ok).toBe(true);
    expect(inventory.data.plank).toBe(4);
    const buildings = new Building();
    expect(buildings.place('workbench', 19, 18, inventory, true).ok).toBe(true);
    expect(inventory.data.plank).toBe(0);
    expect(inventory.data.peg).toBe(0);
    const vein = node('vein-1', 'vein');
    for (let i = 0; i < 5; i++) expect(resources.hit(vein, 'pickaxe', inventory).ok).toBe(true);
    expect(inventory.data.scrap).toBe(0);
    expect(resources.hit(node('scrap-1', 'scrap'), 'hand', inventory).depleted).toBe(true);
    expect(craft('blade', inventory, true).ok).toBe(true);
    expect(craft('handle', inventory, false).ok).toBe(true);
    expect(craft('cord', inventory, false).ok).toBe(true);
    expect(craft('handsaw', inventory, true).ok).toBe(true);
    const secondTree = node('standing-2', 'standingTree');
    for (let i = 0; i < 4; i++) expect(resources.hit(secondTree, 'hatchet', inventory).ok).toBe(true);
    expect(craft('sawn-planks', inventory, true).ok).toBe(true);
    expect(inventory.data.board).toBe(3);
    expect(inventory.data.plank).toBe(0);
    expect(inventory.data.log).toBe(1);
  });
});
