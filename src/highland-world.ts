import Phaser from 'phaser';
import type {WorldEditorObject} from './world';
import type {MapEditData} from './systems/map-editor';
import {HIGHLAND_OBJECTS,highlandObjects,highlandWaterPoint,highlandBlockedPoint,HIGHLAND_STAIRS,HIGHLAND_ART,highlandBridgePose,HIGHLAND_SIZE} from './data/highland';
import {addWaterMotion,setupWaterSurface} from './water-motion';
import {drawMapTerrainEdits} from './map-editor-terrain';
export function preloadHighland(scene:Phaser.Scene):void {
 for(const kind of ['barrel','crates','woodpile','sacks'])if(!scene.textures.exists('village-prop-'+kind))scene.load.image('village-prop-'+kind,'assets/visual/village/'+kind+'.png');
 for(const kind of ['minecart','toolstand','orepile'])if(!scene.textures.exists('highland-'+kind))scene.load.image('highland-'+kind,'assets/visual/highland/'+kind+'.png');
 if(!scene.textures.exists('highland-ground'))scene.load.image('highland-ground','assets/visual/highland/ground-detailed.png');
 if(!scene.textures.exists('highland-stairs-source'))scene.load.image('highland-stairs-source','assets/visual/fishing-lake/ridge-waterfall.png');
 for(const key of ['mine','bridge'])if(!scene.textures.exists('highland-'+key)&&!scene.textures.exists('highland-'+key+'-source'))scene.load.image('highland-'+key+'-source','assets/visual/highland/'+key+'.png');
}
export function setupHighlandArt(scene:Phaser.Scene):void {
 scene.textures.get('highland-ground').setFilter(0);
 for(const key of ['mine','bridge']){
  const id='highland-'+key;if(scene.textures.exists(id))continue;
  const src=scene.textures.get(id+'-source').getSourceImage() as HTMLImageElement,c=document.createElement('canvas'),crop=key==='bridge'?HIGHLAND_ART.bridge:HIGHLAND_ART.mine;c.width=crop.width;c.height=crop.height;
  const g=c.getContext('2d')!;g.drawImage(src,crop.x,crop.y,crop.width,crop.height,0,0,c.width,c.height);
  {const p=g.getImageData(0,0,c.width,c.height);for(let i=3;i<p.data.length;i+=4){if(p.data[i]<128)p.data[i]=0;
   if(key==='mine'){const u=((i-3)/4%c.width)/(c.width-1),r=p.data[i-3],green=p.data[i-2],b=p.data[i-1];
    // The outboard turf must not paint over the existing vertical cliff face.
    if(green>r*1.01&&green>b*1.35)p.data[i]*=Math.max(0,Math.min(1,(Math.min(u,1-u)-.12)/.06));
   }}g.putImageData(p,0,0);}
  scene.textures.addCanvas(id,c)!.setFilter(0);
 }
 if(!scene.textures.exists('highland-stairs')){
  const {sourceX,sourceY,width,height}=HIGHLAND_STAIRS,src=scene.textures.get('highland-stairs-source').getSourceImage() as HTMLImageElement;
  const c=document.createElement('canvas');c.width=width;c.height=height;const g=c.getContext('2d')!;
  g.beginPath();for(const [i,[x,y]]of [[60,0],[185,0],[204,48],[48,48]].entries())i?g.lineTo(x,y):g.moveTo(x,y);g.closePath();g.clip();
  g.drawImage(src,sourceX,sourceY,width,height,0,0,width,height);const pixels=g.getImageData(0,0,width,height);for(let y=0;y<height;y++)for(let x=0;x<width;x++){const left=60-12*y/height,right=185+19*y/height,fade=Math.max(0,Math.min(1,(y-10)/8,(x-left)/5,(right-x)/5));pixels.data[(y*width+x)*4+3]*=fade;}g.putImageData(pixels,0,0);scene.textures.addCanvas('highland-stairs',c)!.setFilter(0);
 }
 if(!scene.textures.exists('highland-bridge-front')){
  const src=scene.textures.get('highland-bridge').getSourceImage() as HTMLCanvasElement,c=document.createElement('canvas');c.width=src.width;c.height=src.height;
  const y=HIGHLAND_ART.bridge.frontY;c.getContext('2d')!.drawImage(src,0,y,src.width,src.height-y,0,y,src.width,src.height-y);scene.textures.addCanvas('highland-bridge-front',c)!.setFilter(0);
 }
}
/** Only the approaching current and crest are visible; the drop is off-map. */
function addWaterfallLip(scene:Phaser.Scene):void {
 const g=scene.add.graphics().setDepth(-79).setData('highland-waterfall-lip',true);
 const update=(time:number)=>{
  g.clear();for(let i=0;i<19;i++){
   const x=830+i*11,y=945+(time*.075+i*17)%78;
   if(!highlandWaterPoint(x,y)||!highlandWaterPoint(x,y+6))continue;
   g.lineStyle(1,0xc6e7de,.12+.1*Math.sin(time*.002+i)**2).lineBetween(x,y,x+Math.sin(i)*1.5,y+6);
  }
  for(let x=750;x<1050;x+=4)if(highlandWaterPoint(x,1018)&&highlandWaterPoint(x+4,1018)){
   const y=1017+Math.sin(x*.07+time*.004)*1.2;
   g.lineStyle(1,0xc5e6dd,.3+Math.sin(x*.1-time*.003)*.1).lineBetween(x,y,x+4,y+Math.sin(x)*.5);
  }
 };
 const cleanup=()=>{scene.events.off('update',update);scene.events.off('shutdown',cleanup);};
 g.once('destroy',cleanup);scene.events.once('shutdown',cleanup);scene.events.on('update',update);update(0);
}
export class HighlandWorld {
 readonly trees:Phaser.GameObjects.Image[]=[];
 readonly editorObjects:WorldEditorObject[]=[];
 private objects:Phaser.GameObjects.GameObject[]=[];
 constructor(scene:Phaser.Scene,readonly edits?:MapEditData){
  setupHighlandArt(scene);const before=new Set(scene.children.list);
  // The other maps combine this same static material with a 30% moving surface.
  scene.add.tileSprite(0,0,HIGHLAND_SIZE.width,HIGHLAND_SIZE.height,setupWaterSurface(scene)).setOrigin(0).setDepth(-100).setData('highland-water-base',true);
  scene.add.image(0,0,'highland-ground').setOrigin(0).setDisplaySize(HIGHLAND_SIZE.width,HIGHLAND_SIZE.height).setDepth(-70).setData('highland-ground-detail',true);
  scene.add.image(HIGHLAND_STAIRS.x,HIGHLAND_STAIRS.y,'highland-stairs').setOrigin(0).setDepth(-60).setData('highland-stairs-top',true);
  if(edits)drawMapTerrainEdits(scene,edits.terrain,'highland-ground-edits',()=>false,'forest',false);
  addWaterMotion(scene,(x,y)=>highlandWaterPoint((x+.5)*32,(y+.5)*32,edits),(x,y)=>highlandWaterPoint(x,y,edits),{width:HIGHLAND_SIZE.width,height:HIGHLAND_SIZE.height,alpha:.3});
  addWaterfallLip(scene);
  for(const o of highlandObjects(edits)){
   const image=scene.add.image(o.x,o.y,o.texture).setOrigin(.5,o.kind==='highland-bridge'||o.kind==='highland-mine'?.5:1).setDisplaySize(o.width,o.height).setRotation(o.rotation).setDepth(o.kind==='highland-bridge'?0:o.y);
   if(o.kind==='highland-bridge')scene.add.image(o.x,o.y,'highland-bridge-front').setDisplaySize(o.width,o.height).setRotation(o.rotation).setDepth((highlandBridgePose(edits)?.y??o.y)+14);
   if(o.kind==='standingTree'||o.kind==='pine')this.trees.push(image);
   this.editorObjects.push({id:o.id,kind:o.kind,x:Math.floor(o.x/32),y:Math.floor(o.y/32),texture:o.texture});
   if(o.kind==='highland-mine')scene.add.zone(o.x-o.width*.09,o.y+o.height*.10,1,1).setData('fixture-light',{radius:48,always:true});
   if(o.kind==='highland-toolstand')scene.add.zone(o.x+o.width*.37,o.y-o.height*.46,1,1).setData('fixture-light',{radius:26,always:true});
  }
  this.objects=scene.children.list.filter(o=>!before.has(o));
 }
 blockedPoint=(x:number,y:number)=>highlandBlockedPoint(x,y,this.edits);
 destroy():void{for(const o of this.objects)if(o.active)o.destroy();this.objects=[];this.trees.length=0;}
}
export const highlandTemplate=(kind:string)=>HIGHLAND_OBJECTS.find(o=>o.kind===kind);
