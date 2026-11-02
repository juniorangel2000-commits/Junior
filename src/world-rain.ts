import type Phaser from 'phaser';
import {weatherForDay} from './weather-model';
/** Sparse pixel rain; one reusable overlay, hidden indoors and during map captures. */
export class WorldRain {
 readonly graphics:Phaser.GameObjects.Graphics;
 private shown=true;
 private reduced=typeof matchMedia==='function'?matchMedia('(prefers-reduced-motion: reduce)'):undefined;
 constructor(private scene:Phaser.Scene){this.graphics=scene.add.graphics().setDepth(5003).setData('world-weather',true);}
 setVisible(shown:boolean):void{this.shown=shown;if(!shown)this.graphics.setVisible(false);}
 update(day:number,indoors:boolean):void {
  const rain=this.shown&&!indoors&&weatherForDay(day)==='rain';this.graphics.setVisible(rain);if(!rain)return;
  const view=this.scene.cameras.main.worldView,zoom=this.scene.cameras.main.zoom,w=view.width,h=view.height;
  this.graphics.setPosition(view.x,view.y).clear().fillStyle(0x294851,.045).fillRect(0,0,w,h);
  if(this.reduced?.matches)return;
  const seconds=this.scene.time.now/1000,count=Math.min(120,Math.max(35,Math.round(w*h*zoom*zoom/12000)));
  this.graphics.lineStyle(1/zoom,0xc7e0da,.3);
  for(let i=0;i<count;i++){
   const y=(((i*.61803398875)%1)*h+seconds*(175+(i%5)*12)/zoom)%(h+16/zoom)-8/zoom;
   const x=(((i*.38196601125)%1)*w+seconds*22/zoom)%(w+8/zoom);
   this.graphics.lineBetween(x,y,x-2/zoom,y+7/zoom);
  }
 }
 destroy():void{this.graphics.destroy();}
}
