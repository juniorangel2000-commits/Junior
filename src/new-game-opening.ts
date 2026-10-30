import { resolveCharacter } from './data/characters';
import type { CharacterProfile } from './types';

/** Never substitute the male story for the female player. */
export function hasNewGameOpening(profile: Pick<CharacterProfile, 'characterId'>): boolean {
  return resolveCharacter(profile).id === 'farmer-male';
}

export const NEW_GAME_OPENING = {
  src: 'assets/video/opening/male.mp4',
  poster: 'assets/video/opening/male.jpg',
  music: 'assets/video/opening/music.ogg',
  effects: 'assets/video/opening/effects.ogg',
} as const;
