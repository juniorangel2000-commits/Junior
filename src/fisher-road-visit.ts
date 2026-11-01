import type Phaser from 'phaser';
import type {SaveData} from './types';
import {ensureFisherTravel} from './systems/fisher-travel';
import {damiaoTexture,DAMIAO_DISPLAY,DAMIAO_ORIGIN_Y,DAMIAO_WALK_FRAMES} from './damiao-sprites';
import {characterFrame} from './character-directions';
/** The same saved traveller is drawn on the road between the two real map portals. */
export class FisherRoadVisit {
 readonly sprite:Phaser.GameObjects.Sprite;
 constructor(scene:Phaser.Scene,private state:()=>SaveData){this.sprite=scene.add.sprite(0,0,damiaoTexture(scene),0).setOrigin(.5,DAMIAO_ORIGIN_Y).setDisplaySize(DAMIAO_DISPLAY,DAMIAO_DISPLAY);this.update();}
 update():void{const s=ensureFisherTravel(this.state());this.sprite.setVisible(s.area==='cityForest');if(this.sprite.visible)this.sprite.setPosition(s.x,s.y).setDepth(s.y).setFrame(characterFrame(s.direction,s.moving?1+Math.floor(s.distance/5.3)%8:0,DAMIAO_WALK_FRAMES));}
 destroy():void{this.sprite.destroy();}
}
