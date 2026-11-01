import {CascadeFlow} from './cascade-flow';
import type Phaser from 'phaser';
import type {MapEditData} from './systems/map-editor';
import {setupWaterSurface} from './water-motion';
import {LAKE_RIDGE,lakeWater,lakeWaterDistance,lakeShoreCoverage} from './data/fishing-lake';
import {paintedWaterPoint} from './data/terrain-paint';
let serial=0;
/** Keep the lake surface, rebuilt stream and rebuilt waterfall in independent layers. */
export class LakeWaterAnimation {
 private flow:Phaser.GameObjects.TileSprite;
 private maskImage:Phaser.GameObjects.Image;
 private mask?:Phaser.Display.Masks.BitmapMask;
 private fall:Phaser.Textures.CanvasTexture;
 private cascade:CascadeFlow;
 private output:ImageData;
 private next=0;
 private readonly maskKey:string;
 private readonly fallKey:string;
 private readonly sizeX:number;
 private readonly sizeY:number;
 constructor(private scene:Phaser.Scene,edits?:MapEditData){
  this.maskKey=`lake-flow-mask-${++serial}`;this.fallKey=`lake-cascade-flow-${serial}`;
  const tile=setupWaterSurface(scene);
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
  const image=scene.textures.get('lake-ridge-source').getSourceImage() as HTMLImageElement,original=document.createElement('canvas');original.width=image.width;original.height=image.height;const c=original.getContext('2d')!;c.drawImage(image,0,0);
  const material=document.createElement('canvas');material.width=128;material.height=512;const mc=material.getContext('2d')!;mc.drawImage(scene.textures.get('lake-cascade-material-source').getSourceImage() as HTMLImageElement,0,0,128,512);
  const river=scene.textures.get(tile).getSourceImage() as HTMLCanvasElement;
  this.cascade=new CascadeFlow(c.getImageData(0,0,image.width,image.height),mc.getImageData(0,0,128,512),river.getContext('2d')!.getImageData(0,0,river.width,river.height));
  this.sizeX=image.width/LAKE_RIDGE.width;this.sizeY=image.height/LAKE_RIDGE.height;
  const {width,height,x,y}=this.cascade;
  this.fall=scene.textures.createCanvas(this.fallKey,width,height)!;this.fall.setFilter(0);this.output=this.fall.context.createImageData(width,height);
  scene.add.image(LAKE_RIDGE.x+x/this.sizeX,LAKE_RIDGE.y+y/this.sizeY,this.fallKey).setOrigin(0).setDisplaySize(width/this.sizeX,height/this.sizeY).setDepth(-4.5).setData('lake-cascade-flow',true);

 }
 update(time:number):void{
  this.flow.tilePositionX=-time*.007;this.flow.tilePositionY=time*.0035;
  if(time>=this.next-33&&time<this.next)return;this.next=time+33;
  this.cascade.update(time);this.output.data.set(this.cascade.pixels);
  this.fall.context.putImageData(this.output,0,0);this.fall.refresh();
 }
 destroy():void{this.flow.clearMask();this.mask?.destroy();this.maskImage.destroy();this.scene.textures.remove(this.maskKey);this.scene.textures.remove(this.fallKey);}
}
