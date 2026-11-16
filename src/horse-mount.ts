import type Phaser from 'phaser';
import horsePoses from './data/horse-poses.json';
import {ANIMAL_ART,animalFrame,animalTexture} from './data/animal-art';
import {CHARACTER_DIRECTIONS,type CharacterDirection} from './character-directions';
/** Montaria (docs/construcoes/MONTARIA.md): o cavalo é desenhado sob o personagem, que aparece
 * só da cintura para cima, sentado no lombo. Usa o atlas animado do cavalo. */
export const MOUNT_SPEED=1.9;
/** Altura do lombo acima dos cascos, em px do mundo, por direção (de lado o lombo é mais baixo). */
const SADDLE:Record<CharacterDirection,number>={down:60,up:30,left:27,right:27,'down-left':30,'down-right':30,'up-left':29,'up-right':29};
/** Vindo na direção da câmera, a cabeça do cavalo fica na frente do cavaleiro. */
export const HORSE_IN_FRONT:readonly CharacterDirection[]=['down'];
const RUN_DIRECTIONS=['south-west','north','west','north-east','east','south','south-east','north-west'] as const;
const RUN_BY_DIRECTION:Record<CharacterDirection,typeof RUN_DIRECTIONS[number]>={down:'south',up:'north',left:'west',right:'east','down-left':'south-west','down-right':'south-east','up-left':'north-west','up-right':'north-east'};
export function horseTextureReady(scene:Phaser.Scene):boolean{return scene.textures.exists(animalTexture('horse'));}
/** Carrega o atlas do cavalo num cenário que ainda não tem (cenários sem animais). */
export function loadHorseTexture(scene:Phaser.Scene,done:()=>void):void{
 if(horseTextureReady(scene)){done();return;}
 scene.load.atlas(animalTexture('horse'),'assets/animals/horse/atlas-packed.png','assets/animals/horse/atlas-packed.json');
 scene.load.once('complete',done);scene.load.start();
}
export class HorseMount{
 readonly horse:Phaser.GameObjects.Sprite;
 private distance=0;
 constructor(scene:Phaser.Scene,x:number,y:number){
  const art=ANIMAL_ART.horse;
  this.horse=scene.add.sprite(x,y,animalTexture('horse'),animalFrame('horse','down',false,0)).setOrigin(.5,.5+art.foot/art.cell).setScale(art.scale).setDepth(y-1).setData('mount',true);
 }
 /** Atualiza o cavalo e devolve o deslocamento vertical do personagem (sentado no lombo). */
 update(x:number,y:number,direction:CharacterDirection,moved:number,galloping:boolean):number{
  this.distance+=moved;const moving=moved>1e-6;
  let frame=animalFrame('horse',direction,moving,this.distance);
  if(galloping&&moving){const list=horsePoses.Run[RUN_BY_DIRECTION[direction]];frame=list[Math.floor(this.distance/14)%list.length];}
  this.horse.setFrame(frame).setPosition(x,y).setDepth(y-.5);
  return SADDLE[direction];
 }
 setVisible(v:boolean){this.horse.setVisible(v);}
 destroy(){this.horse.destroy();}
}
export {CHARACTER_DIRECTIONS};
