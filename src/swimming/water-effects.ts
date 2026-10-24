import type Phaser from 'phaser';
import {directionVector,type CharacterDirection} from '../character-directions';
import {SWIMMING_CONFIG} from './config';
/** One reused Graphics object: no particles, textures or timers allocated per frame. */
export class WaterEffects {
 readonly graphics:Phaser.GameObjects.Graphics;
 private phase=0;
 private entryAge=1;
 private previousDepth=0;
 constructor(scene:Phaser.Scene){this.graphics=scene.add.graphics().setVisible(false);}
 update(x:number,y:number,depth:number,moving:boolean,direction:CharacterDirection,speedRatio:number,delta:number):number {
  if(this.previousDepth===0&&depth>0&&delta>0)this.entryAge=0;
  this.previousDepth=depth;this.entryAge+=delta;
  this.phase+=delta*(moving?SWIMMING_CONFIG.movingRippleHz*Math.max(.25,speedRatio):SWIMMING_CONFIG.idleRippleHz);
  const wave=(Math.sin(this.phase*Math.PI*2)+1)*.5,bob=Math.sin(this.phase*Math.PI*2)*SWIMMING_CONFIG.bobAmplitude*depth;
  const g=this.graphics;g.setVisible(depth>.005).setDepth(y+.1).clear();
  if(depth<=.005)return bob;
  g.lineStyle(1,0xb5ded5,.6*depth).strokeEllipse(x,y+bob+1,20+wave*5,6+wave*2);
  if(moving){const d=directionVector(direction);g.lineStyle(1,0xb5ded5,.23*depth).strokeEllipse(x-d.x*13,y-d.y*9+3,24+wave*8,8+wave*3);g.fillStyle(0xc7e9dd,.5*depth);g.fillRect(x-11-wave*3,y-wave*3,1,1);g.fillRect(x+10+wave*2,y-1,1,1);}
  if(this.entryAge<.4){const t=this.entryAge/.4;g.lineStyle(1,0xc7e9dd,(1-t)*.65).strokeEllipse(x,y+1,10+t*26,4+t*9);g.fillStyle(0xc7e9dd,(1-t)*.5);g.fillRect(x-7-t*6,y-3-t*5,2,1);g.fillRect(x+8+t*4,y-2-t*6,1,2);}
  return bob;
 }
 hide():void {this.graphics.setVisible(false);this.previousDepth=0;}
 destroy():void {this.graphics.destroy();}
}
