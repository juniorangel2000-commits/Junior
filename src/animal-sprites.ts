import type Phaser from 'phaser';
import type {AnimalKind} from './data/ancient-forest';
import {ANIMAL_ART,animalFrame,animalTexture,animatedAnimal,animalHeadOffset,type AnimatedAnimalKind} from './data/animal-art';
import type {AnimalBrain} from './systems/animals';
import {AnimalWalkCycle} from './systems/animal-animation';

const walkCycles=new WeakMap<Phaser.GameObjects.Sprite,AnimalWalkCycle>();

export function preloadAnimalSprites(scene:Phaser.Scene):void {
  for(const kind of Object.keys(ANIMAL_ART) as AnimatedAnimalKind[]){
    const cell=ANIMAL_ART[kind].cell;
    scene.load.spritesheet(animalTexture(kind),`assets/animals/${kind}/atlas.png`,{frameWidth:cell,frameHeight:cell});
  }
}
export function createAnimalSprite(scene:Phaser.Scene,kind:AnimalKind,x:number,y:number):Phaser.GameObjects.Sprite|undefined {
  if(!animatedAnimal(kind)||!scene.textures.exists(animalTexture(kind)))return;
  const art=ANIMAL_ART[kind];
  const sprite=scene.add.sprite(x,y,animalTexture(kind),animalFrame(kind,'down',false,0))
    .setOrigin(.5,.5+art.foot/art.cell).setScale(art.scale).setDepth(y);
  walkCycles.set(sprite,new AnimalWalkCycle(kind));return sprite;
}
export function updateAnimalSprite(sprite:Phaser.GameObjects.Sprite,brain:AnimalBrain,delta:number):boolean {
  if(!animatedAnimal(brain.kind)||sprite.texture.key!==animalTexture(brain.kind))return false;
  const cycle=walkCycles.get(sprite)!;cycle.advance(delta,brain.moving,brain.distanceMoved);
  sprite.setFlipX(false).setFrame(cycle.frame(brain.direction))
    .setPosition(brain.x,brain.y).setDepth(brain.y);
  return true;
}
export function animalRopeAnchor(sprite:Phaser.GameObjects.Sprite,brain:AnimalBrain):{x:number;y:number} {
  if(animatedAnimal(brain.kind)&&sprite.texture.key===animalTexture(brain.kind)){
    const offset=animalHeadOffset(brain.kind,Number(sprite.frame.name));
    return {x:sprite.x+offset.x,y:sprite.y+offset.y};
  }
  // The remaining species currently use right-facing static art, flipped on the left.
  const headX=brain.kind==='rabbit'?.25:.28,headY=brain.kind==='rabbit'?.5:.66;
  return {x:sprite.x+(sprite.flipX?-1:1)*sprite.displayWidth*headX,y:sprite.y-sprite.displayHeight*headY};
}
