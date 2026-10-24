import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type Phaser from 'phaser';
import { createWorld, type WorldView } from '../src/world';
import { emptyMapEdits, isProtectedMapTile } from '../src/systems/map-editor';
import { createNewSave, loadSave, saveGame, validateSave } from '../src/systems/save';
import type { CharacterProfile } from '../src/types';

vi.mock('../src/water-motion',()=>({addWaterMotion:vi.fn()}));
vi.mock('phaser', () => ({ default: { Textures: { FilterMode: { NEAREST: 0 } } } }));
vi.mock('../src/map-editor-terrain', () => ({ drawMapTerrainEdits: vi.fn() }));
const object = {
  setDisplaySize() { return this; }, setOrigin() { return this; }, setScale() { return this; }, setDepth() { return this; }, destroy() { return this; },
  fillStyle() { return this; }, fillRect() { return this; }, lineStyle() { return this; }, lineBetween() { return this; },
};
const scene = {
  textures: { exists: () => false, addCanvas: () => ({ setFilter() { return this; } }) },
  add: { image: () => Object.create(object), graphics: () => Object.create(object), text: () => Object.create(object) },
} as unknown as Phaser.Scene;
const profile: CharacterProfile = { name: 'Mapa', skin: '#d9a276', hairStyle: 'preso', hairColor: '#754323', outfit: '#638a9d' };
let baseline: WorldView;
beforeAll(() => {
  vi.stubGlobal('document', { createElement: () => ({ width: 0, height: 0, getContext: () => ({ fillStyle: '', fillRect() {} }) }) });
  const entries = new Map<string, string>();
  vi.stubGlobal('localStorage', { getItem: (key: string) => entries.get(key) ?? null, setItem: (key: string, value: string) => entries.set(key, value), removeItem: (key: string) => entries.delete(key) });
  baseline = createWorld(scene, []);
});
afterAll(() => vi.unstubAllGlobals());

describe('mapa editado no mundo e na partida', () => {
  it('mover uma árvore preserva todos os outros recursos, suas posições e IDs', () => {
    const original = baseline.resources.find(o => o.kind === 'standingTree' && !isProtectedMapTile(o.x, o.y))!;
    const edits = emptyMapEdits(); edits.objects[original.id] = { x: 67, y: 18 };
    const edited = createWorld(scene, [], [], edits);
    expect(edited.resources.filter(o => o.id !== original.id)).toEqual(baseline.resources.filter(o => o.id !== original.id));
    expect(edited.resourceAt(67, 18)?.id).toBe(original.id);
    expect(edited.isBlocked(original.x, original.y)).toBe(false);
    expect(edited.isBlocked(67, 18)).toBe(true);
    const harvested = createWorld(scene, [original.id], [], edits);
    expect(harvested.resourceAt(67, 18)).toBeUndefined();
    expect(harvested.isBlocked(67, 18)).toBe(false);
    expect(harvested.editorObjects.find(o => o.id === original.id)?.depleted).toBe(true);
  });
  it('água e terra pintadas mudam a colisão por pixel e a construção no mesmo ponto', () => {
    const edits = emptyMapEdits(); edits.terrain['67,18'] = 'water'; edits.terrain['44,20'] = 'grass';
    const edited = createWorld(scene, [], [], edits);
    for (const offset of [1, 16, 31]) {
      expect(edited.isBlockedPoint(67 * 32 + offset, 18 * 32 + offset)).toBe(true);
      expect(edited.isBlockedPoint(44 * 32 + offset, 20 * 32 + offset)).toBe(false);
    }
    expect(edited.isBuildable(67, 18)).toBe(false);
    expect(edited.isBuildable(44, 20)).toBe(true);
    expect(edited.isBlocked(44, 18)).toBe(false); // Existing bridge.
  });
  it('recarrega recurso novo com golpes parciais e sem repetir uma recompensa já coletada', () => {
    const save = createNewSave(profile); save.mapEdits = emptyMapEdits();
    const id = 'editor-pine-test'; save.mapEdits.objects[id] = { x: 67, y: 18, kind: 'pine' };
    save.resourceProgress = [{ id, hits: 2 }]; save.inventory.wood = 17;
    save.homeSupplies = { wateringCan: true, seedPacket: true };
    expect(saveGame(save)).toBe(true);
    let loaded = loadSave()!;
    expect(loaded.resourceProgress).toEqual([{ id, hits: 2 }]);
    expect(createWorld(scene, [], [], loaded.mapEdits).resourceAt(67, 18)).toMatchObject({ id, kind: 'standingTree' });
    loaded.resourceProgress = []; loaded.depletedResources.push(id);
    loaded.mapEdits!.objects[id].x = 68;
    expect(saveGame(loaded)).toBe(true); loaded = loadSave()!;
    expect(loaded.inventory.wood).toBe(17);
    expect(loaded.homeSupplies).toEqual({ wateringCan: true, seedPacket: true });
    const world = createWorld(scene, loaded.depletedResources, [], loaded.mapEdits);
    expect(world.resourceAt(68, 18)).toBeUndefined();
    expect(world.editorObjects.find(o => o.id === id)?.depleted).toBe(true);
  });
  it('remover um recurso oculta somente aquele ID sem fingir uma coleta', () => {
    const original = baseline.resources.find(o => o.kind === 'stone' && !isProtectedMapTile(o.x, o.y))!;
    const edits = emptyMapEdits(); edits.objects[original.id] = { x: original.x, y: original.y, removed: true };
    const edited = createWorld(scene, [], [], edits);
    expect(edited.resources).toEqual(baseline.resources.filter(o => o.id !== original.id));
    expect(createWorld(scene, [], [], emptyMapEdits()).resources).toEqual(baseline.resources);
  });
  it('aceita save antigo e recusa progresso customizado sem o objeto correspondente', () => {
    const save = createNewSave(profile); expect(validateSave(save)).toBe(true);
    save.resourceProgress = [{ id: 'editor-vein-missing', hits: 2 }]; expect(validateSave(save)).toBe(false);
    save.mapEdits = emptyMapEdits(); save.mapEdits.objects['editor-vein-missing'] = { x: 67, y: 18, kind: 'vein', removed: true };
    expect(validateSave(save)).toBe(true);
    save.mapEdits.objects['editor-vein-missing'].kind = 'stone'; expect(validateSave(save)).toBe(false);
  });
});
