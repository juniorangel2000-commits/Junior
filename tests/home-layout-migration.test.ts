import { describe, it, expect } from 'vitest';
import { createCharacterProfile } from '../src/data/characters';
import { createDefaultHome, legacyDefaultHome, untouchedLegacyLayout, validateHome, Home } from '../src/systems/home';
import { createNewSave, migrateSave, validateSave } from '../src/systems/save';

/** Save com a casa na arrumação inicial publicada até a preview.34. */
function oldRoom(variant: 'p34' | 'stove' | 'codex' = 'p34') {
  const save = createNewSave(createCharacterProfile('Casa'));
  save.home = legacyDefaultHome();
  if (variant !== 'p34') save.home.furniture.push({ id: 'home-woodStove-7', kind: 'woodStove', x: 4, y: 2 });
  if (variant === 'codex') Object.assign(save.home.furniture.find(p => p.kind === 'shelf')!, { x: 9, y: 7 });
  return save;
}

describe('arrumação inicial da casa', () => {
  it('a nova arrumação é válida: cama sob a janela, estante baixa, fogão na parede e mesa com duas cadeiras', () => {
    const h = createDefaultHome();
    expect(validateHome(h)).toBe(true);
    expect(h.furniture.find(p => p.kind === 'woodStove')).toMatchObject({ x: 5, y: 2 });
    expect(h.furniture.filter(p => p.kind === 'chair')).toHaveLength(2);
    // O fogão ocupa só a fileira encostada na parede.
    expect(new Home(h).isBlocked(5, 3)).toBe(false);
    expect(new Home(h).isBlocked(5, 2)).toBe(true);
  });
  it('reconhece só a arrumação antiga intocada, com ou sem os ajustes da preview.35', () => {
    expect(untouchedLegacyLayout(legacyDefaultHome())).toBe(true);
    expect(untouchedLegacyLayout(oldRoom('stove').home!)).toBe(true);
    expect(untouchedLegacyLayout(oldRoom('codex').home!)).toBe(true);
    expect(untouchedLegacyLayout(createDefaultHome())).toBe(false);
    const moved = legacyDefaultHome(); moved.furniture[5].x = 3;
    expect(untouchedLegacyLayout(moved)).toBe(false);
  });
});

describe('casas salvas antes da nova arrumação', () => {
  for (const variant of ['p34', 'stove', 'codex'] as const) it(`casa intocada (${variant}) recebe a arrumação nova, mantendo piso e paredes`, () => {
    const old = oldRoom(variant); old.home!.floor = 'dark'; old.home!.wall = 'sage';
    const before = structuredClone(old), updated = migrateSave(old)!;
    expect(validateSave(updated)).toBe(true);
    expect(updated.home).toEqual({ ...createDefaultHome(), floor: 'dark', wall: 'sage' });
    expect(old).toEqual(before);
    expect(migrateSave(updated)).toEqual(updated);
  });
  it('preserva uma casa já reorganizada pelo jogador (só ganha o fogão)', () => {
    const old = oldRoom(); Object.assign(old.home!.furniture.find(p => p.kind === 'shelf')!, { x: 1, y: 7 });
    const updated = migrateSave(old)!;
    expect(updated.home!.furniture.filter(p => p.kind !== 'woodStove')).toEqual(old.home!.furniture);
    expect(updated.home!.furniture.filter(p => p.kind === 'woodStove')).toHaveLength(1);
  });
  it('quem salvou dentro de casa no lugar de um móvel novo continua onde estava', () => {
    // Em (10,4) fica a segunda cadeira da nova arrumação; na antiga, é piso livre.
    const old = oldRoom(); old.homePosition = { x: 10.5 * 32, y: 4.5 * 32, direction: 'up' };
    expect(validateSave(old)).toBe(true);
    const updated = migrateSave(old)!;
    expect(validateSave(updated)).toBe(true);
    expect(updated.homePosition).toEqual(old.homePosition);
    expect(new Home(updated.home!).isBlocked(10, 4)).toBe(false);
    expect(updated.home!.furniture.filter(p => p.kind === 'woodStove')).toHaveLength(1);
  });
  it('save sem casa explícita, com o jogador dentro, continua carregando', () => {
    const old = oldRoom(); delete old.home; old.homePosition = { x: 10.5 * 32, y: 4.5 * 32, direction: 'up' };
    const updated = migrateSave(old)!;
    expect(updated).not.toBeNull(); expect(validateSave(updated)).toBe(true);
    expect(updated.homePosition).toEqual(old.homePosition);
  });
});
