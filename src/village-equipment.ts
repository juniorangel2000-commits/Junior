import type Phaser from 'phaser';
import type {SaveData} from './types';
import {gameMinute} from './systems/economy';
import SPRINKLER_ARMS from './data/sprinkler-arms.json';
const cache=new WeakMap<Phaser.Scene,{body:Phaser.GameObjects.Graphics;fixtures:Map<string,Phaser.GameObjects.Zone>}>();
const forgeViews=new WeakMap<Phaser.Scene,Map<string,Phaser.GameObjects.Image>>();
/** Aspersor automático (o item `waterPump`): gira sempre, em loop, 14 quadros de 90 ms
 * (scripts/pack_sprinkler.py). Rega as plantações a até 3 blocos, como a bomba antiga. */
export const SPRINKLER_FRAMES=14,SPRINKLER_FRAME_MS=90;
const sprinklerViews=new WeakMap<Phaser.Scene,Map<string,Phaser.GameObjects.Sprite>>();
/** Luminárias instaladas e os sobreviventes Marina e Rui (artes do Junior, preview.41). */
const imageViews=new WeakMap<Phaser.Scene,Map<string,Phaser.GameObjects.Image>>();
/** A luminária acende ao anoitecer e apaga de manhã. */
export const lampLit=(time:number)=>{const m=((time%1440)+1440)%1440;return m>=18*60+30||m<6*60;};
/** Pingos do aspersor: saem das pontas dos três braços (ângulo medido em cada quadro,
 * data/sprinkler-arms.json), voam em arco e caem a até ~3 blocos, com um respingo no chão.
 * Coordenadas no chão (gx, gy) com a profundidade achatada em 0,6, como a vista do jogo. */
interface Drop{gx:number;gy:number;z:number;vx:number;vy:number;vz:number;splash?:number}
const DROP_GRAVITY=300,TIP=20,MAX_DROPS=170,SQUASH=.6;
const dropViews=new WeakMap<Phaser.Scene,{g:Phaser.GameObjects.Graphics;drops:Map<string,Drop[]>;last:number;spawn:Map<string,number>}>();
export function stepSprinklerDrops(drops:Drop[],dt:number,frame:number,emit:number,random=Math.random):void{
 const base=(SPRINKLER_ARMS as number[])[frame%SPRINKLER_ARMS.length]*Math.PI/180;
 for(let i=0;i<emit&&drops.length<MAX_DROPS;i++){
  const arm=base+(i%3)*2*Math.PI/3+(random()-.5)*.45,speed=50+random()*62;
  drops.push({gx:Math.cos(arm)*TIP,gy:Math.sin(arm)*TIP,z:16+random()*4,vx:Math.cos(arm)*speed,vy:Math.sin(arm)*speed,vz:40+random()*55});
 }
 for(const d of drops){
  if(d.splash!==undefined){d.splash+=dt;continue;}
  d.gx+=d.vx*dt;d.gy+=d.vy*dt;d.vz-=DROP_GRAVITY*dt;d.z+=d.vz*dt;if(d.z<=0){d.z=0;d.splash=0;}
 }
 for(let i=drops.length-1;i>=0;i--)if((drops[i].splash??0)>.28)drops.splice(i,1);
}
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
 const live=new Set<string>(),sprinklerLive=new Set<string>(),imageLive=new Set<string>();
 let images=imageViews.get(scene);if(!images){images=new Map();imageViews.set(scene,images);}
 const image=(id:string,key:string,x:number,y:number,w:number,h:number)=>{if(!scene.textures.exists(key))return false;imageLive.add(id);let im=images!.get(id);if(!im?.active){im=scene.add.image(x,y,key).setOrigin(.5,1);images!.set(id,im);}if(im.texture.key!==key)im.setTexture(key);im.setPosition(x,y).setDisplaySize(w,h).setDepth(y).setVisible(!indoors);return true;};
 const burning=s.economy6?.orders.some(o=>o.station==='own'&&o.phase==='working'&&gameMinute(s)<o.readyAt)??false;
 for(const f of s.villageInstallations??[]){const x=f.x*32+16,y=f.y*32+28;
 if(f.kind==='forge'){
   const id=`${f.x},${f.y}`;live.add(id);let sprite=forges.get(id);
   if(!sprite?.active){sprite=scene.add.image(x,y,'economy-forge-0').setOrigin(.5,1).setDisplaySize(72,72).setDepth(y);forges.set(id,sprite);}
   sprite.setTexture(`economy-forge-${burning?1+Math.floor(scene.time.now/150)%3:0}`).setDisplaySize(72,72).setVisible(!indoors);
   if(burning&&!indoors)glow('forge-'+id,x,y-15,true);
 }else if(f.kind==='lamp'){
   if(!image(`lamp-${f.x},${f.y}`,lampLit(s.time)?'equipment-lamp-on':'equipment-lamp-off',x,y+2,27,56)){view.body.fillStyle(0x64442e).fillRect(x-3,y-38,6,38);view.body.fillStyle(0xe7c875).fillRect(x-7,y-46,14,15);}
   if(!indoors)glow(`lamp-${f.x}-${f.y}`,x,y-44);
 }else{
   for(const crop of s.crops)if(Math.hypot(crop.x-f.x,crop.y-f.y)<=3)crop.watered=true;
   const id=`${f.x},${f.y}`;sprinklerLive.add(id);
   if(scene.textures.exists('irrigation-sprinkler-loop')){
    let sprite=sprinklers.get(id);
    if(!sprite?.active){sprite=scene.add.sprite(x,y,'irrigation-sprinkler-loop',0).setOrigin(.5,1).setDisplaySize(84,63);sprinklers.set(id,sprite);}
    const frame=Math.floor(scene.time.now/SPRINKLER_FRAME_MS)%SPRINKLER_FRAMES;
    sprite.setFrame(frame).setPosition(x,y).setDepth(y).setVisible(!indoors);
    // Pingos em volta (uns 66 por segundo, três por vez, um em cada braço).
    let water=dropViews.get(scene);if(!water?.g.active){water={g:scene.add.graphics(),drops:new Map(),last:scene.time.now,spawn:new Map()};dropViews.set(scene,water);}
    const list=water.drops.get(id)??[];water.drops.set(id,list);
    const dt=Math.min(.05,Math.max(0,(scene.time.now-(water.spawn.get(id)??scene.time.now))/1000));water.spawn.set(id,scene.time.now);
    const acc=(sprite.getData('drop-acc') as number??0)+dt*66,emit=Math.floor(acc/3)*3;sprite.setData('drop-acc',acc-emit);
    if(!indoors)stepSprinklerDrops(list,dt,frame,emit);
   }else{view.body.fillStyle(0x667e7c).fillRect(x-12,y-21,24,21);view.body.lineStyle(3,0xb4c2a1).strokeCircle(x,y-14,7);}
 }}
 for(const [id,sprite]of forges)if(!live.has(id)){sprite.destroy();forges.delete(id);}
 for(const [id,sprite]of sprinklers)if(!sprinklerLive.has(id)){sprite.destroy();sprinklers.delete(id);}
 // Desenha os pingos de todos os aspersores numa só camada, logo acima do chão.
 const water=dropViews.get(scene);
 if(water?.g.active){
  water.g.clear().setVisible(!indoors).setDepth(Math.max(0,...[...sprinklers.values()].map(sp=>sp.y+1)));
  for(const [id,list] of water.drops){
   if(!sprinklerLive.has(id)){water.drops.delete(id);continue;}
   const [fx,fy]=id.split(',').map(Number),ox=fx*32+16,oy=fy*32+28-6;
   for(const d of list){
    const sx=ox+d.gx,sy=oy+d.gy*SQUASH;
    if(d.splash!==undefined){const k=d.splash/.28;water.g.lineStyle(1,0xcfeeff,.55*(1-k)).strokeEllipse(sx,sy,4+k*8,2+k*4);continue;}
    // Pingo com um rastro curto na direção do voo e a sombrinha no chão.
    const px=Math.round(sx),py=Math.round(sy-d.z),tx=Math.round(-d.vx*.025),ty=Math.round(-d.vy*SQUASH*.025+d.vz*.025);
    water.g.lineStyle(1,0x9fd6f2,.45).lineBetween(px+1,py+1,px+1+tx,py+1+ty);
    water.g.fillStyle(0xd8f3ff,.95).fillRect(px,py,2,3).fillStyle(0xffffff,.9).fillRect(px,py,1,1);
    water.g.fillStyle(0x2a5d7a,.16).fillRect(px,Math.round(sy),3,1);
   }
  }
 }
 // Marina e Rui andam pela propriedade (src/property-survivors-view.ts).
 for(const [id,im]of images)if(!imageLive.has(id)){im.destroy();images.delete(id);}
 clean();
}
