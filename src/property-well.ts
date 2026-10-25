import type Phaser from 'phaser';
import {PROPERTY_WELL,WELL_ROOT,WellUseCycle} from './data/property-well';

export function preloadPropertyWell(scene:Phaser.Scene):void {
 scene.load.image('property-well-idle',`${WELL_ROOT}/01_Poco_Sem_Interacao/poco_parado_256x256.png`);
 scene.load.spritesheet('property-well-use',`${WELL_ROOT}/02_Animacao_Interacao/spritesheet_8_quadros_2048x256.png`,{frameWidth:256,frameHeight:256});
}
export class PropertyWell {
 private readonly cycle=new WellUseCycle();
 readonly sprite:Phaser.GameObjects.Sprite;
 get busy():boolean {return this.cycle.busy;}
 constructor(scene:Phaser.Scene){
  this.sprite=scene.add.sprite(PROPERTY_WELL.x,PROPERTY_WELL.y,'property-well-idle').setOrigin(.5,1).setScale(PROPERTY_WELL.scale).setDepth(PROPERTY_WELL.y);
  scene.textures.get('property-well-idle').setFilter(0);scene.textures.get('property-well-use').setFilter(0);
 }
 start():boolean {if(!this.cycle.start())return false;this.sprite.setTexture('property-well-use',0);return true;}
 advance(ms:number):boolean {
  if(!this.cycle.busy)return false;
  const completed=this.cycle.advance(ms);
  if(completed)this.sprite.setTexture('property-well-idle');else this.sprite.setFrame(this.cycle.frame);
  return completed;
 }
 cancel():void {this.cycle.cancel();if(this.sprite.active)this.sprite.setTexture('property-well-idle');}
}
export function drawPropertyWell(scene:Phaser.Scene):PropertyWell|undefined {
 if(!scene.textures.exists('property-well-idle')||!scene.textures.exists('property-well-use'))return;
 return new PropertyWell(scene);
}
