import { isPetDirection } from "./pet-directions";
import type { PetDirection } from "./pet-sprites";
export type PetWorldArea = "property" | "forest" | "village" | "cityForest" | "fishingLake" | "survivorCamp" | "highland" | "openFields";
export interface WorldPetState {
  mode: "follow" | "stay" | "shelter";
  area: PetWorldArea;
  space: string;
  x: number;
  y: number;
  direction: PetDirection;
}
export const PET_WORLD_AREAS: Record<PetWorldArea, string> = {
  openFields:"Campos Abertos",
  property: "Propriedade",
  forest: "Floresta Antiga",
  village: "Vila",
  cityForest: "Floresta de acesso",
  fishingLake: "Lago entre as Serras",
  survivorCamp: "Acampamento de Sobreviventes",highland:"Platô da Nascente",
};
export function validWorldPetState(value: unknown): value is WorldPetState {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    ["follow", "stay", "shelter"].includes(String(v.mode)) &&
    (v.mode !== "shelter" || v.area === "property" && v.space === "outdoors") &&
    Object.hasOwn(PET_WORLD_AREAS, String(v.area)) &&
    typeof v.space === "string" &&
    /^[a-z0-9:-]{1,64}$/.test(v.space) &&
    typeof v.x === "number" &&
    Number.isFinite(v.x) &&
    v.x >= 0 &&
    v.x <= (v.area==="highland"&&v.space==="mine"?5120:3072) &&
    typeof v.y === "number" &&
    Number.isFinite(v.y) &&
    v.y >= 0 &&
    v.y <= (v.area==="highland"&&v.space==="mine"?6144:2304) &&
    isPetDirection(v.direction)
  );
}
export function worldPetLocation(state: WorldPetState): string {
  return (
    (state.mode === "shelter" ? "Casinha dos companheiros" : PET_WORLD_AREAS[state.area]) +
    (state.space === "community"
      ? " · Centro comunitário"
      : state.space === "mine"
      ? " · Mina Antiga"
      : state.space === "home"
      ? " · dentro de casa"
      : state.space === "blacksmith"
        ? " · ferraria"
        : state.space.startsWith("shop:")
          ? " · interior de comércio"
          : "")
  );
}
export interface PetPoint {
  x: number;
  y: number;
}
export function petFreePoint(
  near: PetPoint,
  blocked: (x: number, y: number) => boolean,
  bounds={width:3072,height:2304},
): PetPoint | undefined {
  const free = (x: number, y: number) =>
    x >= 8 &&
    y >= 8 &&
    x <= bounds.width-8 &&
    y <= bounds.height-8 &&
    [
      [0, 0],
      [-5, -3],
      [5, -3],
      [-5, 3],
      [5, 3],
    ].every(([dx, dy]) => !blocked(x + dx, y + dy));
  if (free(near.x, near.y)) return { x: near.x, y: near.y };
  for (let radius = 16; radius <= 256; radius += 16)
    for (let i = 0; i < 16; i++) {
      const angle = (i * Math.PI) / 8,
        x = near.x + Math.cos(angle) * radius,
        y = near.y + Math.sin(angle) * radius;
      if (free(x, y)) return { x, y };
    }
  return undefined;
}
