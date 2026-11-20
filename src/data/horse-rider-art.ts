import type Phaser from 'phaser';
import type { CharacterDirection } from '../character-directions';
import maleAtlas from '../../public/assets/animals/horse-rider/farmer-male-mounted.json';
import frontalHead from '../../public/assets/animals/horse-rider/horse-head-male.json';

export const RIDER_ART: readonly string[] = ['farmer-female', 'farmer-male'];
export const RIDER_ORDER: readonly CharacterDirection[] = [
  'down', 'up', 'left', 'right', 'down-left', 'down-right', 'up-left', 'up-right',
];

const root = 'assets/animals/horse-rider/';
const FEMALE_SIZE = 192;
export const riderTexture = (character: string) => 'horse-rider-' + character;
export const RIDER_FRONT_HEAD = 'horse-rider-front-head';
export const frontHeadFrame = (horseFrame: number) => frontalHead.frames.indexOf(horseFrame);
export const FRONT_HEAD_PLACEMENT = frontalHead;

export function riderFile(character: string): string {
  return root + (character === 'farmer-male' ? 'farmer-male-mounted.png' : 'farmer-female.png');
}

export function preloadRiderArt(scene: Phaser.Scene, character: string): void {
  if (!RIDER_ART.includes(character)) return;
  const key = riderTexture(character);
  if (!scene.textures.exists(key)) {
    if (character === 'farmer-male') {
      scene.load.atlas(key, riderFile(character), root + 'farmer-male-mounted.json');
    } else {
      scene.load.spritesheet(key, riderFile(character), { frameWidth: FEMALE_SIZE, frameHeight: FEMALE_SIZE });
    }
  }
  if (character === 'farmer-male' && !scene.textures.exists(RIDER_FRONT_HEAD)) {
    scene.load.spritesheet(RIDER_FRONT_HEAD, root + 'horse-head-male.png', {
      frameWidth: frontalHead.width, frameHeight: frontalHead.height,
    });
  }
}

export function riderPose(character: string, direction: CharacterDirection) {
  const frame = RIDER_ORDER.indexOf(direction);
  if (character === 'farmer-male') {
    const index = String(frame) as keyof typeof maleAtlas.frames;
    const { x: sourceX, y: sourceY, w: width, h: height } = maleAtlas.frames[index].frame;
    return { frame, sourceX, sourceY, width, height, ...maleAtlas.meta.placement[index] };
  }
  return { frame, sourceX: frame * FEMALE_SIZE, sourceY: 0, width: FEMALE_SIZE, height: FEMALE_SIZE, scale: 1, x: 0, y: 0 };
}

/** Altura da pose frontal aprovada em cada estado, relativa ao lombo. */
export function frontalSeatOffset(frame: number): number {
  if (frame === 0) return -2;
  return frame >= 1 && frame <= 8 ? 3 : 0;
}
