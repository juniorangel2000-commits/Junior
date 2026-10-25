import type { TilePoint } from '../types';
import type { ActionResult } from './farming';

export const HOME_WIDTH = 12;
export const HOME_HEIGHT = 10;
export const HOME_TILE = 32;
export const HOME_EXIT: Readonly<TilePoint> = { x: 5, y: 9 };
export const HOME_SPAWN: Readonly<TilePoint> = { x: 5.5 * HOME_TILE, y: 8.5 * HOME_TILE };
export const HOME_ENTRANCE_WORLD: Readonly<TilePoint> = { x: 24.5 * HOME_TILE, y: 16.5 * HOME_TILE };
export const HOME_OUTDOOR_SPAWN = { x: HOME_ENTRANCE_WORLD.x, y: HOME_ENTRANCE_WORLD.y + 18 } as const;
export const HOME_OUTDOOR_DOORWAY = { ...HOME_ENTRANCE_WORLD, halfWidth: 18, depth: 16, direction: 'up' } as const;
export const HOME_INTERIOR_DOORWAY = { x: 6 * HOME_TILE, y: 9 * HOME_TILE, halfWidth: HOME_TILE, depth: HOME_TILE, direction: 'down' } as const;

export type FurnitureKind = 'bed' | 'table' | 'chair' | 'shelf' | 'rug' | 'plant';
export type FloorStyle = 'oak' | 'dark' | 'stone';
export type WallStyle = 'cream' | 'sage' | 'clay';
export interface HomeFurniture extends TilePoint { id: string; kind: FurnitureKind }
export interface HomeData { floor: FloorStyle; wall: WallStyle; furniture: HomeFurniture[] }
export type HomeEditAction = { type: 'place'; kind: FurnitureKind; x: number; y: number }
  | { type: 'move'; id: string; x: number; y: number }
  | { type: 'remove'; id: string }
  | { type: 'style'; floor: FloorStyle; wall: WallStyle };

export const FLOOR_STYLES: Record<FloorStyle, { name: string; color: string }> = {
  oak: { name: 'Madeira clara', color: '#a88251' },
  dark: { name: 'Madeira escura', color: '#715342' },
  stone: { name: 'Pedra recuperada', color: '#8b8b7c' },
};
export const WALL_STYLES: Record<WallStyle, { name: string; color: string }> = {
  cream: { name: 'Reboco creme', color: '#d5c5a0' },
  sage: { name: 'Verde sálvia', color: '#a7b49a' },
  clay: { name: 'Argila suave', color: '#bf9982' },
};
export const FURNITURE_CATALOG: Record<FurnitureKind, {
  name: string; width: number; height: number; blocking: boolean; limit: number;
}> = {
  bed: { name: 'Cama', width: 2, height: 2, blocking: true, limit: 2 },
  table: { name: 'Mesa', width: 2, height: 2, blocking: true, limit: 2 },
  chair: { name: 'Cadeira', width: 1, height: 1, blocking: true, limit: 6 },
  shelf: { name: 'Estante', width: 2, height: 1, blocking: true, limit: 3 },
  rug: { name: 'Tapete', width: 3, height: 2, blocking: false, limit: 2 },
  plant: { name: 'Vaso de planta', width: 1, height: 1, blocking: true, limit: 6 },
};
export const FURNITURE_KINDS = Object.keys(FURNITURE_CATALOG) as FurnitureKind[];

export function createDefaultHome(): HomeData {
  return {
    floor: 'oak', wall: 'cream',
    furniture: [
      { id: 'home-bed-1', kind: 'bed', x: 2, y: 2 },
      { id: 'home-shelf-2', kind: 'shelf', x: 8, y: 2 },
      { id: 'home-table-3', kind: 'table', x: 7, y: 4 },
      { id: 'home-chair-4', kind: 'chair', x: 6, y: 4 },
      { id: 'home-rug-5', kind: 'rug', x: 4, y: 5 },
      { id: 'home-plant-6', kind: 'plant', x: 2, y: 6 },
    ],
  };
}

export function furnitureFootprint(piece: Pick<HomeFurniture, 'kind' | 'x' | 'y'>): TilePoint[] {
  const definition = FURNITURE_CATALOG[piece.kind];
  return Array.from({ length: definition.width * definition.height }, (_, index) => ({
    x: piece.x + index % definition.width, y: piece.y + Math.floor(index / definition.width),
  }));
}

export const isHomeFloor = (x: number, y: number): boolean => Number.isInteger(x) && Number.isInteger(y)
  && ((x >= 1 && x <= HOME_WIDTH - 2 && y >= 2 && y <= HOME_HEIGHT - 2)
    || ((x === 5 || x === 6) && y === HOME_HEIGHT - 1));

const reservedEntrance = (tile: TilePoint): boolean => (tile.x === 5 || tile.x === 6) && tile.y >= 8;
const key = (tile: TilePoint): string => `${tile.x},${tile.y}`;
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);

function reachableTiles(data: HomeData): Set<string> {
  const blocked = new Set(data.furniture.filter(piece => FURNITURE_CATALOG[piece.kind].blocking).flatMap(furnitureFootprint).map(key));
  const reached = new Set<string>();
  const queue: TilePoint[] = [{ ...HOME_EXIT }];
  for (let index = 0; index < queue.length; index++) {
    const tile = queue[index];
    if (!isHomeFloor(tile.x, tile.y) || blocked.has(key(tile)) || reached.has(key(tile))) continue;
    reached.add(key(tile));
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) queue.push({ x: tile.x + dx, y: tile.y + dy });
  }
  return reached;
}

/** Saves and editing share the same geometry and access validation. */
export function validateHome(value: unknown): value is HomeData {
  if (!isRecord(value) || typeof value.floor !== 'string' || !Object.hasOwn(FLOOR_STYLES, value.floor)
    || typeof value.wall !== 'string' || !Object.hasOwn(WALL_STYLES, value.wall)
    || !Array.isArray(value.furniture) || value.furniture.length < 1 || value.furniture.length > 21) return false;
  const ids = new Set<string>(), solid = new Set<string>(), ground = new Set<string>();
  const counts = new Map<FurnitureKind, number>();
  for (const piece of value.furniture) {
    if (!isRecord(piece) || typeof piece.id !== 'string' || !/^home-(bed|table|chair|shelf|rug|plant)-\d{1,6}$/.test(piece.id)
      || ids.has(piece.id) || typeof piece.kind !== 'string' || !FURNITURE_KINDS.includes(piece.kind as FurnitureKind)
      || !Number.isInteger(piece.x) || !Number.isInteger(piece.y)) return false;
    const furniture = piece as unknown as HomeFurniture;
    const definition = FURNITURE_CATALOG[furniture.kind];
    const count = (counts.get(furniture.kind) ?? 0) + 1;
    if (count > definition.limit) return false;
    counts.set(furniture.kind, count);
    const layer = definition.blocking ? solid : ground;
    for (const tile of furnitureFootprint(furniture)) {
      if (!isHomeFloor(tile.x, tile.y) || reservedEntrance(tile) || layer.has(key(tile))) return false;
      layer.add(key(tile));
    }
    ids.add(furniture.id);
  }
  if (!counts.get('bed')) return false;
  const data = value as unknown as HomeData;
  const reached = reachableTiles(data);
  for (let y = 2; y <= HOME_HEIGHT - 2; y++) for (let x = 1; x <= HOME_WIDTH - 2; x++) {
    if (!solid.has(key({ x, y })) && !reached.has(key({ x, y }))) return false;
  }
  // Every solid piece remains usable from the entrance; furniture cannot seal
  // the bed or strand a corner of the furnished room behind an accidental wall.
  return data.furniture.filter(piece => FURNITURE_CATALOG[piece.kind].blocking).every(piece =>
    furnitureFootprint(piece).some(tile => [[1, 0], [-1, 0], [0, 1], [0, -1]]
      .some(([dx, dy]) => reached.has(key({ x: tile.x + dx, y: tile.y + dy })))));
}

export class Home {
  readonly data: HomeData;

  constructor(data: HomeData = createDefaultHome()) {
    this.data = structuredClone(validateHome(data) ? data : createDefaultHome());
  }

  at(x: number, y: number): HomeFurniture | undefined {
    return [...this.data.furniture].sort((a, b) => Number(FURNITURE_CATALOG[b.kind].blocking) - Number(FURNITURE_CATALOG[a.kind].blocking))
      .find(piece => furnitureFootprint(piece).some(tile => tile.x === x && tile.y === y));
  }

  isBlocked(x: number, y: number): boolean {
    return !isHomeFloor(x, y) || this.data.furniture.some(piece => FURNITURE_CATALOG[piece.kind].blocking
      && furnitureFootprint(piece).some(tile => tile.x === x && tile.y === y));
  }

  canReachExit(tile: TilePoint): boolean {
    return reachableTiles(this.data).has(key({ x: Math.floor(tile.x), y: Math.floor(tile.y) }));
  }

  bedNear(tile: TilePoint, radius = 1.6): HomeFurniture | undefined {
    return this.data.furniture.find(piece => piece.kind === 'bed'
      && furnitureFootprint(piece).some(occupied => Math.hypot(occupied.x - tile.x, occupied.y - tile.y) <= radius));
  }

  apply(action: HomeEditAction, playerTile?: TilePoint): ActionResult {
    if (action.type === 'place') return this.place(action.kind, action.x, action.y, playerTile);
    if (action.type === 'move') return this.move(action.id, action.x, action.y, playerTile);
    if (action.type === 'remove') return this.remove(action.id, playerTile);
    return this.setStyle(action.floor, action.wall);
  }

  private commit(candidate: HomeData, message: string, playerTile?: TilePoint): ActionResult {
    if (!validateHome(candidate)) return { ok: false, message: 'Não foi possível: respeite o limite de móveis e mantenha o caminho da porta até a cama livre.' };
    const player = playerTile && { x: Math.floor(playerTile.x), y: Math.floor(playerTile.y) };
    const blocked = new Set(candidate.furniture.filter(piece => FURNITURE_CATALOG[piece.kind].blocking).flatMap(furnitureFootprint).map(key));
    if (player && (!isHomeFloor(player.x, player.y) || blocked.has(key(player)) || !reachableTiles(candidate).has(key(player)))) {
      return { ok: false, message: 'O móvel ocuparia seu espaço ou bloquearia sua saída. Mova o personagem primeiro.' };
    }
    this.data.furniture = candidate.furniture;
    this.data.floor = candidate.floor;
    this.data.wall = candidate.wall;
    return { ok: true, message };
  }

  place(kind: FurnitureKind, x: number, y: number, playerTile?: TilePoint): ActionResult {
    if (!FURNITURE_KINDS.includes(kind)) return { ok: false, message: 'Este móvel não está no acervo da casa.' };
    let number = 1;
    while (this.data.furniture.some(piece => piece.id === `home-${kind}-${number}`)) number++;
    return this.commit({ ...this.data, furniture: [...this.data.furniture, { id: `home-${kind}-${number}`, kind, x, y }] },
      `${FURNITURE_CATALOG[kind].name} colocado.`, playerTile);
  }

  move(id: string, x: number, y: number, playerTile?: TilePoint): ActionResult {
    if (!this.data.furniture.some(piece => piece.id === id)) return { ok: false, message: 'Selecione um móvel da casa.' };
    return this.commit({ ...this.data, furniture: this.data.furniture.map(piece => piece.id === id ? { ...piece, x, y } : { ...piece }) },
      'Móvel reposicionado.', playerTile);
  }

  remove(id: string, playerTile?: TilePoint): ActionResult {
    const furniture = this.data.furniture.find(piece => piece.id === id);
    if (!furniture) return { ok: false, message: 'Selecione um móvel da casa.' };
    if (furniture.kind === 'bed' && this.data.furniture.filter(piece => piece.kind === 'bed').length === 1) {
      return { ok: false, message: 'Mantenha ao menos uma cama para descansar. Você pode movê-la.' };
    }
    return this.commit({ ...this.data, furniture: this.data.furniture.filter(piece => piece.id !== id) },
      `${FURNITURE_CATALOG[furniture.kind].name} guardado no acervo da casa.`, playerTile);
  }

  setStyle(floor: FloorStyle, wall: WallStyle): ActionResult {
    return this.commit({ ...this.data, floor, wall }, 'Acabamento da casa atualizado.');
  }
}
