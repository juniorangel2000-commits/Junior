import type Phaser from 'phaser';
import {PROPERTY_BRIDGES} from './data/bridges';
import {TILE} from './data/regions';
import {readTerrainSprites} from './terrain-sprites';

/** Finished crossings share collision bounds with the old bridges. Rails sort with actors. */
export function drawPropertyBridges(scene:Phaser.Scene):void {
 const materials=readTerrainSprites(scene);
 for(const bridge of PROPERTY_BRIDGES){
  const width=bridge.width*TILE,height=bridge.height*TILE,left=bridge.x*TILE,top=bridge.y*TILE;
  for(const layer of ['deck','back','front'] as const){
   const key=`bridge-v3-finished:${bridge.width}:${layer}`;
   if(!scene.textures.exists(key)){
    const canvas=document.createElement('canvas');canvas.width=width+16;canvas.height=layer==='deck'?height+10:32;
    const ctx=canvas.getContext('2d')!;ctx.imageSmoothingEnabled=false;
    const rect=(color:string,x:number,y:number,w:number,h:number)=>{ctx.fillStyle=color;ctx.fillRect(x,y,w,h);};
    const wood=(x:number,y:number,w:number,h:number,salt=0)=>{
     rect('#4d3422',x,y,w,h);const source=materials?.wood;
     for(let py=1;py<h-1;py++)for(let px=1;px<w-1;px++){
      const i=source?(((py+salt*13)%source.size)*source.size+(px+salt*7)%source.size)*4:0;
      const r=source?source.pixels[i]:148,g=source?source.pixels[i+1]:105,b=source?source.pixels[i+2]:60;
      rect(`rgb(${Math.round(r*.89)},${Math.round(g*.89)},${Math.round(b*.86)})`,x+px,y+py,1,1);
     }
     rect('#c39758',x+1,y+1,w-2,1);rect('#694326',x+1,y+h-2,w-2,1);
    };
    const nail=(x:number,y:number)=>{rect('#403a30',x,y,2,2);rect('#b9ac86',x,y,1,1);};
    const stone=(x:number,y:number,w:number,h:number)=>{
     rect('#424d40',x,y,w,h);rect('#81836a',x+1,y+1,w-2,h-2);rect('#b7af8a',x+1,y+1,w-2,2);
     rect('#5b6850',x+1,y+h-3,w-2,2);rect('#a09e7b',x+2,y+5,w-4,1);
    };
    if(layer==='deck'){
     rect('#203b3038',3,7,width+10,height+2);
     // Complete masonry at both heads with staggered joints and restrained moss.
     for(const x of [0,width+8])for(let row=0;row<6;row++){
      stone(x,4+row*10,8,10);rect('#6c7950',x+(row%2?1:4),8+row*10,3,2);
     }
     wood(7,5,width+2,height-5,1);
     for(let x=0;x<width;x+=10){
      const w=Math.min(10,width-x);wood(8+x,7,w-1,height-10,Math.floor(x/10));
      for(const y of [12,height-12])nail(10+x,y);
      if(x%30===0){rect('#80592f',10+x,23,1,13);rect('#b78a4b',11+x,26,1,8);}
     }
     // Continuous border timbers finish the exposed long edges.
     wood(6,2,width+4,5,2);wood(6,height-5,width+4,6,4);
     // Headers cap the boards at both land entrances.
     wood(6,6,6,height-12,3);wood(width+4,6,6,height-12,5);
    }else{
     rect('#273b2c28',7,27,width+2,4);
     const posts=[0,...Array.from({length:Math.ceil(width/48)-1},(_,i)=>(i+1)*48),width];
     // Diagonal braces behind the two handrails, with darker lower faces.
     ctx.lineWidth=3;ctx.lineCap='butt';
     for(let i=1;i<posts.length;i++){
      const a=posts[i-1]+11,b=posts[i]+5;
      ctx.strokeStyle='#5b3b24';ctx.beginPath();ctx.moveTo(a,24);ctx.lineTo(b,11);ctx.moveTo(a,11);ctx.lineTo(b,24);ctx.stroke();
      ctx.strokeStyle='#b08246';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(a,23);ctx.lineTo(b,10);ctx.moveTo(a,10);ctx.lineTo(b,23);ctx.stroke();ctx.lineWidth=3;
     }
     wood(6,8,width+4,6,2);wood(6,23,width+4,4,5);
     for(const offset of posts){
      const x=offset+5;stone(x-1,25,9,5);wood(x,3,7,25,Math.floor(offset/16));
      wood(x-1,1,9,4,3);rect('#dfb875',x,1,7,1);
      for(const y of [10,24])nail(x+2,y);
      rect('#423c32',x-1,19,9,3);rect('#b6a57a',x,19,7,1);
     }
    }
    scene.textures.addCanvas(key,canvas)?.setFilter(0);
   }
   const y=layer==='deck'?top:layer==='back'?top+6:top+height-1;
   scene.add.image(left-8,y,key).setOrigin(0,layer==='deck'?0:1).setDepth(layer==='deck'?-60:y);
  }
 }
}
