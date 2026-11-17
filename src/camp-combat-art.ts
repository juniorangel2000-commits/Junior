import type Phaser from 'phaser';
import weaponArt from '../public/assets/visual/dungeons/weapons-remake.json';
import {setupVillagePropAtlas} from './village-prop-atlas';
import {drawSwordSlash} from './dungeons/weapon-render';
import {attackSpritePose} from './dungeons/weapon-presentation';
import type {AttackEffect} from './dungeons/run';
import {SWORD_SLASH,SWORD_TIER_FILES} from './systems/world-sword';
export function preloadCampCombat(scene:Phaser.Scene):void {for(const [tier,file] of SWORD_TIER_FILES.entries())if(tier>0&&!scene.textures.exists(`sword-tier-${tier}`))scene.load.image(`sword-tier-${tier}`,`assets/visual/items/swords/${file}.png`);if(!scene.textures.exists('dungeon-weapons')&&!scene.textures.exists('dungeon-weapons-source'))scene.load.image('dungeon-weapons-source',weaponArt.file);}
export class CampCombatArt {
 private ink:Phaser.GameObjects.Graphics;
 private sword:Phaser.GameObjects.Image;
 private effect?:AttackEffect;
 constructor(scene:Phaser.Scene){if(!scene.textures.exists('dungeon-weapons'))setupVillagePropAtlas(scene,'dungeon-weapons','dungeon-weapons-source',weaponArt);this.ink=scene.add.graphics();this.sword=scene.add.image(0,0,'dungeon-weapons','sword').setVisible(false);}
 swing(effect:AttackEffect):void{this.effect={...effect};}
 update(dt:number):void{this.ink.clear();const e=this.effect;if(!e){this.sword.setVisible(false);return;}e.ttl=Math.max(0,e.ttl-dt);if(e.ttl===0){this.effect=undefined;this.sword.setVisible(false);return;}const tier=e.tier??0;drawSwordSlash(this.ink,e,e.radius??74,0,false,e.tier===undefined?undefined:SWORD_SLASH[tier]);this.ink.setDepth(e.y+3);const pose=attackSpritePose(e,e.radius??74,0);if(tier>0&&this.sword.scene.textures.exists(`sword-tier-${tier}`)){if(this.sword.texture.key!==`sword-tier-${tier}`)this.sword.setTexture(`sword-tier-${tier}`);}else if(this.sword.texture.key!=='dungeon-weapons')this.sword.setTexture('dungeon-weapons','sword');
  this.sword.setVisible(true).setPosition(pose.x,pose.y).setDisplaySize(pose.width,pose.height).setRotation(pose.angle).setAlpha(pose.alpha).setDepth(e.y+2);}
 destroy():void{this.ink.destroy();this.sword.destroy();}
}
