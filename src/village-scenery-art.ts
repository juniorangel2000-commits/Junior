import type Phaser from 'phaser';
import {preloadVillageLandmarks} from './village-landmarks';
import type {TerrainSprite} from './terrain-sprites';

export const VILLAGE_SCENERY=['bench','flowerpot','planter','crates','barrel','sacks','woodpile','basket'] as const;
export const VILLAGE_LAMP={key:'village-lantern',width:20,height:80,lightY:-66} as const;
export function preloadVillageScenery(scene:Phaser.Scene):void{
 preloadVillageLandmarks(scene);
 scene.load.image('source-village-blacksmith','assets/visual/village/blacksmith-house.png');
 for(const id of ['armor-stand','tool-rack','counter','parts-shelf'])scene.load.image(`blacksmith-${id}`,`assets/visual/village/blacksmith-${id}.png`);
 for(const id of ['weapon-rack','bellows','grindstone','coal-bin','iron-stock','counter-left','counter-middle','counter-right'])scene.load.image(`blacksmith-${id}`,`assets/visual/village/blacksmith-${id}.png`);
 scene.load.image(VILLAGE_LAMP.key,'assets/visual/village/street-lamp.png');
 scene.load.image('village-paving-source','assets/visual/village/paving.png');
 for(const id of VILLAGE_SCENERY)scene.load.image(`village-prop-${id}`,`assets/visual/village/${id}.png`);
}

/** Read source art once per bake. The untouched source PNG stays available at
 * its original resolution; nearest sampling keeps the ground's pixel clusters. */
export function readVillagePaving(scene:Phaser.Scene):TerrainSprite|undefined{
 if(!scene.textures.exists('village-paving-source'))return;
 const canvas=document.createElement('canvas');canvas.width=canvas.height=256;
 const c=canvas.getContext('2d',{willReadFrequently:true})!;c.imageSmoothingEnabled=false;
 c.drawImage(scene.textures.get('village-paving-source').getSourceImage() as HTMLImageElement,0,0,256,256);
 const image=c.getImageData(0,0,256,256),source=image.data.slice();
 // The equal outer edge pairs remove a one-pixel seam at fractional zoom.
 for(let y=0;y<256;y++)for(let x=0;x<256;x++){
  const wx=Math.max(0,1-Math.min(x,255-x)/8)*.5,wy=Math.max(0,1-Math.min(y,255-y)/8)*.5;
  const at=(y*256+x)*4,ix=(y*256+255-x)*4,iy=((255-y)*256+x)*4,xy=((255-y)*256+255-x)*4;
  for(let channel=0;channel<3;channel++)image.data[at+channel]=(source[at+channel]*(1-wx)+source[ix+channel]*wx)*(1-wy)+(source[iy+channel]*(1-wx)+source[xy+channel]*wx)*wy;
  image.data[at+3]=255;
 }
 return {size:256,pixels:image.data};
}
