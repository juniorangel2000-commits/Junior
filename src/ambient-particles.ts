import type Phaser from 'phaser';
import type {ScreenLight} from './lighting-pipeline';
/** Vaga-lumes à noite e pólen na luz baixa do sol, sempre em volta da câmera
 * (docs/construcoes/ILUMINACAO.md). Os vaga-lumes também acendem uma luzinha no passe de luz.
 * Tudo é desenhado num único Graphics: nenhum objeto novo por partícula. */
interface Mote{x:number;y:number;phase:number;speed:number;size:number}
const FIREFLIES=16,POLLEN=46;
export class AmbientParticles{
 readonly graphics:Phaser.GameObjects.Graphics;
 private fireflies:Mote[]=[];private pollen:Mote[]=[];private seed=1234567;
 private glow:{x:number;y:number;power:number}[]=[];
 constructor(private scene:Phaser.Scene){this.graphics=scene.add.graphics().setDepth(4990).setData('ambient-particles',true);}
 private random(){this.seed=(Math.imul(this.seed,1664525)+1013904223)>>>0;return this.seed/4294967296;}
 private place(m:Mote,view:Phaser.Geom.Rectangle){m.x=view.x+this.random()*view.width;m.y=view.y+this.random()*view.height;}
 private keep(list:Mote[],count:number,view:Phaser.Geom.Rectangle){
  while(list.length<count){const m={x:0,y:0,phase:this.random()*Math.PI*2,speed:.6+this.random()*.8,size:this.random()};this.place(m,view);list.push(m);}
  // Quem sai da tela volta do lado oposto: a densidade fica igual enquanto você anda.
  for(const m of list){const pad=40;
   if(m.x<view.x-pad)m.x+=view.width+pad*2;else if(m.x>view.right+pad)m.x-=view.width+pad*2;
   if(m.y<view.y-pad)m.y+=view.height+pad*2;else if(m.y>view.bottom+pad)m.y-=view.height+pad*2;}
 }
 /** `fireflies` e `pollen`: força de 0 a 1, vinda da hora do dia. */
 update(seconds:number,dt:number,fireflies:number,pollen:number,visible:boolean):void{
  const g=this.graphics;g.clear();this.glow.length=0;
  if(!visible||(fireflies<.01&&pollen<.01)){g.setVisible(false);return;}
  g.setVisible(true);const view=this.scene.cameras.main.worldView;
  if(fireflies>.01){this.keep(this.fireflies,FIREFLIES,view);
   for(const f of this.fireflies){
    // Voo em curvas lentas e piscadas de 2 a 4 segundos.
    f.x+=Math.sin(seconds*.7*f.speed+f.phase)*18*dt;f.y+=Math.cos(seconds*.5*f.speed+f.phase*1.3)*12*dt-2*dt;
    const blink=Math.max(0,Math.sin(seconds*(1.6+f.size)+f.phase))**3*fireflies;if(blink<.02)continue;
    g.fillStyle(0xe8ff9a,.9*blink).fillRect(Math.round(f.x),Math.round(f.y),2,2);
    g.fillStyle(0xc6f070,.28*blink).fillCircle(f.x+1,f.y+1,3.5);
    this.glow.push({x:f.x+1,y:f.y+1,power:blink});
   }
  }
  if(pollen>.01){this.keep(this.pollen,POLLEN,view);
   for(const p of this.pollen){
    p.x+=(6+Math.sin(seconds*.4+p.phase)*7)*p.speed*dt;p.y+=Math.sin(seconds*.9*p.speed+p.phase)*5*dt+1.5*dt;
    const shimmer=(.45+.55*Math.max(0,Math.sin(seconds*1.3+p.phase*2)))*pollen;
    g.fillStyle(0xfff0c0,.55*shimmer).fillRect(Math.round(p.x),Math.round(p.y),p.size>.7?2:1,p.size>.7?2:1);
   }
  }
 }
 /** Luzinhas dos vaga-lumes em pixels da tela, para o passe de luz. */
 lights(toScreen:(x:number,y:number)=>{x:number;y:number},zoom:number):ScreenLight[]{
  return this.glow.map(f=>{const p=toScreen(f.x,f.y);return{x:p.x,y:p.y,radius:30*zoom,intensity:.75*f.power,color:[.72,1,.42]};});
 }
 contains(o:Phaser.GameObjects.GameObject){return o===this.graphics;}
 destroy(){this.graphics.destroy();this.fireflies=[];this.pollen=[];}
}
