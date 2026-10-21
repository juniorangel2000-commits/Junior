import type { Tool } from '../types';
export const QUICK_TOOLS: Tool[] = ['hand', 'plant', 'water', 'fence', 'bench', 'remove', 'hatchet', 'pickaxe', 'workbench', 'wall', 'door', 'floor', 'window', 'roof', 'blueprint'];
export const emptyQuickbar = (): (Tool | null)[] => Array.from({ length: 9 }, () => null);
export function validQuickbar(value: unknown): value is (Tool | null)[] {
  return Array.isArray(value) && value.length === 9 && value.every(tool => tool === null || QUICK_TOOLS.includes(tool));
}
