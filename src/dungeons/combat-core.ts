import {insideSwordArc} from './weapon-identity';
export interface CombatPoint{x:number;y:number}
/** Shared pursuit for dungeon zombies and persistent underground zombies. */
export function advanceEnemyPursuit<T extends CombatPoint & {speed:number;detour?:CombatPoint}>(
 enemy:T,target:CombatPoint,dt:number,
 nav:{blocked:(x:number,y:number)=>boolean;clear:(a:CombatPoint,b:CombatPoint)=>boolean;waypoint:(a:CombatPoint,b:CombatPoint)=>CombatPoint|undefined;move:(e:T,dx:number,dy:number)=>void},
):number{
 const dx=target.x-enemy.x,dy=target.y-enemy.y,d=Math.hypot(dx,dy)||1,speed=enemy.speed*dt;
 let mx=dx/d*speed,my=dy/d*speed;
 if(enemy.detour&&(Math.hypot(enemy.detour.x-enemy.x,enemy.detour.y-enemy.y)<speed*2||!nav.clear(enemy,enemy.detour))){
  delete enemy.detour;if(!nav.clear(enemy,target))enemy.detour=nav.waypoint(enemy,target);
 }
 if(!enemy.detour&&(nav.blocked(enemy.x+mx,enemy.y)||nav.blocked(enemy.x,enemy.y+my)))enemy.detour=nav.waypoint(enemy,target);
 if(enemy.detour){const d=Math.hypot(enemy.detour.x-enemy.x,enemy.detour.y-enemy.y)||1;mx=(enemy.detour.x-enemy.x)/d*speed;my=(enemy.detour.y-enemy.y)/d*speed;}
 nav.move(enemy,mx,my);return d;
}
/** Same frontal arc, nearest-first targeting and target limit in every sword fight. */
export function swordTargets<T extends CombatPoint & {hp:number}>(targets:readonly T[],origin:CombatPoint,angle:number,radius:number,wide=0,limit=1+wide,clear:((a:CombatPoint,b:CombatPoint)=>boolean)=()=>true):T[]{
 return targets.filter(e=>e.hp>0&&Math.hypot(e.x-origin.x,e.y-origin.y)<=radius&&insideSwordArc(e.x-origin.x,e.y-origin.y,angle,wide)&&clear(origin,e))
  .sort((a,b)=>Math.hypot(a.x-origin.x,a.y-origin.y)-Math.hypot(b.x-origin.x,b.y-origin.y)).slice(0,limit);
}
/** Shields/reductions are resolved by the caller; contact grace is shared. */
export function damageWithGrace(player:{hp:number;invulnerable:number},damage:number,grace:number):boolean{
 if(player.hp<=0||player.invulnerable>0||!Number.isFinite(damage)||damage<=0)return false;
 player.hp=Math.max(0,player.hp-damage);player.invulnerable=grace;return true;
}
