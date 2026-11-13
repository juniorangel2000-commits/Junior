import type Phaser from 'phaser';
import {CROP_IDS} from './data/crops';
export function preloadCropArt(scene:Phaser.Scene):void{if(!scene.textures.exists('crop-planted-seed'))scene.load.image('crop-planted-seed','assets/visual/crops/planted-seed.png');for(const id of CROP_IDS)for(let stage=1;stage<=4;stage++){const key=`crop-${id}-${stage}`;if(!scene.textures.exists(key))scene.load.image(key,`assets/visual/crops/${id}/stage-${stage-1}.png`);}}
export function setupCropArt(scene:Phaser.Scene):void{scene.textures.get('crop-planted-seed').setFilter(0);for(const id of CROP_IDS)for(let stage=1;stage<=4;stage++)scene.textures.get(`crop-${id}-${stage}`).setFilter(0);}
