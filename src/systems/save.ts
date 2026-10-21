import type { CharacterProfile, ProgressData, SaveData, Tool } from '../types';
import { isFarmTile } from './farming';
import { EMPTY_INVENTORY, INITIAL_INVENTORY, ITEM_IDS, MAX_ITEM_COUNT } from './inventory';
import { RESOURCE_DEFINITIONS } from './resources';
import { buildingFootprint, buildingLayer } from './building';
import { TILE, WORLD_HEIGHT, WORLD_WIDTH } from '../data/regions';
import { Home, HOME_WIDTH, HOME_HEIGHT, validateHome } from './home';

// A chave e a origem do aplicativo permanecem iguais para localizar partidas antigas.
export const SAVE_KEY = 'depois-da-chuva-v1';
export const SAVE_BACKUP_KEY = 'depois-da-chuva-v1-backup';
export const SAVE_VERSION = 2;
const TOOLS: Tool[] = ['hand', 'plant', 'water', 'fence', 'bench', 'remove', 'hatchet', 'pickaxe', 'workbench', 'wall', 'door', 'floor', 'window', 'roof', 'blueprint'];
const PROGRESS_KEYS: Array<keyof ProgressData> = ['collected', 'craftedTools', 'harvested', 'processed', 'builtWorkbench', 'sawn', 'builtShelter'];
const emptyProgress = (): ProgressData => ({ collected: false, craftedTools: false, harvested: false, processed: false, builtWorkbench: false, sawn: false, builtShelter: false });
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const integer = (value: unknown, min: number, max: number): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= min && value <= max;
const finite = (value: unknown, min: number, max: number): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
const color = (value: unknown): value is string => typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);
const MAX_BUILDINGS = (WORLD_WIDTH - 2) * (WORLD_HEIGHT - 2) * 3;
const MAX_RESOURCES = WORLD_WIDTH * WORLD_HEIGHT;

export function validateProfile(value: unknown): value is CharacterProfile {
  return isRecord(value) && typeof value.name === 'string' && value.name.trim().length > 0 && value.name.length <= 24
    && color(value.skin) && color(value.hairColor) && color(value.outfit)
    && ['curto', 'longo', 'preso'].includes(value.hairStyle as string)
    && (value.shirtColor === undefined || color(value.shirtColor))
    && (value.accessory === undefined || value.accessory === 'bolsa' || value.accessory === 'nenhum');
}

export function validateSave(value: unknown): value is SaveData {
  if (!isRecord(value) || value.version !== SAVE_VERSION || !validateProfile(value.profile)) return false;
  if (!isRecord(value.player) || !finite(value.player.x, TILE / 2, WORLD_WIDTH * TILE - TILE / 2)
    || !finite(value.player.y, TILE / 2, WORLD_HEIGHT * TILE - TILE / 2)) return false;
  if (value.player.direction !== undefined && !['down', 'left', 'right', 'up'].includes(value.player.direction as string)) return false;
  if (value.home !== undefined && !validateHome(value.home)) return false;
  if (value.homePosition !== undefined) {
    if (!isRecord(value.homePosition) || !finite(value.homePosition.x, TILE, (HOME_WIDTH - 1) * TILE - 1)
      || !finite(value.homePosition.y, TILE * 2, HOME_HEIGHT * TILE)) return false;
    if (value.homePosition.direction !== undefined && !['down', 'left', 'right', 'up'].includes(value.homePosition.direction as string)) return false;
    const home = new Home(value.home as SaveData['home']);
    if ([[-7, -5], [7, -5], [-7, 3], [7, 3]].some(([ox, oy]) => home.isBlocked(
      Math.floor(((value.homePosition as Record<string, number>).x + ox) / TILE),
      Math.floor(((value.homePosition as Record<string, number>).y + oy) / TILE)))) return false;
  }
  if (!isRecord(value.inventory) || !ITEM_IDS.every(id => integer((value.inventory as Record<string, unknown>)[id], 0, MAX_ITEM_COUNT))) return false;
  if (Object.keys(value.inventory).some(id => !ITEM_IDS.includes(id as typeof ITEM_IDS[number]))) return false;
  if (!TOOLS.includes(value.equippedTool as Tool)) return false;
  if ((value.equippedTool === 'hatchet' || value.equippedTool === 'pickaxe') && (value.inventory[value.equippedTool] as number) < 1) return false;
  if (!isRecord(value.progress) || !PROGRESS_KEYS.every(key => typeof (value.progress as Record<string, unknown>)[key] === 'boolean')) return false;
  if (!integer(value.day, 1, 999_999) || !finite(value.time, 0, 1439.999999) || typeof value.metLia !== 'boolean') return false;
  if (!Array.isArray(value.crops) || value.crops.length > 45 || !Array.isArray(value.buildings) || value.buildings.length > MAX_BUILDINGS) return false;
  const occupied = new Set<string>();
  for (const crop of value.crops) {
    if (!isRecord(crop) || !integer(crop.x, 21, 29) || !integer(crop.y, 20, 24) || !isFarmTile(crop.x, crop.y)
      || !finite(crop.growth, 0, 1) || typeof crop.watered !== 'boolean' || (!crop.watered && crop.growth > 0)) return false;
    const key = String(crop.x) + ',' + String(crop.y);
    if (occupied.has(key)) return false;
    occupied.add(key);
  }
  for (const building of value.buildings) {
    if (!isRecord(building) || !integer(building.x, 1, WORLD_WIDTH - 2) || !integer(building.y, 1, WORLD_HEIGHT - 2)
      || !['fence', 'bench', 'workbench', 'wall', 'door', 'floor', 'window', 'roof'].includes(building.kind as string) || isFarmTile(building.x, building.y)) return false;
    if (building.open !== undefined && (building.kind !== 'door' || typeof building.open !== 'boolean')) return false;
    if (building.rotation !== undefined && (building.kind !== 'roof' || ![0, 1].includes(building.rotation as number))) return false;
    const piece = building as unknown as SaveData['buildings'][number];
    for (const tile of buildingFootprint(piece)) {
      if (!integer(tile.x, 1, WORLD_WIDTH - 2) || !integer(tile.y, 1, WORLD_HEIGHT - 2) || isFarmTile(tile.x, tile.y)) return false;
      const key = buildingLayer(piece.kind) + ':' + String(tile.x) + ',' + String(tile.y);
      if (occupied.has(key)) return false;
      occupied.add(key);
    }
  }
  if (!Array.isArray(value.depletedResources) || value.depletedResources.length > MAX_RESOURCES
    || !value.depletedResources.every(id => typeof id === 'string' && id.length > 0 && id.length <= 80)
    || new Set(value.depletedResources).size !== value.depletedResources.length) return false;
  if (!Array.isArray(value.resourceProgress) || value.resourceProgress.length > MAX_RESOURCES) return false;
  const progressing = new Set<string>();
  for (const resource of value.resourceProgress) {
    if (!isRecord(resource) || typeof resource.id !== 'string' || resource.id.length > 80 || progressing.has(resource.id)
      || value.depletedResources.includes(resource.id)) return false;
    const match = /^(standingTree|vein)-(\d+)-(\d+)$/.exec(resource.id);
    if (!match || !integer(Number(match[2]), 1, WORLD_WIDTH - 2) || !integer(Number(match[3]), 1, WORLD_HEIGHT - 2)) return false;
    const definition = RESOURCE_DEFINITIONS[match[1] as 'standingTree' | 'vein'];
    if (!integer(resource.hits, 1, definition.hits - 1)) return false;
    progressing.add(resource.id);
  }
  return true;
}

/** Converte em memória; a leitura nunca modifica nem substitui o slot original. */
export function migrateSave(value: unknown): SaveData | null {
  if (validateSave(value)) return structuredClone(value);
  if (!isRecord(value) || value.version !== 1 || !isRecord(value.inventory)) return null;
  const legacyItems = ['wood', 'stone', 'seeds', 'turnip'] as const;
  if (!legacyItems.every(id => integer((value.inventory as Record<string, unknown>)[id], 0, MAX_ITEM_COUNT))) return null;
  if (!Array.isArray(value.buildings) || value.buildings.some(building => !isRecord(building) || !['fence', 'bench'].includes(building.kind as string))) return null;
  const migrated = {
    ...value,
    version: SAVE_VERSION,
    inventory: { ...EMPTY_INVENTORY, ...Object.fromEntries(legacyItems.map(id => [id, (value.inventory as Record<string, unknown>)[id]])) },
    resourceProgress: [], equippedTool: 'hand',
    progress: { ...emptyProgress(), collected: Array.isArray(value.depletedResources) && value.depletedResources.length > 0 },
  };
  return validateSave(migrated) ? structuredClone(migrated) : null;
}

export function createNewSave(profile: CharacterProfile): SaveData {
  return {
    version: SAVE_VERSION,
    profile: { ...profile, name: profile.name.trim() },
    player: { x: 25 * TILE + TILE / 2, y: 18 * TILE + TILE / 2 },
    inventory: { ...INITIAL_INVENTORY },
    crops: [], buildings: [], depletedResources: [], resourceProgress: [], equippedTool: 'hand', progress: emptyProgress(),
    day: 1, time: 8 * 60, metLia: false,
  };
}

export function loadSave(): SaveData | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? migrateSave(JSON.parse(raw)) : null;
  } catch { return null; }
}

export function hasSave(): boolean { return loadSave() !== null; }

export function saveGame(data: SaveData): boolean {
  try {
    if (!validateSave(data)) return false;
    const previous = localStorage.getItem(SAVE_KEY);
    if (previous) {
      let version: unknown;
      try { version = (JSON.parse(previous) as { version?: unknown })?.version; } catch { version = undefined; }
      // Uma versão anterior do aplicativo nunca substitui uma partida mais nova.
      if (typeof version === 'number' && version > SAVE_VERSION) return false;
      // Se o backup falhar, não substitua a partida antiga.
      if (version !== SAVE_VERSION && !localStorage.getItem(SAVE_BACKUP_KEY)) localStorage.setItem(SAVE_BACKUP_KEY, previous);
    }
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    return true;
  } catch { return false; }
}

export function clearSave(): boolean {
  try { localStorage.removeItem(SAVE_KEY); return true; } catch { return false; }
}
