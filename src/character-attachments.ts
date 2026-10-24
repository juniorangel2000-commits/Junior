import type Phaser from 'phaser';
import type {CharacterProfile} from './types';
import {resolveCharacter} from './data/characters';
import leftHands from './data/character-left-hand.json';
import {CHARACTER_FRAME_WIDTH,CHARACTER_FRAME_HEIGHT,CHARACTER_TEXTURE_DENSITY} from './character-sprites';

type AttachmentSprite=Pick<Phaser.GameObjects.Sprite,'x'|'y'|'scaleX'|'scaleY'|'displayOriginX'|'displayOriginY'|'rotation'>;
/** Per-pose anatomical left hand, transformed from the original PNG to the displayed atlas. */
export function characterLeftHand(profile:Pick<CharacterProfile,'characterId'>,frame:number,sprite:AttachmentSprite):{x:number;y:number} {
  const character=resolveCharacter(profile),[x,y]=leftHands[character.id][frame];
  const localX=CHARACTER_FRAME_WIDTH/2-character.originX+x-sprite.displayOriginX;
  const localY=CHARACTER_FRAME_HEIGHT-3*CHARACTER_TEXTURE_DENSITY-character.originY+y-sprite.displayOriginY;
  const dx=localX*sprite.scaleX,dy=localY*sprite.scaleY,c=Math.cos(sprite.rotation),s=Math.sin(sprite.rotation);
  return {x:sprite.x+dx*c-dy*s,y:sprite.y+dx*s+dy*c};
}
