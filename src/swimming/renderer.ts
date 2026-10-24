import type Phaser from 'phaser';
import type {CharacterProfile} from '../types';
import {CHARACTER_DIRECTIONS,characterFrame,type CharacterDirection} from '../character-directions';
import {CHARACTER_FRAME_WIDTH,CHARACTER_FRAME_HEIGHT,CHARACTER_TEXTURE_DENSITY,drawStyledCharacter} from '../character-sprites';
import {resolveCharacter} from '../data/characters';
import {HEAD_BOTTOM,SWIMMING_CONFIG} from './config';
import {WaterEffects} from './water-effects';
export interface SwimmingAppearance {
 cacheKey:string;
 walkFrames:number;
 width:number;height:number;density:number;
 headBottom:Record<CharacterDirection,number>;
 drawFrame(context:CanvasRenderingContext2D,direction:CharacterDirection,phase:number):void;
}
/** Reusable for official characters, configured custom actors and future swimming NPCs. */
export class SwimmingVisual {
 readonly body:Phaser.GameObjects.Sprite;
 readonly surface:Phaser.GameObjects.Sprite;
 readonly effects:WaterEffects;
 readonly appearance:SwimmingAppearance;
 private readonly surfaceKey:string;
 private readonly bodyKey:string;
 private elapsed=0;
 private bound=false;
 private baseTexture='';
 constructor(scene:Phaser.Scene,profile:CharacterProfile,appearance?:SwimmingAppearance){
  const character=resolveCharacter(profile);
  this.appearance=appearance??{cacheKey:character.id,walkFrames:character.walkFrames,width:CHARACTER_FRAME_WIDTH,height:CHARACTER_FRAME_HEIGHT,density:CHARACTER_TEXTURE_DENSITY,headBottom:HEAD_BOTTOM[character.id],drawFrame:(g,d,p)=>{drawStyledCharacter(g,profile,d,p);}};
  const a=this.appearance;this.surfaceKey=`swim-surface-${a.cacheKey}`;this.bodyKey=`swim-body-${a.cacheKey}`;
  if(!scene.textures.exists(this.surfaceKey)||!scene.textures.exists(this.bodyKey)){
   const atlas=document.createElement('canvas');atlas.width=a.width*(a.walkFrames+1);atlas.height=a.height*8;
   const paint=atlas.getContext('2d')!;paint.imageSmoothingEnabled=false;
   const bodyAtlas=document.createElement('canvas');bodyAtlas.width=atlas.width;bodyAtlas.height=atlas.height;const bodyPaint=bodyAtlas.getContext('2d')!;bodyPaint.imageSmoothingEnabled=false;
   const water=scene.textures.get('asset-ground-water').getSourceImage() as HTMLCanvasElement;
   const waterTile=document.createElement('canvas');waterTile.width=water.width*a.density;waterTile.height=water.height*a.density;
   const tilePaint=waterTile.getContext('2d')!;tilePaint.imageSmoothingEnabled=false;tilePaint.drawImage(water,0,0,waterTile.width,waterTile.height);
   for(const [row,direction] of CHARACTER_DIRECTIONS.entries())for(let phase=0;phase<=a.walkFrames;phase++){
    const mask=document.createElement('canvas');mask.width=a.width;mask.height=a.height;const g=mask.getContext('2d')!;g.imageSmoothingEnabled=false;
    g.fillStyle=g.createPattern(waterTile,'repeat')!;g.fillRect(0,0,a.width,a.height);g.globalCompositeOperation='destination-in';
    const original=document.createElement('canvas');original.width=a.width;original.height=a.height;a.drawFrame(original.getContext('2d')!,direction,phase);g.drawImage(original,0,0);
    paint.drawImage(mask,phase*a.width,row*a.height);
    const ink=original.getContext('2d')!;ink.globalCompositeOperation='source-in';ink.fillStyle=`#${SWIMMING_CONFIG.bodyTint.toString(16).padStart(6,'0')}`;ink.fillRect(0,0,a.width,a.height);bodyPaint.drawImage(original,phase*a.width,row*a.height);
   }
   const texture=scene.textures.addCanvas(this.surfaceKey,atlas)!;for(const [row] of CHARACTER_DIRECTIONS.entries())for(let phase=0;phase<=a.walkFrames;phase++)texture.add(row*(a.walkFrames+1)+phase,0,phase*a.width,row*a.height,a.width,a.height);texture.setFilter(0);
   const bodyTexture=scene.textures.addCanvas(this.bodyKey,bodyAtlas)!;for(const [row] of CHARACTER_DIRECTIONS.entries())for(let phase=0;phase<=a.walkFrames;phase++)bodyTexture.add(row*(a.walkFrames+1)+phase,0,phase*a.width,row*a.height,a.width,a.height);bodyTexture.setFilter(0);
  }
  this.body=scene.add.sprite(0,0,this.bodyKey).setVisible(false).setAlpha(SWIMMING_CONFIG.bodyOpacity);
  this.surface=scene.add.sprite(0,0,this.surfaceKey).setVisible(false).setAlpha(SWIMMING_CONFIG.surfaceOpacity);
  this.effects=new WaterEffects(scene);
 }
 update(sprite:Phaser.GameObjects.Sprite,x:number,y:number,direction:CharacterDirection,moving:boolean,delta:number,depth=1,walkingFrame?:number,speedRatio:number=SWIMMING_CONFIG.speedFactor):void {
  if(!this.bound){this.baseTexture=sprite.texture.key;sprite.once('destroy',()=>this.destroy());this.bound=true;}
  this.elapsed+=delta;
  const a=this.appearance,deep=depth>=SWIMMING_CONFIG.deepThreshold;
  const phase=moving?Math.floor(this.elapsed*.65*a.walkFrames)%a.walkFrames+1:0;
  const frame=characterFrame(direction,phase,a.walkFrames),headFrame=deep?characterFrame(direction,0,a.walkFrames):walkingFrame??characterFrame(direction,0,a.walkFrames);
  const bottom=Math.round(a.height+(a.headBottom[direction]-a.height)*depth),bob=this.effects.update(x,y,depth,moving,direction,speedRatio,delta);
  sprite.setTexture(this.baseTexture,headFrame).setCrop(0,0,a.width,bottom).setOrigin(.5,bottom/a.height).setPosition(x,y+bob).setDepth(y);
  this.body.setFrame(frame).setScale(sprite.scaleX,sprite.scaleY).setCrop(0,bottom,a.width,a.height-bottom).setOrigin(.5,bottom/a.height).setPosition(x,y+bob).setDepth(y-.2).setAlpha(SWIMMING_CONFIG.bodyOpacity*(.8+.2*depth)).setVisible(true);
  this.surface.setFrame(frame).setScale(sprite.scaleX,sprite.scaleY).setCrop(0,bottom,a.width,a.height-bottom).setOrigin(.5,bottom/a.height).setPosition(x,y+bob).setDepth(y-.1).setVisible(true);
 }
 setVisible(visible:boolean):void {this.body.setVisible(visible);this.surface.setVisible(visible);if(!visible)this.effects.hide();}
 destroy():void {this.body.destroy();this.surface.destroy();this.effects.destroy();}
}
