import type Phaser from 'phaser';
import {AnimalBrain,type AnimalPoint} from './systems/animals';
import {animalSprite,setupAnimalArt} from './forest-art';
import {updateAnimalSprite} from './animal-sprites';

/** Galinhas da Rosa (preview.48): ciscam no gramado ao lado da estufa durante o dia. São dela:
 * não se prendem com a corda e não entram no sorteio. À noite ficam recolhidas. */
export const ROSA_YARD={x:34.5*32,y:57.4*32,radius:70} as const;
const HENS=3;
const dayTime=(time:number)=>time>=6*60&&time<19*60;
interface Hen{brain:AnimalBrain;sprite:Phaser.GameObjects.Sprite;shadow:Phaser.GameObjects.Ellipse}
export class VillageHens{
 private readonly hens:Hen[]=[];
 constructor(scene:Phaser.Scene,blockedPoint:(x:number,y:number)=>boolean){
  setupAnimalArt(scene);
  // Só pisam dentro do quintal: fora do raio conta como bloqueado.
  const outside=(x:number,y:number)=>Math.hypot(x-ROSA_YARD.x,y-ROSA_YARD.y)>ROSA_YARD.radius;
  const point=(x:number,y:number)=>outside(x,y)||blockedPoint(x,y);
  const tile=(tx:number,ty:number)=>point(tx*32+16,ty*32+16);
  for(let i=0;i<HENS;i++){
   const a=i/HENS*Math.PI*2,x=ROSA_YARD.x+Math.cos(a)*30,y=ROSA_YARD.y+Math.sin(a)*18;
   const brain=new AnimalBrain(`rosa-hen-${i+1}`,'chicken',x,y,false,tile,84,()=>0,point);
   const sprite=animalSprite(scene,'chicken',x,y).setData('yard-chicken',true);
   const shadow=scene.add.ellipse(x,y,14,5,0x29271d,.16);
   this.hens.push({brain,sprite,shadow});
  }
 }
 /** Pontos ocupados por uma galinha (o jogador contorna). */
 blocks(x:number,y:number):boolean{return this.hens.some(h=>h.sprite.visible&&((x-h.brain.x)/h.brain.radius)**2+((y-h.brain.y)/h.brain.footRadiusY)**2<1);}
 update(dt:number,player:AnimalPoint,time:number,inside:boolean):void{
  const show=dayTime(time)&&!inside,brains=this.hens.map(h=>h.brain);
  for(const h of this.hens){
   h.sprite.setVisible(show);h.shadow.setVisible(show);if(!show)continue;
   // Mansas: não fogem do jogador, só passeiam e ciscam pelo quintal.
   h.brain.update(dt,player,brains);
   h.shadow.setPosition(h.brain.x,h.brain.y).setDepth(h.brain.y-.2);
   if(!updateAnimalSprite(h.sprite,h.brain,dt))h.sprite.setPosition(h.brain.x,h.brain.y).setDepth(h.brain.y).setFlipX(h.brain.direction.includes('left'));
  }
 }
 destroy():void{for(const h of this.hens){h.sprite.destroy();h.shadow.destroy();}this.hens.length=0;}
}
