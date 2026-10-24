import type { InventoryData, ItemId, QuickSlot, Tool } from '../types';
import { ITEM_IDS } from '../data/items';
export const QUICK_TOOLS: Tool[] = ['hand', 'plant', 'water', 'fence', 'bench', 'remove', 'hatchet', 'pickaxe', 'hoe', 'workbench', 'wall', 'door', 'floor', 'window', 'roof', 'blueprint'];
export const emptyQuickbar = (): QuickSlot[] => Array.from({ length: 9 }, () => null);
export function isQuickSlot(value: unknown): value is Exclude<QuickSlot, null> {
  return typeof value === 'string' && (QUICK_TOOLS.includes(value as Tool) || value === 'item:wateringCan'
    || (value.startsWith('item:') && ITEM_IDS.includes(value.slice(5) as ItemId)));
}
export function validQuickbar(value: unknown): value is QuickSlot[] {
  return Array.isArray(value) && value.length === 9 && value.every(tool => tool === null || isQuickSlot(tool));
}
export function quickItem(slot: QuickSlot): ItemId | 'wateringCan' | null {
  return slot?.startsWith('item:') ? slot.slice(5) as ItemId | 'wateringCan' : null;
}
export function quickAction(slot: QuickSlot): Tool {
  const item = quickItem(slot);
  if (!item) return slot as Tool || 'hand';
  return item === 'wateringCan' ? 'water' : item === 'seeds' ? 'plant'
    : item === 'hatchet' || item === 'pickaxe' || item === 'hoe' ? item : 'hand';
}
export function quickQuantity(slot: QuickSlot, inventory: InventoryData, wateringCan: boolean): number | null {
  const item = quickItem(slot);
  return item === 'wateringCan' ? Number(wateringCan) : item ? inventory[item] : null;
}
/** A barra contém referências; atribuir/trocar nunca altera o estoque. */
export function assignQuickSlot(slots: QuickSlot[], index: number, value: unknown): QuickSlot[] {
  if (!Number.isInteger(index) || index < 0 || index >= 9 || (value !== null && !isQuickSlot(value))) return [...slots];
  return slots.map((slot, i) => i === index ? value as QuickSlot : slot);
}
export { INVENTORY_CAPACITY } from './inventory';
export function inventoryEntries(inventory: InventoryData, wateringCan: boolean): Exclude<QuickSlot, null>[] {
  return [...ITEM_IDS.filter(id => inventory[id] > 0).map(id => `item:${id}` as const), ...(wateringCan ? ['item:wateringCan' as const] : [])];
}
