import type { BuildingData, ItemId } from '../types';
import type { ItemCost } from '../systems/inventory';

// Construção livre e projetos consultam a mesma tabela; os valores são ajustáveis aqui.
export const BUILD_COSTS: Record<BuildingData['kind'], ItemCost> = {
  fence: { wood: 2 },
  bench: { wood: 4, stone: 2 },
  workbench: { plank: 4, peg: 4 },
  wall: { plank: 2, peg: 1 },
  door: { plank: 3, peg: 2 },
  window: { plank: 2, peg: 1 },
  floor: { plank: 1 },
  roof: { plank: 2, fiber: 3 },
};

export const BLUEPRINT_LABEL = 'Abrigo 3×3';
export const BLUEPRINT_SHELTER: BuildingData[] = [
  ...Array.from({ length: 9 }, (_, index): BuildingData => ({
    x: index % 3, y: Math.floor(index / 3), kind: 'floor',
  })),
  { x: 0, y: 0, kind: 'wall' }, { x: 1, y: 0, kind: 'window' }, { x: 2, y: 0, kind: 'wall' },
  { x: 0, y: 1, kind: 'wall' }, { x: 2, y: 1, kind: 'wall' },
  { x: 0, y: 2, kind: 'wall' }, { x: 1, y: 2, kind: 'door', open: false }, { x: 2, y: 2, kind: 'wall' },
  { x: 0, y: 0, kind: 'roof', rotation: 0 },
  { x: 0, y: 1, kind: 'roof', rotation: 0 },
  { x: 0, y: 2, kind: 'roof', rotation: 0 },
];

export const BLUEPRINT_COST = BLUEPRINT_SHELTER.reduce<ItemCost>((total, piece) => {
  for (const [item, amount] of Object.entries(BUILD_COSTS[piece.kind])) {
    const id = item as ItemId;
    total[id] = (total[id] ?? 0) + amount!;
  }
  return total;
}, {});
