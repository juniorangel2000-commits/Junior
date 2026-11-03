import {Home,HOME_WIDTH,HOME_HEIGHT} from './home';
import {survivorNavigation} from './survivor-navigation';
import {bridgeAllowsStep} from '../data/bridges';
import {isWaterTile} from '../data/regions';
import {bentoMineDanger,bentoMineEscapeFits,bentoMineRisk} from './bento-mine-safety';
import type {SaveData,TilePoint} from '../types';
import type {BentoTravelArea,BentoTrip} from './bento-travel-state';
import {villageRouteSearch} from './village-walk';
import {villagePointBlocked,villageGround} from '../data/village';
import {cityForestBlockedPoint,cityForestTrailDistance} from '../data/city-forest';
import {lakeBlockedPoint,lakeTrailDistance,lakeElevationAllowsStep,lakeDeckAllowsStep,lakeWater,lakeTerrace,lakeStairs,lakePier,lakeBridge} from '../data/fishing-lake';
import {cabinAllowsStep,cabinFloorPoint} from '../data/fisher-cabin';
import {paintedWaterPoint} from '../data/terrain-paint';
import {highlandBlockedPoint,highlandAllowsStep,highlandDeck} from '../data/highland';
import {UNDERGROUND,inMineEntrance} from '../data/underground-layout';
import {undergroundFits} from './underground';
import {resolveSmithLayout,smithNavigation} from './smith-layout';
export interface BentoNavigation{tile:number;origin:TilePoint;width:number;height:number;fits:(p:TilePoint)=>boolean;allows:(from:TilePoint,to:TilePoint)=>boolean;weight:(x:number,y:number)=>number}
const propertyGeometry=new WeakMap<SaveData,Pick<BentoNavigation,'fits'|'allows'>>();
export function registerBentoPropertyNavigation(save:SaveData,nav:Pick<BentoNavigation,'fits'|'allows'>):()=>void{propertyGeometry.set(save,nav);return()=>{if(propertyGeometry.get(save)===nav)propertyGeometry.delete(save);};}
let smithCache:{signature:string;nav:ReturnType<typeof smithNavigation>}|undefined;
export function bentoSmithNavigation(save:SaveData){const signature=JSON.stringify(save.blacksmithScene??null);if(smithCache?.signature!==signature)smithCache={signature,nav:smithNavigation(resolveSmithLayout(save.blacksmithScene))};return smithCache.nav;}
const foot=(blocked:(x:number,y:number)=>boolean,p:TilePoint)=>[[-7,-5],[7,-5],[-7,3],[7,3]].every(([x,y])=>!blocked(p.x+x,p.y+y));
export interface BentoRouteOptions{mode?:'follow'|'escape';from?:TilePoint;player?:TilePoint;avoid?:TilePoint}
export function bentoMapNavigation(save:SaveData,area:BentoTravelArea,options:BentoRouteOptions={}):BentoNavigation{
 const origin={x:0,y:0},basic={origin,tile:32,width:96,height:72,allows:()=>true,weight:()=>1};
 if(area==='home'){const home=new Home(save.home);return{...basic,tile:8,width:HOME_WIDTH*4,height:HOME_HEIGHT*4,fits:p=>foot((x,y)=>home.isBlocked(Math.floor(x/32),Math.floor(y/32)),p)};}
 if(area==='property'){const blocked=survivorNavigation(save,'property');return{...basic,tile:16,width:192,height:144,fits:p=>foot((x,y)=>blocked(Math.floor(x/32),Math.floor(y/32)),p),allows:(a,b)=>bridgeAllowsStep(a.x,a.y,b.x,b.y,(x,y)=>paintedWaterPoint(save.mapEdits?.terrain,x,y,(x,y)=>isWaterTile(Math.floor(x/32),Math.floor(y/32)))),...propertyGeometry.get(save)};}
 if(area==='shop'){
  const nav=bentoSmithNavigation(save);return{...basic,tile:8,width:72,height:44,fits:p=>!!nav.validPosition?.(p.x,p.y)};
 }
 if(area==='village')return{...basic,fits:p=>foot((x,y)=>villagePointBlocked(x,y,save.villageMapEdits),p),weight:(x,y)=>['paving','path'].includes(villageGround(x,y))?1:2.4};
 if(area==='cityForest')return{...basic,fits:p=>foot((x,y)=>cityForestBlockedPoint(x,y,save.cityForestMapEdits),p),weight:(x,y)=>cityForestTrailDistance(x+.5,y+.5)<1.8?1:3};
 if(area==='fishingLake')return{...basic,tile:16,width:192,height:144,fits:p=>foot((x,y)=>lakeBlockedPoint(x,y,save.fishingLakeMapEdits),p),allows:(a,b)=>cabinAllowsStep(a,b)&&lakeElevationAllowsStep(a,b)&&lakeDeckAllowsStep(a,b,(x,y)=>paintedWaterPoint(save.fishingLakeMapEdits?.terrain,x,y,(x,y)=>lakeWater(x/32,y/32))),weight:(x,y)=>lakeTrailDistance((x+.5)/2,(y+.5)/2)<1.8?1:3};
 if(area==='highland')return{...basic,tile:8,width:192,height:128,fits:p=>foot((x,y)=>highlandBlockedPoint(x,y,save.highlandMapEdits),p),allows:(a,b)=>highlandAllowsStep(a,b,save.highlandMapEdits)};
 const mine=save.underground;
 if(area==='mine')return{...basic,tile:8,width:96,height:64,origin:{x:UNDERGROUND.entryX,y:UNDERGROUND.entryY},fits:p=>!!mine&&inMineEntrance(p.x,p.y)&&p.y>=UNDERGROUND.entryY+158&&undergroundFits(mine,p.x,p.y)};
 if(options.mode==='escape')return{...basic,width:160,height:175,fits:p=>bentoMineEscapeFits(save,p,options.from??p),allows:(a,b)=>bentoMineEscapeFits(save,b,a),weight:(x,y)=>1+bentoMineRisk(save,{x:x*32+16,y:y*32+16})};
 return{...basic,width:160,height:175,fits:p=>!!mine&&p.y<5600&&undergroundFits(mine,p.x,p.y)&&!bentoMineDanger(save,p,options.mode==='follow',options.player)};
}
export function bentoPlayerSpace(save:SaveData):BentoTravelArea|undefined{
 if(save.activeArea==='property')return save.homePosition?'home':'property';
 if(save.activeArea==='highland')return save.mineInterior?save.miningInterior?'mining':'mine':'highland';
 if(save.activeArea==='village')return save.blacksmithInterior?'shop':save.merchantInterior||save.communityInterior?undefined:'village';
 return save.activeArea==='cityForest'||save.activeArea==='fishingLake'?save.activeArea:undefined;
}
/** A loaded/rounded contact may already overlap. Only steps away can separate it. */
function avoidsPlayer(from:TilePoint,to:TilePoint,player:TilePoint,origin=false):boolean{
 const inside=(p:TilePoint)=>Math.abs(p.x-player.x)<19&&Math.abs(p.y-player.y)<13;
 if(!inside(to))return true;
 const dx=to.x-from.x,dy=to.y-from.y;if(origin&&Math.hypot(dx,dy)<.01)return true;
 return inside(from)&&dx*(from.x-player.x)+dy*(from.y-player.y)>1e-6;
}
export function bentoActorFits(save:SaveData,trip:BentoTrip,p:TilePoint,player?:TilePoint,navigation?:BentoNavigation):boolean{
 if(player&&bentoPlayerSpace(save)===trip.area&&!avoidsPlayer(trip,p,player))return false;
 const fisher=save.fisherTravel;if(fisher&&trip.area!=='village'&&fisher.area===trip.area&&Math.abs(p.x-fisher.x)<18&&Math.abs(p.y-fisher.y)<12)return false;
 if(trip.area==='village'||trip.area==='shop')for(const [id,r]of Object.entries(save.villageRoutines??{})){
  if(id==='bento'||id==='damiao'&&save.fisherTravel?.area!=='village')continue;
  if(r.area===(trip.area==='shop'?'shop':'village')&&(trip.area!=='shop'||(r.roomOwner??id)==='bento')&&Math.abs(p.x-r.x)<18&&Math.abs(p.y-r.y)<12)return false;
 }
 return (navigation??bentoMapNavigation(save,trip.area)).fits(p);
}
/** Substeps validate narrow stair/deck portals between A* cell centres. */
export function bentoSegment(nav:BentoNavigation,a:TilePoint,b:TilePoint):boolean{
 const distance=Math.hypot(b.x-a.x,b.y-a.y),steps=Math.max(1,Math.ceil(distance/3));let from=a;
 for(let i=1;i<=steps;i++){const p={x:a.x+(b.x-a.x)*i/steps,y:a.y+(b.y-a.y)*i/steps};if(!nav.fits(p)||!nav.allows(from,p))return false;from=p;}return true;
}
export function* bentoRouteSearch(save:SaveData,area:BentoTravelArea,from:TilePoint,to:TilePoint,options:BentoRouteOptions={}):Generator<undefined,TilePoint[],void>{
 const geometry=bentoMapNavigation(save,area,options),base={...geometry,fits:(p:TilePoint)=>geometry.fits(p)&&(!options.avoid||avoidsPlayer(from,p,options.avoid,true))},fitsCache=new Map<string,boolean>(),nav={...base,fits:(p:TilePoint)=>{const key=p.x+','+p.y;if(!fitsCache.has(key))fitsCache.set(key,base.fits(p));return fitsCache.get(key)!;}};
 const tile=nav.tile,origin=nav.origin;
 if(!nav.fits(from)||!nav.fits(to))return[];
 if(bentoSegment(nav,from,to))return[{...to}];
 const center=(x:number,y:number)=>({x:(x+.5)*tile+origin.x,y:(y+.5)*tile+origin.y}),start={x:(from.x-origin.x)/tile,y:(from.y-origin.y)/tile},goal={x:(to.x-origin.x)/tile,y:(to.y-origin.y)/tile};
 const edgeCache=new Map<string,boolean>();
 const lakeClass=(p:TilePoint)=>(lakeTerrace(p.x/32,p.y/32)?1:0)|(lakeStairs(p.x/32,p.y/32)?2:0)|(lakePier(p.x/32,p.y/32)?4:0)|(lakeBridge(p.x/32,p.y/32)?8:0)|(cabinFloorPoint(p.x,p.y)?16:0);
 const edge=(a:TilePoint,b:TilePoint)=>{
  if(area==='village'||area==='cityForest')return true;
  const p=center(a.x,a.y),q=center(b.x,b.y);
  if(area==='fishingLake'&&lakeClass(p)===lakeClass(q)||area==='highland'&&highlandDeck(p.x,p.y,save.highlandMapEdits)===highlandDeck(q.x,q.y,save.highlandMapEdits))return nav.fits({x:(p.x+q.x)/2,y:(p.y+q.y)/2});
  const first=a.y*nav.width+a.x,last=b.y*nav.width+b.x,key=options.mode==='escape'?first+':'+last:Math.min(first,last)+':'+Math.max(first,last);if(edgeCache.has(key))return edgeCache.get(key)!;
  let result=true;
  if(area==='home'||area==='property'||area==='shop'||area==='mine'||area==='mining'||area==='fishingLake')result=bentoSegment(nav,p,q);
  else{const distance=Math.hypot(q.x-p.x,q.y-p.y),steps=Math.ceil(distance/3);let from=p;for(let i=1;i<=steps;i++){const to={x:p.x+(q.x-p.x)*i/steps,y:p.y+(q.y-p.y)*i/steps};if(!nav.allows(from,to)){result=false;break;}from=to;}}
  edgeCache.set(key,result);return result;
 };
 const occupied=(x:number,y:number)=>{const p=center(x,y);if(!nav.fits(p))return true;if(area!=='village'||x===Math.floor(goal.x)&&y===Math.floor(goal.y))return false;return[[-8,-8],[8,-8],[-8,8],[8,8]].some(([dx,dy])=>!nav.fits({x:p.x+dx,y:p.y+dy}));};
 const found=yield* villageRouteSearch(start,goal,occupied,nav.weight,nav,edge);const path=found.map(p=>center(p.x,p.y));
 if(!path.length)return[];if(!bentoSegment(nav,from,path[0])||!bentoSegment(nav,path[path.length-1],to))return[];
 path.push({...to});return path;
}

export function bentoRoute(save:SaveData,area:BentoTravelArea,from:TilePoint,to:TilePoint,options:BentoRouteOptions={}):TilePoint[]{const search=bentoRouteSearch(save,area,from,to,options);let step=search.next();while(!step.done)step=search.next();return step.value;}
const searches=new WeakMap<SaveData,{key:string;search:Generator<undefined,TilePoint[],void>}>();
/** Bounded A*: 32 expansions normally, up to 128 for an emergency retreat. */
export function planBentoRoute(save:SaveData,trip:BentoTrip,goal:TilePoint,options:BentoRouteOptions={}):{planning:true}|{planning:false;route:TilePoint[]}{
 const key=[options.mode??'normal',options.avoid?Math.floor(options.avoid.x/16)+','+Math.floor(options.avoid.y/16):'',trip.area,trip.leg,trip.x,trip.y,goal.x,goal.y,save.underground?.revision??0].join(':');let active=searches.get(save);
 if(active?.key!==key){active={key,search:bentoRouteSearch(save,trip.area,trip,goal,options)};searches.set(save,active);}
 for(let batch=0;batch<(options.mode==='escape'?4:1);batch++){const step=active.search.next();if(step.done){searches.delete(save);return{planning:false,route:step.value};}}return{planning:true};
}
