import type { CharacterProfile, SaveData } from '../types';
import { isFarmTile } from './farming';
import { INITIAL_INVENTORY, MAX_ITEM_COUNT } from './inventory';

export const SAVE_KEY = 'depois-da-chuva-v1';
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const integer = (value: unknown, min: number, max: number): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= min && value <= max;
const finite = (value: unknown, min: number, max: number): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
const color = (value: unknown): value is string => typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);

export function validateProfile(value: unknown): value is CharacterProfile {
  return isRecord(value) && typeof value.name === 'string' && value.name.trim().length > 0 && value.name.length <= 24
    && color(value.skin) && color(value.hairColor) && color(value.outfit)
    && ['curto', 'longo', 'preso'].includes(value.hairStyle as string);
}

export function validateSave(value: unknown): value is SaveData {
  if (!isRecord(value) || value.version !== 1 || !validateProfile(value.profile)) return false;
  if (!isRecord(value.player) || !finite(value.player.x, 16, 54 * 32 - 16) || !finite(value.player.y, 16, 42 * 32 - 16)) return false;
  if (!isRecord(value.inventory) || !['wood', 'stone', 'seeds', 'turnip'].every((item) => integer(value.inventory && (value.inventory as Record<string, unknown>)[item], 0, MAX_ITEM_COUNT))) return false;
  if (!integer(value.day, 1, 999_999) || !finite(value.time, 0, 1439.999999) || typeof value.metLia !== 'boolean') return false;
  if (!Array.isArray(value.crops) || value.crops.length > 45 || !Array.isArray(value.buildings) || value.buildings.length > 2106) return false;
  const occupied = new Set<string>();
  for (const crop of value.crops) {
    if (!isRecord(crop) || !integer(crop.x, 21, 29) || !integer(crop.y, 20, 24) || !isFarmTile(crop.x, crop.y)
      || !finite(crop.growth, 0, 1) || typeof crop.watered !== 'boolean' || (!crop.watered && crop.growth > 0)) return false;
    const key = `${crop.x},${crop.y}`;
    if (occupied.has(key)) return false;
    occupied.add(key);
  }
  for (const building of value.buildings) {
    if (!isRecord(building) || !integer(building.x, 1, 52) || !integer(building.y, 1, 40)
      || !['fence', 'bench'].includes(building.kind as string) || isFarmTile(building.x, building.y)) return false;
    const key = `${building.x},${building.y}`;
    if (occupied.has(key)) return false;
    occupied.add(key);
  }
  if (!Array.isArray(value.depletedResources) || value.depletedResources.length > 2000
    || !value.depletedResources.every((id) => typeof id === 'string' && id.length > 0 && id.length <= 80)
    || new Set(value.depletedResources).size !== value.depletedResources.length) return false;
  return true;
}

export function createNewSave(profile: CharacterProfile): SaveData {
  return {
    version: 1,
    profile: { ...profile, name: profile.name.trim() },
    player: { x: 25 * 32 + 16, y: 18 * 32 + 16 },
    inventory: { ...INITIAL_INVENTORY },
    crops: [], buildings: [], depletedResources: [],
    day: 1, time: 8 * 60, metLia: false,
  };
}

export function loadSave(): SaveData | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return validateSave(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function hasSave(): boolean {
  return loadSave() !== null;
}

export function saveGame(data: SaveData): boolean {
  try {
    if (!validateSave(data)) return false;
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function clearSave(): boolean {
  try {
    localStorage.removeItem(SAVE_KEY);
    return true;
  } catch {
    return false;
  }
}
