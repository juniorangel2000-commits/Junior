import type Phaser from 'phaser';
import manifest from '../public/assets/visual/village/defences/manifest.json';
import {VILLAGE_BARRICADES} from './data/village-defences';
import {setupVillagePropAtlas} from './village-prop-atlas';
export function preloadVillageDefences(scene:Phaser.Scene):void{
 scene.load.image('village-barricade-source',manifest.file);
}
export function drawVillageDefences(scene:Phaser.Scene):void{
 const key='village-barricades';setupVillagePropAtlas(scene,key,'village-barricade-source',manifest);
 for(const p of VILLAGE_BARRICADES){
  const frame=(p.blood?'blood-':'')+p.direction,r=manifest.frames[frame as keyof typeof manifest.frames];
  const vertical=p.direction==='east'||p.direction==='west',scale=Math.min((vertical?34:68)/r.width,54/r.height);
  const y=p.y*32+25;
  scene.add.image((p.x+.5)*32,y,key,frame).setOrigin(.5,1).setScale(scale).setDepth(y)
   .setData({'village-barricade':p.direction,'village-barricade-blood':!!p.blood,'shadow-foot':1});
 }
}
