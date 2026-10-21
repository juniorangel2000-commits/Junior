import type Phaser from 'phaser';
import { FLOOR_STYLES, FURNITURE_CATALOG, FURNITURE_KINDS, HOME_HEIGHT, HOME_TILE, HOME_WIDTH, WALL_STYLES } from './systems/home';
import type { FloorStyle, FurnitureKind, HomeData, WallStyle } from './systems/home';

type Paint = CanvasRenderingContext2D;
const COLORS = { outline: '#423e32', wood: '#987047', light: '#c69b60', dark: '#654832', teal: '#497879', cream: '#e7dbb9' };

function rect(ctx: Paint, color: string, x: number, y: number, width: number, height: number): void {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, width, height);
}

function speckle(ctx: Paint, x: number, y: number, width: number, height: number, light: string, dark: string): void {
  for (let sy = y + 2; sy < y + height - 1; sy += 3) for (let sx = x + 2; sx < x + width - 2; sx += 7) {
    const seed = (sx * 13 + sy * 29) % 31;
    if (seed < 8) rect(ctx, seed < 4 ? light : dark, sx, sy, seed % 3 + 1, 1);
  }
}

function wood(ctx: Paint, x: number, y: number, width: number, height: number, vertical = false): void {
  rect(ctx, COLORS.outline, x, y, width, height);
  rect(ctx, COLORS.wood, x + 1, y + 1, width - 2, height - 2);
  rect(ctx, COLORS.light, x + 1, y + 1, width - 2, 2);
  rect(ctx, COLORS.dark, x + 1, y + height - 3, width - 2, 2);
  for (let offset = 9; offset < (vertical ? width : height); offset += 10) {
    rect(ctx, '#775334', x + (vertical ? offset : 1), y + (vertical ? 1 : offset), vertical ? 1 : width - 2, vertical ? height - 2 : 1);
    rect(ctx, '#b38955', x + (vertical ? offset + 1 : 2), y + (vertical ? 2 : offset + 1), vertical ? 1 : width - 4, vertical ? height - 4 : 1);
  }
  speckle(ctx, x, y, width, height, '#bd955d', '#805b3b');
}

function shadow(ctx: Paint, width: number, bottom: number): void {
  rect(ctx, '#493e3248', 4, bottom - 6, width - 6, 6);
  rect(ctx, '#493e3228', 1, bottom - 4, width - 2, 3);
}

function window(ctx: Paint, x: number): void {
  wood(ctx, x - 5, 13, 53, 40);
  rect(ctx, '#34585a', x, 16, 43, 32);
  rect(ctx, '#577e7d', x + 3, 19, 37, 26);
  rect(ctx, '#95aca0', x + 5, 20, 14, 9);
  rect(ctx, '#748f86', x + 24, 20, 13, 9);
  rect(ctx, '#718d83', x + 5, 33, 14, 9);
  rect(ctx, '#3c6768', x + 24, 33, 13, 9);
  rect(ctx, '#d0bd8e', x + 20, 17, 3, 30);
  rect(ctx, '#d0bd8e', x + 2, 29, 40, 3);
  rect(ctx, '#eadcbb', x - 3, 14, 7, 32);
  rect(ctx, '#c7b893', x - 1, 17, 2, 25);
  rect(ctx, '#eadcbb', x + 39, 14, 7, 32);
  rect(ctx, '#c7b893', x + 41, 17, 2, 25);
  wood(ctx, x - 7, 49, 57, 6);
}

function room(ctx: Paint, floor: FloorStyle, wall: WallStyle, finishes?: CanvasImageSource): void {
  const width = HOME_WIDTH * HOME_TILE, height = HOME_HEIGHT * HOME_TILE;
  rect(ctx, '#263b35', 0, 0, width, height);
  rect(ctx, '#514538', 9, 6, width - 18, height - 10);
  rect(ctx, FLOOR_STYLES[floor].color, 29, 60, width - 58, height - 85);
  const stone = floor === 'stone';
  const palette = floor === 'oak' ? ['#a58052', '#b08b59', '#aa8354', '#b58b56']
    : floor === 'dark' ? ['#745844', '#7a5c47', '#70513f', '#80614b'] : ['#8d8f82', '#9b9c8d', '#959586', '#858b80'];
  const rowHeight = stone ? 24 : 16, plankWidth = stone ? 39 : 65;
  for (let y = 64, row = 0; y < height - 31; y += rowHeight, row++) {
    for (let x = 32 - (row % 2) * Math.floor(plankWidth / 2), col = 0; x < width - 32; x += plankWidth, col++) {
      const start = Math.max(32, x), end = Math.min(width - 32, x + plankWidth - 1);
      const bottom = Math.min(height - 32, y + rowHeight - 1);
      rect(ctx, palette[(row + col * 3) % palette.length], start, y, end - start, bottom - y);
      rect(ctx, stone ? '#b1b1a0' : floor === 'oak' ? '#c39a65' : '#947253', start, y, end - start, 1);
      rect(ctx, stone ? '#696f65' : '#654d38', start, bottom, end - start, 1);
      speckle(ctx, start, y, end - start, bottom - y, stone ? '#acaf9c' : '#bf9863', stone ? '#797f73' : '#806344');
      if (!stone && end - start > 30) {
        rect(ctx, floor === 'oak' ? '#967347' : '#654b3b', start + 12, y + 8, 11, 1);
        rect(ctx, '#65513e', start + 10, y + 9, 3, 1);
      }
    }
  }
  if (finishes) {
    // Reuse the approved floor atlas at a uniform scale so the interior has
    // the same grain density as the repaired structures in the outside world.
    ctx.save();
    ctx.beginPath(); ctx.rect(32, 64, width - 64, height - 96); ctx.clip();
    ctx.globalAlpha = stone ? .76 : .6;
    for (let y = 64; y < height - 32; y += 160) for (let x = 32; x < width - 32; x += 160) {
      ctx.drawImage(finishes, stone ? 887 : 0, 0, 887, 887, x, y, 160, 160);
    }
    if (floor === 'dark') {
      ctx.globalAlpha = .42;
      rect(ctx, '#3a3032', 32, 64, width - 64, height - 96);
    }
    ctx.restore();
  }
  // Repaired plaster, exposed beams and rain-muted windows preserve the house's
  // cream / terracotta / turquoise palette without borrowing external art.
  rect(ctx, WALL_STYLES[wall].color, 24, 8, width - 48, 51);
  speckle(ctx, 25, 9, width - 50, 48, '#e2d3b0', wall === 'sage' ? '#8b9b83' : '#b4a383');
  for (const x of [23, 122, 246, width - 31]) wood(ctx, x, 6, 9, 58, true);
  wood(ctx, 23, 5, width - 46, 8);
  wood(ctx, 23, 56, width - 46, 8);
  window(ctx, 54);
  window(ctx, 275);
  // A battered notice board, useful-looking supplies and a single warm lantern.
  wood(ctx, 160, 20, 57, 28);
  rect(ctx, '#d0b78a', 163, 23, 51, 22);
  rect(ctx, '#eadcbc', 169, 26, 14, 15);
  rect(ctx, '#c7aa7b', 170, 38, 12, 2);
  rect(ctx, '#9b8d6b', 172, 29, 8, 1);
  rect(ctx, '#9b8d6b', 172, 32, 6, 1);
  rect(ctx, '#bf9c66', 190, 27, 16, 12);
  rect(ctx, '#627b67', 192, 29, 5, 6);
  rect(ctx, '#3f4537', 227, 24, 9, 15);
  rect(ctx, '#ead095', 229, 27, 5, 9);
  rect(ctx, '#ffe0a7', 230, 28, 3, 6);
  rect(ctx, '#726449', 230, 20, 3, 5);
  rect(ctx, '#f6d89718', 215, 40, 33, 21);
  // Border boards and threshold are visual; their collision comes from home.ts.
  wood(ctx, 20, 62, 12, height - 77, true);
  wood(ctx, width - 32, 62, 12, height - 77, true);
  wood(ctx, 20, height - 32, 140, 16);
  wood(ctx, 224, height - 32, 140, 16);
  rect(ctx, '#cab18a', 160, height - 31, 64, 25);
  for (let x = 162; x < 224; x += 10) {
    rect(ctx, '#8e7656', x, height - 30, 1, 22);
    rect(ctx, '#e4c798', x + 2, height - 29, 6, 2);
  }
  rect(ctx, '#6b5b44', 160, height - 7, 64, 3);
  rect(ctx, '#d1b17e', 162, height - 6, 60, 2);
  // Soft contact shade joins the tall wall with the top-down floor.
  rect(ctx, '#3a342833', 32, 64, width - 64, 6);
  rect(ctx, '#3a342815', 32, 70, width - 64, 4);
}

function furniture(ctx: Paint, kind: FurnitureKind, width: number, height: number): void {
  if (kind === 'rug') {
    rect(ctx, '#5e46352b', 3, 4, width - 4, height - 3);
    rect(ctx, '#c0aa7a', 4, 4, width - 8, height - 8);
    rect(ctx, '#8c5c42', 7, 6, width - 14, height - 12);
    rect(ctx, '#c2a06a', 10, 9, width - 20, height - 18);
    rect(ctx, '#527570', 12, 11, width - 24, height - 22);
    for (let y = 14; y < height - 12; y += 8) for (let x = 15; x < width - 14; x += 8) {
      rect(ctx, '#6f8b79', x, y, 2, 1);
      rect(ctx, '#42645f', x + 4, y + 4, 3, 1);
    }
    for (let x = 12; x < width - 12; x += 12) {
      rect(ctx, '#ead7a1', x, 7, 4, 2); rect(ctx, '#ead7a1', x, height - 10, 4, 2);
      rect(ctx, '#c0aa7a', x - 4, 1, 1, 3); rect(ctx, '#c0aa7a', x - 4, height - 4, 1, 3);
    }
    for (let d = -10; d <= 10; d += 2) rect(ctx, '#d6b879', width / 2 - 11 + Math.abs(d), height / 2 + d / 2, 22 - Math.abs(d) * 2, 1);
    rect(ctx, '#8a5d45', width / 2 - 3, height / 2 - 2, 6, 5);
    return;
  }
  shadow(ctx, width, height);
  if (kind === 'bed') {
    wood(ctx, 5, 6, 53, 69, true);
    wood(ctx, 3, 5, 57, 14);
    wood(ctx, 4, 62, 56, 16);
    rect(ctx, '#d6ccb0', 9, 20, 44, 43);
    rect(ctx, '#f0e6c8', 11, 20, 40, 14);
    rect(ctx, '#c1b79c', 12, 21, 15, 10);
    rect(ctx, '#f4ebd3', 13, 20, 15, 9);
    rect(ctx, '#c1b79c', 33, 21, 15, 10);
    rect(ctx, '#eee4c8', 34, 20, 15, 9);
    rect(ctx, '#3d6969', 9, 35, 44, 28);
    rect(ctx, '#5c8a83', 10, 35, 42, 4);
    rect(ctx, '#74a095', 12, 36, 38, 1);
    rect(ctx, '#315757', 9, 60, 44, 5);
    for (let x = 13; x < 51; x += 7) {
      rect(ctx, '#81a89a', x, 40, 1, 17);
      rect(ctx, '#406e6b', x + 3, 41, 2, 18);
    }
    rect(ctx, '#c7a06a', 6, 67, 51, 2);
    rect(ctx, '#d3b47c', 8, 69, 47, 2);
    rect(ctx, '#4c3a2c', 6, 77, 6, 6); rect(ctx, '#4c3a2c', 50, 77, 6, 6);
  } else if (kind === 'table') {
    wood(ctx, 8, 22, 7, 51, true); wood(ctx, 49, 22, 7, 51, true);
    wood(ctx, 4, 17, 56, 45);
    rect(ctx, '#5d422d', 4, 58, 56, 5);
    rect(ctx, '#b68c56', 6, 20, 52, 3);
    // A map, a clay mug and an amber jar make the salvaged table feel inhabited.
    rect(ctx, '#5b48353d', 14, 30, 22, 18);
    rect(ctx, '#e2d0a7', 13, 28, 22, 18);
    rect(ctx, '#bba675', 14, 29, 20, 1);
    rect(ctx, '#849777', 16, 32, 6, 4);
    rect(ctx, '#9ca885', 21, 36, 6, 4);
    rect(ctx, '#bba779', 18, 39, 11, 1);
    rect(ctx, '#6d5740', 42, 36, 9, 2);
    rect(ctx, '#b77f50', 41, 26, 8, 10);
    rect(ctx, '#d8aa72', 42, 26, 6, 2);
    rect(ctx, '#6c4931', 42, 27, 5, 2);
    rect(ctx, '#a47346', 49, 28, 3, 5);
  } else if (kind === 'chair') {
    wood(ctx, 4, 9, 24, 27);
    wood(ctx, 5, 12, 4, 32, true); wood(ctx, 23, 12, 4, 32, true);
    rect(ctx, '#b8925b', 10, 14, 12, 12);
    rect(ctx, '#715436', 15, 15, 2, 12);
    wood(ctx, 3, 29, 26, 15);
    rect(ctx, '#477470', 6, 29, 20, 10);
    rect(ctx, '#7d9b83', 8, 30, 16, 2);
    rect(ctx, '#315a55', 7, 37, 18, 2);
    wood(ctx, 5, 43, 4, 9, true); wood(ctx, 23, 43, 4, 9, true);
  } else if (kind === 'shelf') {
    wood(ctx, 4, 5, 56, 57);
    rect(ctx, '#5c4533', 9, 11, 46, 43);
    for (const y of [12, 34]) {
      const colors = ['#748467', '#a3764b', '#527a78', '#b5a37b', '#8c5e47'];
      for (let index = 0; index < 5; index++) {
        const x = 12 + index * 8, bookHeight = 13 + index % 3;
        rect(ctx, '#312f28', x, y + 2, 6, bookHeight + 1);
        rect(ctx, colors[index], x, y + 1, 5, bookHeight);
        rect(ctx, '#d8bc81', x + 1, y + 3, 3, 1);
        rect(ctx, '#d8bc81', x + 1, y + bookHeight - 2, 3, 1);
      }
    }
    wood(ctx, 7, 28, 50, 6);
    wood(ctx, 7, 51, 50, 7);
    rect(ctx, '#4d392b', 7, 60, 5, 6); rect(ctx, '#4d392b', 52, 60, 5, 6);
  } else {
    rect(ctx, '#6e4b35', 9, 37, 15, 17);
    rect(ctx, '#ad7048', 10, 37, 13, 15);
    rect(ctx, '#d29a68', 11, 39, 3, 10);
    rect(ctx, '#815236', 21, 40, 2, 10);
    rect(ctx, '#b17d50', 7, 34, 19, 6);
    rect(ctx, '#d3a06d', 8, 34, 17, 2);
    rect(ctx, '#584431', 10, 33, 13, 2);
    rect(ctx, '#3b5d3a', 15, 15, 3, 19);
    const leaves: Array<[number, number, number, number, string]> = [
      [5, 20, 12, 6, '#4b773e'], [4, 17, 8, 5, '#739549'], [17, 14, 11, 6, '#54833f'],
      [21, 12, 7, 5, '#82a54d'], [9, 8, 8, 10, '#3e723d'], [11, 7, 5, 7, '#89a652'],
      [17, 26, 11, 6, '#3c713e'], [20, 24, 8, 4, '#7b9e4c'], [5, 28, 11, 5, '#58813d'],
      [6, 26, 5, 4, '#91aa56'],
    ];
    for (const [x, y, w, h, color] of leaves) rect(ctx, color, x, y, w, h);
  }
}

function texture(scene: Phaser.Scene, name: string, width: number, height: number, paint: (ctx: Paint) => void): void {
  if (scene.textures.exists(name)) return;
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  paint(ctx);
  scene.textures.addCanvas(name, canvas);
}

/** Original pixel textures, cached once. Every floor and wall choice shares
 * collision geometry; furniture footprints never depend on texture dimensions. */
export function createHomeArt(scene: Phaser.Scene): void {
  const finishes = scene.textures.exists('terrain-finishes-source')
    ? scene.textures.get('terrain-finishes-source').getSourceImage() as CanvasImageSource : undefined;
  for (const floor of Object.keys(FLOOR_STYLES) as FloorStyle[]) {
    for (const wall of Object.keys(WALL_STYLES) as WallStyle[]) {
      texture(scene, `home-room-${floor}-${wall}`, HOME_WIDTH * HOME_TILE, HOME_HEIGHT * HOME_TILE, ctx => room(ctx, floor, wall, finishes));
    }
  }
  for (const kind of FURNITURE_KINDS) {
    const definition = FURNITURE_CATALOG[kind];
    const height = kind === 'bed' ? 88 : kind === 'table' ? 80 : kind === 'shelf' ? 70 : kind === 'rug' ? 64 : kind === 'plant' ? 60 : 56;
    texture(scene, `home-furniture-${kind}`, definition.width * HOME_TILE, height,
      ctx => furniture(ctx, kind, definition.width * HOME_TILE, height));
  }
}

export interface HomeView {
  objects: Phaser.GameObjects.Image[];
  destroy(): void;
}

export function drawHome(scene: Phaser.Scene, data: HomeData): HomeView {
  createHomeArt(scene);
  const objects = [scene.add.image(0, 0, `home-room-${data.floor}-${data.wall}`).setOrigin(0).setDepth(-1000)];
  for (const piece of data.furniture) {
    const definition = FURNITURE_CATALOG[piece.kind];
    const bottom = (piece.y + definition.height) * HOME_TILE;
    const image = scene.add.image(piece.x * HOME_TILE, bottom, `home-furniture-${piece.kind}`)
      .setOrigin(0, 1).setDepth(definition.blocking ? bottom - 1 : -500);
    image.setData('homeFurnitureId', piece.id);
    objects.push(image);
  }
  return { objects, destroy: () => objects.forEach(object => object.destroy()) };
}
