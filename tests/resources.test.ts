import { describe, expect, it } from 'vitest';
import type { ResourceNode } from '../src/types';
import { Inventory, MAX_ITEM_COUNT } from '../src/systems/inventory';
import { RESOURCE_DEFINITIONS, Resources } from '../src/systems/resources';

const tree: ResourceNode = { id: 'standingTree-4-8', kind: 'standingTree', x: 4, y: 8 };
const vein: ResourceNode = { id: 'vein-3-9', kind: 'vein', x: 3, y: 9 };

describe('recursos', () => {
  it.each(['tree', 'stone', 'seeds', 'scrap', 'fiber'] as const)('coleta %s à mão uma única vez', (kind) => {
    const inventory = new Inventory({});
    const resources = new Resources();
    const node: ResourceNode = { id: `${kind}-1-2`, kind, x: 1, y: 2 };
    expect(resources.hit(node, 'hand', inventory)).toMatchObject({ ok: true, depleted: true });
    for (const [item, amount] of Object.entries(RESOURCE_DEFINITIONS[kind].drops)) {
      expect(inventory.data[item as keyof typeof inventory.data]).toBe(amount);
    }
    const before = { ...inventory.data };
    expect(resources.hit(node, 'hand', inventory).ok).toBe(false);
    expect(inventory.data).toEqual(before);
    expect(resources.progress).toEqual([]);
  });

  it('recusa ferramenta errada ou não possuída sem causar dano nem dar materiais', () => {
    const inventory = new Inventory({ pickaxe: 1 });
    const resources = new Resources();
    expect(resources.hit(tree, 'hand', inventory).ok).toBe(false);
    expect(resources.hit(tree, 'pickaxe', inventory).ok).toBe(false);
    expect(resources.hit(tree, 'hatchet', inventory).ok).toBe(false);
    expect(resources.hit(vein, 'water', inventory).ok).toBe(false);
    expect(resources.progress).toEqual([]);
    expect(inventory.data.log).toBe(0);
    expect(inventory.data.stone).toBe(0);
  });

  it('exige todos os golpes e entrega os drops da árvore apenas no último', () => {
    const inventory = new Inventory({ hatchet: 1 });
    const resources = new Resources();
    expect(resources.hit(tree, 'hatchet', inventory)).toMatchObject({ ok: true });
    expect(resources.progress).toEqual([{ id: tree.id, hits: 1 }]);
    expect(resources.hit(tree, 'hatchet', inventory).depleted).toBeUndefined();
    expect(inventory.data.log).toBe(0);
    expect(resources.hit(tree, 'hatchet', inventory).depleted).toBeUndefined();
    expect(resources.hit(tree, 'hatchet', inventory).depleted).toBe(true);
    expect(inventory.data.log).toBe(2);
    expect(inventory.data.branch).toBe(3);
    expect(resources.progress).toEqual([]);
    expect(resources.hit(tree, 'hatchet', inventory).ok).toBe(false);
    expect(inventory.data.log).toBe(2);
    expect(inventory.data.branch).toBe(3);
    expect(inventory.data.hatchet).toBe(1);
  });

  it('mantém golpes parciais serializáveis sem mudar os dados recebidos do save', () => {
    const saved = [{ id: tree.id, hits: 1 }];
    const inventory = new Inventory({ hatchet: 1 });
    const first = new Resources(saved);
    expect(first.hit(tree, 'hatchet', inventory).ok).toBe(true);
    expect(saved).toEqual([{ id: tree.id, hits: 1 }]);
    const restored = new Resources(JSON.parse(JSON.stringify(first.progress)));
    expect(restored.hit(tree, 'hatchet', inventory).depleted).toBeUndefined();
    expect(restored.hit(tree, 'hatchet', inventory).depleted).toBe(true);
    expect(inventory.data.log).toBe(2);
    expect(inventory.data.branch).toBe(3);
    expect(restored.progress).toEqual([]);
  });

  it('preserva o último golpe e todos os drops quando um dos materiais não cabe', () => {
    const inventory = new Inventory({ hatchet: 1, branch: MAX_ITEM_COUNT });
    const resources = new Resources([{ id: tree.id, hits: 3 }]);
    const before = { ...inventory.data };
    expect(resources.hit(tree, 'hatchet', inventory).ok).toBe(false);
    expect(inventory.data).toEqual(before);
    expect(resources.progress).toEqual([{ id: tree.id, hits: 3 }]);
    expect(inventory.spend({ branch: 3 })).toBe(true);
    expect(resources.hit(tree, 'hatchet', inventory).depleted).toBe(true);
    expect(inventory.data.log).toBe(2);
    expect(inventory.data.branch).toBe(MAX_ITEM_COUNT);
    expect(resources.hit(tree, 'hatchet', inventory).ok).toBe(false);
    expect(inventory.data.log).toBe(2);
  });

  it('extrai apenas quatro pedras no quinto golpe da rocha, sem conceder sucata', () => {
    const inventory = new Inventory({ pickaxe: 1 });
    const resources = new Resources();
    for (let i = 0; i < 4; i++) {
      expect(resources.hit(vein, 'pickaxe', inventory).depleted).toBeUndefined();
      expect(inventory.data.stone).toBe(0);
    }
    expect(resources.hit(vein, 'pickaxe', inventory).depleted).toBe(true);
    expect(inventory.data.stone).toBe(4);
    expect(inventory.data.scrap).toBe(0);
  });

  it('não perde nem entrega parcialmente uma coleta manual se a mochila estiver cheia', () => {
    const inventory = new Inventory({ branch: MAX_ITEM_COUNT });
    const resources = new Resources();
    const node: ResourceNode = { id: 'tree-7-7', kind: 'tree', x: 7, y: 7 };
    expect(resources.hit(node, 'hand', inventory).ok).toBe(false);
    expect(inventory.data.wood).toBe(0);
    expect(resources.progress).toEqual([]);
    inventory.spend({ branch: 3 });
    expect(resources.hit(node, 'hand', inventory).depleted).toBe(true);
    expect(inventory.data.wood).toBe(4);
    expect(inventory.data.branch).toBe(MAX_ITEM_COUNT);
  });

  it('permite recolher material manual com uma ferramenta que o jogador possui', () => {
    const inventory = new Inventory({ hatchet: 1 });
    const node: ResourceNode = { id: 'seeds-2-2', kind: 'seeds', x: 2, y: 2 };
    expect(new Resources().hit(node, 'hatchet', inventory).depleted).toBe(true);
    expect(inventory.data.seeds).toBe(3);
  });
});
