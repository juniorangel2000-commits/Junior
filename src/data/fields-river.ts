import {riverBanksAt} from './property-water';
import {TILE,WORLD_HEIGHT} from './world-size';

export const FIELDS_COAST_EXIT={x:28,y:70};
export const FIELDS_COAST_RETURN={x:28,y:68};
export const COAST_ENTRY={x:28,y:4};
export const COAST_EXIT={x:28,y:1};
export const coastApproach=(x:number,y:number)=>Math.abs(x-28)<=2&&y<=7;
export const fieldsCoastApproach=(x:number,y:number)=>Math.abs(x-912)<88&&y>2130;

type Banks={left:number;right:number};
const start=riverBanksAt(WORLD_HEIGHT*TILE);
const startCenter=(start.left+start.right)/2,startHalf=(start.right-start.left)/2;
const fieldsChannel=[
  [0,startCenter,startHalf],[325,1710,76],[680,1950,82],[1000,2130,94],
  [1410,2120,90],[1740,1700,82],[2020,1590,89],[2304,1615,91],
] as const;
const coastChannel=[
  [0,1615,91],[270,1680,90],[540,1560,100],[815,1710,119],
  [1080,1950,206],[1395,1975,257],[1730,1910,285],[2304,1960,340],
] as const;
function channelAt(rows:readonly (readonly [number,number,number])[],y:number):Banks{
  const rightRow=rows.findIndex(([row],i)=>i>0&&row>=y);
  const i=rightRow===-1?rows.length-1:rightRow;
  const [a,ax,ar]=rows[i-1],[b,bx,br]=rows[i];
  const t=Math.max(0,Math.min(1,(y-a)/(b-a))),smooth=t*t*(3-2*t);
  const center=ax+(bx-ax)*smooth,half=ar+(br-ar)*smooth;
  return {left:center-half,right:center+half};
}
export const fieldsRiverBanksAt=(y:number)=>channelAt(fieldsChannel,y);
export const coastRiverBanksAt=(y:number)=>channelAt(coastChannel,y);
const rows=Array.from({length:2305},(_,y)=>fieldsRiverBanksAt(y+.5));
export function fieldsRiverDistance(x:number,y:number):number{
  const row=rows[Math.max(0,Math.min(2304,Math.floor(y)))];
  return Math.max(row.left-x,x-row.right);
}
export const fieldsRiverWater=(x:number,y:number)=>fieldsRiverDistance(x,y)<0;
export const FIELDS_RIVER_BRIDGES=[{id:'fields-upper',x:62,y:30,width:8,height:2},{id:'fields-lower',x:51,y:52,width:8,height:2}] as const;
export function fieldsBridge(x:number,y:number){
  return FIELDS_RIVER_BRIDGES.find(b=>x>=b.x*TILE&&x<(b.x+b.width)*TILE&&y>=b.y*TILE&&y<(b.y+b.height)*TILE);
}
export const fieldsSwimmingWater=(x:number,y:number)=>fieldsRiverWater(x,y)&&!fieldsBridge(x,y);
export function fieldsAllowsStep(from:{x:number;y:number},to:{x:number;y:number}):boolean{
  const before=fieldsBridge(from.x,from.y),after=fieldsBridge(to.x,to.y);
  if(before===after)return true;
  const bank=before?to:from,bridge=before??after!;
  return !fieldsRiverWater(bank.x,bank.y)&&(bank.x<bridge.x*TILE||bank.x>=(bridge.x+bridge.width)*TILE);
}
