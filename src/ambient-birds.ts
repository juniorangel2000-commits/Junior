import type Phaser from 'phaser';
import type { WorldPetContext } from './dungeons/world-pet-controller';
import { createAmbientFlock, stepAmbientBird, ambientBirdLift, daylightBirds, type AmbientBirdState } from './systems/ambient-bird';
const KEY='ambient-wild-birds';
const POSES=['perch','peck','flap-up','flap-down'] as const;
const COUNTS={property:4,village:6,forest:6,fishingLake:6,cityForest:4};
const SLOT=Symbol.for('after-rain-ambient-birds');
const BODY=['................','................','........ddd.....','.......dcccdd...','.......dcwkdnn..','.....dddcccd....','....dcccccd.....','...dcccbbbd.....','..ddccbbbbd.....','...ddddddd......','.....l..l.......','................'];
function art(scene:Phaser.Scene):void{
 if(scene.textures.exists(KEY))return;
 const canvas=document.createElement('canvas');canvas.width=64;canvas.height=48;const c=canvas.getContext('2d')!;
 const palettes=[{d:'#343326',c:'#8f7650',b:'#c7b080',w:'#e5dfba',k:'#1f261f',n:'#b49a57',l:'#665238'},{d:'#303d3b',c:'#7a8b89',b:'#b5bfba',w:'#e8e7d1',k:'#182721',n:'#b09b68',l:'#615e48'}];
 for(let variant=0;variant<2;variant++)for(let frame=0;frame<4;frame++){
  const x=frame*16,y=variant*16,p=palettes[variant];
  BODY.forEach((row,ry)=>[...row].forEach((ch,rx)=>{if(ch!=='.'){c.fillStyle=p[ch as keyof typeof p];c.fillRect(x+rx,y+ry,1,1);}}));
  c.fillStyle=p.d;
  if(frame===1){c.clearRect(x+7,y+2,7,4);c.fillRect(x+10,y+7,3,2);c.fillStyle=p.n;c.fillRect(x+13,y+8,2,1);}
  if(frame===2){c.fillRect(x+3,y+1,3,6);c.fillRect(x+2,y+2,1,3);c.fillStyle=p.c;c.fillRect(x+4,y+2,2,5);}
  if(frame===3){c.fillRect(x+4,y+7,3,6);c.fillRect(x+3,y+8,1,3);c.fillStyle=p.c;c.fillRect(x+5,y+8,2,4);}
 }
 c.fillStyle='#10251e40';c.beginPath();c.ellipse(8,40,5,1.5,0,0,Math.PI*2);c.fill();
 const texture=scene.textures.addCanvas(KEY,canvas)!;texture.setFilter(1);
 for(let variant=0;variant<2;variant++)for(const [i,pose] of POSES.entries())texture.add(`${variant}-${pose}`,0,i*16,variant*16,16,16);
 texture.add('shadow',0,0,32,16,16);
}
interface BirdDisplay {state:AmbientBirdState;image:Phaser.GameObjects.Image;shadow:Phaser.GameObjects.Image}
export class AmbientBirds {
 readonly birds:BirdDisplay[]=[];
 private retry=0;
 private flockSerial=0;
 constructor(private readonly scene:Phaser.Scene,private readonly context:()=>WorldPetContext){art(scene);}
 update(seconds:number):void{
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
   if(states)for(const state of states)this.birds.push({state,image:this.scene.add.image(state.x,state.y,KEY,`${state.variant}-perch`).setOrigin(.5,.75).setScale(1.5).setData('ambient-bird',true),shadow:this.scene.add.image(state.x,state.y,KEY,'shadow').setScale(.75)});
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
