import type Phaser from 'phaser';
import type {CharacterProfile} from './types';
import {CHARACTER_DIRECTIONS, type CharacterDirection} from './character-directions';
import {CHARACTER_FRAME_WIDTH,CHARACTER_FRAME_HEIGHT,drawStyledCharacter} from './character-sprites';
import {prepareCharacterRig,drawRigSwimPose} from './character-rig';
import {resolveCharacter} from './data/characters';

export const SWIM_SPEED_FACTOR=.55;
export const SWIM_FRAMES=4;
const WATERLINE=196;

/** Swimming has its own poses; the original walk textures remain untouched. */
export class SwimmingVisual {
  private readonly key:string;
  private readonly wake:Phaser.GameObjects.Graphics;
  private elapsed=0;
  constructor(scene:Phaser.Scene,profile:CharacterProfile){
    this.key=`swim-${resolveCharacter(profile).id}`;
    if(!scene.textures.exists(this.key)){
      const atlas=document.createElement('canvas');atlas.width=CHARACTER_FRAME_WIDTH*SWIM_FRAMES;atlas.height=CHARACTER_FRAME_HEIGHT*8;
      const paint=atlas.getContext('2d')!;paint.imageSmoothingEnabled=false;
      CHARACTER_DIRECTIONS.forEach((direction,row)=>{
        const source=document.createElement('canvas');source.width=CHARACTER_FRAME_WIDTH;source.height=CHARACTER_FRAME_HEIGHT;
        drawStyledCharacter(source.getContext('2d')!,profile,direction,0);
        const rig=prepareCharacterRig(source,direction);
        for(let phase=0;phase<SWIM_FRAMES;phase++){
          paint.save();paint.translate(phase*CHARACTER_FRAME_WIDTH,row*CHARACTER_FRAME_HEIGHT);
          drawRigSwimPose(paint,rig,phase/SWIM_FRAMES,WATERLINE);paint.restore();
        }
      });
      const texture=scene.textures.addCanvas(this.key,atlas)!;
      CHARACTER_DIRECTIONS.forEach((_,row)=>{for(let phase=0;phase<SWIM_FRAMES;phase++)texture.add(row*SWIM_FRAMES+phase,0,phase*CHARACTER_FRAME_WIDTH,row*CHARACTER_FRAME_HEIGHT,CHARACTER_FRAME_WIDTH,CHARACTER_FRAME_HEIGHT);});
      texture.setFilter(0);
    }
    this.wake=scene.add.graphics().setVisible(false);
  }
  update(sprite:Phaser.GameObjects.Sprite,x:number,y:number,direction:CharacterDirection,moving:boolean,delta:number):void {
    this.elapsed+=delta*(moving?1:.45);
    const phase=Math.floor(this.elapsed*SWIM_FRAMES)%SWIM_FRAMES;
    const bob=Math.sin(this.elapsed*Math.PI*2)*.8;
    sprite.setTexture(this.key,CHARACTER_DIRECTIONS.indexOf(direction)*SWIM_FRAMES+phase).setOrigin(.5,WATERLINE/CHARACTER_FRAME_HEIGHT).setPosition(x,y+bob).setDepth(y);
    this.wake.setVisible(true).setDepth(y+.1).clear();
    const pulse=(Math.sin(this.elapsed*Math.PI*2)+1)*.5;
    this.wake.fillStyle(0x326d74,.15).fillEllipse(x,y+2,25,8);
    this.wake.lineStyle(1,0xb5ded5,.65).strokeEllipse(x,y+2,25+pulse*4,7+pulse*2);
    if(moving){
      const dx=direction.includes('left')?-1:direction.includes('right')?1:0,dy=direction.includes('up')?-1:direction.includes('down')?1:0;
      this.wake.lineStyle(1,0xb5ded5,.25).strokeEllipse(x-dx*12,y-dy*8+4,28+pulse*8,9+pulse*3);
    }
  }
  setVisible(visible:boolean):void {this.wake.setVisible(visible);}
}
