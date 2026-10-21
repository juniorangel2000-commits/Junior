import type { SaveData } from '../types';
import type { Inventory } from './inventory';
export const HOME_SUPPLIES = [
  { id: 'wateringCan' as const, x: 4, y: 7, texture: 'icon-water', label: 'Recolher regador' },
  { id: 'seedPacket' as const, x: 7, y: 7, texture: 'icon-seeds', label: 'Recolher pacote de 7 sementes' },
];
export function collectHomeSupply(state: SaveData, inventory: Inventory, id: 'wateringCan' | 'seedPacket'): boolean {
  if (state.homeSupplies?.[id]) return false;
  if (id === 'seedPacket' && !inventory.transact({}, { seeds: 7 })) return false;
  state.homeSupplies = { wateringCan: false, seedPacket: false, ...state.homeSupplies, [id]: true };
  return true;
}
