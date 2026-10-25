import authoredProperty from './maps/property.json';
import { TILE, WORLD_WIDTH, WORLD_HEIGHT } from './world-size';
import { buildingFootprint } from '../systems/building';
import type { SaveData, TilePoint } from '../types';
import { isProtectedTerrainTile, type MapEditData, type TerrainKind } from '../systems/map-editor';

/** The door remains on the existing curved path; all three features share its ground. */
export const HOMESTEAD_HOUSE = { x: 24.5 * TILE, y: 16 * TILE + 4, groundY: 16 * TILE - 4 } as const;
export const HOMESTEAD_GARDEN = { left: 12, right: 19, top: 10, bottom: 16 } as const;
export const HOMESTEAD_GATE = { x: 16, y: 16 } as const;
export const HOMESTEAD_REVISION = 1;
const key = (x: number, y: number): string => `${x},${y}`;
const naturalGround = (kind: TerrainKind | undefined): boolean => kind === undefined || ['grass', 'meadow', 'forest', 'moss', 'soil'].includes(kind);

export function homesteadGardenBeds(): TilePoint[] {
  const { left, right, top, bottom } = HOMESTEAD_GARDEN;
  return Array.from({ length: (right - left - 1) * (bottom - top - 1) }, (_, index) => ({
    x: left + 1 + index % (right - left - 1), y: top + 1 + Math.floor(index / (right - left - 1)),
  }));
}

/** Leave the vegetable garden and the doorway free of random resource respawns. */
export function homesteadResourceReserved(x: number, y: number): boolean {
  return x >= 11 && x <= 20 && y >= 9 && y <= 18
    || x >= 23 && x <= 26 && y >= 16 && y <= 19;
}

/** An author upgrade, not a recurring reward: removed fences/beds stay removed.
 * Existing crops, construction, deliberate floor/object edits and inventory win
 * over the new garden. The old empty starter bed returns to its grass floor. */
export function initializeHomestead(state: SaveData): boolean {
  if (state.homesteadRevision === HOMESTEAD_REVISION) return false;
  const occupied = new Set(state.buildings.flatMap(buildingFootprint).map(p => key(p.x, p.y)));
  const crops = new Set(state.crops.map(p => key(p.x, p.y)));
  state.preparedSoil ??= [];
  state.restoredFarmSoil ??= [];
  const prepared = new Set(state.preparedSoil.map(p => key(p.x, p.y)));
  const restored = new Set(state.restoredFarmSoil.map(p => key(p.x, p.y)));
  const map: MapEditData = state.mapEdits ??= { version: 1, width: WORLD_WIDTH, height: WORLD_HEIGHT, terrain: {}, objects: {} };
  const objects = new Set(Object.values(map.objects).filter(o => !o.removed).map(o => key(o.x, o.y)));
  const entities = new Set<string>();
  const protectBody = (x: number, y: number, radiusX: number, radiusY: number): void => {
    for (let ty = Math.floor((y-radiusY)/TILE); ty <= Math.floor((y+radiusY)/TILE); ty++) {
      for (let tx = Math.floor((x-radiusX)/TILE); tx <= Math.floor((x+radiusX)/TILE); tx++) entities.add(key(tx,ty));
    }
  };
  if (state.activeArea !== 'forest' && !state.homePosition) protectBody(state.player.x,state.player.y,7,5);
  for (const animal of state.animalPositions?.property ?? []) protectBody(animal.x,animal.y,9,6);

  for (let y = 20; y <= 24; y++) for (let x = 21; x <= 29; x++) {
    const cell = key(x, y);
    if (crops.has(cell) || occupied.has(cell) || prepared.has(cell) || restored.has(cell)) continue;
    state.restoredFarmSoil.push({ x, y }); restored.add(cell);
    // Only replace the author's old soil paint; custom floors remain untouched.
    const original = (authoredProperty.terrain as Record<string, TerrainKind>)[cell];
    if (original === 'soil' && map.terrain[cell] === original) map.terrain[cell] = 'grass';
  }

  // The ordinary grass renderer supplies the same blades/color as the world,
  // and feathers the outside border. Never repaint an explicit author/player cell.
  for (let y = 9; y <= 17; y++) for (let x = 11; x <= 20; x++) {
    const cell = key(x, y);
    if (map.terrain[cell] === undefined && !occupied.has(cell) && !isProtectedTerrainTile(x,y,undefined,'grass')) map.terrain[cell] = 'grass';
  }
  const { left, right, top, bottom } = HOMESTEAD_GARDEN;
  const gateCell = key(HOMESTEAD_GATE.x,HOMESTEAD_GATE.y);
  for (let y = top; y <= bottom; y++) for (let x = left; x <= right; x++) {
    if (x !== left && x !== right && y !== top && y !== bottom) continue;
    const cell = key(x, y);
    if (occupied.has(cell) || crops.has(cell) || prepared.has(cell) || restored.has(cell) || objects.has(cell) || entities.has(cell) || !naturalGround(map.terrain[cell])) continue;
    state.buildings.push(cell === gateCell
      ? { x, y, kind: 'gate', rotation: 0, gateFlip: true, open: false }
      : { x, y, kind: 'fence', fenceBuiltDay: state.day });
    occupied.add(cell);
  }
  for (const point of homesteadGardenBeds()) {
    const cell = key(point.x, point.y);
    if (prepared.has(cell) || occupied.has(cell) || restored.has(cell) || objects.has(cell) || entities.has(cell) || !naturalGround(map.terrain[cell])) continue;
    state.preparedSoil.push(point); prepared.add(cell);
  }
  state.homesteadRevision = HOMESTEAD_REVISION;
  return true;
}
