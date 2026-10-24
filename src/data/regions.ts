/** Geometria lógica compartilhada por mundo, interface e salvamento. */
export const TILE = 32;
export const WORLD_WIDTH = 96;
export const WORLD_HEIGHT = 72;

export type RegionId = 'property' | 'pine-forest' | 'open-fields';
export interface RegionDefinition {
  id: RegionId;
  name: string;
  description: string;
  bounds: { x: number; y: number; width: number; height: number };
  destination: { x: number; y: number };
}

export const REGIONS: readonly RegionDefinition[] = [
  { id: 'property', name: 'Minha propriedade', description: 'Casa, horta e o começo de uma nova vida.', bounds: { x: 1, y: 1, width: 49, height: 41 }, destination: { x: 25, y: 18 } },
  { id: 'pine-forest', name: 'Bosque do Pinheiro', description: 'Atravesse a ponte a leste. Recolha fibras, madeira e pedras entre os pinheiros.', bounds: { x: 50, y: 1, width: 45, height: 41 }, destination: { x: 67, y: 18 } },
  { id: 'open-fields', name: 'Campos Abertos', description: 'Siga a trilha ao sul da horta. Clareiras para explorar e construir.', bounds: { x: 1, y: 42, width: 94, height: 29 }, destination: { x: 25, y: 53 } },
] as const;

export function getRegionAt(x: number, y: number): RegionDefinition {
  return y >= 42 ? REGIONS[2] : x >= 50 ? REGIONS[1] : REGIONS[0];
}

export function locationAt(x: number, y: number): string {
  const region = getRegionAt(x, y);
  if (region.id !== 'property') return region.name;
  if (x >= 32 && x <= 42 && y >= 26 && y <= 34) return 'Lago da propriedade';
  return region.name;
}

export function isFarmTile(x: number, y: number): boolean {
  return x >= 21 && x <= 29 && y >= 20 && y <= 24;
}

export function isWaterTile(x: number, y: number): boolean {
  const river = 44 + Math.floor(Math.sin(y * 0.24) * 2);
  const pond = ((x - 36) ** 2) / 33 + ((y - 30) ** 2) / 15 < 1;
  const forestPond = ((x - 80) ** 2) / 30 + ((y - 10) ** 2) / 10 < 1;
  return (x >= river && x <= river + 3) || pond || forestPond;
}

export function isBridgeTile(x: number, y: number): boolean {
  return (x >= 42 && x <= 48 && y >= 18 && y <= 19)
    || (x >= 41 && x <= 49 && y >= 52 && y <= 53);
}

export function isPathTile(x: number, y: number): boolean {
  return (x >= 24 && x <= 26 && y >= 15 && y <= 19)
    || (x >= 15 && x <= 76 && y >= 17 && y <= 18)
    || (x >= 30 && x <= 32 && y >= 18 && y <= 30)
    || (x >= 18 && x <= 20 && y >= 24 && y <= 53)
    || (x >= 18 && x <= 75 && y >= 52 && y <= 54)
    || (x >= 67 && x <= 69 && y >= 17 && y <= 61)
    || (x >= 70 && x <= 72 && y >= 8 && y <= 28);
}

const originalWater = (x: number, y: number) => x >= 44 + Math.floor(Math.sin(y * 0.24) * 2)
  || ((x - 36) ** 2) / 33 + ((y - 30) ** 2) / 15 < 1;
const originalPath = (x: number, y: number) => (x >= 24 && x <= 26 && y >= 15 && y <= 19)
  || (x >= 15 && x <= 42 && y >= 17 && y <= 18)
  || (x >= 30 && x <= 32 && y >= 18 && y <= 30);
const originalBridge = (x: number, y: number) => x >= 42 && x <= 48 && y >= 18 && y <= 19;

/**
 * A primeira versão misturava o RNG do terreno com o das árvores. Reproduzir
 * somente suas chamadas mantém posições e IDs dos saves antigos, mesmo quando
 * o mapa e a decoração crescem. O resultado independe de DOM, Phaser e texturas.
 */
export function createLegacyTrees(): Array<{ x: number; y: number; pine: boolean }> {
  let seed = 85021;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const skip = (calls: number) => { for (let i = 0; i < calls; i++) random(); };
  for (let y = 0; y < 42; y++) for (let x = 0; x < 54; x++) {
    if (originalWater(x, y)) { skip(10); continue; }
    const farm = isFarmTile(x, y), path = originalPath(x, y);
    if (!farm && !path) random();
    if (farm) continue;
    skip(36);
    if (!path && random() > 0.56) skip(2);
    if (!path && random() > 0.93) skip(3);
    if ((originalWater(x + 1, y) || originalWater(x, y + 1) || originalWater(x - 1, y) || originalWater(x, y - 1)) && !originalBridge(x, y)) skip(4);
  }
  const trees: Array<{ x: number; y: number; pine: boolean }> = [];
  for (let y = 1; y < 41; y++) for (let x = 1; x < 53; x++) {
    const wild = x < 12 || x > 39 || y < 8 || y > 35;
    const side = x < 16 && y > 20 && y < 33;
    if ((wild && random() < 0.3 || side && random() < 0.18) && !originalWater(x, y) && !originalPath(x, y) && !originalBridge(x, y)) trees.push({ x, y, pine: random() > 0.65 });
  }
  for (const [x, y] of [[17, 11], [18, 10], [31, 11], [33, 14], [17, 24], [18, 29], [32, 26], [20, 32], [28, 31], [39, 22]]) trees.push({ x, y, pine: false });
  return trees.filter(tree => !(tree.x === 9 && tree.y >= 16 && tree.y <= 20));
}
