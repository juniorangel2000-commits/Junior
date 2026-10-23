import type Phaser from 'phaser';
import { prepareCharacterRig, drawRigPose } from './character-rig';
import type { CharacterProfile, HairStyle } from './types';
import { resolveCharacterAppearance } from './data/character-options';

export const CHARACTER_WIDTH = 48;
export const CHARACTER_HEIGHT = 64;
import { CHARACTER_DIRECTIONS, CHARACTER_FRAMES_PER_DIRECTION, CHARACTER_WALK_FRAMES, characterFrame } from './character-directions';
import type { CharacterDirection } from './character-directions';

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
function cell(image: HTMLImageElement | HTMLCanvasElement, column: number, row: number, columns: number, rows: number, rowBounds?: readonly number[]): HTMLCanvasElement | null {
  const top = rowBounds ? rowBounds[row] : row * image.height / rows;
  const bottom = rowBounds ? rowBounds[row + 1] : (row + 1) * image.height / rows;
  const width = Math.floor(image.width / columns), height = Math.floor(bottom - top);
  const canvas = makeCanvas(width, height), ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(image, column * image.width / columns, top, width, height, 0, 0, width, height);
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

/** Neutral art is rigged locally; walking never swaps the face or costume drawing. */
export function preloadCharacterSprites(scene: Phaser.Scene): void {
  scene.load.image('cozy-farmer-tied-source', 'assets/visual/characters/cozy-farmer-tied-turnaround.png');
  scene.load.image('cozy-farmer-short-source', 'assets/visual/characters/cozy-farmer-short-turnaround.png');
  scene.load.image('farmer-bags-source', 'assets/visual/characters/farmer-bags.png');
}

export function setupCharacterSprites(scene: Phaser.Scene): void {
  frames.clear(); bags.clear(); customized.clear();
  const views = [0, 1, 2, 3, 4, 5, 6, 7];
  for (const [style, key] of [['preso', 'cozy-farmer-tied-source'], ['curto', 'cozy-farmer-short-source'], ['longo', 'cozy-farmer-tied-source']] as const) {
    if (!scene.textures.exists(key)) continue;
    const image = scene.textures.get(key).getSourceImage() as HTMLImageElement;
    const sources = views.map(index => cell(image, index % 4, Math.floor(index / 4), 4, 2));
    const scale = Math.min(36 / Math.max(...sources.map(s => s?.width ?? 1)), 56 / Math.max(...sources.map(s => s?.height ?? 1)));
    for (const [row, direction] of CHARACTER_DIRECTIONS.entries()) {
      const source = sources[row]; if (!source) continue;
      const neutral = makeCanvas(CHARACTER_WIDTH, CHARACTER_HEIGHT), paint = neutral.getContext('2d')!;
      paint.imageSmoothingEnabled = false;
      const w = Math.round(source.width * scale), h = Math.round(source.height * scale);
      const ox = Math.floor((CHARACTER_WIDTH - w) / 2), oy = CHARACTER_HEIGHT - 3 - h;
      paint.drawImage(source, ox, oy, w, h);
      const rig = prepareCharacterRig(neutral, direction);
      for (let phase = 0; phase < CHARACTER_FRAMES_PER_DIRECTION; phase++) {
        const canvas = makeCanvas(CHARACTER_WIDTH, CHARACTER_HEIGHT), ctx = canvas.getContext('2d', { willReadFrequently: true })!;
        ctx.imageSmoothingEnabled = false;
        drawRigPose(ctx, rig, phase ? (phase - 1) / CHARACTER_WALK_FRAMES : null);
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        const materials = new Uint8Array(canvas.width * canvas.height);
        for (let y = 0; y < canvas.height; y++) for (let x = 0; x < canvas.width; x++) {
          const i = (y * canvas.width + x) * 4;
          if (!data[i + 3]) continue;
          const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
          const px = (x - ox) / w, py = (y - oy - (phase ? 1 : 0)) / h;
          const light = r * .299 + g * .587 + b * .114;
          const warm = r > g * 1.14 && g > b * 1.12;
          const face = py > .18 && py < .44 && px > .25 && px < .75;
          const hands = py > .55 && py < .8;
          if (warm && light > 125 && (face || hands)) materials[y * canvas.width + x] = 1;
          else if (warm && py < .44 && light > 26) materials[y * canvas.width + x] = 2;
          else if (py > .42 && py < .92 && b > r * 1.02 && b > g * .97 && light > 25) materials[y * canvas.width + x] = 3;
          else if (py > .42 && py < .69 && r > 110 && g > 95 && b > 70 && r / g < 1.23 && g / b < 1.5) materials[y * canvas.width + x] = 4;
        }
        frames.set(`${style}:${direction}:${phase}`, { canvas, materials });
      }
    }
  }
  if (scene.textures.exists('farmer-bags-source')) {
    const image = scene.textures.get('farmer-bags-source').getSourceImage() as HTMLImageElement;
    (['down', 'left', 'right', 'up'] as const).forEach((direction, i) => {
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
  const appearance = resolveCharacterAppearance(profile), frame = characterFrame(direction, phase) % CHARACTER_FRAMES_PER_DIRECTION;
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
  const bagDirection = direction.startsWith('up') ? 'up' : direction.startsWith('down') ? 'down' : direction;
  const bag = bags.get(bagDirection);
  if (appearance.accessory === 'bolsa' && bag) {
    const x = direction === 'right' ? 10 : direction === 'left' ? 26 : direction === 'up' ? 28 : 9;
    paint.drawImage(bag, x, 39);
  }
  if (customized.size >= 512) customized.clear();
  customized.set(key, canvas); ctx.drawImage(canvas, 0, 0);
  return true;
}
