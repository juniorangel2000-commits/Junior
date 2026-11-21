import type { CharacterDirection } from '../character-directions';
import type { PropertySurvivorId } from '../systems/property-survivors';
import art from '../../public/assets/visual/characters/survivors/walk.json';

export const SURVIVOR_VIEWS = ['south', 'north', 'east', 'west'] as const;
export const SURVIVOR_WALK_DIRECTIONS = ['down', 'up', 'right', 'left', 'down-right', 'down-left', 'up-right', 'up-left'] as const;
const clockwise = ['right', 'down-right', 'down', 'down-left', 'left', 'up-left', 'up', 'up-right'] as const;
/** O jogador completa a mesma passada em 48 px (PLAYER_WALK_CYCLE_DISTANCE).
 * Marina tem seis quadros, como a fazendeira; Rui tem oito, como o fazendeiro. */
export const SURVIVOR_WALK_CYCLE_DISTANCE = 48;
export function survivorView(direction: CharacterDirection): typeof SURVIVOR_VIEWS[number] {
  if (direction === 'down') return 'south';
  if (direction === 'up') return 'north';
  return direction.includes('right') ? 'east' : 'west';
}
export function survivorWalkFrame(id: PropertySurvivorId, direction: CharacterDirection, distance: number): number {
  const columns = art.characters[id].columns;
  const traveled = Number.isFinite(distance) ? Math.max(0, distance) : 0;
  const phase = Math.floor(((traveled + 1e-7) % SURVIVOR_WALK_CYCLE_DISTANCE) / SURVIVOR_WALK_CYCLE_DISTANCE * columns);
  return SURVIVOR_WALK_DIRECTIONS.indexOf(direction) * columns + phase;
}

export function survivorWalkScale(id: PropertySurvivorId, direction: CharacterDirection): number {
  const character = art.characters[id];
  return SURVIVOR_WALK_DIRECTIONS.indexOf(direction) < SURVIVOR_VIEWS.length ? character.scale : character.diagonalScale;
}

export function survivorIdleDiagonalFrame(direction: CharacterDirection): number {
  return SURVIVOR_WALK_DIRECTIONS.indexOf(direction) - SURVIVOR_VIEWS.length;
}

export function survivorLookDirection(dx: number, dy: number): CharacterDirection {
  return clockwise[(Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) + 8) % 8];
}

export function survivorTurnStep(current: CharacterDirection, target: CharacterDirection): CharacterDirection {
  const index = clockwise.indexOf(current);
  const distance = (clockwise.indexOf(target) - index + 8) % 8;
  return distance === 0 ? current : clockwise[(index + (distance <= 4 ? 1 : 7)) % 8];
}
