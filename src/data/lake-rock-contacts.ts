import {LAKE_RIDGE} from './fishing-lake';
import {LAKE_CASCADE} from './lake-water-motion';

/** Footprints in the original mountain sprite, not full white rings baked into the art. */
export const LAKE_SHORE_ROCKS=[
 {id:'left-upper',x:867,y:801,rx:33,ry:13},
 {id:'left-middle',x:818,y:827,rx:22,ry:10},
 {id:'left-low',x:762,y:856,rx:37,ry:18},
 {id:'left-front',x:788,y:882,rx:24,ry:12},
 {id:'left-pebble',x:860,y:835,rx:14,ry:7},
 {id:'left-chip',x:817,y:850,rx:7,ry:3},
 {id:'right-upper',x:1072,y:795,rx:31,ry:12},
 {id:'right-middle',x:1114,y:814,rx:27,ry:12},
 {id:'right-low',x:1155,y:839,rx:28,ry:11},
 {id:'right-front',x:1197,y:863,rx:38,ry:18},
 {id:'right-pebble',x:1092,y:832,rx:12,ry:5},
 {id:'right-chip',x:1145,y:867,rx:12,ry:5},
] as const;
export const ridgePoint=(x:number,y:number)=>({x:LAKE_RIDGE.x+x*LAKE_RIDGE.width/1536,y:LAKE_RIDGE.y+y*LAKE_RIDGE.height/1024});
/** Only the old cyan/white marks adjacent to a rock foot; brown stone stays intact. */
export function rockWatermarkPixel(x:number,y:number,r:number,g:number,b:number,a:number):boolean {
 if(a<120||r<60||g<80||b<85||b<r*.9||g<r*.95||b<g*.8)return false;
 return LAKE_SHORE_ROCKS.some(p=>Math.abs(x-p.x)<p.rx+10&&y>=p.y-p.ry*.9-4&&y<=p.y+p.ry+7);
}
export function lakeShoreRockBody(x:number,y:number):boolean {
 const sx=(x-LAKE_RIDGE.x)*1536/LAKE_RIDGE.width,sy=(y-LAKE_RIDGE.y)*1024/LAKE_RIDGE.height;
 return LAKE_SHORE_ROCKS.some(p=>((sx-p.x)/(p.rx*1.02))**2+((sy-(p.y-p.ry))/(p.ry*2))**2<=1);
}
export interface WaterContactSegment {x1:number;y1:number;x2:number;y2:number;alpha:number;kind:'contact'|'wake'|'current';rock?:string}
type Water=(x:number,y:number)=>boolean;
function append(segments:WaterContactSegment[],a:{x:number;y:number},b:{x:number;y:number},water:Water,alpha:number,kind:WaterContactSegment['kind'],rock?:string):void {
 if([a,b,{x:(a.x+b.x)/2,y:(a.y+b.y)/2}].every(p=>water(p.x,p.y)))segments.push({x1:a.x,y1:a.y,x2:b.x,y2:b.y,alpha,kind,rock});
}
/** Contact and wake geometry is clipped to actual water, never painted land. */
export function lakeRockWaterContacts(time:number,water:Water):WaterContactSegment[]{
 const segments:WaterContactSegment[]=[],seconds=time/1000;
 for(const[index,p]of LAKE_SHORE_ROCKS.entries()){
  const phase=(seconds*.32+index*.37)%1;
  for(const kind of ['contact','wake'] as const){
   const spread=kind==='contact'?1:1.05+phase*.35,extra=kind==='contact'?1.5:3+phase*5;
   for(let i=0;i<26;i++){
    if(kind==='wake'&&(i+index)%7<3)continue;
    const a=.08+i/26*(Math.PI-.16),b=.08+(i+1)/26*(Math.PI-.16);
    const point=(angle:number)=>ridgePoint(p.x+Math.cos(angle)*(p.rx*spread+extra),p.y+Math.sin(angle)*(p.ry*spread+extra*.45));
    if(kind==='wake'){
     const foot=(angle:number)=>ridgePoint(p.x+Math.cos(angle)*(p.rx+1.5),p.y+Math.sin(angle)*(p.ry+.675));
     if(![foot(a),foot(b),foot((a+b)/2)].every(p=>water(p.x,p.y)))continue;
    }
    append(segments,point(a),point(b),water,kind==='contact'?.19+Math.sin(seconds*2+index+i*.35)*.055:(1-phase)*.2,kind,p.id);
   }
  }
 }
 return segments;
}
/** Short, broken waves and small eddies radiate away from the approved falling water. */
export function lakeImpactDisturbance(time:number,water:Water):WaterContactSegment[]{
 const result:WaterContactSegment[]=[],seconds=time/1000,cx=LAKE_CASCADE.x,cy=LAKE_CASCADE.bottom+10;
 const clear=(x:number,y:number)=>water(x,y)&&!lakeShoreRockBody(x,y);
 for(let ring=0;ring<7;ring++){
  const phase=(seconds*.3+ring/7)%1,rx=18+phase*118,ry=5+phase*33;
  for(let i=0;i<60;i++){
   if((i+ring*7)%17<6)continue;
   const point=(n:number)=>{const angle=.12+n/60*2.9;return{x:cx+Math.cos(angle)*rx+Math.sin(seconds*1.4+ring)*2,y:cy+Math.sin(angle)*ry+Math.sin(n*.43+seconds*2)*.7};};
   append(result,point(i),point(i+1),clear,Math.sin(phase*Math.PI)*.26,'current');
  }
 }
 // Two gentle opposing eddies merge with the outgoing waves.
 for(let side=0;side<2;side++)for(let i=0;i<34;i++){
  const point=(n:number)=>{const angle=n/34*Math.PI*1.55+seconds*.6*(side?1:-1),r=12+n/34*18;return{x:cx+(side?61:-61)+Math.cos(angle)*r,y:cy+27+Math.sin(angle)*r*.33};};
  append(result,point(i),point(i+1),clear,.09,'current');
 }
 return result;
}
