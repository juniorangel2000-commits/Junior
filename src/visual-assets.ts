import Phaser from 'phaser';

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

/** Original procedural foliage complements the supplied object sprites without importing a poster as a map. */
function createFoliage(scene: Phaser.Scene, pine: boolean): void {
  const width = pine ? 72 : 88, height = pine ? 120 : 116;
  canvasTexture(scene, pine ? 'asset-pine' : 'asset-tree', width, height, c => {
    let seed = pine ? 82371 : 37109;
    const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
    const pixel = (color: string, x: number, y: number, w: number, h: number) => { c.fillStyle = color; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
    const cx = Math.floor(width / 2), base = height - 5;
    pixel('#253f3533', 8, base - 2, width - 16, 5); pixel('#253f3522', 3, base, width - 6, 3);
    pixel('#493d2d', cx - 6, 49, 14, base - 48); pixel('#765436', cx - 4, 49, 10, base - 48);
    pixel('#a47a47', cx - 3, 55, 3, base - 54); pixel('#c49a5c', cx - 3, 84, 1, 15);
    for (let i = 0; i < 14; i++) pixel(i % 3 ? '#5a412e' : '#b28a52', cx - 3 + random() * 9, 66 + random() * 39, 1, 3 + random() * 5);
    pixel('#675037', cx - 13, base - 3, 12, 4); pixel('#977347', cx - 13, base - 4, 9, 2);
    pixel('#675037', cx + 4, base - 2, 13, 3); pixel('#967345', cx + 5, base - 3, 11, 2);
    const palette = pine ? ['#244e3c', '#2c6043', '#39744b', '#4e8551', '#6e9b59', '#97b86a'] : ['#2b5135', '#3d6538', '#527e3e', '#709648', '#8eaa50', '#b1c765'];
    const clusters: Array<[number, number, number]> = pine
      ? [[cx, 15, 10], [cx, 28, 16], [cx, 43, 21], [cx, 58, 26], [cx, 71, 29]]
      : [[cx - 18, 44, 24], [cx + 18, 44, 25], [cx, 23, 24], [cx - 20, 64, 20], [cx + 20, 62, 21], [cx, 51, 29]];
    for (const [x, y, radius] of clusters) {
      for (let py = -radius; py <= radius; py += 3) for (let px = -radius; px <= radius; px += 3) {
        const inside = pine ? Math.abs(px) < (py + radius) * 0.7 + 2 : px * px + py * py < radius * radius;
        if (!inside) continue;
        const light = (1 - (px + radius) / (radius * 2)) * 1.7 + (1 - (py + radius) / (radius * 2)) * 1.2;
        const shade = Math.max(0, Math.min(5, Math.floor(light + random() * 2.1)));
        pixel(palette[shade], x + px, y + py, 3, 3);
        if (random() > 0.77) pixel(palette[Math.min(5, shade + 1)], x + px, y + py, 2, 1);
      }
    }
    // Deep canopy pockets and light leaf pairs create a readable organic silhouette.
    for (let i = 0; i < 95; i++) {
      const x = 10 + random() * (width - 20), y = 10 + random() * 68;
      const alpha = c.getImageData(Math.floor(x), Math.floor(y), 1, 1).data[3];
      if (!alpha) continue;
      pixel(palette[i % 4 + 1], x, y, 3, 2);
      if (i % 3 === 0) pixel(palette[5], x - 1, y - 1, 2, 1);
    }
  });
}

/** Assemble a facade from the approved cream/terracotta modules at the existing house footprint. */
function createHouse(scene: Phaser.Scene): void {
  canvasTexture(scene, 'asset-house', 256, 224, c => {
    const wall = sourceImage(scene, 'module-parede_creme');
    const roof = sourceImage(scene, 'module-telha_lisa');
    const door = sourceImage(scene, 'module-porta_madeira');
    const window = sourceImage(scene, 'module-janela_turquesa');
    const pot = sourceImage(scene, 'module-planta');
    const chimney = sourceImage(scene, 'module-chamine');
    c.fillStyle = '#344b3533'; c.fillRect(8, 209, 241, 11);
    c.fillStyle = '#d1b996'; c.fillRect(16, 125, 224, 85);
    if (wall) for (let x = 16; x < 240; x += 48) c.drawImage(wall, x, 136, 48, 74);
    c.fillStyle = '#70634c'; c.fillRect(16, 210, 224, 5);
    c.fillStyle = '#a7a58c'; c.fillRect(18, 210, 220, 2);
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
    c.fillStyle = '#c5b798'; c.fillRect(105, 212, 48, 4); c.fillStyle = '#e1d2ad'; c.fillRect(108, 211, 42, 2);
    if (pot) { c.drawImage(pot, 18, 189, 21, 26); c.drawImage(pot, 219, 189, 21, 26); }
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
  for (const [id, width, height] of [['stone', 40, 36], ['scrap', 32, 32], ['log', 40, 34], ['branch', 36, 32], ['fiber', 32, 34], ['seeds', 34, 38], ['vein', 42, 44], ['workbench', 40, 40]] as const) {
    fitSource(scene, `source-${id}`, `asset-${id}`, width, height, 1);
  }
  for (const [source, key, width, height] of [
    ['cerca_natural', 'asset-fence', 36, 28],
    ['barril', 'asset-barrel', 26, 30], ['vaso_flor', 'asset-flowerpot', 24, 28],
    ['parede_creme', 'imported-wall', 32, 48], ['parede_janela_floreira', 'imported-window', 32, 52],
    ['porta_madeira', 'imported-door', 30, 44],
  ] as const) fitSource(scene, `module-${source}`, key, width, height);
  createFoliage(scene, false); createFoliage(scene, true); createHouse(scene);
}
