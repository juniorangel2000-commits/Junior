import type Phaser from 'phaser';
import type { CharacterProfile } from './types';
import { CHARACTERS, characterSourcePaths, resolveCharacter, type CharacterId } from './data/characters';
import { CHARACTER_DIRECTIONS, characterFrame, type CharacterDirection } from './character-directions';

export const CHARACTER_WIDTH = 48;
export const CHARACTER_HEIGHT = 64;
/** Texture pixels and world size are separate: never shrink artwork into a tiny atlas. */
export const CHARACTER_TEXTURE_DENSITY = 4;
export const CHARACTER_FRAME_WIDTH = CHARACTER_WIDTH * CHARACTER_TEXTURE_DENSITY;
export const CHARACTER_FRAME_HEIGHT = CHARACTER_HEIGHT * CHARACTER_TEXTURE_DENSITY;
const frames = new Map<string, HTMLCanvasElement>();
let liaSource: HTMLImageElement | HTMLCanvasElement | undefined;
const frameKey = (id: CharacterId, direction: CharacterDirection, phase: number): string =>
  `character:${id}:${characterFrame(direction, phase, resolveCharacter({ characterId: id }).walkFrames)}`;

/** Original user-supplied images, with independent idle and walk poses in eight directions. */
export function preloadCharacterSprites(scene: Phaser.Scene): void {
  scene.load.image('asset-lia', 'assets/visual/characters/lia.png');
  for (const character of CHARACTERS) for (const direction of CHARACTER_DIRECTIONS) {
    characterSourcePaths(character.id, direction).forEach((path, phase) => {
      scene.load.image(frameKey(character.id, direction, phase), path);
    });
  }
}

export function setupCharacterSprites(scene: Phaser.Scene): void {
  frames.clear();
  liaSource = scene.textures.get('asset-lia').getSourceImage() as HTMLImageElement;
  for (const character of CHARACTERS) for (const direction of CHARACTER_DIRECTIONS) {
    characterSourcePaths(character.id, direction).forEach((_, phase) => {
      const key = frameKey(character.id, direction, phase);
      if (!scene.textures.exists(key)) throw new Error(`Imagem de personagem ausente: ${key}`);
      const source = scene.textures.get(key).getSourceImage() as HTMLImageElement;
      const canvas = document.createElement('canvas');
      canvas.width = CHARACTER_FRAME_WIDTH; canvas.height = CHARACTER_FRAME_HEIGHT;
      const ctx = canvas.getContext('2d')!;
      ctx.imageSmoothingEnabled = false;
      // Translate source pixels 1:1. Only transparent padding falls outside the frame.
      // Scaling happens on display, so zoom and previews retain the original detail.
      ctx.drawImage(source,
        CHARACTER_FRAME_WIDTH / 2 - character.originX,
        CHARACTER_FRAME_HEIGHT - 3 * CHARACTER_TEXTURE_DENSITY - character.originY);
      frames.set(key, canvas);
    });
  }
}

/** The dialogue portrait uses the same preserved image as Lia in the world. */
export function drawLiaPortrait(canvas: HTMLCanvasElement): void {
  canvas.width = CHARACTER_WIDTH; canvas.height = CHARACTER_HEIGHT;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  if (liaSource) ctx.drawImage(liaSource, 0, 0);
}

/** Names and legacy save colors never alter the supplied artwork. */
export function drawStyledCharacter(ctx: CanvasRenderingContext2D, profile: CharacterProfile, direction: CharacterDirection, phase: number): boolean {
  const character = resolveCharacter(profile);
  const source = frames.get(frameKey(character.id, direction, phase));
  if (!source) return false;
  ctx.drawImage(source, 0, 0);
  return true;
}
