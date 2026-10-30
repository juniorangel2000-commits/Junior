export interface PetRoamPoint {
  x: number;
  y: number;
}
/** Stable, unhurried destinations around the player; never consume combat RNG. */
export function petRoamGoal(
  player: PetRoamPoint,
  pet: PetRoamPoint,
  time: number,
  id: string,
): PetRoamPoint {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  const dx = pet.x - player.x,
    dy = pet.y - player.y,
    distance = Math.hypot(dx, dy);
  const away = distance > 1 ? Math.atan2(dy, dx) : (hash % 628) / 100;
  if (distance < 55 || distance > 190)
    return {
      x: player.x + Math.cos(away) * 90,
      y: player.y + Math.sin(away) * 90,
    };
  const shifted = time + (hash % 37) / 10,
    phase = shifted % 5;
  if (phase >= 3.2) return { x: pet.x, y: pet.y };
  const slot = Math.floor(shifted / 5),
    angle = (hash % 628) / 100 + slot * 2.399963;
  const radius = 90 + Math.sin(slot + (hash % 13)) * 18;
  return {
    x: player.x + Math.cos(angle) * radius,
    y: player.y + Math.sin(angle) * radius,
  };
}
