import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_ACCESSORY, DEFAULT_SHIRT_COLOR, resolveCharacterAppearance } from '../src/data/character-options';
import { createNewSave, loadSave, migrateSave, SAVE_KEY, saveGame, validateProfile, validateSave } from '../src/systems/save';
import type { CharacterProfile } from '../src/types';

const legacyProfile: CharacterProfile = {
  name: 'Ana', skin: '#d9a474', hairStyle: 'preso', hairColor: '#4b3029', outfit: '#638a9d',
};

function installStorage(raw?: string) {
  const values = new Map<string, string>(raw ? [[SAVE_KEY, raw]] : []);
  const storage = {
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => { values.set(key, value); }),
    removeItem: vi.fn((key: string) => { values.delete(key); }),
  };
  vi.stubGlobal('localStorage', storage);
  return { values, storage };
}

afterEach(() => vi.unstubAllGlobals());

describe('personalização compatível com partidas existentes', () => {
  it('resolve camisa e bolsa do modelo original sem alterar o perfil antigo', () => {
    const profile = { ...legacyProfile };
    expect(resolveCharacterAppearance(profile)).toEqual({
      ...profile, shirtColor: DEFAULT_SHIRT_COLOR, accessory: DEFAULT_ACCESSORY,
    });
    expect(profile).toEqual(legacyProfile);
    expect('shirtColor' in profile).toBe(false);
    expect('accessory' in profile).toBe(false);
  });

  it.each(['bolsa', 'nenhum'] as const)('salva e restaura a camisa e o acessório %s escolhidos', (accessory) => {
    installStorage();
    const profile: CharacterProfile = {
      ...legacyProfile, name: '  Joana  ', hairStyle: 'longo', skin: '#69432f',
      hairColor: '#a85b33', outfit: '#6d8655', shirtColor: '#c67851', accessory,
    };
    const saved = createNewSave(profile);
    expect(saved.profile).toEqual({ ...profile, name: 'Joana' });
    expect(saveGame(saved)).toBe(true);
    const restored = loadSave()!;
    expect(restored).toEqual(saved);
    expect(resolveCharacterAppearance(restored.profile)).toEqual(saved.profile);
    restored.profile.shirtColor = '#ffffff';
    expect(saved.profile.shirtColor).toBe('#c67851');
  });

  it('carrega a versão 2 sem personalização nova e mantém o JSON original intacto', () => {
    const saved = createNewSave(legacyProfile);
    const raw = JSON.stringify(saved, null, 2);
    const { storage, values } = installStorage(raw);
    const restored = loadSave()!;
    expect(restored.profile).toEqual(legacyProfile);
    expect(validateSave(restored)).toBe(true);
    expect(resolveCharacterAppearance(restored.profile).accessory).toBe('bolsa');
    expect(values.get(SAVE_KEY)).toBe(raw);
    expect(storage.setItem).not.toHaveBeenCalled();
    expect(storage.removeItem).not.toHaveBeenCalled();
  });

  it('migra a versão 1 com a aparência antiga sem adicionar campos ao documento de origem', () => {
    const saved = createNewSave(legacyProfile);
    const legacy = {
      ...saved, version: 1,
      inventory: { wood: 4, stone: 2, seeds: 1, turnip: 0 },
    };
    const original = structuredClone(legacy);
    const migrated = migrateSave(legacy)!;
    expect(migrated.version).toBe(2);
    expect(migrated.profile).toEqual(legacyProfile);
    expect(resolveCharacterAppearance(migrated.profile).shirtColor).toBe(DEFAULT_SHIRT_COLOR);
    expect(legacy).toEqual(original);
  });

  it.each([
    { shirtColor: '#fff' }, { shirtColor: 'vermelho' }, { shirtColor: null },
    { shirtColor: 123 }, { accessory: 'chapéu' }, { accessory: null }, { accessory: false },
  ])('recusa personalização corrompida: %j', (invalid) => {
    const saved = createNewSave(legacyProfile);
    const profile = { ...saved.profile, ...invalid };
    expect(validateProfile(profile)).toBe(false);
    expect(validateSave({ ...saved, profile })).toBe(false);
    expect(migrateSave({ ...saved, profile })).toBeNull();
    const { storage } = installStorage();
    expect(saveGame({ ...saved, profile } as unknown as typeof saved)).toBe(false);
    expect(storage.setItem).not.toHaveBeenCalled();
  });
});
