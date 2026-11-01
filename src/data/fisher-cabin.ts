import {pointInPolygon} from './architecture-collision';

/** Coordinates in the approved 1448 × 1086 artwork, kept at one fixed scale. */
export const FISHER_CABIN={x:77*32,y:20*32,scale:432/1448,width:432,height:1086*432/1448,texture:'lake-fisher-cabin',file:'assets/visual/fishing-lake/fisher-cabin.png'};
export const cabinPoint=(x:number,y:number)=>({x:FISHER_CABIN.x+x*FISHER_CABIN.scale,y:FISHER_CABIN.y+y*FISHER_CABIN.scale});
const local=(x:number,y:number)=>({x:(x-FISHER_CABIN.x)/FISHER_CABIN.scale,y:(y-FISHER_CABIN.y)/FISHER_CABIN.scale});
const walls=[[350,450],[700,350],[1240,510],[1240,657],[950,758],[350,585]] as const;
const deck=[[180,620],[350,580],[950,750],[1240,650],[1320,725],[835,885],[150,700]] as const;
const stairs=[[525,787],[710,840],[625,1055],[430,988]] as const;
const rails=[[[150,700],[490,798]],[[700,851],[835,890]],[[835,890],[1325,730]],[[150,700],[170,580]]] as const;
function segmentDistance(x:number,y:number,a:readonly number[],b:readonly number[]):number{
 const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy)));
 return Math.hypot(x-a[0]-dx*t,y-a[1]-dy*t);
}
const raised=(x:number,y:number)=>pointInPolygon(x,y,deck)||pointInPolygon(x,y,stairs);
const atLanding=(x:number,y:number)=>segmentDistance(x,y,stairs[3],stairs[2])<28&&x>stairs[3][0]-8&&x<stairs[2][0]+8;
function edgeSolid(x:number,y:number):boolean{
 if(raised(x,y)||atLanding(x,y))return false;
 return [deck,stairs].some(polygon=>polygon.some((a,i)=>segmentDistance(x,y,a,polygon[(i+1)%polygon.length])<12));
}
/** A raised platform has one portal: the bottom of the staircase. */
export function cabinAllowsStep(from:{x:number;y:number},to:{x:number;y:number}):boolean{
 const a=local(from.x,from.y),b=local(to.x,to.y);
 return raised(a.x,a.y)===raised(b.x,b.y)||atLanding(a.x,a.y)&&atLanding(b.x,b.y);
}
export function cabinSolidPoint(x:number,y:number):boolean{
 const p=local(x,y);return edgeSolid(p.x,p.y)||pointInPolygon(p.x,p.y,walls)||((p.x-860)/66)**2+((p.y-770)/32)**2<=1||((p.x-430)/65)**2+((p.y-635)/23)**2<=1||rails.some(([a,b])=>segmentDistance(p.x,p.y,a,b)<20);
}
export function cabinFloorPoint(x:number,y:number):boolean{
 const p=local(x,y);return !cabinSolidPoint(x,y)&&(pointInPolygon(p.x,p.y,deck)||pointInPolygon(p.x,p.y,stairs));
}
/** Reserve the complete silhouette, including tree canopies and the approach. */
export function cabinClearing(x:number,y:number):boolean{
 const cx=FISHER_CABIN.x/32+6.75,cy=FISHER_CABIN.y/32+5.3;
 return Math.hypot((x-cx)/8,(y-cy)/6.6)<1||y>28&&y<33.5&&Math.abs(x-83.3)<1.4;
}
const landing=cabinPoint(530,1030);
/** The first exposed section continues the stair's axis before bending to the trail. */
export const CABIN_APPROACH=[cabinPoint(555,955),landing,{x:landing.x-12,y:landing.y+36},{x:landing.x-15,y:landing.y+62},{x:83.5*32,y:32.2*32},{x:84*32,y:33*32}] as const;
export const CABIN_FISHER_STOP=cabinPoint(650,765);
export const CABIN_FISHER_EXIT=[CABIN_FISHER_STOP,cabinPoint(603,825),...CABIN_APPROACH.slice(1)];
export const CABIN_FISHER_ROUTE=[...CABIN_FISHER_EXIT,{x:84*32,y:39*32},{x:82*32,y:46.6*32},{x:79*32,y:46.6*32},{x:67.5*32,y:46.6*32}] as const;
