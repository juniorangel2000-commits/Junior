import type Phaser from 'phaser';
import {CROP_IDS} from './data/crops';
export function preloadCropArt(scene:Phaser.Scene):void{for(const id of CROP_IDS)for(let stage=0;stage<4;stage++){const key=`crop-${id}-${stage}`;if(!scene.textures.exists(key))scene.load.image(key,`assets/visual/crops/${id}/stage-${stage}.png`);}}
export function setupCropArt(scene:Phaser.Scene):void{for(const id of CROP_IDS)for(let stage=0;stage<4;stage++)scene.textures.get(`crop-${id}-${stage}`).setFilter(0);}
