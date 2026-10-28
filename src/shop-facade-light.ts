import type Phaser from 'phaser';
import type {ShopFacade} from './data/shop-facades';
/** Only pixels inside the authored pane regions receive additional night light. */
export function setupFacadeLight(scene: Phaser.Scene, b: ShopFacade): void {
  const key = b.texture + '-windows';
  if (scene.textures.exists(key)) return;
  const canvas = document.createElement('canvas');
  canvas.width = b.width;
  canvas.height = b.height;
  const c = canvas.getContext('2d', {willReadFrequently: true})!;
  c.drawImage(scene.textures.get(b.texture).getSourceImage() as HTMLImageElement, 0, 0);
  const input = c.getImageData(0, 0, b.width, b.height), mask = c.createImageData(b.width, b.height);
  for (const r of b.glass) for (let y = r.y; y < r.y + r.height; y++) for (let x = r.x; x < r.x + r.width; x++) {
    const i = (y * b.width + x) * 4, red = input.data[i], green = input.data[i + 1], blue = input.data[i + 2];
    const glass = green > red && blue > red || red > 170 && green > 110 && red > green * 1.15 && green > blue * 1.4;
    if (input.data[i + 3] >= 160 && glass) mask.data.set([255, 214, 143, 150], i);
  }
  c.putImageData(mask, 0, 0);
  scene.textures.addCanvas(key, canvas)?.setFilter(0);
  scene.textures.get(b.texture).setFilter(0);
}
