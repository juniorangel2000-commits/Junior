import type Phaser from 'phaser';
import manifest from '../public/assets/visual/village/landmarks/manifest.json';
import {VILLAGE_LANDMARKS,villageGazeboContains} from './data/village-landmarks';
import wheat from '../public/assets/visual/village/wheat/manifest.json';
import {setupVillagePropAtlas} from './village-prop-atlas';
import {drawVillageGazebo} from './village-gazebo';

export const LANDMARK_ATLAS='village-landmark-atlas';
export function preloadVillageLandmarks(scene:Phaser.Scene):void {
 scene.load.image('village-landmark-source',manifest.file);
 scene.load.image('village-granary-source',manifest.granaryOverride.file);
 scene.load.image('village-wheat-source',wheat.file);
}

export function drawVillageLandmarks(scene:Phaser.Scene):{update(time:number,occupant?:{x:number;y:number}):void} {
 setupVillagePropAtlas(scene,'village-wheat','village-wheat-source',wheat);
 const customAssets={
  granary:{key:'village-granary-v2',source:'village-granary-source',...manifest.granaryOverride},
 };
 for(const asset of Object.values(customAssets))if(!scene.textures.exists(asset.key)){
  const source=scene.textures.get(asset.source).getSourceImage() as HTMLImageElement;
  const r=asset.frame,canvas=document.createElement('canvas');canvas.width=r.width;canvas.height=r.height;
  const c=canvas.getContext('2d')!;c.drawImage(source,r.x,r.y,r.width,r.height,0,0,r.width,r.height);
  const pixels=c.getImageData(0,0,r.width,r.height);
  for(let i=3;i<pixels.data.length;i+=4)pixels.data[i]=pixels.data[i]>=manifest.alphaCutoff?255:0;
  c.putImageData(pixels,0,0);scene.textures.addCanvas(asset.key,canvas)!.setFilter(0);
 }
 if(!scene.textures.exists(LANDMARK_ATLAS)){
  const source=scene.textures.get('village-landmark-source').getSourceImage() as HTMLImageElement;
  const canvas=document.createElement('canvas');canvas.width=source.width;canvas.height=source.height;
  const c=canvas.getContext('2d')!;c.drawImage(source,0,0);
  const pixels=c.getImageData(0,0,canvas.width,canvas.height);
  for(let i=3;i<pixels.data.length;i+=4)pixels.data[i]=pixels.data[i]>=manifest.alphaCutoff?255:0;
  c.putImageData(pixels,0,0);
  const texture=scene.textures.addCanvas(LANDMARK_ATLAS,canvas)!;texture.setFilter(0);
  for(const [id,r] of Object.entries(manifest.frames))texture.add(id,0,r.x,r.y,r.width,r.height);
 }
 let fountain:{x:number;y:number;width:number;height:number;depth:number}|undefined;
 let gazeboRoof:Phaser.GameObjects.Image|undefined;
 for(const p of VILLAGE_LANDMARKS){
  if(p.kind==='gazebo'){gazeboRoof=drawVillageGazebo(scene,p);continue;}
  if(p.kind==='wheat'){
   const frame=p.id.endsWith('-a')?'wheat-a':'wheat-b',r=wheat.frames[frame],y=p.y*32+25;
   scene.add.image((p.x+.5)*32,y,'village-wheat',frame).setOrigin(.5,1).setScale(Math.min(p.width/r.width,p.height/r.height))
    .setDepth(y).setData({'village-landmark':p.id,'village-landmark-kind':p.kind,'shadow-foot':1});continue;
  }
  const custom=p.kind==='granary'?customAssets.granary:undefined;
  const x=(p.x+.5)*32,y=p.y*32+25,r=p.kind==='granary'?manifest.granaryOverride.frame:manifest.frames[p.kind],scale=Math.min(p.width/r.width,p.height/r.height);
  const image=scene.add.image(x,y,custom?custom.key:LANDMARK_ATLAS,custom?undefined:p.kind).setOrigin(.5,1).setScale(scale).setDepth(y)
   .setData({'village-landmark':p.id,'village-landmark-kind':p.kind,'shadow-foot':1});
  if(p.kind==='fountain')fountain={x,y:y-image.displayHeight*.31,width:image.displayWidth*.66,height:image.displayHeight*.18,depth:y+.1};
  if(p.kind==='community'){
   // Small fixtures follow the same dusk lighting as the merchant facades.
   for(const dx of [-.19,.19])scene.add.zone(x+image.displayWidth*dx,y-image.displayHeight*.35,1,1).setData('fixture-light',{radius:65});
  }
 }
 const ripple=scene.add.graphics().setData('village-fountain-water',true);
 if(fountain)ripple.setDepth(fountain.depth);
 return {update(time:number,occupant?:{x:number;y:number}){
  gazeboRoof?.setAlpha(occupant&&villageGazeboContains(occupant.x,occupant.y) ? .3 : 1);
  if(!fountain||!ripple.active)return;
  ripple.clear();
  for(let i=0;i<3;i++){
   const q=(time*.0002+i/3)%1;
   ripple.lineStyle(.7,0xb6f0ef,(1-q)*.34).strokeEllipse(fountain.x,fountain.y,fountain.width*q,fountain.height*q);
  }
 }};
}
