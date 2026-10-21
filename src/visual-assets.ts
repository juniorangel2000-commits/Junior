import Phaser from 'phaser';
import { setupNatureSprites } from './nature-sprites';

/** Local PNGs copied without modification from the user-supplied art packages. */
const BASE = 'assets/visual/';
const ICON_IDS = new Set(['wood', 'stone', 'branch', 'log', 'plank', 'scrap', 'hatchet', 'pickaxe', 'handsaw', 'fiber', 'cord', 'flakedStone', 'handle', 'blade', 'board', 'hammer', 'water', 'workbench', 'seeds']);
export function itemIconUrl(id: string): string | undefined {
  if (ICON_IDS.has(id)) return `${BASE}icons/${id}.png`;
  if (id === 'fence') return `${BASE}modules/cerca_natural.png`;
  return undefined;
}

const WORLD_SOURCES: Record<string, string> = {
  stone: 'world/pedra.png', scrap: 'world/sucata.png', log: 'world/tronco.png',
  branch: 'world/branch.png', fiber: 'world/fiber.png', seeds: 'world/seed-shrub.png',
  vein: 'world/vein.png', workbench: 'world/workbench.png',
};
const MODULES = ['parede_creme', 'parede_janela_floreira', 'parede_trepadeira', 'parede_porta', 'porta_madeira', 'janela_turquesa', 'telha_lisa', 'telha_variante', 'chamine', 'floreira', 'cerca_natural', 'banco_jardim', 'barril', 'vaso_flor', 'piso_tabuas', 'piso_pedra', 'terra', 'caminho', 'planta'];
const DIRECTIONS = { down: 'baixo', up: 'cima', left: 'esquerda', right: 'direita' } as const;
type Direction = keyof typeof DIRECTIONS;
const characterSources = new Map<string, HTMLImageElement | HTMLCanvasElement>();

export function preloadVisualAssets(scene: Phaser.Scene): void {
  scene.load.image('nature-trees-source', `${BASE}nature/trees-approved.png`);
  for (const [id, path] of Object.entries(WORLD_SOURCES)) scene.load.image(`source-${id}`, `${BASE}${path}`);
  for (const id of MODULES) scene.load.image(`module-${id}`, `${BASE}modules/${id}.png`);
  for (const [direction, source] of Object.entries(DIRECTIONS)) for (let frame = 0; frame < 6; frame++) {
    scene.load.image(`character-${direction}-${frame}`, `${BASE}characters/${source}_${frame}.png`);
  }
}

export function importedCharacterSource(direction: Direction, phase: number): HTMLImageElement | HTMLCanvasElement | undefined {
  // Two idle poses and four movement poses are supplied. Keep the feet fixed.
  return characterSources.get(`${direction}-${[0, 2, 3, 4][((Math.floor(phase) % 4) + 4) % 4]}`);
}

function sourceImage(scene: Phaser.Scene, key: string): HTMLImageElement | HTMLCanvasElement | undefined {
  return scene.textures.exists(key) ? scene.textures.get(key).getSourceImage() as HTMLImageElement | HTMLCanvasElement : undefined;
}

function canvasTexture(scene: Phaser.Scene, key: string, width: number, height: number, paint: (c: CanvasRenderingContext2D) => void): void {
  if (scene.textures.exists(key)) return;
  const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
  const c = canvas.getContext('2d')!; c.imageSmoothingEnabled = false; paint(c);
  scene.textures.addCanvas(key, canvas)?.setFilter(Phaser.Textures.FilterMode.NEAREST);
}

/** Trim only transparent padding, then fit proportionally on a stable logical canvas. */
function fitSource(scene: Phaser.Scene, source: string, key: string, width: number, height: number, bottom = 0): void {
  const image = sourceImage(scene, source);
  if (!image) return;
  const scan = document.createElement('canvas'); scan.width = image.width; scan.height = image.height;
  const context = scan.getContext('2d', { willReadFrequently: true })!;
  context.drawImage(image, 0, 0);
  const data = context.getImageData(0, 0, scan.width, scan.height).data;
  let minX = scan.width, minY = scan.height, maxX = -1, maxY = -1;
  for (let y = 0; y < scan.height; y++) for (let x = 0; x < scan.width; x++) {
    if (data[(y * scan.width + x) * 4 + 3] < 32) continue;
    minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
  }
  if (maxX < minX) return;
  const sw = maxX - minX + 1, sh = maxY - minY + 1;
  const scale = Math.min((width - 2) / sw, (height - bottom - 2) / sh);
  const dw = Math.max(1, Math.round(sw * scale)), dh = Math.max(1, Math.round(sh * scale));
  canvasTexture(scene, key, width, height, c => c.drawImage(image, minX, minY, sw, sh, Math.floor((width - dw) / 2), height - bottom - dh, dw, dh));
}

/** Assemble a facade from the approved cream/terracotta modules at the existing house footprint. */
function createHouse(scene: Phaser.Scene): void {
  canvasTexture(scene, 'asset-house', 256, 224, c => {
    const wall = sourceImage(scene, 'module-parede_creme');
    const roof = sourceImage(scene, 'module-telha_lisa');
    const door = sourceImage(scene, 'module-porta_madeira');
    const window = sourceImage(scene, 'module-janela_turquesa');
    const chimney = sourceImage(scene, 'module-chamine');
    const pixel = (color: string, x: number, y: number, w: number, h: number) => {
      c.fillStyle = color; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
    };
    const flowers = (x: number, y: number, width: number, pink = false) => {
      for (let n = 0; n < Math.floor(width / 5); n++) {
        const fx = x + 3 + n * 5, fy = y - 4 - (n * 7 % 6);
        pixel('#395c32', fx, fy + 3, 1, y - fy);
        pixel('#547d38', fx - 2, fy + 4, 5, 3); pixel('#85a84b', fx - 1, fy + 3, 3, 2);
        pixel(pink && n % 3 ? '#bd6a87' : '#d8d5aa', fx - 2, fy, 5, 3);
        pixel(pink && n % 3 ? '#e9a8b6' : '#fff0d1', fx - 1, fy - 1, 3, 5);
        pixel('#d2aa53', fx, fy + 1, 1, 1);
      }
    };
    const flowerBox = (x: number, y: number, width: number, pink = false) => {
      pixel('#463b2b', x - 1, y + 1, width + 2, 8);
      pixel('#82603c', x, y + 1, width, 6); pixel('#b88a51', x + 1, y, width - 2, 3);
      pixel('#664931', x + 2, y + 6, width - 4, 2); pixel('#d2a365', x + 2, y, width - 5, 1);
      for (let n = 8; n < width - 3; n += 10) pixel('#6c4e33', x + n, y + 3, 1, 3);
      flowers(x, y, width, pink);
    };
    const pottedFlowers = (x: number, y: number, pink = false) => {
      pixel('#30492f27', x - 2, y - 2, 20, 4);
      pixel('#67412e', x + 2, y - 12, 12, 12); pixel('#a8643a', x + 3, y - 12, 10, 10);
      pixel('#ce8d50', x + 3, y - 12, 4, 8); pixel('#d99f64', x + 1, y - 14, 14, 3);
      pixel('#815033', x + 1, y - 11, 14, 2); pixel('#e1b784', x + 2, y - 14, 12, 1);
      flowers(x - 1, y - 14, 18, pink);
    };
    c.fillStyle = '#344b3533'; c.fillRect(8, 209, 241, 11);
    c.fillStyle = '#d1b996'; c.fillRect(16, 125, 224, 85);
    if (wall) for (let x = 16; x < 240; x += 48) c.drawImage(wall, x, 136, 48, 74);
    // Irregular stone foundation blends the facade into the surrounding ground.
    pixel('#65624d', 16, 207, 224, 8);
    for (let x = 17; x < 239; x += 14) {
      pixel(x % 3 ? '#9a9981' : '#aba58a', x, 207 + (x % 2), 12, 6);
      pixel('#c4b99a', x + 1, 207 + (x % 2), 10, 1);
      pixel('#6e8050', x + 7, 213, 7, 2);
    }
    c.save();
    c.beginPath(); c.moveTo(38, 50); c.lineTo(218, 50); c.lineTo(253, 139); c.lineTo(3, 139); c.closePath(); c.clip();
    c.fillStyle = '#995733'; c.fillRect(0, 50, 256, 92);
    // Sample the interior tile pattern: atlas borders must not become a checkerboard roof.
    if (roof) for (let y = 50; y < 140; y += 64) for (let x = 0; x < 256; x += 56) c.drawImage(roof, 3, 4, 56, 64, x, y, 56, 64);
    c.restore();
    c.fillStyle = '#613f2d'; c.fillRect(4, 137, 248, 5);
    c.fillStyle = '#e2a15c'; c.fillRect(34, 49, 188, 3);
    if (chimney) c.drawImage(chimney, 197, 21, 26, 45);
    if (window) { c.drawImage(window, 37, 155, 50, 41); c.drawImage(window, 169, 155, 50, 41); }
    if (door) c.drawImage(door, 109, 153, 39, 57);
    flowerBox(37, 194, 50); flowerBox(169, 194, 50, true);
    // The original file called "planta" contains a rug corner; draw actual pots here.
    flowerBox(154, 207, 37);
    pottedFlowers(21, 214); pottedFlowers(221, 214, true);
    c.fillStyle = '#c5b798'; c.fillRect(105, 212, 48, 4); c.fillStyle = '#e1d2ad'; c.fillRect(108, 211, 42, 2);
    c.fillStyle = '#4b6235';
    for (let y = 141; y < 193; y++) c.fillRect(235 + Math.round(Math.sin(y * 0.19) * 3), y, 1, 2);
    for (let n = 0; n < 12; n++) {
      const y = 144 + n * 4, x = 235 + Math.round(Math.sin(y * 0.19) * 3);
      const side = n % 2 ? -1 : 1;
      c.fillStyle = '#527b3d'; c.fillRect(x + side * 2 - 1, y, 4, 3);
      c.fillStyle = '#83a44d'; c.fillRect(x + side * 3, y, 2, 1);
      c.fillStyle = '#658b42'; c.fillRect(x + side * 4, y + 1, 2, 2);
    }
  });
}

export function setupVisualAssets(scene: Phaser.Scene): void {
  for (const direction of Object.keys(DIRECTIONS) as Direction[]) for (let frame = 0; frame < 6; frame++) {
    const image = sourceImage(scene, `character-${direction}-${frame}`);
    if (image) characterSources.set(`${direction}-${frame}`, image);
  }
  for (const [id, width, height] of [['stone', 26, 22], ['scrap', 32, 32], ['log', 40, 34], ['branch', 36, 32], ['fiber', 32, 34], ['seeds', 34, 38], ['vein', 44, 48], ['workbench', 40, 40]] as const) {
    fitSource(scene, `source-${id}`, `asset-${id}`, width, height, 1);
  }
  for (const [source, key, width, height] of [
    ['cerca_natural', 'asset-fence', 36, 28],
    ['barril', 'asset-barrel', 26, 30], ['vaso_flor', 'asset-flowerpot', 24, 28],
    ['parede_creme', 'imported-wall', 32, 48], ['parede_janela_floreira', 'imported-window', 32, 52],
    ['porta_madeira', 'imported-door', 30, 44],
  ] as const) fitSource(scene, `module-${source}`, key, width, height);
  setupNatureSprites(scene); createHouse(scene);
}
