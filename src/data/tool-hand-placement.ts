import { directionVector, type CharacterDirection } from '../character-directions';
import { resolveCharacter } from './characters';
import type { CharacterProfile } from '../types';

/** Palm centers in the original character PNGs, before any display scaling. */
export const HANDS: Record<'farmer-female' | 'farmer-male', Record<CharacterDirection, readonly [number, number]>> = {
  'farmer-female': {
    down: [156,167], up: [93,166], right: [121,172], left: [130,172],
    'down-right': [103,166], 'down-left': [149,165], 'up-right': [155,164], 'up-left': [99,165],
  },
  'farmer-male': {
    down: [164,160], up: [91,159], right: [112,168], left: [140,168],
    'down-right': [97,164], 'down-left': [158,163], 'up-right': [153,165], 'up-left': [102,165],
  },
};

/** Ponto de pegada mantém a direção real; o espelhamento é só da arte. */
export function toolHandPlacement(profile: CharacterProfile, direction: CharacterDirection, x: number, y: number) {
  const character = resolveCharacter(profile), hand = HANDS[character.id][direction];
  const forward = directionVector(direction);
  return { x: x + (hand[0] - character.originX) / 4 + forward.x * 7,
    y: y + (hand[1] - character.originY) / 4 - 3 + forward.y * 7,
    depth: y + (direction.startsWith('up') ? -1 : 1), flipX: direction.includes('left') };
}
