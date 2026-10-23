import Phaser from 'phaser';
import type { BuildingData, ResourceKind, ResourceNode } from './types';
import { paintTerrain } from './terrain-art';
import { readTerrainSprites } from './terrain-sprites';
import { readTerrainDecoration } from './decor-sprites';
import { decorateProperty } from './property-art';
import { placeLooseResources } from './data/resource-layout';
import { isWaterPoint } from './data/terrain-shape';
import { createLegacyTrees, getRegionAt, isBridgeTile, isFarmTile, isPathTile, isWaterTile, TILE, WORLD_HEIGHT, WORLD_WIDTH } from './data/regions';

export type { ResourceNode } from './types';

export { TILE, WORLD_WIDTH, WORLD_HEIGHT, isWaterTile, getRegionAt, locationAt, REGIONS } from './data/regions';
export const SPAWN = { x: 25 * TILE + 16, y: 18 * TILE + 16 };
/** Adult trees are about three character heights; only artwork grows, not trunk collisions. */
export const TREE_VISUAL_SCALE = 1.6;
export const NPC_POSITION = { x: 29 * TILE + 16, y: 17 * TILE + 16 };
export const WORLD_LANDMARKS = {
  chimney: { x: 853, y: 294 },
  porch: { x: 784, y: 506 },
  pond: { x: 1168, y: 976 },
} as const;

export interface WorldView {
  resources: ResourceNode[];
  isBlocked(x: number, y: number): boolean;
  isBlockedPoint(x: number, y: number): boolean;
  isFarm(x: number, y: number): boolean;
  isBuildable(x: number, y: number): boolean;
  resourceAt(x: number, y: number): ResourceNode | undefined;
  removeResource(id: string): void;
  updateOcclusion(playerX: number, playerY: number): void;
}

function randomSource(seed: number): () => number {
  return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
}

export function createWorld(scene: Phaser.Scene, depletedResources: string[], buildings: readonly BuildingData[] = []): WorldView {
  const blocked = new Set<string>();
  // Resource collision is separate: felling a tree must never erase a ruin wall.
  const resourceBlocked = new Set<string>();
  const forestTiles = new Set<string>();
  const depleted = new Set(depletedResources);
  const resources: ResourceNode[] = [];
  const resourceImages = new Map<string, Phaser.GameObjects.Image>();
  const canopies = new Map<string, { image: Phaser.GameObjects.Image; x: number; y: number; width: number; height: number }>();
  let canopyRadiusX = 0, canopyRadiusY = 0;
  let fadedTrees = new Set<string>();
  const key = (x: number, y: number) => `${x},${y}`;
  const isFarm = isFarmTile;
  const waterAt = isWaterTile;
  const bridgeAt = isBridgeTile;
  const pathAt = isPathTile;

  // Static obstacles are separate from water: precise movement can follow the
  // rounded water edge while tile navigation/building remains conservative.
  // The ground is independent of saves. Reuse its GPU texture on new/continue.
  if (!scene.textures.exists('world-ground')) {
    const terrain = document.createElement('canvas');
    terrain.width = WORLD_WIDTH * TILE;
    terrain.height = WORLD_HEIGHT * TILE;
    paintTerrain(terrain.getContext('2d')!, readTerrainSprites(scene), readTerrainDecoration(scene));
    scene.textures.addCanvas('world-ground', terrain)?.setFilter(Phaser.Textures.FilterMode.NEAREST);
  }
  scene.add.image(0, 0, 'world-ground').setOrigin(0).setDepth(-100);

  const texture = (name: string, width: number, height: number, paint: (ctx: CanvasRenderingContext2D) => void) => {
    if (scene.textures.exists(name)) return;
    const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
    paint(canvas.getContext('2d')!);
    scene.textures.addCanvas(name, canvas)?.setFilter(Phaser.Textures.FilterMode.NEAREST);
  };
  texture('oak', 80, 100, (ctx) => {
    const r = (color: string, x: number, y: number, w: number, h: number) => {ctx.fillStyle = color; ctx.fillRect(x, y, w, h);};
    r('#3f59433b', 7, 87, 64, 10); r('#3f59432b', 1, 90, 78, 5);
    r('#695439', 34, 55, 13, 38); r('#9b7c4f', 36, 57, 4, 34); r('#7d633f', 31, 88, 20, 5);
    r('#6b573c', 22, 63, 17, 6); r('#6b573c', 43, 59, 15, 5);
    r('#496745', 13, 26, 53, 49); r('#496745', 6, 35, 66, 28); r('#496745', 25, 7, 30, 65);
    r('#557747', 9, 29, 56, 30); r('#557747', 19, 15, 45, 47); r('#557747', 21, 8, 30, 57);
    r('#66864c', 13, 26, 25, 27); r('#66864c', 22, 15, 37, 25); r('#66864c', 33, 10, 14, 44);
    r('#749452', 25, 16, 21, 15); r('#749452', 15, 29, 19, 13); r('#73934e', 42, 28, 13, 12);
    r('#829b58', 27, 15, 15, 5); r('#88a05a', 17, 29, 11, 4); r('#88a05a', 44, 28, 8, 3);
    r('#456641', 13, 56, 9, 9); r('#456641', 47, 60, 15, 8); r('#456641', 62, 43, 10, 12);
    r('#63844a', 23, 49, 9, 6); r('#63844a', 46, 48, 10, 6); r('#70924e', 37, 35, 7, 6);
    r('#aec083', 20, 26, 3, 2); r('#9db473', 42, 19, 4, 2); r('#91a969', 56, 37, 3, 2);
  });
  texture('pine', 64, 104, (ctx) => {
    const r = (color: string, x: number, y: number, w: number, h: number) => {ctx.fillStyle = color; ctx.fillRect(x, y, w, h);};
    r('#3f594333', 6, 94, 54, 8); r('#66523d', 28, 75, 9, 23); r('#9a7d54', 30, 76, 3, 21);
    for (let level = 0; level < 5; level++) {
      const y = 6 + level * 15, w = 14 + level * 10;
      r('#3f6552', 32 - w / 2, y + 10, w, 18);
      r('#52795b', 34 - w / 2, y + 5, w - 8, 18);
      r('#628661', 33 - w / 2, y + 4, w / 2, 9);
      r('#739566', 34 - w / 2, y + 4, 5, 8);
    }
    r('#6c9164', 30, 3, 4, 8);
  });
  texture('resource-stone', 40, 32, (ctx) => {
    const r = (color: string, x: number, y: number, w: number, h: number) => {ctx.fillStyle = color; ctx.fillRect(x, y, w, h);};
    r('#425a4133', 2, 25, 36, 6); r('#6b786d', 5, 16, 31, 12); r('#899486', 8, 9, 24, 17);
    r('#9eaa97', 11, 7, 18, 13); r('#b4bdab', 13, 7, 12, 4); r('#778577', 26, 13, 7, 12);
    r('#73816e', 2, 24, 6, 5); r('#acb3a1', 4, 22, 5, 3); r('#647d50', 9, 24, 8, 3);
  });
  texture('resource-tree', 40, 32, (ctx) => {
    const r = (color: string, x: number, y: number, w: number, h: number) => {ctx.fillStyle = color; ctx.fillRect(x, y, w, h);};
    r('#425a4133', 2, 25, 36, 5); r('#6e5238', 5, 16, 27, 11); r('#8b6742', 7, 12, 27, 11);
    r('#b3935f', 7, 12, 23, 3); r('#654d35', 10, 18, 23, 2); r('#c4a472', 3, 16, 8, 8);
    r('#ddbd83', 4, 17, 5, 5); r('#997349', 5, 18, 2, 3); r('#6e854b', 23, 12, 5, 3);
    r('#b2986b', 16, 8, 18, 5); r('#74573a', 18, 12, 17, 3);
  });
  texture('resource-seeds', 40, 40, (ctx) => {
    const r = (color: string, x: number, y: number, w: number, h: number) => {ctx.fillStyle = color; ctx.fillRect(x, y, w, h);};
    r('#425a4133', 3, 32, 33, 5); r('#5a7b43', 8, 18, 24, 16); r('#76964f', 5, 21, 28, 10);
    r('#8aa559', 10, 14, 16, 17); r('#a2b367', 12, 14, 6, 10); r('#63864a', 23, 23, 10, 8);
    r('#d6c18b', 11, 18, 3, 4); r('#ead69a', 24, 20, 3, 4); r('#e1cc91', 18, 27, 3, 3);
  });
  texture('resource-scrap', 32, 32, (ctx) => {
    const r = (color: string, x: number, y: number, w: number, h: number) => {ctx.fillStyle = color; ctx.fillRect(x, y, w, h);};
    r('#344c3b44', 2, 25, 28, 5);
    // A weathered blade and a bent metal strip salvaged from the old workshop.
    r('#5a665e', 7, 16, 20, 11); r('#87958b', 8, 14, 18, 10);
    r('#bfcbc0', 9, 14, 16, 2); r('#a3774e', 18, 19, 7, 4);
    r('#435951', 11, 20, 4, 3); r('#5d756e', 3, 11, 5, 15);
    r('#c5d1c4', 4, 10, 3, 12); r('#a3b7a9', 7, 9, 3, 11);
    r('#70543b', 4, 23, 4, 6); r('#c4aa70', 4, 23, 4, 2);
    r('#e5d4a6', 21, 11, 2, 2);
  });
  texture('resource-fiber', 32, 32, (ctx) => {
    const r = (color: string, x: number, y: number, w: number, h: number) => {ctx.fillStyle = color; ctx.fillRect(x, y, w, h);};
    r('#344c3b33', 3, 26, 26, 5); r('#647641', 7, 24, 19, 5);
    // Pale, flexible stalks stand apart from the dark seed-bearing shrubs.
    for (const [x, y] of [[7, 11], [12, 6], [17, 9], [22, 7], [25, 15]]) {
      r('#7b8950', x - 1, y + 2, 3, 26 - y); r('#c1bb78', x, y, 1, 25 - y);
      r('#e0cc90', x - 1, y - 2, 3, 5); r('#f0dba0', x, y - 2, 1, 3);
      r('#a0ac62', x - 3, y + 8, 3, 2); r('#859d53', x + 1, y + 11, 3, 2);
    }
    r('#a8af69', 5, 26, 8, 2); r('#d0c28a', 14, 26, 9, 2);
  });
  texture('resource-vein', 40, 40, (ctx) => {
    const r = (color: string, x: number, y: number, w: number, h: number) => {ctx.fillStyle = color; ctx.fillRect(x, y, w, h);};
    r('#344c3b44', 1, 32, 38, 6);
    r('#4c5b55', 4, 21, 33, 13); r('#65776c', 7, 10, 26, 22);
    r('#829285', 12, 5, 17, 23); r('#a3afa0', 13, 5, 13, 4);
    r('#566b62', 26, 15, 9, 14); r('#697c70', 2, 27, 10, 7);
    // Warm iron inclusions keep the mineable outcrop distinct from loose stones.
    for (const [x, y] of [[12, 15], [22, 22], [27, 12], [8, 27]]) {
      r('#775338', x, y, 6, 5); r('#b58852', x, y, 4, 3); r('#d6b577', x, y, 2, 1);
    }
    r('#405b42', 29, 29, 5, 4); r('#91a15f', 30, 28, 3, 2);
  });
  texture('tree-stump', 32, 24, (ctx) => {
    const r = (color: string, x: number, y: number, w: number, h: number) => {ctx.fillStyle = color; ctx.fillRect(x, y, w, h);};
    r('#36503933', 2, 19, 28, 4); r('#705137', 6, 9, 20, 12);
    r('#997245', 7, 9, 17, 9); r('#c4a16c', 6, 7, 19, 6);
    r('#dfbe83', 8, 7, 15, 3); r('#9d794d', 12, 9, 8, 2);
    r('#795b3e', 8, 15, 2, 5); r('#795b3e', 19, 14, 2, 6);
    r('#789451', 24, 17, 3, 4);
  });
  texture('cabin', 256, 224, (ctx) => {
    const r = (color: string, x: number, y: number, w: number, h: number) => {ctx.fillStyle = color; ctx.fillRect(x, y, w, h);};
    r('#324a3b44', 15, 194, 235, 18); r('#6c6950', 24, 117, 208, 81);
    r('#c3af7f', 27, 109, 200, 75); r('#b29b6f', 27, 139, 200, 4);
    for (let y = 118; y < 183; y += 9) {r('#ab9267', 27, y, 200, 2); r('#d0bc8c', 29, y + 2, 197, 1);}
    r('#6b5d44', 24, 108, 8, 79); r('#776347', 222, 108, 8, 81);
    r('#79775c', 23, 183, 211, 11); r('#aaa38a', 28, 184, 22, 7); r('#99947d', 54, 185, 28, 7);
    r('#656850', 23, 193, 212, 7);
    // Window frames, sage shutters, light reflecting from the recovered home.
    for (const x of [53, 166]) {
      r('#5d6651', x - 10, 123, 9, 35); r('#738461', x - 9, 124, 6, 32);
      r('#5d6651', x + 29, 123, 9, 35); r('#738461', x + 30, 124, 6, 32);
      r('#705d44', x, 121, 29, 38); r('#dfcd9c', x + 3, 124, 23, 30);
      r('#547a77', x + 5, 126, 19, 25); r('#83a39a', x + 5, 126, 10, 12); r('#a5bbac', x + 6, 126, 4, 9);
      r('#d1bd8b', x + 13, 124, 3, 30); r('#d1bd8b', x + 3, 138, 23, 3);
      r('#8b7753', x - 2, 157, 34, 4);
      r('#65804b', x + 3, 154, 8, 4); r('#93a35b', x + 7, 152, 5, 4); r('#7d9552', x + 21, 153, 5, 4);
    }
    r('#65503a', 109, 124, 35, 64); r('#8b714e', 113, 127, 27, 58); r('#a3895c', 116, 129, 7, 55);
    r('#5a6b5a', 116, 130, 20, 20); r('#829c88', 118, 132, 8, 14); r('#d1b577', 134, 162, 3, 3);
    r('#a89d79', 100, 187, 56, 8); r('#c4b68b', 96, 196, 63, 5); r('#8b8369', 96, 201, 63, 3);
    // Wide overhanging terracotta roof, built in stair-stepped pixels.
    r('#534936', 10, 101, 235, 13); r('#76543e', 15, 34, 225, 70);
    for (let row = 0; row < 10; row++) {
      const y = 23 + row * 8, left = 40 - row * 3;
      r(row % 2 ? '#a36a48' : '#ad7450', left, y, 175 + row * 6, 8);
      r('#bf875b', left, y, 175 + row * 6, 2);
      r('#82523b', left, y + 6, 175 + row * 6, 2);
      for (let x = left + (row % 2 ? 8 : 0); x < 210 + row * 3; x += 19) r('#87573e', x, y + 2, 2, 4);
    }
    r('#d29b68', 37, 20, 182, 5); r('#6c4d39', 13, 104, 231, 6); r('#ba8c61', 12, 102, 233, 3);
    // Chimney, climbing ivy and small details.
    r('#6f7264', 187, 0, 20, 37); r('#929381', 188, 2, 17, 30); r('#b4b29a', 184, 0, 25, 5);
    for (let y = 8; y < 31; y += 8) { r('#777a6a', 188, y, 18, 2); r('#777a6a', y % 16 ? 197 : 192, y, 2, 7); }
    for (let y = 126; y < 180; y += 7) { r('#566e44', 217, y, 8, 5); r('#7b9352', 212 + (y % 3), y + 2, 9, 3); }
    r('#a77c51', 34, 175, 13, 12); r('#7b9651', 32, 169, 17, 8); r('#9caf69', 36, 165, 8, 8);
    r('#566b48', 151, 169, 8, 15); r('#d9bd77', 152, 161, 6, 7);
  });
  const houseTexture = scene.textures.exists('asset-house') ? 'asset-house' : 'cabin';
  scene.add.image(24.5 * TILE, 16 * TILE + 4, houseTexture).setOrigin(0.5, 1).setDepth(16 * TILE + 4);
  for (let y = 11; y <= 15; y++) for (let x = 21; x <= 27; x++) blocked.add(key(x, y));

  // Wild woodland frames the clearing without filling it with combat or obstacles.
  const expandedSupplies: Array<[number, number, ResourceKind]> = [
    [55, 19, 'tree'], [57, 17, 'stone'], [61, 20, 'fiber'], [64, 16, 'seeds'], [65, 20, 'vein'], [69, 23, 'vein'],
    [73, 19, 'tree'], [75, 23, 'stone'], [80, 27, 'fiber'], [83, 29, 'scrap'], [77, 29, 'seeds'],
    [24, 49, 'tree'], [26, 51, 'stone'], [28, 50, 'fiber'], [30, 55, 'seeds'], [32, 51, 'vein'], [35, 56, 'vein'],
    [62, 55, 'tree'], [65, 56, 'stone'], [70, 59, 'fiber'], [72, 55, 'seeds'], [66, 58, 'scrap'],
  ];
  const reservedSupplies = new Set(expandedSupplies.map(([x, y]) => key(x, y)));
  const trees = createLegacyTrees();
  // A reserva de árvores das novas regiões usa uma semente independente.
  const forestRandom = randomSource(476120);
  for (let y = 2; y < WORLD_HEIGHT - 2; y++) for (let x = 2; x < WORLD_WIDTH - 2; x++) {
    if (x < 54 && y < 42) continue;
    const region = getRegionAt(x, y);
    const clearing = region.id === 'pine-forest'
      ? ((x - 67) ** 2 + (y - 18) ** 2 < 42) || ((x - 81) ** 2 + (y - 28) ** 2 < 30)
      : ((x - 27) ** 2 / 120 + (y - 54) ** 2 / 55 < 1) || ((x - 68) ** 2 / 160 + (y - 57) ** 2 / 40 < 1);
    const chance = region.id === 'pine-forest' ? 0.2 : 0.075;
    if (forestRandom() < chance && !clearing && !reservedSupplies.has(key(x, y)) && !waterAt(x, y) && !pathAt(x, y) && !bridgeAt(x, y)) trees.push({ x, y, pine: region.id === 'pine-forest' ? forestRandom() > 0.2 : forestRandom() > 0.8 });
  }
  for (const [x, y] of [[58, 21], [63, 22], [74, 22], [29, 48], [34, 48], [60, 57]]) trees.push({ x, y, pine: x >= 50 && y < 42 });
  for (const tree of trees) {
    if (tree.x === 9 && tree.y >= 16 && tree.y <= 20) continue;
    const id = `standingTree-${tree.x}-${tree.y}`;
    const tile = key(tree.x, tree.y);
    if (forestTiles.has(tile)) continue;
    forestTiles.add(tile);
    if (depleted.has(id)) {
      scene.add.image(tree.x * TILE + 16, tree.y * TILE + 29, 'tree-stump').setOrigin(0.5, 1).setDepth(tree.y * TILE + 24);
      continue;
    }
    resources.push({ id, x: tree.x, y: tree.y, kind: 'standingTree' });
    const base = tree.pine ? 'asset-pine' : 'asset-tree';
    const variant = Math.abs(Math.imul(tree.x, 73856093) ^ Math.imul(tree.y, 19349663)) % 3;
    const artwork = scene.textures.exists(`${base}-${variant}`) ? `${base}-${variant}` : base;
    const useArtwork = scene.textures.exists(artwork);
    const treeTexture = useArtwork ? artwork : tree.pine ? 'pine' : 'oak';
    const footX = tree.x * TILE + 16, footY = tree.y * TILE + 25;
    const pivot = artwork.endsWith(`-${variant}`) ? 128 / 132 : useArtwork ? 1 : 0.93;
    const treeImage = scene.add.image(footX, footY, treeTexture).setOrigin(0.5, pivot).setScale(TREE_VISUAL_SCALE).setDepth(footY);
    resourceImages.set(id, treeImage);
    const width = (treeImage.width || 88) * TREE_VISUAL_SCALE;
    const height = (treeImage.height || 116) * TREE_VISUAL_SCALE * pivot;
    canopies.set(tile, { image: treeImage, x: footX, y: footY, width, height });
    canopyRadiusX = Math.max(canopyRadiusX, Math.ceil(width / 2 / TILE) + 1);
    canopyRadiusY = Math.max(canopyRadiusY, Math.ceil(height / TILE) + 1);
    resourceBlocked.add(tile);
  }
  // A small roofless ruin in the western exploration area.
  const ruin = scene.add.graphics().setDepth(20 * TILE);
  ruin.fillStyle(0x756f57).fillRect(8 * TILE, 15 * TILE, 4 * TILE, 4 * TILE);
  ruin.fillStyle(0x9d9d81).fillRect(8 * TILE + 4, 15 * TILE + 4, 4 * TILE - 8, 4 * TILE - 8);
  ruin.fillStyle(0x7b8563).fillRect(8 * TILE + 8, 15 * TILE + 10, 4 * TILE - 18, 4 * TILE - 18);
  ruin.fillStyle(0xaaa58c).fillRect(8 * TILE, 15 * TILE, 4 * TILE, 12).fillRect(8 * TILE, 15 * TILE, 12, 4 * TILE);
  ruin.fillStyle(0xc2bba0).fillRect(8 * TILE, 15 * TILE, 4 * TILE, 3).fillRect(8 * TILE, 15 * TILE, 3, 4 * TILE);
  for (let x = 8; x <= 11; x++) blocked.add(key(x, 15));
  for (let y = 15; y <= 18; y++) blocked.add(key(8, y));
  // Vestígios de uma antiga guarita no bosque; abertura ao sul e a leste.
  const forestRuin = scene.add.graphics().setDepth(29 * TILE);
  forestRuin.fillStyle(0x777967).fillRect(78 * TILE, 25 * TILE, 6 * TILE, 10).fillRect(78 * TILE, 25 * TILE, 10, 4 * TILE);
  forestRuin.fillStyle(0xb9b69b).fillRect(78 * TILE, 25 * TILE, 6 * TILE, 3).fillRect(78 * TILE, 25 * TILE, 3, 4 * TILE);
  forestRuin.fillStyle(0x8b9463).fillRect(78 * TILE + 5, 25 * TILE + 8, 4, 57).fillRect(81 * TILE, 25 * TILE, 25, 5);
  for (let x = 78; x <= 83; x++) blocked.add(key(x, 25));
  for (let y = 25; y <= 28; y++) blocked.add(key(78, y));

  // Um poço seco marca a clareira dos campos; sua base tem colisão explícita.
  const well = scene.add.graphics().setDepth(60 * TILE);
  well.fillStyle(0x585e4a).fillRect(31 * TILE, 59 * TILE, 2 * TILE, TILE);
  well.fillStyle(0xb5aa88).fillRect(31 * TILE - 2, 59 * TILE - 3, 2 * TILE + 4, 10);
  well.fillStyle(0x494e43).fillRect(31 * TILE + 8, 59 * TILE + 2, 48, 13);
  well.fillStyle(0x7c8265).fillRect(31 * TILE + 3, 59 * TILE + 22, 57, 8);
  well.fillStyle(0x687746).fillRect(31 * TILE - 4, 59 * TILE + 21, 7, 10);
  blocked.add(key(31, 59)); blocked.add(key(32, 59));

  const positions: Array<[number, number, ResourceKind]> = [
    [20, 18, 'tree'], [28, 19, 'stone'], [30, 20, 'seeds'], [19, 22, 'seeds'], [23, 26, 'tree'], [27, 26, 'stone'],
    [18, 16, 'tree'], [17, 19, 'stone'], [16, 22, 'seeds'], [20, 28, 'tree'], [25, 29, 'seeds'], [34, 25, 'stone'],
    [35, 19, 'tree'], [36, 17, 'seeds'], [38, 24, 'stone'], [13, 18, 'tree'], [11, 21, 'seeds'], [15, 28, 'stone'],
    [30, 31, 'tree'], [35, 35, 'seeds'], [40, 14, 'stone'], [32, 9, 'tree'], [18, 13, 'seeds'], [12, 25, 'tree'],
    [26, 9, 'stone'], [29, 28, 'tree'], [19, 25, 'stone'], [33, 21, 'seeds'], [16, 15, 'tree'], [37, 12, 'stone'],
    // Fresh component supplies also keep fully harvested version-1 saves playable.
    [22, 18, 'tree'], [27, 18, 'tree'], [23, 18, 'stone'], [26, 18, 'stone'], [30, 18, 'stone'],
    [12, 19, 'scrap'], [13, 20, 'scrap'], [14, 19, 'scrap'],
    [17, 26, 'vein'], [18, 27, 'vein'], [33, 26, 'vein'], [35, 25, 'vein'],
    [23, 19, 'fiber'], [26, 19, 'fiber'], [31, 19, 'fiber'], [20, 21, 'fiber'], [31, 23, 'fiber'],
    // Pontos fixos garantem coleta e mineração em cada região explorável.
    ...expandedSupplies,
  ];
  const candidates: ResourceNode[] = [];
  for (const [x, y, kind] of positions) {
    const id = `${kind}-${x}-${y}`;
    // Keep legacy loose-resource availability stable even after trees are cut.
    if ((waterAt(x, y) && !bridgeAt(x, y)) || blocked.has(key(x, y)) || forestTiles.has(key(x, y))) continue;
    candidates.push({ id, x, y, kind });
  }
  const looseLayout = placeLooseResources(candidates, {
    isStaticBlocked: (x, y) => blocked.has(key(x, y)),
    isTreeTile: (x, y) => forestTiles.has(key(x, y)), buildings,
  });
  for (const node of looseLayout) {
    if (depleted.has(node.id)) continue;
    const { id, x, y, kind } = node;
    resources.push(node);
    const asset = ({ tree: 'asset-branch', stone: 'asset-stone', seeds: 'asset-seeds', scrap: 'asset-scrap', fiber: 'asset-fiber', vein: 'asset-vein', standingTree: 'asset-tree' } as const)[kind];
    const useAsset = scene.textures.exists(asset);
    const resourceImage = scene.add.image(x * TILE + 16, y * TILE + 29, useAsset ? asset : `resource-${kind}`).setOrigin(0.5, 1).setDepth(y * TILE + 29);
    resourceImages.set(id, resourceImage);
    if (kind === 'vein') resourceBlocked.add(key(x, y));
  }
  const resourceAt = (x: number, y: number) => resources.find((node) => node.x === x && node.y === y);
  const solidTile = (x: number, y: number) => x < 1 || y < 1 || x >= WORLD_WIDTH - 1 || y >= WORLD_HEIGHT - 1 || blocked.has(key(x, y)) || resourceBlocked.has(key(x, y));
  const isBlocked = (x: number, y: number) => solidTile(x, y) || waterAt(x, y) && !bridgeAt(x, y);
  const isBlockedPoint = (x: number, y: number) => {
    const tx = Math.floor(x / TILE), ty = Math.floor(y / TILE);
    return solidTile(tx, ty) || !bridgeAt(tx, ty) && isWaterPoint(x, y);
  };
  const waterTouchesTile = (x: number, y: number) => [0.01, TILE / 2, TILE - 0.01].some(dx =>
    [0.01, TILE / 2, TILE - 0.01].some(dy => isWaterPoint(x * TILE + dx, y * TILE + dy)));
  decorateProperty(scene, { isBlocked, resourceAt, buildings });

  return {
    resources,
    isBlocked,
    isBlockedPoint,
    isFarm,
    isBuildable: (x, y) => !isBlocked(x, y) && !waterTouchesTile(x, y) && !isFarm(x, y) && !resourceAt(x, y) && !bridgeAt(x, y) && !(x === 29 && y === 17),
    resourceAt,
    updateOcclusion: (playerX, playerY) => {
      const next = new Set<string>();
      const tx = Math.floor(playerX / TILE), ty = Math.floor(playerY / TILE);
      // Query nearby trunk cells rather than all trees on every animation frame.
      for (let y = ty; y <= ty + canopyRadiusY; y++) for (let x = tx - canopyRadiusX; x <= tx + canopyRadiusX; x++) {
        const tile = key(x, y), canopy = canopies.get(tile);
        if (!canopy || !canopy.image.active) continue;
        if (playerY < canopy.y + 2 && playerY > canopy.y - canopy.height + 10
          && Math.abs(playerX - canopy.x) < canopy.width / 2 - 4) {
          next.add(tile);
          if (!fadedTrees.has(tile)) canopy.image.setAlpha(0.38);
        }
      }
      for (const tile of fadedTrees) if (!next.has(tile)) canopies.get(tile)?.image.setAlpha(1);
      fadedTrees = next;
    },
    removeResource: (id) => {
      const index = resources.findIndex((node) => node.id === id);
      if (index < 0) return;
      const [node] = resources.splice(index, 1);
      resourceImages.get(id)?.destroy();
      resourceImages.delete(id);
      canopies.delete(key(node.x, node.y));
      fadedTrees.delete(key(node.x, node.y));
      if (node.kind === 'standingTree' || node.kind === 'vein') resourceBlocked.delete(key(node.x, node.y));
      if (node.kind === 'standingTree') scene.add.image(node.x * TILE + 16, node.y * TILE + 29, 'tree-stump').setOrigin(0.5, 1).setDepth(node.y * TILE + 24);
    },
  };
}
