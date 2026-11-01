import type Phaser from 'phaser';
import manifest from '../public/assets/visual/village/greenery/manifest.json';
/** Existing grass artwork, cached as independent sprites for every scene/editor. */
export function setupTallGrassArt(scene:Phaser.Scene):void {
 if(!scene.textures.exists('village-greenery-source'))return;
 const source=scene.textures.get('village-greenery-source').getSourceImage() as HTMLImageElement;
 for(const [index,name]of ['grass-a','grass-b','grass-c'].entries()){
  const key=`nature-tall-grass-${index}`;if(scene.textures.exists(key))continue;
  const frame=manifest.frames[name as 'grass-a'],canvas=document.createElement('canvas');canvas.width=frame.width;canvas.height=frame.height;const c=canvas.getContext('2d')!;
  c.drawImage(source,frame.x,frame.y,frame.width,frame.height,0,0,frame.width,frame.height);const pixels=c.getImageData(0,0,frame.width,frame.height);
  for(let i=3;i<pixels.data.length;i+=4)pixels.data[i]=pixels.data[i]>=manifest.alphaCutoff?255:0;c.putImageData(pixels,0,0);scene.textures.addCanvas(key,canvas)!.setFilter(0);
 }
}
