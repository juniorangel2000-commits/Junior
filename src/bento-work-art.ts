import Phaser from 'phaser';
import type {SaveData} from './types';
import type {CharacterDirection} from './character-directions';
import {BENTO_WORK} from './data/bento-work';
import {TOOL_USE_DURATION} from './systems/tool-use';
const root='assets/visual/village/bento';
const kinds=['mining','forging','handling']as const;
type Kind=typeof kinds[number];
const feet:Record<Kind,number[]>={mining:[239,236,237,237],forging:[245,244,243,243],handling:[242,242,242,242]};
export function preloadBentoWorkArt(scene:Phaser.Scene):void{
 for(const kind of kinds){const key=`bento-work-${kind}`;if(!scene.textures.exists(key))scene.load.spritesheet(key,`${root}/work-${kind}.png`,{frameWidth:256,frameHeight:256});}
 scene.load.once('complete',()=>{for(const kind of kinds)if(scene.textures.exists(`bento-work-${kind}`))scene.textures.get(`bento-work-${kind}`).setFilter(Phaser.Textures.FilterMode.NEAREST);});
}
function row(direction:CharacterDirection):number{return direction.includes('up')?1:direction.includes('down')?0:direction==='left'?3:2;}
/** Fixed per-direction foot pivots; tools never change body scale or positioning. */
export function bentoWorkPose(save:SaveData):{key:string;frame:number;originY:number}|undefined{
 const trip=save.bentoTravel?.trip,w=save.bentoWork;if(!trip||trip.moving||trip.transition)return;
 const defense=save.bentoExpedition?.defense;if(defense){const r=row(defense.direction);return{key:'bento-work-forging',frame:r*6+Math.min(5,Math.floor(defense.elapsed/.6*6)),originY:(feet.forging[r]+13)/256};}if(!w)return;
 let kind:Kind,progress:number,direction=trip.direction;
 if(trip.leg==='explore'&&w.mining?.swing?.strike){kind='mining';progress=w.mining.swing.elapsed/TOOL_USE_DURATION;direction=w.mining.swing.strike.direction;}
 else if(trip.leg==='forge'&&w.job?.phase==='carrying'&&w.job.elapsed>0){kind='forging';progress=(w.job.elapsed%.9)/.9;}
 else if((trip.leg==='unload'||trip.leg==='withdraw')&&w.handling){kind='handling';progress=w.handling.elapsed/BENTO_WORK.handlingSeconds;if(w.handling.action==='withdraw')progress=1-progress;}
 else return;
 const r=row(direction);return{key:`bento-work-${kind}`,frame:r*6+(kind==='mining'?Math.round(Math.min(8,Math.floor(progress*9+1e-8))*5/8):Math.min(5,Math.floor(progress*6))),originY:(feet[kind][r]+13)/256};
}
