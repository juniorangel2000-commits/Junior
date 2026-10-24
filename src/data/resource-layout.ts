import type { BuildingData, ResourceKind, ResourceNode } from '../types';
import { getRegionAt, isBridgeTile, isFarmTile, isPathTile, isWaterTile, TILE, WORLD_HEIGHT, WORLD_WIDTH } from './regions';
import { isWaterPoint, roadDistanceAt } from './terrain-shape';

interface Bounds { left: number; right: number; top: number; bottom: number }
export interface ResourceLayoutContext {
  isStaticBlocked(x: number, y: number): boolean;
  isTreeTile(x: number, y: number): boolean;
  buildings: readonly BuildingData[];
}

// Include a small safety margin around each complete sprite, not just its feet.
const DIMENSIONS: Record<ResourceKind, readonly [number, number]> = {
  fallenLog: [68,68], stump:[38,38], stone: [32,24], vein: [48, 54], seeds: [36, 36], fiber: [32, 38],
  tree: [36, 24], scrap: [30, 28], standingTree: [104, 132],
};
const key = (x: number, y: number): string => `${x},${y}`;
function bounds(node: ResourceNode): Bounds {
  const [width, height] = DIMENSIONS[node.kind];
  return { left: node.x * TILE + 16 - width / 2 - 2, right: node.x * TILE + 16 + width / 2 + 2,
    top: node.y * TILE + 29 - height - 2, bottom: node.y * TILE + 31 };
}
function overlaps(a: Bounds, b: Bounds): boolean {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

/**
 * IDs remain tied to the old spawn, while coordinates may move to a nearby verge.
 * Call with the complete candidate list, before applying save depletion: removing
 * an earlier resource must not change the layout of any resource loaded later.
 */
export function placeLooseResources(nodes: readonly ResourceNode[], context: ResourceLayoutContext): ResourceNode[] {
  const buildingCells = new Set<string>();
  for (const building of context.buildings) {
    for (let i = 0; i < (building.kind === 'roof' ? 3 : 1); i++) {
      buildingCells.add(key(building.x + (building.kind === 'roof' && !building.rotation ? i : 0),
        building.y + (building.kind === 'roof' && building.rotation ? i : 0)));
    }
  }
  const originalCells = new Map(nodes.map(node => [key(node.x, node.y), node.id]));
  const placed: ResourceNode[] = [], pending: ResourceNode[] = [], footprints: Bounds[] = [];

  const available = (node: ResourceNode, original: ResourceNode): boolean => {
    if (getRegionAt(node.x, node.y).id !== getRegionAt(original.x, original.y).id
      || node.x < 2 || node.y < 2 || node.x >= WORLD_WIDTH - 2 || node.y >= WORLD_HEIGHT - 2) return false;
    const reserved = originalCells.get(key(node.x, node.y));
    if (reserved && reserved !== node.id) return false;
    const box = bounds(node);
    for (let ty = Math.floor(box.top / TILE); ty <= Math.floor((box.bottom - 0.01) / TILE); ty++) {
      for (let tx = Math.floor(box.left / TILE); tx <= Math.floor((box.right - 0.01) / TILE); tx++) {
        if (isPathTile(tx, ty) || isBridgeTile(tx, ty) || isFarmTile(tx, ty) || isWaterTile(tx, ty)
          || context.isStaticBlocked(tx, ty) || context.isTreeTile(tx, ty) || buildingCells.has(key(tx, ty))
          || tx === 29 && ty === 17) return false;
      }
    }
    for (const x of [box.left, (box.left + box.right) / 2, box.right]) {
      for (const y of [box.top, (box.top + box.bottom) / 2, box.bottom]) {
        if (isWaterPoint(x, y) || roadDistanceAt(x, y) < 8) return false;
      }
    }
    return footprints.every(other => !overlaps(box, other));
  };
  const add = (node: ResourceNode): void => { placed.push(node); footprints.push(bounds(node)); };

  // Keep already suitable points first, so a relocated node never displaces one.
  for (const node of nodes) {
    if (available(node, node)) add({ ...node });
    else pending.push(node);
  }
  for (const original of pending) {
    let destination: ResourceNode | undefined;
    // Concentric neighborhoods with deterministic distance ordering for ties.
    for (let radius = 1; radius < Math.max(WORLD_WIDTH, WORLD_HEIGHT) && !destination; radius++) {
      const ring: Array<{ x: number; y: number; distance: number }> = [];
      for (let dy = -radius; dy <= radius; dy++) for (let dx = -radius; dx <= radius; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== radius) continue;
        ring.push({ x: original.x + dx, y: original.y + dy, distance: dx * dx + dy * dy });
      }
      ring.sort((a, b) => a.distance - b.distance || a.y - b.y || a.x - b.x);
      for (const point of ring) {
        const candidate = { ...original, x: point.x, y: point.y };
        if (available(candidate, original)) { destination = candidate; break; }
      }
    }
    // A completely built-over region can have no safe art footprint left. Keep
    // its ID un-depleted; it becomes available after clearing space and loading.
    if (destination) add(destination);
  }
  const byId = new Map(placed.map(node => [node.id, node]));
  return nodes.flatMap(node => { const placedNode = byId.get(node.id); return placedNode ? [placedNode] : []; });
}
