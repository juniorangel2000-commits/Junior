export interface WaterSchool {x:number;y:number}
export type WaterContains=(x:number,y:number)=>boolean;
const clear=(x:number,y:number,water:WaterContains)=>[[0,0],[-20,0],[20,0],[0,-20],[0,20]].every(([dx,dy])=>water(x+dx,y+dy));
/** Stable, sparse schools chosen from actual deep-water pixels in each map. */
export function waterSchools(water:WaterContains):WaterSchool[]{
 const candidates:WaterSchool[]=[];
 for(let y=48;y<2256;y+=64)for(let x=48;x<3024;x+=64)if(clear(x,y,water))candidates.push({x,y});
 const hash=(p:WaterSchool)=>(Math.imul(p.x,73856093)^Math.imul(p.y,19349663))>>>0;candidates.sort((a,b)=>hash(a)-hash(b));
 const chosen:WaterSchool[]=[];for(const p of candidates)if(chosen.every(q=>Math.hypot(p.x-q.x,p.y-q.y)>180)){chosen.push(p);if(chosen.length===12)break;}return chosen;
}
export function waterFish(time:number,schools:WaterSchool[],water:WaterContains){
 const result:Array<{x:number;y:number;angle:number;alpha:number;size:number}>=[];
 for(const[s,p]of schools.entries())for(let n=0;n<3;n++){
  const t=time*.00008+s*1.7+n*.22,x=p.x+Math.cos(t)*28+(n-1)*8,y=p.y+Math.sin(t)*18+(n%2)*7;
  if(clear(x,y,water))result.push({x,y,angle:Math.atan2(18*Math.cos(t),-28*Math.sin(t)),alpha:.27+Math.sin(time*.00035+s*3+n)*.055,size:.9+(s+n)%4*.1});
 }return result;
}
