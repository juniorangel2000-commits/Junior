import type Phaser from 'phaser';

/** Nine row-major ground cells followed by the two wood/stone finish cells. */
export const TERRAIN_MATERIALS = [
  'grass', 'forest', 'meadow', 'path-dry', 'path-wet', 'soil', 'sand', 'moss', 'water',
  'wood', 'paving',
] as const;
export type TerrainMaterial = typeof TERRAIN_MATERIALS[number];
export interface TerrainSprite { size: number; pixels: Uint8ClampedArray }
export type TerrainSprites = Record<TerrainMaterial, TerrainSprite>;
export const TERRAIN_SPRITE_SIZE = 96;

// Art direction for a calm ground plane beneath detailed tree silhouettes.
// Preserve the drawn shapes, while keeping their highlights below canopy light.
const FINISH: Record<TerrainMaterial, { middle: readonly number[]; contrast: number }> = {
  grass: { middle: [92, 133, 51], contrast: 0.46 },
  forest: { middle: [52, 87, 56], contrast: 0.48 },
  meadow: { middle: [125, 150, 62], contrast: 0.44 },
  'path-dry': { middle: [187, 148, 94], contrast: 0.5 },
  'path-wet': { middle: [124, 100, 69], contrast: 0.52 },
  soil: { middle: [105, 72, 45], contrast: 0.58 },
  sand: { middle: [179, 154, 108], contrast: 0.48 },
  moss: { middle: [62, 104, 53], contrast: 0.48 },
  water: { middle: [48, 130, 138], contrast: 0.62 },
  wood: { middle: [153, 111, 65], contrast: 0.7 },
  paving: { middle: [157, 154, 129], contrast: 0.6 },
};

/** Water repeats without reversing its wave direction into a diamond pattern. */
function joinWaterEdges(pixels: Uint8ClampedArray, size: number): void {
  const source = pixels.slice(), band = 10;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const wx = Math.max(0, 1 - (Math.min(x, size - 1 - x) + 0.5) / band) * 0.5;
    const wy = Math.max(0, 1 - (Math.min(y, size - 1 - y) + 0.5) / band) * 0.5;
    if (!wx && !wy) continue;
    const i = (y * size + x) * 4, ix = (y * size + size - 1 - x) * 4;
    const iy = ((size - 1 - y) * size + x) * 4, ixy = ((size - 1 - y) * size + size - 1 - x) * 4;
    for (let channel = 0; channel < 3; channel++) {
      const a = source[i + channel] * (1 - wx) + source[ix + channel] * wx;
      const b = source[iy + channel] * (1 - wx) + source[ixy + channel] * wx;
      pixels[i + channel] = a * (1 - wy) + b * wy;
    }
  }
}

/**
 * A material covers three logical cells. Its pixel density matches the tree
 * atlas; collision cells and crop slots remain 32px independently of the art.
 */
export function setupTerrainSprites(scene: Phaser.Scene): void {
  if (!scene.textures.exists('terrain-materials-source')) return;
  TERRAIN_MATERIALS.forEach((material, index) => {
    const key = `asset-ground-${material}`;
    if (scene.textures.exists(key)) return;
    const finish = index >= 9;
    const sourceKey = finish ? 'terrain-finishes-source' : 'terrain-materials-source';
    if (!scene.textures.exists(sourceKey)) return;
    const source = scene.textures.get(sourceKey).getSourceImage() as HTMLImageElement | HTMLCanvasElement;
    const columns = finish ? 2 : 3, rows = finish ? 1 : 3;
    const cell = finish ? index - 9 : index, col = cell % columns, row = Math.floor(cell / columns);
    // Crop inside each exact cell to exclude the boundary between materials.
    const inset = 0.012;
    const x = (col + inset) * source.width / columns, y = (row + inset) * source.height / rows;
    const w = (1 - inset * 2) * source.width / columns, h = (1 - inset * 2) * source.height / rows;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = TERRAIN_SPRITE_SIZE;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(source, x, y, w, h, 0, 0, canvas.width, canvas.height);
    const image = ctx.getImageData(0, 0, canvas.width, canvas.height), pixels = image.data;
    const mean = [0, 0, 0], count = canvas.width * canvas.height;
    for (let i = 0; i < pixels.length; i += 4) for (let channel = 0; channel < 3; channel++) mean[channel] += pixels[i + channel] / count;
    const style = FINISH[material];
    for (let i = 0; i < pixels.length; i += 4) {
      for (let channel = 0; channel < 3; channel++) pixels[i + channel] = style.middle[channel] + (pixels[i + channel] - mean[channel]) * style.contrast;
      pixels[i + 3] = 255;
    }
    if (material === 'water') joinWaterEdges(pixels, canvas.width);
    ctx.putImageData(image, 0, 0);
    scene.textures.addCanvas(key, canvas)?.setFilter(0);
  });
}

/** Read once while baking the map; no source pixels are read during movement. */
export function readTerrainSprites(scene: Phaser.Scene): TerrainSprites | undefined {
  const sprites = {} as TerrainSprites;
  for (const material of TERRAIN_MATERIALS) {
    const key = `asset-ground-${material}`;
    if (!scene.textures.exists(key)) return undefined;
    const source = scene.textures.get(key).getSourceImage() as HTMLCanvasElement;
    const pixels = source.getContext('2d')!.getImageData(0, 0, source.width, source.height).data;
    sprites[material] = { size: source.width, pixels };
  }
  return sprites;
}
