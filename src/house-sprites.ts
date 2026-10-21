import Phaser from 'phaser';

/** One stable canvas and entrance anchor preserve the existing house collision. */
export const HOUSE_SPRITE_SIZE = { width: 256, height: 224 } as const;
export const HOUSE_FOOT = { x: 128, y: 216 } as const;
export const HOUSE_WINDOW_LIGHTS = [
  { x: 54, y: 162, width: 19, height: 19 },
  { x: 185, y: 162, width: 19, height: 19 },
] as const;
const SOURCE = 'house-cottage-source';

export function preloadHouseSprite(scene: Phaser.Scene): void {
  scene.load.image(SOURCE, 'assets/visual/architecture/starter-cottage.png');
}

/** Keep the source intact. Trim transparency and scale proportionally at load,
 * with a crisp alpha edge and one foot pivot rather than stretching the facade. */
export function setupHouseSprite(scene: Phaser.Scene): boolean {
  if (scene.textures.exists('asset-house')) return true;
  if (!scene.textures.exists(SOURCE)) return false;
  const source = scene.textures.get(SOURCE).getSourceImage() as HTMLImageElement | HTMLCanvasElement;
  if (!source.width || !source.height) return false;
  const scan = document.createElement('canvas');
  scan.width = source.width; scan.height = source.height;
  const scanContext = scan.getContext('2d', { willReadFrequently: true })!;
  scanContext.imageSmoothingEnabled = false;
  scanContext.drawImage(source, 0, 0);
  const image = scanContext.getImageData(0, 0, scan.width, scan.height);
  let left = scan.width, top = scan.height, right = -1, bottom = -1;
  for (let y = 0; y < scan.height; y++) for (let x = 0; x < scan.width; x++) {
    const alpha = (y * scan.width + x) * 4 + 3;
    // Generation can leave a subpixel fringe; the runtime has a hard pixel edge.
    image.data[alpha] = image.data[alpha] >= 160 ? 255 : 0;
    if (!image.data[alpha]) continue;
    left = Math.min(left, x); right = Math.max(right, x);
    top = Math.min(top, y); bottom = Math.max(bottom, y);
  }
  if (right <= left || bottom <= top) return false;
  scanContext.putImageData(image, 0, 0);
  const sourceWidth = right - left + 1, sourceHeight = bottom - top + 1;
  const scale = Math.min(248 / sourceWidth, 212 / sourceHeight);
  const width = Math.round(sourceWidth * scale), height = Math.round(sourceHeight * scale);
  const canvas = document.createElement('canvas');
  canvas.width = HOUSE_SPRITE_SIZE.width; canvas.height = HOUSE_SPRITE_SIZE.height;
  const context = canvas.getContext('2d')!;
  context.imageSmoothingEnabled = false;
  context.drawImage(scan, left, top, sourceWidth, sourceHeight,
    Math.round(HOUSE_FOOT.x - width / 2), HOUSE_FOOT.y - height, width, height);
  scene.textures.addCanvas('asset-house', canvas)?.setFilter(Phaser.Textures.FilterMode.NEAREST);
  return true;
}
