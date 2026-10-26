import type Phaser from 'phaser';
import {readTerrainSprites,type TerrainSprites} from './terrain-sprites';
import {SEAM_BAND_TILES,type SeamArea} from './data/map-seam';
import {TILE,WORLD_WIDTH,WORLD_HEIGHT} from './data/world-size';

const smooth=(v:number)=>{const t=Math.max(0,Math.min(1,v));return t*t*(3-2*t);};
const kinds=['forest','grass','meadow','moss'] as const;
const fallback=[[52,87,56],[92,133,51],[125,150,62],[62,104,53]];
const mirrored=(value:number,size:number)=>{
 const period=size*2,p=((Math.floor(value)%period)+period)%period;
 return p<size?p:period-p-1;
};
/** Both maps taper into the same ground instead of ending on two different palettes. */
export function seamGroundWeight(area:SeamArea,x:number,y:number):number {
 const distance=area==='forest'?WORLD_WIDTH*TILE-x:x;
 const inner=78+Math.sin(y*.011)*14+Math.sin(y*.031)*5;
 return 1-smooth((distance-inner)/(SEAM_BAND_TILES*TILE-inner));
}

/** One texture phase and ecological mix, in coordinates across the actual join. */
export function seamGroundColor(sprites:TerrainSprites|undefined,area:SeamArea,x:number,y:number,output?:number[]):readonly number[] {
 const gx=area==='forest'?x-WORLD_WIDTH*TILE:x;
 const clearing=Math.exp(-(((y-52.5*TILE)/160)**2));
 const pocket=Math.sin(gx*.006+y*.013)*.035+Math.sin(y*.037)*.025;
 const color=output??[0,0,0];color.fill(0);
 for(let m=0;m<kinds.length;m++){
  const sprite=sprites?.[kinds[m]];
  const weight=m===0?.52-.15*clearing+pocket:m===1?.29+.08*clearing:m===2?.10+.10*clearing:.09-.03*clearing-pocket;
  const offset=sprite?(mirrored(y,sprite.size)*sprite.size+mirrored(gx,sprite.size))*4:0;
  for(let c=0;c<3;c++)color[c]+=(sprite?.pixels[offset+c]??fallback[m][c])*weight;
 }
 return color;
}

/** A narrow base strip, below editable terrain and all props. User floors/water
 * still cover it; it also fills the noneditable outermost map-edge cells. */
export function drawMapSeamGround(scene:Phaser.Scene,area:SeamArea):void {
 // A fallback world without the drawn terrain atlas keeps its own base painter.
 if(!scene.textures.exists('asset-ground-forest'))return;
 const key=`map-seam-ground-v1:${area}`,width=SEAM_BAND_TILES*TILE,height=WORLD_HEIGHT*TILE;
 const left=area==='forest'?WORLD_WIDTH*TILE-width:0;
 if(!scene.textures.exists(key)){
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  const context=canvas.getContext('2d')!,image=context.createImageData(width,height),sprites=readTerrainSprites(scene);
  const color=[0,0,0];
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
   const wx=left+x,weight=seamGroundWeight(area,wx,y);if(weight<=0)continue;
   seamGroundColor(sprites,area,wx,y,color);const at=(y*width+x)*4;
   for(let c=0;c<3;c++)image.data[at+c]=color[c];image.data[at+3]=Math.round(weight*255);
  }
  context.putImageData(image,0,0);scene.textures.addCanvas(key,canvas)?.setFilter(0);
 }
 scene.add.image(left,0,key).setOrigin(0).setDepth(-95);
}
