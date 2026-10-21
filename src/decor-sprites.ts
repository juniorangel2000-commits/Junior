import type Phaser from 'phaser';

export const DECOR_SPRITES = [
  { id: 'paving-0', width: 36, height: 22 },
  { id: 'paving-1', width: 38, height: 20 },
  { id: 'paving-2', width: 32, height: 20 },
  { id: 'flowers-white', width: 32, height: 28 },
  { id: 'flowers-pink', width: 32, height: 28 },
  { id: 'flowers-yellow', width: 30, height: 26 },
  { id: 'shore-stones', width: 38, height: 22 },
  { id: 'fern', width: 32, height: 30 },
  { id: 'grass-tuft', width: 28, height: 24 },
] as const;

type DecorImage = HTMLCanvasElement | HTMLImageElement;
export interface TerrainDecoration { paving: readonly DecorImage[]; shoreStones?: DecorImage }

/** Trim the original atlas in memory; keep the source PNG intact. */
export function setupDecorSprites(scene: Phaser.Scene): void {
  if (!scene.textures.exists('nature-decor-source')) return;
  const source = scene.textures.get('nature-decor-source').getSourceImage() as HTMLImageElement;
  DECOR_SPRITES.forEach(({ id, width, height }, index) => {
    const key = `asset-${id}`;
    if (scene.textures.exists(key)) return;
    const col = index % 3, row = Math.floor(index / 3);
    const sx = Math.round(col * source.width / 3), sy = Math.round(row * source.height / 3);
    const sw = Math.round((col + 1) * source.width / 3) - sx;
    const sh = Math.round((row + 1) * source.height / 3) - sy;
    const scan = document.createElement('canvas'); scan.width = sw; scan.height = sh;
    const context = scan.getContext('2d', { willReadFrequently: true })!;
    context.imageSmoothingEnabled = false;
    context.drawImage(source, sx, sy, sw, sh, 0, 0, sw, sh);
    const image = context.getImageData(0, 0, sw, sh), pixels = image.data;
    let left = sw, right = -1, top = sh, bottom = -1;
    for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) {
      const i = (y * sw + x) * 4;
      // Remove the soft generation halo and isolated saturated red edge residue.
      const residue = pixels[i] > pixels[i + 1] * 2.5 && pixels[i] > pixels[i + 2] * 2;
      pixels[i + 3] = pixels[i + 3] >= 160 && !residue ? 255 : 0;
      if (!pixels[i + 3]) continue;
      left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y);
    }
    if (right <= left || bottom <= top) return;
    context.putImageData(image, 0, 0);
    const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
    const c = canvas.getContext('2d')!; c.imageSmoothingEnabled = false;
    const w = right - left + 1, h = bottom - top + 1;
    const scale = Math.min((width - 2) / w, (height - 2) / h);
    const dw = Math.max(1, Math.round(w * scale)), dh = Math.max(1, Math.round(h * scale));
    c.drawImage(scan, left, top, w, h, Math.floor((width - dw) / 2), height - dh - 1, dw, dh);
    scene.textures.addCanvas(key, canvas)?.setFilter(0);
  });
}

/** Existing terrain remains the fallback when the local decoration atlas is absent. */
export function readTerrainDecoration(scene: Phaser.Scene): TerrainDecoration | undefined {
  const paving: DecorImage[] = [];
  for (let i = 0; i < 3; i++) {
    const key = `asset-paving-${i}`;
    if (scene.textures.exists(key)) paving.push(scene.textures.get(key).getSourceImage() as DecorImage);
  }
  const shoreStones = scene.textures.exists('asset-shore-stones')
    ? scene.textures.get('asset-shore-stones').getSourceImage() as DecorImage : undefined;
  return paving.length || shoreStones ? { paving, shoreStones } : undefined;
}
