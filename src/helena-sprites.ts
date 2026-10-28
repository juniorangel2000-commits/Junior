import type Phaser from 'phaser';
import manifest from '../public/assets/visual/village/helena/personagem.json';
import {CHARACTER_DIRECTIONS,characterFrame,type CharacterDirection} from './character-directions';
export const HELENA_WALK_FRAMES=6,HELENA_FRAME_SIZE=256,HELENA_DISPLAY=64,HELENA_ORIGIN_Y=244/256;
const root='assets/visual/village/helena';
const views:Record<CharacterDirection,string>={down:'south',up:'north',left:'west',right:'east','down-left':'south-west','down-right':'south-east','up-left':'north-west','up-right':'north-east'};
export const helenaSourceKey=(d:CharacterDirection,f=0)=>`helena-original:${d}:${f}`;
export function preloadHelenaSprites(scene:Phaser.Scene):void{
 if(scene.textures.exists('village-npc-helena'))return;
 for(const d of CHARACTER_DIRECTIONS){if(d==='down')continue;
  scene.load.image(helenaSourceKey(d),`${root}/Idle/rotations/${views[d]}.png`);
  for(let f=0;f<HELENA_WALK_FRAMES;f++)scene.load.image(helenaSourceKey(d,f+1),`${root}/Idle/animations/Walking/${views[d]}/frame_${String(f).padStart(3,'0')}.png`);
 }
 scene.load.image('helena-south-refinado',`${root}/${manifest.southRepair.file}`);
}
/** Seven native directions keep their pixels and padding. The refined front uses
 * one scale and head alignment for idle and all eight walk phases. */
export function helenaTexture(scene:Phaser.Scene):string{
 const key='village-npc-helena';if(scene.textures.exists(key))return key;
 const size=HELENA_FRAME_SIZE,columns=HELENA_WALK_FRAMES+1,canvas=document.createElement('canvas');canvas.width=columns*size;canvas.height=8*size;
 const c=canvas.getContext('2d')!;c.imageSmoothingEnabled=false;
 for(const[row,d]of CHARACTER_DIRECTIONS.entries())for(let f=0;f<=HELENA_WALK_FRAMES;f++){
  if(d==='down'){
   const source=scene.textures.get('helena-south-refinado').getSourceImage() as HTMLImageElement,r=manifest.southRepair.frames[f],repair=manifest.southRepair;
   c.drawImage(source,r.x,r.y,r.width,r.height,f*size+repair.targetCenterX-r.headCenterX*repair.scale,row*size+repair.targetTop,r.width*repair.scale,r.height*repair.scale);
  }else{
   const source=scene.textures.get(helenaSourceKey(d,f)).getSourceImage() as HTMLImageElement;
   c.drawImage(source,f*size+(size-source.width)/2,row*size);
  }
 }
 const south=c.getImageData(0,0,canvas.width,size);for(let i=3;i<south.data.length;i+=4)south.data[i]=south.data[i]>=160?255:0;c.putImageData(south,0,0);
 const texture=scene.textures.addCanvas(key,canvas)!;texture.setFilter(0);
 for(const[row,d]of CHARACTER_DIRECTIONS.entries())for(let f=0;f<=HELENA_WALK_FRAMES;f++)texture.add(characterFrame(d,f,HELENA_WALK_FRAMES),0,f*size,row*size,size,size);
 for(const d of CHARACTER_DIRECTIONS)if(d!=='down')for(let f=0;f<=HELENA_WALK_FRAMES;f++)scene.textures.remove(helenaSourceKey(d,f));
 scene.textures.remove('helena-south-refinado');
 return key;
}
