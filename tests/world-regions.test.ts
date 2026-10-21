import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type Phaser from 'phaser';
import { createWorld, type WorldView } from '../src/world';
import { getRegionAt, isBridgeTile, isWaterTile, locationAt, REGIONS, WORLD_HEIGHT, WORLD_WIDTH } from '../src/data/regions';

vi.mock('phaser', () => ({ default: { Textures: { FilterMode: { NEAREST: 0 } } } }));

// O teste exercita o mapa real e suas colisões sem precisar de WebGL/DOM.
const object = {
  setOrigin() { return this; }, setDepth() { return this; }, destroy() { return this; },
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

  it('mantém água bloqueada, pontes transitáveis e casas/ruínas com colisão', () => {
    expect(isWaterTile(44, 18)).toBe(true);
    expect(isBridgeTile(44, 18)).toBe(true);
    expect(world.isBlocked(44, 18)).toBe(false);
    expect(world.isBlocked(44, 20)).toBe(true);
    expect(world.isBlocked(80, 10)).toBe(true);
    expect(world.isBlocked(24, 13)).toBe(true);
    expect(world.isBlocked(8, 16)).toBe(true);
    expect(world.isBlocked(78, 26)).toBe(true);
    expect(world.isBlocked(31, 59)).toBe(true);
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
    expect(locationAt(25, 18)).toBe('Minha propriedade');
    expect(locationAt(10, 18)).toBe('Ruínas do antigo moinho');
    expect(locationAt(70, 18)).toBe('Bosque do Pinheiro');
    expect(locationAt(25, 53)).toBe('Campos Abertos');
  });
});
