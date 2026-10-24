import { CHARACTER_WALK_FPS, CHARACTER_WALK_FRAMES, type CharacterDirection } from '../character-directions';
import type { CharacterProfile } from '../types';

/** Fixed characters: add the next supplied character here, without appearance sliders. */
export const CHARACTERS = [{
  id: 'farmer-female',
  label: 'Fazendeira',
  assetRoot: 'assets/visual/characters/farmer-female/Idle',
  walkAnimation: 'Walk',
  walkFrames: 6,
  // Fixed origin in original PNG pixels. Keep the authored foot motion;
  // centering each silhouette separately would introduce jitter during the walk.
  originX: 128,
  originY: 232,
}, {
  id: 'farmer-male',
  label: 'Fazendeiro',
  assetRoot: 'assets/visual/characters/farmer-male/Idle',
  walkAnimation: 'Walking',
  walkFrames: 8,
  originX: 128,
  originY: 240,
}] as const;
export type CharacterId = typeof CHARACTERS[number]['id'];
export const DEFAULT_CHARACTER_ID: CharacterId = 'farmer-female';

export function isCharacterId(value: unknown): value is CharacterId {
  return CHARACTERS.some(character => character.id === value);
}

export function resolveCharacter(profile: Pick<CharacterProfile, 'characterId'>) {
  return CHARACTERS.find(character => character.id === profile.characterId) ?? CHARACTERS[0];
}

const EXPORT_DIRECTIONS: Record<CharacterDirection, string> = {
  down: 'south', left: 'west', right: 'east', up: 'north',
  'down-left': 'south-west', 'down-right': 'south-east',
  'up-left': 'north-west', 'up-right': 'north-east',
};

export function characterSourcePaths(id: CharacterId, direction: CharacterDirection): string[] {
  const { assetRoot: root, walkAnimation, walkFrames } = resolveCharacter({ characterId: id });
  const view = EXPORT_DIRECTIONS[direction];
  return [
    `${root}/rotations/${view}.png`,
    ...Array.from({ length: walkFrames }, (_, frame) =>
      `${root}/animations/${walkAnimation}/${view}/frame_${String(frame).padStart(3, '0')}.png`),
  ];
}

/** Preview cadence follows the same complete walk cycle, regardless of frame count. */
export function characterWalkFps(profile: Pick<CharacterProfile, 'characterId'>): number {
  return CHARACTER_WALK_FPS / CHARACTER_WALK_FRAMES * resolveCharacter(profile).walkFrames;
}

export function createCharacterProfile(name = '', characterId: CharacterId = DEFAULT_CHARACTER_ID): CharacterProfile {
  return {
    name, characterId,
    // Retained only for save compatibility. The player renderer ignores these fields.
    skin: '#d9a276', hairStyle: 'preso', hairColor: '#754323',
    outfit: '#638a9d', shirtColor: '#f0e4c9', accessory: 'nenhum',
  };
}
