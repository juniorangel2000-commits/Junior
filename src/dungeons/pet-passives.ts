import type { OwnedPet } from "./progression";

type Companion = Pick<OwnedPet, "species" | "rare">;
export interface PetPlayerBonuses {
  health: number;
  protection: number;
  pickup: number;
  movement: number;
  healing: number;
  experience: number;
}
const NONE: Readonly<PetPlayerBonuses> = Object.freeze({
  health: 0,
  protection: 0,
  pickup: 0,
  movement: 0,
  healing: 0,
  experience: 0,
});
const BONUSES = {
  dog: {
    common: Object.freeze({ ...NONE, health: 0.1, protection: 0.08 }),
    shiny: Object.freeze({
      ...NONE,
      health: 0.2,
      protection: 0.16,
      healing: 0.15,
    }),
  },
  cat: {
    common: Object.freeze({ ...NONE, pickup: 0.2, movement: 0.05 }),
    shiny: Object.freeze({
      ...NONE,
      pickup: 0.4,
      movement: 0.1,
      experience: 0.1,
    }),
  },
} as const;

/** Species passives stay active while equipped, including during pet recovery. */
export function petPlayerBonuses(pet?: Companion): Readonly<PetPlayerBonuses> {
  return pet ? BONUSES[pet.species][pet.rare ? "shiny" : "common"] : NONE;
}

export function petBonusDescription(pet: Companion): string {
  const b = petPlayerBonuses(pet);
  return [
    [b.health, "de vida máxima"],
    [b.protection, "de redução de dano recebido"],
    [b.pickup, "de alcance de coleta de experiência"],
    [b.movement, "de velocidade de movimento"],
    [b.healing, "de cura recebida"],
    [b.experience, "de experiência recebida"],
  ]
    .filter(([value]) => value)
    .map(([value, label]) => `+${Math.round(Number(value) * 100)}% ${label}`)
    .join(" · ");
}
