import type Phaser from 'phaser';
import art from '../public/assets/visual/open-fields/meadow-grass.json';
export const MEADOW_GRASS_SOURCE='fields-meadow-grass-source';
export const MEADOW_GRASS_TEXTURE='fields-meadow-grass';
export const MEADOW_GRASS_RATIO=art.height/art.width;
export function preloadMeadowGrass(scene:Phaser.Scene):void{
 if(!scene.textures.exists(MEADOW_GRASS_SOURCE))scene.load.image(MEADOW_GRASS_SOURCE,art.file);
}
/** Mantém a resolução original. O corte de alfa tira somente o halo transparente da geração. */
export function setupMeadowGrass(scene:Phaser.Scene):void{
 if(scene.textures.exists(MEADOW_GRASS_TEXTURE))return;
 const source=scene.textures.get(MEADOW_GRASS_SOURCE).getSourceImage() as HTMLImageElement;
 const canvas=document.createElement('canvas');canvas.width=source.width;canvas.height=source.height;
 const c=canvas.getContext('2d')!;c.drawImage(source,0,0);const pixels=c.getImageData(0,0,canvas.width,canvas.height);
 for(let i=3;i<pixels.data.length;i+=4)pixels.data[i]=pixels.data[i]>=art.alphaCutoff?255:0;
 c.putImageData(pixels,0,0);const texture=scene.textures.addCanvas(MEADOW_GRASS_TEXTURE,canvas)!;
 art.frames.forEach((f,i)=>texture.add(i,0,f.x,f.y,art.width,art.height));texture.setFilter(0);
}
/** A brisa move folhas desenhadas, sem girar o tufo inteiro nem mudar o ponto da raiz. */
export function meadowGrassFrame(variant:number,seconds:number,x:number,y:number):number{
 const cycle=[0,1,2,3,2,1],phase=((Math.round(x)*17+Math.round(y)*11)%1000)/1000;
 return variant*4+cycle[Math.floor((seconds*.65+phase)*cycle.length)%cycle.length];
}
