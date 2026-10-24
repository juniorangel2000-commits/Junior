import type Phaser from 'phaser';

/** Atlas cells are row-major; dimensions describe art, not collision size. */
export const RESOURCE_SPRITES = [
  { id: 'stone', width: 30, height: 20 },
  { id: 'vein', width: 48, height: 54 },
  { id: 'seeds', width: 36, height: 36 },
  { id: 'fiber', width: 32, height: 38 },
  { id: 'branch', width: 36, height: 24 },
  { id: 'scrap', width: 30, height: 28 },
] as const;

/** Original silhouettes: loose stones stay low; mineable rocks stay anchored. */
export function setupResourceSprites(scene: Phaser.Scene): void {
  if (!scene.textures.exists('resource-atlas-source')) return;
  const source = scene.textures.get('resource-atlas-source').getSourceImage() as HTMLImageElement;
  RESOURCE_SPRITES.forEach(({ id, width, height }, index) => {
    if(['stone','vein','branch','seeds','fiber'].includes(id))return;
    const key = `asset-${id}`;
    if (scene.textures.exists(key)) return;
    const cellWidth = Math.floor(source.width / 3), cellHeight = Math.floor(source.height / 2);
    const scan = document.createElement('canvas');
    scan.width = cellWidth; scan.height = cellHeight;
    const c = scan.getContext('2d', { willReadFrequently: true })!;
    c.imageSmoothingEnabled = false;
    c.drawImage(source, index % 3 * cellWidth, Math.floor(index / 3) * cellHeight, cellWidth, cellHeight, 0, 0, cellWidth, cellHeight);
    const image = c.getImageData(0, 0, cellWidth, cellHeight), pixels = image.data;
    let left = cellWidth, right = -1, top = cellHeight, bottom = -1;
    for (let y = 0; y < cellHeight; y++) for (let x = 0; x < cellWidth; x++) {
      const alpha = (y * cellWidth + x) * 4 + 3;
      // The source includes a soft generation halo. Keep only opaque pixel art.
      pixels[alpha] = pixels[alpha] >= 160 && x > 3 && x < cellWidth - 4 ? 255 : 0;
      if (!pixels[alpha]) continue;
      left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y);
    }
    if (right <= left || bottom <= top) return;
    c.putImageData(image, 0, 0);
    const canvas = document.createElement('canvas');
    canvas.width = width; canvas.height = height;
    const context = canvas.getContext('2d')!; context.imageSmoothingEnabled = false;
    const w = right - left + 1, h = bottom - top + 1;
    const scale = Math.min((width - 4) / w, (height - 3) / h);
    const dw = Math.max(1, Math.round(w * scale)), dh = Math.max(1, Math.round(h * scale));
    context.drawImage(scan, left, top, w, h, Math.floor((width - dw) / 2), height - dh - 1, dw, dh);
    scene.textures.addCanvas(key, canvas)?.setFilter(0);
  });
}
