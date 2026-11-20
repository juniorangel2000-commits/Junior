import type { CharacterDirection } from '../character-directions';
import type { PropertySurvivorId } from '../systems/property-survivors';
import art from '../../public/assets/visual/characters/survivors/walk.json';

export const SURVIVOR_VIEWS = ['south', 'north', 'east', 'west'] as const;
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
  return SURVIVOR_VIEWS.indexOf(survivorView(direction)) * columns + phase;
}
