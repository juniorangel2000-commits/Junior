import {mineMissionSeal} from '../data/mine-quest-geometry';
import {registerMineNoise,ensureMineHazards} from './underground-hazards';
import type {SaveData,TilePoint} from '../types';
import {Inventory} from './inventory';
import {newEconomyState} from './economy';
import {ToolUse} from './tool-use';
import {directionFromVector} from '../character-directions';
import {BENTO_WORK as B} from '../data/bento-work';
import {bentoCanCarry,bentoStockFrom,beginBentoWorkTrip,ensureBentoWork} from './bento-stock';
import {bentoMapNavigation,bentoActorFits,planBentoRoute} from './bento-navigation';
import {advanceWorldRoute} from './world-route';
import {BENTO_WEEKLY_PLAN} from '../data/bento-schedule';
import {mineBlockNode,mineTargetVisible,applyMineStrike} from './underground';
import {mineMaterialAt} from './underground-geology';
import {commitBentoWork,type BentoWorkRuntime} from './bento-commit';
import type {BentoTrip} from './bento-travel-state';
import type {BentoMiningTarget} from './bento-work-state';
const rejected=new WeakMap<SaveData,{revision:number;ids:Set<string>}>();
export function bentoMiningAllowed(save:SaveData,cell:TilePoint,runtime?:Pick<BentoWorkRuntime,'protectedCells'>):boolean{
 const mine=save.underground,w=ensureBentoWork(save);if(!mine||w.trip.blocks>=B.maxBlocks||w.trip.elapsed>=B.miningSeconds||w.pickaxe.durability<=0)return false;
 if(mineMissionSeal(cell.x,cell.y))return false;
 const node=mineBlockNode(mine,cell.x,cell.y);if(!node||runtime?.protectedCells?.some(p=>p.x===cell.x&&p.y===cell.y))return false;
 const material=mineMaterialAt(mine,cell.x,cell.y);
 return material==='stone'?bentoCanCarry(w,'stone',4):material==='iron'&&w.trip.ironBlocks<B.maxIronBlocks&&bentoCanCarry(w,'ironOre',1);
}
function chooseTarget(save:SaveData,trip:BentoTrip,runtime:BentoWorkRuntime):BentoMiningTarget|undefined{
 const mine=save.underground!;let blocked=rejected.get(save);if(blocked?.revision!==mine.revision){blocked={revision:mine.revision,ids:new Set()};rejected.set(save,blocked);}
 const nav=bentoMapNavigation(save,'mining'),cx=Math.floor(trip.x/32),cy=Math.floor(trip.y/32),candidates:Array<{target:BentoMiningTarget;score:number}>=[];
 for(let y=cy-B.searchRadius;y<=cy+B.searchRadius;y++)for(let x=cx-B.searchRadius;x<=cx+B.searchRadius;x++){
  const node=mineBlockNode(mine,x,y);if(!node||blocked.ids.has(node.id)||!bentoMiningAllowed(save,{x,y},runtime))continue;
  for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){
   const origin={x:(x+dx)*32+16,y:(y+dy)*32+16};if(!nav.fits(origin)||!mineTargetVisible(mine,origin,node))continue;
   candidates.push({target:{cell:{x,y},origin,id:node.id},score:Math.hypot(origin.x-trip.x,origin.y-trip.y)-(node.metal==='iron'?12:0)});
  }
 }
 candidates.sort((a,b)=>a.score-b.score);return candidates[0]?.target;
}
export function strikeBentoBlock(save:SaveData,trip:BentoTrip,after:ReturnType<ToolUse['snapshot']>,runtime:BentoWorkRuntime):boolean{
 const target=save.bentoWork?.mining?.target;if(!target||!after.impacted||after.strike?.target.id!==target.id||save.bentoWork?.mining?.swing?.impacted||!bentoMiningAllowed(save,target.cell,runtime))return false;
 let result:ReturnType<typeof applyMineStrike>|undefined;
 const ok=commitBentoWork(save,draft=>{
  const w=ensureBentoWork(draft),mine=draft.underground!,node=mineBlockNode(mine,target.cell.x,target.cell.y);if(!node||node.id!==target.id||!w.mining||!bentoMiningAllowed(draft,target.cell,runtime))return false;
  const inventory=new Inventory({...w.pack,pickaxe:1}),economy=newEconomyState();economy.tools.pickaxe={...w.pickaxe};
  const context:SaveData={...draft,inventory:inventory.data,economy6:economy};
  const before=bentoStockFrom(inventory);result=applyMineStrike(mine,trip,target.cell,'pickaxe',inventory,context);if(!result.ok)return false;ensureMineHazards(mine,[trip]);registerMineNoise(mine,trip);
  w.pack=bentoStockFrom(inventory);w.pickaxe={...context.economy6!.tools.pickaxe!};w.mining.swing=after;
  for(const id of ['stone','ironShard','ironOre']as const)w.ledger.collected[id]+=w.pack[id]-before[id];
  if(result.depleted){w.trip.blocks++;if(node.metal==='iron')w.trip.ironBlocks++;}
  return true;
 },runtime);
 if(ok&&result?.ok)runtime.onMineImpact?.(target.cell,result.changed??[],!!result.depleted);return ok;
}
/** The NPC walks, uses ToolUse and invokes the player's excavation primitive at impact. */
export function stepBentoMining(save:SaveData,trip:BentoTrip,seconds:number,runtime:BentoWorkRuntime,player?:TilePoint):{done:boolean;used:number}{
 beginBentoWorkTrip(save,trip.day);let w=ensureBentoWork(save);const recovering=!!w.mining?.swing?.impacted,dt=recovering?Math.min(.1,seconds):Math.min(.1,seconds,Math.max(0,B.miningSeconds-w.trip.elapsed));
 if(dt<=0||!recovering&&(w.trip.blocks>=B.maxBlocks||w.pickaxe.durability<=0)){delete w.mining;return{done:true,used:0};}
 if(!bentoMapNavigation(save,'mining').fits(trip)){delete w.mining;return{done:true,used:0};}
 w.trip.elapsed=Math.min(B.miningSeconds,w.trip.elapsed+dt);trip.moving=false;
 if(!w.mining){const target=chooseTarget(save,trip,runtime);if(!target)return{done:true,used:dt};w.mining={target,pause:0};trip.route=[];trip.index=0;}
 const action=w.mining,target=action.target,node=mineBlockNode(save.underground!,target.cell.x,target.cell.y);
 if(action.swing){
  if(action.pause>0){action.pause=Math.max(0,action.pause-dt);return{done:false,used:dt};}
  const tool=new ToolUse();tool.restore(action.swing);const impact=tool.advance(dt),after=tool.snapshot();
  if(impact){
   if(!node||node.id!==target.id||!bentoMiningAllowed(save,target.cell,runtime)){delete w.mining;trip.route=[];return{done:false,used:dt};}
   if(!strikeBentoBlock(save,trip,after,runtime)){action.pause=1;return{done:false,used:dt};}
   w=ensureBentoWork(save);
  }else w.mining!.swing=after;
  if(!tool.active){delete w.mining!.swing;w.mining!.pause=B.strikePause;if(!mineBlockNode(save.underground!,target.cell.x,target.cell.y)){delete w.mining;trip.route=[];trip.index=0;}}
  return{done:false,used:dt};
 }
 if(!node||node.id!==target.id||!bentoMiningAllowed(save,target.cell,runtime)){delete w.mining;trip.route=[];return{done:false,used:dt};}
 if(action.pause>0){action.pause=Math.max(0,action.pause-dt);return{done:false,used:dt};}
 if(Math.hypot(trip.x-target.origin.x,trip.y-target.origin.y)>1){
  if(!trip.route.length){const route=planBentoRoute(save,trip,target.origin);if(route.planning)return{done:false,used:dt};trip.route=route.route;trip.index=0;if(!trip.route.length){rejected.get(save)?.ids.add(target.id);delete w.mining;return{done:false,used:dt};}}
  const nav=bentoMapNavigation(save,'mining'),step=advanceWorldRoute(trip,dt,BENTO_WEEKLY_PLAN.speed,(p,from)=>bentoActorFits(save,trip,p,player,nav)&&nav.allows(from,p));
  if(step.blocked){trip.route=[];trip.index=0;action.pause=.6;}return{done:false,used:dt};
 }
 trip.route=[];trip.index=0;
 if(!mineTargetVisible(save.underground!,trip,node)){delete w.mining;return{done:false,used:dt};}
 trip.direction=directionFromVector(target.cell.x*32+16-trip.x,target.cell.y*32+16-trip.y);
 const tool=new ToolUse();tool.start({tool:'pickaxe',direction:trip.direction,target:node});action.swing=tool.snapshot();return{done:false,used:dt};
}
