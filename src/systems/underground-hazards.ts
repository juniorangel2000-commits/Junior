import type {SaveData,TilePoint} from '../types';
import {UNDERGROUND,MINE_BRANCHES,mineDepth,mineHash,type MineDepth} from '../data/underground-layout';
import {MINE_HAZARDS as B} from '../data/underground-hazards';
import {DUNGEON_BALANCE,WEAPONS} from '../dungeons/config';
import {advanceEnemyPursuit,swordTargets,damageWithGrace} from '../dungeons/combat-core';
import type {AttackEffect} from '../dungeons/run';
import {villageRoute} from './village-walk';
import {campSegmentClear} from './survivor-combat';
import {hasEquippedSword} from './world-sword';
import {undergroundFits,undergroundBlocked,type UndergroundState} from './underground';
import type {MineHazardState,MineBat} from './underground-hazard-state';
export type MineHazardEvent='gas-enter'|'gas-leave'|'collapse-warning'|'collapse-impact'|'hurt';
export const mineSegmentClear=(mine:UndergroundState,a:TilePoint,b:TilePoint)=>campSegmentClear(a,b,(x,y)=>undergroundBlocked(mine,x,y));
export interface MineGasRegion extends TilePoint{radius:number}
/** Side galleries leave the main route available for Bento's later avoidance. */
export function mineGasRegions(mine:UndergroundState):MineGasRegion[]{
 return MINE_BRANCHES.slice(2).map((path,i)=>{const p=path[path.length-1];return{x:p.x*32+16,y:p.y*32+16,radius:68+mineHash(mine.seed,i,93)*25};});
}
export const mineContaminated=(mine:UndergroundState,p:TilePoint)=>mineGasRegions(mine).some(r=>Math.hypot(r.x-p.x,r.y-p.y)<r.radius)&&!undergroundBlocked(mine,p.x,p.y);
export function ensureMineHazards(mine:UndergroundState,protectedActors:readonly TilePoint[]=[]):MineHazardState{
 if(mine.hazards)return mine.hazards;
 const h:MineHazardState={version:1,hp:B.maxHealth,invulnerable:0,elapsed:0,swordCooldown:0,zombies:[],bats:[],cave:{sequence:0,cooldown:0}};
 const depths:MineDepth[]=['surface','middle','deep','extreme'];
 for(const [band,depth] of depths.entries()){
  const candidates:TilePoint[]=[];
  for(let y=8;y<169;y++)if(mineDepth(y)===depth)for(let x=8;x<152;x++){const p={x:x*32+16,y:y*32+16};if(undergroundFits(mine,p.x,p.y)&&!mineContaminated(mine,p)&&!protectedActors.some(a=>Math.hypot(a.x-p.x,a.y-p.y)<128))candidates.push(p);}
  candidates.sort((a,b)=>mineHash(mine.seed,a.x,a.y)-mineHash(mine.seed,b.x,b.y));
  for(const p of candidates){if(h.zombies.filter(z=>mineDepth(Math.floor(z.y/32))===depth).length>=B.zombies[depth])break;if(h.zombies.some(z=>Math.hypot(z.x-p.x,z.y-p.y)<180))continue;h.zombies.push({...p,id:h.zombies.length+1,hp:DUNGEON_BALANCE.enemyHealth,mode:'dormant',alert:0});}
  for(let n=0;n<3;n++){const p=candidates.find(p=>!h.zombies.some(z=>Math.hypot(z.x-p.x,z.y-p.y)<70)&&!h.bats.some(b=>Math.hypot(b.x-p.x,b.y-p.y)<190));if(!p)break;h.bats.push({...p,id:100+h.bats.length,hp:6,home:{...p},mood:n===0?'peaceful':n===1||band<2?'reactive':'aggressive',state:'roost',remaining:0});}
 }
 mine.hazards=h;return h;
}
/** Called within the same durable transaction as the pickaxe strike. */
export function registerMineNoise(mine:UndergroundState,origin:TilePoint):MineHazardEvent[]{
 const h=ensureMineHazards(mine),events:MineHazardEvent[]=[];
 for(const z of h.zombies)if(z.hp>0&&Math.hypot(z.x-origin.x,z.y-origin.y)<B.zombies.noise){z.mode='alert';z.alert=B.zombies.memory;z.goal={x:origin.x,y:origin.y};}
 for(const b of h.bats)if(b.hp>0&&Math.hypot(b.x-origin.x,b.y-origin.y)<190)disturbBat(mine,b,origin);
 const sequence=++h.cave.sequence;
 if(!h.cave.active&&h.cave.cooldown===0&&origin.y<UNDERGROUND.entryY-140&&mineHash(mine.seed^0xabc,sequence,7)<B.caveIn.chance[mineDepth(Math.floor(origin.y/32))]){
  h.cave.active={x:origin.x,y:origin.y,stage:'warning',remaining:B.caveIn.warningSeconds};h.cave.cooldown=B.caveIn.cooldown;events.push('collapse-warning');
 }
 return events;
}
export function moveMineActor(mine:UndergroundState,e:TilePoint,dx:number,dy:number):void{
 const steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)/3));
 for(let i=0;i<steps;i++){if(undergroundFits(mine,e.x+dx/steps,e.y))e.x+=dx/steps;if(undergroundFits(mine,e.x,e.y+dy/steps))e.y+=dy/steps;}
}
function fleeGoal(mine:UndergroundState,b:TilePoint,from:TilePoint):TilePoint{
 const angle=Math.atan2(b.y-from.y,b.x-from.x);
 for(const delta of [0,.7,-.7,1.5,-1.5,Math.PI]){const p={x:b.x+Math.cos(angle+delta)*100,y:b.y+Math.sin(angle+delta)*100};if(undergroundFits(mine,p.x,p.y)&&mineSegmentClear(mine,b,p))return p;}
 return{x:b.x,y:b.y};
}
function disturbBat(mine:UndergroundState,b:MineBat,p:TilePoint):void{
 if(b.state==='warning'||b.state==='dive')return;
 if(b.mood==='peaceful'){b.state='flee';b.goal=fleeGoal(mine,b,p);b.remaining=4;}
 else if(b.remaining<=0&&mineSegmentClear(mine,b,p)){b.state='warning';b.remaining=B.bats.warningSeconds;b.goal={x:p.x,y:p.y};b.struck=false;}
}
/** Runtime caches never enter the save; goals, health and actions do. */
export class UndergroundHazards{
 private exposed=false;
 private routes=new Map<number,{revision:number;goal:string;path:TilePoint[]}>();
 constructor(private mine:()=>UndergroundState){}
 get health(){return ensureMineHazards(this.mine()).hp;}
 get exposure(){return this.exposed;}
 noise(origin:TilePoint){return registerMineNoise(this.mine(),origin);}
 advance(seconds:number,player?:TilePoint,npc?:TilePoint):MineHazardEvent[]{
  if(!Number.isFinite(seconds)||seconds<=0)return[];
  const events:MineHazardEvent[]=[];
  // Bounded steps keep contact grace, dive impacts and warning transitions fair at low FPS.
  for(let left=seconds;left>1e-8;){const dt=Math.min(.05,left);left-=dt;this.step(dt,player,events,npc);if(player&&this.health<=0)break;}
  return events;
 }
 private step(dt:number,player:TilePoint|undefined,events:MineHazardEvent[],npc?:TilePoint):void{
  const mine=this.mine(),h=ensureMineHazards(mine);if(player&&h.hp<=0)return;const observers=[player,npc].filter((p):p is TilePoint=>!!p);const nearest=(from:TilePoint)=>observers.reduce<TilePoint|undefined>((a,p)=>!a||Math.hypot(p.x-from.x,p.y-from.y)<Math.hypot(a.x-from.x,a.y-from.y)?p:a,undefined);
  h.elapsed+=dt;h.invulnerable=Math.max(0,h.invulnerable-dt);h.swordCooldown=Math.max(0,h.swordCooldown-dt);h.cave.cooldown=Math.max(0,h.cave.cooldown-dt);
  const gas=!!player&&mineContaminated(mine,player);if(gas!==this.exposed){events.push(gas?'gas-enter':'gas-leave');this.exposed=gas;}
  if(gas)h.hp=Math.max(0,h.hp-B.maxHealth*B.gas.damageFractionPerSecond*dt);
  const cave=h.cave.active;
  if(cave){cave.remaining-=dt;if(cave.remaining<=1e-8){if(cave.stage==='warning'){
    cave.stage='impact';cave.remaining=.7;events.push('collapse-impact');
    // This transition happens once, including after save/resume. No debris can seal a tunnel.
    if(player&&Math.hypot(player.x-cave.x,player.y-cave.y)<=B.caveIn.radius){h.hp=Math.max(0,h.hp-B.maxHealth*B.caveIn.damageFraction);h.invulnerable=DUNGEON_BALANCE.contactGrace;events.push('hurt');}
   }else delete h.cave.active;}}
  if(player&&h.hp<=0)return;
  for(const z of h.zombies){
   const target=nearest(z);if(z.hp<=0||!target||Math.hypot(z.x-target.x,z.y-target.y)>B.zombies.activeRadius)continue;
   const d=Math.hypot(z.x-target.x,z.y-target.y),sees=d<B.zombies.detect&&mineSegmentClear(mine,z,target)&&target.y<UNDERGROUND.entryY-140;
   if(sees){z.mode='alert';z.alert=B.zombies.memory;z.goal={x:target.x,y:target.y};}else z.alert=Math.max(0,z.alert-dt);
   if(z.alert===0){z.mode='dormant';delete z.goal;}
   if(z.mode==='alert'&&z.goal){
    const actor={...z,speed:DUNGEON_BALANCE.enemySpeed};
    advanceEnemyPursuit(actor,z.goal,dt,{blocked:(x,y)=>!undergroundFits(mine,x,y),clear:(a,b)=>mineSegmentClear(mine,a,b),waypoint:(a,b)=>this.waypoint(z.id,a,b),move:(e,dx,dy)=>moveMineActor(mine,e,dx,dy)});
    z.x=actor.x;z.y=actor.y;
   }
   if(player&&Math.hypot(z.x-player.x,z.y-player.y)<22&&mineSegmentClear(mine,z,player)&&damageWithGrace(h,DUNGEON_BALANCE.enemyDamage,DUNGEON_BALANCE.contactGrace))events.push('hurt');
  }
  for(const b of h.bats){
   const target=nearest(b);if(b.hp<=0||!target||Math.hypot(b.x-target.x,b.y-target.y)>B.zombies.activeRadius)continue;
   b.remaining=Math.max(0,b.remaining-dt);const d=Math.hypot(b.x-target.x,b.y-target.y);
   if(b.state==='roost'){
    if(d<B.bats.disturb)disturbBat(mine,b,target);
    else if(d<B.bats.detect){if(b.mood==='aggressive')disturbBat(mine,b,target);else{b.state='flee';b.goal=fleeGoal(mine,b,target);b.remaining=3;}}
   }else if(b.state==='warning'&&b.remaining===0){b.state='dive';b.remaining=B.bats.diveSeconds;}
   else if(b.state==='dive'){
    if(b.goal){const d=Math.hypot(b.goal.x-b.x,b.goal.y-b.y)||1;moveMineActor(mine,b,(b.goal.x-b.x)/d*B.bats.speed*1.5*dt,(b.goal.y-b.y)/d*B.bats.speed*1.5*dt);}
    if(player&&!b.struck&&Math.hypot(b.x-player.x,b.y-player.y)<19&&mineSegmentClear(mine,b,player)){b.struck=true;if(damageWithGrace(h,B.bats.damage,DUNGEON_BALANCE.contactGrace))events.push('hurt');}
    if(b.remaining===0){b.state='flee';b.remaining=B.bats.cooldown;b.goal=fleeGoal(mine,b,target);}
   }else if(b.state==='flee'||b.state==='flight'){
    if(b.goal){const d=Math.hypot(b.goal.x-b.x,b.goal.y-b.y);if(d>3)moveMineActor(mine,b,(b.goal.x-b.x)/d*Math.min(d,B.bats.speed*dt),(b.goal.y-b.y)/d*Math.min(d,B.bats.speed*dt));}
    if(b.remaining===0){if(b.state==='flee'){b.state='flight';b.goal={...b.home};b.remaining=6;}else{b.state='roost';delete b.goal;}}
   }
  }
 }
 private waypoint(id:number,from:TilePoint,to:TilePoint):TilePoint|undefined{
  const mine=this.mine(),key=Math.floor(to.x/32)+','+Math.floor(to.y/32);let route=this.routes.get(id);
  if(!route||route.revision!==mine.revision||route.goal!==key){
   const path=villageRoute({x:from.x/32,y:from.y/32},{x:to.x/32,y:to.y/32},(x,y)=>!undergroundFits(mine,x*32+16,y*32+16),undefined,UNDERGROUND).map(p=>({x:p.x*32+16,y:p.y*32+16}));
   route={revision:mine.revision,goal:key,path};this.routes.set(id,route);
  }
  while(route.path.length&&Math.hypot(route.path[0].x-from.x,route.path[0].y-from.y)<8)route.path.shift();return route.path[0];
 }
 attack(save:SaveData,origin:TilePoint,angle:number):{effect?:AttackEffect;hits:number}{
  const mine=this.mine(),h=ensureMineHazards(mine);if(h.hp<=0||h.swordCooldown>0||!hasEquippedSword(save))return{hits:0};
  const w=WEAPONS.sword;h.swordCooldown=w.cooldown;
  const targets=swordTargets([...h.zombies,...h.bats],origin,angle,w.range,0,1,(a,b)=>mineSegmentClear(mine,a,b));
  for(const e of targets){e.hp=Math.max(0,e.hp-w.damage);const d=Math.hypot(e.x-origin.x,e.y-origin.y)||1;moveMineActor(mine,e,(e.x-origin.x)/d*6,(e.y-origin.y)/d*6);}
  return{effect:{id:0,weapon:'sword',x:origin.x,y:origin.y,angle,ttl:.22,variant:0,radius:w.range},hits:targets.length};
 }
}
