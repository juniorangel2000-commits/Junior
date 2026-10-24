import {SWIMMING_CONFIG} from './config';

/** Clear at the waist, then progressively lost in the water toward the feet. */
export function bodyVisibility(y: number, waist: number, feet: number): number {
  const t = Math.max(0, Math.min(1, (y - waist) / Math.max(1, feet - waist)));
  return SWIMMING_CONFIG.footVisibility + (1 - SWIMMING_CONFIG.footVisibility) * (1 - t * t * (3 - 2 * t));
}

/** Bake the same opacity into body and surface masks, leaving the original PNG untouched. */
export function applyBodyFade(context: CanvasRenderingContext2D, waist: number, feet: number): void {
  const {width, height} = context.canvas, image = context.getImageData(0, 0, width, height);
  for (let y = Math.floor(waist) + 1; y < height; y++) {
    const factor = bodyVisibility(y, waist, feet);
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4 + 3;
      image.data[i] = Math.round(image.data[i] * factor);
    }
  }
  context.putImageData(image, 0, 0);
}

/** A submerged continuation of the supplied hair silhouette, never a reflection of the face. */
export function createHairShadow(source: HTMLCanvasElement, headBottom: number): HTMLCanvasElement {
  const {width, height} = source, scale = width / 192;
  const sourcePixels = source.getContext('2d')!.getImageData(0, 0, width, height).data;
  const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
  const g = canvas.getContext('2d')!, shadow = g.createImageData(width, height);
  const drop = Math.round(SWIMMING_CONFIG.hairShadowDrop * scale);
  const reach = SWIMMING_CONFIG.hairShadowReach * scale;
  let faceLeft = width, faceRight = -1, faceTop = height;
  for (let y = Math.max(0, headBottom - Math.round(28 * scale)); y < headBottom; y++) for (let x = 0; x < width; x++) {
    const i = (y * width + x) * 4, r = sourcePixels[i], green = sourcePixels[i + 1], b = sourcePixels[i + 2];
    if (sourcePixels[i + 3] > 32 && r > 205 && r > green * 1.12 && green > b * 1.12) {
      faceLeft = Math.min(faceLeft, x); faceRight = Math.max(faceRight, x); faceTop = Math.min(faceTop, y);
    }
  }
  for (let y = Math.max(0, headBottom - drop); y < Math.min(height - drop, headBottom + reach); y++) for (let x = 0; x < width; x++) {
    const i = (y * width + x) * 4, r = sourcePixels[i], green = sourcePixels[i + 1], b = sourcePixels[i + 2];
    if (sourcePixels[i + 3] < 32 || r < 25 || r >= 210 || green >= 160 || r < green * 1.12 || green < b * 1.06) continue;
    if (x >= faceLeft - 1 && x <= faceRight + 1 && y >= faceTop - 1) continue;
    const targetY = y + drop, distance = (targetY - headBottom) / reach;
    if (distance < 0 || distance >= 1) continue;
    const target = (targetY * width + x) * 4;
    shadow.data[target] = (SWIMMING_CONFIG.bodyTint >> 16) & 255;
    shadow.data[target + 1] = (SWIMMING_CONFIG.bodyTint >> 8) & 255;
    shadow.data[target + 2] = SWIMMING_CONFIG.bodyTint & 255;
    shadow.data[target + 3] = Math.round(sourcePixels[i + 3] * (1 - distance * distance * (3 - 2 * distance)));
  }
  g.putImageData(shadow, 0, 0); return canvas;
}
