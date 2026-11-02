import type Phaser from 'phaser';
import weaponArt from '../public/assets/visual/dungeons/weapons-remake.json';
import {setupVillagePropAtlas} from './village-prop-atlas';
import {drawSwordSlash} from './dungeons/weapon-render';
import {attackSpritePose} from './dungeons/weapon-presentation';
import type {AttackEffect} from './dungeons/run';
export function preloadCampCombat(scene:Phaser.Scene):void {if(!scene.textures.exists('dungeon-weapons')&&!scene.textures.exists('dungeon-weapons-source'))scene.load.image('dungeon-weapons-source',weaponArt.file);}
export class CampCombatArt {
 private ink:Phaser.GameObjects.Graphics;
 private sword:Phaser.GameObjects.Image;
 private effect?:AttackEffect;
 constructor(scene:Phaser.Scene){if(!scene.textures.exists('dungeon-weapons'))setupVillagePropAtlas(scene,'dungeon-weapons','dungeon-weapons-source',weaponArt);this.ink=scene.add.graphics();this.sword=scene.add.image(0,0,'dungeon-weapons','sword').setVisible(false);}
 swing(effect:AttackEffect):void{this.effect={...effect};}
 update(dt:number):void{this.ink.clear();const e=this.effect;if(!e){this.sword.setVisible(false);return;}e.ttl=Math.max(0,e.ttl-dt);if(e.ttl===0){this.effect=undefined;this.sword.setVisible(false);return;}drawSwordSlash(this.ink,e,e.radius??74);this.ink.setDepth(e.y+3);const pose=attackSpritePose(e,e.radius??74,0);this.sword.setVisible(true).setPosition(pose.x,pose.y).setDisplaySize(pose.width,pose.height).setRotation(pose.angle).setAlpha(pose.alpha).setDepth(e.y+2);}
 destroy():void{this.ink.destroy();this.sword.destroy();}
}
