import Phaser from 'phaser';

/** One stable canvas and entrance anchor preserve the existing house collision. */
export const HOUSE_SPRITE_SIZE = { width: 256, height: 224 } as const;
export const HOUSE_FOOT = { x: 128, y: 216 } as const;
// Measured in the uploaded 256×256 PNG. All anchors use the same proportional
// fit as the facade, so changing its world position never detaches its lights.
const SOURCE_BOUNDS = { x: 16, y: 16, width: 219, height: 227 } as const;
const DRAW = { x: 26, y: 4, width: 205, height: 212 } as const;
const SOURCE_WINDOWS = [
  { x: 64, y: 143, width: 24, height: 22 },
  { x: 166, y: 143, width: 23, height: 22 },
] as const;
const sourcePoint = (x: number, y: number) => ({
  x: DRAW.x + (x - SOURCE_BOUNDS.x) * DRAW.width / SOURCE_BOUNDS.width,
  y: DRAW.y + (y - SOURCE_BOUNDS.y) * DRAW.height / SOURCE_BOUNDS.height,
});
export const HOUSE_WINDOW_LIGHTS = SOURCE_WINDOWS.map(box => ({
  ...sourcePoint(box.x, box.y),
  width: box.width * DRAW.width / SOURCE_BOUNDS.width,
  height: box.height * DRAW.height / SOURCE_BOUNDS.height,
}));
export const HOUSE_CHIMNEY = sourcePoint(184, 22);
export const HOUSE_SHADOW_FOOT = HOUSE_FOOT.y / HOUSE_SPRITE_SIZE.height;
export const HOUSE_WINDOW_GLOW = 'asset-house-window-glow';
const SOURCE = 'house-cottage-source';

export function preloadHouseSprite(scene: Phaser.Scene): void {
  scene.load.image(SOURCE, 'assets/visual/architecture/authored-cottage.png');
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
  const drawX = Math.round(HOUSE_FOOT.x - width / 2), drawY = HOUSE_FOOT.y - height;
  context.drawImage(scan, left, top, sourceWidth, sourceHeight, drawX, drawY, width, height);
  scene.textures.addCanvas('asset-house', canvas)?.setFilter(Phaser.Textures.FilterMode.NEAREST);
  // Select only the original blue-grey glass pixels inside the two openings.
  // The frame, crossbars, stones and foliage keep their original dark artwork.
  const mask = document.createElement('canvas'); mask.width = scan.width; mask.height = scan.height;
  const maskContext = mask.getContext('2d')!;
  const glowPixels = maskContext.createImageData(mask.width, mask.height);
  for (const box of SOURCE_WINDOWS) for (let y = box.y; y < box.y + box.height; y++) for (let x = box.x; x < box.x + box.width; x++) {
    const at = (y * scan.width + x) * 4;
    const r = image.data[at], g = image.data[at + 1], b = image.data[at + 2];
    if (!image.data[at + 3] || !(b >= g && g > r && b - r >= 3 && b < 70)) continue;
    glowPixels.data[at] = 255; glowPixels.data[at + 1] = 209; glowPixels.data[at + 2] = 138; glowPixels.data[at + 3] = 255;
  }
  maskContext.putImageData(glowPixels, 0, 0);
  const glow = document.createElement('canvas'); glow.width = canvas.width; glow.height = canvas.height;
  const glowContext = glow.getContext('2d')!; glowContext.imageSmoothingEnabled = false;
  glowContext.drawImage(mask, left, top, sourceWidth, sourceHeight, drawX, drawY, width, height);
  scene.textures.addCanvas(HOUSE_WINDOW_GLOW, glow)?.setFilter(Phaser.Textures.FilterMode.NEAREST);
  return true;
}

/** The title and gameplay share the exact same glass mask and world transform. */
export function drawHouseWindowGlow(scene: Phaser.Scene, house: Phaser.GameObjects.Image): Phaser.GameObjects.Image | undefined {
  if (!scene.textures.exists(HOUSE_WINDOW_GLOW)) return undefined;
  return scene.add.image(house.x, house.y, HOUSE_WINDOW_GLOW)
    .setOrigin(house.originX, house.originY).setScale(house.scaleX, house.scaleY)
    .setDepth(house.depth + .1).setVisible(false).setData('house-window-glow', true);
}
