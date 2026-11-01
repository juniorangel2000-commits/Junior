import westContour from './lake-west-contour.json';
import ridgeContour from './lake-ridge-contour.json';
import type {MapEditData,EditorObjectKind} from '../systems/map-editor';
import {paintedWaterPoint} from './terrain-paint';
import {natureArt} from './nature-catalog';
export const LAKE_CITY_EXIT={x:94,y:33},LAKE_CITY_ENTRY={x:92,y:33};
export const CITY_LAKE_EXIT={x:1,y:33},CITY_LAKE_ENTRY={x:4,y:33};
export const LAKE_PROPERTY_EXIT={x:75,y:70},LAKE_PROPERTY_ENTRY={x:75,y:67};
export const PROPERTY_LAKE_EXIT={x:75,y:1},PROPERTY_LAKE_ENTRY={x:75,y:4};
export const LAKE_RIDGE={x:19*32,y:-7*32,width:48*32,height:32*32};
export const LAKE_SIDE_RIDGES=[
 {x:-100,y:0,scale:.82,flip:false},{x:-120,y:35*32,scale:.82,flip:true},
 {x:90.5*32,y:0,scale:.58,flip:true},{x:91*32,y:37*32,scale:.74,flip:true},
] as const;
export const LAKE_SIDE_CROP=westContour.crop;
export const LAKE_PIER={x:61*32,y:42.1*32,width:19.5*32,height:9.75*32};
export const LAKE_BRIDGE={x:27.5,y:58.3,width:8,height:3.8,centerY:60};
const segment=(x:number,y:number,a:readonly number[],b:readonly number[])=>{const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy)));return Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy);};
/** The river leaves the southwest shore and meets the property's north river at x45.5. */
const river=Array.from({length:65},(_,i)=>{const t=i/64;return [26+19.5*t-3*Math.sin(t*Math.PI),51+21*t] as const;});
export function lakeShoreDistance(x:number,y:number):number {
 const angle=Math.atan2((y-40)/19,(x-48)/32),shore=(Math.hypot((x-48)/32,(y-40)/19)-1)*19+Math.sin(angle*5+.4)*.9+Math.sin(angle*9)*.5+Math.cos(angle*13)*.18;
 const landing=3.3*Math.exp(-(((x-34)/7.5)**2)-(((y-24)/5)**2));
 return shore+landing;
}
export function lakeWaterDistance(x:number,y:number):number {
 const shore=lakeShoreDistance(x,y);
 let outlet=Infinity;for(let i=1;i<river.length;i++)outlet=Math.min(outlet,segment(x,y,river[i-1],river[i])-2.25);
 const inletCenter=48.1+Math.max(0,Math.min(1,(y-5)/14));
 const stream=y<25?Math.abs(x-inletCenter)-1.1:Infinity;
 const basin=(Math.hypot((x-49)/3.2,(y-20)/3.5)-1)*3.2;
 const source=Math.min(stream,basin);
 const island=(1-Math.hypot((x-29)/2.7,(y-38)/1.8))*1.8;
 return Math.max(Math.min(shore,outlet,source),island);
}
export const lakeWater=(x:number,y:number)=>lakeWaterDistance(x,y)<0;
export const lakeBridge=(x:number,y:number)=>x>=LAKE_BRIDGE.x&&x<=LAKE_BRIDGE.x+LAKE_BRIDGE.width&&y>=LAKE_BRIDGE.y+LAKE_BRIDGE.height*.28&&y<=LAKE_BRIDGE.y+LAKE_BRIDGE.height*.73;
export function lakePier(x:number,y:number):boolean {
 const localX=x-LAKE_PIER.x/32,localY=y-LAKE_PIER.y/32;
 return(localX>=5.3&&localX<=18.5&&localY>=3.7&&localY<=5.2)||(localX>=1.6&&localX<=5.6&&localY>=1.6&&localY<=7.15);
}
const lakesideTrail=[...Array.from({length:145},(_,i)=>{
 const a=-.33+i/144*(4+.33),wave=Math.sin(a*5+.4)*.9+Math.sin(a*9)*.5+Math.cos(a*13)*.18;
 const radius=1-wave/19+.17+Math.sin(a*3)*.022+Math.cos(a*7)*.012;
 const x=48+32*radius*Math.cos(a);let y=40+19*radius*Math.sin(a);
 if(y<29)y+=(24-y)*Math.exp(-(((x-34)/5.3)**2));
 if(y>54){
  const center=LAKE_BRIDGE.x+LAKE_BRIDGE.width/2,t=Math.max(0,Math.min(1,(Math.abs(x-center)-LAKE_BRIDGE.width/2)/4)),weight=1-t*t*(3-2*t);
  y+=(LAKE_BRIDGE.centerY-y)*weight;
 }
 return[x,y] as const;
}),[34,21.4] as const,[34,17] as const];
export const LAKE_TRAILS:readonly (readonly (readonly number[])[])[]=[lakesideTrail,[[84,33],[90,33],[96,33]],[[64,61],[68,63],[73.5,65.5],[75,69],[75,72]],[[82.5,46],[81,46.5],[79.5,46.7]],[[34,7],[31,5],[28,5]]];
const smoothTrail=(points:readonly (readonly number[])[])=>{
 if(points.length>40)return points;
 const result:number[][]=[];
 for(let i=0;i<points.length-1;i++){
  const a=points[Math.max(0,i-1)],b=points[i],c=points[i+1],d=points[Math.min(points.length-1,i+2)];
  for(let j=0;j<12;j++){const t=j/12,t2=t*t,t3=t2*t;result.push([0,1].map(k=>.5*((2*b[k])+(-a[k]+c[k])*t+(2*a[k]-5*b[k]+4*c[k]-d[k])*t2+(-a[k]+3*b[k]-3*c[k]+d[k])*t3)));}
 }
 return [...result,points[points.length-1]];
};
const trailSegments=LAKE_TRAILS.flatMap(points=>{const curve=smoothTrail(points);return curve.slice(1).map((b,i)=>({a:curve[i],b}));});
export function lakeTrailDistance(x:number,y:number):number {let d=99;for(const s of trailSegments)d=Math.min(d,segment(x,y,s.a,s.b));return d;}
const smoothBank=(value:number)=>{const t=Math.max(0,Math.min(1,value));return t*t*(3-2*t);};
export const LAKE_SAND_BANKS=[-.25,.65,1.25,2.35,2.95,3.65].map((angle,index)=>{
 let low=.65,high=1.4;
 for(let i=0;i<18;i++){const radius=(low+high)/2;if(lakeShoreDistance(48+32*radius*Math.cos(angle),40+19*radius*Math.sin(angle))<0)low=radius;else high=radius;}
 return{x:48+32*high*Math.cos(angle),y:40+19*high*Math.sin(angle),rx:3.6+index%2,ry:2.5+(index%3)*.3};
});
/** Local beaches fade into the original bank, never into the deep-water surface. */
export function lakeSandWeight(x:number,y:number):number {
 const shore=lakeWaterDistance(x,y);if(shore<0||shore>3.2)return 0;
 const width=1.25+.28*Math.sin(x*.31+y*.18)+.18*Math.cos(y*.53-x*.23);
 const continuous=smoothBank((width-shore)/.65)*.9;
 let patch=0;for(const p of LAKE_SAND_BANKS)patch=Math.max(patch,1-Math.hypot((x-p.x)/p.rx,(y-p.y)/p.ry));
 const beach=smoothBank(patch*2.1)*smoothBank((2.8-shore)/1.1);
 return Math.max(continuous,beach);
}
/** Match the actual soil in the mountain artwork gradually, preserving fine gravel. */
export function lakeStairPathBlend(x:number,y:number):number {
 return smoothBank((1.3-Math.hypot((x-34)/6,(y-20)/7))/.9);
}
/** Two walkable levels with a single staircase. Cliff faces cannot be crossed sideways. */
export const lakeTerrace=(x:number,y:number)=>x>=24&&x<=42.5&&y>=2.2&&y<=7.6;
export const lakeStairs=(x:number,y:number)=>x>=32.1&&x<=36.2&&y>=7.2&&y<=22.5;
export function lakeWestCliff(x:number,y:number):boolean {
 return LAKE_SIDE_RIDGES.some(p=>{
  const localY=(y*32-p.y)/p.scale,row=westContour.rows[Math.floor(localY/westContour.step)];
  const localX=p.flip?westContour.crop.width-(x*32-p.x)/p.scale:(x*32-p.x)/p.scale;
  return !!row&&localX>=row[0]-6&&localX<=row[1]+6;
 });
}
export function lakeCliff(x:number,y:number):boolean {
 if(lakeWestCliff(x,y))return true;
 if(lakeTerrace(x,y)||lakeStairs(x,y))return false;
 const local=(x*32-LAKE_RIDGE.x)/LAKE_RIDGE.width*ridgeContour.width;
 const front=local>=0&&local<ridgeContour.width?ridgeContour.front[Math.floor(local/ridgeContour.step)]:0;
 return !!front&&y*32<LAKE_RIDGE.y+front/ridgeContour.height*LAKE_RIDGE.height;
}
/** Sample the whole low sprite footprint, never just its root tile. */
export function lakeLowVegetationClear(x:number,y:number,edits?:MapEditData,scale=1):boolean {
 return [-.72*scale,0,.72*scale].every(dx=>[-1.05*scale,-.5*scale,0].every(dy=>{
  const px=x+.5+dx,py=y+.78+dy,terrain=edits?.terrain[`${Math.floor(px)},${Math.floor(py)}`];
  return px>=1&&px<=94&&py>=1&&py<=70&&(!terrain||['grass','forest','meadow','moss'].includes(terrain))&&lakeWaterDistance(px,py)>.55&&lakeTrailDistance(px,py)>1.75&&!lakeProtected(px-.5,py-.5)&&!paintedWaterPoint(edits?.terrain,px*32,py*32,(a,b)=>lakeWater(a/32,b/32));
 }));
}
export interface LakeObject {id:string;kind:EditorObjectKind;x:number;y:number;variant?:number;scale?:number}
const hash=(i:number)=>(Math.imul(i+813,73856093)^Math.imul(i+191,19349663))>>>0;
export const LAKE_OBJECTS:LakeObject[]=(()=>{
 const result:LakeObject[]=[];
 for(let i=0;i<2600;i++){
  const s=hash(i),x=2+s%92,y=3+(s>>>9)%66;
  if(x>=79&&x<=88&&y>=42&&y<=53)continue;
  if(lakeWaterDistance(x+.5,y+.5)<1.9||[-1.8,0,1.8].some(dx=>[-4,-2,0].some(dy=>lakeTrailDistance(x+.5+dx,y+.5+dy)<1.9))||lakeCliff(x,y)||lakeTerrace(x,y)||lakeStairs(x,y)||lakePier(x,y)||lakeBridge(x,y))continue;
  if(result.some(p=>Math.hypot(p.x-x,p.y-y)<2.8))continue;
  result.push({id:`${s%4?'standingTree':'pine'}-${x}-${y}`,kind:s%4?'standingTree':'pine',x,y,variant:(s>>>5)%3,scale:.82+(s%24)/100});
 }
 for(let i=0;i<190;i++){
  const s=hash(i+7000),x=3+s%90,y=26+(s>>>9)%42,d=lakeWaterDistance(x+.5,y+.5);
  if(d<.2||d>1.6||lakeTrailDistance(x+.5,y+.5)<1.8||lakeBridge(x,y)||lakePier(x,y)||result.some(p=>p.x===x&&p.y===y))continue;
  result.push({id:`shoreStones-${x}-${y}`,kind:i%3?'shoreStones':'reeds',x,y});
 }
 const dryRocks=[[14,28],[13,44],[19,59],[43,64],[61,65],[73,58],[86,49],[85,26],[69,23],[41,20],[22,19],[77,62]];
 for(const[cx,cy]of dryRocks)for(let i=0;i<3;i++){
  const x=cx+(i===1?1:i===2?-1:0),y=cy+(i===2?1:0),kind=i===0?'mossBoulder':i===1?'stone':'shoreStones';
  if(lakeWaterDistance(x+.5,y+.5)<1.7||lakeTrailDistance(x+.5,y+.5)<2.5||lakeProtected(x,y)||result.some(p=>Math.hypot(p.x-x,p.y-y)<1.2))continue;
  result.push({id:`${kind}-${x}-${y}`,kind,x,y});
 }
 // Only D/E have a drawn waterline; terrestrial A/B/C/F stay out of the lake.
 for(const[index,angle]of [-.3,.1,.55,1,1.4,1.85,2.6,2.95,3.4,3.8].entries()){
  let low=.7,high=1.3;
  for(let i=0;i<18;i++){const r=(low+high)/2;if(lakeShoreDistance(48+32*r*Math.cos(angle),40+19*r*Math.sin(angle))<-1.3)low=r;else high=r;}
  const x=Math.round(48+32*high*Math.cos(angle)-.5),y=Math.round(40+19*high*Math.sin(angle)-.5),d=lakeWaterDistance(x+.5,y+.5);
  if(d>-.3||d<-2.5||lakeCliff(x,y)||lakePier(x+.5,y+.5)||lakeBridge(x+.5,y+.5)||result.some(p=>p.x===x&&p.y===y))continue;
  if(![-.9,0,.9].every(dx=>[-.3,0,.3].every(dy=>lakeWater(x+.5+dx,y+.5+dy))))continue;
  const kind=index%2?'lakeRockE':'lakeRockD';result.push({id:`${kind}-${x}-${y}`,kind,x,y});
 }
 let largeBushes=0;
 for(let i=0;i<1200&&largeBushes<18;i++){
  const seed=hash(i+9500),x=3+seed%89,y=26+(seed>>>9)%40,scale=1.45+(seed%20)/100;
  const distance=lakeWaterDistance(x+.5,y+.5);
  if(distance<1.3||distance>3.2||!lakeLowVegetationClear(x,y,undefined,scale)||result.some(p=>Math.hypot(p.x-x,p.y-y)<1.8))continue;
  const kind=largeBushes%3===0?'bush':largeBushes%3===1?'tallGrassB':'fern';
  result.push({id:`${kind}-${x}-${y}`,kind,x,y,scale});largeBushes++;
 }
 const pockets=[[14,23],[12,33],[13,48],[20,57],[43,65],[57,64],[70,60],[87,42],[87,55],[80,23],[70,20],[60,18],[40,18],[26,19],[18,64],[10,58],[85,62],[67,67],[52,67],[37,66],[21,14],[73,13]];
 const kinds=['tallGrassA','tallGrassB','tallGrassC','fern','fern','whiteFlowers','bush','mushrooms'] as const;
 for(const[index,[cx,cy]]of pockets.entries())for(let i=0;i<45;i++){
  const angle=i*2.4+index*.7,r=Math.sqrt(i/45)*(2.8+index%3*.35),x=Math.round(cx+Math.cos(angle)*r),y=Math.round(cy+Math.sin(angle)*r*.7);
  if(!lakeLowVegetationClear(x,y)||result.some(p=>p.x===x&&p.y===y))continue;
  const kind=kinds[(i+index*3)%kinds.length];result.push({id:`${kind}-${x}-${y}`,kind,x,y});
 }
 return result;
})();
const cache=new WeakMap<MapEditData,LakeObject[]>();
export function lakeObjects(edits?:MapEditData):LakeObject[]{
 if(!edits)return LAKE_OBJECTS;const cached=cache.get(edits);if(cached)return cached;
 const ids=new Set(LAKE_OBJECTS.map(p=>p.id)),objects=LAKE_OBJECTS.flatMap(p=>{const e=edits.objects[p.id];return e?.removed?[]:[{...p,x:e?.x??p.x,y:e?.y??p.y}];});
 for(const [id,e]of Object.entries(edits.objects))if(!ids.has(id)&&e.kind&&!e.removed)objects.push({id,kind:e.kind,x:e.x,y:e.y});
 cache.set(edits,objects);return objects;
}
const cellCache=new WeakMap<MapEditData,Set<string>>();let nativeCells:Set<string>|undefined;
export function lakeBlockedPoint(px:number,py:number,edits?:MapEditData):boolean {
 const x=px/32,y=py/32;
 if(px<32||py<32||px>3040||py>2272||lakeCliff(x,y))return true;
 if(!lakePier(x,y)&&!lakeBridge(x,y)&&paintedWaterPoint(edits?.terrain,px,py,(a,b)=>lakeWater(a/32,b/32)))return true;
 let cells=edits?cellCache.get(edits):nativeCells;
 if(!cells){cells=new Set(lakeObjects(edits).filter(p=>p.kind==='standingTree'||p.kind==='pine'||p.kind==='vein'||natureArt(p.kind)?.solid).map(p=>`${p.x},${p.y}`));if(edits)cellCache.set(edits,cells);else nativeCells=cells;}
 return cells.has(`${Math.floor(x)},${Math.floor(y)}`);
}
export function lakeProtected(x:number,y:number):boolean {return lakeCliff(x+.5,y+.5)||lakeTerrace(x+.5,y+.5)||lakeStairs(x+.5,y+.5)||lakeBridge(x+.5,y+.5)||lakePier(x+.5,y+.5)||(x>=90&&Math.abs(y-33)<=2)||(y>=66&&Math.abs(x-75)<=2);}
