import type Phaser from 'phaser';
import manifest from '../public/assets/visual/village/lived-in/props.json';
import {VILLAGE_DRESSING} from './data/village-dressing';
import {setupVillagePropAtlas} from './village-prop-atlas';
import type {MapEditData} from './systems/map-editor';

export function preloadVillageDressing(scene:Phaser.Scene):void{
 scene.load.image('village-dressing-source',manifest.file);
}
export function drawVillageDressing(scene:Phaser.Scene,edits?:MapEditData):void{
 setupVillagePropAtlas(scene,'village-dressing','village-dressing-source',manifest);
 for(const p of VILLAGE_DRESSING){
  // Respect manually painted terrain rather than putting a fixed prop on water.
  if(edits?.terrain[`${Math.floor(p.x+.5)},${Math.floor(p.y+.5)}`]==='water')continue;
  const r=manifest.frames[p.frame],y=p.y*32+25;
  scene.add.image((p.x+.5)*32,y,'village-dressing',p.frame).setOrigin(.5,1)
   .setScale(Math.min(p.width/r.width,p.height/r.height)).setDepth(y)
   .setData({'village-dressing':p.id,'village-dressing-owner':p.owner,'shadow-foot':1});
 }
}
