import type { CharacterDirection } from '../character-directions';
import type { SaveData } from '../types';
import { activeToolCopy, syncToolInstances } from './tool-instances';

export type GatherTool = 'shovel' | 'sickle' | 'hatchet';

export interface GatherAction<T extends GatherTool> {
  tool: T;
  direction: CharacterDirection;
  copyId: number;
  tier: number;
}

/** Pin the physical tool so another copy cannot pay for a pending swing. */
export function readyGatherCopy(state: SaveData, tool: GatherTool) {
  if (!state.inventory[tool]) return;
  syncToolInstances(state.inventory, state.economy6?.tools);
  const copy = activeToolCopy(state.inventory, tool);
  if (copy && copy.condition.durability > 0) return { copyId: copy.id, tier: copy.condition.tier };
}

export function gatherCopyStillReady(state: SaveData, action: GatherAction<GatherTool>): boolean {
  const copy = activeToolCopy(state.inventory, action.tool);
  return Boolean(state.inventory[action.tool] && copy && copy.id === action.copyId && copy.condition.durability > 0);
}
