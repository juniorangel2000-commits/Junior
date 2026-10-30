import { petTextureKey, recolorPetPixels } from "./pet-appearance";
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
    const variantKey = petTextureKey(species, true);
    if (scene.textures.exists(key) && !scene.textures.exists(variantKey)) {
      const source = scene.textures
        .get(key)
        .getSourceImage() as HTMLCanvasElement;
      const canvas = document.createElement("canvas");
      canvas.width = source.width;
      canvas.height = source.height;
      const context = canvas.getContext("2d")!;
      context.drawImage(source, 0, 0);
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
      recolorPetPixels(pixels.data, species);
      context.putImageData(pixels, 0, 0);
      const texture = scene.textures.addCanvas(variantKey, canvas)!;
      texture.setFilter(0);
      for (const [id, frame] of Object.entries(PET_ART[species].frames))
        texture.add(id, 0, frame.x, frame.y, frame.width, frame.height);
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
  rare = false,
) {
  const atlas = PET_ART[species];
  const animations = atlas.animations as Partial<
    Record<PetAction, Record<PetDirection, string[]>>
  >;
  const list = (animations[action] ?? animations.idle!)[direction];
  const rate = petFrameRate(action);
  let playback = Math.max(0, time);
  // Dogs stay quiet between occasional idle sequences, including wait mode.
  if (species === "dog" && (action === "idle" || action === "rest")) {
    const phase = playback % 12;
    playback = phase >= 4 && phase < 4 + list.length / rate ? phase - 4 : 0;
  }
  const index = Math.floor((playback + 1e-9) * rate);
  const frame =
    list[loop ? index % list.length : Math.min(list.length - 1, index)];
  const rect = (
    atlas.frames as Record<string, { width: number; height: number }>
  )[frame];
  const pivot = (
    atlas.sources as Record<string, { pivot: { x: number; y: number } }>
  )[frame].pivot;
  return {
    texture: petTextureKey(species, rare),
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
