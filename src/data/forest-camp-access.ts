/** A discreet dry passage west of the lake; no terrain paint or new road. */
export const FOREST_CAMP_EXIT={x:35,y:2};
export const FOREST_CAMP_RETURN={x:35,y:5};
export const CAMP_APPROACH=[{x:1200,y:464},{x:1172,y:368},{x:1136,y:272},{x:1136,y:80}] as const;
export function campApproachDistance(x:number,y:number):number {
 let best=Infinity;for(let i=1;i<CAMP_APPROACH.length;i++){const a=CAMP_APPROACH[i-1],b=CAMP_APPROACH[i],dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/(dx*dx+dy*dy)));best=Math.min(best,Math.hypot(x-a.x-t*dx,y-a.y-t*dy));}return best;
}
export const forestCampFootprints=()=>Array.from({length:7},(_,i)=>{const t=i/6,d=t*3,index=Math.min(2,Math.floor(d)),p=d-index,a=CAMP_APPROACH[index],b=CAMP_APPROACH[index+1];return{x:a.x+(b.x-a.x)*p,y:a.y+(b.y-a.y)*p};});
