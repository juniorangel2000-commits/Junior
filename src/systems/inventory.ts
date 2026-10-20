import type { InventoryData, ItemId } from '../types';

export type ItemCost = Partial<InventoryData>;
export const INITIAL_INVENTORY: InventoryData = { wood: 12, stone: 6, seeds: 8, turnip: 0 };
export const ITEM_NAMES: Record<ItemId, string> = {
  wood: 'Madeira', stone: 'Pedra', seeds: 'Sementes', turnip: 'Nabos',
};
export const MAX_ITEM_COUNT = 999_999;
const ITEMS: ItemId[] = ['wood', 'stone', 'seeds', 'turnip'];

export class Inventory {
  readonly data: InventoryData;

  constructor(data: InventoryData = INITIAL_INVENTORY) {
    this.data = { ...data };
  }

  add(item: ItemId, amount = 1): void {
    if (!Number.isSafeInteger(amount) || amount < 0 || this.data[item] + amount > MAX_ITEM_COUNT) {
      throw new RangeError('Quantidade de item inválida.');
    }
    this.data[item] += amount;
  }

  has(item: ItemId, amount = 1): boolean {
    return Number.isSafeInteger(amount) && amount >= 0 && this.data[item] >= amount;
  }

  canAfford(cost: ItemCost): boolean {
    return Object.entries(cost).every(([item, amount]) =>
      ITEMS.includes(item as ItemId) && typeof amount === 'number' && this.has(item as ItemId, amount),
    );
  }

  spend(cost: ItemCost): boolean {
    if (!this.canAfford(cost)) return false;
    for (const [item, amount] of Object.entries(cost)) this.data[item as ItemId] -= amount!;
    return true;
  }
}
