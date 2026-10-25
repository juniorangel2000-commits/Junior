import {type CharacterDirection} from '../character-directions';
import {FOREST_ANIMALS, recruitAnimal, type AnimalKind} from '../data/ancient-forest';
import type {SaveData} from '../types';
import {Inventory} from './inventory';

export type AnimalArea = 'forest' | 'property';
export type AnimalMode = 'idle' | 'wander' | 'flee' | 'led';
export interface AnimalPosition {id: string; x: number; y: number; direction: CharacterDirection}
export interface AnimalEscort {id: string; area: AnimalArea}
export interface AnimalPoint {x: number; y: number}
export type AnimalBlocked = (tileX: number, tileY: number) => boolean;
export type AnimalTerrainCost = (tileX:number,tileY:number)=>number;
export const ANIMAL_BEHAVIOR = {
  detectionRadius: 144, calmRadius: 224, calmDelay: 2,
  fleeSpeedFactor: .9, wanderSpeedFactor: .27, leadSpeedFactor: .96,
  catchRadius: 32, followDistance: 32, maxRopeLength: 88, portalDistance: 72,
  replanSeconds: .45, wanderRadius: 96,
} as const;
const TILE = 32;
const headings = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]] as const;
const idSeed = (id: string) => {let h=2166136261;for(const c of id)h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;};
const compass:readonly CharacterDirection[]=['right','down-right','down','down-left','left','up-left','up','up-right'];
/** AI vectors are continuous: a tiny vertical correction must not select a diagonal pose. */
export function animalMovementDirection(dx:number,dy:number,previous:CharacterDirection):CharacterDirection {
  if(Math.hypot(dx,dy)<.001)return previous;
  const angle=Math.atan2(dy,dx),old=compass.indexOf(previous)*Math.PI/4;
  const difference=Math.abs(Math.atan2(Math.sin(angle-old),Math.cos(angle-old)));
  if(difference<=Math.PI/8+Math.PI/36)return previous;
  return compass[(Math.round(angle/(Math.PI/4))+8)%8];
}

/** Logic only: sprites/animations can be replaced without changing movement or transport. */
export class AnimalBrain {
  x: number; y: number;
  direction: CharacterDirection = 'right';
  mode: AnimalMode = 'idle';
  distanceMoved = 0;
  moving = false;
  readonly radius: number;
  private readonly feet: readonly (readonly [number,number])[];
  private seed: number;
  private timer: number;
  private rethink = 0;
  private safeFor = 0;
  private path: AnimalPoint[] = [];
  private stuckFor = 0;
  private following=false;

  constructor(readonly id: string, readonly kind: AnimalKind, x: number, y: number,
    readonly wild: boolean, private readonly blocked: AnimalBlocked, readonly playerSpeed = 84,
    private readonly terrainCost:AnimalTerrainCost=()=>0) {
    this.x=x;this.y=y;this.seed=idSeed(id);this.radius=kind==='cow'?8:kind==='chicken'||kind==='rabbit'?4:6;
    const r=this.radius;this.feet=[[-r,-r*.6],[r,-r*.6],[-r,r*.6],[r,r*.6]];
    this.timer=.2+this.random()*1.2;
  }
  private random(): number {this.seed=(Math.imul(this.seed,1664525)+1013904223)>>>0;return this.seed/4294967296;}
  canStand(x: number,y: number): boolean {
    return this.feet.every(([ox,oy])=>!this.blocked(Math.floor((x+ox)/TILE),Math.floor((y+oy)/TILE)));
  }
  occupiesTile(x:number,y:number):boolean {
    return this.feet.some(([ox,oy])=>Math.floor((this.x+ox)/TILE)===x&&Math.floor((this.y+oy)/TILE)===y);
  }
  lineClear(a: AnimalPoint,b: AnimalPoint): boolean {
    const steps=Math.max(1,Math.ceil(Math.hypot(a.x-b.x,a.y-b.y)/8));
    for(let i=1;i<steps;i++)if(this.blocked(Math.floor((a.x+(b.x-a.x)*i/steps)/TILE),Math.floor((a.y+(b.y-a.y)*i/steps)/TILE)))return false;
    return true;
  }
  private canTravel(a:AnimalPoint,b:AnimalPoint):boolean {
    const steps=Math.max(1,Math.ceil(Math.hypot(a.x-b.x,a.y-b.y)/4));
    for(let i=1;i<=steps;i++)if(!this.canStand(a.x+(b.x-a.x)*i/steps,a.y+(b.y-a.y)*i/steps))return false;
    return true;
  }
  private travelCost(a:AnimalPoint,b:AnimalPoint):number {
    const distance=Math.hypot(a.x-b.x,a.y-b.y)/TILE,steps=Math.max(1,Math.ceil(distance*4));let cover=0;
    for(let i=1;i<=steps;i++)cover+=this.terrainCost(Math.floor((a.x+(b.x-a.x)*i/steps)/TILE),Math.floor((a.y+(b.y-a.y)*i/steps)/TILE));
    return distance*(1+cover/steps*2.5);
  }
  restore(position: AnimalPosition): void {this.x=position.x;this.y=position.y;this.direction=position.direction;}
  snapshot(): AnimalPosition {return{id:this.id,x:this.x,y:this.y,direction:this.direction};}

  /** Bounded weighted search prefers open ground, retaining narrow routes as a fallback. */
  private plan(player: AnimalPoint, fleeing: boolean): AnimalPoint[] {
    const sx=Math.floor(this.x/TILE),sy=Math.floor(this.y/TILE);
    const nodes=[{x:sx,y:sy,parent:-1,distance:0,cost:0}],costs=new Map([[`${sx},${sy}`,0]]),queue=[0];
    const push=(index:number)=>{queue.push(index);let at=queue.length-1;while(at>0){const parent=(at-1)>>1;if(nodes[queue[parent]].cost<=nodes[index].cost)break;queue[at]=queue[parent];at=parent;}queue[at]=index;};
    const pop=():number=>{const first=queue[0],last=queue.pop()!;if(queue.length){let at=0;while(at*2+1<queue.length){let child=at*2+1;if(child+1<queue.length&&nodes[queue[child+1]].cost<nodes[queue[child]].cost)child++;if(nodes[last].cost<=nodes[queue[child]].cost)break;queue[at]=queue[child];at=child;}queue[at]=last;}return first;};
    let best=0,bestScore=-Infinity;
    for(let visited=0;queue.length&&visited<7000;visited++){
      const n=pop();
      const node=nodes[n],px=node.x*TILE+16,py=node.y*TILE+16;
      if(node.cost>(costs.get(`${node.x},${node.y}`)??Infinity)+.0001)continue;
      const point=n===0?this:{x:px,y:py},distance=Math.hypot(point.x-player.x,point.y-player.y);
      if(!fleeing&&n>0&&distance<=ANIMAL_BEHAVIOR.followDistance+8&&this.lineClear(point,player)){best=n;break;}
      if(fleeing){
        const score=distance-node.distance*2-(node.cost-node.distance)*10-this.terrainCost(node.x,node.y)*24;
        if(score>bestScore){bestScore=score;best=n;}
        if(node.distance>=10)continue;
      }
      for(const [dx,dy]of headings){
        const x=node.x+dx,y=node.y+dy,key=`${x},${y}`;
        if(!this.canStand(x*TILE+16,y*TILE+16))continue;
        if(dx&&dy&&(!this.canStand(node.x*TILE+16+dx*TILE,py)||!this.canStand(px,node.y*TILE+16+dy*TILE)))continue;
        const nextDistance=node.distance+(dx&&dy?Math.SQRT2:1);if(fleeing&&nextDistance>10)continue;
        const cost=node.cost+(dx&&dy?Math.SQRT2:1)*(1+this.terrainCost(x,y)*2.5);
        if(cost>=(costs.get(key)??Infinity)-.0001)continue;
        costs.set(key,cost);nodes.push({x,y,parent:n,distance:nextDistance,cost});push(nodes.length-1);
      }
    }
    if(!fleeing&&Math.hypot(nodes[best].x*TILE+16-player.x,nodes[best].y*TILE+16-player.y)>ANIMAL_BEHAVIOR.followDistance+8)return[];
    const path:AnimalPoint[]=[];
    for(let n=best;n>0;n=nodes[n].parent)path.push({x:nodes[n].x*TILE+16,y:nodes[n].y*TILE+16});
    return path.reverse();
  }
  update(delta: number,player: AnimalPoint,neighbors: readonly AnimalBrain[],led=false): void {
    const dt=Math.max(0,Math.min(delta,.1));this.moving=false;if(!dt)return;
    const range=Math.hypot(this.x-player.x,this.y-player.y);
    if(led){if(this.mode!=='led'){this.mode='led';this.path=[];this.rethink=0;this.following=false;}}
    else if(this.mode==='led'){this.mode='idle';this.path=[];this.timer=.1;}
    if(!led&&this.wild){
      if(this.mode!=='flee'&&range<=ANIMAL_BEHAVIOR.detectionRadius&&this.lineClear(this,player)){this.mode='flee';this.rethink=0;this.path=[];this.safeFor=0;}
      if(this.mode==='flee'){
        this.safeFor=range>ANIMAL_BEHAVIOR.calmRadius?this.safeFor+dt:0;
        if(this.safeFor>=ANIMAL_BEHAVIOR.calmDelay){this.mode='idle';this.timer=.6+this.random();this.path=[];}
      }
    }
    this.rethink-=dt;
    if(this.mode==='flee'||this.mode==='led'){
      if(this.mode==='led'){
        const clear=this.lineClear(this,player);
        if(range<=ANIMAL_BEHAVIOR.followDistance&&clear){this.following=false;this.path=[];return;}
        if(!this.following&&range<ANIMAL_BEHAVIOR.followDistance+8&&clear){this.path=[];return;}
        this.following=true;
      }
      if(this.mode==='led'&&this.canTravel(this,player)&&(range<ANIMAL_BEHAVIOR.followDistance+8||this.travelCost(this,player)<=range/TILE*1.1))this.path=[{x:player.x,y:player.y}];
      else if(this.rethink<=0){this.path=this.plan(player,this.mode==='flee');this.rethink=ANIMAL_BEHAVIOR.replanSeconds;}
    }else{
      this.timer-=dt;
      if(this.mode==='idle'&&this.timer<=0){
        let best:{point:AnimalPoint;score:number}|undefined;
        for(let n=0;n<24;n++){
          const angle=this.random()*Math.PI*2,distance=24+this.random()*(ANIMAL_BEHAVIOR.wanderRadius-24);
          const target={x:this.x+Math.cos(angle)*distance,y:this.y+Math.sin(angle)*distance};
          if(this.canStand(target.x,target.y)&&this.canTravel(this,target)){
            const score=this.terrainCost(Math.floor(target.x/TILE),Math.floor(target.y/TILE))*2+this.travelCost(this,target)/(distance/TILE)+this.random()*.15;
            if(!best||score<best.score)best={point:target,score};
          }
        }
        if(best){this.path=[best.point];this.mode='wander';}
        this.timer=1+this.random()*2;
      }
    }
    // Keep obstacle routing, but do not zigzag through every grid center on an open stretch.
    let pathCost=0,anchor:AnimalPoint=this,shortcut=0;
    for(let i=0;i<this.path.length;i++){pathCost+=this.travelCost(anchor,this.path[i]);anchor=this.path[i];if(i>0&&this.canTravel(this,this.path[i])&&this.travelCost(this,this.path[i])<=pathCost*1.05+.01)shortcut=i;}
    if(shortcut>0)this.path.splice(0,shortcut);
    while(this.path.length&&Math.hypot(this.path[0].x-this.x,this.path[0].y-this.y)<3)this.path.shift();
    const target=this.path[0];
    if(!target){if(this.mode==='wander'){this.mode='idle';this.timer=1+this.random()*2;}return;}
    const dx=target.x-this.x,dy=target.y-this.y,length=Math.hypot(dx,dy);
    const speed=this.playerSpeed*(this.mode==='flee'?ANIMAL_BEHAVIOR.fleeSpeedFactor:this.mode==='led'?ANIMAL_BEHAVIOR.leadSpeedFactor:ANIMAL_BEHAVIOR.wanderSpeedFactor);
    const amount=Math.min(speed*dt,length),steps=Math.max(1,Math.ceil(amount/3)),oldX=this.x,oldY=this.y;
    const fits=(x:number,y:number)=>this.canStand(x,y)&&(!led||Math.hypot(x-player.x,y-player.y)<=ANIMAL_BEHAVIOR.maxRopeLength||Math.hypot(x-player.x,y-player.y)<range)&&neighbors.every(other=>other===this||Math.hypot(x-other.x,y-other.y)>=this.radius+other.radius+3);
    for(let i=0;i<steps;i++){
      const mx=dx/length*amount/steps,my=dy/length*amount/steps;
      if(fits(this.x+mx,this.y))this.x+=mx;
      if(fits(this.x,this.y+my))this.y+=my;
    }
    const moved=Math.hypot(this.x-oldX,this.y-oldY);this.moving=moved>.001;
    if(this.moving){this.direction=animalMovementDirection(this.x-oldX,this.y-oldY,this.direction);this.distanceMoved+=moved;this.stuckFor=0;}
    else {this.stuckFor+=dt;if(this.stuckFor>.25){this.path=[];this.rethink=0;if(this.mode==='wander'){this.mode='idle';this.timer=.2;}this.stuckFor=0;}}
  }
}

function positions(save: SaveData) {return save.animalPositions??= {forest:[],property:[]};}
export function startAnimalEscort(save: SaveData,animal: AnimalPosition): boolean {
  if(save.animalEscort||!FOREST_ANIMALS.some(a=>a.id===animal.id))return false;
  const area=save.activeArea??'property',owned=save.recruitedAnimals?.includes(animal.id)??false;
  if(area==='forest'?owned:!owned)return false;
  const inventory=new Inventory(save.inventory);if(!inventory.spend({cord:1}))return false;
  Object.assign(save.inventory,inventory.data);save.animalEscort={id:animal.id,area};
  const saved=positions(save);saved[area]=saved[area].filter(p=>p.id!==animal.id);saved[area].push({...animal});return true;
}
export function releaseAnimalEscort(save: SaveData): boolean {
  const escort=save.animalEscort;if(!escort)return false;
  if(escort.area==='property'&&!save.recruitedAnimals?.includes(escort.id))return deliverAnimalEscort(save);
  const inventory=new Inventory(save.inventory);if(!inventory.transact({}, {cord:1}))return false;
  Object.assign(save.inventory,inventory.data);delete save.animalEscort;return true;
}
export function transferAnimalEscort(save: SaveData,arrival: AnimalPoint): void {
  const escort=save.animalEscort;if(!escort)return;
  const saved=positions(save);const old=saved.forest.find(p=>p.id===escort.id);
  saved.forest=saved.forest.filter(p=>p.id!==escort.id);saved.property=saved.property.filter(p=>p.id!==escort.id);
  saved.property.push({id:escort.id,x:arrival.x+(arrival.x<1536?24:-24),y:arrival.y,direction:old?.direction??'right'});
  escort.area='property';save.activeArea='property';
}
export function deliverAnimalEscort(save: SaveData): boolean {
  const escort=save.animalEscort;if(!escort||escort.area!=='property'||save.activeArea!=='property'||save.recruitedAnimals?.includes(escort.id)||!FOREST_ANIMALS.some(a=>a.id===escort.id))return false;
  const inventory=new Inventory(save.inventory);if(!inventory.transact({}, {cord:1}))return false;
  Object.assign(save.inventory,inventory.data);save.recruitedAnimals=recruitAnimal(save.recruitedAnimals??[],escort.id);delete save.animalEscort;return true;
}
