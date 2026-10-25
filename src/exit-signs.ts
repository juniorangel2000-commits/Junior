import type Phaser from 'phaser';
import {exitSignLayout,type ExitDirection} from './data/exit-signs';

function setupSigns(scene:Phaser.Scene):void {
 if(!scene.textures.exists('graphics-controls-signs-source')||scene.textures.exists('exit-sign-left'))return;
 const source=scene.textures.get('graphics-controls-signs-source').getSourceImage() as HTMLImageElement;
 for(const [index,direction] of ['left','right'].entries()){
  const canvas=document.createElement('canvas');canvas.width=Math.floor(source.width/2);canvas.height=Math.floor(source.height/2);
  const ctx=canvas.getContext('2d',{willReadFrequently:true})!;ctx.imageSmoothingEnabled=false;
  ctx.drawImage(source,index*source.width/2,source.height/2,source.width/2,source.height/2,0,0,canvas.width,canvas.height);
  const rgba=ctx.getImageData(0,0,canvas.width,canvas.height).data;
  let left=canvas.width,right=0,top=canvas.height,bottom=0;
  for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++)if(rgba[(y*canvas.width+x)*4+3]>80){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
  const cropped=document.createElement('canvas');cropped.width=right-left+1;cropped.height=bottom-top+1;
  cropped.getContext('2d')!.drawImage(canvas,left,top,cropped.width,cropped.height,0,0,cropped.width,cropped.height);
  scene.textures.addCanvas(`exit-sign-${direction}`,cropped)?.setFilter(0);
 }
 // Vertical gates retain an upright post; only the arrow board changes direction.
 for(const direction of ['up','down'] as const){
  const canvas=document.createElement('canvas');canvas.width=48;canvas.height=64;const ctx=canvas.getContext('2d')!;
  ctx.fillStyle='#3e2b1d';ctx.fillRect(20,3,9,59);ctx.fillStyle='#986333';ctx.fillRect(22,4,5,56);
  ctx.fillStyle='#4b301b';ctx.fillRect(5,8,38,35);ctx.fillStyle='#a36c35';ctx.fillRect(7,10,34,31);
  ctx.fillStyle='#c08c48';for(let y=12;y<40;y+=6)ctx.fillRect(8,y,32,1);
  ctx.fillStyle='#fff0c3';ctx.beginPath();
  const points=direction==='up'?[[24,12],[13,24],[20,24],[20,36],[28,36],[28,24],[35,24]]:[[24,38],[13,26],[20,26],[20,14],[28,14],[28,26],[35,26]];
  points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();
  ctx.fillStyle='#6e813b';ctx.fillRect(16,59,18,4);ctx.fillStyle='#a1a078';ctx.fillRect(30,58,7,5);
  scene.textures.addCanvas(`exit-sign-${direction}`,canvas)?.setFilter(0);
 }
}
/** A painted arrow only: no labels, collider, reward or extra transition trigger. */
export function drawExitSign(scene:Phaser.Scene,exit:{x:number;y:number},entry?:{x:number;y:number}):Phaser.GameObjects.Image|undefined {
 setupSigns(scene);const layout=exitSignLayout(exit,entry);
 const texture=`exit-sign-${layout.direction as ExitDirection}`;if(!scene.textures.exists(texture))return;
 const image=scene.add.image(layout.x,layout.y,texture).setOrigin(.5,1);
 const scale=62/image.height;return image.setScale(scale).setDepth(layout.y).setData('map-exit-sign',layout.direction);
}
