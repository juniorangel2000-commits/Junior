import type { BuildingData, TilePoint } from '../types';
import { buildingFootprint } from './building';
import { WORLD_HEIGHT, WORLD_WIDTH } from '../data/regions';

export const SHELTER_MAX_TILES = 64;

export interface ShelterInfo {
  sheltered: boolean;
  tiles: TilePoint[];
  reason: string;
}

const key = (x: number, y: number): string => `${x},${y}`;
const notSheltered = (reason: string): ShelterInfo => ({ sheltered: false, tiles: [], reason });

/** Piso e cobertura são camadas independentes; somente estruturas fechadas selam o recinto. */
export function detectShelter(point: TilePoint, buildings: BuildingData[], width = WORLD_WIDTH, height = WORLD_HEIGHT): ShelterInfo {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 3 || height < 3
    || !Number.isInteger(point.x) || !Number.isInteger(point.y)
    || point.x <= 0 || point.y <= 0 || point.x >= width - 1 || point.y >= height - 1) {
    return notSheltered('Procure um espaço dentro do mapa para montar seu abrigo.');
  }

  const barriers = new Map<string, BuildingData>();
  const openDoors = new Set<string>();
  const floors = new Set<string>();
  const roofs = new Set<string>();
  for (const building of buildings) {
    if (building.kind === 'floor') floors.add(key(building.x, building.y));
    if (building.kind === 'roof') {
      for (const tile of buildingFootprint(building)) roofs.add(key(tile.x, tile.y));
    }
    if (building.kind === 'wall' || building.kind === 'window' || (building.kind === 'door' && !building.open)) {
      barriers.set(key(building.x, building.y), building);
    } else if (building.kind === 'door') {
      openDoors.add(key(building.x, building.y));
    }
  }
  const startKey = key(point.x, point.y);
  if (barriers.has(startKey)) return notSheltered('Entre no recinto para verificar seu abrigo.');
  if (openDoors.has(startKey)) return notSheltered('Feche a porta para completar o abrigo.');

  const queue: TilePoint[] = [{ ...point }];
  const visited = new Set<string>([startKey]);
  let hasDoor = false;
  for (let index = 0; index < queue.length; index++) {
    const current = queue[index];
    for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
      const x = current.x + dx;
      const y = current.y + dy;
      const tileKey = key(x, y);
      if (openDoors.has(tileKey)) return notSheltered('Feche a porta para completar o abrigo.');
      const barrier = barriers.get(tileKey);
      if (barrier) {
        if (barrier.kind === 'door') hasDoor = true;
        continue;
      }
      if (x <= 0 || y <= 0 || x >= width - 1 || y >= height - 1) {
        return notSheltered('O espaço está aberto. Feche as paredes e a porta do abrigo.');
      }
      if (visited.has(tileKey)) continue;
      visited.add(tileKey);
      if (visited.size > SHELTER_MAX_TILES) {
        return notSheltered(`O abrigo precisa ter no máximo ${SHELTER_MAX_TILES} espaços internos e ficar totalmente fechado.`);
      }
      queue.push({ x, y });
    }
  }

  if (!hasDoor) return notSheltered('O recinto precisa de pelo menos uma porta fechada para ser um abrigo.');
  if (queue.some((tile) => !floors.has(key(tile.x, tile.y)))) {
    return notSheltered('Complete o piso de todos os espaços internos do abrigo.');
  }
  if (queue.some((tile) => !roofs.has(key(tile.x, tile.y)))) {
    return notSheltered('Complete a cobertura de todos os espaços internos do abrigo.');
  }
  return { sheltered: true, tiles: queue, reason: 'Abrigo fechado. Um teto simples protege este pequeno lar.' };
}
