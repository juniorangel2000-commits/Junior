export const PET_DIRECTIONS = [
  "south",
  "south-east",
  "east",
  "north-east",
  "north",
  "north-west",
  "west",
  "south-west",
] as const;
export type PetDirection = (typeof PET_DIRECTIONS)[number];
export const isPetDirection = (value: unknown): value is PetDirection =>
  typeof value === "string" && PET_DIRECTIONS.includes(value as PetDirection);

export function petDirection(dx: number, dy: number): PetDirection {
  if (!dx && !dy) return "south";
  const directions: PetDirection[] = [
    "east",
    "south-east",
    "south",
    "south-west",
    "west",
    "north-west",
    "north",
    "north-east",
  ];
  return directions[(Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) + 8) % 8];
}
