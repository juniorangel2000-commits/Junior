import Phaser from 'phaser';

export const TILE = 32;
export const WORLD_WIDTH = 54;
export const WORLD_HEIGHT = 42;
export const SPAWN = { x: 25 * TILE + 16, y: 18 * TILE + 16 };
export const NPC_POSITION = { x: 29 * TILE + 16, y: 17 * TILE + 16 };

export interface ResourceNode { id: string; x: number; y: number; kind: 'tree' | 'stone' | 'seeds' }
export interface WorldView {
  resources: ResourceNode[];
  isBlocked(x: number, y: number): boolean;
  isFarm(x: number, y: number): boolean;
  isBuildable(x: number, y: number): boolean;
  resourceAt(x: number, y: number): ResourceNode | undefined;
  removeResource(id: string): void;
}

function randomSource(seed: number): () => number {
  return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
}

export function createWorld(scene: Phaser.Scene, depletedResources: string[]): WorldView {
  const random = randomSource(85021);
  const blocked = new Set<string>();
  const key = (x: number, y: number) => `${x},${y}`;
  const isFarm = (x: number, y: number) => x >= 21 && x <= 29 && y >= 20 && y <= 24;
  const waterAt = (x: number, y: number) => {
    const river = 44 + Math.floor(Math.sin(y * 0.24) * 2);
    const pond = ((x - 36) ** 2) / 33 + ((y - 30) ** 2) / 15 < 1;
    return x >= river || pond;
  };
  const bridgeAt = (x: number, y: number) => x >= 42 && x <= 48 && y >= 18 && y <= 19;
  const pathAt = (x: number, y: number) => (x >= 24 && x <= 26 && y >= 15 && y <= 19)
    || (x >= 15 && x <= 42 && y >= 17 && y <= 18)
    || (x >= 30 && x <= 32 && y >= 18 && y <= 30);

  const terrain = document.createElement('canvas');
  terrain.width = WORLD_WIDTH * TILE;
  terrain.height = WORLD_HEIGHT * TILE;
  const c = terrain.getContext('2d')!;
  const rect = (color: string, x: number, y: number, width: number, height: number) => {
    c.fillStyle = color; c.fillRect(Math.floor(x), Math.floor(y), width, height);
  };
  for (let y = 0; y < WORLD_HEIGHT; y++) {
    for (let x = 0; x < WORLD_WIDTH; x++) {
      const px = x * TILE, py = y * TILE;
      if (waterAt(x, y)) {
        rect(['#628d89', '#618a85', '#668e89'][Math.floor(random() * 3)], px, py, TILE, TILE);
        for (let n = 0; n < 3; n++) rect(n === 0 ? '#80a7a0' : '#6f9992', px + random() * 24, py + random() * 29, 4 + Math.floor(random() * 8), 2);
        if (!bridgeAt(x, y)) blocked.add(key(x, y));
        continue;
      }
      const farm = isFarm(x, y);
      const path = pathAt(x, y);
      rect(farm ? '#83694a' : path ? '#bdad82' : ['#849a62', '#879b63', '#899e66', '#82975f'][Math.floor(random() * 4)], px, py, TILE, TILE);
      if (farm) {
        rect('#735c43', px + 2, py + 2, 28, 28);
        for (const row of [6, 13, 20, 27]) {
          rect('#91704d', px + 4, py + row, 24, 2);
          rect('#624f3b', px + 5, py + row + 2, 23, 2);
        }
        continue;
      }
      for (let n = 0; n < 9; n++) {
        const lx = px + Math.floor(random() * 30), ly = py + Math.floor(random() * 30);
        rect(path ? ['#b1a07a', '#cbbb94'][n % 2] : ['#99aa6d', '#738d56', '#8fa368'][n % 3], lx, ly, 2 + Math.floor(random() * 3), 1 + Math.floor(random() * 2));
      }
      if (!path && random() > 0.56) {
        const lx = px + 5 + random() * 20, ly = py + 6 + random() * 18;
        rect('#667e4b', lx, ly, 2, 5); rect('#738c4f', lx - 3, ly - 1, 2, 4); rect('#99af6e', lx + 3, ly - 2, 2, 6);
      }
      if (!path && random() > 0.93) {
        const lx = px + 6 + random() * 20, ly = py + 6 + random() * 20;
        rect('#61814c', lx, ly, 2, 6);
        rect(random() > 0.5 ? '#e3ce8c' : '#e3daca', lx - 2, ly - 1, 5, 3);
        rect('#b49a5b', lx, ly, 1, 1);
      }
      if ((waterAt(x + 1, y) || waterAt(x, y + 1) || waterAt(x - 1, y) || waterAt(x, y - 1)) && !bridgeAt(x, y)) {
        rect('#9aab76', px + 4, py + 4, 5, 2);
        rect('#b6b78a', px + 10, py + 20, 8, 2);
        for (let n = 0; n < 2; n++) {
          const lx = px + random() * 28, ly = py + random() * 26;
          rect('#6c7d48', lx, ly, 2, 8); rect('#52683f', lx + 3, ly + 2, 2, 6);
        }
      }
    }
  }
  // A hand-built footbridge: wooden planks across the shallow river.
  for (let x = 42 * TILE; x < 49 * TILE; x += 8) {
    rect('#705c45', x, 18 * TILE, 7, 64); rect('#bca077', x, 18 * TILE, 6, 58); rect('#d3b98b', x, 18 * TILE, 2, 58);
    rect('#584d3c', x + 2, 18 * TILE + 8, 1, 1); rect('#584d3c', x + 2, 18 * TILE + 49, 1, 1);
  }
  rect('#6c5943', 42 * TILE, 18 * TILE + 2, 7 * TILE, 3);
  rect('#dbc191', 42 * TILE, 18 * TILE, 7 * TILE, 2);
  rect('#6c5943', 42 * TILE, 20 * TILE - 7, 7 * TILE, 4);
  // Flat stepping stones and a few fallen leaves in the path.
  for (const [x, y] of [[25, 16], [24, 17], [25, 18], [27, 18], [29, 18], [32, 18]]) {
    rect('#b0a48c', x * TILE + 4, y * TILE + 7, 23, 14); rect('#d1c8ac', x * TILE + 5, y * TILE + 6, 21, 12);
    rect('#bcb396', x * TILE + 19, y * TILE + 8, 6, 8);
  }
  if (scene.textures.exists('world-ground')) scene.textures.remove('world-ground');
  scene.textures.addCanvas('world-ground', terrain)?.setFilter(Phaser.Textures.FilterMode.NEAREST);
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
  scene.add.image(24.5 * TILE, 16 * TILE + 4, 'cabin').setOrigin(0.5, 1).setDepth(16 * TILE + 4);
  for (let y = 11; y <= 15; y++) for (let x = 21; x <= 27; x++) blocked.add(key(x, y));

  // Wild woodland frames the clearing without filling it with combat or obstacles.
  const trees: Array<{ x: number; y: number; pine: boolean }> = [];
  for (let y = 1; y < WORLD_HEIGHT - 1; y++) {
    for (let x = 1; x < WORLD_WIDTH - 1; x++) {
      const wild = x < 12 || x > 39 || y < 8 || y > 35;
      const side = x < 16 && y > 20 && y < 33;
      if ((wild && random() < 0.3 || side && random() < 0.18) && !waterAt(x, y) && !pathAt(x, y) && !bridgeAt(x, y)) trees.push({x, y, pine: random() > 0.65});
    }
  }
  for (const [x, y] of [[17, 11], [18, 10], [31, 11], [33, 14], [17, 24], [18, 29], [32, 26], [20, 32], [28, 31], [39, 22]]) trees.push({x, y, pine: false});
  for (const tree of trees) {
    if (tree.x === 9 && tree.y >= 16 && tree.y <= 20) continue;
    scene.add.image(tree.x * TILE + 16, tree.y * TILE + 25, tree.pine ? 'pine' : 'oak').setOrigin(0.5, 0.93).setDepth(tree.y * TILE + 25);
    blocked.add(key(tree.x, tree.y));
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
  // Weathered property sign and mailbox.
  const sign = scene.add.graphics().setDepth(18 * TILE + 24);
  sign.fillStyle(0x6a573e).fillRect(19 * TILE + 13, 18 * TILE + 2, 5, 28);
  sign.fillStyle(0xae9468).fillRect(19 * TILE + 1, 18 * TILE, 29, 16);
  sign.fillStyle(0xd0b788).fillRect(19 * TILE + 1, 18 * TILE, 29, 2);
  sign.lineStyle(2, 0x635d41).lineBetween(19 * TILE + 7, 18 * TILE + 7, 19 * TILE + 24, 18 * TILE + 7);
  sign.lineBetween(19 * TILE + 15, 18 * TILE + 12, 19 * TILE + 24, 18 * TILE + 7);
  sign.lineBetween(19 * TILE + 15, 18 * TILE + 3, 19 * TILE + 24, 18 * TILE + 7);

  const resources: ResourceNode[] = [];
  const resourceImages = new Map<string, Phaser.GameObjects.Image>();
  const positions: Array<[number, number, ResourceNode['kind']]> = [
    [20, 18, 'tree'], [28, 19, 'stone'], [30, 20, 'seeds'], [19, 22, 'seeds'], [23, 26, 'tree'], [27, 26, 'stone'],
    [18, 16, 'tree'], [17, 19, 'stone'], [16, 22, 'seeds'], [20, 28, 'tree'], [25, 29, 'seeds'], [34, 25, 'stone'],
    [35, 19, 'tree'], [36, 17, 'seeds'], [38, 24, 'stone'], [13, 18, 'tree'], [11, 21, 'seeds'], [15, 28, 'stone'],
    [30, 31, 'tree'], [35, 35, 'seeds'], [40, 14, 'stone'], [32, 9, 'tree'], [18, 13, 'seeds'], [12, 25, 'tree'],
    [26, 9, 'stone'], [29, 28, 'tree'], [19, 25, 'stone'], [33, 21, 'seeds'], [16, 15, 'tree'], [37, 12, 'stone'],
  ];
  for (const [x, y, kind] of positions) {
    const id = `${kind}-${x}-${y}`;
    if (depletedResources.includes(id) || blocked.has(key(x, y))) continue;
    const node: ResourceNode = {id, x, y, kind};
    resources.push(node);
    resourceImages.set(id, scene.add.image(x * TILE + 16, y * TILE + 29, `resource-${kind}`).setOrigin(0.5, 1).setDepth(y * TILE + 29));
  }
  const resourceAt = (x: number, y: number) => resources.find((node) => node.x === x && node.y === y);
  const isBlocked = (x: number, y: number) => x < 1 || y < 1 || x >= WORLD_WIDTH - 1 || y >= WORLD_HEIGHT - 1 || blocked.has(key(x, y));
  return {
    resources,
    isBlocked,
    isFarm,
    isBuildable: (x, y) => !isBlocked(x, y) && !isFarm(x, y) && !resourceAt(x, y) && !bridgeAt(x, y) && !(x === 29 && y === 17),
    resourceAt,
    removeResource: (id) => {
      const index = resources.findIndex((node) => node.id === id);
      if (index >= 0) resources.splice(index, 1);
      resourceImages.get(id)?.destroy();
      resourceImages.delete(id);
    },
  };
}
