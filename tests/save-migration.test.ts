import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CharacterProfile, SaveData } from '../src/types';
import { BLUEPRINT_COST } from '../src/data/blueprints';
import { TILE, WORLD_HEIGHT, WORLD_WIDTH } from '../src/data/regions';
import { Building } from '../src/systems/building';
import { Inventory, ITEM_IDS } from '../src/systems/inventory';
import { Resources } from '../src/systems/resources';
import { detectShelter } from '../src/systems/shelter';
import {
  createNewSave, hasSave, loadSave, migrateSave, SAVE_BACKUP_KEY, SAVE_KEY, saveGame, validateSave,
} from '../src/systems/save';

const profile: CharacterProfile = {
  name: 'Joana', skin: '#bd8069', hairStyle: 'longo', hairColor: '#4a352d', outfit: '#789061',
};

function legacySave() {
  return {
    version: 1,
    profile: { ...profile },
    player: { x: 656, y: 592 },
    inventory: { wood: 37, stone: 18, seeds: 5, turnip: 9 },
    crops: [{ x: 22, y: 21, growth: 0.65, watered: true }],
    buildings: [{ x: 19, y: 18, kind: 'fence' }, { x: 20, y: 18, kind: 'bench' }],
    depletedResources: ['tree-16-23', 'stone-31-26', 'seeds-12-22'],
    day: 7, time: 1245, metLia: true,
  };
}

function installStorage(initial: Array<[string, string]> = []) {
  const values = new Map<string, string>(initial);
  const storage = {
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => { values.set(key, value); }),
    removeItem: vi.fn((key: string) => { values.delete(key); }),
  };
  vi.stubGlobal('localStorage', storage);
  return { values, storage };
}

function completeSnapshot(): SaveData {
  const saved = createNewSave(profile);
  Object.assign(saved.inventory, { wood: 18, stone: 11, seeds: 3, turnip: 2, branch: 5, log: 2, plank: 8, scrap: 4, hatchet: 1, pickaxe: 1, handsaw: 1, fiber: 9, cord: 3, flakedStone: 2, handle: 1, peg: 4, blade: 1, board: 3, hammer: 1 });
  saved.player.direction = 'up';
  saved.equippedTool = 'pickaxe';
  saved.progress = { collected: true, craftedTools: true, harvested: true, processed: true, builtWorkbench: true, sawn: true, builtShelter: false };
  saved.resourceProgress = [{ id: 'standingTree-8-12', hits: 3 }, { id: 'vein-10-12', hits: 4 }];
  saved.depletedResources = ['tree-16-23', 'scrap-6-9'];
  saved.crops = [{ x: 21, y: 20, growth: 0.5, watered: true }];
  saved.buildings = [
    { x: 5, y: 5, kind: 'fence' }, { x: 6, y: 5, kind: 'bench' },
    { x: 7, y: 5, kind: 'workbench' }, { x: 8, y: 5, kind: 'wall' },
    { x: 9, y: 5, kind: 'door', open: true },
  ];
  saved.day = 14;
  saved.time = 1115;
  saved.metLia = true;
  return saved;
}

afterEach(() => vi.unstubAllGlobals());

describe('migração e proteção da partida existente', () => {
  it('preserva a partida v1 e inicia os novos itens sem conceder recursos ou ferramentas', () => {
    const legacy = legacySave();
    const original = structuredClone(legacy);
    const migrated = migrateSave(legacy)!;
    expect(migrated).not.toBeNull();
    expect(validateSave(migrated)).toBe(true);
    expect(migrated.version).toBe(2);
    expect(migrated.profile).toEqual(legacy.profile);
    expect(migrated.player).toEqual(legacy.player);
    expect(migrated.crops).toEqual(legacy.crops);
    expect(migrated.buildings).toEqual(legacy.buildings);
    expect(migrated.depletedResources).toEqual(legacy.depletedResources);
    expect(migrated.day).toBe(7);
    expect(migrated.time).toBe(1245);
    expect(migrated.metLia).toBe(true);
    const oldItems = ['wood', 'stone', 'seeds', 'turnip'] as const;
    for (const item of oldItems) expect(migrated.inventory[item]).toBe(legacy.inventory[item]);
    for (const item of ITEM_IDS.filter((item) => !oldItems.includes(item as typeof oldItems[number]))) {
      expect(migrated.inventory[item]).toBe(0);
    }
    expect(migrated.resourceProgress).toEqual([]);
    expect(migrated.equippedTool).toBe('hand');
    expect(migrated.progress).toEqual({ collected: true, craftedTools: false, harvested: false, processed: false, builtWorkbench: false, sawn: false, builtShelter: false });
    migrated.profile.name = 'Outro nome';
    migrated.inventory.wood = 0;
    migrated.crops[0].growth = 0;
    migrated.buildings[0].kind = 'workbench';
    migrated.depletedResources.push('tree-9-9');
    expect(legacy).toEqual(original);
  });

  it('carrega e detecta v1 sem escrever, migrar ou reformatar o arquivo original', () => {
    const raw = JSON.stringify(legacySave(), null, 2);
    const { values, storage } = installStorage([[SAVE_KEY, raw]]);
    expect(loadSave()?.version).toBe(2);
    expect(hasSave()).toBe(true);
    expect(storage.setItem).not.toHaveBeenCalled();
    expect(storage.removeItem).not.toHaveBeenCalled();
    expect(values.get(SAVE_KEY)).toBe(raw);
    expect(values.has(SAVE_BACKUP_KEY)).toBe(false);
  });

  it('faz backup exato de v1 antes do primeiro salvamento v2 e o mantém nos seguintes', () => {
    const raw = JSON.stringify(legacySave(), null, 2);
    const { values, storage } = installStorage([[SAVE_KEY, raw]]);
    const migrated = loadSave()!;
    expect(saveGame(migrated)).toBe(true);
    expect(storage.setItem).toHaveBeenNthCalledWith(1, SAVE_BACKUP_KEY, raw);
    expect(storage.setItem).toHaveBeenNthCalledWith(2, SAVE_KEY, JSON.stringify(migrated));
    expect(values.get(SAVE_BACKUP_KEY)).toBe(raw);
    expect(JSON.parse(values.get(SAVE_KEY)!)).toEqual(migrated);
    migrated.day += 1;
    expect(saveGame(migrated)).toBe(true);
    expect(values.get(SAVE_BACKUP_KEY)).toBe(raw);
    expect(storage.setItem.mock.calls.filter(([key]) => key === SAVE_BACKUP_KEY)).toHaveLength(1);
  });

  it('mantém o slot v1 intacto se não conseguir gravar o backup', () => {
    const raw = JSON.stringify(legacySave(), null, 2);
    const { values, storage } = installStorage([[SAVE_KEY, raw]]);
    storage.setItem.mockImplementation((key, value) => {
      if (key === SAVE_BACKUP_KEY) throw new Error('Armazenamento sem espaço.');
      values.set(key, value);
    });
    const migrated = loadSave()!;
    expect(saveGame(migrated)).toBe(false);
    expect(values.get(SAVE_KEY)).toBe(raw);
    expect(values.has(SAVE_BACKUP_KEY)).toBe(false);
    expect(storage.setItem).toHaveBeenCalledTimes(1);
    expect(storage.setItem).toHaveBeenCalledWith(SAVE_BACKUP_KEY, raw);
  });

  it('preserva um save de versão futura mesmo quando já existe backup de uma partida antiga', () => {
    const future = JSON.stringify({ ...createNewSave(profile), version: 3 });
    const backup = JSON.stringify(legacySave());
    const { values, storage } = installStorage([[SAVE_KEY, future], [SAVE_BACKUP_KEY, backup]]);
    expect(saveGame(createNewSave(profile))).toBe(false);
    expect(values.get(SAVE_KEY)).toBe(future);
    expect(values.get(SAVE_BACKUP_KEY)).toBe(backup);
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it.each([3, 99])('recusa a versão futura %s sem modificar o armazenamento na leitura', (version) => {
    const future = { ...completeSnapshot(), version };
    const raw = JSON.stringify(future);
    const { values, storage } = installStorage([[SAVE_KEY, raw]]);
    expect(validateSave(future)).toBe(false);
    expect(migrateSave(future)).toBeNull();
    expect(loadSave()).toBeNull();
    expect(hasSave()).toBe(false);
    expect(storage.setItem).not.toHaveBeenCalled();
    expect(values.get(SAVE_KEY)).toBe(raw);
  });
});

describe('salvamento dos sistemas da fatia jogável', () => {
  it('restaura ferramentas, progresso, porta aberta e os golpes parciais para continuar jogando', () => {
    const { storage } = installStorage();
    const snapshot = completeSnapshot();
    expect(saveGame(snapshot)).toBe(true);
    const restored = loadSave()!;
    expect(restored).toEqual(snapshot);
    expect(restored).not.toBe(snapshot);
    expect(storage.setItem.mock.calls.some(([key]) => key === SAVE_BACKUP_KEY)).toBe(false);
    const buildings = new Building(restored.buildings);
    expect(buildings.isBlocked(9, 5)).toBe(false);
    const inventory = new Inventory(restored.inventory);
    const resources = new Resources(restored.resourceProgress);
    expect(resources.hit({ id: 'standingTree-8-12', kind: 'standingTree', x: 8, y: 12 }, 'hatchet', inventory).depleted).toBe(true);
    expect(resources.hit({ id: 'vein-10-12', kind: 'vein', x: 10, y: 12 }, restored.equippedTool, inventory).depleted).toBe(true);
    expect(inventory.data.log).toBe(snapshot.inventory.log + 2);
    expect(inventory.data.branch).toBe(snapshot.inventory.branch + 3);
    expect(inventory.data.stone).toBe(snapshot.inventory.stone + 4);
    expect(inventory.data.scrap).toBe(snapshot.inventory.scrap);
    expect(resources.progress).toEqual([]);
    expect(restored.resourceProgress).toEqual(snapshot.resourceProgress);
  });

  it('restaura um projeto real com piso, estrutura e cobertura sobrepostos e a direção do personagem', () => {
    installStorage();
    const inventory = new Inventory({ ...BLUEPRINT_COST, hammer: 1 });
    const originalBuildings = new Building();
    expect(originalBuildings.placeBlueprint({ x: 5, y: 7 }, inventory, () => true, { nearWorkbench: true }).ok).toBe(true);
    const snapshot = createNewSave(profile);
    snapshot.inventory = { ...inventory.data };
    snapshot.buildings = originalBuildings.buildings.map((building) => ({ ...building }));
    snapshot.player = { x: 6 * 32 + 16, y: 8 * 32 + 16, direction: 'left' };
    snapshot.progress.builtShelter = true;
    expect(saveGame(snapshot)).toBe(true);
    const restored = loadSave()!;
    expect(restored).toEqual(snapshot);
    expect(restored.player.direction).toBe('left');
    const buildings = new Building(restored.buildings);
    expect(buildings.at(5, 7, 'floor')?.kind).toBe('floor');
    expect(buildings.at(5, 7, 'structure')?.kind).toBe('wall');
    expect(buildings.at(5, 7, 'roof')).toMatchObject({ kind: 'roof', rotation: 0 });
    expect(buildings.at(7, 7, 'roof')?.x).toBe(5);
    expect(detectShelter({ x: 6, y: 8 }, buildings.buildings).sheltered).toBe(true);
  });

  it('recusa sobreposição na mesma camada mesmo quando as coberturas têm âncoras diferentes', () => {
    const snapshot = completeSnapshot();
    snapshot.buildings = [{ x: 5, y: 7, kind: 'roof' }, { x: 7, y: 7, kind: 'roof' }];
    expect(validateSave(snapshot)).toBe(false);
  });

  it.each([
    { x: WORLD_WIDTH - 3, y: 7, rotation: 0 as const },
    { x: 5, y: WORLD_HEIGHT - 3, rotation: 1 as const },
    { x: 19, y: 20, rotation: 0 as const },
  ])('recusa uma cobertura cujo footprint atravessa o limite ou canteiro em $x,$y', (roof) => {
    const snapshot = completeSnapshot();
    snapshot.buildings = [{ ...roof, kind: 'roof' }];
    expect(validateSave(snapshot)).toBe(false);
  });

  it('preserva a rotação vertical de uma cobertura e rejeita direções inválidas do personagem', () => {
    installStorage();
    const snapshot = completeSnapshot();
    snapshot.buildings.push({ x: 12, y: 7, kind: 'roof', rotation: 1 });
    expect(saveGame(snapshot)).toBe(true);
    expect(loadSave()?.buildings.at(-1)).toMatchObject({ kind: 'roof', rotation: 1 });
    expect(validateSave({ ...snapshot, player: { ...snapshot.player, direction: 'diagonal' } })).toBe(false);
  });

  it('recusa progresso parcial de um recurso que já foi esgotado', () => {
    const snapshot = completeSnapshot();
    snapshot.depletedResources.push(snapshot.resourceProgress[0].id);
    expect(validateSave(snapshot)).toBe(false);
  });

  it.each([
    { id: 'standingTree-8-12', hits: 4 },
    { id: 'vein-10-12', hits: 5 },
    { id: 'standingTree-8-12', hits: 0 },
    { id: 'vein-10-12', hits: 1.5 },
  ])('recusa contagem inválida no progresso de $id: $hits', (progress) => {
    const snapshot = completeSnapshot();
    snapshot.resourceProgress = [progress];
    expect(validateSave(snapshot)).toBe(false);
  });

  it('recusa entradas duplicadas de golpes para impedir recuperar o mesmo progresso duas vezes', () => {
    const snapshot = completeSnapshot();
    snapshot.resourceProgress.push({ ...snapshot.resourceProgress[0] });
    expect(validateSave(snapshot)).toBe(false);
  });

  it.each(['hatchet', 'pickaxe'] as const)('recusa %s equipada sem posse e aceita quando a ferramenta existe', (tool) => {
    const snapshot = completeSnapshot();
    snapshot.equippedTool = tool;
    snapshot.inventory[tool] = 0;
    expect(validateSave(snapshot)).toBe(false);
    snapshot.inventory[tool] = 1;
    expect(validateSave(snapshot)).toBe(true);
  });
});

describe('persistência nas regiões ampliadas', () => {
  it.each([
    { name: 'Bosque do Pinheiro', x: 72, y: 20 },
    { name: 'Campos Abertos', x: 25, y: 55 },
  ])('restaura posição, abrigo, coleta e golpes parciais em $name', ({ x, y }) => {
    installStorage();
    const snapshot = completeSnapshot();
    const inventory = new Inventory({ ...snapshot.inventory, ...BLUEPRINT_COST, hammer: 1 });
    const buildings = new Building();
    expect(buildings.placeBlueprint({ x: x - 1, y: y - 1 }, inventory, () => true, { nearWorkbench: true }).ok).toBe(true);
    snapshot.inventory = { ...inventory.data };
    snapshot.player = { x: x * TILE + TILE / 2, y: y * TILE + TILE / 2, direction: 'right' };
    snapshot.buildings = buildings.buildings;
    snapshot.depletedResources.push(`fiber-${x + 4}-${y}`);
    const tree = { id: `standingTree-${x + 3}-${y + 2}`, kind: 'standingTree' as const, x: x + 3, y: y + 2 };
    snapshot.resourceProgress = [{ id: tree.id, hits: 3 }];
    expect(saveGame(snapshot)).toBe(true);
    const restored = loadSave()!;
    expect(restored).toEqual(snapshot);
    expect(detectShelter({ x, y }, restored.buildings).sheltered).toBe(true);
    const restoredInventory = new Inventory(restored.inventory);
    const resources = new Resources(restored.resourceProgress);
    expect(resources.hit(tree, 'hatchet', restoredInventory).depleted).toBe(true);
    expect(restoredInventory.data.log).toBe(snapshot.inventory.log + 2);
    expect(restoredInventory.data.branch).toBe(snapshot.inventory.branch + 3);
    expect(resources.hit(tree, 'hatchet', restoredInventory).ok).toBe(false);
    expect(restoredInventory.data.log).toBe(snapshot.inventory.log + 2);
  });

  it('recusa posições e golpes além das bordas do mapa ampliado', () => {
    const snapshot = completeSnapshot();
    expect(validateSave({ ...snapshot, player: { x: WORLD_WIDTH * TILE, y: snapshot.player.y } })).toBe(false);
    expect(validateSave({ ...snapshot, player: { x: snapshot.player.x, y: WORLD_HEIGHT * TILE } })).toBe(false);
    expect(validateSave({ ...snapshot, resourceProgress: [{ id: `standingTree-${WORLD_WIDTH - 1}-20`, hits: 1 }] })).toBe(false);
    expect(validateSave({ ...snapshot, resourceProgress: [{ id: `vein-20-${WORLD_HEIGHT - 1}`, hits: 1 }] })).toBe(false);
  });

  it('preserva um save v2 anterior sem reformatar o slot nem criar outro backup', () => {
    const snapshot = completeSnapshot();
    const raw = JSON.stringify(snapshot, null, 2);
    const { values, storage } = installStorage([[SAVE_KEY, raw]]);
    expect(loadSave()).toEqual(snapshot);
    expect(storage.setItem).not.toHaveBeenCalled();
    expect(values.get(SAVE_KEY)).toBe(raw);
    expect(saveGame(snapshot)).toBe(true);
    expect(values.has(SAVE_BACKUP_KEY)).toBe(false);
  });
});
