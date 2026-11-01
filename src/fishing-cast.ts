import {preloadFishingCharacters,createFishingCharacter,frameFishingCamera} from './fishing-character';
import {FISHING_POSE_CELL,FISHING_CAST_TIMING,fishingDirection,fishingFacing} from './data/fishing-character-poses';
import type Phaser from 'phaser';
import type {Player} from './player';
export const FISHING_ART={rod:'assets/visual/fishing/bamboo-rod-directions.png',worm:'assets/visual/fishing/basic-worm.png'} as const;
export function preloadFishingArt(scene:Phaser.Scene):void{
 preloadFishingCharacters(scene);
 if(!scene.textures.exists('fishing-bamboo-world'))scene.load.image('fishing-bamboo-world',FISHING_ART.rod);
 if(!scene.textures.exists('fishing-worm-world'))scene.load.image('fishing-worm-world',FISHING_ART.worm);
}
export function fishingCastTarget(player:{x:number;y:number;facing:{x:number;y:number}},water:(x:number,y:number)=>boolean,clear:(x:number,y:number)=>boolean=()=>true):{x:number;y:number}|undefined{
 const angle=Math.atan2(player.facing.y,player.facing.x);
 for(const distance of [48,64,88,112,144,176])for(const offset of [0,Math.PI/4,-Math.PI/4,Math.PI/2,-Math.PI/2,Math.PI*.75,-Math.PI*.75,Math.PI]){
  const x=player.x+Math.cos(angle+offset)*distance,y=player.y+Math.sin(angle+offset)*distance;
  if(water(x,y)&&clear(x,y))return{x,y};
 }
}
/** A held rod, travelling line and landing float are world effects, not UI frames. */
export function createFishingCast(scene:Phaser.Scene,player:Player,water:(x:number,y:number)=>boolean,clear:(x:number,y:number)=>boolean=()=>true,net=false):{start:()=>Promise<boolean>;destroy:()=>void}{
 const poses={north:{x:0,y:0,hand:[320,540],tip:[352,60],angle:-Math.PI/2},south:{x:640,y:0,hand:[300,100],tip:[260,570],angle:Math.PI/2},west:{x:0,y:640,hand:[540,280],tip:[65,230],angle:Math.PI},east:{x:640,y:640,hand:[80,280],tip:[545,230],angle:0}} as const;
 const texture=scene.textures.get('fishing-bamboo-world');
 if(texture&&texture.key!=='__MISSING')for(const [name,p]of Object.entries(poses))if(!texture.has(name))texture.add(name,0,p.x/640*FISHING_POSE_CELL,p.y/640*FISHING_POSE_CELL,FISHING_POSE_CELL,FISHING_POSE_CELL);
 let pose:typeof poses[keyof typeof poses]=poses.north;
 let restoreCamera:(()=>void)|undefined;
 let character:ReturnType<typeof createFishingCharacter>;
 let launch:{x:number;y:number}|undefined;
 let rod:Phaser.GameObjects.Image|undefined,worm:Phaser.GameObjects.Image|undefined,graphics:Phaser.GameObjects.Graphics|undefined,resolve:((ok:boolean)=>void)|undefined,started=0,destroyed=false,landed=false;
 const target=fishingCastTarget(player,water,clear);
 const update=()=>{
  if(destroyed||!target||!graphics)return;
  const elapsed=Math.max(0,(scene.time.now-started)/1000),hand=player.leftHandPosition,angle=Math.atan2(target.y-hand.y,target.x-hand.x),load=Math.min(1,elapsed/.28),release=Math.max(0,Math.min(1,(elapsed-.28)/.6));
  const swing=elapsed<.28?-.25-load*.95:-((1-release)**2)*1.2;
  const north=player.facing.y<0;
  rod?.setPosition(hand.x,hand.y).setRotation(angle-pose.angle+swing).setDepth(player.y+(north?-1:2));
  const rotation=angle-pose.angle+swing,dx=(pose.tip[0]-pose.hand[0])*60/640,dy=(pose.tip[1]-pose.hand[1])*60/640;
  const tip=character?.update(elapsed)??{x:hand.x+dx*Math.cos(rotation)-dy*Math.sin(rotation),y:hand.y+dx*Math.sin(rotation)+dy*Math.cos(rotation)};
  if(elapsed>=FISHING_CAST_TIMING.launch&&!launch)launch=character?.tipAt(FISHING_CAST_TIMING.launch)??tip;
  const origin=launch??tip,t=Math.max(0,Math.min(1,(elapsed-FISHING_CAST_TIMING.launch)/(FISHING_CAST_TIMING.land-FISHING_CAST_TIMING.launch))),bob={x:origin.x+(target.x-origin.x)*t,y:origin.y+(target.y-origin.y)*t-Math.sin(Math.PI*t)*48};
  graphics.clear();graphics.setDepth(north?player.y-1:Math.max(player.y,target.y)+3);
  if(!net){graphics.lineStyle(.75,0xf0e1b5,.8);graphics.beginPath();graphics.moveTo(tip.x,tip.y);graphics.lineTo((tip.x+bob.x)/2,(tip.y+bob.y)/2+Math.sin(Math.PI*t)*8);graphics.lineTo(bob.x,bob.y);graphics.strokePath();}
  if(t<1){worm?.setVisible(!net).setPosition(bob.x,bob.y).setRotation(t*5);if(net){graphics.lineStyle(1,0xc8b785,.8);for(let i=-2;i<=2;i++){graphics.lineBetween(bob.x-9,bob.y+i*3,bob.x+9,bob.y+i*3);graphics.lineBetween(bob.x+i*4,bob.y-6,bob.x+i*4,bob.y+6);}}}
  else{
   worm?.setVisible(false);const lift=Math.sin(elapsed*3)*1.1;
   graphics.lineStyle(.7,0x193f42,.9);graphics.fillStyle(0xe5e5c6,1);graphics.fillEllipse(target.x,target.y+lift,4,6);graphics.fillStyle(0xbe5443,1);graphics.fillEllipse(target.x,target.y+lift+2,4,3);
   for(let i=0;i<2;i++){const phase=(Math.max(0,elapsed-.95)*.7+i*.5)%1;graphics.lineStyle(.8,0xc4e5d9,(1-phase)*.5);graphics.strokeEllipse(target.x,target.y+3,8+phase*24,3+phase*7);}
   if(!landed){landed=true;resolve?.(true);resolve=undefined;}
  }
 };
 const destroy=()=>{if(destroyed)return;destroyed=true;scene.events.off('update',update);scene.events.off('shutdown',destroy);character?.destroy();restoreCamera?.();rod?.destroy();worm?.destroy();graphics?.destroy();resolve?.(false);resolve=undefined;};
 return{start:()=>new Promise<boolean>(done=>{
  if(destroyed){done(false);return;}if(!target){done(true);return;}
  const direction=fishingDirection(target.x-player.x,target.y-player.y);player.facing=fishingFacing(direction);player.update(0,()=>false,()=>false,false,()=>player.waterDepth);
  resolve=done;started=scene.time.now;restoreCamera=frameFishingCamera(scene,player);
  const facing=player.facing,name=Math.abs(facing.y)>=Math.abs(facing.x)?facing.y<0?'north':'south':facing.x<0?'west':'east';pose=poses[name];
  if(!net)character=createFishingCharacter(scene,player,direction);
  if(!net&&!character&&scene.textures.exists('fishing-bamboo-world'))rod=scene.add.image(player.x,player.y,'fishing-bamboo-world',name).setOrigin(pose.hand[0]/640,pose.hand[1]/640).setDisplaySize(60,60).setData('fishing-cast-rod',true);
  if(scene.textures.exists('fishing-worm-world'))worm=scene.add.image(player.x,player.y,'fishing-worm-world').setDisplaySize(12,12).setDepth(player.y+3);
  graphics=scene.add.graphics().setData('fishing-cast-line',true);scene.events.on('update',update);scene.events.once('shutdown',destroy);update();
 }),destroy};
}
