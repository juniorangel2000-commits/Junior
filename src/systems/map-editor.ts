import { isBridgeTile, isFarmTile, WORLD_HEIGHT, WORLD_WIDTH } from '../data/regions';

export const MAP_EDIT_VERSION = 1;
export const MAP_DRAFT_KEY = 'after-rain-map-editor-draft-v1';
export const MAP_TERRAIN_KINDS = ['grass', 'path', 'water', 'sand', 'soil'] as const;
export const MAP_OBJECT_KINDS = ['standingTree', 'pine', 'stone', 'vein', 'tree', 'fiber', 'seeds', 'scrap'] as const;
export type TerrainKind = typeof MAP_TERRAIN_KINDS[number];
export type EditorObjectKind = typeof MAP_OBJECT_KINDS[number];

/** The record key is the stable resource ID; moving an object never changes it. */
export interface MapObjectEdit {
  x: number;
  y: number;
  /** Present only for resources created in the editor. */
  kind?: EditorObjectKind;
  removed?: boolean;
}

/** Missing terrain/object entries retain the original map and its resource IDs. */
export interface MapEditData {
  version: 1;
  width: typeof WORLD_WIDTH;
  height: typeof WORLD_HEIGHT;
  terrain: Record<string, TerrainKind>;
  objects: Record<string, MapObjectEdit>;
}

const MAX_CELLS = WORLD_WIDTH * WORLD_HEIGHT;
const MAX_JSON_LENGTH = 2_000_000;
const HISTORY_LIMIT = 80;
const KIND_PATTERN = '(standingTree|pine|stone|vein|tree|fiber|seeds|scrap)';
const EDITOR_ID = new RegExp(`^editor-${KIND_PATTERN}-[a-zA-Z0-9][a-zA-Z0-9_-]{0,47}$`);
const ORIGINAL_ID = /^(standingTree|stone|vein|tree|fiber|seeds|scrap)-([1-9]\d*)-([1-9]\d*)$/;
const TILE_KEY = /^([1-9]\d*),([1-9]\d*)$/;
const own = (value: object, key: string): boolean => Object.prototype.hasOwnProperty.call(value, key);
const validCell = (x: unknown, y: unknown): boolean => typeof x === 'number' && Number.isSafeInteger(x)
  && typeof y === 'number' && Number.isSafeInteger(y)
  && x >= 1 && x < WORLD_WIDTH - 1 && y >= 1 && y < WORLD_HEIGHT - 1;

/** Keep fixed gameplay entrances and landmarks intact while editing their surroundings. */
export function isProtectedMapTile(x: number, y: number): boolean {
  if (!validCell(x, y)) return true;
  const houseAndPorch = x >= 20 && x <= 28 && y >= 9 && y <= 17;
  const arrival = x >= 24 && x <= 26 && y >= 18 && y <= 19;
  const westernRuin = x >= 8 && x <= 11 && y >= 15 && y <= 18;
  const forestRuin = x >= 78 && x <= 83 && y >= 25 && y <= 28;
  return houseAndPorch || arrival || isFarmTile(x, y) || isBridgeTile(x, y)
    || (x === 29 && y === 17) || westernRuin || forestRuin
    || ((x === 31 || x === 32) && y === 59);
}

/** Data objects only: reject custom prototypes, accessors, symbols and hidden properties. */
function plainRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return false;
  const keys = Reflect.ownKeys(value);
  if (keys.some(key => typeof key !== 'string' || key === '__proto__' || key === 'constructor' || key === 'prototype')) return false;
  return keys.every(key => {
    const descriptor = Object.getOwnPropertyDescriptor(value, key)!;
    return descriptor.enumerable && 'value' in descriptor;
  });
}

function keysAre(value: Record<string, unknown>, allowed: readonly string[]): boolean {
  return Object.keys(value).every(key => allowed.includes(key));
}

/** Resolve either a legacy stable ID or one issued by the editor. */
export function editorObjectKind(id: string): EditorObjectKind | null {
  if (typeof id !== 'string' || id.length > 80) return null;
  const added = EDITOR_ID.exec(id);
  if (added) return added[1] as EditorObjectKind;
  const original = ORIGINAL_ID.exec(id);
  return original && validCell(Number(original[2]), Number(original[3])) ? original[1] as EditorObjectKind : null;
}

export function emptyMapEdits(): MapEditData {
  return { version: MAP_EDIT_VERSION, width: WORLD_WIDTH, height: WORLD_HEIGHT, terrain: {}, objects: {} };
}

/** Imported files are never allowed to mutate game data before all entries are checked. */
export function validateMapEdits(value: unknown): value is MapEditData {
  try {
    if (!plainRecord(value) || !keysAre(value, ['version', 'width', 'height', 'terrain', 'objects'])
      || value.version !== MAP_EDIT_VERSION || value.width !== WORLD_WIDTH || value.height !== WORLD_HEIGHT
      || !plainRecord(value.terrain) || !plainRecord(value.objects)) return false;
    if (Object.keys(value.terrain).length > MAX_CELLS || Object.keys(value.objects).length > MAX_CELLS) return false;
    for (const [key, terrain] of Object.entries(value.terrain)) {
      const match = TILE_KEY.exec(key);
      if (!match || isProtectedMapTile(Number(match[1]), Number(match[2]))
        || !MAP_TERRAIN_KINDS.includes(terrain as TerrainKind)) return false;
    }
    const occupied = new Set<string>();
    for (const [id, object] of Object.entries(value.objects)) {
      const kind = editorObjectKind(id);
      if (!kind || !plainRecord(object) || !keysAre(object, ['x', 'y', 'kind', 'removed'])
        || !validCell(object.x, object.y) || isProtectedMapTile(object.x as number, object.y as number)
        || (own(object, 'removed') && typeof object.removed !== 'boolean')) return false;
      if (id.startsWith('editor-') ? object.kind !== kind : own(object, 'kind')) return false;
      if (!object.removed) {
        const tile = `${object.x},${object.y}`;
        if (occupied.has(tile) || value.terrain[tile] === 'water') return false;
        occupied.add(tile);
      }
    }
    return true;
  } catch { return false; }
}

/** Canonical order makes equivalent imports equal and avoids redundant undo entries. */
export function cloneMapEdits(data: MapEditData): MapEditData {
  if (!validateMapEdits(data)) throw new TypeError('Mapa do editor inválido.');
  const clone = emptyMapEdits();
  for (const key of Object.keys(data.terrain).sort()) clone.terrain[key] = data.terrain[key];
  for (const id of Object.keys(data.objects).sort()) {
    const source = data.objects[id], object: MapObjectEdit = { x: source.x, y: source.y };
    if (source.kind !== undefined) object.kind = source.kind;
    if (source.removed) object.removed = true;
    clone.objects[id] = object;
  }
  return clone;
}

export function parseMapEdits(text: string): MapEditData | null {
  if (typeof text !== 'string' || text.length > MAX_JSON_LENGTH) return null;
  try {
    const value: unknown = JSON.parse(text);
    return validateMapEdits(value) ? cloneMapEdits(value) : null;
  } catch { return null; }
}

let nextObjectId = 0;
export function createEditorObjectId(kind: EditorObjectKind): string {
  if (!MAP_OBJECT_KINDS.includes(kind)) throw new TypeError('Objeto do editor inválido.');
  const suffix = globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${(++nextObjectId).toString(36)}`;
  return `editor-${kind}-${suffix}`;
}

/** Every read is a fresh copy, so tools cannot alter history in place. */
export class MapEditHistory {
  private snapshots: MapEditData[];
  private index = 0;

  constructor(initial: MapEditData = emptyMapEdits()) { this.snapshots = [cloneMapEdits(initial)]; }
  get current(): MapEditData { return cloneMapEdits(this.snapshots[this.index]); }
  get canUndo(): boolean { return this.index > 0; }
  get canRedo(): boolean { return this.index < this.snapshots.length - 1; }

  commit(next: MapEditData): boolean {
    if (!validateMapEdits(next)) return false;
    const snapshot = cloneMapEdits(next);
    if (JSON.stringify(snapshot) === JSON.stringify(this.snapshots[this.index])) return false;
    this.snapshots.splice(this.index + 1);
    this.snapshots.push(snapshot);
    if (this.snapshots.length > HISTORY_LIMIT + 1) this.snapshots.shift();
    this.index = this.snapshots.length - 1;
    return true;
  }

  undo(): MapEditData | null {
    if (!this.canUndo) return null;
    this.index--;
    return this.current;
  }
  redo(): MapEditData | null {
    if (!this.canRedo) return null;
    this.index++;
    return this.current;
  }
  reset(next: MapEditData = emptyMapEdits()): void {
    this.snapshots = [cloneMapEdits(next)];
    this.index = 0;
  }
}

/** A draft is independent from the live save and can be exported if storage is full. */
export function loadMapDraft(storage?: Pick<Storage, 'getItem'>): MapEditData | null {
  try {
    const text = (storage ?? localStorage).getItem(MAP_DRAFT_KEY);
    return text === null ? null : parseMapEdits(text);
  } catch { return null; }
}

export function saveMapDraft(data: MapEditData, storage?: Pick<Storage, 'setItem'>): boolean {
  try {
    if (!validateMapEdits(data)) return false;
    (storage ?? localStorage).setItem(MAP_DRAFT_KEY, JSON.stringify(cloneMapEdits(data)));
    return true;
  } catch { return false; }
}
