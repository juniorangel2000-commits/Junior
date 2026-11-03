import {directionFromVector,type CharacterDirection} from '../character-directions';
import type {TilePoint} from '../types';
export interface WorldRouteActor extends TilePoint{route:TilePoint[];index:number;distance:number;direction:CharacterDirection;moving:boolean}
/** Actual distance budget, foot collision and direction are shared by travelling residents. */
export function advanceWorldRoute(actor:WorldRouteActor,seconds:number,speed:number,fits:(to:TilePoint,from:TilePoint)=>boolean):{arrived:boolean;blocked:boolean;used:number}{
 actor.moving=false;if(!Number.isFinite(seconds)||seconds<=0||!Number.isFinite(speed)||speed<=0)return{arrived:actor.index>=actor.route.length,blocked:false,used:0};
 let budget=speed*seconds,used=0;
 while(budget>1e-6&&actor.index<actor.route.length){
  const p=actor.route[actor.index],dx=p.x-actor.x,dy=p.y-actor.y,d=Math.hypot(dx,dy);if(d<.01){actor.index++;continue;}
  const step=Math.min(d,budget,3),next={x:actor.x+dx/d*step,y:actor.y+dy/d*step};
  if(!fits(next,actor))return{arrived:false,blocked:true,used};
  actor.x=next.x;actor.y=next.y;actor.distance+=step;actor.direction=directionFromVector(Math.abs(dx)<.05?0:dx,Math.abs(dy)<.05?0:dy);actor.moving=true;budget-=step;used+=step/speed;if(step>=d-.001)actor.index++;
 }
 return{arrived:actor.index>=actor.route.length,blocked:false,used};
}
