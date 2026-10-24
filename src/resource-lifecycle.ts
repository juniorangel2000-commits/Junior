import {isPathTile,isBridgeTile} from './data/regions';
import {forestPathDistance} from './data/ancient-forest';
import type {SaveData,ResourceNode} from './types';
import {newResourceField,replenishResources,harvestSpawn,clockMinutes,RESOURCE_LIMITS,RESOURCE_RESPAWN_MINUTES,type ResourceArea,type SpawnKind,type ResourceField} from './systems/resource-spawns';
interface ResourceWorld {resources:ResourceNode[];setNaturalResources(nodes:readonly ResourceNode[],preserve?:readonly string[]):void}
export class ResourceLifecycle {
 readonly field:ResourceField;
 private lastCheck=-Infinity;
 constructor(private readonly save:SaveData,private readonly area:ResourceArea,private readonly world:ResourceWorld,private readonly canPlace:(x:number,y:number)=>boolean){
  save.resourceFields??={property:newResourceField(Math.floor(Math.random()*0x100000000)),forest:newResourceField(Math.floor(Math.random()*0x100000000))};this.field=save.resourceFields[area];
  world.setNaturalResources(this.field.nodes,save.resourceProgress.map(p=>p.id));
  const visible=new Set(world.resources.map(n=>n.id));
  for(const n of [...this.field.nodes])if(!visible.has(n.id)){harvestSpawn(this.field,n.id,clockMinutes(save));save.resourceProgress=save.resourceProgress.filter(p=>p.id!==n.id);}
  this.tick(true);
 }
 tick(force=false):void {
  const now=clockMinutes(this.save);if(!force&&now-this.lastCheck<15)return;this.lastCheck=now;
  const fixed=this.world.resources.filter(n=>n.kind!=='standingTree'&&!n.id.startsWith('spawn-')).length;
  const budget=Math.max(0,RESOURCE_LIMITS[this.area]-fixed);
  while(this.field.nodes.length>budget){const n=this.field.nodes.pop()!;this.field.waiting.push({kind:n.kind as SpawnKind,at:now+RESOURCE_RESPAWN_MINUTES});this.save.resourceProgress=this.save.resourceProgress.filter(p=>p.id!==n.id);}
  this.world.setNaturalResources(this.field.nodes,this.save.resourceProgress.map(p=>p.id));
  if(replenishResources(this.field,this.area,now,(x,y)=>{const paint=(this.area==='forest'?this.save.forestMapEdits:this.save.mapEdits)?.terrain[`${x},${y}`];const ground=paint?['grass','meadow','forest','moss','soil','sand'].includes(paint):this.area==='forest'?forestPathDistance(x,y)>1.8:!isPathTile(x,y)&&!isBridgeTile(x,y);return ground&&this.canPlace(x,y);},budget))this.world.setNaturalResources(this.field.nodes,this.save.resourceProgress.map(p=>p.id));
 }
 collected(node:ResourceNode):boolean {
  const now=clockMinutes(this.save),generated=harvestSpawn(this.field,node.id,now);
  if(!generated&&node.kind!=='standingTree'&&this.field.nodes.length+this.field.waiting.length<RESOURCE_LIMITS[this.area])this.field.waiting.push({kind:node.kind as SpawnKind,at:now+RESOURCE_RESPAWN_MINUTES});
  this.save.resourceMilestones??={felled:false,mined:false};if(node.kind==='standingTree')this.save.resourceMilestones.felled=true;if(node.kind==='vein')this.save.resourceMilestones.mined=true;
  this.save.progress.harvested ||=this.save.resourceMilestones.felled&&this.save.resourceMilestones.mined;
  return generated;
 }
}
