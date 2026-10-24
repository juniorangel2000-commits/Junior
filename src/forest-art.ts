import Phaser from 'phaser';
import { ANIMAL_KINDS, type AnimalKind } from './data/ancient-forest';
/** Frames are cut from the new transparent atlas without rewriting its source PNG. */
export function setupAnimalArt(scene: Phaser.Scene): void {
  const texture=scene.textures.get('forest-animals-source');
  if(texture.key==='__MISSING')return;
  const source=texture.getSourceImage();
  // Authored cells have different silhouettes; use individual bounds to avoid clipping.
  const bounds = [[.015,.15,.30,.33],[.34,.14,.32,.34],[.67,.10,.32,.38],[.0,.54,.40,.36],[.39,.57,.29,.31],[.69,.51,.30,.39]];
  ANIMAL_KINDS.forEach((kind,i)=>{
    if(texture.has(kind))return;
    const [x,y,w,h]=bounds[i];
    texture.add(kind,0,Math.floor(x*source.width),Math.floor(y*source.height),Math.floor(w*source.width),Math.floor(h*source.height));
  });
  texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
}
export function animalSprite(scene:Phaser.Scene,kind:AnimalKind,x:number,y:number):Phaser.GameObjects.Sprite {
  const size=kind==='cow'?50:kind==='chicken'||kind==='rabbit'?22:40;
  const sprite=scene.add.sprite(x,y,'forest-animals-source',kind);
  return sprite.setScale(size/sprite.height).setOrigin(.5,1).setDepth(y);
}
