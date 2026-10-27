import type Phaser from 'phaser';
import {pointInPolygon} from './data/architecture-collision';
import {TOBIAS_SHOP as b,TOBIAS_BENCH_OUTLINE} from './data/tobias-shop';
/** Layer the native artwork at runtime so the player can walk under the open
 * workshop canopy. The original PNG is never cropped or repainted on disk. */
export function setupTobiasShop(scene:Phaser.Scene):void{
 if(scene.textures.exists(b.texture+'-front'))return;
 const source=scene.textures.get(b.texture).getSourceImage() as HTMLImageElement,canvas=document.createElement('canvas');canvas.width=b.width;canvas.height=b.height;
 const c=canvas.getContext('2d',{willReadFrequently:true})!;c.drawImage(source,0,0);const input=c.getImageData(0,0,b.width,b.height),front=c.createImageData(b.width,b.height),back=c.createImageData(b.width,b.height),bench=c.createImageData(b.width,b.height),windows=c.createImageData(b.width,b.height);
 for(let y=0;y<b.height;y++)for(let x=0;x<b.width;x++){
  const i=(y*b.width+x)*4;if(!input.data[i+3])continue;
  const post=x>=754&&x<=797||x>=1276&&x<=1332;
  const layer=pointInPolygon(x,y,TOBIAS_BENCH_OUTLINE)?bench:x>=798&&x<=1275&&y>=573&&!post?back:front;
  layer.data.set(input.data.subarray(i,i+4),i);
  if(b.glass.some(r=>x>=r.x&&x<r.x+r.width&&y>=r.y&&y<r.y+r.height)&&input.data[i+3]>=160&&input.data[i+1]>input.data[i]&&input.data[i+2]>input.data[i])windows.data.set([255,214,143,180],i);
 }
 for(const [suffix,data]of [['front',front],['back',back],['bench',bench],['windows',windows]] as const){const layer=document.createElement('canvas');layer.width=b.width;layer.height=b.height;layer.getContext('2d')!.putImageData(data,0,0);scene.textures.addCanvas(b.texture+'-'+suffix,layer)?.setFilter(0);}
 scene.textures.get(b.texture).setFilter(0);
}
