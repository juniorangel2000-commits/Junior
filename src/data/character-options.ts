import type { CharacterAccessory, CharacterProfile } from '../types';

export const DEFAULT_SHIRT_COLOR = '#f0dfba';
export const DEFAULT_ACCESSORY: CharacterAccessory = 'bolsa';

/** Resolve a aparência antiga na renderização, sem reescrever o perfil salvo. */
export function resolveCharacterAppearance(profile: CharacterProfile): CharacterProfile & {
  shirtColor: string;
  accessory: CharacterAccessory;
} {
  return {
    ...profile,
    shirtColor: profile.shirtColor ?? DEFAULT_SHIRT_COLOR,
    accessory: profile.accessory ?? DEFAULT_ACCESSORY,
  };
}
