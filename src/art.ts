import Phaser from 'phaser';
import type { CharacterProfile } from './types';
import { importedCharacterSource, setupVisualAssets } from './visual-assets';
import { CHARACTER_WIDTH, CHARACTER_HEIGHT, CHARACTER_DIRECTIONS, drawStyledCharacter } from './character-sprites';
import type { CharacterDirection } from './character-sprites';

export { CHARACTER_WIDTH, CHARACTER_HEIGHT, CHARACTER_DIRECTIONS } from './character-sprites';
export type { CharacterDirection } from './character-sprites';

/** Four columns per direction: rest, left step, rest, right step. */
export function characterFrame(direction: CharacterDirection, phase = 0): number {
  return CHARACTER_DIRECTIONS.indexOf(direction) * 4 + ((Math.floor(phase) % 4) + 4) % 4;
}

export function shade(hex: string, amount: number): string {
  const value = Number.parseInt(hex.replace('#', ''), 16);
  return `#${[16, 8, 0].map((shift) => Math.min(255, Math.max(0, ((value >> shift) & 255) + amount)).toString(16).padStart(2, '0')).join('')}`;
}

const characterCanvases = new Map<string, HTMLCanvasElement>();
const rgb = (hex: string): number[] => [1, 3, 5].map(index => Number.parseInt(hex.slice(index, index + 2), 16));

/** Adapt the supplied four-view PNGs to one fixed canvas, preserving aspect and a common feet pivot. */
function drawImportedCharacter(ctx: CanvasRenderingContext2D, profile: CharacterProfile, direction: CharacterDirection, phase: number): boolean {
  const source = importedCharacterSource(direction, phase);
  if (!source) return false;
  const cacheKey = [profile.skin, profile.hairStyle, profile.hairColor, profile.outfit, direction, Math.floor(phase) % 4].join(':');
  const cached = characterCanvases.get(cacheKey);
  if (cached) { ctx.drawImage(cached, 4, 4, 40, 60); return true; }
  const original = document.createElement('canvas'); original.width = 96; original.height = 128;
  const paint = original.getContext('2d', { willReadFrequently: true })!;
  paint.imageSmoothingEnabled = false;
  paint.drawImage(source, 0, 0);
  const pixels = paint.getImageData(0, 0, 96, 128);
  const targets = { skin: rgb(profile.skin), hair: rgb(profile.hairColor), outfit: rgb(profile.outfit) };
  for (let y = 0; y < 128; y++) for (let x = 0; x < 96; x++) {
    const i = (y * 96 + x) * 4;
    if (!pixels.data[i + 3]) continue;
    const [r, g, b] = [pixels.data[i], pixels.data[i + 1], pixels.data[i + 2]];
    const luminosity = r * 0.299 + g * 0.587 + b * 0.114;
    const warm = r > g * 1.13 && g > b * 1.09 && r - b > 24;
    const face = direction === 'down' ? x >= 32 && x <= 65 && y >= 40 && y <= 65
      : direction === 'right' ? x >= 47 && x <= 75 && y >= 36 && y <= 66
      : direction === 'left' ? x >= 21 && x <= 49 && y >= 36 && y <= 66 : false;
    const hands = y >= 67 && y <= 91 && (x >= 21 && x <= 38 || x >= 59 && x <= 76);
    let target: number[] | undefined, base = 1;
    if (warm && luminosity > 105 && (face || hands)) { target = targets.skin; base = 165; }
    else if (warm && y < 65) { target = targets.hair; base = 80; }
    else if (y >= 60 && y <= 106 && b > r * 1.02 && b > g * 0.98 && luminosity > 23) { target = targets.outfit; base = 112; }
    if (target) for (let channel = 0; channel < 3; channel++) pixels.data[i + channel] = Math.max(0, Math.min(255, Math.round(target[channel] * luminosity / base)));
    if (profile.hairStyle !== 'preso' && y < 24) pixels.data[i + 3] = 0;
  }
  paint.putImageData(pixels, 0, 0);
  const result = document.createElement('canvas'); result.width = 32; result.height = 48;
  const resultContext = result.getContext('2d')!; resultContext.imageSmoothingEnabled = false;
  // Additional silhouettes keep all three editor choices distinct on the imported preset.
  if (profile.hairStyle === 'longo') {
    resultContext.fillStyle = shade(profile.hairColor, -24);
    resultContext.fillRect(direction === 'right' ? 5 : 8, 13, direction === 'up' ? 17 : 16, 20);
    resultContext.fillStyle = profile.hairColor;
    resultContext.fillRect(direction === 'right' ? 6 : 9, 15, direction === 'up' ? 15 : 3, 17);
  }
  // Same crop on every direction/frame: no per-frame bounding-box resize or foot jitter.
  resultContext.drawImage(original, 14, 6, 68, 112, 2, 2, 28, 46);
  if (profile.hairStyle === 'curto') {
    resultContext.fillStyle = profile.hairColor; resultContext.fillRect(12, 9, 9, 2);
    resultContext.fillStyle = shade(profile.hairColor, 18); resultContext.fillRect(13, 9, 5, 1);
  }
  if (characterCanvases.size > 192) characterCanvases.clear();
  characterCanvases.set(cacheKey, result); ctx.drawImage(result, 4, 4, 40, 60);
  return true;
}

/** Human character; preview and world share the same source, customization and feet alignment. */
export function drawCharacter(canvas: HTMLCanvasElement, profile: CharacterProfile, direction: CharacterDirection = 'down', phase = 0): void {
  canvas.width = CHARACTER_WIDTH;
  canvas.height = CHARACTER_HEIGHT;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  if (drawStyledCharacter(ctx, profile, direction, phase)) return;
  if (drawImportedCharacter(ctx, profile, direction, phase)) return;
  // Local fallback stays available if an image is unavailable while loading.
  ctx.translate(12, 32);
  const rect = (color: string, x: number, y: number, w: number, h: number) => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  };
  const skinDark = shade(profile.skin, -34);
  const hairDark = shade(profile.hairColor, -27);
  const walkingPhase = ((Math.floor(phase) % 4) + 4) % 4;
  const leftLift = walkingPhase === 1 ? 2 : 0;
  const rightLift = walkingPhase === 3 ? 2 : 0;
  if (direction === 'left' || direction === 'right') {
    if (direction === 'left') { ctx.translate(24, 0); ctx.scale(-1, 1); }
    if (profile.hairStyle === 'longo') {
      rect(hairDark, 6, 5, 9, 17); rect(profile.hairColor, 6, 7, 4, 14);
    }
    if (profile.hairStyle === 'preso') {
      rect(hairDark, 3, 4, 6, 8); rect(profile.hairColor, 3, 3, 5, 6); rect('#caae75', 7, 7, 2, 2);
    }
    rect('#293c38', 9, 24, 5, 6 - leftLift); rect('#36433e', 13, 24, 4, 6 - rightLift);
    rect('#423b32', 8, 29 - leftLift, 7, 3); rect('#504436', 13, 29 - rightLift, 7, 3);
    rect(shade(profile.outfit, -24), 8, 16, 10, 11);
    rect(profile.outfit, 10, 16, 8, 9); rect(shade(profile.outfit, 25), 14, 17, 3, 6);
    rect('#b89e73', 9, 25, 9, 2);
    rect(shade(profile.outfit, -10), 10, 18 - rightLift / 2, 5, 6);
    rect(profile.skin, 11, 23 - rightLift / 2, 4, 4);
    rect(skinDark, 11, 13, 5, 4); rect(profile.skin, 10, 6, 8, 9);
    rect(profile.skin, 17, 10, 3, 3); rect(shade(profile.skin, 16), 14, 8, 3, 3);
    rect(skinDark, 10, 10, 2, 3); rect('#3d3c33', 17, 9, 1, 2);
    rect(hairDark, 8, 3, 10, 6); rect(profile.hairColor, 9, 2, 8, 5);
    rect(shade(profile.hairColor, 18), 10, 2, 5, 2); rect(hairDark, 8, 7, 3, 6);
    if (profile.hairStyle === 'longo') rect(profile.hairColor, 7, 8, 4, 12);
    return;
  }
  if (direction === 'up') {
    rect('#36433e', 6, 25, 5, 5 - leftLift); rect('#36433e', 13, 25, 5, 5 - rightLift);
    rect('#423b32', 5, 29 - leftLift, 6, 3); rect('#423b32', 13, 29 - rightLift, 6, 3);
    rect(shade(profile.outfit, -24), 5, 16, 14, 11); rect(profile.outfit, 6, 16, 12, 9);
    rect(shade(profile.outfit, 15), 7, 17, 10, 2); rect('#b89e73', 8, 25, 9, 2);
    rect(shade(profile.outfit, -12), 3, 17 - leftLift / 2, 3, 7);
    rect(profile.outfit, 18, 17 - rightLift / 2, 3, 7);
    rect(skinDark, 3, 23 - leftLift / 2, 3, 3); rect(profile.skin, 18, 23 - rightLift / 2, 3, 3);
    rect(skinDark, 9, 13, 6, 4); rect(profile.skin, 6, 9, 2, 4); rect(skinDark, 16, 9, 2, 4);
    rect(hairDark, 6, 3, 12, 11); rect(profile.hairColor, 7, 2, 10, 11);
    rect(shade(profile.hairColor, 18), 8, 3, 5, 3); rect(hairDark, 8, 12, 8, 3);
    if (profile.hairStyle === 'longo') { rect(hairDark, 5, 9, 14, 12); rect(profile.hairColor, 6, 8, 12, 11); }
    if (profile.hairStyle === 'preso') {
      rect(hairDark, 11, 10, 7, 10); rect(profile.hairColor, 12, 10, 5, 8); rect('#caae75', 12, 11, 5, 2);
    }
    return;
  }
  if (profile.hairStyle === 'longo') {
    rect(hairDark, 5, 6, 14, 16);
    rect(profile.hairColor, 4, 9, 3, 12);
    rect(profile.hairColor, 17, 9, 3, 12);
  }
  if (profile.hairStyle === 'preso') {
    rect(hairDark, 16, 2, 6, 7);
    rect(profile.hairColor, 17, 1, 4, 5);
    rect('#caae75', 16, 7, 3, 2);
  }
  rect('#36433e', 6, 25, 5, 5 - leftLift);
  rect('#36433e', 13, 25, 5, 5 - rightLift);
  rect('#423b32', 5, 29 - leftLift, 6, 3);
  rect('#423b32', 13, 29 - rightLift, 6, 3);
  rect(shade(profile.outfit, -24), 5, 17, 14, 10);
  rect(profile.outfit, 6, 16, 12, 9);
  rect(shade(profile.outfit, 25), 7, 17, 3, 7);
  rect('#b89e73', 8, 25, 9, 2);
  rect('#e1d2a3', 11, 25, 2, 2);
  rect(profile.outfit, 3, 17 - leftLift / 2, 3, 6);
  rect(shade(profile.outfit, -12), 18, 17 - rightLift / 2, 3, 6);
  rect(profile.skin, 3, 23 - leftLift / 2, 3, 3);
  rect(skinDark, 18, 23 - rightLift / 2, 3, 3);
  rect(skinDark, 9, 13, 6, 4);
  rect(profile.skin, 7, 6, 10, 9);
  rect(profile.skin, 6, 9, 2, 4);
  rect(skinDark, 16, 9, 2, 4);
  rect(shade(profile.skin, 16), 8, 8, 3, 4);
  rect(skinDark, 8, 14, 7, 2);
  rect('#3d3c33', 9, 10, 1, 2);
  rect('#3d3c33', 14, 10, 1, 2);
  rect(shade(profile.skin, -15), 12, 12, 2, 1);
  rect(hairDark, 6, 3, 12, 5);
  rect(profile.hairColor, 7, 2, 10, 5);
  rect(shade(profile.hairColor, 18), 8, 2, 5, 2);
  rect(profile.hairColor, 6, 6, 4, 3);
  rect(hairDark, 16, 5, 2, 4);
  if (profile.hairStyle === 'curto') rect(profile.hairColor, 11, 6, 3, 2);
  if (profile.hairStyle === 'longo') rect(profile.hairColor, 5, 5, 2, 12);
}

export function createCharacterTexture(scene: Phaser.Scene, profile: CharacterProfile, key: string): string {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const canvas = document.createElement('canvas');
  drawCharacter(canvas, profile);
  scene.textures.addCanvas(key, canvas)?.setFilter(Phaser.Textures.FilterMode.NEAREST);
  return key;
}

/** One local canvas atlas; frame order is defined by characterFrame(). */
export function createCharacterFrames(scene: Phaser.Scene, profile: CharacterProfile, key: string): string {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const atlas = document.createElement('canvas');
  atlas.width = CHARACTER_WIDTH * 4;
  atlas.height = CHARACTER_HEIGHT * CHARACTER_DIRECTIONS.length;
  const ctx = atlas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  const frameCanvas = document.createElement('canvas');
  for (const [row, direction] of CHARACTER_DIRECTIONS.entries()) for (let phase = 0; phase < 4; phase++) {
    drawCharacter(frameCanvas, profile, direction, phase);
    ctx.drawImage(frameCanvas, phase * CHARACTER_WIDTH, row * CHARACTER_HEIGHT);
  }
  const texture = scene.textures.addCanvas(key, atlas);
  texture?.setFilter(Phaser.Textures.FilterMode.NEAREST);
  for (const [row, direction] of CHARACTER_DIRECTIONS.entries()) for (let phase = 0; phase < 4; phase++) {
    texture?.add(characterFrame(direction, phase), 0, phase * CHARACTER_WIDTH, row * CHARACTER_HEIGHT, CHARACTER_WIDTH, CHARACTER_HEIGHT);
  }
  return key;
}

export function createArt(scene: Phaser.Scene): void {
  setupVisualAssets(scene);
  const add = (key: string, width: number, height: number, paint: (ctx: CanvasRenderingContext2D) => void) => {
    if (scene.textures.exists(key)) return;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    paint(ctx);
    scene.textures.addCanvas(key, canvas)?.setFilter(Phaser.Textures.FilterMode.NEAREST);
  };
  const adopt = (key: string, imported: string): void => {
    if (!scene.textures.exists(imported)) return;
    const image = scene.textures.get(imported).getSourceImage() as HTMLCanvasElement;
    add(key, image.width, image.height, c => c.drawImage(image, 0, 0));
  };
  adopt('wall', 'imported-wall');
  adopt('window', 'imported-window');
  adopt('door', 'imported-door');
  adopt('bench', 'asset-bench');
  adopt('fence', 'asset-fence');
  adopt('workbench', 'asset-workbench');
  const floorSource = scene.textures.exists('asset-ground-wood') ? 'asset-ground-wood' : 'module-piso_tabuas';
  if (scene.textures.exists(floorSource)) {
    const floor = scene.textures.get(floorSource).getSourceImage() as HTMLImageElement | HTMLCanvasElement;
    add('floor', 32, 32, c => c.drawImage(floor, 0, 0, 32, 32));
  }
  if (scene.textures.exists('module-telha_lisa')) {
    const tile = scene.textures.get('module-telha_lisa').getSourceImage() as HTMLImageElement;
    for (const vertical of [false, true]) add(vertical ? 'roof-vertical' : 'roof', vertical ? 32 : 96, vertical ? 96 : 32, c => {
      for (let offset = 0; offset < 3; offset++) c.drawImage(tile, 3, 8, 64, 64, vertical ? 0 : offset * 32, vertical ? offset * 32 : 0, 32, 32);
    });
  }
  add('shadow', 24, 10, (c) => {
    c.fillStyle = '#203e3444';
    c.fillRect(3, 3, 18, 5);
    c.fillRect(0, 5, 24, 2);
  });
  add('fence', 32, 32, (c) => {
    c.fillStyle = '#3d4c3644'; c.fillRect(1, 26, 30, 5);
    c.fillStyle = '#705943'; c.fillRect(0, 11, 32, 4); c.fillRect(0, 21, 32, 4);
    c.fillStyle = '#b69768'; c.fillRect(0, 9, 32, 4); c.fillRect(0, 19, 32, 4);
    for (const x of [3, 24]) {
      c.fillStyle = '#70533b'; c.fillRect(x, 4, 5, 25);
      c.fillStyle = '#c2a375'; c.fillRect(x, 4, 3, 22);
      c.fillStyle = '#e1c391'; c.fillRect(x, 3, 5, 3);
      c.fillStyle = '#544b37'; c.fillRect(x + 2, 11, 1, 1); c.fillRect(x + 2, 21, 1, 1);
    }
  });
  add('bench', 32, 32, (c) => {
    c.fillStyle = '#304b3444'; c.fillRect(1, 25, 30, 5);
    c.fillStyle = '#6b5039'; c.fillRect(4, 10, 3, 18); c.fillRect(25, 10, 3, 18);
    c.fillStyle = '#c0a073'; c.fillRect(2, 8, 28, 5); c.fillRect(2, 15, 28, 5);
    c.fillStyle = '#806347'; c.fillRect(2, 12, 28, 2); c.fillRect(2, 19, 28, 3);
    c.fillStyle = '#d4b786'; c.fillRect(2, 8, 28, 1); c.fillRect(2, 15, 28, 1);
    c.fillStyle = '#584b37'; c.fillRect(5, 25, 3, 4); c.fillRect(24, 25, 3, 4);
  });
  add('workbench', 32, 32, (c) => {
    const r = (color: string, x: number, y: number, w: number, h: number) => { c.fillStyle = color; c.fillRect(x, y, w, h); };
    r('#304b3444', 1, 26, 30, 5); r('#675037', 4, 15, 5, 14); r('#675037', 24, 15, 5, 14);
    r('#a27a4b', 5, 16, 3, 11); r('#957046', 25, 16, 3, 11);
    r('#74573b', 3, 23, 26, 3); r('#b2915f', 3, 21, 26, 3);
    r('#77593d', 1, 12, 30, 7); r('#c7a776', 1, 9, 30, 7);
    r('#e1c38b', 2, 9, 28, 2); r('#a18255', 2, 14, 28, 2);
    r('#a28255', 10, 11, 1, 3); r('#a28255', 21, 11, 1, 3);
    // A small vice, a board and a blade distinguish this from the garden bench.
    r('#536b63', 4, 5, 5, 7); r('#8ca092', 3, 5, 7, 3); r('#bed0b9', 4, 5, 5, 1);
    r('#87653f', 13, 7, 13, 4); r('#e2c08a', 13, 6, 13, 3);
    r('#d5dbc4', 16, 5, 10, 2); r('#705039', 25, 4, 4, 4);
  });
  add('wall', 32, 32, (c) => {
    const r = (color: string, x: number, y: number, w: number, h: number) => { c.fillStyle = color; c.fillRect(x, y, w, h); };
    r('#304b3444', 0, 28, 32, 4); r('#846747', 0, 5, 32, 25);
    r('#d7c391', 1, 6, 30, 18); r('#ead5a5', 2, 7, 28, 3);
    r('#c4ad7d', 2, 20, 28, 3); r('#e1cda0', 7, 12, 10, 2); r('#cdb887', 22, 15, 5, 2);
    r('#8d6d47', 0, 4, 3, 24); r('#b49462', 1, 5, 1, 22);
    r('#8d6d47', 29, 4, 3, 24); r('#b49462', 30, 5, 1, 22);
    r('#dfc18a', 0, 3, 32, 3); r('#846440', 0, 25, 32, 4); r('#c19f69', 0, 24, 32, 2);
    for (const x of [4, 12, 20, 28]) r('#66523b', x, 26, 1, 1);
  });
  add('floor', 32, 32, (c) => {
    const r = (color: string, x: number, y: number, w: number, h: number) => { c.fillStyle = color; c.fillRect(x, y, w, h); };
    r('#765a3d', 0, 0, 32, 32);
    for (let row = 0; row < 4; row++) {
      const y = row * 8;
      r(row % 2 === 0 ? '#ba9866' : '#b18c5c', 0, y, 32, 7);
      r('#d0b07a', 0, y, 32, 1); r('#a67e50', 0, y + 5, 32, 2);
      const joint = row % 2 === 0 ? 9 : 24;
      r('#86633f', joint, y + 1, 1, 6); r('#d0b07a', joint + 1, y + 1, 1, 5);
      r('#81633f', joint - 2, y + 2, 1, 1); r('#81633f', joint + 3, y + 2, 1, 1);
      r('#c5a16b', row % 2 === 0 ? 18 : 4, y + 3, 7, 1);
    }
  });
  add('window', 32, 32, (c) => {
    const r = (color: string, x: number, y: number, w: number, h: number) => { c.fillStyle = color; c.fillRect(x, y, w, h); };
    r('#304b3444', 0, 28, 32, 4); r('#846747', 0, 5, 32, 25);
    r('#d7c391', 1, 6, 30, 19); r('#ead5a5', 1, 6, 30, 3);
    r('#dfc18a', 0, 3, 32, 3); r('#846440', 0, 25, 32, 4); r('#c19f69', 0, 24, 32, 2);
    r('#765f40', 8, 8, 16, 16); r('#dbc79a', 9, 9, 14, 13);
    r('#426f6b', 11, 10, 10, 11); r('#76a398', 11, 10, 5, 6); r('#b0c4a6', 12, 10, 2, 4);
    r('#d9c69b', 15, 10, 2, 12); r('#d9c69b', 10, 15, 12, 2);
    for (const x of [3, 24]) {
      r('#3b675d', x, 8, 5, 15); r('#5d8c77', x + 1, 9, 3, 13);
      for (const y of [11, 15, 19]) r('#366456', x + 1, y, 3, 1);
    }
    r('#8b6b47', 7, 23, 18, 2); r('#c2a270', 7, 22, 18, 1);
  });
  const roof = (vertical: boolean): void => add(vertical ? 'roof-vertical' : 'roof', vertical ? 32 : 96, vertical ? 96 : 32, (c) => {
    // Both footprints are authored on their own canvas; no rotated-pivot offsets.
    const width = vertical ? 32 : 96, height = vertical ? 96 : 32;
    const r = (color: string, x: number, y: number, w: number, h: number) => { c.fillStyle = color; c.fillRect(x, y, w, h); };
    r('#694a37', 0, 0, width, height);
    for (let y = 1, row = 0; y < height - 2; y += 7, row++) {
      r(row % 2 === 0 ? '#b6754f' : '#ad6948', 1, y, width - 2, Math.min(6, height - y - 2));
      r('#d39764', 1, y, width - 2, 1);
      r('#885039', 1, y + 5, width - 2, 1);
      for (let x = row % 2 === 0 ? 8 : 16; x < width - 1; x += 16) {
        r('#805039', x, y + 1, 1, 4); r('#c38759', x + 1, y + 1, 1, 3);
      }
    }
    r('#dfa16c', 0, 0, width, 2); r('#774d37', 0, height - 2, width, 2);
    r('#c68b5d', 0, 2, 1, height - 4); r('#8e593d', width - 1, 2, 1, height - 4);
  });
  roof(false);
  roof(true);
  const door = (open: boolean): void => add(open ? 'door-open' : 'door', 32, 32, (c) => {
    const r = (color: string, x: number, y: number, w: number, h: number) => { c.fillStyle = color; c.fillRect(x, y, w, h); };
    r('#304b3433', 0, 28, 32, 4); r('#6e5237', 1, 4, 5, 26); r('#6e5237', 26, 4, 5, 26);
    r('#c7a675', 2, 4, 3, 24); r('#c7a675', 27, 4, 3, 24);
    r('#dfc28b', 0, 2, 32, 4); r('#9b8157', 5, 28, 22, 2);
    if (open) {
      r('#6e5237', 5, 6, 6, 23); r('#b99760', 6, 6, 4, 21); r('#d7b97c', 6, 7, 1, 19);
      r('#ddbc65', 8, 17, 2, 2);
    } else {
      r('#786140', 6, 6, 20, 22); r('#aa8855', 7, 7, 18, 20);
      for (const x of [8, 14, 20]) { r('#c7a976', x, 8, 1, 18); r('#87673f', x + 4, 8, 1, 18); }
      r('#6b654a', 7, 10, 17, 2); r('#6b654a', 7, 23, 17, 2); r('#e1be65', 21, 17, 2, 2);
    }
  });
  door(false);
  door(true);
  for (let stage = 0; stage < 3; stage++) {
    add(`crop-${stage}`, 32, 32, (c) => {
      c.fillStyle = '#50433355'; c.fillRect(8, 24, 17, 4);
      const level = stage * 4;
      c.fillStyle = '#43663e'; c.fillRect(15, 20 - level, 3, 8);
      c.fillStyle = '#88a34d'; c.fillRect(9 - stage, 18 - level, 7, 4); c.fillRect(7 - stage, 16 - level, 5, 4);
      c.fillStyle = '#a8b863'; c.fillRect(17, 15 - level, 7 + stage, 4); c.fillRect(21, 13 - level, 5, 4);
      c.fillStyle = '#6e943f'; c.fillRect(12, 16 - level, 5, 4);
      if (stage === 2) {
        c.fillStyle = '#b38b8d'; c.fillRect(12, 20, 10, 6);
        c.fillStyle = '#eddbc1'; c.fillRect(11, 21, 11, 4); c.fillRect(13, 25, 7, 3);
        c.fillStyle = '#f6eace'; c.fillRect(12, 21, 5, 2);
      }
    });
  }
  createCharacterTexture(scene, {name: 'Lia', skin: '#b87952', hairStyle: 'preso', hairColor: '#3b3029', outfit: '#b46e4e'}, 'lia');
}
