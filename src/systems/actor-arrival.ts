export interface ArrivalPoint{x:number;y:number}
/** Shared foot box. Search nearby free positions instead of placing two actors
 * on the same doorway anchor or moving either actor through a wall. */
export const actorsOverlap=(a:ArrivalPoint,b:ArrivalPoint)=>Math.abs(a.x-b.x)<20&&Math.abs(a.y-b.y)<12;
export function freeArrival(preferred:ArrivalPoint,blocked:(x:number,y:number)=>boolean,actors:readonly ArrivalPoint[]):ArrivalPoint|null{
 const free=(p:ArrivalPoint)=>[[-7,-5],[7,-5],[-7,3],[7,3]].every(([dx,dy])=>!blocked(p.x+dx,p.y+dy))&&!actors.some(a=>actorsOverlap(p,a)||Math.floor(a.x/32)===Math.floor(p.x/32)&&Math.floor(a.y/32)===Math.floor(p.y/32));
 if(free(preferred))return{x:preferred.x,y:preferred.y};
 for(let radius=16;radius<=112;radius+=8){const candidates:ArrivalPoint[]=[];for(let dy=-radius;dy<=radius;dy+=8)for(let dx=-radius;dx<=radius;dx+=8)if(Math.max(Math.abs(dx),Math.abs(dy))===radius)candidates.push({x:preferred.x+dx,y:preferred.y+dy});candidates.sort((a,b)=>Math.hypot(a.x-preferred.x,a.y-preferred.y)-Math.hypot(b.x-preferred.x,b.y-preferred.y));const point=candidates.find(free);if(point)return point;}
 return null;
}
