import {CowRestCycle} from './systems/cow-rest';
import {FARM_BUILDINGS} from './data/farm-buildings';
import {farmAnimalHome,farmAnimalSettled,farmYardPoint,farmPointBlocked,farmHomePoint} from './systems/farm-construction';
import type Phaser from 'phaser';
import {animalSprite} from './forest-art';
import {updateAnimalSprite,animalRopeAnchor} from './animal-sprites';
import {FOREST_ANIMALS} from './data/ancient-forest';
import {AnimalBrain,ANIMAL_BEHAVIOR,type AnimalArea,type AnimalBlocked,type AnimalPoint,type AnimalPosition} from './systems/animals';
import type {SaveData} from './types';
import {TreeAvoidanceField} from './systems/tree-avoidance';

export interface MovingAnimal {
 id:string; brain:AnimalBrain; sprite:Phaser.GameObjects.Sprite;
 shadow?:Phaser.GameObjects.Ellipse;
 readonly x:number;readonly y:number;
}
/** Scene adapter; supplied directional sprites use the same navigation and transport rules. */
export class AnimalPopulation {
 readonly animals:MovingAnimal[]=[];
 private readonly brains:AnimalBrain[]=[];
 private readonly rope:Phaser.GameObjects.Graphics;
 private readonly treeCover=new TreeAvoidanceField();
 private treeCheck=0;
 private readonly homes=new Map<string,number>();
 private readonly cowRest=new Map<string,CowRestCycle>();
 constructor(scene:Phaser.Scene,private readonly save:SaveData,readonly area:AnimalArea,
   private readonly blocked:AnimalBlocked,playerSpeed:number,private readonly trees:()=>readonly {x:number;y:number}[]=()=>[]){
  this.rope=scene.add.graphics();
  this.treeCover.refresh(this.trees());
  const escort=save.animalEscort?.area===area?save.animalEscort.id:undefined;
  let index=0;
  for(const definition of FOREST_ANIMALS){
   const owned=save.recruitedAnimals?.includes(definition.id)??false;
   if(area==='forest'?owned:!owned&&definition.id!==escort)continue;
   const saved=save.animalPositions?.[area].find(p=>p.id===definition.id);
   const x=area==='forest'?definition.x*32+16:(20+(index%8)*3)*32+16;
   const y=area==='forest'?definition.y*32+16:(44+Math.floor(index/8)*3)*32+16;index++;
   const brain:AnimalBrain=new AnimalBrain(definition.id,definition.kind,saved?.x??x,saved?.y??y,!owned,blocked,playerSpeed,this.treeCover.cost,this.area==='property'?(px,py)=>{
    if(this.area!=='property')return false;if(farmPointBlocked(this.save,px,py))return true;
    const home=farmAnimalHome(this.save,definition.id);return !!home&&this.homes.get(definition.id)===home.id&&this.save.animalEscort?.id!==definition.id&&!farmYardPoint(home,px,py);
   }:undefined);
   if(saved)brain.restore(saved);
   if(!this.placeSafely(brain))continue;
   const sprite=animalSprite(scene,definition.kind,brain.x,brain.y);
   const shadow=definition.kind==='cow'?scene.add.ellipse(brain.x,brain.y,42,12,0x29271d,.17).setDepth(brain.y-.2):undefined;
   if(definition.kind==='cow')this.cowRest.set(brain.id,new CowRestCycle(brain.id));
   const view:MovingAnimal={shadow,id:brain.id,brain,sprite,get x(){return brain.x},get y(){return brain.y}};
   this.brains.push(brain);this.animals.push(view);
  }
 }
 private placeSafely(brain:AnimalBrain):boolean {
  const available=(x:number,y:number)=>brain.canStand(x,y)&&this.brains.every(other=>Math.hypot(x-other.x,y-other.y)>brain.radius+other.radius+4);
  if(available(brain.x,brain.y))return true;
  const tx=Math.floor(brain.x/32),ty=Math.floor(brain.y/32);
  for(let r=0;r<96;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){
   if(r&&Math.abs(dx)!==r&&Math.abs(dy)!==r)continue;
   const x=(tx+dx)*32+16,y=(ty+dy)*32+16;
   if(available(x,y)){brain.x=x;brain.y=y;return true;}
  }
  return false;
 }
 blocksPoint(x:number,y:number):boolean{return this.animals.some(a=>((x-a.x)/a.brain.radius)**2+((y-a.y)/a.brain.footRadiusY)**2<1);}
 get led():MovingAnimal|undefined {const id=this.save.animalEscort?.area===this.area?this.save.animalEscort.id:undefined;return this.animals.find(a=>a.id===id);}
 allowsPlayerCenter(x:number,y:number,owner:AnimalPoint):boolean {const led=this.led;if(!led)return true;const next=Math.hypot(x-led.x,y-led.y),current=Math.hypot(owner.x-led.x,owner.y-led.y);return !this.blocked(Math.floor(x/32),Math.floor(y/32))&&(next<=ANIMAL_BEHAVIOR.maxRopeLength||next<current-.001);}
 canLeave(player:AnimalPoint):boolean {const led=this.led;return !led||Math.hypot(led.x-player.x,led.y-player.y)<=ANIMAL_BEHAVIOR.portalDistance&&led.brain.lineClear(led,player);}
 nearest(player:AnimalPoint):MovingAnimal|undefined {
  return this.animals.filter(a=>a!==this.led&&Math.hypot(a.x-player.x,a.y-player.y)<=ANIMAL_BEHAVIOR.catchRadius&&a.brain.lineClear(a,player))
    .sort((a,b)=>Math.hypot(a.x-player.x,a.y-player.y)-Math.hypot(b.x-player.x,b.y-player.y))[0];
 }
 update(delta:number,player:AnimalPoint&{readonly leftHandPosition:AnimalPoint}):void {
  this.treeCheck-=delta;if(this.treeCheck<=0){this.treeCover.refresh(this.trees());this.treeCheck=.5;}
  for(const a of this.animals){
   const home=this.area==='property'?farmAnimalHome(this.save,a.id):undefined,led=a===this.led;
   if(!home||led)this.homes.delete(a.id);
   else if(farmAnimalSettled(home,a.brain,a.brain.radius,a.brain.footRadiusY))this.homes.set(a.id,home.id);
   const homing=!!home&&!led&&this.homes.get(a.id)!==home.id,rest=this.cowRest.get(a.id);
   if(rest){
    const wasResting=a.brain.resting;a.brain.resting=true;
    const canLie=a.brain.canStand(a.x,a.y)&&this.brains.every(other=>other===a.brain||Math.hypot(a.x-other.x,a.y-other.y)>a.brain.radius+other.radius+3)&&(!home||Math.abs(a.x-farmHomePoint(home).x)>30||a.y<(home.y+FARM_BUILDINGS[home.kind].height)*32-42);
    a.brain.resting=wasResting;
    rest.update(delta,!!home&&!led&&!homing,canLie,a.brain.direction,!a.brain.moving&&a.brain.mode==='idle');a.brain.resting=rest.locked;
   }
   if(rest?.locked)a.brain.hold(rest.direction);
   else a.brain.update(delta,homing?farmHomePoint(home!):player,this.brains,led||homing,homing?2:ANIMAL_BEHAVIOR.followDistance,!homing);
   a.shadow?.setPosition(a.x,a.y).setDepth(a.y-.2).setScale(rest?.locked?1.12:1,1);
   if(updateAnimalSprite(a.sprite,a.brain,delta,rest?.frame()))continue;
   const moving=a.brain.moving;
   // Temporary rigid-body locomotion, without stretching the authored animal art.
   const bob=moving?Math.abs(Math.sin(a.brain.distanceMoved/7))*(a.brain.mode==='flee'?.8:.4):0;
   if(a.brain.direction.includes('left'))a.sprite.setFlipX(true);
   else if(a.brain.direction.includes('right'))a.sprite.setFlipX(false);
   a.sprite.setPosition(a.x,a.y-bob).setDepth(a.y);
  }
  const led=this.led,g=this.rope;g.clear();if(!led)return;
  const head=animalRopeAnchor(led.sprite,led.brain);
  const hand=player.leftHandPosition;
  const sx=hand.x,sy=hand.y,ex=head.x,ey=head.y;
  const distance=Math.hypot(ex-sx,ey-sy),sag=Math.max(0,Math.min(6,(ANIMAL_BEHAVIOR.maxRopeLength-distance)*.12));
  // Keep the rope behind both actors, including when their vertical order changes.
  g.setDepth(Math.min(player.y,led.y)-.1);
  for(const [width,color]of [[1.8,0x4b351f],[.9,0xb58b52]]){
   g.lineStyle(width,color,.95).beginPath();
   for(let i=0;i<=24;i++){const t=i/24,x=sx+(ex-sx)*t,y=sy+(ey-sy)*t+4*t*(1-t)*sag;if(i===0)g.moveTo(x,y);else g.lineTo(x,y);}
   g.strokePath();
  }
 }
 store():void {
  this.save.animalPositions??={forest:[],property:[]};this.save.animalPositions[this.area]=this.animals.map(a=>a.brain.snapshot());
 }
 destroy():void {for(const a of this.animals){a.sprite.destroy();a.shadow?.destroy();}this.cowRest.clear();this.homes.clear();this.animals.length=0;this.brains.length=0;this.rope.destroy();}
}
export type {AnimalPosition};
