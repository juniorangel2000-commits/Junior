import { afterEach, describe, expect, it, vi } from 'vitest';
import { createNewSave, loadSave, migrateSave, SAVE_KEY, saveGame, validateSave } from '../src/systems/save';
import { HOME_SPAWN } from '../src/systems/home';

afterEach(() => vi.unstubAllGlobals());

function fixture() {
  const disk = new Map<string, string>();
  const write = vi.fn((key: string, value: string) => disk.set(key, value));
  vi.stubGlobal('localStorage', { getItem: (key: string) => disk.get(key) ?? null, setItem: write });
  const data = createNewSave({ name: 'Ana', skin: '#d9a276', hairStyle: 'preso', hairColor: '#754323', outfit: '#638a9d' });
  data.inventory.branch = 3;
  data.homeSupplies = { wateringCan: true, seedPacket: true };
  return { data, disk, write };
}

describe('orientação salva no mundo e no interior', () => {
  it.each(['down', 'left', 'right', 'up', 'down-left', 'down-right', 'up-left', 'up-right'] as const)(
    'restaura %s sem alterar estoque ou recompensas', direction => {
      const { data } = fixture();
      data.player.direction = direction;
      data.homePosition = { ...HOME_SPAWN, direction };
      expect(saveGame(data)).toBe(true);
      expect(loadSave()).toEqual(data);
      expect(migrateSave(data)).toEqual(data);
    },
  );

  it('mantém saves anteriores sem direção e não os reescreve ao ler', () => {
    const { data, disk, write } = fixture();
    const raw = JSON.stringify(data, null, 2);
    disk.set(SAVE_KEY, raw);
    expect(loadSave()).toEqual(data);
    expect(write).not.toHaveBeenCalled();
    expect(disk.get(SAVE_KEY)).toBe(raw);
  });

  it('recusa direções inválidas em qualquer área sem apagar o save válido', () => {
    const { data, disk, write } = fixture();
    expect(saveGame(data)).toBe(true);
    const raw = disk.get(SAVE_KEY);
    write.mockClear();
    for (const direction of ['diagonal', '', null, 4, ['up-right']]) {
      expect(validateSave({ ...data, player: { ...data.player, direction } })).toBe(false);
      expect(validateSave({ ...data, homePosition: { ...HOME_SPAWN, direction } })).toBe(false);
    }
    expect(disk.get(SAVE_KEY)).toBe(raw);
    expect(write).not.toHaveBeenCalled();
  });
});
