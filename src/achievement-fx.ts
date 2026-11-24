import Phaser from 'phaser';
import {gameAudio} from './audio';
import {ACHIEVEMENT_EVENT} from './systems/missions';

/** Efeito de conquista (preview.49): som de fanfarra e, saindo do personagem, um anel dourado,
 * estrelinhas espalhadas e uma medalha que sobe e some. Vale em qualquer cena com jogador. */
type WithPlayer=Phaser.Scene&{player?:{x:number;y:number;sprite?:{depth:number}}};
const GOLD=0xf2c14e,DEEP=0xc98a1e,RED=0xb4453a,CREAM=0xfff4c9;

export function playAchievementFx(scene:Phaser.Scene,x:number,y:number):void{
 const depth=1e6,reduce=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
 // Anel que se abre a partir dos pés.
 const ring=scene.add.circle(x,y-14,6).setStrokeStyle(3,GOLD,1).setDepth(depth);
 scene.tweens.add({targets:ring,radius:58,alpha:0,duration:1000,ease:'Cubic.Out',onUpdate:()=>ring.setRadius(ring.radius),onComplete:()=>ring.destroy()});
 // Coluna de luz suave.
 const glow=scene.add.rectangle(x,y-40,26,70,CREAM,.35).setDepth(depth-1).setBlendMode(Phaser.BlendModes.ADD);
 scene.tweens.add({targets:glow,scaleX:.2,alpha:0,duration:1400,ease:'Quad.Out',onComplete:()=>glow.destroy()});
 // Estrelinhas.
 const count=reduce?6:22;
 for(let i=0;i<count;i++){
  const a=(i/count)*Math.PI*2+Math.random()*.3,dist=34+Math.random()*40,size=3+Math.random()*3;
  const star=scene.add.star(x,y-20,4,size*.45,size,i%3?GOLD:CREAM).setDepth(depth).setAngle(Math.random()*90);
  scene.tweens.add({targets:star,x:x+Math.cos(a)*dist,y:y-20+Math.sin(a)*dist*.75-10,angle:star.angle+180,alpha:0,scale:.4,duration:1100+Math.random()*600,ease:'Cubic.Out',onComplete:()=>star.destroy()});
 }
 // Medalha que sobe por cima da cabeça.
 const medal=scene.add.container(x,y-30).setDepth(depth+1).setScale(.2);
 const ribbon=scene.add.graphics();ribbon.fillStyle(RED).fillTriangle(-7,-14,-1,-14,-4,-3).fillTriangle(7,-14,1,-14,4,-3);
 const coin=scene.add.circle(0,2,8,GOLD).setStrokeStyle(2,DEEP);
 const shine=scene.add.star(0,2,5,2.4,5,CREAM);
 medal.add([ribbon,coin,shine]);
 scene.tweens.add({targets:medal,scale:1.15,y:y-62,duration:420,ease:'Back.Out'});
 scene.tweens.add({targets:medal,y:y-78,alpha:0,delay:2000,duration:600,ease:'Quad.In',onComplete:()=>medal.destroy()});
 if(!reduce)scene.tweens.add({targets:shine,angle:72,duration:900,repeat:2});
}

/** Liga o efeito ao aviso de conquista. Procura a cena ativa que tem jogador. */
export function installAchievementFx(game:Phaser.Game):void{
 if(typeof window==='undefined')return;
 window.addEventListener(ACHIEVEMENT_EVENT,e=>{
  const list=((e as CustomEvent).detail??[]) as unknown[];if(!list.length)return;
  gameAudio.play('achievement');
  const scene=game.scene.getScenes(true).find(s=>(s as WithPlayer).player) as WithPlayer|undefined;
  const p=scene?.player;if(!scene||!p)return;
  list.forEach((_,i)=>scene.time.delayedCall(i*900,()=>{const q=scene.player;if(q&&scene.sys.isActive())playAchievementFx(scene,q.x,q.y);}));
 });
}
