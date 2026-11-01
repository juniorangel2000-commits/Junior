import type Phaser from 'phaser';
import type { OwnedPet } from './progression';
import type { WorldPetContext } from './world-pet-controller';
import { petSpritePose, petDirection, setupPetArt } from './pet-sprites';
import { isShelterPet, shelterSolid } from '../systems/pet-shelter';

export type ShelterActivity = 'roam' | 'water' | 'food' | 'rest' | 'play';
export interface ResidentBrain { x:number; y:number; goal:{x:number;y:number}; age:number; wait:number; turn:number; activity:ShelterActivity; direction:ReturnType<typeof petDirection> }
export function createResidentBrain(pet:OwnedPet): ResidentBrain {
  return {x:pet.world!.x,y:pet.world!.y,goal:{x:pet.world!.x,y:pet.world!.y},age:0,wait:1,turn:0,activity:'rest',direction:'south'};
}
export function stepResident(brain:ResidentBrain, dt:number, index:number, site:{x:number;y:number}, others: readonly ResidentBrain[], blocked:(x:number,y:number)=>boolean): void {
  if(dt<=0)return;
  dt=Math.min(.1,dt);brain.age+=dt;
  const distance=Math.hypot(brain.goal.x-brain.x,brain.goal.y-brain.y);
  if(distance<4){
    brain.wait-=dt;
    if(brain.wait>0)return;
    const activities: ShelterActivity[]=['roam','water','roam','play','food','roam','rest'];
    brain.activity=activities[(brain.turn+index*2)%activities.length];brain.turn++;
    const angle=(brain.turn*2.399+index*1.7);
    let goal={x:site.x+Math.cos(angle)*85,y:site.y+25+Math.abs(Math.sin(angle))*66};
    if(brain.activity==='water')goal={x:site.x-22-index*4,y:site.y+8+index*4};
    if(brain.activity==='food')goal={x:site.x+4+index*5,y:site.y+14+index*4};
    if(brain.activity==='rest')goal={x:site.x-22+index*22,y:site.y+7};
    if(brain.activity==='play'){
      const friend=others.find(p=>p!==brain);
      if(friend)goal={x:friend.x+Math.cos(angle)*24,y:friend.y+Math.sin(angle)*24};
    }
    if(!blocked(goal.x,goal.y)&&!shelterSolid(site,goal.x,goal.y))brain.goal=goal;
    else brain.activity='roam';
    brain.wait=brain.activity==='rest'?7:brain.activity==='roam'?1.5:3.5;
    return;
  }
  const angle=Math.atan2(brain.goal.y-brain.y,brain.goal.x-brain.x),speed=brain.activity==='play'?35:25;
  let moved=false;
  for(const offset of [0,.65,-.65,1.25,-1.25]){
    const dx=Math.cos(angle+offset)*Math.min(distance,speed*dt),dy=Math.sin(angle+offset)*Math.min(distance,speed*dt),x=brain.x+dx,y=brain.y+dy;
    if(Math.abs(x-site.x)>120||y<site.y-2||y>site.y+110)continue;
    if([[0,0],[-5,-3],[5,-3],[-5,3],[5,3]].some(([ox,oy])=>blocked(x+ox,y+oy)||shelterSolid(site,x+ox,y+oy)))continue;
    if(others.some(p=>p!==brain&&Math.hypot(x-p.x,y-p.y)<12))continue;
    brain.x=x;brain.y=y;brain.direction=petDirection(dx,dy);moved=true;break;
  }
  if(!moved){brain.goal={x:brain.x,y:brain.y};brain.wait=.5;}
}
export class ShelterResidents {
  private residents=new Map<string,{pet:OwnedPet;brain:ResidentBrain;image:Phaser.GameObjects.Image}>();
  constructor(private scene:Phaser.Scene){}
  update(context:WorldPetContext,dt:number):void{
    const site=context.save.petShelter;
    const visible=context.enabled&&context.area==='property'&&context.space==='outdoors'&&site?.stage===3;
    const pets=visible?context.save.dungeons?.pets.filter(isShelterPet)??[]:[];
    for(const [id,r] of this.residents)if(!pets.some(p=>p.id===id&&p===r.pet)){r.image.destroy();this.residents.delete(id);}
    if(!visible||!site)return;
    for(const pet of pets)if(!this.residents.has(pet.id)){
      setupPetArt(this.scene);
      const pose=petSpritePose(pet.species,'idle','south',0,true,pet.rare);
      this.residents.set(pet.id,{pet,brain:createResidentBrain(pet),image:this.scene.add.image(pet.world!.x,pet.world!.y,pose.texture,pose.frame).setData('shelter-resident',pet.id)});
    }
    const all=[...this.residents.values()],brains=all.map(r=>r.brain);
    all.forEach((r,index)=>{
      const old={x:r.brain.x,y:r.brain.y};
      stepResident(r.brain,context.canMove?dt:0,index,site,brains,context.blockedPoint);
      const moving=Math.hypot(old.x-r.brain.x,old.y-r.brain.y)>.01;
      const atGoal=!moving&&Math.hypot(r.brain.goal.x-r.brain.x,r.brain.goal.y-r.brain.y)<5;
      const usingBowl=atGoal&&(r.brain.activity==='food'||r.brain.activity==='water');
      const resting=atGoal&&r.brain.activity==='rest';
      if(usingBowl||resting)r.brain.direction='north';
      const pose=petSpritePose(r.pet.species,moving?'walk':resting?'rest':'idle',r.brain.direction,r.brain.age,true,r.pet.rare);
      const bob=usingBowl?Math.sin(r.brain.age*5)*.7:atGoal&&r.brain.activity==='play'?Math.max(0,Math.sin(r.brain.age*4))*2:0;
      r.image.setTexture(pose.texture,pose.frame).setOrigin(pose.originX,pose.originY).setScale(pose.scale).setPosition(r.brain.x,r.brain.y+bob).setDepth(r.brain.y+1).setData('shelter-activity',r.brain.activity);
      if(r.pet.world)Object.assign(r.pet.world,{x:r.brain.x,y:r.brain.y,direction:r.brain.direction});
    });
  }
  destroy():void{for(const r of this.residents.values())r.image.destroy();this.residents.clear();}
}
