import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CharacterProfile } from '../src/types';
import { Building, BUILD_COSTS } from '../src/systems/building';
import { Farming, GROWTH_SECONDS } from '../src/systems/farming';
import { Inventory } from '../src/systems/inventory';
import { getLiaDialogue } from '../src/systems/npc';
import { createNewSave, hasSave, loadSave, SAVE_KEY, saveGame, validateSave } from '../src/systems/save';

const profile: CharacterProfile = { name: 'Ana', skin: '#bc795e', hairStyle: 'preso', hairColor: '#3d302d', outfit: '#69856b' };

afterEach(() => vi.unstubAllGlobals());

describe('mochila', () => {
  it('não compartilha estoque entre novos jogos', () => {
    const first = new Inventory();
    const second = new Inventory();
    first.add('wood', 7);
    expect(first.data.wood).toBe(19);
    expect(second.data.wood).toBe(12);
  });

  it('consome custos de forma atômica', () => {
    const inventory = new Inventory({ wood: 5, stone: 0, seeds: 1, turnip: 0 });
    expect(inventory.spend({ wood: 2, stone: 1 })).toBe(false);
    expect(inventory.data.wood).toBe(5);
    expect(inventory.spend({ wood: 2, seeds: 1 })).toBe(true);
    expect(inventory.data).toEqual({ wood: 3, stone: 0, seeds: 0, turnip: 0 });
  });

  it('recusa quantidades negativas ou fracionárias', () => {
    const inventory = new Inventory();
    expect(inventory.spend({ wood: -2 })).toBe(false);
    expect(inventory.spend({ wood: 0.5 })).toBe(false);
    expect(() => inventory.add('wood', Number.NaN)).toThrow(RangeError);
    expect(inventory.data.wood).toBe(12);
  });
});

describe('horta', () => {
  it('executa plantar, regar, crescer e colher com devolução de semente', () => {
    const inventory = new Inventory();
    const farming = new Farming();
    expect(farming.plant(21, 20, inventory).ok).toBe(true);
    expect(inventory.data.seeds).toBe(7);
    farming.update(GROWTH_SECONDS);
    expect(farming.cropAt(21, 20)?.growth).toBe(0);
    expect(farming.water(21, 20).ok).toBe(true);
    farming.update(GROWTH_SECONDS / 2);
    expect(farming.harvest(21, 20, inventory).ok).toBe(false);
    farming.update(GROWTH_SECONDS / 2);
    expect(farming.harvest(21, 20, inventory).ok).toBe(true);
    expect(inventory.data.turnip).toBe(1);
    expect(inventory.data.seeds).toBe(8);
    expect(farming.crops).toEqual([]);
  });

  it('mantém a mesma duração com diferentes taxas de quadros', () => {
    const fast = new Farming([{ x: 21, y: 20, watered: true, growth: 0 }]);
    const slow = new Farming([{ x: 21, y: 20, watered: true, growth: 0 }]);
    for (let i = 0; i < 30 * 60; i++) fast.update(1 / 60);
    for (let i = 0; i < 30 * 20; i++) slow.update(1 / 20);
    expect(fast.crops[0].growth).toBeCloseTo(slow.crops[0].growth, 9);
    expect(fast.crops[0].growth).toBeCloseTo(2 / 3, 9);
  });

  it('recusa sobreposição e plantio fora do canteiro sem consumir sementes', () => {
    const inventory = new Inventory();
    const farming = new Farming();
    expect(farming.plant(1, 1, inventory).ok).toBe(false);
    expect(inventory.data.seeds).toBe(8);
    farming.plant(22, 22, inventory);
    expect(farming.plant(22, 22, inventory).ok).toBe(false);
    expect(inventory.data.seeds).toBe(7);
  });

  it('não muda o save original nem progride sem update da simulação', () => {
    const saved = [{ x: 22, y: 22, growth: 0.5, watered: true }];
    const farming = new Farming(saved);
    expect(farming.crops[0].growth).toBe(0.5);
    farming.update(-1);
    farming.update(Number.POSITIVE_INFINITY);
    expect(farming.crops[0].growth).toBe(0.5);
    farming.update(2);
    expect(saved[0].growth).toBe(0.5);
  });
});

describe('construção', () => {
  it.each(['fence', 'bench'] as const)('coloca e recolhe %s com reembolso integral', (kind) => {
    const inventory = new Inventory();
    const before = { ...inventory.data };
    const building = new Building();
    expect(building.place(kind, 19, 20, inventory, true).ok).toBe(true);
    expect(inventory.data.wood).toBe(before.wood - BUILD_COSTS[kind].wood!);
    expect(building.remove(19, 20, inventory).ok).toBe(true);
    expect(inventory.data).toEqual(before);
    expect(building.buildings).toEqual([]);
  });

  it('não cobra nem substitui construção ao tentar sobrepor', () => {
    const inventory = new Inventory();
    const building = new Building();
    building.place('fence', 19, 20, inventory, true);
    const before = { ...inventory.data };
    expect(building.place('bench', 19, 20, inventory, true).ok).toBe(false);
    expect(inventory.data).toEqual(before);
    expect(building.at(19, 20)?.kind).toBe('fence');
  });

  it('recusa espaço bloqueado e estoque insuficiente', () => {
    const inventory = new Inventory({ wood: 1, stone: 0, seeds: 0, turnip: 0 });
    const building = new Building();
    expect(building.place('fence', 19, 20, inventory, true).ok).toBe(false);
    expect(building.place('fence', 19, 20, new Inventory(), false).ok).toBe(false);
    expect(building.buildings).toEqual([]);
  });

  it('não dá materiais ao recolher espaço vazio', () => {
    const inventory = new Inventory();
    const before = { ...inventory.data };
    expect(new Building().remove(19, 20, inventory).ok).toBe(false);
    expect(inventory.data).toEqual(before);
  });
});

describe('salvamento', () => {
  it('valida e recupera uma sessão com planta e construção', () => {
    const saved = createNewSave(profile);
    saved.crops.push({ x: 21, y: 20, growth: 0.25, watered: true });
    saved.buildings.push({ x: 19, y: 20, kind: 'bench' });
    saved.depletedResources.push('tree-3');
    const values = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    });
    expect(saveGame(saved)).toBe(true);
    expect(hasSave()).toBe(true);
    expect(loadSave()).toEqual(saved);
    expect(values.has(SAVE_KEY)).toBe(true);
  });

  it('recusa versão desconhecida, coordenadas inválidas e estoque negativo', () => {
    const base = createNewSave(profile);
    expect(validateSave(base)).toBe(true);
    expect(validateSave({ ...base, version: 2 })).toBe(false);
    expect(validateSave({ ...base, player: { x: Number.NaN, y: 1 } })).toBe(false);
    expect(validateSave({ ...base, inventory: { ...base.inventory, seeds: -1 } })).toBe(false);
    expect(validateSave({ ...base, profile: { ...profile, name: '  ' } })).toBe(false);
  });

  it('recusa duplicação de plantas e construções inválidas', () => {
    const base = createNewSave(profile);
    const crop = { x: 21, y: 20, growth: 0, watered: false };
    expect(validateSave({ ...base, crops: [crop, crop] })).toBe(false);
    expect(validateSave({ ...base, crops: [{ ...crop, x: 0 }] })).toBe(false);
    expect(validateSave({ ...base, crops: [{ ...crop, growth: 1 }] })).toBe(false);
    expect(validateSave({ ...base, buildings: [{ x: 19, y: 20, kind: 'torre' }] })).toBe(false);
    expect(validateSave({ ...base, buildings: [{ x: 21, y: 20, kind: 'fence' }] })).toBe(false);
  });

  it('trata JSON corrompido e erro de acesso sem quebrar o jogo', () => {
    vi.stubGlobal('localStorage', { getItem: () => '{quebrado' });
    expect(loadSave()).toBe(null);
    vi.stubGlobal('localStorage', {
      getItem: () => { throw new Error('Indisponível'); },
      setItem: () => { throw new Error('Sem espaço'); },
    });
    expect(loadSave()).toBe(null);
    expect(saveGame(createNewSave(profile))).toBe(false);
  });
});

describe('Lia', () => {
  it('oferece apresentação e conversa posterior diferentes', () => {
    expect(getLiaDialogue(false).length).toBeGreaterThan(1);
    expect(getLiaDialogue(false)[0]).toContain('Lia');
    expect(getLiaDialogue(true)[0]).not.toBe(getLiaDialogue(false)[0]);
  });
});
