import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type Phaser from 'phaser';
import { createWorld, type WorldView } from '../src/world';
import { getRegionAt, isBridgeTile, isFarmTile, isPathTile, isWaterTile, locationAt, REGIONS, WORLD_HEIGHT, WORLD_WIDTH } from '../src/data/regions';
import { isWaterPoint, roadDistanceAt } from '../src/data/terrain-shape';
import { Resources } from '../src/systems/resources';
import { Inventory } from '../src/systems/inventory';

vi.mock('../src/water-motion',()=>({addWaterMotion:vi.fn()}));
vi.mock('phaser', () => ({ default: { Textures: { FilterMode: { NEAREST: 0 } } } }));

// O teste exercita o mapa real e suas colisões sem precisar de WebGL/DOM.
const object = {
  setDisplaySize() { return this; }, setOrigin() { return this; }, setScale() { return this; }, setDepth() { return this; }, destroy() { return this; },
  fillStyle() { return this; }, fillRect() { return this; }, lineStyle() { return this; }, lineBetween() { return this; },
};
const scene = {
  textures: { exists: () => false, addCanvas: () => ({ setFilter() { return this; } }) },
  add: { image: () => Object.create(object), graphics: () => Object.create(object), text: () => Object.create(object) },
} as unknown as Phaser.Scene;

let world: WorldView;
let accessible: Set<string>;
const key = (x: number, y: number) => `${x},${y}`;
const neighbors = [[1, 0], [-1, 0], [0, 1], [0, -1]] as const;

beforeAll(() => {
  vi.stubGlobal('document', { createElement: () => ({ width: 0, height: 0, getContext: () => ({ fillStyle: '', fillRect() {} }) }) });
  world = createWorld(scene, []);
  accessible = new Set(['25,18']);
  const queue = [{ x: 25, y: 18 }];
  for (let i = 0; i < queue.length; i++) for (const [dx, dy] of neighbors) {
    const x = queue[i].x + dx, y = queue[i].y + dy;
    if (!accessible.has(key(x, y)) && !world.isBlocked(x, y)) {
      accessible.add(key(x, y)); queue.push({ x, y });
    }
  }
});
afterAll(() => vi.unstubAllGlobals());

describe('expansão da região inicial', () => {
  it('liga a propriedade, o bosque e as duas margens dos campos sem exigir ferramentas', () => {
    expect([WORLD_WIDTH, WORLD_HEIGHT]).toEqual([96, 72]);
    for (const region of REGIONS) expect(accessible.has(key(region.destination.x, region.destination.y))).toBe(true);
    for (const [x, y] of [[42, 18], [48, 18], [50, 18], [41, 52], [49, 52], [68, 53], [81, 28]]) {
      expect(accessible.has(key(x, y)), `Acesso a ${x},${y}`).toBe(true);
    }
  });

  it('preserva exatamente os IDs dos 376 recursos da versão anterior', () => {
    const legacy = world.resources.filter(node => node.x < 54 && node.y < 42);
    expect(legacy).toHaveLength(376);
    // Impressão do layout capturada da implementação anterior à expansão.
    let hash = 2166136261;
    for (const character of legacy.map(node => node.id).sort().join('|')) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
    expect((hash >>> 0).toString(16)).toBe('2b6f589e');
  });

  it('oferece coleta manual, corte e mineração alcançáveis em cada área nova', () => {
    for (const region of ['pine-forest', 'open-fields']) for (const kind of ['tree', 'fiber', 'stone', 'seeds', 'standingTree', 'vein']) {
      const nodes = world.resources.filter(node => node.kind === kind && getRegionAt(node.x, node.y).id === region);
      expect(nodes.some(node => neighbors.some(([dx, dy]) => accessible.has(key(node.x + dx, node.y + dy)))), `${region}: ${kind}`).toBe(true);
    }
  });

  it('mantém água bloqueada, pontes transitáveis e casa com colisão e antigas estruturas livres', () => {
    expect(isWaterTile(44, 18)).toBe(true);
    expect(isBridgeTile(44, 18)).toBe(true);
    expect(world.isBlocked(44, 18)).toBe(false);
    expect(world.isBlocked(44, 20)).toBe(true);
    expect(world.isBlocked(80, 10)).toBe(true);
    expect(world.isBlocked(24, 13)).toBe(true);
    expect(world.isBlocked(8, 16)).toBe(false);
    expect(world.isBlocked(78, 26)).toBe(false);
    expect(world.isBlocked(31, 59)).toBe(false);
    expect(world.isBlocked(WORLD_WIDTH - 1, 18)).toBe(true);
    expect(world.isBuildable(44, 18)).toBe(false);
  });

  it('preserva a horta e deixa clareiras construíveis nas áreas novas', () => {
    let farmCells = 0;
    for (let y = 1; y < WORLD_HEIGHT - 1; y++) for (let x = 1; x < WORLD_WIDTH - 1; x++) if (world.isFarm(x, y)) farmCells++;
    expect(farmCells).toBe(45);
    expect(world.isBuildable(25, 22)).toBe(false);
    expect(world.isBuildable(67, 18)).toBe(true);
    expect(world.isBuildable(25, 53)).toBe(true);
  });

  it('recupera recursos esgotados nas áreas novas sem recriar colisão ou recompensa', () => {
    const loaded = createWorld(scene, ['standingTree-58-21', 'vein-32-51', 'tree-24-49']);
    expect(loaded.resourceAt(58, 21)).toBeUndefined();
    expect(loaded.isBlocked(58, 21)).toBe(false);
    expect(loaded.resourceAt(32, 51)).toBeUndefined();
    expect(loaded.isBlocked(32, 51)).toBe(false);
    expect(loaded.resourceAt(24, 49)).toBeUndefined();
    loaded.removeResource('standingTree-58-21');
    expect(loaded.isBlocked(24, 13)).toBe(true);
  });

  it('nomeia lugares e regiões com as mesmas coordenadas da exploração', () => {
    expect(locationAt(25, 18)).toBe('Propriedade Abandonada');
    expect(locationAt(10, 18)).toBe('Propriedade Abandonada');
    expect(locationAt(70, 18)).toBe('Propriedade Abandonada');
    expect(locationAt(25, 53)).toBe('Propriedade Abandonada');
  });

  it('limpa caminhos e pontes sem perder recursos nem misturar regiões', () => {
    expect(world.resources).toHaveLength(801);
    expect(new Set(world.resources.map(node => node.id)).size).toBe(801);
    for (const node of world.resources) {
      const [, oldX, oldY] = node.id.match(/-(\d+)-(\d+)$/)!;
      expect(getRegionAt(node.x, node.y).id, node.id).toBe(getRegionAt(Number(oldX), Number(oldY)).id);
      // Legacy trunks remain at their original forest-edge coordinates; this
      // distribution pass moves the loose resources and bushes requested here.
      if (node.kind === 'standingTree') continue;
      expect(isPathTile(node.x, node.y), node.id).toBe(false);
      expect(isBridgeTile(node.x, node.y), node.id).toBe(false);
      expect(isFarmTile(node.x, node.y), node.id).toBe(false);
      expect(isWaterTile(node.x, node.y), node.id).toBe(false);
    }
    const displaced = world.resources.find(node => node.id === 'stone-23-18')!;
    expect(displaced).toBeDefined();
    expect([displaced.x, displaced.y]).not.toEqual([23, 18]);
  });

  it('mantém os sprites inteiros das rochas e arbustos longe das bordas das trilhas', () => {
    const sizes = { stone: [30, 20], vein: [48, 54], seeds: [36, 36], fiber: [32, 38], tree: [36, 24], scrap: [30, 28] } as const;
    for (const node of world.resources) {
      if (node.kind === 'standingTree') continue;
      const [width, height] = sizes[node.kind];
      for (const x of [node.x * 32 + 16 - width / 2, node.x * 32 + 16, node.x * 32 + 16 + width / 2]) {
        for (const y of [node.y * 32 + 29 - height, node.y * 32 + 29]) {
          expect(roadDistanceAt(x, y), node.id).toBeGreaterThanOrEqual(6);
          expect(isWaterPoint(x, y), node.id).toBe(false);
        }
      }
    }
  });

  it('não muda vagas nem recria recompensas ao carregar IDs antigos esgotados', () => {
    const depleted = ['stone-23-18', 'fiber-31-19', 'vein-18-27'];
    expect(depleted.every(id => world.resources.some(node => node.id === id))).toBe(true);
    const loaded = createWorld(scene, depleted);
    expect(loaded.resources).toEqual(world.resources.filter(node => !depleted.includes(node.id)));
    for (const id of depleted) expect(loaded.resources.some(node => node.id === id)).toBe(false);
  });

  it('dá prioridade à construção salva na vaga nova, preservando IDs e disponibilidade', () => {
    const node = world.resources.find(resource => resource.id === 'stone-23-18')!;
    const building = { x: node.x, y: node.y, kind: 'floor' as const };
    const loaded = createWorld(scene, [], [building]);
    const relocated = loaded.resources.find(resource => resource.id === node.id)!;
    expect(loaded.resources).toHaveLength(world.resources.length);
    expect(new Set(loaded.resources.map(resource => resource.id))).toEqual(new Set(world.resources.map(resource => resource.id)));
    expect(relocated).toBeDefined();
    expect([relocated.x, relocated.y]).not.toEqual([building.x, building.y]);
    expect(loaded.resourceAt(building.x, building.y)).toBeUndefined();
    const depleted = createWorld(scene, [node.id], [building]);
    expect(depleted.resources).toEqual(loaded.resources.filter(resource => resource.id !== node.id));
    expect(building).toEqual({ x: node.x, y: node.y, kind: 'floor' });
  });

  it('continua a mineração parcial com o ID antigo depois de mover a rocha da trilha', () => {
    const node = world.resources.find(resource => resource.id === 'vein-18-27')!;
    expect(node).toBeDefined();
    expect([node.x, node.y]).not.toEqual([18, 27]);
    const inventory = new Inventory({ pickaxe: 1 });
    const resources = new Resources([{ id: node.id, hits: 3 }]);
    expect(resources.hit(node, 'hand', inventory).ok).toBe(false);
    expect(resources.hit(node, 'pickaxe', inventory).depleted).toBeUndefined();
    expect(inventory.data.stone).toBe(0);
    expect(resources.hit(node, 'pickaxe', inventory).depleted).toBe(true);
    expect(inventory.data.stone).toBe(4);
    expect(resources.hit(node, 'pickaxe', inventory).ok).toBe(false);
  });

  it('usa a margem contínua nos pés e mantém os mesmos centros de colisão', () => {
    for (let y = 1; y < WORLD_HEIGHT - 1; y++) for (let x = 1; x < WORLD_WIDTH - 1; x++) {
      expect(world.isBlockedPoint(x * 32 + 16, y * 32 + 16), `${x},${y}`).toBe(world.isBlocked(x, y));
    }
    expect(world.isBlockedPoint(44 * 32 + 16, 18 * 32 + 16)).toBe(false);
    expect(world.isBlockedPoint(80 * 32 + 16, 10 * 32 + 16)).toBe(true);
  });
});
