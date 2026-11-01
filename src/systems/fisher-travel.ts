import type {SaveData} from '../types';
import {CHARACTER_DIRECTIONS,directionFromVector,type CharacterDirection} from '../character-directions';
import {CABIN_FISHER_STOP,CABIN_FISHER_EXIT} from '../data/fisher-cabin';
import {LAKE_CITY_ENTRY,LAKE_CITY_EXIT,CITY_LAKE_ENTRY,CITY_LAKE_EXIT,lakeBlockedPoint,lakeTrailDistance} from '../data/fishing-lake';
import {CITY_FOREST_ENTRY,CITY_FOREST_EXIT,VILLAGE_NORTH_ARRIVAL,cityForestBlockedPoint,cityForestTrailDistance} from '../data/city-forest';
import {LAKE_FISHER_WALK,lakeFisherPose} from './lake-fisher';
import {villageRoute} from './village-walk';
type Point={x:number;y:number};
export interface FisherTravel extends Point {day:number;area:'village'|'cityForest'|'fishingLake';mode:'village'|'lake'|'to-lake'|'to-village';route:Point[];index:number;routeTime:number;direction:CharacterDirection;distance:number;moving:boolean}
const SPEED=36;
export function validFisherTravel(value:unknown):value is FisherTravel {
 if(!value||typeof value!=='object')return false;const s=value as FisherTravel;
 const point=(p:Point)=>!!p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=0&&p.x<=3072&&p.y>=0&&p.y<=2304;
 return point(s)&&Number.isSafeInteger(s.day)&&s.day>=1&&s.day<=999999&&['village','cityForest','fishingLake'].includes(s.area)&&['village','lake','to-lake','to-village'].includes(s.mode)&&CHARACTER_DIRECTIONS.includes(s.direction)&&typeof s.moving==='boolean'&&Number.isFinite(s.distance)&&s.distance>=0&&Number.isFinite(s.routeTime)&&s.routeTime>=0&&Array.isArray(s.route)&&s.route.length<=4000&&s.route.every(point)&&Number.isInteger(s.index)&&s.index>=0&&s.index<=s.route.length&&(s.mode!=='lake'||s.area==='fishingLake')&&(s.mode!=='village'||s.area==='village');
}
const center=(p:Point)=>({x:(p.x+.5)*32,y:(p.y+.5)*32});
export function ensureFisherTravel(save:SaveData):FisherTravel {
 if(save.fisherTravel)return save.fisherTravel;
 const lake=save.damiaoIntroduction===false||save.time>=480&&save.time<690,p=save.damiaoIntroduction===false?CABIN_FISHER_STOP:lakeFisherPose(save.time);
 return save.fisherTravel={day:save.day,area:lake?'fishingLake':'village',mode:lake?'lake':'village',...(lake?p:{x:0,y:0}),route:[],index:0,routeTime:save.damiaoIntroduction===false?480:save.time,direction:'down',distance:0,moving:false};
}
function clear(save:SaveData,area:FisherTravel['area'],p:Point):boolean {
 return [[-7,-5],[7,-5],[-7,3],[7,3]].every(([x,y])=>area==='fishingLake'?!lakeBlockedPoint(p.x+x,p.y+y,save.fishingLakeMapEdits):!cityForestBlockedPoint(p.x+x,p.y+y,save.cityForestMapEdits));
}
function path(save:SaveData,area:FisherTravel['area'],from:Point,to:Point):Point[]{
 const goal={x:Math.floor(to.x/32),y:Math.floor(to.y/32)};
 if(Math.floor(from.x/32)===goal.x&&Math.floor(from.y/32)===goal.y)return [to];
 return villageRoute({x:from.x/32,y:from.y/32},goal,(x,y)=>!clear(save,area,center({x,y})),(x,y)=>(area==='fishingLake'?lakeTrailDistance(x+.5,y+.5):cityForestTrailDistance(x+.5,y+.5))<1.8?1:3).map(center);
}
function leg(s:FisherTravel,area:FisherTravel['area'],from:Point,route:Point[]):void {s.area=area;s.x=from.x;s.y=from.y;s.route=route;s.index=0;s.moving=false;}
function cabinDeparture(save:SaveData,s:FisherTravel):Point[]{
 let index=0,best=Infinity;LAKE_FISHER_WALK.forEach((p,i)=>{const d=Math.hypot(p.x-s.x,p.y-s.y);if(d<best){best=d;index=i;}});
 const outside=CABIN_FISHER_EXIT.length-1;
 const approach=index<outside?LAKE_FISHER_WALK.slice(index,outside+1):LAKE_FISHER_WALK.slice(outside,index+1).reverse();
 const start=approach.at(-1)!;const exit=path(save,'fishingLake',start,center(LAKE_CITY_EXIT));
 return exit.length?[...approach,...exit]:[];
}
/** Only called after the village routine has physically reached the northern passage. */
export function beginFisherLakeTrip(save:SaveData):void {
 const s=ensureFisherTravel(save),from=center(CITY_FOREST_ENTRY);s.mode='to-lake';s.day=save.day;
 leg(s,'cityForest',from,path(save,'cityForest',from,center(CITY_LAKE_EXIT)));
}
/** Shared by visible and background maps: crossing a clock boundary never changes coordinates. */
export function advanceFisherTravel(save:SaveData,seconds:number,player?:Point):void {
 const s=ensureFisherTravel(save);s.moving=false;if(!Number.isFinite(seconds)||seconds<=0||s.mode==='village')return;
 const dt=Math.min(seconds,.1);
 const fits=(p:Point)=>clear(save,s.area,p)&&!(save.activeArea===s.area&&player&&Math.abs(p.x-player.x)<17&&Math.abs(p.y-player.y)<11);
 if(s.mode==='lake'){
  if(save.damiaoIntroduction===false)return;
  if(save.time<690){const p=lakeFisherPose(s.routeTime+dt);if(fits(p)){s.routeTime+=dt;s.distance+=Math.hypot(p.x-s.x,p.y-s.y);s.x=p.x;s.y=p.y;s.direction=p.direction;s.moving=p.moving;}return;}
  const route=cabinDeparture(save,s);if(!route.length)return;s.mode='to-village';s.route=route;s.index=0;
 }
 if(!s.route.length)return; // A blocked passage never becomes an instant transfer.
 let budget=SPEED*dt;
 while(budget>0&&s.index<s.route.length){const p=s.route[s.index],dx=p.x-s.x,dy=p.y-s.y,d=Math.hypot(dx,dy);if(d<.01){s.index++;continue;}const step=Math.min(d,budget),next={x:s.x+dx/d*step,y:s.y+dy/d*step};if(!fits(next))return;s.x=next.x;s.y=next.y;s.direction=directionFromVector(dx,dy);s.distance+=step;s.moving=true;budget-=step;if(step>=d-.001)s.index++;}
 if(s.index<s.route.length)return;
 if(s.area==='fishingLake'&&s.mode==='to-village'){const from=center(CITY_LAKE_ENTRY);leg(s,'cityForest',from,path(save,'cityForest',from,center(CITY_FOREST_EXIT)));}
 else if(s.area==='cityForest'&&s.mode==='to-lake'){const from=center(LAKE_CITY_ENTRY),outside=CABIN_FISHER_EXIT.at(-1)!;const route=path(save,'fishingLake',from,outside);leg(s,'fishingLake',from,route.length?[...route,...CABIN_FISHER_EXIT.slice(0,-1).reverse()]:[]);}
 else if(s.area==='fishingLake'){s.mode='lake';s.routeTime=480;s.route=[];s.index=0;}
 else if(s.area==='cityForest'){
  const from=center(VILLAGE_NORTH_ARRIVAL);leg(s,'village',from,[]);s.mode='village';
  const r=save.villageRoutines?.damiao;if(r){Object.assign(r,from,{area:'village',direction:'down',wait:0,updatedAt:save.day*1440+save.time});delete r.roomOwner;}
 }
}
