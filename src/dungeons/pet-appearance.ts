import type { PetSpecies } from "./config";

const COLORS = {
  dog: [
    [28, 23, 19],
    [194, 172, 129],
    [255, 249, 226],
  ],
  cat: [
    [29, 22, 34],
    [144, 94, 73],
    [253, 218, 148],
  ],
} as const;

/** Temporary runtime palettes: preserve every pixel position and alpha value. */
export function recolorPetPixels(
  pixels: Uint8ClampedArray,
  species: PetSpecies,
): void {
  const palette = COLORS[species];
  for (let i = 0; i < pixels.length; i += 4) {
    if (!pixels[i + 3]) continue;
    const light =
      (pixels[i] * 0.2126 + pixels[i + 1] * 0.7152 + pixels[i + 2] * 0.0722) /
      255;
    const low = light < 0.5 ? 0 : 1;
    const mix = light < 0.5 ? light * 2 : (light - 0.5) * 2;
    for (let channel = 0; channel < 3; channel++)
      pixels[i + channel] = Math.round(
        palette[low][channel] * (1 - mix) + palette[low + 1][channel] * mix,
      );
  }
}

export const petTextureKey = (species: PetSpecies, rare = false): string =>
  `dungeon-pet-${species}${rare ? "-rare" : ""}`;
