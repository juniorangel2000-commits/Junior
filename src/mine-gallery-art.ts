import type Phaser from 'phaser';
import props from '../public/assets/visual/mine/gallery-props.json';
export type MinePropKind=keyof typeof props.frames;
export function preloadMineGalleryArt(scene:Phaser.Scene):void{if(!scene.textures.exists('mine-gallery-props'))scene.load.image('mine-gallery-props',props.file);}
/** Register tight alpha bounds so display size and collision share the visible foot. */
export function minePropFrame(scene:Phaser.Scene,kind:MinePropKind){
 const f=props.frames[kind],b=f.bounds,texture=scene.textures.get('mine-gallery-props');
 if(!texture.has(kind))texture.add(kind,0,f.x+b[0],f.y+b[1],b[2]-b[0],b[3]-b[1]);
 texture.setFilter(0);return{key:'mine-gallery-props',frame:kind};
}
