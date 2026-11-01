import type Phaser from 'phaser';
import type {BuildingData} from './types';
import plaza from '../public/assets/visual/village/plaza/manifest.json';
export const BENCH_VIEWS=['south','west','north','east'] as const;
/** Reuse the detailed village bench artwork; roots and the existing one-cell footprint stay fixed. */
export function setupWoodworkArt(scene:Phaser.Scene):void {
 const source=scene.textures.get('village-plaza-source').getSourceImage() as HTMLImageElement;
 for(const [rotation,frame] of BENCH_VIEWS.entries()){
  const key='woodwork-bench-'+rotation;if(scene.textures.exists(key))continue;
  const r=plaza.frames[frame],vertical=rotation%2===1;
  const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;
  const c=canvas.getContext('2d')!;c.imageSmoothingEnabled=false;
  const w=vertical?23:32,h=vertical?32:frame==='north'?18:22;
  c.drawImage(source,r.x,r.y,r.width,r.height,(32-w)*2,128-h*4,w*4,h*4);
  const pixels=c.getImageData(0,0,128,128);for(let i=3;i<pixels.data.length;i+=4)pixels.data[i]=pixels.data[i]>=160?255:0;c.putImageData(pixels,0,0);
  scene.textures.addCanvas(key,canvas)?.setFilter(0);
 }
 // Compatibility thumbnails use the same new art as the placed objects.
 for(const [key,sourceKey] of [['bench','woodwork-bench-0'],['fence','fence-new-10']] as const){
  if(scene.textures.exists(key))continue;
  const canvas=document.createElement('canvas');canvas.width=32;canvas.height=32;const c=canvas.getContext('2d')!;c.imageSmoothingEnabled=false;
  const image=scene.textures.get(sourceKey).getSourceImage() as HTMLCanvasElement;
  if(key==='bench')c.drawImage(image,0,0,32,32);else c.drawImage(image,0,96,256,256,0,0,32,32);
  scene.textures.addCanvas(key,canvas)?.setFilter(0);
 }
}
export function drawCraftedBench(scene:Phaser.Scene,piece:BuildingData):Phaser.GameObjects.Sprite {
 return scene.add.sprite(piece.x*32+16,piece.y*32+29,'woodwork-bench-'+(piece.rotation??0)).setScale(.25).setOrigin(.5,1).setDepth(piece.y*32+30).setData('crafted-bench',true);
}
