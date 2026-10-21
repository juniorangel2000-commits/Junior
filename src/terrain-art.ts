import { getRegionAt, isBridgeTile, isFarmTile, TILE, WORLD_HEIGHT, WORLD_WIDTH } from './data/regions';
import { isWaterPoint, roadDistanceAt, waterDistanceAt } from './data/terrain-shape';
import type { TerrainSprites } from './terrain-sprites';
import type { TerrainDecoration } from './decor-sprites';

type RGB = readonly [number, number, number];
interface GroundTile { farm: boolean }

const WIDTH = WORLD_WIDTH * TILE;
const HEIGHT = WORLD_HEIGHT * TILE;
const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));
const smooth = (value: number): number => { const t = clamp(value, 0, 1); return t * t * (3 - 2 * t); };
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** Coordinate-based variation never consumes the resource-layout random stream. */
function hash(x: number, y: number, seed = 0): number {
  let value = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(seed, 1442695041);
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967296;
}

function noise(x: number, y: number, scale: number, seed: number): number {
  const gx = x / scale, gy = y / scale;
  const ix = Math.floor(gx), iy = Math.floor(gy);
  const fx = smooth(gx - ix), fy = smooth(gy - iy);
  return lerp(lerp(hash(ix, iy, seed), hash(ix + 1, iy, seed), fx),
    lerp(hash(ix, iy + 1, seed), hash(ix + 1, iy + 1, seed), fx), fy);
}

function color(rgb: RGB, light: number): string {
  return `rgb(${Math.round(clamp(rgb[0] + light, 0, 255))},${Math.round(clamp(rgb[1] + light, 0, 255))},${Math.round(clamp(rgb[2] + light * 0.7, 0, 255))})`;
}

function makeGrassPalettes(): string[][][] {
  const home: RGB = [116, 151, 72], forest: RGB = [66, 108, 69], fields: RGB = [145, 169, 82];
  return Array.from({ length: 9 }, (_, f) => Array.from({ length: 9 }, (_, m) => {
    const mix = home.map((channel, index) => lerp(lerp(channel, forest[index], f / 8), fields[index], m / 8)) as unknown as RGB;
    return Array.from({ length: 17 }, (_, light) => color(mix, (light - 8) * 3.2));
  }));
}

/**
 * Bake the nine drawn materials into one opaque, pixel-aligned map. Mirrored
 * sampling joins texture edges; world-space masks keep transitions independent
 * of the logical tile grid. No new terrain sprites are rendered each frame.
 */
function paintSpriteGround(ctx: CanvasRenderingContext2D, tiles: readonly GroundTile[], sprites: TerrainSprites): void {
  const image = ctx.createImageData(WIDTH, HEIGHT), target = image.data;
  const size = sprites.grass.size, period = size * 2;
  const grass = sprites.grass.pixels, forest = sprites.forest.pixels, meadow = sprites.meadow.pixels;
  const dry = sprites['path-dry'].pixels, wet = sprites['path-wet'].pixels;
  const soil = sprites.soil.pixels, sand = sprites.sand.pixels, moss = sprites.moss.pixels, water = sprites.water.pixels;
  for (let y = 0; y < HEIGHT; y += 2) {
    const fieldWeight = smooth((y - 38 * TILE) / (10 * TILE));
    const sy = y % period, sampleY = sy < size ? sy : period - sy - 1;
    const waterOffsetX = Math.round(Math.sin(y * 0.018) * 13 + Math.sin(y * 0.043) * 5);
    for (let x = 0; x < WIDTH; x += 2) {
      const tile = tiles[Math.floor(y / TILE) * WORLD_WIDTH + Math.floor(x / TILE)];
      const sx = x % period, sampleX = sx < size ? sx : period - sx - 1;
      const shoreField = waterDistanceAt(x + 1, y + 1), waterHere = shoreField < 0;
      const shore = Math.abs(shoreField);
      const forestWeight = smooth((x - 45 * TILE) / (12 * TILE)) * (1 - fieldWeight);
      const road = !waterHere && !tile.farm ? roadDistanceAt(x + 1, y + 1) : Infinity;
      const edge = road < 12 ? noise(x, y, 22, 92) * 10 - 5 : 0;
      // A short broken edge makes grass invade dirt without hiding the route.
      const roadWeight = smooth((edge + 5 - road) / 10);
      const damp = roadWeight ? smooth((noise(x, y, 86, 333) - 0.38) / 0.45) * 0.85 : 0;
      const bankWeight = !waterHere && !tile.farm && shore < 18 ? smooth((14 + noise(x, y, 26, 40) * 5 - shore) / 13) : 0;
      const mossWeight = !waterHere && !tile.farm ? smooth((noise(x, y, 112, 52) - 0.45) / 0.42) * 0.3 : 0;
      const light = (noise(x, y, 146, 71) - 0.5) * 13 + (noise(x, y, 38, 14) - 0.5) * 5;
      const shallow = waterHere ? smooth((22 - shore) / 22) : 0;
      const waterOffsetY = waterHere ? Math.round(Math.sin(x * 0.009 + y * 0.005) * 4) : 0;
      // Share only the mask calculation across 2×2 pixels, never the sprite
      // sample. Reading every pixel avoids aliasing away the small grass blades.
      for (let py = 0; py < 2; py++) for (let px = 0; px < 2; px++) {
        const sample = ((sampleY + (sy < size ? py : -py)) * size + sampleX + (sx < size ? px : -px)) * 4;
        const waterSample = waterHere ? (((y + py + waterOffsetY + size) % size) * size + (x + px + waterOffsetX + size) % size) * 4 : 0;
        const dest = ((y + py) * WIDTH + x + px) * 4;
        for (let channel = 0; channel < 3; channel++) {
          const index = sample + channel;
          let value: number;
          if (waterHere) {
            value = water[waterSample + channel] * (1 - shallow * 0.24) + [125, 176, 160][channel] * shallow * 0.24;
          } else if (tile.farm) {
            value = soil[index] + light * 0.5;
          } else {
            value = grass[index] * (1 - forestWeight - fieldWeight) + forest[index] * forestWeight + meadow[index] * fieldWeight;
            value = lerp(value, moss[index], mossWeight);
            if (roadWeight) value = lerp(value, lerp(dry[index], wet[index], damp), roadWeight);
            if (bankWeight) value = lerp(value, lerp(sand[index], wet[index], 0.4), bankWeight);
            value += light;
          }
          target[dest + channel] = clamp(Math.round(value), 0, 255);
        }
        target[dest + 3] = 255;
      }
    }
  }
  ctx.putImageData(image, 0, 0);
}

/**
 * A static, pixel-aligned ground layer. Detail is concentrated at paths and banks;
 * clear grass remains readable for resources and player-built structures.
 */
export function paintTerrain(ctx: CanvasRenderingContext2D, sprites?: TerrainSprites, decoration?: TerrainDecoration): void {
  ctx.imageSmoothingEnabled = false;
  const rect = (fill: string, x: number, y: number, w: number, h: number): void => {
    ctx.fillStyle = fill;
    ctx.fillRect(Math.floor(x), Math.floor(y), Math.ceil(w), Math.ceil(h));
  };
  const palettes = makeGrassPalettes();
  const roadColors = Array.from({ length: 7 }, (_, damp) => {
    const mixed = [192, 158, 103].map((channel, index) => lerp(channel, [150, 126, 85][index], damp / 6)) as unknown as RGB;
    return Array.from({ length: 9 }, (_, i) => color(mixed, (i - 4) * 2.4));
  });
  const waterColors = Array.from({ length: 10 }, (_, i) => color([60, 132, 153], (i - 4) * 3));
  const shallowColors = Array.from({ length: 8 }, (_, i) => color([101, 164, 164], (i - 3) * 3));
  const tiles: GroundTile[] = [];
  for (let ty = 0; ty < WORLD_HEIGHT; ty++) for (let tx = 0; tx < WORLD_WIDTH; tx++) {
    tiles.push({ farm: isFarmTile(tx, ty) });
  }

  if (sprites) paintSpriteGround(ctx, tiles, sprites);
  // Keep the previous procedural layer as a fallback if an atlas is unavailable.
  else for (let y = 0; y < HEIGHT; y += 4) for (let x = 0; x < WIDTH; x += 4) {
    const tile = tiles[Math.floor(y / TILE) * WORLD_WIDTH + Math.floor(x / TILE)];
    const shoreField = waterDistanceAt(x + 2, y + 2), waterHere = shoreField < 0;
    const shore = Math.abs(shoreField);
    const fine = hash(x >> 2, y >> 2, 34);
    if (waterHere) {
      const waves = Math.sin(x * 0.034 + y * 0.011) * 0.7 + noise(x, y, 80, 17) * 3;
      const shimmer = clamp(Math.floor(3 + waves + fine), 0, 9);
      const shallow = shore < 14 + noise(x, y, 26, 40) * 5;
      rect(shallow ? shallowColors[clamp(shimmer - 1, 0, 7)] : waterColors[shimmer], x, y, 4, 4);
      if (shore < 4 && fine > 0.54) rect('#a6c7b4', x, y, 4, 2);
      continue;
    }
    if (tile.farm) {
      const row = y % 12;
      rect(row < 4 ? '#7b5639' : row < 8 ? '#694a34' : '#735038', x, y, 4, 4);
      if (fine > 0.89) rect(row < 4 ? '#94704a' : '#815d3f', x, y + 1, 3, 1);
      continue;
    }
    const fieldWeight = smooth((y - 38 * TILE) / (10 * TILE));
    const forestWeight = smooth((x - 45 * TILE) / (12 * TILE)) * (1 - fieldWeight);
    const shade = noise(x, y, 146, 52) * 4 + noise(x, y, 382, 71) * 3 + noise(x, y, 35, 14) * 3 + noise(x, y, 13, 90) * 2;
    const light = clamp(Math.floor(2 + shade + fine * 0.7), 0, 16);
    let fill = palettes[Math.round(forestWeight * 8)][Math.round(fieldWeight * 8)][light];
    const road = roadDistanceAt(x + 2, y + 2);
    const edge = noise(x, y, 22, 92) * 10 - 5;
    if (road < edge) {
      const grit = clamp(Math.floor(2 + noise(x, y, 57, 81) * 4 + fine * 2), 0, 8);
      const damp = Math.round(smooth((noise(x, y, 86, 333) - 0.46) / 0.46) * 6);
      fill = roadColors[damp][grit];
    } else if (shore < 8 + fine * 3) {
      fill = fine > 0.55 ? '#867e56' : '#73784c';
    } else if (road < edge + 6 && fine > 0.47) {
      fill = '#9a9e5c';
    }
    rect(fill, x, y, 4, 4);
  }

  const pebble = (x: number, y: number, w: number, h: number, wet = false, chosenVariant?: number): void => {
    const variants = decoration?.paving ?? [];
    const variant = chosenVariant ?? Math.abs(Math.imul(Math.floor(x), 73856093) ^ Math.imul(Math.floor(y), 19349663));
    const art = wet && decoration?.shoreStones ? decoration.shoreStones : variants[variant % variants.length];
    if (art) {
      const height = Math.max(2, Math.round(w * art.height / art.width));
      ctx.drawImage(art, Math.round(x), Math.round(y + (h - height) / 2), Math.round(w), height);
      return;
    }
    rect(wet ? '#4d7675' : '#766d51', x + 1, y + h - 1, w, 2);
    rect(wet ? '#849d94' : '#afa58b', x + 2, y, w - 4, h);
    rect(wet ? '#849d94' : '#afa58b', x, y + 2, w, Math.max(1, h - 4));
    rect(wet ? '#aec4b1' : '#d2c3a1', x + 2, y, w - 5, 2);
    rect(wet ? '#66877f' : '#8f886e', x + w - 4, y + 2, 3, Math.max(1, h - 3));
    if (sprites && w >= 20) {
      const stone = sprites.paving;
      for (let py = 2; py < h - 2; py++) for (let px = 3; px < w - 3; px++) {
        const i = (((Math.floor(y + py) % stone.size) * stone.size + Math.floor(x + px) % stone.size) * 4);
        rect(`rgb(${stone.pixels[i]},${stone.pixels[i + 1]},${stone.pixels[i + 2]})`, x + px, y + py, 1, 1);
      }
    }
  };
  const tuft = (x: number, y: number, seed: number, bright = false): void => {
    const dark = bright ? '#658745' : '#476e40';
    const light = bright ? '#c2c778' : '#9cb75b';
    rect(dark, x - 4, y + 3, 10, 2);
    for (let blade = 0; blade < 4; blade++) {
      const bx = x - 4 + blade * 3, height = 3 + Math.floor(hash(seed, blade, 92) * 5);
      rect(dark, bx, y + 3 - height, 1, height);
      rect(light, bx + 1, y + 2 - height, 1, Math.max(2, height - 1));
    }
  };
  const puddle = (x: number, y: number, seed: number): void => {
    const w = 12 + Math.floor(hash(seed, 8, 55) * 18), h = 5 + Math.floor(hash(seed, 9, 55) * 7);
    if (sprites) {
      const source = sprites.water;
      for (let py = -1; py <= h; py++) {
        const inset = Math.floor(Math.abs(py - h / 2) * 0.85) + 1;
        for (let px = inset; px < w - inset; px++) {
          if (py < 1 || py >= h - 1 || px === inset || px >= w - inset - 1) {
            rect('#857953', x + px, y + py, 1, 1);
            continue;
          }
          const i = (((Math.floor(y + py) % source.size) * source.size + Math.floor(x + px) % source.size) * 4);
          rect(`rgb(${source.pixels[i]},${source.pixels[i + 1]},${source.pixels[i + 2]})`, x + px, y + py, 1, 1);
        }
      }
      rect('#b5cbbc', x + 5, y + 2, Math.max(3, Math.floor(w / 3)), 1);
      return;
    }
    rect('#8d8562', x + 3, y - 2, w - 4, h + 4);
    for (let sy = 0; sy < h; sy += 2) {
      const inset = Math.floor(Math.abs(sy - h / 2) * 0.7) + 1;
      rect(sy < h / 2 ? '#6e9c9e' : '#83afae', x + inset, y + sy, w - inset * 2, 2);
    }
    rect('#b9d0c0', x + 5, y + 2, Math.max(3, w / 3), 1);
    rect('#d8e0c1', x + w - 7, y + h - 3, 3, 1);
  };

  // Sparse groups of detail leave player resources and future buildings readable.
  for (let ty = 1; ty < WORLD_HEIGHT - 1; ty++) for (let tx = 1; tx < WORLD_WIDTH - 1; tx++) {
    const tile = tiles[ty * WORLD_WIDTH + tx];
    if (tile.farm || isBridgeTile(tx, ty)) continue;
    const seed = ty * WORLD_WIDTH + tx;
    const x = tx * TILE + 6 + Math.floor(hash(tx, ty, 801) * 20);
    const y = ty * TILE + 7 + Math.floor(hash(tx, ty, 802) * 18);
    const chance = hash(tx, ty, 803);
    const shoreField = waterDistanceAt(x, y), shore = Math.abs(shoreField);
    if (shoreField < 0) {
      if (shore < 15 && chance > 0.78) pebble(x - 4, y, 10, 6, true);
      if (chance > 0.6) {
        const width = 9 + Math.floor(chance * 8);
        for (let px = 0; px < width; px++) if (isWaterPoint(x + px, y)) rect('#8bc0bd', x + px, y, 1, 1);
        if (chance > 0.84) for (let px = 0; px < 6; px++) if (isWaterPoint(x + px + 3, y + 2)) rect('#c8e1ce', x + px + 3, y + 2, 1, 1);
      }
      continue;
    }
    const road = roadDistanceAt(x, y);
    if (road < -6) {
      if (chance > 0.83) puddle(x - 9, y, seed);
      else if (chance < 0.2) pebble(x - 4, y, 6 + Math.floor(chance * 24), 4);
      else if (chance > 0.48 && chance < 0.63) {
        rect('#dbc18b', x - 3, y, 3, 1); rect('#a28459', x + 2, y + 3, 4, 1);
      }
    } else if (road < 15 || shore < 18) {
      if (!sprites) tuft(x, y, seed, getRegionAt(tx, ty).id === 'open-fields');
      if (chance > 0.72) pebble(x + 4, y + 5, 8, 5, shore < 18);
      if (!sprites && chance < 0.3) tuft(x + 9, y + 4, seed + 3);
    } else if (!sprites && chance > 0.94) {
      tuft(x, y, seed, true);
      tuft(x - 8, y + 3, seed + 1);
    } else if (!sprites && chance < 0.055) {
      // Small clover patches are much lower than collectable plants.
      for (let n = 0; n < 4; n++) {
        const ox = Math.floor(hash(seed, n, 112) * 13) - 6;
        const oy = Math.floor(hash(seed, n, 113) * 7) - 3;
        rect('#698d45', x + ox, y + oy + 1, 4, 2);
        rect('#a0b75c', x + ox, y + oy, 3, 1);
      }
    }
  }

  // Rain-darkened border around the continuous garden, without changing any plot.
  for (let x = 21 * TILE - 3; x < 30 * TILE + 3; x += 3) {
    const bite = 2 + Math.floor(hash(x, 92, 35) * 4);
    rect('#8d7950', x, 20 * TILE - bite, 3, bite);
    rect('#8b734b', x, 25 * TILE, 3, bite);
  }
  for (let y = 20 * TILE; y < 25 * TILE; y += 3) {
    rect('#877449', 21 * TILE - 3, y, 3, 3);
    rect('#8c774a', 30 * TILE, y, 3, 3);
  }

  for (const [left, top, width] of [[42, 18, 7], [41, 52, 9]]) {
    const bx = left * TILE, by = top * TILE, bw = width * TILE;
    rect('#435e5040', bx - 3, by + 7, bw + 6, 60);
    rect('#624c34', bx, by + 2, bw, 60);
    if (sprites) {
      const timber = sprites.wood, deck = ctx.createImageData(bw, 52);
      for (let y = 0; y < 52; y++) for (let x = 0; x < bw; x++) {
        // Rotate the drawn boards to run across the walking direction.
        const source = ((x % timber.size) * timber.size + y % timber.size) * 4;
        const target = (y * bw + x) * 4;
        for (let channel = 0; channel < 3; channel++) deck.data[target + channel] = timber.pixels[source + channel];
        deck.data[target + 3] = 255;
      }
      ctx.putImageData(deck, bx, by + 4);
    }
    for (let x = 0; x < bw; x += 9) {
      if (!sprites) {
        rect(x % 3 ? '#ad8654' : '#bb935d', bx + x + 1, by + 4, 8, 52);
        rect('#d8b57b', bx + x + 1, by + 4, 2, 51);
        rect('#886443', bx + x + 4, by + 13 + Math.floor(hash(x, top, 13) * 20), 1, 13);
      } else rect('#72523766', bx + x, by + 4, 1, 52);
      rect('#5a4633', bx + x + 4, by + 9, 1, 1);
      rect('#5a4633', bx + x + 4, by + 49, 1, 1);
    }
    rect('#62482f', bx, by, bw, 5); rect('#d5b17a', bx, by, bw, 2);
    rect('#715139', bx, by + 56, bw, 5); rect('#bb925e', bx, by + 56, bw, 2);
    for (const x of [bx + 2, bx + bw - 8]) {
      rect('#6c4d32', x, by - 2, 7, 11); rect('#d6ad70', x, by - 2, 5, 3);
      rect('#6c4d32', x, by + 52, 7, 13); rect('#d6ad70', x, by + 52, 5, 3);
    }
  }
}
