import { atlasTrimBounds } from './atlas-trim';
import type Phaser from "phaser";
export interface VillagePropAtlas {
  alphaCutoff: number;
  frames: Record<
    string,
    { x: number; y: number; width: number; height: number }
  >;
}
/** Keep original art untouched; remove translucent halos only in the cached
 * game texture. A cutoff of zero preserves the original RGBA for animations. */
export function setupVillagePropAtlas(
  scene: Phaser.Scene,
  key: string,
  sourceKey: string,
  manifest: VillagePropAtlas,
  trim = false,
): void {
  if (scene.textures.exists(key)) return;
  const source = scene.textures
    .get(sourceKey)
    .getSourceImage() as HTMLImageElement;
  const canvas = document.createElement("canvas");
  canvas.width = source.width;
  canvas.height = source.height;
  const c = canvas.getContext("2d")!;
  c.drawImage(source, 0, 0);
  const pixels = manifest.alphaCutoff > 0 || trim ? c.getImageData(0, 0, canvas.width, canvas.height) : undefined;
  if (manifest.alphaCutoff > 0 && pixels) {
    for (let i = 3; i < pixels.data.length; i += 4)
      pixels.data[i] = pixels.data[i] >= manifest.alphaCutoff ? 255 : 0;
    c.putImageData(pixels, 0, 0);
  }
  const texture = scene.textures.addCanvas(key, canvas)!;
  texture.setFilter(0);
  for (const [id, r] of Object.entries(manifest.frames)) {
    const bounds = trim && pixels ? atlasTrimBounds(pixels.data, canvas.width, r) : undefined;
    if (bounds) {
      texture.add(id, 0, r.x + bounds.x, r.y + bounds.y, bounds.width, bounds.height)!
        .setTrim(r.width, r.height, bounds.x, bounds.y, bounds.width, bounds.height);
    } else texture.add(id, 0, r.x, r.y, r.width, r.height);
  }
}
