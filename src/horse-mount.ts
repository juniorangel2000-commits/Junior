import type Phaser from 'phaser';
import horsePoses from './data/horse-poses.json';
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
 /** Pernas, sela e rédeas desenhadas por código, entre o cavalo e o cavaleiro. */
 readonly tack:Phaser.GameObjects.Graphics;
 private distance=0;
 constructor(scene:Phaser.Scene,x:number,y:number){
  const art=ANIMAL_ART.horse;
  this.horse=scene.add.sprite(x,y,animalTexture('horse'),animalFrame('horse','down',false,0)).setOrigin(.5,.5+art.foot/art.cell).setScale(art.scale).setDepth(y-1).setData('mount',true);
  this.tack=scene.add.graphics().setData('mount',true);
 }
 /** Atualiza o cavalo e devolve o deslocamento vertical do personagem (sentado no lombo). */
 update(x:number,y:number,direction:CharacterDirection,moved:number,galloping:boolean):number{
  this.distance+=moved;const moving=moved>1e-6;
  let frame=animalFrame('horse',direction,moving,this.distance);
  if(galloping&&moving){const list=horsePoses.Run[RUN_BY_DIRECTION[direction]];frame=list[Math.floor(this.distance/14)%list.length];}
  this.horse.setFrame(frame).setPosition(x,y).setDepth(y-.5);
  // Balanço do passo (galope balança mais): o cavaleiro sobe e desce junto com o cavalo.
  const bob=moving?Math.round(Math.abs(Math.sin(this.distance/(galloping?9:14)*Math.PI))*(galloping?2.5:1.2)):0;
  const hip=y-SADDLE[direction]-bob;this.drawTack(x,hip,direction,frame);
  return SADDLE[direction]+bob;
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
 setVisible(v:boolean){this.horse.setVisible(v);this.tack.setVisible(v);}
 destroy(){this.horse.destroy();this.tack.destroy();}
}
export {CHARACTER_DIRECTIONS};
