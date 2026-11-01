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
type CharacterGait='walk'|'run';
const frameKey = (id:CharacterId,direction:CharacterDirection,phase:number,gait:CharacterGait='walk'):string=>{
 const character=resolveCharacter({characterId:id}),count=gait==='run'?character.runFrames:character.walkFrames;
 return `character:${id}:${gait}:${characterFrame(direction,phase,count)}`;
};

/** Keep the supplied poses untouched; idle is shared by walk and run atlases. */
export function preloadCharacterSprites(scene:Phaser.Scene):void {
 for(const character of CHARACTERS)for(const gait of ['walk','run'] as const)for(const direction of CHARACTER_DIRECTIONS){
  characterSourcePaths(character.id,direction,gait).forEach((path,phase)=>{
   if(gait==='run'&&phase===0)return;
   scene.load.image(frameKey(character.id,direction,phase,gait),path);
  });
 }
}
export function setupCharacterSprites(scene:Phaser.Scene):void {
 frames.clear();
 for(const character of CHARACTERS)for(const gait of ['walk','run'] as const)for(const direction of CHARACTER_DIRECTIONS){
  characterSourcePaths(character.id,direction,gait).forEach((_,phase)=>{
   const key=frameKey(character.id,direction,phase,gait);
   if(gait==='run'&&phase===0){frames.set(key,frames.get(frameKey(character.id,direction,0))!);return;}
   if(!scene.textures.exists(key))throw new Error(`Imagem de personagem ausente: ${key}`);
   const source=scene.textures.get(key).getSourceImage() as HTMLImageElement;
   const canvas=document.createElement('canvas');canvas.width=CHARACTER_FRAME_WIDTH;canvas.height=CHARACTER_FRAME_HEIGHT;
   const ctx=canvas.getContext('2d')!;ctx.imageSmoothingEnabled=false;
   ctx.drawImage(source,CHARACTER_FRAME_WIDTH/2-character.originX,CHARACTER_FRAME_HEIGHT-3*CHARACTER_TEXTURE_DENSITY-character.originY);
   frames.set(key,canvas);
  });
 }
}

/** Names and legacy save colors never alter the supplied artwork. */
export function drawStyledCharacter(ctx: CanvasRenderingContext2D, profile: CharacterProfile, direction: CharacterDirection, phase: number,gait:CharacterGait='walk'): boolean {
  const character = resolveCharacter(profile);
  const source = frames.get(frameKey(character.id, direction, phase,gait));
  if (!source) return false;
  ctx.drawImage(source, 0, 0);
  return true;
}
