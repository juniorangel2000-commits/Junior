/** Keep the four historic rows stable, then add the four diagonal poses. */
export const CHARACTER_DIRECTIONS = ['down', 'left', 'right', 'up', 'down-left', 'down-right', 'up-left', 'up-right'] as const;
export type CharacterDirection = typeof CHARACTER_DIRECTIONS[number];
export const CHARACTER_WALK_FRAMES = 4;
export const CHARACTER_FRAMES_PER_DIRECTION = CHARACTER_WALK_FRAMES + 1;
export const CHARACTER_WALK_FPS = 7;

export function directionFromVector(x: number, y: number): CharacterDirection {
  if (y < 0) return x < 0 ? 'up-left' : x > 0 ? 'up-right' : 'up';
  if (y > 0) return x < 0 ? 'down-left' : x > 0 ? 'down-right' : 'down';
  return x < 0 ? 'left' : x > 0 ? 'right' : 'down';
}

export function directionVector(direction: CharacterDirection): { x: number; y: number } {
  const x = direction.includes('left') ? -1 : direction.includes('right') ? 1 : 0;
  const y = direction.includes('up') ? -1 : direction.includes('down') ? 1 : 0;
  const length = Math.hypot(x, y);
  return { x: x / length, y: y / length };
}

/** Column zero is idle; contact, passing, opposite contact, opposite passing. */
export function characterFrame(direction: CharacterDirection, phase = 0): number {
  const walkPhase = Number.isFinite(phase) && phase >= 1
    ? (Math.floor(phase) - 1) % CHARACTER_WALK_FRAMES + 1 : 0;
  return CHARACTER_DIRECTIONS.indexOf(direction) * CHARACTER_FRAMES_PER_DIRECTION + walkPhase;
}
