import type {MapEditData} from '../systems/map-editor';
import {paintedWaterPoint} from './terrain-paint';
import {lakeWater,lakeWaterDistance,lakePier,lakeBridge,lakeCliff,lakeObjects} from './fishing-lake';
const SCHOOLS=[[36,36],[55,44],[65,33],[41,52],[25,46]] as const;
export interface LakeFishShadow {id:number;x:number;y:number;angle:number;size:number;alpha:number}
/** Small, slow schools beneath the surface. Never cross shores, docks or painted land. */
export function lakeFishShadows(time:number,edits?:MapEditData):LakeFishShadow[]{
 const result:LakeFishShadow[]=[];
 const rocks=lakeObjects(edits).filter(p=>p.kind.startsWith('lakeRock')||p.kind==='shoreStones');
 for(const[school,[cx,cy]]of SCHOOLS.entries())for(let fish=0;fish<3;fish++){
  const id=school*3+fish,t=time*.00008+school*1.7+fish*.22;
  const x=cx+Math.cos(t)*2.4+(fish-1)*.5,y=cy+Math.sin(t)*1.5+(fish%2)*.55;
  if(lakeWaterDistance(x,y)>-1.4||lakePier(x,y)||lakeBridge(x,y)||lakeCliff(x,y)||!paintedWaterPoint(edits?.terrain,x*32,y*32,(px,py)=>lakeWater(px/32,py/32))||rocks.some(p=>Math.hypot(p.x+.5-x,p.y+.5-y)<1.6))continue;
  result.push({id,x:x*32,y:y*32,angle:Math.atan2(1.5*Math.cos(t),-2.4*Math.sin(t)),size:1.05+(id%4)*.1,alpha:.27+Math.sin(time*.00035+id)*.055});
 }
 return result;
}
