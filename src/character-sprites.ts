import type Phaser from 'phaser';
import type { CharacterProfile, HairStyle } from './types';
import { resolveCharacterAppearance } from './data/character-options';

export const CHARACTER_WIDTH = 48;
export const CHARACTER_HEIGHT = 64;
export const CHARACTER_DIRECTIONS = ['down', 'left', 'right', 'up'] as const;
export type CharacterDirection = typeof CHARACTER_DIRECTIONS[number];

interface PreparedFrame {
  canvas: HTMLCanvasElement;
  /** Material masks are prepared before recoloring; colors never leak into another material. */
  materials: Uint8Array;
}
const frames = new Map<string, PreparedFrame>();
const bags = new Map<CharacterDirection, HTMLCanvasElement>();
const customized = new Map<string, HTMLCanvasElement>();
const rgb = (hex: string): number[] => [1, 3, 5].map(index => Number.parseInt(hex.slice(index, index + 2), 16));
const makeCanvas = (width: number, height: number): HTMLCanvasElement => {
  const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
  return canvas;
};

/** Remove source halos without modifying the original local PNG. */
function cell(image: HTMLImageElement | HTMLCanvasElement, column: number, row: number, columns: number, rows: number): HTMLCanvasElement | null {
  const width = Math.floor(image.width / columns), height = Math.floor(image.height / rows);
  const canvas = makeCanvas(width, height), ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(image, column * image.width / columns, row * image.height / rows, width, height, 0, 0, width, height);
  const pixels = ctx.getImageData(0, 0, width, height);
  const visited = new Uint8Array(width * height);
  let largest: number[] = [];
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const i = (y * width + x) * 4, p = pixels.data;
    p[i + 3] = p[i + 3] >= 170 ? 255 : 0;
  }
  // Keep the connected silhouette, discarding isolated source specks and fragments
  // from a neighboring row. Never use a red hue cutoff: hair shadows are warm too.
  for (let start = 0; start < visited.length; start++) {
    if (visited[start] || !pixels.data[start * 4 + 3]) continue;
    const component = [start]; visited[start] = 1;
    for (let cursor = 0; cursor < component.length; cursor++) {
      const current = component[cursor], x = current % width, y = Math.floor(current / width);
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy || x + dx < 0 || x + dx >= width || y + dy < 0 || y + dy >= height) continue;
        const next = (y + dy) * width + x + dx;
        if (visited[next] || !pixels.data[next * 4 + 3]) continue;
        visited[next] = 1; component.push(next);
      }
    }
    if (component.length > largest.length) largest = component;
  }
  const keep = new Uint8Array(visited.length);
  let minX = width, minY = height, maxX = -1, maxY = -1;
  for (const index of largest) {
    keep[index] = 1;
    const x = index % width, y = Math.floor(index / width);
    minX = Math.min(minX, x); maxX = Math.max(maxX, x);
    minY = Math.min(minY, y); maxY = Math.max(maxY, y);
  }
  for (let i = 0; i < keep.length; i++) if (!keep[i]) pixels.data[i * 4 + 3] = 0;
  if (maxX < minX) return null;
  ctx.putImageData(pixels, 0, 0);
  const trimmed = makeCanvas(maxX - minX + 1, maxY - minY + 1);
  trimmed.getContext('2d')!.drawImage(canvas, minX, minY, trimmed.width, trimmed.height, 0, 0, trimmed.width, trimmed.height);
  return trimmed;
}

/** Original full-body sheets have their own silhouettes for all three hair styles. */
export function setupCharacterSprites(scene: Phaser.Scene): void {
  frames.clear(); bags.clear(); customized.clear();
  for (const [style, key] of [['preso', 'farmer-bun-source'], ['curto', 'farmer-short-source'], ['longo', 'farmer-long-source']] as const) {
    if (!scene.textures.exists(key)) continue;
    const image = scene.textures.get(key).getSourceImage() as HTMLImageElement;
    for (const [row, direction] of CHARACTER_DIRECTIONS.entries()) {
      const rowFrames = Array.from({ length: 4 }, (_, phase) => cell(image, phase, row, 4, 4));
      const height = Math.max(...rowFrames.map(frame => frame?.height ?? 0));
      const width = Math.max(...rowFrames.map(frame => frame?.width ?? 0));
      if (!height || !width) continue;
      // One scale per direction, never stretching the narrower profiles or individual steps.
      const scale = Math.min(42 / width, 60 / height);
      rowFrames.forEach((source, phase) => {
        if (!source) return;
        const canvas = makeCanvas(CHARACTER_WIDTH, CHARACTER_HEIGHT), ctx = canvas.getContext('2d', { willReadFrequently: true })!;
        ctx.imageSmoothingEnabled = false;
        const w = Math.round(source.width * scale), h = Math.round(source.height * scale);
        const ox = Math.floor((CHARACTER_WIDTH - w) / 2), oy = CHARACTER_HEIGHT - h;
        ctx.drawImage(source, ox, oy, w, h);
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        const materials = new Uint8Array(canvas.width * canvas.height);
        for (let y = 0; y < canvas.height; y++) for (let x = 0; x < canvas.width; x++) {
          const i = (y * canvas.width + x) * 4;
          if (!data[i + 3]) continue;
          const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
          const px = (x - ox) / w, py = (y - oy) / h;
          const light = r * .299 + g * .587 + b * .114;
          const warm = r > g * 1.12 && g > b * 1.09;
          const face = direction === 'down' ? py > .29 && py < .49 && px > .18 && px < .82
            : direction === 'left' ? py > .26 && py < .48 && px < .62
              : direction === 'right' ? py > .26 && py < .48 && px > .38 : false;
          const hands = py > .54 && py < .78 && (px < .26 || px > .74 || direction === 'left' || direction === 'right');
          if (warm && light > 119 && (face || hands)) materials[y * canvas.width + x] = 1;
          else if (warm && py < (style === 'longo' ? .59 : .49) && light > 29) materials[y * canvas.width + x] = 2;
          else if (py > .40 && py < .88 && b > r * 1.02 && b > g * .97 && light > 24) materials[y * canvas.width + x] = 3;
          else if (py > .42 && py < .76 && r > 92 && g > 82 && b > 57 && r / g < 1.28 && g / b < 1.65) materials[y * canvas.width + x] = 4;
        }
        frames.set(`${style}:${direction}:${phase}`, { canvas, materials });
      });
    }
  }
  if (scene.textures.exists('farmer-bags-source')) {
    const image = scene.textures.get('farmer-bags-source').getSourceImage() as HTMLImageElement;
    CHARACTER_DIRECTIONS.forEach((direction, i) => {
      const source = cell(image, i, 0, 4, 1);
      if (!source) return;
      const canvas = makeCanvas(12, 13), ctx = canvas.getContext('2d')!;
      ctx.imageSmoothingEnabled = false;
      const scale = Math.min(canvas.width / source.width, canvas.height / source.height);
      const w = Math.round(source.width * scale), h = Math.round(source.height * scale);
      ctx.drawImage(source, Math.floor((canvas.width - w) / 2), canvas.height - h, w, h);
      bags.set(direction, canvas);
    });
  }
}

export function drawStyledCharacter(ctx: CanvasRenderingContext2D, profile: CharacterProfile, direction: CharacterDirection, phase: number): boolean {
  const appearance = resolveCharacterAppearance(profile), frame = ((Math.floor(phase) % 4) + 4) % 4;
  const key = [appearance.skin, appearance.hairColor, appearance.hairStyle, appearance.outfit, appearance.shirtColor, appearance.accessory, direction, frame].join(':');
  const cached = customized.get(key);
  if (cached) { ctx.drawImage(cached, 0, 0); return true; }
  const source = frames.get(`${appearance.hairStyle as HairStyle}:${direction}:${frame}`);
  if (!source) return false;
  const canvas = makeCanvas(CHARACTER_WIDTH, CHARACTER_HEIGHT), paint = canvas.getContext('2d')!;
  paint.imageSmoothingEnabled = false; paint.drawImage(source.canvas, 0, 0);
  const pixels = paint.getImageData(0, 0, canvas.width, canvas.height);
  const colors = [[], rgb(appearance.skin), rgb(appearance.hairColor), rgb(appearance.outfit), rgb(appearance.shirtColor)];
  const luminances = [1, 177, 80, 107, 220];
  for (let i = 0; i < source.materials.length; i++) {
    const material = source.materials[i];
    if (!material) continue;
    const index = i * 4, data = pixels.data;
    const light = data[index] * .299 + data[index + 1] * .587 + data[index + 2] * .114;
    const ratio = Math.max(.32, Math.min(1.65, light / luminances[material]));
    for (let channel = 0; channel < 3; channel++) data[index + channel] = Math.min(255, Math.round(colors[material][channel] * ratio));
  }
  paint.putImageData(pixels, 0, 0);
  const bag = bags.get(direction);
  if (appearance.accessory === 'bolsa' && bag) {
    const x = direction === 'right' ? 10 : direction === 'left' ? 26 : direction === 'up' ? 28 : 9;
    paint.drawImage(bag, x, 39);
  }
  if (customized.size >= 512) customized.clear();
  customized.set(key, canvas); ctx.drawImage(canvas, 0, 0);
  return true;
}
