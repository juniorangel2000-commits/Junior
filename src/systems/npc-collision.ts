import type {ArrivalPoint}from'./actor-arrival';
interface SeenNpc extends ArrivalPoint{movingUntil:number;arrivalUntil:number}
/** Briefly yield at doorways and never trap a player already inside an NPC's foot box.
 * This affects player/NPC contact only; scenery and NPC navigation keep their own checks. */
export class NpcPassageCollision{
 private room='';private lastPlayer?:ArrivalPoint;private lastTime=-1;private arrivalUntil=0;private actors=new Map<string,SeenNpc>();
 blocks(id:string,actor:ArrivalPoint,player:ArrivalPoint|undefined,x:number,y:number,time:number,room:string,options:{moving?:boolean;halfWidth?:number;halfHeight?:number}={}):boolean{
  const rx=options.halfWidth??10,ry=options.halfHeight??6;
  if(!player)return Math.abs(actor.x-x)<rx&&Math.abs(actor.y-y)<ry;
  if(this.room!==room||time<this.lastTime||this.lastPlayer&&Math.hypot(player.x-this.lastPlayer.x,player.y-this.lastPlayer.y)>96){this.room=room;this.arrivalUntil=time+1500;this.actors.clear();}
  this.lastPlayer={x:player.x,y:player.y};this.lastTime=time;
  let seen=this.actors.get(id);if(!seen){seen={x:actor.x,y:actor.y,movingUntil:0,arrivalUntil:time+1500};this.actors.set(id,seen);}else if(Math.hypot(actor.x-seen.x,actor.y-seen.y)>.05){if(Math.hypot(actor.x-seen.x,actor.y-seen.y)>64)seen.arrivalUntil=time+1500;seen.movingUntil=time+120;seen.x=actor.x;seen.y=actor.y;}
  const overlapping=Math.abs(player.x-actor.x)<rx+7-.01&&Math.abs(player.y-actor.y)<ry+(player.y>=actor.y?5:3)-.01;
  const arriving=time<Math.max(this.arrivalUntil,seen.arrivalUntil)&&Math.hypot(player.x-actor.x,player.y-actor.y)<64;
  if(overlapping||arriving||options.moving||time<seen.movingUntil)return false;
  return Math.abs(actor.x-x)<rx&&Math.abs(actor.y-y)<ry;
 }
}
