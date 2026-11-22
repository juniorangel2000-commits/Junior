import type Phaser from 'phaser';
import type { WorldPetContext } from './dungeons/world-pet-controller';
import { createAmbientFlock, stepAmbientBird, ambientBirdLift, daylightBirds, type AmbientBirdState } from './systems/ambient-bird';
const KEY='ambient-wild-birds';
const POSES=['perch','peck','flap-up','flap-down'] as const;
const COUNTS={openFields:9,property:4,village:6,forest:6,fishingLake:8,cityForest:4,survivorCamp:5,highland:5,railway:5,coast:6,orchard:7};
const SLOT=Symbol.for('after-rain-ambient-birds');
const CELL=48;
export const AMBIENT_BIRD_SHEET='assets/visual/nature/ambient-birds.png';

export function preloadAmbientBirdArt(scene:Phaser.Scene):void{
 if(!scene.textures.exists(KEY))scene.load.image(KEY,AMBIENT_BIRD_SHEET);
}

function art(scene:Phaser.Scene):boolean{
 if(!scene.textures.exists(KEY))return false;
 const texture=scene.textures.get(KEY);
 if(texture.has('shadow'))return true;
 texture.setFilter(1);
 for(let variant=0;variant<2;variant++)for(const [i,pose] of POSES.entries()){
  texture.add(`${variant}-${pose}`,0,i*CELL,variant*CELL,CELL,CELL);
 }
 texture.add('shadow',0,0,2*CELL,CELL,CELL);
 return true;
}
interface BirdDisplay {state:AmbientBirdState;image:Phaser.GameObjects.Image;shadow:Phaser.GameObjects.Image}
export class AmbientBirds {
 readonly birds:BirdDisplay[]=[];
 private retry=0;
 private flockSerial=0;
 private ready:boolean;
 constructor(private readonly scene:Phaser.Scene,private readonly context:()=>WorldPetContext){this.ready=art(scene);}
 update(seconds:number):void{
  if(!this.ready&&!(this.ready=art(this.scene)))return;
  const c=this.context(),visible=c.enabled&&c.space==='outdoors'&&daylightBirds(c.save.time);
  if(!visible){for(const b of this.birds){b.image.setVisible(false);b.shadow.setVisible(false);}return;}
  const dt=c.canMove?Math.min(.1,Math.max(0,seconds)):0;
  const canLand=(x:number,y:number)=>!c.blockedPoint(x,y);
  this.retry=Math.max(0,this.retry-dt);
  if(dt>0){
   const retired=new Set(this.birds.filter(b=>!b.state.active||Math.hypot(b.state.x-c.player.x,b.state.y-c.player.y)>1100).map(b=>b.state.flockId));
   for(let i=this.birds.length-1;i>=0;i--)if(retired.has(this.birds[i].state.flockId)){
    this.birds[i].image.destroy();this.birds[i].shadow.destroy();this.birds.splice(i,1);
   }
  }
  if(this.birds.length<COUNTS[c.area]&&this.retry===0&&dt>0){
   const id=++this.flockSerial+c.save.day*37+COUNTS[c.area]*11;
   const states=createAmbientFlock(id,c.player,canLand,this.birds.map(b=>b.state.flock!).filter(Boolean));
   if(states)for(const state of states)this.birds.push({state,image:this.scene.add.image(state.x,state.y,KEY,`${state.variant}-perch`).setOrigin(.5,.77).setScale(.62).setData('ambient-bird',true),shadow:this.scene.add.image(state.x,state.y,KEY,'shadow').setScale(.29)});
   this.retry=3;
  }
  const spooked=new Set(this.birds.filter(b=>b.state.phase!=='fly'&&Math.hypot(b.state.x-c.player.x,b.state.y-c.player.y)<78).map(b=>b.state.flockId));
  for(const b of this.birds){
   stepAmbientBird(b.state,dt,c.player,canLand,spooked.has(b.state.flockId));
   const s=b.state,lift=ambientBirdLift(s),pose=s.phase==='fly'?(Math.floor(s.age*10)%2?'flap-up':'flap-down'):s.phase==='perched'&&s.wait<1?'peck':'perch';
   const frame=`${s.variant}-${pose}`;if(b.image.frame.name!==frame)b.image.setFrame(frame);
   b.image.setVisible(s.active).setPosition(s.x,s.y-lift).setDepth(s.phase==='fly'?5000:s.y).setFlipX(s.direction<0);
   b.shadow.setVisible(s.active).setPosition(s.x,s.y).setDepth(s.y-2).setAlpha(s.phase==='fly'?.45:.8);
  }
 }
 destroy():void{for(const b of this.birds){b.image.destroy();b.shadow.destroy();}this.birds.length=0;this.retry=0;}
}
export function installAmbientBirds(scene:Phaser.Scene,context:()=>WorldPetContext):void{
 const host=scene as Phaser.Scene&{[SLOT]?:AmbientBirds};if(host[SLOT])return;
 const birds=new AmbientBirds(scene,context);host[SLOT]=birds;
 const update=(_time:number,delta:number)=>birds.update(delta/1000);
 scene.events.on('postupdate',update);scene.events.once('shutdown',()=>{scene.events.off('postupdate',update);birds.destroy();delete host[SLOT];});
}
export const getAmbientBirds=(scene:Phaser.Scene)=>(scene as Phaser.Scene&{[SLOT]?:AmbientBirds})[SLOT];
