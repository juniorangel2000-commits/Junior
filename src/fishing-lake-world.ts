import {lakeSurfaceMotion,lakeCascadeMotion,lakeImpactMotion,LAKE_CASCADE} from './data/lake-water-motion';
import {FISHER_CABIN} from './data/fisher-cabin';
import {lakeFishShadows} from './data/lake-fish';
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
import {LAKE_RIDGE,LAKE_SIDE_RIDGES,LAKE_SIDE_CROP,LAKE_PIER,LAKE_BRIDGE,lakeObjects,lakeLowVegetationClear,lakeSandWeight,lakeStairPathBlend,lakeWater,lakeWaterDistance,lakeTrailDistance,lakeTrailHalfWidth,LAKE_CITY_ENTRY,LAKE_CITY_EXIT,LAKE_PROPERTY_ENTRY,LAKE_PROPERTY_EXIT} from './data/fishing-lake';
import {drawExitSign} from './exit-signs';
export function preloadFishingLake(scene:Phaser.Scene):void{
 if(!scene.textures.exists(FISHER_CABIN.texture))scene.load.image(FISHER_CABIN.texture,FISHER_CABIN.file);
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
 private fishFX:Phaser.GameObjects.Graphics;
 constructor(private scene:Phaser.Scene,private readonly edits?:MapEditData,namespace='fishing-lake'){
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
  this.drawCabin();
  const bridge=LAKE_BRIDGE;this.drawDeck(bridge.x*32,bridge.y*32,bridge.width*32,bridge.height*32);
  for(const [frame,x,y,w,h]of [['crate',79.5,44,44,34],['anchor',80.5,43.5,44,42]] as const)scene.add.image(x*32,y*32,'lake-pier',frame).setOrigin(.5,1).setDisplaySize(w,h).setDepth(y*32);
  // Small lookout bench remains on the terrace, away from the stairs.
  scene.add.image(28*32,5*32,'woodwork-bench-0').setOrigin(.5,1).setScale(.4).setDepth(5*32);
  for(const p of lakeObjects(edits)){
   if((p.kind.startsWith('tallGrass')||['fern','whiteFlowers','bush','mushrooms'].includes(p.kind))&&!lakeLowVegetationClear(p.x,p.y,edits,p.scale??1))continue;
   const tree=p.kind==='standingTree'||p.kind==='pine',y=p.y*32+25;
   const image=tree?scene.add.image((p.x+.5)*32,y,`asset-${p.kind==='pine'?'pine':'tree'}-${p.variant??0}`).setOrigin(.5,256/264).setDisplaySize(166*(p.scale??1),211*(p.scale??1)).setDepth(y).setData('lake-tree',true):drawEditorProp(scene,p.kind,(p.x+.5)*32,y);
   if(image){
    if(p.kind.startsWith('tallGrass')||['fern','whiteFlowers','bush','mushrooms'].includes(p.kind)){const seed=(p.x*73+p.y*131)%101,factor=(.78+(seed%20)/100)*(p.scale??1);image.setScale(image.scaleX*factor,image.scaleY*factor).setPosition(image.x+(seed%9)-4,image.y+((seed*3)%9)-4).setDepth(image.y);}
    this.editorObjects.push({id:p.id,x:p.x,y:p.y,kind:p.kind,texture:image.texture.key,frame:image.frame.name});if(tree)this.trees.push(image);}
  }
  scene.add.image(29*32,38*32,'lake-rock-0').setOrigin(.5,1).setDisplaySize(110,68).setDepth(38*32-2);
  scene.add.image(29*32,38*32-12,'asset-pine-1').setOrigin(.5,256/264).setDisplaySize(90,120).setDepth(38*32);
  drawExitSign(scene,edits?.points?.exit??LAKE_CITY_EXIT,edits?.points?.entry??LAKE_CITY_ENTRY);
  drawExitSign(scene,LAKE_PROPERTY_EXIT,LAKE_PROPERTY_ENTRY);
  this.fishFX=scene.add.graphics().setDepth(-8).setData('lake-fish-shadows',true);
  this.waterFX=scene.add.graphics().setDepth(-4).setData('lake-water-animation',true);
  this.objects=scene.children.list.filter(o=>!before.has(o));this.update(0);
 }
 private drawCabin():void {
  const p=FISHER_CABIN;this.scene.add.image(p.x,p.y,p.texture).setOrigin(0).setScale(p.scale).setDepth(p.y+750*p.scale).setData('lake-landmark','fisher-cabin');
  const key=p.texture+'-rails';
  if(!this.scene.textures.exists(key)){
   const source=this.scene.textures.get(p.texture).getSourceImage() as HTMLImageElement,canvas=document.createElement('canvas');canvas.width=1448;canvas.height=1086;const c=canvas.getContext('2d')!;
   for(const polygon of [[[135,565],[515,670],[515,835],[135,735]],[[690,735],[830,780],[1320,610],[1350,760],[835,922],[690,870]]]){c.save();c.beginPath();polygon.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.clip();c.drawImage(source,0,0);c.restore();}
   this.scene.textures.addCanvas(key,canvas)!.setFilter(0);
  }
  this.scene.add.image(p.x,p.y,key).setOrigin(0).setScale(p.scale).setDepth(p.y+900*p.scale);
 }
 private drawDeck(x:number,y:number,width:number,height:number):void {
  const r=pierArt.frames.pier,f=pierArt.frames['pier-front'];
  this.scene.add.image(x,y,'lake-pier','pier').setOrigin(0).setDisplaySize(width,height).setDepth(-3);
  this.scene.add.image(x,y+(f.y-r.y)*height/r.height,'lake-pier','pier-front').setOrigin(0).setDisplaySize(width,f.height*height/r.height).setDepth(y+height*.84);
 }
 private drawGround():void {
  const key='lake-natural-ground-v18';if(!this.scene.textures.exists(key)){
   const materials=readTerrainSprites(this.scene);if(!materials)throw Error('Terreno do lago indisponível');
   const canvas=document.createElement('canvas');canvas.width=3072;canvas.height=2304;const c=canvas.getContext('2d')!,p=c.createImageData(3072,2304);
   for(let by=0;by<2304;by+=4)for(let bx=0;bx<3072;bx+=4){
    const x=(bx+2)/32,y=(by+2)/32,d=lakeWaterDistance(x,y),trail=lakeTrailDistance(x,y),shore=Math.max(0,1-Math.abs(d)/(.78+.18*Math.sin(x*.31+y*.23)+.13*Math.sin(y*.6-x*.19))),grass=.45+.2*Math.sin(x*.2)*Math.cos(y*.19),path=d>=0?Math.max(0,Math.min(1,(lakeTrailHalfWidth(x,y,trail)-trail)/.48)):0;
    const sand=lakeSandWeight(x,y),stair=lakeStairPathBlend(x,y);
    for(let dy=0;dy<4;dy++)for(let dx=0;dx<4;dx++){
     const px=bx+dx,py=by+dy,at=(py*3072+px)*4,src=((py%96)*96+px%96)*4;
     for(let k=0;k<3;k++){
      let value=materials.forest.pixels[src+k]*(1-grass)+materials.grass.pixels[src+k]*grass;
      if(d<0){value=waterFinishChannel(materials.water.pixels[src+k],k,d*32);}
      else{const bank=Math.max(shore*.65,sand*.88);value=value*(1-bank)+materials.sand.pixels[src+k]*bank;
       const original=materials['path-dry'].pixels[src+k],matched=[166,144,88][k]+(original-[187,148,94][k])*.7,pathColour=original*(1-stair)+matched*stair;
       value=value*(1-path)+pathColour*path;}
      p.data[at+k]=value;
     }p.data[at+3]=255;
    }
   }
   c.putImageData(p,0,0);this.scene.textures.addCanvas(key,canvas)!.setFilter(0);
  }this.scene.add.image(0,0,key).setOrigin(0).setDepth(-100);
 }
 update(time:number):void {
  const fish=this.fishFX;fish.clear();
  for(const p of lakeFishShadows(time,this.edits)){
   const s=p.size;fish.save();fish.translateCanvas(p.x,p.y);fish.rotateCanvas(p.angle);fish.fillStyle(0x0a3034,p.alpha);
   fish.fillEllipse(0,0,15*s,5.5*s);fish.fillTriangle(-5*s,0,-12*s,-4*s,-12*s,4*s);fish.fillTriangle(0,0,1*s,-4*s,4*s,0);fish.restore();
  }
  const g=this.waterFX;g.clear();
  // Transparent flow, highlights and spray preserve every pixel of the approved base art.
  for(const p of lakeSurfaceMotion(time,this.edits)){
   g.lineStyle(1,0xb1ddd2,p.alpha);g.beginPath();
   for(let j=0;j<=6;j++){const x=(j/6-.5)*p.radius*2,y=Math.sin(j/6*Math.PI)*2+x*p.lean;j?g.lineTo(p.x+x,p.y+y):g.moveTo(p.x+x,p.y+y);}g.strokePath();
   g.lineStyle(1,0x123e46,p.alpha*.45);g.lineBetween(p.x-p.radius*.6,p.y+4,p.x+p.radius*.25,p.y+4.5);
  }
  for(const p of lakeCascadeMotion(time)){g.lineStyle(p.width,0xe5ffff,p.alpha);g.lineBetween(p.x,p.y,p.x+Math.sin(p.y*.04)*1.5,Math.min(LAKE_CASCADE.bottom,p.y+p.length));}
  for(let i=0;i<7;i++){
   const phase=((time*.00055+i/7)%1),x=LAKE_CASCADE.x+Math.sin(i*2.4)*9,y=LAKE_CASCADE.bottom+14+phase*14;
   g.lineStyle(1,0xd5f8ef,(1-phase)*.28);g.strokeEllipse(x,y,22+phase*115,5+phase*26);
  }
  for(const p of lakeImpactMotion(time)){g.fillStyle(0xeafff8,p.alpha);g.fillEllipse(p.x,p.y,p.radius*2,p.radius);}

 }
 destroy():void{this.objects.forEach(o=>o.destroy());}
}
