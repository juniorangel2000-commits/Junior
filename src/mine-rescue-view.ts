import Phaser from 'phaser';
import type {SaveData} from './types';
import {resolveCharacter} from './data/characters';
const KEY='mine-rescue-rest';
export function preloadMineRescue(scene:Phaser.Scene):void{if(!scene.textures.exists(KEY))scene.load.image(KEY,'assets/visual/characters/mine-rescue-rest.png');}
/** Authored sleeping/seated poses, with fixed atlas cuts; the player's own bed stays underneath. */
export class MineRescueView {
 readonly sprite:Phaser.GameObjects.Image;
 private bed:NonNullable<SaveData['home']>['furniture'][number];
 constructor(scene:Phaser.Scene,save:SaveData){
  this.bed=save.home!.furniture.find(f=>f.id===save.mineRescue!.bedId)!;
  const texture=scene.textures.get(KEY);
  const cuts=[[236,112,169,366],[858,105,171,373],[218,788,193,403],[845,774,195,417]];
  cuts.forEach(([x,y,w,h],i)=>{if(!texture.has(String(i)))texture.add(i,0,x,y,w,h);});texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
  const male=resolveCharacter(save.profile).id==='farmer-male';
  this.sprite=scene.add.image((this.bed.x+1)*32,this.bed.y*32+16,KEY,male?1:0).setDisplaySize(25,52).setDepth((this.bed.y+2)*32).setData('mine-rescue-pose',true);
 }
 wake():void{const male=Number(this.sprite.frame.name)===1;this.sprite.setFrame(male?3:2).setDisplaySize(28,58).setY(this.bed.y*32+23);}
 destroy():void{this.sprite.destroy();}
}
