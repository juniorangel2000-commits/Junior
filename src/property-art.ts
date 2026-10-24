import type Phaser from 'phaser';
import type { BuildingData, ResourceNode } from './types';
import { isBridgeTile, isFarmTile, isPathTile, isWaterTile, TILE } from './data/regions';
import { isWaterPoint, roadDistanceAt } from './data/terrain-shape';

export interface PropertyArtContext {
  isBlocked(x: number, y: number): boolean;
  resourceAt(x: number, y: number): ResourceNode | undefined;
  buildings?: readonly BuildingData[];
  textureKey?:string;
  placeStone?(x:number,y:number):void;
}

type Detail = 'fern' | 'flowers-white' | 'flowers-pink' | 'flowers-yellow' | 'grass-tuft' | 'shore-stones';

const LEFT = 5 * TILE;
const TOP = 7 * TILE;
const WIDTH = 51 * TILE;
const HEIGHT = 39 * TILE;


// Decoration has its own stable noise, independent of resource generation.
function noise(x: number, y: number, salt = 0): number {
  let seed = (Math.imul(x + 97, 374761393) ^ Math.imul(y + 53, 668265263) ^ Math.imul(salt + 1, 1442695041)) >>> 0;
  seed = Math.imul(seed ^ (seed >>> 13), 1274126177) >>> 0;
  return ((seed ^ (seed >>> 16)) >>> 0) / 4294967296;
}

/**
 * Low planting and rain-darkened details, baked once beneath actors and floors.
 * No collision, resource, crop or save state is created or changed here.
 */
export function decorateProperty(scene: Phaser.Scene, context: PropertyArtContext): void {
  const TEXTURE=context.textureKey??'property-ground-details';
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const c = canvas.getContext('2d')!;
  c.imageSmoothingEnabled = false;

  const occupied = new Set<string>();
  for (const building of context.buildings ?? []) {
    const length = building.kind === 'roof' ? 3 : 1;
    for (let i = 0; i < length; i++) occupied.add(`${building.x + (building.kind === 'roof' && !building.rotation ? i : 0)},${building.y + (building.kind === 'roof' && building.rotation ? i : 0)}`);
  }

  const sources = new Map<Detail, HTMLCanvasElement | HTMLImageElement>();
  for (const detail of ['fern', 'flowers-white', 'flowers-pink', 'flowers-yellow', 'grass-tuft', 'shore-stones'] as const) {
    const key = `asset-${detail}`;
    if (scene.textures.exists(key)) sources.set(detail, scene.textures.get(key).getSourceImage() as HTMLCanvasElement | HTMLImageElement);
  }

  const rect = (color: string, x: number, y: number, width: number, height: number): void => {
    c.fillStyle = color;
    c.fillRect(Math.round(x - LEFT), Math.round(y - TOP), width, height);
  };

  const safe = (x: number, y: number, width: number, height: number): boolean => {
    if (x - width / 2 < LEFT || x + width / 2 >= LEFT + WIDTH || y - height < TOP || y >= TOP + HEIGHT) return false;
    for (let ty = Math.floor((y - height) / TILE); ty <= Math.floor((y - 1) / TILE); ty++) {
      for (let tx = Math.floor((x - width / 2) / TILE); tx <= Math.floor((x + width / 2 - 1) / TILE); tx++) {
        if (isFarmTile(tx, ty) || isPathTile(tx, ty) || isWaterTile(tx, ty) || isBridgeTile(tx, ty)
          || context.isBlocked(tx, ty) || context.resourceAt(tx, ty) || occupied.has(`${tx},${ty}`)
          || tx === 29 && ty === 17) return false;
      }
    }
    // Painted curves can extend past the old logical path/water tile edge.
    // Keep complete decorative silhouettes off those surfaces as well.
    for (const px of [x - width / 2, x, x + width / 2]) {
      for (const py of [y - height, y - height / 2, y]) {
        if (isWaterPoint(px, py) || roadDistanceAt(px, py) < 5) return false;
      }
    }
    return true;
  };

  const fallback = (detail: Detail, x: number, y: number, variant: number): void => {
    if (detail === 'shore-stones') {
      rect('#405c4a33', x - 11, y - 2, 23, 3);
      for (const [dx, dy, width] of [[-10, -5, 7], [-1, -8, 10], [7, -4, 6]]) {
        rect('#7d8571', x + dx, y + dy, width, 4);
        rect('#bdbea0', x + dx + 1, y + dy - 1, width - 2, 2);
      }
      return;
    }
    const flowers = detail.startsWith('flowers');
    const fern = detail === 'fern';
    const color = detail === 'flowers-pink' ? '#d9a0ac' : detail === 'flowers-yellow' ? '#e3bd5c' : '#efdfad';
    const stems = fern ? 7 : flowers ? 8 : 5;
    for (let i = 0; i < stems; i++) {
      const dx = Math.round((noise(i, variant, 3) - 0.5) * (fern ? 24 : 22));
      const height = (fern ? 9 : 5) + Math.floor(noise(i, variant, 7) * (fern ? 12 : 9));
      rect('#45653c', x + dx, y - height, 1, height);
      rect(i % 2 ? '#7f9c4e' : '#a2b66a', x + dx - 1, y - height, 1, Math.max(3, height - 3));
      if (fern) {
        for (let leaf = 3; leaf < height - 2; leaf += 4) {
          rect('#577e40', x + dx - 4, y - leaf, 4, 2);
          rect('#92ad57', x + dx + 1, y - leaf - 2, 4, 2);
        }
      } else if (flowers && i % 3 !== 0) {
        rect('#7c8546', x + dx - 2, y - height - 1, 5, 4);
        rect(color, x + dx - 2, y - height - 2, 4, 2);
        rect(color, x + dx - 1, y - height, 3, 2);
        rect('#e9be64', x + dx, y - height - 1, 1, 1);
      }
    }
  };

  const stamp = (detail: Detail, tx: number, ty: number, variant = 0, scale = 1): void => {
    const dimensions: Record<Detail, [number, number]> = {
      fern: [30, 28], 'flowers-white': [28, 23], 'flowers-pink': [28, 23],
      'flowers-yellow': [28, 23],
      'grass-tuft': [24, 20], 'shore-stones': [30, 18],
    };
    const [naturalWidth, naturalHeight] = dimensions[detail];
    const image = sources.get(detail);
    const width = Math.round(naturalWidth * scale);
    const height = image?.width ? Math.round(width * image.height / image.width) : Math.round(naturalHeight * scale);
    const x = Math.round(tx * TILE + 16 + (noise(tx, ty, variant + 13) - 0.5) * 3);
    const y = Math.round(ty * TILE + 29);
    if (!safe(x, y, width, height)) return;
    if(detail==='shore-stones'&&context.placeStone){context.placeStone(tx,ty);return;}
    if (image) c.drawImage(image, x - width / 2 - LEFT, y - height - TOP, width, height);
    else fallback(detail, x, y, variant);
  };

  const planting = (tx: number, ty: number, radiusX: number, radiusY: number, pink = false): void => {
    for (let y = ty - radiusY; y <= ty + radiusY; y++) for (let x = tx - radiusX; x <= tx + radiusX; x++) {
      const distance = ((x - tx) / (radiusX + 0.5)) ** 2 + ((y - ty) / (radiusY + 0.5)) ** 2;
      if (distance > 1 || noise(x, y, 29) < 0.13) continue;
      const detail: Detail = (x + y) % 4 === 0 ? 'fern' : pink && (x + y) % 3 !== 0 ? 'flowers-pink'
        : noise(x, y, 101) > 0.8 ? 'flowers-yellow' : 'flowers-white';
      stamp(detail, x, y, x + y);
      // Tiny low leaves connect individual plants without filling the usable floor.
      const px = x * TILE + 16, py = y * TILE + 28;
      if (safe(px, py, 26, 7)) {
        for (let leaf = 0; leaf < 3; leaf++) {
          const lx = px - 12 + Math.floor(noise(x, y, leaf + 71) * 24);
          rect(leaf % 2 ? '#7b9b4c' : '#547c3e', lx, py - leaf * 2, 3, 2);
        }
      }
    }
  };

  // Beds beside the facade, the kitchen garden and the western ruins. Paths,
  // all 45 farm cells and collectible resources are explicitly protected.
  planting(19, 15, 1, 2);
  planting(29, 14, 1, 2, true);
  planting(20, 22, 0, 3, true);
  planting(26, 25, 4, 0);
  planting(32, 23, 0, 2, true);
  planting(12, 15, 2, 1);
  planting(7, 20, 1, 2, true);
  planting(16, 29, 1, 2);
  planting(39, 23, 1, 2, true);
  planting(17, 39, 1, 3);

  // Small pockets along the existing paths preserve their open centre. The
  // southern and eastern connections receive fewer details than the property.
  for (let y = 9; y <= 44; y++) for (let x = 7; x <= 54; x++) {
    if (isPathTile(x, y) || isFarmTile(x, y) || isWaterTile(x, y)) continue;
    const besidePath = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => isPathTile(x + dx, y + dy));
    if (!besidePath || noise(x, y, 43) < (x >= 50 || y >= 41 ? 0.72 : 0.61)) continue;
    const detail: Detail = noise(x, y, 37) > 0.65 ? 'flowers-white' : noise(x, y, 41) > 0.5 ? 'flowers-pink' : 'grass-tuft';
    stamp(detail, x, y, x * 3 + y, detail === 'grass-tuft' ? 0.9 : 1);
  }

  // Reeds, ferns and flat stones stitch the river/lake into their grassy banks.
  // Stones are deliberately small and low, unlike mineable rock formations.
  for (let y = 9; y <= 39; y++) for (let x = 29; x <= 49; x++) {
    if (isWaterTile(x, y) || isBridgeTile(x, y) || isPathTile(x, y)) continue;
    const bank = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => isWaterTile(x + dx, y + dy));
    if (!bank) continue;
    const roll = noise(x, y, 57);
    if (roll > 0.77) stamp('shore-stones', x, y, x + y);
    else if (roll > 0.22) stamp(roll > 0.52 ? 'fern' : 'grass-tuft', x, y, x + y);
    if (roll > 0.82 && y >= 25) stamp('flowers-white', x, y, x + y, 0.72);
  }

  if (scene.textures.exists(TEXTURE)) scene.textures.remove(TEXTURE);
  scene.textures.addCanvas(TEXTURE, canvas)?.setFilter(0);
  scene.add.image(LEFT, TOP, TEXTURE).setOrigin(0, 0).setDepth(-40);
}
