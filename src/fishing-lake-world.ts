import {waterFinishChannel} from './data/water-style';
import {setupTallGrassArt} from './tall-grass-art';
import type Phaser from 'phaser';
import type {MapEditData} from './systems/map-editor';
import type {WorldEditorObject} from './world';
import {readTerrainSprites} from './terrain-sprites';
import {drawMapTerrainEdits} from './map-editor-terrain';
import {drawEditorProp} from './editor-prop-art';
import {setupVillagePropAtlas} from './village-prop-atlas';
import pierArt from '../public/assets/visual/village/pier/manifest.json';
import {LAKE_RIDGE,LAKE_SIDE_RIDGES,LAKE_SIDE_CROP,LAKE_PIER,lakeObjects,lakeLowVegetationClear,lakeWater,lakeWaterDistance,lakeTrailDistance,lakeBridge,LAKE_CITY_ENTRY,LAKE_CITY_EXIT,LAKE_PROPERTY_ENTRY,LAKE_PROPERTY_EXIT} from './data/fishing-lake';
import {drawExitSign} from './exit-signs';
export function preloadFishingLake(scene:Phaser.Scene):void{
 if(!scene.textures.exists('lake-west-source'))scene.load.image('lake-west-source','assets/visual/fishing-lake/west-ridge.png');
 if(!scene.textures.exists('lake-pier-source'))scene.load.image('lake-pier-source','assets/visual/fishing-lake/fishing-pier.png');
 if(!scene.textures.exists('lake-ridge-source'))scene.load.image('lake-ridge-source','assets/visual/fishing-lake/ridge-waterfall.png');
 if(!scene.textures.exists('village-pier-source'))scene.load.image('village-pier-source',pierArt.file);
}
export class FishingLakeWorld {
 readonly editorObjects:WorldEditorObject[]=[];
 readonly trees:Phaser.GameObjects.Image[]=[];
 readonly objects:Phaser.GameObjects.GameObject[];
 private waterFX:Phaser.GameObjects.Graphics;
 constructor(private scene:Phaser.Scene,edits?:MapEditData,namespace='fishing-lake'){
  const before=new Set(scene.children.list);setupTallGrassArt(scene);this.drawGround();
  drawMapTerrainEdits(scene,edits?.terrain??{},namespace+'-paint',lakeWater,'forest')?.setDepth(-99);
  for(const [key,sourceKey] of [['lake-ridge','lake-ridge-source'],['lake-west','lake-west-source']])if(!scene.textures.exists(key)){
   const source=scene.textures.get(sourceKey).getSourceImage() as HTMLImageElement,canvas=document.createElement('canvas');canvas.width=source.width;canvas.height=source.height;const c=canvas.getContext('2d')!;c.drawImage(source,0,0);const p=c.getImageData(0,0,canvas.width,canvas.height);for(let i=3;i<p.data.length;i+=4)p.data[i]=p.data[i]>160?255:0;c.putImageData(p,0,0);const texture=scene.textures.addCanvas(key,canvas)!;texture.setFilter(0);
   if(key==='lake-west'){const r=LAKE_SIDE_CROP;texture.add('body',0,r.x,r.y,r.width,r.height);}
  }
  for(const p of LAKE_SIDE_RIDGES)scene.add.image(p.x,p.y,'lake-west','body').setOrigin(0).setDisplaySize(LAKE_SIDE_CROP.width*p.scale,LAKE_SIDE_CROP.height*p.scale).setFlipX(p.flip).setDepth(-5).setData('lake-landmark','side-ridge');
  scene.add.image(LAKE_RIDGE.x,LAKE_RIDGE.y,'lake-ridge').setOrigin(0).setDisplaySize(LAKE_RIDGE.width,LAKE_RIDGE.height).setDepth(-5).setData('lake-landmark','ridge');
  setupVillagePropAtlas(scene,'lake-pier','village-pier-source',pierArt);
  const p=LAKE_PIER;
  scene.add.image(p.x,p.y,'lake-pier-source').setOrigin(0).setDisplaySize(p.width,p.height).setDepth(-3).setData('lake-landmark','pier');
  scene.add.image(p.x,p.y,'lake-pier-source').setOrigin(0).setDisplaySize(p.width,p.height).setCrop(500,480,1210,100).setDepth(47.5*32);
  scene.add.image(p.x,p.y,'lake-pier-source').setOrigin(0).setDisplaySize(p.width,p.height).setCrop(70,670,480,130).setDepth(49.4*32);
  this.drawDeck(26.5*32,58.3*32,11*32,3.8*32);
  for(const [frame,x,y,w,h]of [['crate',84.8,48,44,34],['anchor',82.8,49.2,44,42]] as const)scene.add.image(x*32,y*32,'lake-pier',frame).setOrigin(.5,1).setDisplaySize(w,h).setDepth(y*32);
  // Small lookout bench remains on the terrace, away from the stairs.
  scene.add.image(28*32,5*32,'woodwork-bench-0').setOrigin(.5,1).setScale(.4).setDepth(5*32);
  for(const p of lakeObjects(edits)){
   if((p.kind.startsWith('tallGrass')||['fern','whiteFlowers','bush','mushrooms'].includes(p.kind))&&!lakeLowVegetationClear(p.x,p.y,edits))continue;
   const tree=p.kind==='standingTree'||p.kind==='pine',y=p.y*32+25;
   const image=tree?scene.add.image((p.x+.5)*32,y,`asset-${p.kind==='pine'?'pine':'tree'}-${p.variant??0}`).setOrigin(.5,256/264).setDisplaySize(166*(p.scale??1),211*(p.scale??1)).setDepth(y).setData('lake-tree',true):drawEditorProp(scene,p.kind,(p.x+.5)*32,y);
   if(image){
    if(p.kind.startsWith('tallGrass')||['fern','whiteFlowers','bush','mushrooms'].includes(p.kind)){const seed=(p.x*73+p.y*131)%101,factor=.78+(seed%20)/100;image.setScale(image.scaleX*factor,image.scaleY*factor).setPosition(image.x+(seed%9)-4,image.y+((seed*3)%9)-4).setDepth(image.y);}
    this.editorObjects.push({id:p.id,x:p.x,y:p.y,kind:p.kind,texture:image.texture.key,frame:image.frame.name});if(tree)this.trees.push(image);}
  }
  scene.add.image(29*32,38*32,'lake-rock-0').setOrigin(.5,1).setDisplaySize(110,68).setDepth(38*32-2);
  scene.add.image(29*32,38*32-12,'asset-pine-1').setOrigin(.5,256/264).setDisplaySize(90,120).setDepth(38*32);
  drawExitSign(scene,edits?.points?.exit??LAKE_CITY_EXIT,edits?.points?.entry??LAKE_CITY_ENTRY);
  drawExitSign(scene,LAKE_PROPERTY_EXIT,LAKE_PROPERTY_ENTRY);
  this.waterFX=scene.add.graphics().setDepth(-4).setData('lake-water-animation',true);
  this.objects=scene.children.list.filter(o=>!before.has(o));
 }
 private drawDeck(x:number,y:number,width:number,height:number):void {
  const r=pierArt.frames.pier,f=pierArt.frames['pier-front'];
  this.scene.add.image(x,y,'lake-pier','pier').setOrigin(0).setDisplaySize(width,height).setDepth(-3);
  this.scene.add.image(x,y+(f.y-r.y)*height/r.height,'lake-pier','pier-front').setOrigin(0).setDisplaySize(width,f.height*height/r.height).setDepth(y+height*.84);
 }
 private drawGround():void {
  const key='lake-natural-ground-v8';if(!this.scene.textures.exists(key)){
   const materials=readTerrainSprites(this.scene);if(!materials)throw Error('Terreno do lago indisponível');
   const canvas=document.createElement('canvas');canvas.width=3072;canvas.height=2304;const c=canvas.getContext('2d')!,p=c.createImageData(3072,2304);
   for(let by=0;by<2304;by+=4)for(let bx=0;bx<3072;bx+=4){
    const x=(bx+2)/32,y=(by+2)/32,d=lakeWaterDistance(x,y),trail=lakeTrailDistance(x,y),shore=Math.max(0,1-Math.abs(d)/(.78+.18*Math.sin(x*.31+y*.23)+.13*Math.sin(y*.6-x*.19))),grass=.45+.2*Math.sin(x*.2)*Math.cos(y*.19),path=d>=0?Math.max(0,Math.min(1,(1.18+.13*Math.sin(x*.43+y*.24)+.07*Math.cos(y*.8-x*.35)-trail)/.48)):0;
    for(let dy=0;dy<4;dy++)for(let dx=0;dx<4;dx++){
     const px=bx+dx,py=by+dy,at=(py*3072+px)*4,src=((py%96)*96+px%96)*4;
     for(let k=0;k<3;k++){
      let value=materials.forest.pixels[src+k]*(1-grass)+materials.grass.pixels[src+k]*grass;
      if(d<0){value=waterFinishChannel(materials.water.pixels[src+k],k,d*32);}
      else{value=value*(1-shore*.65)+materials.sand.pixels[src+k]*shore*.65;value=value*(1-path)+materials['path-dry'].pixels[src+k]*path;}
      p.data[at+k]=value;
     }p.data[at+3]=255;
    }
   }
   c.putImageData(p,0,0);this.scene.textures.addCanvas(key,canvas)!.setFilter(0);
  }this.scene.add.image(0,0,key).setOrigin(0).setDepth(-100);
 }
 update(time:number):void {
  const g=this.waterFX;g.clear();
  // Sparse ripples keep deep water calm; animated falling streaks follow the drawn cascade.
  for(let i=0;i<65;i++){
   const x=(17+(i*17.31)%63)*32,y=(25+(i*9.17)%35)*32;
   if(lakeWaterDistance(x/32,y/32)>-1.5||lakeBridge(x/32,y/32))continue;
   const phase=(time*.0002+i*.17)%1;g.lineStyle(1,0xa3d3c9,Math.sin(phase*Math.PI)*.17);g.beginPath();g.arc(x,y,7+phase*14,.2,2.7);g.strokePath();
  }
  for(let i=0;i<18;i++){const x=(48.2+(i%5)*.27)*32,y=(5.8+((time*.009+i*1.7)%12))*32;g.lineStyle(1.2,0xe8ffff,.35);g.lineBetween(x,y,x,y+8);}
 }
 destroy():void{this.objects.forEach(o=>o.destroy());}
}
