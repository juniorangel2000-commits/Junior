import { describe, it, expect } from 'vitest';
import { createCharacterProfile } from '../src/data/characters';
import { toolHandPlacement } from '../src/data/tool-hand-placement';
import { CHARACTER_DIRECTIONS } from '../src/character-directions';

describe('ferramentas na mão em todas as direções', () => {
  it('mantém a ferramenta atrás do corpo nas vistas de costas e à frente nas outras', () => {
    for(const id of ['farmer-male','farmer-female'] as const)for(const direction of CHARACTER_DIRECTIONS) {
      const p={...createCharacterProfile('Teste'),characterId:id};
      const hand=toolHandPlacement(p,direction,200,300);
      expect(hand.depth).toBe(direction.startsWith('up')?299:301);
      expect(Number.isFinite(hand.x)&&Number.isFinite(hand.y)).toBe(true);
    }
  });
  it('usa as mãos de frente e costas, sem as substituir pela mão da vista direita', () => {
    const p={...createCharacterProfile('Teste'),characterId:'farmer-male' as const};
    const up=toolHandPlacement(p,'up',200,300),down=toolHandPlacement(p,'down',200,300),right=toolHandPlacement(p,'right',200,300);
    expect(up.x).toBeLessThan(200);expect(down.x).toBeGreaterThan(200);
    expect(up).not.toEqual(right);expect(down).not.toEqual(right);
    const moved=toolHandPlacement(p,'up',216,332);
    expect(moved.x-up.x).toBe(16);expect(moved.y-up.y).toBe(32);
  });
});
