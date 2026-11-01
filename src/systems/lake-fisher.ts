import {lakeBlockedPoint,lakeTrailDistance} from '../data/fishing-lake';
import {villageRoute} from './village-walk';
import {directionFromVector,type CharacterDirection} from '../character-directions';
import {CABIN_FISHER_ROUTE} from '../data/fisher-cabin';
import {FISHER_LAKE_HOURS,fisherAtLake} from '../data/fisher-schedule';

const clear=(x:number,y:number)=>[[-9,-7],[9,-7],[-9,5],[9,5]].every(([dx,dy])=>!lakeBlockedPoint(x+dx,y+dy));
export const LAKE_FISHER_WALK=(()=>{
 const points=[...CABIN_FISHER_ROUTE.slice(0,4)],anchors=CABIN_FISHER_ROUTE.slice(3);
 points.push({x:(Math.floor(anchors[0].x/32)+.5)*32,y:(Math.floor(anchors[0].y/32)+.5)*32});
 for(let i=1;i<anchors.length;i++){
  const a=points[points.length-1],b=anchors[i];
  const route=villageRoute({x:Math.floor(a.x/32),y:Math.floor(a.y/32)},{x:Math.floor(b.x/32),y:Math.floor(b.y/32)},(x,y)=>!clear((x+.5)*32,(y+.5)*32),(x,y)=>lakeTrailDistance(x+.5,y+.5)<2?1:2.4);
  points.push(...route.map(p=>({x:(p.x+.5)*32,y:(p.y+.5)*32})));
 }
 return points;
})();
const SPEED=36,stops=[...LAKE_FISHER_WALK,...LAKE_FISHER_WALK.slice(0,-1).reverse()];
/** Clock-derived pose prevents the morning routine restarting on every map entry. */
export function lakeFisherPose(time:number):{x:number;y:number;direction:CharacterDirection;phase:number;moving:boolean;visible:boolean}{
 let duration=25+40;for(let i=1;i<stops.length;i++)duration+=Math.hypot(stops[i].x-stops[i-1].x,stops[i].y-stops[i-1].y)/SPEED;
 let elapsed=((Math.max(0,time-FISHER_LAKE_HOURS.start)%duration)+duration)%duration;
 const pose=(p:{x:number;y:number},direction:CharacterDirection='down',phase=0)=>({...p,direction,phase,moving:phase>0,visible:fisherAtLake(time)});
 if(elapsed<25)return pose(stops[0]);elapsed-=25;
 for(let i=1;i<stops.length;i++){
  const a=stops[i-1],b=stops[i],distance=Math.hypot(b.x-a.x,b.y-a.y),seconds=distance/SPEED;
  if(elapsed<seconds){const t=elapsed/seconds;return pose({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t},directionFromVector(b.x-a.x,b.y-a.y),1+Math.floor(elapsed*SPEED/5.3)%8);}
  elapsed-=seconds;
  if(i===LAKE_FISHER_WALK.length-1){if(elapsed<40)return pose(b,'left');elapsed-=40;}
 }
 return pose(stops[0]);
}
