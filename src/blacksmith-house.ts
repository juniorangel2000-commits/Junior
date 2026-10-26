import type Phaser from 'phaser';
import {BLACKSMITH_HOUSE} from './data/blacksmith-house';
export {BLACKSMITH_HOUSE} from './data/blacksmith-house';

const anvilOutline=[[830,884],[903,879],[974,886],[1018,896],[990,916],[954,919],[946,934],[937,941],[951,953],[950,985],[945,1040],[870,1050],[840,1031],[838,973],[845,950],[881,948],[884,938],[860,928],[843,917]];
function anvilPixel(x:number,y:number):boolean{
 if(x<827||x>1020||y<874||y>1055)return false;
 let inside=false;for(let i=0,j=anvilOutline.length-1;i<anvilOutline.length;j=i++){
  const [ax,ay]=anvilOutline[i],[bx,by]=anvilOutline[j];if((ay>y)!==(by>y)&&x<(bx-ax)*(y-ay)/(by-ay)+ax)inside=!inside;
 }
 return inside;
}

export function setupBlacksmithHouse(scene:Phaser.Scene):void{
 if(scene.textures.exists(BLACKSMITH_HOUSE.texture))return;
 const source=scene.textures.get(BLACKSMITH_HOUSE.source).getSourceImage() as HTMLImageElement;
 const canvas=document.createElement('canvas');canvas.width=canvas.height=BLACKSMITH_HOUSE.size;
 const c=canvas.getContext('2d',{willReadFrequently:true})!;c.drawImage(source,0,0);
 const image=c.getImageData(0,0,canvas.width,canvas.height);
 const windows=c.createImageData(canvas.width,canvas.height),fire=c.createImageData(canvas.width,canvas.height);
 const front=c.createImageData(canvas.width,canvas.height),back=c.createImageData(canvas.width,canvas.height),anvil=c.createImageData(canvas.width,canvas.height);
 const glass=[{x:330,y:484,w:66,h:97},{x:474,y:798,w:70,h:90}];
 for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++){
  const i=(y*canvas.width+x)*4;image.data[i+3]=image.data[i+3]>=180?255:0;if(!image.data[i+3])continue;
  const r=image.data[i],g=image.data[i+1],b=image.data[i+2];
  if(glass.some(box=>x>=box.x&&x<box.x+box.w&&y>=box.y&&y<box.y+box.h)&&b>=r&&g>=r&&r<100&&Math.abs(g-b)<45){const glow=Math.round(Math.max(65,Math.min(185,185-(r+g+b)/3)));windows.data.set([255,211,143,glow],i);}
  if(x>=895&&x<=1047&&y>=685&&y<=818&&r>150&&g>45&&b<g*.7){fire.data.set([255,176,65,220],i);}
  const post=x>=650&&x<=710&&y>=640&&y<=1010||x>=1144&&x<=1204&&y>=640&&y<=1015;
  const interior=x>=680&&x<=1195&&y>=640||x>=650&&y>=1050;
  const layer=anvilPixel(x,y)?anvil:interior&&!post?back:front;
  layer.data.set(image.data.subarray(i,i+4),i);
 }
 c.putImageData(image,0,0);scene.textures.addCanvas(BLACKSMITH_HOUSE.texture,canvas)?.setFilter(0);
 for(const [key,data]of [['village-blacksmith-windows',windows],['village-blacksmith-fire',fire],[BLACKSMITH_HOUSE.frontTexture,front],['village-blacksmith-floor',back],['village-blacksmith-anvil',anvil]] as const){
  const layer=document.createElement('canvas');layer.width=canvas.width;layer.height=canvas.height;layer.getContext('2d')!.putImageData(data,0,0);scene.textures.addCanvas(key,layer)?.setFilter(0);
 }
}

export function blacksmithPoint(house:Phaser.GameObjects.Image,point:{x:number;y:number}){
 return {x:house.x+(point.x-BLACKSMITH_HOUSE.door.x)*house.scaleX,y:house.y+(point.y-BLACKSMITH_HOUSE.door.y)*house.scaleY};
}
