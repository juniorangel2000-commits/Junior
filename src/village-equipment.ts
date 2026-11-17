import type Phaser from 'phaser';
import type {SaveData} from './types';
import {gameMinute} from './systems/economy';
const cache=new WeakMap<Phaser.Scene,{body:Phaser.GameObjects.Graphics;fixtures:Map<string,Phaser.GameObjects.Zone>}>();
const forgeViews=new WeakMap<Phaser.Scene,Map<string,Phaser.GameObjects.Image>>();
/** Aspersor automático (o item `waterPump`): gira sempre, em loop, 14 quadros de 90 ms
 * (scripts/pack_sprinkler.py). Rega as plantações a até 3 blocos, como a bomba antiga. */
export const SPRINKLER_FRAMES=14,SPRINKLER_FRAME_MS=90;
const sprinklerViews=new WeakMap<Phaser.Scene,Map<string,Phaser.GameObjects.Sprite>>();
/** Fixtures are saved independently of the terrain; pumps water nearby planted beds. */
export function updateVillageEquipment(scene:Phaser.Scene,s:SaveData,player:{x:number;y:number},indoors=false):void{
 let view=cache.get(scene);if(!view?.body.active){view={body:scene.add.graphics().setDepth(30),fixtures:new Map()};cache.set(scene,view);}
 view.body.clear().setVisible(!indoors);const sources=new Set<string>();
 const glow=(id:string,x:number,y:number,always=false)=>{sources.add(id);let marker=view!.fixtures.get(id);if(!marker?.active){marker=scene.add.zone(x,y,1,1);view!.fixtures.set(id,marker);}marker.setPosition(x,y).setVisible(true).setData('fixture-light',{radius:90,always});};
 const clean=()=>{for(const[id,marker]of view!.fixtures)if(!sources.has(id)){marker.destroy();view!.fixtures.delete(id);}};
 if(s.inventory.lantern>0)glow('carried-lantern',player.x,player.y-20,indoors);
 if(s.activeArea==='forest'||s.activeArea==='village'){clean();return;}
 let forges=forgeViews.get(scene);if(!forges){forges=new Map();forgeViews.set(scene,forges);}
 let sprinklers=sprinklerViews.get(scene);if(!sprinklers){sprinklers=new Map();sprinklerViews.set(scene,sprinklers);}
 const live=new Set<string>(),sprinklerLive=new Set<string>();
 const burning=s.economy6?.orders.some(o=>o.station==='own'&&o.phase==='working'&&gameMinute(s)<o.readyAt)??false;
 for(const f of s.villageInstallations??[]){const x=f.x*32+16,y=f.y*32+28;
 if(f.kind==='forge'){
   const id=`${f.x},${f.y}`;live.add(id);let sprite=forges.get(id);
   if(!sprite?.active){sprite=scene.add.image(x,y,'economy-forge-0').setOrigin(.5,1).setDisplaySize(72,72).setDepth(y);forges.set(id,sprite);}
   sprite.setTexture(`economy-forge-${burning?1+Math.floor(scene.time.now/150)%3:0}`).setDisplaySize(72,72).setVisible(!indoors);
   if(burning&&!indoors)glow('forge-'+id,x,y-15,true);
 }else if(f.kind==='lamp'){view.body.fillStyle(0x64442e).fillRect(x-3,y-38,6,38);view.body.fillStyle(0xe7c875).fillRect(x-7,y-46,14,15);if(!indoors)glow(`lamp-${f.x}-${f.y}`,x,y-40);
 }else{
   for(const crop of s.crops)if(Math.hypot(crop.x-f.x,crop.y-f.y)<=3)crop.watered=true;
   const id=`${f.x},${f.y}`;sprinklerLive.add(id);
   if(scene.textures.exists('irrigation-sprinkler-loop')){
    let sprite=sprinklers.get(id);
    if(!sprite?.active){sprite=scene.add.sprite(x,y,'irrigation-sprinkler-loop',0).setOrigin(.5,1).setDisplaySize(84,63);sprinklers.set(id,sprite);}
    sprite.setFrame(Math.floor(scene.time.now/SPRINKLER_FRAME_MS)%SPRINKLER_FRAMES).setPosition(x,y).setDepth(y).setVisible(!indoors);
   }else{view.body.fillStyle(0x667e7c).fillRect(x-12,y-21,24,21);view.body.lineStyle(3,0xb4c2a1).strokeCircle(x,y-14,7);}
 }}
 for(const [id,sprite]of forges)if(!live.has(id)){sprite.destroy();forges.delete(id);}
 for(const [id,sprite]of sprinklers)if(!sprinklerLive.has(id)){sprite.destroy();sprinklers.delete(id);}
 for(const [n,id]of(s.villageSurvivors??[]).entries()){const x=990+n*55,y=630;view.body.fillStyle(id==='marina'?0x647dab:0x8f6348).fillRoundedRect(x-8,y-24,16,23,3);view.body.fillStyle(0xe4b88b).fillCircle(x,y-32,7);}
 clean();
}
