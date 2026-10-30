import type Phaser from "phaser";
import cat from "../../public/assets/visual/dungeons/pet-cat.json";
import dog from "../../public/assets/visual/dungeons/pet-dog.json";
import type { PetSpecies } from "./config";
import { setupVillagePropAtlas } from "../village-prop-atlas";
export type PetDirection = "south" | "west" | "east" | "north";
export type PetAction =
  "idle" | "walk" | "run" | "attack" | "sit" | "stand" | "rest";
export const PET_ART = { cat, dog };
export const petDirection = (dx: number, dy: number): PetDirection =>
  Math.abs(dx) > Math.abs(dy)
    ? dx < 0
      ? "west"
      : "east"
    : dy < 0
      ? "north"
      : "south";
export function preloadPetArt(scene: Phaser.Scene): void {
  for (const species of ["cat", "dog"] as const)
    if (
      !scene.textures.exists(`dungeon-pet-${species}`) &&
      !scene.textures.exists(`dungeon-pet-${species}-source`)
    )
      scene.load.image(`dungeon-pet-${species}-source`, PET_ART[species].file);
}
export function setupPetArt(scene: Phaser.Scene): void {
  for (const species of ["cat", "dog"] as const) {
    const key = `dungeon-pet-${species}`;
    if (!scene.textures.exists(key) && scene.textures.exists(key + "-source")) {
      setupVillagePropAtlas(scene, key, key + "-source", PET_ART[species]);
      scene.textures.remove(key + "-source");
    }
  }
}
/** Locomotion and quiet poses are slower; attack timing stays at 10 fps. */
export const petFrameRate = (action: PetAction) =>
  action === "attack" ? 10 : action === "run" ? 8 : action === "rest" ? 4 : 6;

export function petSpritePose(
  species: PetSpecies,
  action: PetAction,
  direction: PetDirection,
  time: number,
  loop = true,
) {
  const atlas = PET_ART[species];
  const animations = atlas.animations as Partial<
    Record<PetAction, Record<PetDirection, string[]>>
  >;
  const list = (animations[action] ?? animations.idle!)[direction];
  const index = Math.floor((Math.max(0, time) + 1e-9) * petFrameRate(action));
  const frame =
    list[loop ? index % list.length : Math.min(list.length - 1, index)];
  const rect = (
    atlas.frames as Record<string, { width: number; height: number }>
  )[frame];
  const pivot = (
    atlas.sources as Record<string, { pivot: { x: number; y: number } }>
  )[frame].pivot;
  return {
    texture: `dungeon-pet-${species}`,
    frame,
    scale: atlas.animation.bodyHeight / atlas.animation.referenceHeight,
    originX: pivot.x / rect.width,
    originY: pivot.y / rect.height,
  };
}
export function petActionDuration(
  species: PetSpecies,
  action: PetAction,
): number {
  const atlas = PET_ART[species],
    animations = atlas.animations as Partial<
      Record<PetAction, Record<PetDirection, string[]>>
    >;
  return (
    (animations[action] ?? animations.idle!).south.length / petFrameRate(action)
  );
}
export const PET_ATTACK_HIT_AT =
  cat.animation.attackHitFrame / cat.animation.frameRate;
