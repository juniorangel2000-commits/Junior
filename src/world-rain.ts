import type Phaser from 'phaser';
import {weatherForDay} from './weather-model';
/** Quantas gotas desenhar, em função da área visível em pixels de tela. */
export function rainDropCount(screenArea:number):{far:number;near:number;splashes:number}{
 const base=Math.max(0,screenArea)/2200;
 return{far:Math.round(Math.min(620,Math.max(220,base))),near:Math.round(Math.min(240,Math.max(90,base*.4))),splashes:Math.round(Math.min(70,Math.max(24,base*.25)))};
}
/** Posição pseudoaleatória estável (0–1) para cada gota, sem formar grupos. */
const spread=(n:number)=>{const v=Math.sin(n*12.9898+78.233)*43758.5453;return v-Math.floor(v);};
/** Chuva em pixel art: céu fechado, duas camadas de gotas inclinadas e respingos no chão.
 * Uma única camada reaproveitada, escondida em interiores e nas capturas de mapa. Com
 * "reduzir movimento" a chuva continua visível, só cai mais devagar. */
export class WorldRain {
 readonly graphics:Phaser.GameObjects.Graphics;
 private shown=true;
 private reduced=typeof matchMedia==='function'?matchMedia('(prefers-reduced-motion: reduce)'):undefined;
 constructor(private scene:Phaser.Scene){this.graphics=scene.add.graphics().setDepth(5003).setData('world-weather',true);}
 setVisible(shown:boolean):void{this.shown=shown;if(!shown)this.graphics.setVisible(false);}
 update(day:number,indoors:boolean):void {
  const rain=this.shown&&!indoors&&weatherForDay(day)==='rain';this.graphics.setVisible(rain);if(!rain)return;
  const camera=this.scene.cameras.main,view=camera.worldView,zoom=camera.zoom,w=view.width,h=view.height,g=this.graphics;
  g.setPosition(view.x,view.y).clear().fillStyle(0x1f3a46,.16).fillRect(0,0,w,h);
  const speed=this.reduced?.matches?.35:1,seconds=this.scene.time.now/1000*speed,px=1/zoom,counts=rainDropCount(w*h*zoom*zoom);
  const layer=(count:number,fall:number,length:number,width:number,color:number,alpha:number,seed:number)=>{
   g.lineStyle(width*px,color,alpha);
   for(let i=0;i<count;i++){
    const a=spread(i*2+seed),b=spread(i*2+1+seed*3),v=fall*(.85+((i*7)%5)*.08);
    const y=(a*(h+length*px)+seconds*v*px)%(h+length*px)-length*px;
    const x=((b*(w+40*px)-seconds*v*.22*px)%(w+40*px)+(w+40*px))%(w+40*px)-20*px;
    g.lineBetween(x,y,x-length*.22*px,y+length*px);
   }
  };
  layer(counts.far,420,9,1,0xa9c7cc,.42,0);
  layer(counts.near,640,15,1.5,0xdcefef,.6,97);
  // Respingos: anéis curtos que nascem e somem em pontos espalhados do chão.
  g.lineStyle(px,0xdcefef,.55);
  for(let i=0;i<counts.splashes;i++){
   const t=(seconds*1.6+i*.37)%1,cycle=Math.floor(seconds*1.6+i*.37);
   const x=(((i*.7548776662+cycle*.5698402910)%1))*w,y=(((i*.5698402910+cycle*.7548776662)%1))*h;
   const r=(1.5+t*4)*px;g.lineStyle(px,0xdcefef,.55*(1-t));g.strokeEllipse(x,y,r*2.4,r);
  }
 }
 destroy():void{this.graphics.destroy();}
}
