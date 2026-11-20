import type { CharacterDirection } from '../character-directions';

export const RIDER_ART: readonly string[] = ['farmer-female', 'farmer-male'];
export const RIDER_ORDER: readonly CharacterDirection[] = [
  'down', 'up', 'left', 'right', 'down-left', 'down-right', 'up-left', 'up-right',
];

const female = { file: 'assets/animals/horse-rider/farmer-female.png', width: 192, height: 192, columns: 8 };
const male = { file: 'assets/animals/horse-rider/farmer-male-seated.png', width: 384, height: 512, columns: 4 };

// Escala e canto da pose no sistema de coordenadas da célula do cavalo (192 px).
const malePlacement: Record<CharacterDirection, readonly [number, number, number]> = {
  down: [.207, 55, 8],
  up: [.197, 57, 21],
  left: [.20, 65, 24],
  right: [.20, 50, 24],
  'down-left': [.19, 65, 27],
  'down-right': [.19, 55, 28],
  'up-left': [.19, 69, 30],
  'up-right': [.19, 52, 30],
};

export function riderSheet(character: string) {
  return character === 'farmer-male' ? male : female;
}

export function riderPose(character: string, direction: CharacterDirection) {
  const sheet = riderSheet(character);
  const frame = RIDER_ORDER.indexOf(direction);
  const [scale, x, y] = character === 'farmer-male' ? malePlacement[direction] : [1, 0, 0];
  return {
    frame, scale, x, y,
    sourceX: (frame % sheet.columns) * sheet.width,
    sourceY: Math.floor(frame / sheet.columns) * sheet.height,
  };
}
