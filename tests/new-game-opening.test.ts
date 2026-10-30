import { describe, expect, it } from 'vitest';
import { hasNewGameOpening } from '../src/new-game-opening';

describe('História de abertura', () => {
  it('usa a história masculina apenas com o personagem correspondente', () => {
    expect(hasNewGameOpening({ characterId: 'farmer-male' })).toBe(true);
    expect(hasNewGameOpening({ characterId: 'farmer-female' })).toBe(false);
  });
  it('não troca personagens legados pela história masculina', () => {
    expect(hasNewGameOpening({})).toBe(false);
  });
});
