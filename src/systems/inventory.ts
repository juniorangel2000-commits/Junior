import type { InventoryData, ItemId } from '../types';
import { ITEM_IDS } from '../data/items';
export { ITEM_IDS, ITEM_NAMES } from '../data/items';

export type ItemCost = Partial<InventoryData>;
export const EMPTY_INVENTORY = Object.fromEntries(ITEM_IDS.map(id => [id, 0])) as InventoryData;
export const INITIAL_INVENTORY: InventoryData = { ...EMPTY_INVENTORY };
export const MAX_ITEM_COUNT = 999_999;

export class Inventory {
  readonly data: InventoryData;

  constructor(data: Partial<InventoryData> = INITIAL_INVENTORY) {
    this.data = { ...EMPTY_INVENTORY, ...data };
    if (!ITEM_IDS.every(id => Number.isSafeInteger(this.data[id]) && this.data[id] >= 0 && this.data[id] <= MAX_ITEM_COUNT)) {
      throw new RangeError('Estoque inválido.');
    }
  }

  add(item: ItemId, amount = 1): void {
    if (!this.transact({}, { [item]: amount })) {
      throw new RangeError('Quantidade de item inválida.');
    }
  }

  has(item: ItemId, amount = 1): boolean {
    return Number.isSafeInteger(amount) && amount >= 0 && this.data[item] >= amount;
  }

  canAfford(cost: ItemCost): boolean {
    return Object.entries(cost).every(([item, amount]) =>
      ITEM_IDS.includes(item as ItemId) && typeof amount === 'number' && this.has(item as ItemId, amount),
    );
  }

  spend(cost: ItemCost): boolean {
    return this.transact(cost, {});
  }

  /** Confirma custos e todas as entregas antes de modificar qualquer contador. */
  transact(cost: ItemCost, gain: ItemCost): boolean {
    const valid = (values: ItemCost) => Object.entries(values).every(([id, amount]) =>
      ITEM_IDS.includes(id as ItemId) && Number.isSafeInteger(amount) && amount! >= 0);
    if (!valid(cost) || !valid(gain) || !this.canAfford(cost)) return false;
    const next = { ...this.data };
    for (const id of ITEM_IDS) {
      const value = next[id] - (cost[id] ?? 0) + (gain[id] ?? 0);
      if (!Number.isSafeInteger(value) || value < 0 || value > MAX_ITEM_COUNT) return false;
      next[id] = value;
    }
    Object.assign(this.data, next);
    return true;
  }
}
