import type Phaser from 'phaser';
import type {SaveData} from './types';
import {gameMinute} from './systems/economy';
const cache=new WeakMap<Phaser.Scene,{body:Phaser.GameObjects.Graphics;light:Phaser.GameObjects.Graphics}>();
const forgeViews=new WeakMap<Phaser.Scene,Map<string,Phaser.GameObjects.Image>>();
/** Fixtures are saved independently of the terrain; pumps water nearby planted beds. */
export function updateVillageEquipment(scene:Phaser.Scene,s:SaveData,player:{x:number;y:number}):void{
 let view=cache.get(scene);if(!view?.body.active){view={body:scene.add.graphics().setDepth(30),light:scene.add.graphics().setDepth(4999)};cache.set(scene,view);}
 view.body.clear();view.light.clear();const night=s.time<360||s.time>1140;
 const glow=(x:number,y:number)=>{if(!night)return;for(let r=5;r>0;r--)view!.light.fillStyle(0xffdc95,.025).fillCircle(x,y,r*18);};
 if(s.inventory.lantern>0)glow(player.x,player.y-20);
 if(s.activeArea==='forest'||s.activeArea==='village')return;
 let forges=forgeViews.get(scene);if(!forges){forges=new Map();forgeViews.set(scene,forges);}
 const live=new Set<string>();
 const burning=s.economy6?.orders.some(o=>o.station==='own'&&o.phase==='working'&&gameMinute(s)<o.readyAt)??false;
 for(const f of s.villageInstallations??[]){const x=f.x*32+16,y=f.y*32+28;
 if(f.kind==='forge'){
   const id=`${f.x},${f.y}`;live.add(id);let sprite=forges.get(id);
   if(!sprite?.active){sprite=scene.add.image(x,y,'economy-forge-0').setOrigin(.5,1).setDisplaySize(72,72).setDepth(y);forges.set(id,sprite);}
   sprite.setTexture(`economy-forge-${burning?1+Math.floor(scene.time.now/150)%3:0}`).setDisplaySize(72,72);
   if(burning)glow(x,y-15);
 }else{view.body.fillStyle(0x64442e).fillRect(x-3,y-38,6,38);if(f.kind==='lamp'){view.body.fillStyle(0xe7c875).fillRect(x-7,y-46,14,15);glow(x,y-40);}else{view.body.fillStyle(0x667e7c).fillRect(x-12,y-21,24,21);view.body.lineStyle(3,0xb4c2a1).strokeCircle(x,y-14,7);for(const crop of s.crops)if(Math.hypot(crop.x-f.x,crop.y-f.y)<=3)crop.watered=true;}}}
 for(const [id,sprite]of forges)if(!live.has(id)){sprite.destroy();forges.delete(id);}
 for(const [n,id]of(s.villageSurvivors??[]).entries()){const x=990+n*55,y=630;view.body.fillStyle(id==='marina'?0x647dab:0x8f6348).fillRoundedRect(x-8,y-24,16,23,3);view.body.fillStyle(0xe4b88b).fillCircle(x,y-32,7);}
}
