import type { PetDirection } from "./pet-sprites";
export interface PetAttackAction {
  kind: "basic" | "special";
  age: number;
  direction: PetDirection;
  targetId: number;
  originX: number;
  originY: number;
  targetX: number;
  targetY: number;
  hit: boolean;
}
export function validPetAttack(value: unknown): value is PetAttackAction {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    ["basic", "special"].includes(String(v.kind)) &&
    typeof v.age === "number" &&
    Number.isFinite(v.age) &&
    v.age >= 0 &&
    v.age <= 0.8 &&
    ["south", "west", "east", "north"].includes(String(v.direction)) &&
    Number.isSafeInteger(v.targetId) &&
    Number(v.targetId) >= 0 &&
    typeof v.hit === "boolean" &&
    ["originX", "targetX"].every(
      (k) =>
        typeof v[k] === "number" &&
        Number.isFinite(v[k]) &&
        Number(v[k]) >= 0 &&
        Number(v[k]) <= 3072,
    ) &&
    ["originY", "targetY"].every(
      (k) =>
        typeof v[k] === "number" &&
        Number.isFinite(v[k]) &&
        Number(v[k]) >= 0 &&
        Number(v[k]) <= 2304,
    )
  );
}
