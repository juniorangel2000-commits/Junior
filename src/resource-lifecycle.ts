import {TreeAvoidanceField,treeTiles,naturalPlantGround} from './systems/tree-avoidance';
import {hasMapSeam,seamPassage} from './data/map-seam';
import {isPropertyVillagePassage} from './data/property-village-gate';
import {roadDistanceAt} from './data/terrain-shape';
import {fiberPlantFor,type FiberPlant} from './data/fiber-plants';
import {isPathTile,isBridgeTile} from './data/regions';
import {forestPathDistance} from './data/ancient-forest';
import type {SaveData,ResourceNode} from './types';
import {newResourceField,replenishResources,harvestSpawn,clockMinutes,RESOURCE_LIMITS,resourceRespawnMinutes,upgradeResourceTiming,upgradeResourceEcology,type ResourceArea,type SpawnKind,type ResourceField} from './systems/resource-spawns';
interface ResourceWorld {isWater?(x:number,y:number):boolean;resources:ResourceNode[];setNaturalResources(nodes:readonly ResourceNode[],preserve?:readonly string[]):void}
export class ResourceLifecycle {
 readonly field:ResourceField;
 private lastCheck=-Infinity;
 private readonly treeCover=new TreeAvoidanceField();
 constructor(private readonly save:SaveData,private readonly area:ResourceArea,private readonly world:ResourceWorld,private readonly canPlace:(x:number,y:number)=>boolean){
  save.resourceFields??={property:newResourceField(Math.floor(Math.random()*0x100000000)),forest:newResourceField(Math.floor(Math.random()*0x100000000))};this.field=save.resourceFields[area];upgradeResourceTiming(this.field);upgradeResourceEcology(this.field,area,clockMinutes(save));
  world.setNaturalResources(this.field.nodes,save.resourceProgress.map(p=>p.id));
  const visible=new Set(world.resources.map(n=>n.id));
  for(const n of [...this.field.nodes])if(!visible.has(n.id)){harvestSpawn(this.field,n.id,clockMinutes(save));save.resourceProgress=save.resourceProgress.filter(p=>p.id!==n.id);}
  this.tick(true);
 }
 tick(force=false):void {
  const now=clockMinutes(this.save);if(!force&&now-this.lastCheck<15)return;this.lastCheck=now;
  const fixed=this.world.resources.filter(n=>n.kind!=='standingTree'&&!n.id.startsWith('spawn-')).length;
  const budget=Math.max(0,RESOURCE_LIMITS[this.area]-fixed);
  const continuation=hasMapSeam(this.area==='forest'?this.save.forestMapEdits:this.save.mapEdits);
  while(this.field.nodes.length>budget){const n=this.field.nodes.pop()!;this.field.waiting.push({kind:n.kind as SpawnKind,at:now+resourceRespawnMinutes(n.kind as SpawnKind),...(n.kind==='fiber'?{plant:fiberPlantFor(n)}:{})});this.save.resourceProgress=this.save.resourceProgress.filter(p=>p.id!==n.id);}
  this.world.setNaturalResources(this.field.nodes,this.save.resourceProgress.map(p=>p.id));
  this.treeCover.refresh(treeTiles(this.world.resources));
  if(replenishResources(this.field,this.area,now,(x,y,_kind,plant?:FiberPlant)=>{if(continuation&&(seamPassage(x,y,this.area)||this.area==='property'&&isPropertyVillagePassage(x,y)))return false;if(plant==='reeds'&&(this.area!=='property'||!this.world.isWater||![-2,-1,0,1,2].some(dx=>[-2,-1,0,1,2].some(dy=>this.world.isWater!(x+dx,y+dy)))))return false;const paint=(this.area==='forest'?this.save.forestMapEdits:this.save.mapEdits)?.terrain[`${x},${y}`];if((_kind==='fiber'||_kind==='seeds')&&!naturalPlantGround(paint))return false;if(this.area==='property'&&paint===undefined&&roadDistanceAt((x+.5)*32,(y+.5)*32)<26)return false;const ground=paint?['grass','meadow','forest','moss','soil','sand'].includes(paint):this.area==='forest'?forestPathDistance(x,y)>1.8:!isPathTile(x,y)&&!isBridgeTile(x,y);return ground&&this.canPlace(x,y);},budget,(x,y,kind)=>{const hand=['fiber','seeds','tree','stone','scrap'].includes(kind);const trail=this.area==='forest'?forestPathDistance(x,y):roadDistanceAt((x+.5)*32,(y+.5)*32)/32;return this.treeCover.cost(x,y)*(hand?12:3)+(hand?Math.abs(trail-3)*.7:0);}))this.world.setNaturalResources(this.field.nodes,this.save.resourceProgress.map(p=>p.id));
 }
 collected(node:ResourceNode):boolean {
  const now=clockMinutes(this.save),generated=harvestSpawn(this.field,node.id,now);
  if(!generated&&node.kind!=='standingTree'&&this.field.nodes.length+this.field.waiting.length<RESOURCE_LIMITS[this.area])this.field.waiting.push({kind:node.kind as SpawnKind,at:now+resourceRespawnMinutes(node.kind as SpawnKind),...(node.kind==='fiber'?{plant:fiberPlantFor(node)}:{})});
  this.save.resourceMilestones??={felled:false,mined:false};if(node.kind==='standingTree')this.save.resourceMilestones.felled=true;if(node.kind==='vein')this.save.resourceMilestones.mined=true;
  this.save.progress.harvested ||=this.save.resourceMilestones.felled&&this.save.resourceMilestones.mined;
  return generated;
 }
}
