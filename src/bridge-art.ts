import type Phaser from 'phaser';
import { PROPERTY_BRIDGES } from './data/bridges';
import { TILE } from './data/regions';
import { readTerrainSprites } from './terrain-sprites';

/** Reuse the game's timber/stone palette; back and front rails sort with actors. */
export function drawPropertyBridges(scene:Phaser.Scene):void {
  const materials=readTerrainSprites(scene);
  for(const bridge of PROPERTY_BRIDGES) {
    const width=bridge.width*TILE, height=bridge.height*TILE, left=bridge.x*TILE, top=bridge.y*TILE;
    for(const layer of ['deck','back','front'] as const) {
      const key=`bridge-v2:${bridge.width}:${layer}`;
      if(!scene.textures.exists(key)) {
        const canvas=document.createElement('canvas');canvas.width=width+16;canvas.height=layer==='deck'?height+10:28;
        const ctx=canvas.getContext('2d')!;ctx.imageSmoothingEnabled=false;
        const rect=(color:string,x:number,y:number,w:number,h:number)=>{ctx.fillStyle=color;ctx.fillRect(x,y,w,h);};
        const wood=(x:number,y:number,w:number,h:number,salt=0)=>{
          salt=Math.floor(salt);
          rect('#4b382a',x,y,w,h);
          const source=materials?.wood;
          for(let py=1;py<h-1;py++)for(let px=1;px<w-1;px++) {
            const i=source?(((px+salt*11)%source.size)*source.size+(py+salt*7)%source.size)*4:0;
            const r=source?source.pixels[i]:144,g=source?source.pixels[i+1]:99,b=source?source.pixels[i+2]:56;
            rect(`rgb(${Math.round(r*.84)},${Math.round(g*.84)},${Math.round(b*.84)})`,x+px,y+py,1,1);
          }
          rect('#c3a16b',x+1,y+1,w-2,1);rect('#67472e',x+1,y+h-2,w-2,1);
        };
        if(layer==='deck') {
          rect('#203a3238',5,6,width+6,height+4);
          // Low stone abutments meet the land without adding obstacles.
          for(const x of [0,width+8]) {
            rect('#596753',x,5,8,height-4);rect('#a7aa86',x+1,5,6,height-7);
            for(let y=9;y<height-3;y+=10){rect('#69755a',x,y,8,1);rect('#d0c69e',x+1,y-2,5,1);}
          }
          rect('#493625',8,5,width,height-3);
          for(let x=0;x<width;x+=12) {
            const wobble=(x/12)%3===0?1:0;
            wood(8+x,5+wobble,Math.min(12,width-x)-1,height-8-wobble,x/12);
            for(const y of [12,height-12]){rect('#473b30',12+x,y,2,2);rect('#aaa585',12+x,y,1,1);}
            if(x%36===0){rect('#596d3c',9+x,height-8,6,2);rect('#81924a',10+x,height-9,3,1);}
          }
        } else {
          // Foot of the rail is at y=26. Tops rise 20px above the deck.
          rect('#27372c30',8,23,width,4);
          wood(8,8,width,5,1);wood(8,18,width,4,2);
          for(let x=9;x<width+8;x+=32) {
            wood(x,3,7,24,x/32);
            rect('#d2b27b',x-1,2,9,3);rect('#b08b55',x,2,7,1);
            rect('#d9c19a',x-1,13,9,2);rect('#796146',x-1,15,9,1);
          }
        }
        scene.textures.addCanvas(key,canvas)?.setFilter(0);
      }
      const y=layer==='deck'?top:layer==='back'?top+6:top+height-1;
      scene.add.image(left-8,y,key).setOrigin(0,layer==='deck'?0:1).setDepth(layer==='deck'?-60:y);
    }
  }
}
