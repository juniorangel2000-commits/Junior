import { HOMESTEAD_HOUSE } from './property-homestead';
import { buildingFootprint } from '../systems/building';
import type { BuildingData } from '../types';
import type { PetShelterData } from '../systems/pet-shelter';
export interface LandscapePoint { x:number; y:number }
export function mountainLayout(site:Pick<PetShelterData,'x'|'y'>){
  return {x:(HOMESTEAD_HOUSE.x+site.x)/2,baseY:Math.min(288,site.y-64),width:1600};
}
/** The irregular low front edge stays behind the kennel and its entire yard. */
export function mountainSolid(site:Pick<PetShelterData,'x'|'y'>,x:number,y:number):boolean{
  const plan=mountainLayout(site),t=(x-plan.x)/(plan.width/2);
  if(Math.abs(t)>.94||y<24)return false;
  const edge=plan.baseY-8-22*Math.pow(Math.abs(t),1.5)+5*Math.sin(t*11);
  return y<edge;
}
export function mountainFits(site:Pick<PetShelterData,'x'|'y'>,buildings:readonly BuildingData[],prepared:readonly LandscapePoint[]=[]):boolean{
  return ![...buildings.flatMap(buildingFootprint),...prepared].some(p=>mountainSolid(site,p.x*32+16,p.y*32+16));
}
const paths=new Map<string,readonly LandscapePoint[]>();
export function homesteadPetPath(site:Pick<PetShelterData,'x'|'y'>):readonly LandscapePoint[]{
 const key=`${site.x}:${site.y}`,cached=paths.get(key);if(cached)return cached;
 const a={x:HOMESTEAD_HOUSE.x+24,y:HOMESTEAD_HOUSE.y+20};
 const join={x:HOMESTEAD_HOUSE.x+134,y:HOMESTEAD_HOUSE.y+4};
 const curves=[
  [a,{x:a.x+40,y:a.y+12},{x:join.x-18,y:join.y+28},join],
  [join,{x:join.x+16,y:join.y-28},{x:Math.max(site.x-20,HOMESTEAD_HOUSE.x+120),y:site.y+90},{x:site.x,y:site.y+18}],
 ];
 const points=curves.flatMap(([a,b,c,d],curve)=>Array.from({length:curve?40:25},(_,i)=>{
  const t=curve?(i+1)/40:i/24,u=1-t;
  return{x:u*u*u*a.x+3*u*u*t*b.x+3*u*t*t*c.x+t*t*t*d.x,y:u*u*u*a.y+3*u*u*t*b.y+3*u*t*t*c.y+t*t*t*d.y};
 }));
 paths.set(key,points);return points;
}
export function onHomesteadPetPath(site:Pick<PetShelterData,'x'|'y'>,x:number,y:number):boolean{
 return homesteadPetPath(site).some(p=>Math.hypot(p.x-x,p.y-y)<22);
}
