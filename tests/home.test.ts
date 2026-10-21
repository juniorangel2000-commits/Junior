import { describe, expect, it } from 'vitest';
import { createDefaultHome, furnitureFootprint, Home, HOME_EXIT, HOME_HEIGHT, HOME_WIDTH, validateHome } from '../src/systems/home';
import type { FloorStyle, HomeData, HomeFurniture } from '../src/systems/home';

describe('interior da casa inicial', () => {
  it('começa com cama, mesa, cadeira, estante, tapete e vaso, sem bloquear a entrada', () => {
    const data = createDefaultHome();
    const home = new Home(data);
    expect(validateHome(data)).toBe(true);
    expect(new Set(data.furniture.map(piece => piece.kind)).size).toBe(6);
    expect(home.isBlocked(HOME_EXIT.x, HOME_EXIT.y)).toBe(false);
    expect(home.isBlocked(HOME_EXIT.x, HOME_EXIT.y - 1)).toBe(false);
    expect(home.isBlocked(0, 4)).toBe(true);
    expect(home.isBlocked(5, 1)).toBe(true);
    expect(home.isBlocked(HOME_WIDTH - 1, 4)).toBe(true);
    expect(home.isBlocked(4, HOME_HEIGHT - 1)).toBe(true);
    data.furniture[0].x = 10;
    expect(home.data.furniture[0].x).toBe(2);
  });

  it('usa o footprint inteiro da cama e permite um tapete debaixo de móveis', () => {
    const home = new Home();
    expect(furnitureFootprint(home.data.furniture[0])).toEqual([
      { x: 2, y: 2 }, { x: 3, y: 2 }, { x: 2, y: 3 }, { x: 3, y: 3 },
    ]);
    expect(home.isBlocked(3, 3)).toBe(true);
    expect(home.isBlocked(4, 5)).toBe(false);
    expect(home.place('table', 4, 5).ok).toBe(true);
    expect(home.isBlocked(4, 5)).toBe(true);
    expect(home.at(4, 5)?.kind).toBe('table');
  });

  it('rejeita sobreposição, móveis fora do cômodo e bloqueio do corredor da porta sem mutação parcial', () => {
    const home = new Home();
    const original = structuredClone(home.data);
    expect(home.place('shelf', 3, 2).ok).toBe(false);
    expect(home.place('shelf', 10, 4).ok).toBe(false);
    expect(home.place('chair', 5, 8).ok).toBe(false);
    expect(home.place('chair', 6, 9).ok).toBe(false);
    expect(home.place('plant', 4.5, 3).ok).toBe(false);
    expect(home.place('plant', Number.NaN, 3).ok).toBe(false);
    expect(home.data).toEqual(original);
  });

  it('não permite colocar ou mover um móvel no personagem', () => {
    const home = new Home();
    const before = structuredClone(home.data);
    expect(home.place('plant', 5, 7, { x: 5.4, y: 7.2 }).ok).toBe(false);
    expect(home.move('home-plant-6', 5, 7, { x: 5, y: 7 }).ok).toBe(false);
    expect(home.data).toEqual(before);
    expect(home.move('home-plant-6', 3, 7, { x: 5, y: 7 }).ok).toBe(true);
  });

  it('mantém uma cama e aceita reposicioná-la com acesso pela entrada', () => {
    const home = new Home();
    expect(home.remove('home-bed-1').ok).toBe(false);
    expect(home.move('home-bed-1', 8, 6).ok).toBe(true);
    expect(home.bedNear({ x: 7, y: 7 })?.id).toBe('home-bed-1');
    expect(home.bedNear({ x: 1, y: 2 })).toBeUndefined();
    expect(home.place('bed', 2, 2).ok).toBe(true);
    expect(home.remove('home-bed-1').ok).toBe(true);
    expect(home.data.furniture.filter(piece => piece.kind === 'bed')).toHaveLength(1);
  });

  it('detecta uma cama isolada mesmo quando nenhum móvel se sobrepõe', () => {
    const data: HomeData = { floor: 'oak', wall: 'cream', furniture: [
      { id: 'home-bed-1', kind: 'bed', x: 2, y: 2 },
      { id: 'home-shelf-2', kind: 'shelf', x: 2, y: 4 },
      ...[[1, 2], [1, 3], [4, 2], [4, 3]].map(([x, y], index): HomeFurniture => ({ id: `home-plant-${index + 3}`, kind: 'plant', x, y })),
    ] };
    expect(validateHome(data)).toBe(false);
    data.furniture = data.furniture.filter(piece => piece.id !== 'home-plant-4');
    expect(validateHome(data)).toBe(true);
  });

  it('valida o personagem na área alcançável antes de guardar a nova disposição', () => {
    const home = new Home({ floor: 'oak', wall: 'cream', furniture: [{ id: 'home-bed-1', kind: 'bed', x: 8, y: 2 }] });
    for (let y = 2; y < 9; y++) {
      const kind = y % 2 ? 'chair' : 'plant';
      expect(home.place(kind, 3, y, { x: 2, y: 5 }).ok).toBe(y !== 8);
    }
    expect(home.isBlocked(3, 8)).toBe(false);
  });

  it('limita o acervo, mantém ids únicos e não aceita campos malformados em saves', () => {
    const home = new Home();
    expect(home.place('table', 8, 6).ok).toBe(true);
    const before = structuredClone(home.data);
    expect(home.place('table', 1, 5).ok).toBe(false);
    expect(home.data).toEqual(before);
    expect(home.remove('inexistente').ok).toBe(false);
    expect(home.move('inexistente', 1, 3).ok).toBe(false);
    expect(validateHome({ ...createDefaultHome(), floor: 'toString' })).toBe(false);
    expect(validateHome({ ...createDefaultHome(), wall: 'constructor' })).toBe(false);
    const duplicated = createDefaultHome();
    duplicated.furniture[1].id = duplicated.furniture[0].id;
    expect(validateHome(duplicated)).toBe(false);
    expect(validateHome({ ...createDefaultHome(), furniture: [] })).toBe(false);
    expect(home.setStyle('constructor' as FloorStyle, 'cream').ok).toBe(false);
  });

  it('aplica ações e acabamentos sem alterar o inventário ou cobrar materiais', () => {
    const home = new Home();
    expect(home.apply({ type: 'style', floor: 'stone', wall: 'sage' }).ok).toBe(true);
    expect(home.data.floor).toBe('stone');
    expect(home.data.wall).toBe('sage');
    expect(home.apply({ type: 'place', kind: 'chair', x: 4, y: 7 }).ok).toBe(true);
    const chair = home.at(4, 7)!;
    expect(home.apply({ type: 'move', id: chair.id, x: 3, y: 7 }).ok).toBe(true);
    expect(home.apply({ type: 'remove', id: chair.id }).ok).toBe(true);
    expect(validateHome(JSON.parse(JSON.stringify(home.data)))).toBe(true);
  });
});
