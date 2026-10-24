import { describe, expect, it, vi } from 'vitest';
import type Phaser from 'phaser';
import { Player, PLAYER_SPEED } from '../src/player';
import { isBridgeTile, isWaterTile, TILE } from '../src/data/regions';
import { isWaterPoint } from '../src/data/terrain-shape';

vi.mock('phaser', () => ({ default: {} }));
vi.mock('../src/art', () => ({ createCharacterFrames: () => 'player', characterFrame: () => 0 }));

const offsets = [[-7, -5], [7, -5], [-7, 3], [7, 3]];
const waterBlocks = (x: number, y: number): boolean => isWaterPoint(x, y)
  && !isBridgeTile(Math.floor(x / TILE), Math.floor(y / TILE));

function playerAt(x: number, y: number): Player {
  const keys = Object.fromEntries('W,A,S,D,UP,DOWN,LEFT,RIGHT'.split(',').map(key => [key, { isDown: key === 'D' }]));
  const sprite = { setOrigin() { return this; }, setDisplaySize() { return this; }, setFrame() { return this; }, setPosition() { return this; }, setDepth() { return this; } };
  const scene = { add: { sprite: () => sprite }, input: { keyboard: { addKeys: () => keys } } } as unknown as Phaser.Scene;
  return new Player(scene, { name: 'Teste', skin: '#d9a276', hairStyle: 'preso', hairColor: '#754323', outfit: '#638a9d' }, x, y);
}

describe('movimento nas margens arredondadas', () => {
  it('mantém velocidade por segundo ao variar a taxa de quadros', () => {
    const fast = playerAt(800, 560), slow = playerAt(800, 560);
    for (let i = 0; i < 60; i++) fast.update(1 / 60, () => false);
    for (let i = 0; i < 20; i++) slow.update(1 / 20, () => false);
    expect(fast.x).toBeCloseTo(800 + PLAYER_SPEED, 6);
    expect(slow.x).toBeCloseTo(fast.x, 6);
  });

  it('para com os pés em terra ao caminhar em direção ao lago', () => {
    const player = playerAt(30 * TILE, 30 * TILE + 16), start = player.x;
    for (let i = 0; i < 120; i++) player.update(1 / 60, isWaterTile, waterBlocks);
    expect(player.x).toBeGreaterThan(start);
    expect(player.x).toBeLessThan(32 * TILE);
    expect(offsets.every(([ox, oy]) => !waterBlocks(player.x + ox, player.y + oy))).toBe(true);
  });

  it('permite atravessar a ponte sobre a água sem liberar a margem ao lado', () => {
    const player = playerAt(41 * TILE + 16, 18 * TILE + 16);
    expect(isWaterPoint(44 * TILE + 16, 18 * TILE + 16)).toBe(true);
    expect(waterBlocks(44 * TILE + 16, 18 * TILE + 16)).toBe(false);
    expect(waterBlocks(44 * TILE + 16, 20 * TILE + 16)).toBe(true);
    for (let i = 0; i < Math.ceil(9 * TILE / PLAYER_SPEED * 60); i++) player.update(1 / 60, isWaterTile, waterBlocks);
    expect(player.x).toBeGreaterThan(49 * TILE + 16);
  });

  it('segue a curva visível em vez de bloquear a parte seca de um antigo tile de água', () => {
    let dryCorner: { x: number; y: number } | undefined;
    for (let y = 25 * TILE; y < 36 * TILE && !dryCorner; y += 2) for (let x = 29 * TILE; x < 43 * TILE; x += 2) {
      const touchesOldWater = offsets.some(([ox, oy]) => isWaterTile(Math.floor((x + ox) / TILE), Math.floor((y + oy) / TILE)));
      if (touchesOldWater && offsets.every(([ox, oy]) => !waterBlocks(x + ox, y + oy) && !waterBlocks(x + ox + 1, y + oy))) {
        dryCorner = { x, y }; break;
      }
    }
    expect(dryCorner).toBeDefined();
    const player = playerAt(dryCorner!.x, dryCorner!.y);
    player.update(1 / PLAYER_SPEED, isWaterTile, waterBlocks);
    expect(player.x).toBeCloseTo(dryCorner!.x + 1, 6);
    expect(offsets.every(([ox, oy]) => !waterBlocks(player.x + ox, player.y + oy))).toBe(true);
  });
});
