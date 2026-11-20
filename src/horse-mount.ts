import type Phaser from 'phaser';
import horsePoses from './data/horse-poses.json';
import riderLift from './data/horse-rider-lift.json';
import {RIDER_ART,riderSheet,riderPose} from './data/horse-rider-art';
import {ANIMAL_ART,animalFrame,animalTexture,animalHeadOffset} from './data/animal-art';
import {CHARACTER_DIRECTIONS,type CharacterDirection} from './character-directions';
/** Montaria (docs/construcoes/MONTARIA.md): o cavalo é desenhado sob o personagem, que aparece
 * só da cintura para cima, sentado no lombo. Usa o atlas animado do cavalo. */
export const MOUNT_SPEED=1.9;
/** Altura do lombo acima dos cascos, em px do mundo, por direção (de lado o lombo é mais baixo). */
const SADDLE:Record<CharacterDirection,number>={down:60,up:30,left:27,right:27,'down-left':30,'down-right':30,'up-left':29,'up-right':29};
/** Vindo na direção da câmera, a cabeça do cavalo fica na frente do cavaleiro. */
export const HORSE_IN_FRONT:readonly CharacterDirection[]=['down'];
const RUN_DIRECTIONS=['south-west','north','west','north-east','east','south','south-east','north-west'] as const;
// Início de cada orelha no quadro frontal de 192 px. O cavalo se inclina
// durante a passada, então o recorte acompanha o quadro do próprio atlas.
const FRONT_EARS:Record<number,readonly [number,number,number,number]>={
 0:[85,52,99,52],
 1:[83,69,98,69], 2:[85,69,100,69], 3:[86,69,102,69], 4:[89,69,105,69],
 5:[89,69,104,69], 6:[90,69,104,69], 7:[85,69,103,69], 8:[84,69,100,69],
 112:[85,54,100,53], 113:[85,58,100,58], 114:[85,60,100,60], 115:[85,60,100,60],
 116:[85,60,100,60], 117:[85,61,100,61], 118:[85,60,100,60], 119:[85,60,100,60],
};
const RUN_BY_DIRECTION:Record<CharacterDirection,typeof RUN_DIRECTIONS[number]>={down:'south',up:'north',left:'west',right:'east','down-left':'south-west','down-right':'south-east','up-left':'north-west','up-right':'north-east'};
export {RIDER_ART,RIDER_ORDER,riderSheet} from './data/horse-rider-art';
export const riderTexture=(character:string)=>`horse-rider-${character}`;
export function horseTextureReady(scene:Phaser.Scene,character=''):boolean{
 return scene.textures.exists(animalTexture('horse'))&&(!RIDER_ART.includes(character)||scene.textures.exists(riderTexture(character)));
}
/** Carrega o que falta do cavalo (cenários sem animais) e o desenho montado do personagem. */
export function loadHorseTexture(scene:Phaser.Scene,done:()=>void,character=''):void{
 if(horseTextureReady(scene,character)){done();return;}
 if(!scene.textures.exists(animalTexture('horse')))scene.load.atlas(animalTexture('horse'),'assets/animals/horse/atlas-packed.png','assets/animals/horse/atlas-packed.json');
 if(RIDER_ART.includes(character)&&!scene.textures.exists(riderTexture(character))){
  const sheet=riderSheet(character);
  scene.load.spritesheet(riderTexture(character),sheet.file,{frameWidth:sheet.width,frameHeight:sheet.height});
 }
 scene.load.once('complete',done);scene.load.start();
}
export class HorseMount{
 readonly horse:Phaser.GameObjects.Sprite;
 /** Personagem desenhado montado (o sprite do jogador fica escondido enquanto monta). */
 readonly rider?:Phaser.GameObjects.Sprite;
 private readonly frontEars?:readonly [Phaser.GameObjects.Image,Phaser.GameObjects.Image];
 get combined(){return !!this.rider;}
 /** Pernas, sela e rédeas desenhadas por código, entre o cavalo e o cavaleiro. */
 readonly tack:Phaser.GameObjects.Graphics;
 private distance=0;
 constructor(scene:Phaser.Scene,x:number,y:number,private readonly character=''){
  const art=ANIMAL_ART.horse;
  this.horse=scene.add.sprite(x,y,animalTexture('horse'),animalFrame('horse','down',false,0)).setOrigin(.5,.5+art.foot/art.cell).setScale(art.scale).setDepth(y-1).setData('mount',true);
  this.tack=scene.add.graphics().setData('mount',true);
  if(RIDER_ART.includes(character)&&scene.textures.exists(riderTexture(character))){
   this.rider=scene.add.sprite(x,y,riderTexture(character),0).setData('mount',true);
   this.placeRider(x,y,'down');
   if(character==='farmer-male'){
    const newEar=()=>scene.add.image(x,y,animalTexture('horse'),0)
     .setOrigin(.5,.5+art.foot/art.cell).setScale(art.scale).setData('mount',true).setVisible(false);
    this.frontEars=[newEar(),newEar()];
   }
  }
 }
 private placeRider(x:number,y:number,direction:CharacterDirection):void{
  const sheet=riderSheet(this.character);
  const pose=riderPose(this.character,direction);
  const {cell,foot,scale}=ANIMAL_ART.horse;
  this.rider?.setFrame(pose.frame)
   .setOrigin((cell/2-pose.x)/(pose.scale*sheet.width),(cell/2+foot-pose.y)/(pose.scale*sheet.height))
   .setScale(pose.scale*scale).setPosition(x,y);
 }
 /** Atualiza o cavalo e devolve o deslocamento vertical do personagem (sentado no lombo). */
 update(x:number,y:number,direction:CharacterDirection,moved:number,galloping:boolean):number{
  this.distance+=moved;const moving=moved>1e-6;
  let frame=animalFrame('horse',direction,moving,this.distance);
  if(galloping&&moving){const list=horsePoses.Run[RUN_BY_DIRECTION[direction]];frame=list[Math.floor(this.distance/14)%list.length];}
  this.horse.setFrame(frame).setPosition(x,y).setDepth(y-.5);
  if(this.rider){
   // O lombo sobe e desce no passo e na corrida; o personagem vai junto.
   const lift=Math.max(-6,Math.min(6,(riderLift as number[])[frame]??0));
   this.placeRider(x,y-lift*ANIMAL_ART.horse.scale,direction);
   this.rider.setDepth(y);
   this.updateFrontEars(x,y,direction,frame);
   this.tack.clear();return 0;
  }
  // Balanço do passo (galope balança mais): o cavaleiro sobe e desce junto com o cavalo.
  const bob=moving?Math.round(Math.abs(Math.sin(this.distance/(galloping?9:14)*Math.PI))*(galloping?2.5:1.2)):0;
  const hip=y-SADDLE[direction]-bob;this.drawTack(x,hip,direction,frame);
  return SADDLE[direction]+bob;
 }
 private updateFrontEars(x:number,y:number,direction:CharacterDirection,frame:number):void{
  if(!this.frontEars)return;
  const region=direction==='down'?FRONT_EARS[frame]:undefined;
  for(const [i,ear] of this.frontEars.entries()){
   ear.setVisible(!!region&&this.horse.visible);
   if(region)ear.setFrame(frame).setOrigin(this.horse.originX,this.horse.originY)
    .setPosition(x,y).setDepth(y+.01).setCrop(region[i*2],region[i*2+1],10,16);
  }
 }
 /** Sela, pernas de jeans com botas caindo pela lateral e rédeas até a cabeça do cavalo. */
 private drawTack(x:number,hip:number,d:CharacterDirection,frame:number):void{
  const g=this.tack.clear(),front=d==='down',back=d==='up',side=!front&&!back,dir=d.includes('left')?-1:1;
  const jeans=0x3f5f8a,jeansDark=0x2c4566,boot=0x5a3a22,saddle=0x6b4226,saddleLight=0x8a5a34,rein=0x3b2416;
  g.setDepth(front?this.horse.depth+.2:this.horse.depth+.1);
  // Sela sob o quadril.
  if(side){g.fillStyle(saddle).fillRoundedRect(x-9,hip-2,18,6,2).fillStyle(saddleLight).fillRect(x-8,hip-2,16,1);}
  else{g.fillStyle(saddle).fillRoundedRect(x-11,hip-2,22,5,2).fillStyle(saddleLight).fillRect(x-10,hip-2,20,1);}
  // Pernas: de lado, uma perna dobrada descendo pela barriga; de frente e de costas, uma de cada lado.
  const leg=(lx:number,len:number,lean:number)=>{for(let i=0;i<len;i++){const px=Math.round(lx+lean*i/len);g.fillStyle(i%5===0?jeansDark:jeans).fillRect(px,hip+2+i,4,1);}
   const bx=Math.round(lx+lean);g.fillStyle(boot).fillRect(bx-(side?(dir>0?0:1):0),hip+2+len,side?5:4,3);};
  if(side)leg(x-2+dir*2,13,dir*2);else{leg(x-12,11,-2);leg(x+8,11,2);}
  // Rédeas: das mãos até a cabeça do cavalo (não aparecem de costas, ficam à frente do corpo).
  if(!back){const head=animalHeadOffset('horse',frame),hx=x+head.x,hy=this.horse.y+head.y+6,handY=hip-9;
   g.lineStyle(1,rein,.9);if(side){g.beginPath();g.moveTo(x+dir*5,handY);g.lineTo(hx-dir*3,hy);g.strokePath();}
   else{for(const s of [-1,1]){g.beginPath();g.moveTo(x+s*5,handY);g.lineTo(hx+s*3,hy);g.strokePath();}}}
 }
 setVisible(v:boolean){this.horse.setVisible(v);this.rider?.setVisible(v);this.tack.setVisible(v&&!this.rider);
  for(const ear of this.frontEars??[])ear.setVisible(v&&ear.isCropped&&Number(this.rider?.frame.name)===0);
 }
 destroy(){this.horse.destroy();this.rider?.destroy();this.tack.destroy();for(const ear of this.frontEars??[])ear.destroy();}
}
export {CHARACTER_DIRECTIONS};
