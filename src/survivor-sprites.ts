import type Phaser from 'phaser';
import {createCharacterFrames} from './art';
import {createCharacterProfile} from './data/characters';
import {CHARACTER_FRAME_WIDTH as FW,CHARACTER_FRAME_HEIGHT as FH} from './character-sprites';
import {CHARACTER_DIRECTIONS} from './character-directions';
import {HEAD_BOTTOM} from './swimming/config';
import {SURVIVOR_LOOKS,type SurvivorLook} from './data/survivor-looks';
type Box={x:number;y:number;width:number;height:number};
function bounds(p:Uint8ClampedArray,width:number,x:number,y:number,w:number,h:number):Box {
 let l=w,r=-1,t=h,b=-1;for(let py=0;py<h;py++)for(let px=0;px<w;px++)if(p[((y+py)*width+x+px)*4+3]>96){l=Math.min(l,px);r=Math.max(r,px);t=Math.min(t,py);b=Math.max(b,py);}
 return r<0?{x:0,y:0,width:w,height:h}:{x:l,y:t,width:r-l+1,height:b-t+1};
}
const skin=(r:number,g:number,b:number)=>r>120&&r>g*1.12&&g>b*1.12&&r-g>18;
/** A wardrobe is painted only into the canonical garment mask: never graft idle arms onto moving arms. */
export function survivorTexture(scene:Phaser.Scene,look:SurvivorLook):string {
 const key='survivor-'+look;if(scene.textures.exists(key))return key;
 const style=SURVIVOR_LOOKS[look],female=style.character==='farmer-female',baseKey='survivor-source-'+style.character;
 if(!scene.textures.exists(baseKey))createCharacterFrames(scene,createCharacterProfile('Sobrevivente',style.character),baseKey);
 const base=scene.textures.get(baseKey).getSourceImage() as HTMLCanvasElement,basePixels=base.getContext('2d')!.getImageData(0,0,base.width,base.height).data;
 const newSource=scene.textures.get(female?'camp-look-female':'camp-look-male').getSourceImage() as HTMLImageElement;
 const appearance=document.createElement('canvas');appearance.width=newSource.width;appearance.height=newSource.height;const ag=appearance.getContext('2d')!;ag.drawImage(newSource,0,0);const painted=ag.getImageData(0,0,appearance.width,appearance.height),ap=painted.data;
 for(let i=0;i<ap.length;i+=4){if(ap[i+3]<96){ap[i+3]=0;continue;}const r=ap[i],g=ap[i+1],b=ap[i+2];
  // Color families exclude the orange skin and the dark outline.
  if(look==='slate'&&r>g*1.3&&r>b*1.02&&g<105&&r<160){const f=(r+g+b)/200;ap[i]=61*f;ap[i+1]=79*f;ap[i+2]=91*f;}
  if(look==='sand'&&r>25&&g>r*.7&&g<r*1.35&&g>b*1.15&&Math.max(r,g)<165){const f=(r+g+b)/225;ap[i]=108*f;ap[i+1]=82*f;ap[i+2]=54*f;}
 }
 ag.putImageData(painted,0,0);
 const canvas=document.createElement('canvas');canvas.width=base.width;canvas.height=base.height;const ctx=canvas.getContext('2d')!;ctx.imageSmoothingEnabled=false;ctx.drawImage(base,0,0);
 const layer=document.createElement('canvas');layer.width=FW;layer.height=FH;const lg=layer.getContext('2d')!;lg.imageSmoothingEnabled=false;
 const columns=female?7:9,cw=appearance.width/4,ch=appearance.height/2;
 for(const[row,direction]of CHARACTER_DIRECTIONS.entries()){
  const headLimit=HEAD_BOTTOM[style.character][direction],idleHead=bounds(basePixels,base.width,0,row*FH,FW,headLimit);
  const col=row%4,srcRow=Math.floor(row/4),box=bounds(ap,appearance.width,col*cw,srcRow*ch,cw,ch),sx=col*cw+box.x,sy=srcRow*ch+box.y;
  // Stop the head at the jaw. The previous longer crop included stationary shoulders.
  const headH=Math.floor(box.height*(female?.44:.37)),newHead=bounds(ap,appearance.width,sx,sy,box.width,headH),torsoH=Math.floor(box.height*(female?.24:.27));
  const headWidth=idleHead.width*(female?1.02:.96),headHeight=(headLimit-idleHead.y)*(female?1.1:1),torsoWidth=direction==='left'||direction==='right'?62:direction.includes('-')?76:84;
  for(let phase=0;phase<columns;phase++){
   const offsetX=phase*FW,offsetY=row*FH,head=bounds(basePixels,base.width,offsetX,offsetY,FW,headLimit),dx=(head.x+head.width/2)-(idleHead.x+idleHead.width/2),dy=head.y-idleHead.y,neck=headLimit+dy,hip=(female?174:168)+dy;
   lg.clearRect(0,0,FW,FH);lg.drawImage(appearance,sx,sy+headH,box.width,torsoH,FW/2-torsoWidth/2+dx,neck-2,torsoWidth,hip-neck+4);
   const garment=lg.getImageData(0,0,FW,FH).data,frame=ctx.getImageData(offsetX,offsetY,FW,FH),p=frame.data;
   for(let y=0;y<FH;y++)for(let x=0;x<FW;x++){
    const i=(y*FW+x)*4,j=((offsetY+y)*base.width+offsetX+x)*4;if(!basePixels[j+3])continue;
    const r=basePixels[j],g=basePixels[j+1],b=basePixels[j+2],blue=b>r*1.08&&g>r*1.05,shirt=r>110&&g>105&&b>75&&Math.max(r,g,b)-Math.min(r,g,b)<65;
    if(y<neck){p[i+3]=0;continue;}
    // Clear the old side bun above the shoulder joint; repaint central neck shadows as a collar.
    if(y<neck+22&&r>g*1.3&&g>b*1.2&&r<155&&!shirt&&!blue){if(female&&(x<76+dx||x>116+dx))p[i+3]=0;else for(let k=0;k<3;k++)p[i+k]=Math.round(style.shirt[k]*.24);continue;}
    if(blue||shirt){const rgb=blue?style.clothes:female?style.shirt:[205,185,145],factor=blue?(r+g+b)/240:(r+g+b)/625;for(let k=0;k<3;k++)p[i+k]=Math.min(255,Math.round(rgb[k]*factor));
     if(y<hip&&garment[i+3]>96&&!skin(garment[i],garment[i+1],garment[i+2]))for(let k=0;k<3;k++)p[i+k]=garment[i+k];
    }
   }
   ctx.putImageData(frame,offsetX,offsetY);
   // Head and neck share a fixed anchor; gait bob follows the original frame exactly.
   ctx.drawImage(appearance,sx+newHead.x,sy+newHead.y,newHead.width,newHead.height,offsetX+idleHead.x+idleHead.width/2+dx-headWidth/2,offsetY+neck-headHeight,headWidth,headHeight+1);
  }
 }
 const texture=scene.textures.addCanvas(key,canvas)!;texture.setFilter(0);
 for(let row=0;row<8;row++)for(let col=0;col<columns;col++)texture.add(row*columns+col,0,col*FW,row*FH,FW,FH);
 return key;
}
