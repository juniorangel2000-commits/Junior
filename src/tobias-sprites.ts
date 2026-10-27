import type Phaser from 'phaser';
import {CHARACTER_DIRECTIONS,characterFrame,type CharacterDirection} from './character-directions';
import manifest from '../public/assets/visual/village/tobias/personagem.json';
export const TOBIAS_WALK_FRAMES=6,TOBIAS_FRAME_SIZE=256,TOBIAS_DISPLAY=64,TOBIAS_ORIGIN_Y=244/256;
const root='assets/visual/village/tobias',repairKey='tobias-south-refinado';
const views:Record<CharacterDirection,string>={down:'south',up:'north',left:'west',right:'east','down-left':'south-west','down-right':'south-east','up-left':'north-west','up-right':'north-east'};
export const tobiasSourceKey=(d:CharacterDirection,f=0)=>`tobias-original:${d}:${f}`;
export function preloadTobiasSprites(scene:Phaser.Scene):void{
 for(const d of CHARACTER_DIRECTIONS){if(d==='down')continue;scene.load.image(tobiasSourceKey(d),`${root}/Idle/rotations/${views[d]}.png`);
  for(let f=0;f<TOBIAS_WALK_FRAMES;f++)scene.load.image(tobiasSourceKey(d,f+1),`${root}/Idle/animations/Walking/${views[d]}/frame_${String(f).padStart(3,'0')}.png`);
 }
 scene.load.image(repairKey,`${root}/${manifest.southRepair.file}`);
}
/** Native padding is retained in seven directions. The refined south uses one
 * scale/baseline for all poses: a lifted foot never recenters the body. */
export function tobiasTexture(scene:Phaser.Scene):string{
 const key='village-npc-tobias';if(scene.textures.exists(key))return key;
 const size=TOBIAS_FRAME_SIZE,canvas=document.createElement('canvas');canvas.width=7*size;canvas.height=8*size;
 const c=canvas.getContext('2d',{willReadFrequently:true})!;c.imageSmoothingEnabled=false;const repair=manifest.southRepair;
 for(const[row,d]of CHARACTER_DIRECTIONS.entries())for(let f=0;f<=TOBIAS_WALK_FRAMES;f++){
  if(d==='down'){
   const source=scene.textures.get(repairKey).getSourceImage() as HTMLImageElement,r=repair.frames[f];
   c.drawImage(source,r.x,r.y,r.width,r.height,f*size+repair.targetCenterX-r.headCenterX*repair.scale,row*size+repair.targetTop,r.width*repair.scale,r.height*repair.scale);
  }else{const source=scene.textures.get(tobiasSourceKey(d,f)).getSourceImage() as HTMLImageElement;c.drawImage(source,f*size+(size-source.width)/2,row*size);}
 }
 // Crisp alpha on the repaired row; original directional PNGs retain their data.
 const south=c.getImageData(0,0,canvas.width,size);for(let i=3;i<south.data.length;i+=4)south.data[i]=south.data[i]>=160?255:0;c.putImageData(south,0,0);
 const texture=scene.textures.addCanvas(key,canvas);texture?.setFilter(0);
 for(const[row,d]of CHARACTER_DIRECTIONS.entries())for(let f=0;f<=TOBIAS_WALK_FRAMES;f++)texture?.add(characterFrame(d,f,TOBIAS_WALK_FRAMES),0,f*size,row*size,size,size);
 // Only the finished atlas is needed in gameplay; keep source files on disk.
 for(const d of CHARACTER_DIRECTIONS)if(d!=='down')for(let f=0;f<=TOBIAS_WALK_FRAMES;f++)scene.textures.remove(tobiasSourceKey(d,f));scene.textures.remove(repairKey);
 return key;
}
