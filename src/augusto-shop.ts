import type Phaser from 'phaser';
import {AUGUSTO_SHOP} from './data/augusto-shop';
export {AUGUSTO_SHOP} from './data/augusto-shop';
/** A separate lighting mask leaves the original facade PNG untouched. */
export function setupAugustoShop(scene:Phaser.Scene):void{
 const key=AUGUSTO_SHOP.texture+'-windows';if(scene.textures.exists(key))return;
 const source=scene.textures.get(AUGUSTO_SHOP.texture).getSourceImage() as HTMLImageElement;
 const canvas=document.createElement('canvas');canvas.width=AUGUSTO_SHOP.width;canvas.height=AUGUSTO_SHOP.height;
 const c=canvas.getContext('2d',{willReadFrequently:true})!;c.drawImage(source,0,0);const image=c.getImageData(0,0,canvas.width,canvas.height),mask=c.createImageData(canvas.width,canvas.height);
 for(const r of AUGUSTO_SHOP.glass)for(let y=r.y;y<r.y+r.height;y++)for(let x=r.x;x<r.x+r.width;x++){
  const i=(y*canvas.width+x)*4,red=image.data[i],green=image.data[i+1],blue=image.data[i+2];
  if(image.data[i+3]&&green>red&&blue>red)mask.data.set([255,214,143,Math.round(image.data[i+3]*.75)],i);
 }
 c.putImageData(mask,0,0);scene.textures.addCanvas(key,canvas)?.setFilter(0);
}
