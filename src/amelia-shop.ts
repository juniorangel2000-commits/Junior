import type Phaser from 'phaser';
import {AMELIA_SHOP} from './data/amelia-shop';
/** Keep the approved PNG intact; only blue-green glass receives the night overlay. */
export function setupAmeliaShop(scene:Phaser.Scene):void{
 const b=AMELIA_SHOP,key=b.texture+'-windows';if(scene.textures.exists(key))return;
 const source=scene.textures.get(b.texture).getSourceImage() as HTMLImageElement,canvas=document.createElement('canvas');canvas.width=b.width;canvas.height=b.height;
 const c=canvas.getContext('2d',{willReadFrequently:true})!;c.drawImage(source,0,0);const input=c.getImageData(0,0,b.width,b.height),mask=c.createImageData(b.width,b.height);
 for(const r of b.glass)for(let y=r.y;y<r.y+r.height;y++)for(let x=r.x;x<r.x+r.width;x++){const i=(y*b.width+x)*4;if(input.data[i+3]>=160&&input.data[i+1]>input.data[i]&&input.data[i+2]>input.data[i])mask.data.set([255,214,143,160],i);}
 c.putImageData(mask,0,0);scene.textures.addCanvas(key,canvas)?.setFilter(0);scene.textures.get(b.texture).setFilter(0);
}
