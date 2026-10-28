import type Phaser from 'phaser';
import manifest from '../public/assets/visual/village/plaza/manifest.json';
import {PLAZA_SEATS,PLAZA_BEDS} from './data/village-plaza';

export function preloadVillagePlaza(scene:Phaser.Scene):void {
 scene.load.image('village-plaza-source',manifest.file);
}

export function drawVillagePlaza(scene:Phaser.Scene):void {
 const key='village-plaza-furniture';
 if(!scene.textures.exists(key)){
  const source=scene.textures.get('village-plaza-source').getSourceImage() as HTMLImageElement;
  const canvas=document.createElement('canvas');canvas.width=source.width;canvas.height=source.height;
  const c=canvas.getContext('2d')!;c.drawImage(source,0,0);
  const pixels=c.getImageData(0,0,canvas.width,canvas.height);
  for(let i=3;i<pixels.data.length;i+=4)pixels.data[i]=pixels.data[i]>=160?255:0;
  c.putImageData(pixels,0,0);
  const texture=scene.textures.addCanvas(key,canvas)!;texture.setFilter(0);
  for(const [frame,r] of Object.entries(manifest.frames))texture.add(frame,0,r.x,r.y,r.width,r.height);
 }
 for(const p of [...PLAZA_SEATS,...PLAZA_BEDS]){
  const r=manifest.frames[p.frame],scale=Math.min(p.width/r.width,p.height/r.height),y=p.y*32+25;
  scene.add.image((p.x+.5)*32,y,key,p.frame).setOrigin(.5,1).setScale(scale).setDepth(y)
   .setData({'village-plaza-furniture':p.id,'village-plaza-facing':p.frame,'shadow-foot':1});
 }
}
