import contour from './homestead-mountain-contour.json';
import {riverBanksAt} from './property-water';
import { HOMESTEAD_HOUSE } from './property-homestead';
import { buildingFootprint } from '../systems/building';
import type { BuildingData } from '../types';
import type { PetShelterData } from '../systems/pet-shelter';
export interface LandscapePoint { x:number; y:number }
interface MountainPlan {x:number;baseY:number;width:number}
interface MountainPiece {art:(typeof contour.panels)[number];x:number;y:number;width:number}
const mountainPlans=new Map<string,MountainPlan>();
const mountainModules=new Map<string,readonly MountainPiece[]>();
export function mountainLayout(site:Pick<PetShelterData,'x'|'y'>):MountainPlan{
  const key=`${site.x}:${site.y}`,cached=mountainPlans.get(key);if(cached)return cached;
  const width=1480,baseY=Math.min(328,site.y-24);
  let dryRight=Infinity;
  for(let y=0;y<=baseY;y+=8)dryRight=Math.min(dryRight,riverBanksAt(y).left-48);
  const x=Math.min((HOMESTEAD_HOUSE.x+site.x)/2-350,dryRight-width/2);
  const plan={x,baseY,width};mountainPlans.set(key,plan);return plan;
}
/** Overlapping modules retain fine native detail instead of enlarging one panorama. */
export function mountainPieces(site:Pick<PetShelterData,'x'|'y'>):readonly MountainPiece[]{
  const key=`${site.x}:${site.y}`,cached=mountainModules.get(key);if(cached)return cached;
  const plan=mountainLayout(site),width=plan.width*.575,left=plan.x-plan.width/2;
  let westEdge=Infinity,eastEdge=-Infinity;
  for(let y=0;y<=plan.baseY;y+=8){const bank=riverBanksAt(y);westEdge=Math.min(westEdge,bank.left-28);eastEdge=Math.max(eastEdge,bank.right+28);}
  const eastWidth=Math.min(760,2320-eastEdge);
  const pieces:MountainPiece[]=[
    {art:contour.panels[1],x:left+width/2,y:plan.baseY-160,width},
    {art:contour.panels[0],x:left+plan.width-width/2,y:plan.baseY-160,width},
    {art:contour.panels[0],x:left+width/2,y:plan.baseY,width},
    {art:contour.panels[1],x:left+plan.width-width/2,y:plan.baseY,width},
    // A lower terrace approaches the west bank without covering its sandy margin.
    {art:contour.panels[0],x:westEdge-180,y:plan.baseY,width:360},
    // The opposite bank forms a second ridge; the existing river remains open.
    {art:contour.panels[0],x:eastEdge+eastWidth/2,y:plan.baseY-150,width:eastWidth},
    {art:contour.panels[1],x:eastEdge+eastWidth/2,y:plan.baseY,width:eastWidth},
  ];
  mountainModules.set(key,pieces);return pieces;
}
/** The front edge follows the opaque silhouette of the actual mountain sprite. */
export function mountainFrontAt(site:Pick<PetShelterData,'x'|'y'>,x:number):number {
  let edge=-Infinity;
  for(const piece of mountainPieces(site)){
    const {art}=piece,pixel=(x-(piece.x-piece.width/2))/piece.width*art.crop.width;
    if(pixel<0||pixel>=art.crop.width)continue;
    const front=art.front[Math.floor(pixel/art.columnWidth)];
    if(front)edge=Math.max(edge,piece.y+(front-art.crop.height)*piece.width/art.crop.width+6);
  }
  return edge;
}
export function mountainSolid(site:Pick<PetShelterData,'x'|'y'>,x:number,y:number):boolean{
  return y>=24&&y<mountainFrontAt(site,x);
}
/** Tile navigation is conservative; player movement still uses the precise point contour. */
export function mountainSolidTile(site:Pick<PetShelterData,'x'|'y'>,x:number,y:number):boolean {
  if((y+1)*32<=24)return false;
  let front=-Infinity;
  for(let dx=0;dx<32;dx+=4)front=Math.max(front,mountainFrontAt(site,x*32+dx));
  return y*32<front;
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
