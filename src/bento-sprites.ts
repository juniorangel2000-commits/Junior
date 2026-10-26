import type Phaser from 'phaser';
import {CHARACTER_DIRECTIONS,characterFrame,type CharacterDirection} from './character-directions';

export const BENTO_WALK_FRAMES=6;
export const BENTO_DISPLAY=64;
const root='assets/visual/village/bento/Idle';
const views:Record<CharacterDirection,string>={down:'south',up:'north',left:'west',right:'east','down-left':'south-west','down-right':'south-east','up-left':'north-west','up-right':'north-east'};
export const bentoSourceKey=(direction:CharacterDirection,frame=0)=>`bento-original:${direction}:${frame}`;
export function preloadBentoSprites(scene:Phaser.Scene):void{
 for(const direction of CHARACTER_DIRECTIONS){
  scene.load.image(bentoSourceKey(direction),`${root}/rotations/${views[direction]}.png`);
  for(let frame=0;frame<BENTO_WALK_FRAMES;frame++)scene.load.image(bentoSourceKey(direction,frame+1),`${root}/animations/Walking/${views[direction]}/frame_${String(frame).padStart(3,'0')}.png`);
 }
}

/** Idle is 192×256, walking 256×256. Translate the idle's transparent padding
 * by 32 pixels; never scale each pose or align its moving feet independently. */
export function bentoTexture(scene:Phaser.Scene):string{
 const key='village-npc-bento';if(scene.textures.exists(key))return key;
 const canvas=document.createElement('canvas');canvas.width=7*256;canvas.height=8*256;
 const c=canvas.getContext('2d')!;c.imageSmoothingEnabled=false;
 for(const [row,direction]of CHARACTER_DIRECTIONS.entries())for(let frame=0;frame<=BENTO_WALK_FRAMES;frame++){
  const source=scene.textures.get(bentoSourceKey(direction,frame)).getSourceImage() as HTMLImageElement;
  c.drawImage(source,frame*256+(256-source.width)/2,row*256);
 }
 const texture=scene.textures.addCanvas(key,canvas);texture?.setFilter(0);
 for(const [row,direction]of CHARACTER_DIRECTIONS.entries())for(let frame=0;frame<=BENTO_WALK_FRAMES;frame++)texture?.add(characterFrame(direction,frame,BENTO_WALK_FRAMES),0,frame*256,row*256,256,256);
 return key;
}
