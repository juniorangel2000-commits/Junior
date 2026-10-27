import type Phaser from 'phaser';
import {CHARACTER_DIRECTIONS,characterFrame,type CharacterDirection} from './character-directions';

export const AUGUSTO_WALK_FRAMES=6;
export const AUGUSTO_FRAME_SIZE=160;
export const AUGUSTO_DISPLAY=72;
export const AUGUSTO_ORIGIN_Y=.85;
const root='assets/visual/village/augusto/Idle';
const views:Record<CharacterDirection,string>={down:'south',up:'north',left:'west',right:'east','down-left':'south-west','down-right':'south-east','up-left':'north-west','up-right':'north-east'};
export const augustoSourceKey=(direction:CharacterDirection,frame=0)=>`augusto-original:${direction}:${frame}`;

export function preloadAugustoSprites(scene:Phaser.Scene):void{
 for(const direction of CHARACTER_DIRECTIONS){
  scene.load.image(augustoSourceKey(direction),`${root}/rotations/${views[direction]}.png`);
  for(let frame=0;frame<AUGUSTO_WALK_FRAMES;frame++)scene.load.image(augustoSourceKey(direction,frame+1),`${root}/animations/Walk/${views[direction]}/frame_${String(frame).padStart(3,'0')}.png`);
 }
}

/** Idle has a 112px canvas and walking a 160px canvas. A fixed 24px translation
 * keeps their scale and contact with the floor; never recenter individual feet. */
export function augustoTexture(scene:Phaser.Scene):string{
 const key='village-npc-augusto';if(scene.textures.exists(key))return key;
 const size=AUGUSTO_FRAME_SIZE,canvas=document.createElement('canvas');
 canvas.width=(AUGUSTO_WALK_FRAMES+1)*size;canvas.height=CHARACTER_DIRECTIONS.length*size;
 const context=canvas.getContext('2d')!;context.imageSmoothingEnabled=false;
 for(const[row,direction]of CHARACTER_DIRECTIONS.entries())for(let frame=0;frame<=AUGUSTO_WALK_FRAMES;frame++){
  const source=scene.textures.get(augustoSourceKey(direction,frame)).getSourceImage() as HTMLImageElement;
  context.drawImage(source,frame*size+(size-source.width)/2,row*size+(size-source.height)/2);
 }
 const texture=scene.textures.addCanvas(key,canvas);texture?.setFilter(0);
 for(const[row,direction]of CHARACTER_DIRECTIONS.entries())for(let frame=0;frame<=AUGUSTO_WALK_FRAMES;frame++)texture?.add(characterFrame(direction,frame,AUGUSTO_WALK_FRAMES),0,frame*size,row*size,size,size);
 return key;
}
