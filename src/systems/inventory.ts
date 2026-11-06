import type { InventoryData, ItemId } from '../types';
import { ITEM_IDS } from '../data/items';
import {individualTool,syncToolInstances,type ToolCopy} from './tool-instances';
export { ITEM_IDS, ITEM_NAMES } from '../data/items';

export type ItemCost = Partial<Record<ItemId,number>>;
export const EMPTY_INVENTORY = Object.fromEntries(ITEM_IDS.map(id => [id, 0])) as unknown as InventoryData;
export const INITIAL_INVENTORY: InventoryData = { ...EMPTY_INVENTORY };
export const INVENTORY_CAPACITY = 30;
export const inventoryCapacity=(data:Partial<InventoryData>):number=>30+10*Math.min(2,data.backpack??0);
export const occupiedInventorySlots = (data: InventoryData): number => ITEM_IDS.reduce((n,id)=>n+(individualTool(id)?data[id]:Number(data[id]>0)),0);
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
    const oldSlots=occupiedInventorySlots(this.data),limit=oldSlots>inventoryCapacity(this.data)&&inventoryCapacity(next)>=inventoryCapacity(this.data)?oldSlots:inventoryCapacity(next);
    if (next.backpack>2 || occupiedInventorySlots(next) > limit) return false;
    if(ITEM_IDS.some(id=>individualTool(id)&&next[id]!==this.data[id]))syncToolInstances(next);
    Object.assign(this.data, next);
    return true;
  }

  takeTool(id:number):ToolCopy|undefined {
    const book=syncToolInstances(this.data),copy=book.items.find(t=>t.id===id);if(!copy)return;
    const next={...this.data,[copy.kind]:this.data[copy.kind]-1,toolInstances:structuredClone(book)};
    next.toolInstances.items=next.toolInstances.items.filter(t=>t.id!==id);if(next.toolInstances.active[copy.kind]===id)delete next.toolInstances.active[copy.kind];syncToolInstances(next);
    Object.assign(this.data,next);return structuredClone(copy);
  }
  receiveTool(copy:ToolCopy):boolean {
    const book=syncToolInstances(this.data);if(book.items.some(t=>t.id===copy.id)||occupiedInventorySlots(this.data)>=inventoryCapacity(this.data))return false;
    const next={...this.data,[copy.kind]:this.data[copy.kind]+1,toolInstances:structuredClone(book)};
    next.toolInstances.items.push(structuredClone(copy));next.toolInstances.nextId=Math.max(book.nextId,copy.id+1);if(!next.toolInstances.active[copy.kind])next.toolInstances.active[copy.kind]=copy.id;Object.assign(this.data,next);return true;
  }
}
