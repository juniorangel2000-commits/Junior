import Phaser from 'phaser';
import { preloadCharacterSprites, setupCharacterSprites } from './character-sprites';
import { setupNatureSprites } from './nature-sprites';
import { setupTerrainSprites } from './terrain-sprites';
import { setupResourceSprites } from './resource-sprites';
import { setupDecorSprites } from './decor-sprites';
import { preloadHouseSprite, setupHouseSprite } from './house-sprites';
import { preloadToolArt } from './tool-visual';
import { WATER_EMPTY_ICON, WATER_FULL_ICON } from './data/watering-can';
import { TOOL_ICON_URLS } from './data/tool-art';

/** Local assets from the received packages and original tree/ground atlases. */
const BASE = 'assets/visual/';
const ICON_IDS = new Set(['wood', 'stone', 'branch', 'log', 'plank', 'scrap', 'hatchet', 'pickaxe', 'handsaw', 'fiber', 'cord', 'flakedStone', 'handle', 'blade', 'board', 'hammer', 'water', 'workbench', 'seeds']);
export function itemIconUrl(id: string): string | undefined {
  if (id === 'hatchet' || id === 'pickaxe') return TOOL_ICON_URLS[id];
  if (id === 'water-empty') return WATER_EMPTY_ICON;
  if (id === 'water' || id === 'water-full') return WATER_FULL_ICON;
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
export function preloadVisualAssets(scene: Phaser.Scene): void {
  preloadHouseSprite(scene);
  preloadCharacterSprites(scene);
  preloadToolArt(scene);
  scene.load.image('icon-water-empty', WATER_EMPTY_ICON);
  for (const id of ['water', 'seeds']) scene.load.image(`icon-${id}`, `${BASE}icons/${id}.png`);
  scene.load.image('nature-trees-source', `${BASE}nature/trees-approved.png`);
  scene.load.image('terrain-materials-source', `${BASE}terrain/ground-materials.png`);
  scene.load.image('terrain-finishes-source', `${BASE}terrain/floor-finishes.png`);
  scene.load.image('resource-atlas-source', `${BASE}resources/resource-atlas.png`);
  scene.load.image('nature-decor-source', `${BASE}nature/decorations.png`);
  for (const [id, path] of Object.entries(WORLD_SOURCES)) scene.load.image(`source-${id}`, `${BASE}${path}`);
  for (const id of MODULES) scene.load.image(`module-${id}`, `${BASE}modules/${id}.png`);
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
    const timber = (x: number, y: number, width: number, height: number) => {
      pixel('#513d2c', x, y, width, height);
      pixel('#91663e', x + 1, y + 1, width - 2, height - 2);
      pixel('#bd9057', x + 1, y + 1, Math.max(1, width - 3), 1);
      if (height > width) {
        pixel('#b0824c', x + 1, y + 2, 1, height - 4);
        pixel('#704b31', x + width - 2, y + 4, 1, height - 6);
      } else pixel('#704b31', x + 3, y + height - 2, width - 5, 1);
    };
    const flowers = (x: number, y: number, width: number, pink = false) => {
      const source = sourceImage(scene, pink ? 'asset-flowers-pink' : 'asset-flowers-white');
      if (source) {
        const count = Math.max(1, Math.ceil(width / 18)), step = width / count;
        for (let n = 0; n < count; n++) {
          const w = Math.round(step + (n < count - 1 ? 2 : 0));
          const h = Math.round(w * source.height / source.width);
          c.drawImage(source, Math.round(x + n * step), y - h + 2 - n % 2, w, h);
        }
        return;
      }
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
    // A repaired attic makes this refuge distinct without changing its footprint.
    pixel('#705038', 108, 96, 41, 32);
    pixel('#c8b58c', 110, 97, 37, 27);
    if (wall) c.drawImage(wall, 110, 97, 37, 27);
    timber(108, 97, 4, 29); timber(145, 97, 4, 29);
    if (window) c.drawImage(window, 116, 100, 25, 22);
    timber(109, 123, 39, 4);
    c.save();
    c.beginPath(); c.moveTo(128, 80); c.lineTo(155, 98); c.lineTo(101, 98); c.closePath(); c.clip();
    pixel('#aa693d', 101, 80, 54, 19);
    if (roof) c.drawImage(roof, 3, 4, 56, 64, 100, 79, 56, 64);
    c.restore();
    timber(103, 97, 51, 3);
    // Small moss seams and replacement tiles suggest years of rain and repair.
    for (const [x, y] of [[51, 117], [59, 119], [185, 129], [193, 128], [226, 124]]) {
      pixel('#62713e', x, y, 5, 2); pixel('#879051', x + 1, y, 2, 1);
    }
    pixel('#dd9b57', 166, 104, 7, 4); pixel('#9c5e38', 166, 108, 7, 1);
    pixel('#cf8a4e', 173, 87, 6, 3); pixel('#9c5e38', 173, 90, 6, 1);
    if (chimney) c.drawImage(chimney, 197, 21, 26, 45);
    // Timber portal and shallow porch retain the exact door and doorstep anchors.
    timber(103, 150, 5, 60); timber(149, 150, 5, 60);
    timber(103, 149, 51, 6);
    pixel('#3f4031', 101, 145, 55, 5);
    pixel('#9b5b35', 102, 142, 53, 5);
    if (roof) c.drawImage(roof, 3, 44, 56, 8, 101, 141, 56, 8);
    pixel('#d89551', 105, 141, 47, 1);
    for (const x of [105, 151]) {
      pixel('#473c2e', x, 158, 1, 2); pixel('#d7c290', x, 157, 1, 1);
      pixel('#473c2e', x, 204, 1, 2); pixel('#d7c290', x, 203, 1, 1);
    }
    if (window) { c.drawImage(window, 37, 155, 50, 41); c.drawImage(window, 169, 155, 50, 41); }
    if (door) c.drawImage(door, 109, 153, 39, 57);
    // The entrance lantern is warm and readable, with no extra obstacle on the path.
    pixel('#514232', 96, 159, 7, 2); pixel('#514232', 96, 160, 2, 5);
    pixel('#303e37', 92, 165, 10, 13); pixel('#d5ae61', 94, 167, 6, 8);
    pixel('#f1d999', 95, 168, 3, 6); pixel('#fff0ba', 96, 168, 1, 5);
    pixel('#5e5239', 92, 177, 10, 2); pixel('#34463c', 93, 163, 8, 2);
    pixel('#88724b', 95, 179, 4, 1);
    // One carefully mended shutter and plaster chips keep the house lived-in.
    timber(203, 180, 12, 3);
    pixel('#524936', 204, 181, 1, 1); pixel('#524936', 213, 181, 1, 1);
    pixel('#a28e68', 92, 194, 6, 2); pixel('#bba87f', 90, 196, 9, 2);
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
  setupCharacterSprites(scene);
  setupResourceSprites(scene);
  for (const [id, width, height] of [['stone', 26, 22], ['scrap', 32, 32], ['log', 40, 34], ['branch', 36, 32], ['fiber', 32, 34], ['seeds', 34, 38], ['vein', 44, 48], ['workbench', 40, 40]] as const) {
    if (!scene.textures.exists(`asset-${id}`)) fitSource(scene, `source-${id}`, `asset-${id}`, width, height, 1);
  }
  for (const [source, key, width, height] of [
    ['cerca_natural', 'asset-fence', 36, 28],
    ['barril', 'asset-barrel', 26, 30], ['vaso_flor', 'asset-flowerpot', 24, 28],
    ['parede_creme', 'imported-wall', 32, 48], ['parede_janela_floreira', 'imported-window', 32, 52],
    ['porta_madeira', 'imported-door', 30, 44],
  ] as const) fitSource(scene, `module-${source}`, key, width, height);
  setupDecorSprites(scene); setupNatureSprites(scene); setupTerrainSprites(scene);
  if (!setupHouseSprite(scene)) createHouse(scene);
}
