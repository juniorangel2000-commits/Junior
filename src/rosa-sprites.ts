import type Phaser from 'phaser';
import {CHARACTER_DIRECTIONS,characterFrame,type CharacterDirection} from './character-directions';
export const ROSA_WALK_FRAMES=4,ROSA_FRAME_SIZE=256,ROSA_DISPLAY=64;
export const ROSA_ORIGIN_Y=244/256;
const root='assets/visual/village/rosa/Idle';
const views:Record<CharacterDirection,string>={down:'south',up:'north',left:'west',right:'east','down-left':'south-west','down-right':'south-east','up-left':'north-west','up-right':'north-east'};
export const rosaSourceKey=(direction:CharacterDirection,frame=0)=>`rosa-original:${direction}:${frame}`;
export function preloadRosaSprites(scene:Phaser.Scene):void{
 for(const direction of CHARACTER_DIRECTIONS){
  scene.load.image(rosaSourceKey(direction),`${root}/rotations/${views[direction]}.png`);
  for(let frame=0;frame<ROSA_WALK_FRAMES;frame++)scene.load.image(rosaSourceKey(direction,frame+1),`${root}/animations/Walking/${views[direction]}/frame_${String(frame).padStart(3,'0')}.png`);
 }
}
/** All poses share one scale and foot pivot. The idle only gains transparent
 * side padding; moving feet are never individually recentered. */
export function rosaTexture(scene:Phaser.Scene):string{
 const key='village-npc-rosa';if(scene.textures.exists(key))return key;
 const size=ROSA_FRAME_SIZE,canvas=document.createElement('canvas');canvas.width=5*size;canvas.height=8*size;
 const c=canvas.getContext('2d')!;c.imageSmoothingEnabled=false;
 for(const[row,direction]of CHARACTER_DIRECTIONS.entries())for(let f=0;f<=ROSA_WALK_FRAMES;f++){
  const source=scene.textures.get(rosaSourceKey(direction,f)).getSourceImage() as HTMLImageElement;
  c.drawImage(source,f*size+(size-source.width)/2,row*size);
 }
 const texture=scene.textures.addCanvas(key,canvas);texture?.setFilter(0);
 for(const[row,d]of CHARACTER_DIRECTIONS.entries())for(let f=0;f<=ROSA_WALK_FRAMES;f++)texture?.add(characterFrame(d,f,ROSA_WALK_FRAMES),0,f*size,row*size,size,size);
 return key;
}
