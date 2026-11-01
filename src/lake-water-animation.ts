import type Phaser from 'phaser';
import type {MapEditData} from './systems/map-editor';
import {readTerrainSprites} from './terrain-sprites';
import {waterFinishChannel} from './data/water-style';
import {LAKE_RIDGE,lakeWater,lakeWaterDistance,lakeShoreCoverage} from './data/fishing-lake';
import {LAKE_CASCADE} from './data/lake-water-motion';
import {paintedWaterPoint} from './data/terrain-paint';
let serial=0;
/** Animate the supplied textures in place; the original PNGs remain unchanged. */
export class LakeWaterAnimation {
 private flow:Phaser.GameObjects.TileSprite;
 private maskImage:Phaser.GameObjects.Image;
 private mask?:Phaser.Display.Masks.BitmapMask;
 private fall:Phaser.Textures.CanvasTexture;
 private source:ImageData;
 private output:ImageData;
 private next=0;
 private readonly maskKey:string;
 private readonly fallKey:string;
 private readonly sourceX:number;
 private readonly sourceY:number;
 private readonly sizeX:number;
 private readonly sizeY:number;
 constructor(private scene:Phaser.Scene,edits?:MapEditData){
  this.maskKey=`lake-flow-mask-${++serial}`;this.fallKey=`lake-cascade-flow-${serial}`;
  const tile='lake-flow-original-water';
  if(!scene.textures.exists(tile)){
   const material=readTerrainSprites(scene)!.water,canvas=document.createElement('canvas');canvas.width=canvas.height=material.size;const c=canvas.getContext('2d')!,data=c.createImageData(material.size,material.size);
   for(let i=0;i<data.data.length;i+=4){for(let k=0;k<3;k++)data.data[i+k]=waterFinishChannel(material.pixels[i+k],k,-72);data.data[i+3]=255;}
   c.putImageData(data,0,0);scene.textures.addCanvas(tile,canvas)!.setFilter(0);
  }
  const canvas=document.createElement('canvas');canvas.width=3072;canvas.height=2304;const context=canvas.getContext('2d')!,mask=context.createImageData(3072,2304),pixels=mask.data;
  for(let by=0;by<2304;by+=4)for(let bx=0;bx<3072;bx+=4){
   const d=lakeWaterDistance((bx+2)/32,(by+2)/32),kind=edits?.terrain[`${Math.floor(bx/32)},${Math.floor(by/32)}`];
   if(!kind&&d>.3)continue;
   for(let dy=0;dy<4;dy++)for(let dx=0;dx<4;dx++){
    const x=bx+dx,y=by+dy,px=x+.5,py=y+.5,i=(y*3072+x)*4;
    const sd=Math.abs(d)<.3?lakeWaterDistance(px/32,py/32):d;
    if(kind&&kind!=='water'&&!paintedWaterPoint(edits?.terrain,px,py,(a,b)=>lakeWater(a/32,b/32)))continue;
    const alpha=kind==='water'?1:sd<0?lakeShoreCoverage(sd):0;
    pixels[i]=pixels[i+1]=pixels[i+2]=255;pixels[i+3]=Math.round(alpha*255);
   }
  }
  context.putImageData(mask,0,0);scene.textures.addCanvas(this.maskKey,canvas)!.setFilter(0);
  this.maskImage=scene.make.image({key:this.maskKey,x:0,y:0,add:false}).setOrigin(0);
  const webgl='gl' in scene.game.renderer;
  if(webgl)this.mask=this.maskImage.createBitmapMask();
  this.flow=scene.add.tileSprite(0,0,3072,2304,tile).setOrigin(0).setAlpha(.3).setDepth(-7).setVisible(webgl).setData('lake-water-flow',true);
  if(this.mask)this.flow.setMask(this.mask);
  const image=scene.textures.get('lake-ridge-source').getSourceImage() as HTMLImageElement,original=document.createElement('canvas');original.width=image.width;original.height=image.height;const c=original.getContext('2d')!;c.drawImage(image,0,0);this.source=c.getImageData(0,0,image.width,image.height);
  this.sizeX=image.width/LAKE_RIDGE.width;this.sizeY=image.height/LAKE_RIDGE.height;
  this.sourceX=Math.round((LAKE_CASCADE.x-LAKE_RIDGE.x-40)*this.sizeX);this.sourceY=Math.round((LAKE_CASCADE.top-LAKE_RIDGE.y)*this.sizeY);
  const width=Math.ceil(80*this.sizeX),height=Math.ceil((LAKE_CASCADE.bottom-LAKE_CASCADE.top)*this.sizeY);
  this.fall=scene.textures.createCanvas(this.fallKey,width,height)!;this.fall.setFilter(0);this.output=this.fall.context.createImageData(width,height);
  scene.add.image(LAKE_CASCADE.x-40,LAKE_CASCADE.top,this.fallKey).setOrigin(0).setDisplaySize(width/this.sizeX,height/this.sizeY).setDepth(-4.5).setData('lake-cascade-flow',true);
 }
 update(time:number):void{
  this.flow.tilePositionX=-time*.007;this.flow.tilePositionY=time*.0035;
  if(time>=this.next-50&&time<this.next)return;this.next=time+50;
  const {width,height,data}=this.output,source=this.source;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
   const at=(y*width+x)*4,sx=this.sourceX+x,sy=this.sourceY+y,base=(sy*source.width+sx)*4,r=source.data[base],g=source.data[base+1],b=source.data[base+2];
   const water=b>=r*.95&&b>=g*.87&&g>=r*.98,edge=Math.min(1,x/6,(width-1-x)/6,y/12,(height-1-y)/18);
   if(!water||source.data[base+3]<180||edge<=0){data[at+3]=0;continue;}
   const speed=(176+y/height*80)*this.sizeY,span=160*this.sizeY,offset=((y-time*.001*speed)%span+span)%span,scrollY=this.sourceY+Math.round(70*this.sizeY+offset),sample=(Math.min(source.height-1,scrollY)*source.width+sx)*4;
   const sr=source.data[sample],sg=source.data[sample+1],sb=source.data[sample+2],valid=sb>=sr*.95&&sb>=sg*.87;
   for(let k=0;k<3;k++)data[at+k]=source.data[base+k]*.25+(valid?source.data[sample+k]:source.data[base+k])*.75;
   data[at+3]=Math.round(edge*225);
  }
  this.fall.context.putImageData(this.output,0,0);this.fall.refresh();
 }
 destroy():void{this.flow.clearMask();this.mask?.destroy();this.maskImage.destroy();this.scene.textures.remove(this.maskKey);this.scene.textures.remove(this.fallKey);}
}
