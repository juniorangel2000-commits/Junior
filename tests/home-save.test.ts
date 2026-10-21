import { afterEach, describe, expect, it, vi } from 'vitest';
import { createNewSave, loadSave, migrateSave, SAVE_KEY, saveGame, validateSave } from '../src/systems/save';
import { createDefaultHome, HOME_SPAWN, Home } from '../src/systems/home';
import type { CharacterProfile } from '../src/types';
const profile: CharacterProfile = { name: 'Ana', skin: '#bc795e', hairStyle: 'preso', hairColor: '#3d302d', outfit: '#69856b' };
afterEach(() => vi.unstubAllGlobals());
function storage(raw?: string) {
  const values = new Map<string, string>(raw ? [[SAVE_KEY, raw]] : []);
  const setItem = vi.fn((key: string, value: string) => values.set(key, value));
  vi.stubGlobal('localStorage', { getItem: (key: string) => values.get(key) ?? null, setItem });
  return { values, setItem };
}
describe('compatibilidade e persistência da casa', () => {
  it('aceita v2 sem interior e lê sem reescrever ou conceder itens', () => {
    const old = createNewSave(profile);
    old.inventory.log = 3;
    old.player = { x: 816, y: 592, direction: 'right' };
    const raw = JSON.stringify(old, null, 2);
    const disk = storage(raw);
    expect(loadSave()).toEqual(old);
    expect(disk.setItem).not.toHaveBeenCalled();
    expect(disk.values.get(SAVE_KEY)).toBe(raw);
    expect(new Home(loadSave()?.home).data).toEqual(createDefaultHome());
    expect(loadSave()?.inventory.log).toBe(3);
  });
  it('restaura decoração e posição interior sem substituir a posição externa', () => {
    storage();
    const save = createNewSave(profile);
    const home = new Home();
    expect(home.move('home-bed-1', 2, 3).ok).toBe(true);
    expect(home.place('chair', 9, 7).ok).toBe(true);
    expect(home.setStyle('dark', 'sage').ok).toBe(true);
    save.home = home.data;
    save.homePosition = { ...HOME_SPAWN, direction: 'up' };
    const outside = { ...save.player };
    expect(saveGame(save)).toBe(true);
    expect(loadSave()).toEqual(save);
    expect(loadSave()?.player).toEqual(outside);
    expect(loadSave()?.homePosition).toEqual(save.homePosition);
    expect(loadSave()?.home).not.toBe(save.home);
  });
  it('recusa decoração sobreposta e posição dentro de um móvel sem apagar o slot válido', () => {
    const save = createNewSave(profile);
    save.home = createDefaultHome();
    const disk = storage(JSON.stringify(save));
    const before = disk.values.get(SAVE_KEY);
    const bad = structuredClone(save);
    bad.home!.furniture.push({ id: 'home-chair-99', kind: 'chair', x: 2, y: 2 });
    expect(saveGame(bad)).toBe(false);
    expect(disk.values.get(SAVE_KEY)).toBe(before);
    expect(disk.setItem).not.toHaveBeenCalled();
    expect(validateSave({ ...save, homePosition: { x: 80, y: 80 } })).toBe(false);
    expect(validateSave({ ...save, homePosition: { x: 24, y: 272 } })).toBe(false);
    expect(validateSave({ ...save, homePosition: { ...HOME_SPAWN, direction: 'invalid' } })).toBe(false);
  });
  it('deixar o interior salva somente a posição externa e mantém os móveis', () => {
    storage();
    const save = createNewSave(profile);
    save.home = createDefaultHome();
    save.homePosition = { ...HOME_SPAWN };
    expect(saveGame(save)).toBe(true);
    save.homePosition = undefined;
    expect(saveGame(save)).toBe(true);
    expect(loadSave()?.homePosition).toBeUndefined();
    expect(loadSave()?.home).toEqual(save.home);
    expect(migrateSave(save)).toEqual(save);
  });
  it('salva os pés no batente da porta até o limite real da colisão', () => {
    storage();
    const save = createNewSave(profile);
    save.home = createDefaultHome();
    save.homePosition = { x: HOME_SPAWN.x, y: 316.5 };
    expect(saveGame(save)).toBe(true);
    expect(loadSave()?.homePosition?.y).toBe(316.5);
    expect(validateSave({ ...save, homePosition: { x: HOME_SPAWN.x, y: 317 } })).toBe(false);
  });
});
