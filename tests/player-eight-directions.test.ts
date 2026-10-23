import { describe, expect, it, vi } from 'vitest';
import type Phaser from 'phaser';
import { Player } from '../src/player';
import { CHARACTER_DIRECTIONS, CHARACTER_FRAMES_PER_DIRECTION, CHARACTER_WALK_FRAMES, characterFrame } from '../src/character-directions';

vi.mock('phaser', () => ({ default: {} }));
vi.mock('../src/art', () => ({ createCharacterFrames: () => 'player' }));

function fixture(x = 300, y = 300) {
  const keys = Object.fromEntries('W,A,S,D,UP,DOWN,LEFT,RIGHT'.split(',').map(key => [key, { isDown: false }]));
  const sprite = {
    setOrigin() { return this; }, setFrame: vi.fn().mockReturnThis(),
    setPosition: vi.fn().mockReturnThis(), setDepth() { return this; },
  };
  const scene = { add: { sprite: () => sprite }, input: { keyboard: { addKeys: () => keys } } } as unknown as Phaser.Scene;
  const player = new Player(scene, { name: 'Teste', skin: '#d9a276', hairStyle: 'preso', hairColor: '#754323', outfit: '#638a9d' }, x, y);
  return { player, keys, sprite };
}

describe('movimento e orientação em oito direções', () => {
  it.each([
    ['baixo', ['S'], 0, 1, 0], ['esquerda', ['A'], -1, 0, 1],
    ['direita', ['RIGHT'], 1, 0, 2], ['cima', ['UP'], 0, -1, 3],
    ['baixo/esquerda', ['S', 'A'], -1, 1, 4], ['baixo/direita', ['DOWN', 'RIGHT'], 1, 1, 5],
    ['cima/esquerda', ['W', 'A'], -1, -1, 6], ['cima/direita', ['UP', 'RIGHT'], 1, -1, 7],
  ] as const)('%s: mesma velocidade, caminhada própria e pose parada', (_label, held, x, y, row) => {
    const { player, keys, sprite } = fixture();
    held.forEach(key => { keys[key].isDown = true; });
    player.update(.125, () => false);
    expect(sprite.setFrame).toHaveBeenLastCalledWith(row * CHARACTER_FRAMES_PER_DIRECTION + 2);
    for (let frame = 0; frame < 7; frame++) player.update(.125, () => false);
    expect(Math.hypot(player.x - 300, player.y - 300)).toBeCloseTo(112, 8);
    expect(player.facing.x).toBeCloseTo(x / Math.hypot(x, y), 8);
    expect(player.facing.y).toBeCloseTo(y / Math.hypot(x, y), 8);
    const position = { x: player.x, y: player.y };
    held.forEach(key => { keys[key].isDown = false; });
    player.update(.2, () => false);
    expect({ x: player.x, y: player.y }).toEqual(position);
    expect(sprite.setFrame).toHaveBeenLastCalledWith(row * CHARACTER_FRAMES_PER_DIRECTION);
  });

  it('não atravessa um canto ao pressionar a diagonal durante um quadro longo', () => {
    const { player, keys } = fixture(100, 100);
    keys.S.isDown = keys.D.isDown = true;
    player.update(1, () => false, (x, y) => x >= 128 || y >= 128);
    expect(player.x).toBeGreaterThan(100);
    expect(player.y).toBeGreaterThan(100);
    expect(player.x + 7).toBeLessThan(128);
    expect(player.y + 3).toBeLessThan(128);
  });

  it('desliza junto à parede sem perder a orientação e para a animação quando bloqueada', () => {
    const sliding = fixture(100, 100);
    sliding.keys.S.isDown = sliding.keys.D.isDown = true;
    sliding.player.update(1, () => false, x => x >= 128);
    expect(sliding.player.x + 7).toBeLessThan(128);
    expect(sliding.player.y).toBeCloseTo(100 + 112 / Math.sqrt(2), 8);
    const blocked = fixture(120, 124);
    blocked.keys.S.isDown = blocked.keys.D.isDown = true;
    blocked.player.update(.125, () => false, (x, y) => x >= 128 || y >= 128);
    expect(blocked.player.x).toBe(120);
    expect(blocked.player.y).toBe(124);
    expect(blocked.sprite.setFrame).toHaveBeenLastCalledWith(5 * CHARACTER_FRAMES_PER_DIRECTION);
  });

  it('percorre oito quadros a 10 fps, repete o ciclo sem a pose parada e reinicia após parar', () => {
    const { player, keys, sprite } = fixture();
    keys.S.isDown = true;
    player.update(.05, () => false);
    for (let frame = 0; frame < CHARACTER_WALK_FRAMES; frame++) player.update(.1, () => false);
    expect(sprite.setFrame.mock.calls.map(([frame]) => frame)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 1]);
    keys.S.isDown = false;
    player.update(.5, () => false);
    expect(sprite.setFrame).toHaveBeenLastCalledWith(0);
    keys.S.isDown = true;
    player.update(.05, () => false);
    expect(sprite.setFrame).toHaveBeenLastCalledWith(1);
  });

  it('reserva uma pose parada independente e oito quadros consecutivos para cada direção', () => {
    const atlasFrames = CHARACTER_DIRECTIONS.flatMap(direction =>
      Array.from({ length: CHARACTER_FRAMES_PER_DIRECTION }, (_, phase) => characterFrame(direction, phase)));
    expect(atlasFrames).toEqual(Array.from({ length: 72 }, (_, frame) => frame));
    for (const direction of CHARACTER_DIRECTIONS) {
      expect(characterFrame(direction, 9)).toBe(characterFrame(direction, 1));
      expect(characterFrame(direction, 16)).toBe(characterFrame(direction, 8));
      expect(characterFrame(direction, 0)).not.toBe(characterFrame(direction, 8));
    }
  });
});
