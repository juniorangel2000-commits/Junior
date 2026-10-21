import Phaser from 'phaser';

type Pixel = (color: string, x: number, y: number, width: number, height: number) => void;

function texture(scene: Phaser.Scene, key: string, width: number, height: number, paint: (c: CanvasRenderingContext2D, p: Pixel) => void): void {
  if (scene.textures.exists(key)) return;
  const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
  const c = canvas.getContext('2d')!; c.imageSmoothingEnabled = false;
  const pixel: Pixel = (color, x, y, w, h) => { c.fillStyle = color; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
  paint(c, pixel);
  scene.textures.addCanvas(key, canvas)?.setFilter(Phaser.Textures.FilterMode.NEAREST);
}

function randomSource(seed: number): () => number {
  return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
}

/** One stable feet pivot for all static tree variants, independent of their canopy. */
function importedTree(scene: Phaser.Scene, pine: boolean, variant: number, key: string): boolean {
  if (!scene.textures.exists('nature-trees-source')) return false;
  const source = scene.textures.get('nature-trees-source').getSourceImage() as HTMLImageElement | HTMLCanvasElement;
  if (!source.width || !source.height) return false;
  const row = pine ? 1 : 0;
  const sx = Math.round(source.width * variant / 3);
  // The tallest pine tips begin slightly above the sheet's horizontal midpoint.
  const sy = row ? Math.round(source.height * 0.484) : 0;
  const sw = Math.round(source.width * (variant + 1) / 3) - sx;
  const sh = Math.round(source.height * (row + 1) / 2) - sy;
  const sample = document.createElement('canvas'); sample.width = sw; sample.height = sh;
  const c = sample.getContext('2d', { willReadFrequently: true })!;
  c.imageSmoothingEnabled = false; c.drawImage(source, sx, sy, sw, sh, 0, 0, sw, sh);
  const pixels = c.getImageData(0, 0, sw, sh);
  const data = pixels.data;
  let minX = sw, minY = sh, maxX = -1, maxY = -1;
  for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) {
    const alpha = (y * sw + x) * 4 + 3;
    // Remove the soft generation halo and small intrusions from neighboring cells.
    data[alpha] = data[alpha] >= 128 && x >= sw * 0.04 && x <= sw * 0.98 ? 255 : 0;
    if (!data[alpha]) continue;
    minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
  }
  if (maxX <= minX || maxY <= minY) return false;
  // Locate the bottom of the warm brown trunk, rather than centering a wide canopy.
  let ground = maxY, trunkX = (minX + maxX) / 2;
  let lowestBrown = -1;
  const brown: Array<{ x: number; y: number }> = [];
  for (let y = Math.floor(minY + (maxY - minY) * 0.68); y <= maxY; y++) {
    for (let x = Math.floor(sw * 0.3); x <= Math.ceil(sw * 0.7); x++) {
      const i = (y * sw + x) * 4, r = data[i], g = data[i + 1], b = data[i + 2];
      if (data[i + 3] > 180 && r > 45 && r > g * 1.13 && g > b * 1.08) {
        lowestBrown = Math.max(lowestBrown, y); brown.push({ x, y });
      }
    }
  }
  if (lowestBrown >= 0) {
    const roots = brown.filter(point => point.y >= lowestBrown - 8);
    trunkX = roots.reduce((sum, point) => sum + point.x, 0) / roots.length;
    ground = lowestBrown;
  }
  maxY = Math.min(maxY, ground + 4);
  for (let y = maxY + 1; y < sh; y++) for (let x = 0; x < sw; x++) data[(y * sw + x) * 4 + 3] = 0;
  c.putImageData(pixels, 0, 0);
  // One scale for the complete sheet preserves young/mature size differences.
  const scale = Math.min(100 / (source.width / 3 * 0.92), 124 / (source.height / 2 * 0.94));
  const dx = Math.round(52 - (trunkX - minX) * scale);
  const dy = Math.round(128 - (ground - minY + 1) * scale);
  texture(scene, key, 104, 132, context => {
    context.drawImage(sample, minX, minY, maxX - minX + 1, maxY - minY + 1,
      dx, dy, Math.round((maxX - minX + 1) * scale), Math.round((maxY - minY + 1) * scale));
  });
  return true;
}

/** Original fallback stays readable and varies its silhouette even without the atlas. */
function fallbackTree(scene: Phaser.Scene, pine: boolean, variant: number, key: string): void {
  texture(scene, key, 104, 132, (_c, p) => {
    const random = randomSource((pine ? 82371 : 37109) + variant * 7127), cx = 52, base = 128;
    p('#253f352b', 18, 123, 70, 5); p('#253f3518', 11, 126, 82, 4);
    p('#443b2c', cx - 7, 53, 15, 75); p('#745236', cx - 5, 54, 11, 73);
    p('#a57b48', cx - 4, 59, 4, 67); p('#c09a59', cx - 4, 89, 2, 24);
    p('#63482e', cx - 18, base - 5, 16, 5); p('#8e673e', cx - 17, base - 6, 11, 3);
    p('#604830', cx + 4, base - 4, 16, 4); p('#9c7545', cx + 5, base - 5, 11, 2);
    for (let i = 0; i < 18; i++) p(i % 3 ? '#4f3e2c' : '#b18a52', cx - 4 + random() * 10, 64 + random() * 58, 1, 3 + random() * 7);
    const palette = pine
      ? ['#244a38', '#2b583e', '#396947', '#4f7f4d', '#6b9657', '#92ae68']
      : ['#294e32', '#3d6135', '#54783a', '#709445', '#8eaa4f', '#b0c368'];
    const clusters: Array<[number, number, number, number]> = pine
      ? [[cx - variant, 14, 11, 18], [cx + 2, 30, 18, 22], [cx - 3, 47, 25, 24], [cx + 2, 66, 31, 25], [cx - 2, 83, 35, 22]]
      : [[cx - 20 - variant * 2, 50, 25, 25], [cx + 21, 48 + variant * 3, 27, 28], [cx + variant * 3, 26, 26, 25], [cx - 20, 74, 22, 23], [cx + 24 - variant, 72, 25, 22], [cx - 1, 56, 30, 31]];
    for (const [x, y, rx, ry] of clusters) {
      for (let py = -ry; py <= ry; py += 2) for (let px = -rx; px <= rx; px += 2) {
        const edge = pine ? Math.abs(px) / rx - (py + ry) / (ry * 2) : px * px / (rx * rx) + py * py / (ry * ry) - 1;
        if (edge > (pine ? 0.08 : 0) || random() < 0.018) continue;
        const light = (1 - (px + rx) / (rx * 2)) * 2.1 + (1 - (py + ry) / (ry * 2)) * 1.7;
        const detail = Math.sin((x + px) * 0.2) + Math.cos((y + py) * 0.27);
        const shade = Math.max(0, Math.min(5, Math.floor(light + detail * 0.5 + random() * 0.8)));
        p(palette[shade], x + px, y + py, 2, 2);
        if (random() > 0.88) p(palette[Math.min(5, shade + 1)], x + px, y + py, 2, 1);
      }
    }
  });
}

function createSmallPlants(scene: Phaser.Scene): void {
  texture(scene, 'asset-fern', 32, 30, (_c, p) => {
    p('#294b342b', 3, 26, 27, 3);
    for (const [dx, dy, length] of [[-1, -2, 11], [-1, -1, 12], [1, -2, 10], [1, -1, 13], [-2, -1, 7], [2, -1, 7]]) {
      for (let step = 0; step < length; step++) {
        const x = 16 + dx * step * 0.8, y = 27 + dy * step;
        p('#3e6d3e', x, y, 1, 2); p('#709645', x - 2, y - 1, 3, 1); p('#91ad52', x + 1, y, 2, 1);
        if (step > 2) { p('#4b7c40', x - 3, y + 1, 3, 1); p('#668e43', x + 1, y + 2, 3, 1); }
      }
    }
  });
  for (const pink of [false, true]) texture(scene, pink ? 'asset-flowers-pink' : 'asset-flowers-white', 32, 26, (_c, p) => {
    const random = randomSource(pink ? 33211 : 71193);
    p('#304f3222', 3, 23, 25, 2);
    for (let n = 0; n < 9; n++) {
      const x = 4 + Math.floor(random() * 23), y = 8 + Math.floor(random() * 13);
      p('#426b36', x, y + 1, 1, 24 - y); p('#739348', x - 2, y + 6, 3, 1); p('#62863f', x + 1, y + 9, 3, 1);
      p(pink ? '#a25377' : '#c1bd8e', x - 2, y, 5, 3);
      p(pink ? '#df8fa6' : '#eee5c4', x - 1, y - 1, 3, 5);
      p(pink ? '#f1b4bd' : '#fff3d6', x - 2, y, 5, 1); p('#d4ad54', x, y + 1, 1, 1);
    }
  });
  texture(scene, 'asset-grass-tuft', 28, 24, (_c, p) => {
    p('#35523724', 4, 21, 22, 2);
    for (const [x, y] of [[4, 15], [8, 9], [11, 13], [14, 5], [18, 11], [22, 9]]) {
      p('#547c3e', x, y, 1, 22 - y); p('#88a24f', x + 1, y - 1, 1, 21 - y);
      p('#6f9347', x - 2, y + 5, 3, 1); p('#a7b665', x, y - 2, 1, 2);
    }
  });
  texture(scene, 'asset-shore-stones', 38, 22, (_c, p) => {
    p('#34534928', 1, 17, 36, 4);
    for (const [x, y, w, h] of [[3, 12, 12, 7], [14, 7, 16, 11], [29, 14, 7, 5]]) {
      p('#68776a', x, y + 2, w, h - 1); p('#94a092', x + 1, y, w - 2, h - 1);
      p('#b9bfaa', x + 2, y, w - 5, 2); p('#788e60', x + w - 5, y + h - 3, 5, 3);
    }
  });
}

export function setupNatureSprites(scene: Phaser.Scene): void {
  for (const pine of [false, true]) for (let variant = 0; variant < 3; variant++) {
    const key = `${pine ? 'asset-pine' : 'asset-tree'}-${variant}`;
    if (!importedTree(scene, pine, variant, key)) fallbackTree(scene, pine, variant, key);
  }
  for (const key of ['asset-tree', 'asset-pine']) {
    const source = scene.textures.get(`${key}-0`).getSourceImage() as HTMLCanvasElement;
    texture(scene, key, source.width, source.height, c => c.drawImage(source, 0, 0));
  }
  createSmallPlants(scene);
}
