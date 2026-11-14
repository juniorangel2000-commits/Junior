import { describe, it, expect } from 'vitest';
import { createCharacterProfile } from '../src/data/characters';
import { createDefaultHome } from '../src/systems/home';
import { createNewSave, migrateSave, validateSave } from '../src/systems/save';

function oldRoom() {
  const save = createNewSave(createCharacterProfile('Casa'));
  save.home = createDefaultHome();
  Object.assign(save.home.furniture.find(p => p.kind === 'shelf')!, { x: 8, y: 2 });
  return save;
}

describe('estante fora da janela', () => {
  it('atualiza a posição antiga sem modificar a entrada, peças ou save original', () => {
    const old = oldRoom(), before = structuredClone(old);
    const updated = migrateSave(old)!;
    expect(validateSave(updated)).toBe(true);
    expect(updated.home!.furniture.find(p => p.kind === 'shelf')).toMatchObject({x:9,y:7});
    expect(updated.home!.furniture.filter(p => p.kind !== 'shelf')).toEqual(old.home!.furniture.filter(p => p.kind !== 'shelf'));
    expect(old).toEqual(before);
    expect(migrateSave(updated)).toEqual(updated);
  });
  it('preserva uma estante já reorganizada pelo jogador', () => {
    const old = oldRoom(); Object.assign(old.home!.furniture.find(p => p.kind === 'shelf')!, { x: 1, y: 7 });
    expect(migrateSave(old)!.home).toEqual(old.home);
  });
  it('não coloca a estante em cima de quem salvou dentro da casa', () => {
    const old = oldRoom(); old.homePosition = {x:9.5*32,y:7.5*32,direction:'up'};
    expect(validateSave(old)).toBe(true);
    const updated = migrateSave(old)!;
    expect(validateSave(updated)).toBe(true);
    expect(updated.homePosition).toEqual(old.homePosition);
    expect(updated.home!.furniture.find(p => p.kind === 'shelf')).toMatchObject({x:8,y:6});
  });
  it('recupera a casa implícita antiga se o jogador estiver no novo lugar da estante', () => {
    const old = oldRoom(); delete old.home; old.homePosition = {x:9.5*32,y:7.5*32,direction:'up'};
    const updated = migrateSave(old)!;
    expect(updated).not.toBeNull(); expect(validateSave(updated)).toBe(true);
    expect(updated.homePosition).toEqual(old.homePosition);
  });
});
