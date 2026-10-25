import type { BuildingData } from '../types';

export const FENCE_STAGES = ['new', 'worn', 'damaged', 'ruined'] as const;
export type FenceStage = typeof FENCE_STAGES[number];
export const FENCE_NAMES = ['Nova', 'Desgastada', 'Danificada', 'Arruinada'] as const;
export const FENCE_STAGE_DAYS = 30;

/** Calendar days only: pausing, reloading and visiting another map do not reset aging. */
export function fenceStage(fence: Pick<BuildingData, 'fenceBuiltDay'>, day: number): FenceStage {
  const age = Math.max(0, day - (fence.fenceBuiltDay ?? day));
  return FENCE_STAGES[Math.min(3, Math.floor(age / FENCE_STAGE_DAYS))];
}

/** North=1, east=2, south=4, west=8. Styles never affect connectivity. */
export function fenceConnections(buildings: readonly Pick<BuildingData, 'x' | 'y' | 'kind' | 'rotation'>[], x: number, y: number): number {
  return [[0,-1],[1,0],[0,1],[-1,0]].reduce((mask, [dx,dy], index) =>
    mask | (buildings.some(b => (b.kind === 'fence' || b.kind === 'gate' && (dx ? (b.rotation ?? 0) % 2 === 0 : (b.rotation ?? 0) % 2 === 1)) && b.x === x+dx && b.y === y+dy) ? 1 << index : 0), 0);
}

export function fenceTexture(stage: FenceStage, mask: number): string { return `fence-${stage}-${mask}`; }
