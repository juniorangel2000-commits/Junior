import {pauseMineMissions} from './mine-mission-lifecycle';
import type {SaveData,TilePoint} from '../types';
import type {BentoTrip} from './bento-travel-state';
import {changeBentoLeg} from './bento-travel-state';
import {ensureBentoExpedition,endBentoParty} from './bento-expedition';
import {bentoMineDanger,bentoMineLit,bentoMineRisk} from './bento-mine-safety';
import {bentoMapNavigation,bentoPlayerSpace,bentoActorFits,planBentoRoute} from './bento-navigation';
import {UndergroundHazards,mineContaminated,mineSegmentClear,moveMineActor} from './underground-hazards';
import {damageWithGrace,swordTargets} from '../dungeons/combat-core';
import {DUNGEON_BALANCE,WEAPONS} from '../dungeons/config';
import {MINE_HAZARDS} from '../data/underground-hazards';
import {BENTO_EXPEDITION as B} from '../data/bento-expedition';
import {MINING_EXIT} from '../data/mining-entry';
import {directionFromVector,directionVector} from '../character-directions';
import {advanceWorldRoute} from './world-route';
import {commitBentoWork,type BentoWorkRuntime} from './bento-commit';
const simulations=new WeakMap<SaveData,UndergroundHazards>();
const distance=(a:TilePoint,b:TilePoint)=>Math.hypot(a.x-b.x,a.y-b.y);
function safeGoal(save:SaveData,t:BentoTrip,player?:TilePoint):TilePoint|undefined{
 const nav=bentoMapNavigation(save,'mining'),m=save.underground!,currentRisk=bentoMineRisk(save,t),points:TilePoint[]=[];
 for(let y=-7;y<=7;y++)for(let x=-7;x<=7;x++){const p={x:(Math.floor(t.x/32)+x+.5)*32,y:(Math.floor(t.y/32)+y+.5)*32};if(distance(p,t)<48||distance(p,t)>240||!nav.fits(p)||bentoMineRisk(save,p)>0&&bentoMineRisk(save,p)>=currentRisk||!mineSegmentClear(m,t,p))continue;points.push(p);}
 const score=(p:TilePoint)=>distance(t,p)+bentoMineRisk(save,p)*10+(bentoMineLit(save,p,player)?0:30)-p.y*.15;points.sort((a,b)=>score(a)-score(b));return points[0];
}
function hurtBento(save:SaveData,t:BentoTrip,dt:number):boolean{
 const s=ensureBentoExpedition(save),m=save.underground!,h=m.hazards;if(!h)return false;const before=s.health,actor={hp:s.health,invulnerable:s.grace};
 if(mineContaminated(m,t))actor.hp=Math.max(1,actor.hp-MINE_HAZARDS.maxHealth*MINE_HAZARDS.gas.damageFractionPerSecond*dt);
 const cave=h.cave.active;if(cave?.stage==='impact'&&distance(t,cave)<=MINE_HAZARDS.caveIn.radius&&s.caveHit!==h.cave.sequence){actor.hp=Math.max(1,actor.hp-MINE_HAZARDS.maxHealth*MINE_HAZARDS.caveIn.damageFraction);actor.invulnerable=DUNGEON_BALANCE.contactGrace;s.caveHit=h.cave.sequence;}
 if(h.zombies.some(z=>z.hp>0&&distance(z,t)<22&&mineSegmentClear(m,z,t)))damageWithGrace(actor,DUNGEON_BALANCE.enemyDamage,DUNGEON_BALANCE.contactGrace);
 for(const b of h.bats)if(b.hp>0&&b.mood!=='peaceful'&&b.state==='dive'&&!b.struck&&distance(b,t)<19&&mineSegmentClear(m,b,t)){b.struck=true;damageWithGrace(actor,MINE_HAZARDS.bats.damage,DUNGEON_BALANCE.contactGrace);}
 // Bento is a persistent resident: low health triggers a physical emergency retreat, never death.
 s.health=Math.max(1,actor.hp);s.grace=actor.invulnerable;return s.health<before;
}
function defenseStep(save:SaveData,t:BentoTrip,dt:number,runtime:BentoWorkRuntime):boolean{
 let s=ensureBentoExpedition(save),swing=s.defense;if(!swing)return false;t.moving=false;t.direction=swing.direction;
 const next=Math.min(B.defenseSeconds,swing.elapsed+dt);
 if(!swing.impacted&&next+1e-8>=B.defenseImpact){
  let hits=0;const ok=commitBentoWork(save,draft=>{
   const action=draft.bentoExpedition?.defense,m=draft.underground;if(!action||action.impacted||!m)return false;
   const target=(action.kind==='zombie'?m.hazards?.zombies:m.hazards?.bats)?.find(e=>e.id===action.target&&e.hp>0);const v=directionVector(action.direction),angle=Math.atan2(v.y,v.x);
   // One threatened target, the native frontal arc/damage and geometry; no loot or pursuit.
   if(target&&distance(t,target)<=B.defenseRange+5&&mineSegmentClear(m,t,target)&&swordTargets([target],t,angle,B.defenseRange+5,0,1,(a,b)=>mineSegmentClear(m,a,b)).length){
    target.hp=Math.max(0,target.hp-WEAPONS.hammer.damage);const d=distance(t,target)||1;moveMineActor(m,target,(target.x-t.x)/d*18,(target.y-t.y)/d*18);hits=1;
   }
   action.elapsed=next;action.impacted=true;return true;
  },runtime);if(!ok)return true;s=ensureBentoExpedition(save);swing=s.defense!;runtime.onBentoDefense?.(t,hits);
 }else swing.elapsed=next;
 if(swing.elapsed+1e-8>=B.defenseSeconds)delete s.defense;return true;
}
/** Shared hazards run off-screen around the real NPC, without ever applying damage to the player. */
export function stepBentoSafety(save:SaveData,t:BentoTrip,seconds:number,runtime:BentoWorkRuntime,player?:TilePoint):boolean{
 const existing=save.bentoExpedition;if(t.area!=='mining'){if(existing){delete existing.safety;delete existing.defense;}return false;}
 const dt=Math.min(.1,seconds),visible=bentoPlayerSpace(save)==='mining';
 if(!visible){let model=simulations.get(save);if(!model){model=new UndergroundHazards(()=>save.underground!);simulations.set(save,model);}model.advance(dt,undefined,t);}
 let s=ensureBentoExpedition(save);s.grace=Math.max(0,s.grace-dt);s.cooldown=Math.max(0,s.cooldown-dt);
 const lightPlayer=visible?player:undefined,hurt=hurtBento(save,t,dt),threat=bentoMineDanger(save,t,true,lightPlayer);
 if(!threat&&!s.safety&&!s.defense)return false;
 if(!s.safety){s.safety={reason:threat?.reason??'zombie',elapsed:0,blocked:0,calm:0,returning:false};t.route=[];t.index=0;t.wait=0;if(save.bentoWork)delete save.bentoWork.mining;}
 const safety=s.safety;safety.elapsed=Math.min(1440,safety.elapsed+dt);safety.calm=threat?0:Math.min(5,safety.calm+dt);
 if(hurt||s.health<=B.criticalHealth||safety.elapsed>=B.evadeSeconds||safety.reason==='collapse'||safety.reason==='gas'){
  if(!safety.returning){safety.returning=true;delete safety.goal;changeBentoLeg(t,'mining-back');endBentoParty(save,'danger');pauseMineMissions(save);}
 }
 if(defenseStep(save,t,dt,runtime))return true;
 const m=save.underground!,h=m.hazards,targets=[...(h?.zombies??[]).map(e=>({e,kind:'zombie' as const})),...(h?.bats??[]).filter(e=>e.mood!=='peaceful'&&(e.state==='dive'||e.state==='warning')).map(e=>({e,kind:'bat' as const}))].filter(({e})=>e.hp>0&&distance(e,t)<B.defenseRange&&mineSegmentClear(m,t,e)).sort((a,b)=>distance(a.e,t)-distance(b.e,t));
 if(targets.length&&s.cooldown===0){const{e,kind}=targets[0];s.defense={target:e.id,kind,elapsed:0,impacted:false,direction:directionFromVector(e.x-t.x,e.y-t.y)};s.cooldown=WEAPONS.hammer.cooldown;t.moving=false;return true;}
 if(!safety.returning&&safety.calm>=B.calmSeconds){delete s.safety;t.route=[];t.index=0;return false;}
 const options={mode:'escape' as const,from:{x:t.x,y:t.y},avoid:visible?player:undefined},nav=bentoMapNavigation(save,'mining',options);
 const nearDanger=!!threat&&distance(t,MINING_EXIT)>200;
 if(safety.returning&&!nearDanger){if(!safety.goal||distance(safety.goal,MINING_EXIT)>1){safety.goal={...MINING_EXIT};t.route=[];t.index=0;}}
 else if(!safety.goal||safety.returning&&distance(safety.goal,MINING_EXIT)<1||!nav.fits(safety.goal)||bentoMineRisk(save,safety.goal)>0){safety.goal=safeGoal(save,t,lightPlayer)??{...MINING_EXIT};t.route=[];t.index=0;}
 const destination=safety.goal!;
 if(distance(t,destination)<1){t.moving=false;if(safety.returning&&distance(destination,MINING_EXIT)<1){t.route=[{x:destination.x,y:destination.y}];t.index=0;t.blocked=false;t.wait=0;return false;}delete safety.goal;t.route=[];t.index=0;return true;}
 if(!t.route.length){const result=planBentoRoute(save,t,destination,options);if(result.planning)return true;t.route=result.route;t.index=0;if(!t.route.length){safety.blocked=Math.min(1440,safety.blocked+dt);delete safety.goal;return true;}}
 const step=advanceWorldRoute(t,dt,B.fleeSpeed,(to,from)=>bentoActorFits(save,t,to,player,nav)&&nav.allows(from,to));
 if(step.blocked){t.route=[];t.index=0;safety.blocked=Math.min(1440,safety.blocked+dt);delete safety.goal;}else safety.blocked=0;
 if(step.arrived){t.route=[];t.index=0;}return true;
}
