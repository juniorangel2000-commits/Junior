import type Phaser from 'phaser';
import manifest from '../public/assets/visual/village/pier/manifest.json';
import {VILLAGE_PIER,VILLAGE_FISHING_PROPS} from './data/village-pier';
import {setupVillagePropAtlas} from './village-prop-atlas';
export function preloadVillagePier(scene:Phaser.Scene):void{
 scene.load.image('village-pier-source',manifest.file);
}
export function drawVillagePier(scene:Phaser.Scene):void{
 const key='village-pier';setupVillagePropAtlas(scene,key,'village-pier-source',manifest);
 const p=VILLAGE_PIER,r=manifest.frames.pier,front=manifest.frames['pier-front'];
 scene.add.image(p.x,p.y,key,'pier').setOrigin(0).setDisplaySize(p.width,p.height).setDepth(-70).setData('village-pier','deck');
 scene.add.image(p.x,p.y+(front.y-r.y)*p.height/r.height,key,'pier-front').setOrigin(0)
  .setDisplaySize(p.width,front.height*p.height/r.height).setDepth(p.y+p.deckBottom+.1).setData('village-pier','front');
 for(const prop of VILLAGE_FISHING_PROPS){
  const frame=manifest.frames[prop.frame],scale=Math.min(prop.width/frame.width,prop.height/frame.height),y=prop.y*32+25;
  scene.add.image((prop.x+.5)*32,y,key,prop.frame).setOrigin(.5,1).setScale(scale).setDepth(y)
   .setData({'village-fishing-prop':prop.id,'shadow-foot':1});
 }
}
