import Phaser from 'phaser';
import type {SaveData} from './types';
import {worldMineMissionObjects,type MineMissionRuntime,collectMineMissionObject} from './systems/mine-missions';
import {mineSegmentClear} from './systems/underground-hazards';
import {MINE_REQUESTS,type MineMissionId} from './data/mine-missions';
export const preloadMineMissionArt=(s:Phaser.Scene)=>{if(!s.textures.exists('mine-mission-objects'))s.load.spritesheet('mine-mission-objects','assets/visual/mine/mission-objects.png',{frameWidth:512,frameHeight:512});s.load.once('complete',()=>{if(s.textures.exists('mine-mission-objects'))s.textures.get('mine-mission-objects').setFilter(Phaser.Textures.FilterMode.NEAREST);});};
export class MineMissionView{
 private sprites=new Map<MineMissionId,Phaser.GameObjects.Image>();
 constructor(private scene:Phaser.Scene,private save:()=>SaveData,private runtime:MineMissionRuntime,private enabled:()=>boolean,private message:(s:string)=>void){this.update();}
 nearest(){const s=this.save(),p=this.runtime.player(),m=s.underground;return worldMineMissionObjects(s).filter(o=>m&&Math.hypot(o.position.x-p.x,o.position.y-p.y)<=MINE_REQUESTS.interactionReach&&mineSegmentClear(m,p,o.position)).sort((a,b)=>Math.hypot(a.position.x-p.x,a.position.y-p.y)-Math.hypot(b.position.x-p.x,b.position.y-p.y))[0];}
 interact(id?:MineMissionId):boolean{if(!this.enabled())return false;const target=id??this.nearest()?.id;if(!target)return false;const result=collectMineMissionObject(this.runtime,target);if(result.message)this.message(result.message);this.update();return true;}
 update():void{
  const list=worldMineMissionObjects(this.save());for(const[id,sprite]of this.sprites)if(!list.some(o=>o.id===id))sprite.setVisible(false);
  for(const o of list){let sprite=this.sprites.get(o.id);if(!sprite){sprite=this.scene.add.image(o.position.x,o.position.y,'mine-mission-objects',o.frame+3).setOrigin(.5,.8).setDisplaySize(31,31).setData('mine-mission-object',o.id).setInteractive({useHandCursor:true});const id=o.id;sprite.on('pointerdown',(_p:unknown,_x:unknown,_y:unknown,event:Phaser.Types.Input.EventData)=>{if(this.interact(id))event.stopPropagation();});this.sprites.set(o.id,sprite);}sprite.setPosition(o.position.x,o.position.y).setDepth(o.position.y+2).setVisible(true);}
 }
 destroy():void{for(const sprite of this.sprites.values())sprite.destroy();this.sprites.clear();}
}
