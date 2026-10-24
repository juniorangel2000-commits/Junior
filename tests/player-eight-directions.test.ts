import { describe, expect, it, vi } from 'vitest';
import type Phaser from 'phaser';
import { Player, PLAYER_SPEED, PLAYER_WALK_CYCLE_DISTANCE } from '../src/player';
import { CHARACTER_DIRECTIONS, characterFrame as atlasFrame, type CharacterDirection } from '../src/character-directions';
import { CHARACTERS, createCharacterProfile, type CharacterId, characterWalkFps } from '../src/data/characters';

vi.mock('phaser', () => ({ default: {} }));
vi.mock('../src/art', () => ({ createCharacterFrames: () => 'player' }));

function createFixture(x: number, y: number, characterId: CharacterId) {
  const keys = Object.fromEntries('W,A,S,D,UP,DOWN,LEFT,RIGHT'.split(',').map(key => [key, { isDown: false }]));
  const sprite = {
    setDisplaySize() { return this; },
    setOrigin() { return this; }, setFrame: vi.fn().mockReturnThis(),
    setPosition: vi.fn().mockReturnThis(), setDepth() { return this; },
  };
  const scene = { add: { sprite: () => sprite }, input: { keyboard: { addKeys: () => keys } } } as unknown as Phaser.Scene;
  const player = new Player(scene, createCharacterProfile('Teste', characterId), x, y);
  return { player, keys, sprite };
}

describe.each(CHARACTERS)('$label: movimento e orientação em oito direções', character => {
  const CHARACTER_WALK_FRAMES = character.walkFrames;
  const CHARACTER_FRAMES_PER_DIRECTION = CHARACTER_WALK_FRAMES + 1;
  const characterFrame = (direction: CharacterDirection, phase = 0) => atlasFrame(direction, phase, CHARACTER_WALK_FRAMES);
  const fixture = (x = 300, y = 300) => createFixture(x, y, character.id);

  it('mantém pés e orientação durante o golpe e retoma o movimento ao terminar', () => {
    const { player, keys } = fixture();
    player.facing = { x: -1, y: 0 }; keys.D.isDown = true;
    player.update(.25, () => false, undefined, false);
    expect(player.x).toBe(300); expect(player.y).toBe(300);
    expect(player.facing).toEqual({ x: -1, y: 0 });
    player.update(.25, () => false);
    expect(player.x).toBe(321);
  });

  it('a prévia completa o ciclo na mesma cadência da caminhada real', () => {
    expect(characterWalkFps({ characterId: character.id })).toBe(PLAYER_SPEED / PLAYER_WALK_CYCLE_DISTANCE * CHARACTER_WALK_FRAMES);
  });
  it.each([
    ['baixo', ['S'], 0, 1, 0], ['esquerda', ['A'], -1, 0, 1],
    ['direita', ['RIGHT'], 1, 0, 2], ['cima', ['UP'], 0, -1, 3],
    ['baixo/esquerda', ['S', 'A'], -1, 1, 4], ['baixo/direita', ['DOWN', 'RIGHT'], 1, 1, 5],
    ['cima/esquerda', ['W', 'A'], -1, -1, 6], ['cima/direita', ['UP', 'RIGHT'], 1, -1, 7],
  ] as const)('%s: mesma velocidade, caminhada própria e pose parada', (_label, held, x, y, row) => {
    const { player, keys, sprite } = fixture();
    held.forEach(key => { keys[key].isDown = true; });
    player.update(.125, () => false);
    expect(sprite.setFrame).toHaveBeenLastCalledWith(row * CHARACTER_FRAMES_PER_DIRECTION + 1 + Math.floor(PLAYER_SPEED * .125 / PLAYER_WALK_CYCLE_DISTANCE * CHARACTER_WALK_FRAMES));
    for (let frame = 0; frame < 7; frame++) player.update(.125, () => false);
    expect(Math.hypot(player.x - 300, player.y - 300)).toBeCloseTo(84, 8);
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

  it('desliza junto à parede na direção real e para a animação quando bloqueada', () => {
    const sliding = fixture(100, 100);
    sliding.keys.S.isDown = sliding.keys.D.isDown = true;
    sliding.player.update(1, () => false, x => x >= 128);
    expect(sliding.player.x + 7).toBeLessThan(128);
    expect(sliding.player.x + 7).toBeGreaterThan(127.99);
    expect(sliding.player.y).toBeCloseTo(100 + PLAYER_SPEED / Math.sqrt(2), 8);
    sliding.player.update(.1, () => false, x => x >= 128);
    expect(sliding.player.facing).toEqual({ x: 0, y: 1 });
    const blocked = fixture(120.999, 124.999);
    blocked.keys.S.isDown = blocked.keys.D.isDown = true;
    blocked.player.update(.125, () => false, (x, y) => x >= 128 || y >= 128);
    expect(blocked.player.x).toBe(120.999);
    expect(blocked.player.y).toBe(124.999);
    expect(blocked.sprite.setFrame).toHaveBeenLastCalledWith(5 * CHARACTER_FRAMES_PER_DIRECTION);
  });

  it('liga o ciclo completo à distância percorrida, com pose parada independente', () => {
    const { player, keys, sprite } = fixture();
    const frameDuration = PLAYER_WALK_CYCLE_DISTANCE / PLAYER_SPEED / CHARACTER_WALK_FRAMES;
    keys.S.isDown = true;
    player.update(frameDuration / 2, () => false);
    for (let frame = 0; frame < CHARACTER_WALK_FRAMES; frame++) player.update(frameDuration, () => false);
    expect(sprite.setFrame.mock.calls.map(([frame]) => frame)).toEqual([
      ...Array.from({ length: CHARACTER_WALK_FRAMES }, (_, frame) => frame + 1), 1,
    ]);
    keys.S.isDown = false;
    player.update(.5, () => false);
    expect(sprite.setFrame).toHaveBeenLastCalledWith(0);
    keys.S.isDown = true;
    player.update(frameDuration / 2, () => false);
    expect(sprite.setFrame).toHaveBeenLastCalledWith(1);
  });

  it('reserva uma pose parada e os quadros consecutivos de cada direção', () => {
    const atlasFrames = CHARACTER_DIRECTIONS.flatMap(direction =>
      Array.from({ length: CHARACTER_FRAMES_PER_DIRECTION }, (_, phase) => characterFrame(direction, phase)));
    expect(atlasFrames).toEqual(Array.from({ length: CHARACTER_DIRECTIONS.length * CHARACTER_FRAMES_PER_DIRECTION }, (_, frame) => frame));
    for (const direction of CHARACTER_DIRECTIONS) {
      expect(characterFrame(direction, CHARACTER_WALK_FRAMES + 1)).toBe(characterFrame(direction, 1));
      expect(characterFrame(direction, CHARACTER_WALK_FRAMES * 2)).toBe(characterFrame(direction, CHARACTER_WALK_FRAMES));
      expect(characterFrame(direction, 0)).not.toBe(characterFrame(direction, CHARACTER_WALK_FRAMES));
    }
  });

  it.each([30, 60, 144])('mantém posição e fase da passada a %i fps', fps => {
    const { player, keys, sprite } = fixture();
    keys.D.isDown = true;
    for (let frame = 0; frame < fps; frame++) player.update(1 / fps, () => false);
    expect(player.x).toBeCloseTo(300 + PLAYER_SPEED, 7);
    expect(sprite.setFrame).toHaveBeenLastCalledWith(characterFrame('right', 1 + Math.floor((PLAYER_SPEED % PLAYER_WALK_CYCLE_DISTANCE) / PLAYER_WALK_CYCLE_DISTANCE * CHARACTER_WALK_FRAMES)));
  });

  it('a parede reduz a cadência conforme a distância real, sem caminhar no lugar', () => {
    const slide = fixture(100, 100), straight = fixture(100, 100);
    slide.keys.S.isDown = slide.keys.D.isDown = true;
    straight.keys.S.isDown = true;
    for (let frame = 0; frame < 60; frame++) {
      slide.player.update(1 / 60, () => false, x => x > 107.001);
      straight.player.update(1 / 60 / Math.sqrt(2), () => false);
    }
    expect(slide.player.y).toBeCloseTo(straight.player.y, 7);
    expect(slide.player.x).toBeCloseTo(100, 7);
    expect(slide.sprite.setFrame.mock.lastCall).toEqual(straight.sprite.setFrame.mock.lastCall);
  });

  it('aproxima os pés da mesma borda em quadros rápidos ou lentos', () => {
    const positions = [30, 60, 144].map(fps => {
      const { player, keys } = fixture(100, 100);
      keys.D.isDown = true;
      for (let frame = 0; frame < fps; frame++) player.update(1 / fps, () => false, x => x >= 128);
      expect(player.x + 7).toBeLessThan(128);
      expect(player.x + 7).toBeGreaterThan(127.99);
      return player.x;
    });
    expect(Math.max(...positions) - Math.min(...positions)).toBeLessThan(.01);
  });

  it('pausa a fase no bloqueio e a retoma quando o caminho abre', () => {
    const { player, keys, sprite } = fixture(100, 100);
    keys.D.isDown = true;
    player.update(1, () => false, x => x >= 130);
    for (let frame = 0; frame < 30; frame++) player.update(1 / 60, () => false, x => x >= 130);
    expect(player.x).toBeGreaterThan(122.99);
    expect(player.x).toBeLessThan(123);
    expect(sprite.setFrame).toHaveBeenLastCalledWith(characterFrame('right'));
    player.update(2 / PLAYER_SPEED, () => false);
    expect(sprite.setFrame).toHaveBeenLastCalledWith(characterFrame('right', 1 + Math.floor(25 / 48 * CHARACTER_WALK_FRAMES)));
  });

  it('soltar as teclas diagonais em eventos próximos mantém a direção final e para sem inércia', () => {
    const { player, keys, sprite } = fixture();
    keys.W.isDown = keys.A.isDown = true;
    player.update(.1, () => false);
    keys.W.isDown = false;
    player.update(.01, () => false);
    keys.A.isDown = false;
    const position = { x: player.x, y: player.y };
    player.update(.01, () => false);
    expect({ x: player.x, y: player.y }).toEqual(position);
    expect(sprite.setFrame).toHaveBeenLastCalledWith(characterFrame('up-left'));
  });

  it('a tolerância ao soltar não atrasa o movimento nem bloqueia uma virada intencional', () => {
    const { player, keys } = fixture();
    keys.W.isDown = keys.A.isDown = true;
    player.update(.1, () => false);
    keys.W.isDown = false;
    const x = player.x, y = player.y;
    player.update(.02, () => false);
    expect(player.x).toBeCloseTo(x - PLAYER_SPEED * .02, 7);
    expect(player.y).toBe(y);
    player.update(.02, () => false);
    expect(player.facing).toEqual({ x: -1, y: 0 });
    keys.A.isDown = false; keys.D.isDown = true;
    player.update(.005, () => false);
    expect(player.facing).toEqual({ x: 1, y: 0 });
  });
});
