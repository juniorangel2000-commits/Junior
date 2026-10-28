import plazaManifest from '../public/assets/visual/village/plaza/manifest.json';
import {preloadVillagePlaza} from './village-plaza';
import type Phaser from 'phaser';
import {preloadVillageLandmarks} from './village-landmarks';
import type {TerrainSprite} from './terrain-sprites';

export const VILLAGE_SCENERY=['bench','flowerpot','planter','crates','barrel','sacks','woodpile','basket'] as const;
export const VILLAGE_LAMP={key:'village-lantern',width:20,height:80,lightY:-66} as const;
export function preloadVillageScenery(scene:Phaser.Scene):void{
 preloadVillageLandmarks(scene);
 preloadVillagePlaza(scene);
 scene.load.image('source-village-blacksmith','assets/visual/village/blacksmith-house.png');
 for(const id of ['armor-stand','tool-rack','counter','parts-shelf'])scene.load.image(`blacksmith-${id}`,`assets/visual/village/blacksmith-${id}.png`);
 for(const id of ['weapon-rack','bellows','grindstone','coal-bin','iron-stock','counter-left','counter-middle','counter-right'])scene.load.image(`blacksmith-${id}`,`assets/visual/village/blacksmith-${id}.png`);
 scene.load.image(VILLAGE_LAMP.key,'assets/visual/village/street-lamp.png');
 scene.load.image('village-paving-source',plazaManifest.floor.file);
 scene.load.image('village-path-paving-source',plazaManifest.path.file);
 for(const id of VILLAGE_SCENERY)scene.load.image(`village-prop-${id}`,`assets/visual/village/${id}.png`);
}

/** Read source art once per bake. The untouched source PNG stays available at
 * its original resolution; nearest sampling keeps the ground's pixel clusters. */
export function readVillagePaving(scene:Phaser.Scene,key='village-paving-source'):TerrainSprite|undefined{
 if(!scene.textures.exists(key))return;
 const material=key==='village-path-paving-source'?plazaManifest.path:plazaManifest.floor;
 const r=material.repeat,size=r.worldSize,canvas=document.createElement('canvas');canvas.width=canvas.height=size;
 const c=canvas.getContext('2d',{willReadFrequently:true})!;c.imageSmoothingEnabled=false;
 c.drawImage(scene.textures.get(key).getSourceImage() as HTMLImageElement,r.x,r.y,r.width,r.height,0,0,size,size);
 // Repeat an exact two-by-two unit of the interlocking pattern. Mirroring or
 // feathering a whole source sheet creates broken brick joints at its edges.
 return {size,pixels:c.getImageData(0,0,size,size).data};
}
