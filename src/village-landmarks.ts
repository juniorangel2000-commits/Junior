import type Phaser from 'phaser';
import manifest from '../public/assets/visual/village/landmarks/manifest.json';
import {VILLAGE_LANDMARKS} from './data/village-landmarks';

export const LANDMARK_ATLAS='village-landmark-atlas';
export function preloadVillageLandmarks(scene:Phaser.Scene):void {
 scene.load.image('village-landmark-source',manifest.file);
}

export function drawVillageLandmarks(scene:Phaser.Scene):{update(time:number):void} {
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
 for(const p of VILLAGE_LANDMARKS){
  const x=(p.x+.5)*32,y=p.y*32+25,r=manifest.frames[p.kind],scale=Math.min(p.width/r.width,p.height/r.height);
  const image=scene.add.image(x,y,LANDMARK_ATLAS,p.kind).setOrigin(.5,1).setScale(scale).setDepth(y)
   .setData({'village-landmark':p.id,'village-landmark-kind':p.kind,'shadow-foot':1});
  if(p.kind==='fountain')fountain={x,y:y-image.displayHeight*.31,width:image.displayWidth*.66,height:image.displayHeight*.18,depth:y+.1};
  if(p.kind==='community'){
   // Small fixtures follow the same dusk lighting as the merchant facades.
   for(const dx of [-.19,.19])scene.add.zone(x+image.displayWidth*dx,y-image.displayHeight*.35,1,1).setData('fixture-light',{radius:65});
  }
 }
 const ripple=scene.add.graphics().setData('village-fountain-water',true);
 if(fountain)ripple.setDepth(fountain.depth);
 return {update(time:number){
  if(!fountain||!ripple.active)return;
  ripple.clear();
  for(let i=0;i<3;i++){
   const q=(time*.0002+i/3)%1;
   ripple.lineStyle(.7,0xb6f0ef,(1-q)*.34).strokeEllipse(fountain.x,fountain.y,fountain.width*q,fountain.height*q);
  }
 }};
}
