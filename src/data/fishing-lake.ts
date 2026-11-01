import {lakeIslandLand} from './lake-island';
import {pointInPolygon} from './architecture-collision';
import {cabinSolidPoint,cabinFloorPoint,cabinClearing,CABIN_APPROACH} from './fisher-cabin';
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
/** Asymmetric, meandering banks. The bridge and the property seam keep their alignment. */
export function lakeRiverBanks(y:number):{left:number;right:number} {
 const t=Math.max(0,Math.min(1,(y-51)/21));
 const seam=Math.sin(Math.PI*t)**2;
 const bridge=Math.max(0,Math.min(1,(Math.abs(y-LAKE_BRIDGE.centerY)-1)/3));
 const centre=26+19.5*t-3*Math.sin(t*Math.PI)+Math.sin(t*Math.PI*3)*.62*seam*bridge;
 const flare=.8*Math.exp(-(((y-55)/2.7)**2));
 const half=2.25+(Math.sin(y*.48+.7)*.26+Math.cos(y*.93)*.15)*seam*bridge+flare;
 return{left:centre-half-Math.sin(y*.74+.2)*.23*seam*bridge,right:centre+half+Math.cos(y*.57+.9)*.27*seam*bridge};
}
function lakeRiverDistance(x:number,y:number):number {
 const banks=lakeRiverBanks(y);
 return Math.max(banks.left-x,x-banks.right,51-y);
}
/** A smooth union avoids the angular neck created by intersecting two water shapes. */
function mergeLakeRiver(lake:number,river:number):number {
 const reach=2.2,h=Math.max(0,Math.min(1,.5+.5*(river-lake)/reach));
 return river*(1-h)+lake*h-reach*h*(1-h);
}
export function lakeShoreDistance(x:number,y:number):number {
 const angle=Math.atan2((y-40)/19,(x-48)/32),shore=(Math.hypot((x-48)/32,(y-40)/19)-1)*19+Math.sin(angle*5+.4)*.9+Math.sin(angle*9)*.5+Math.cos(angle*13)*.18;
 const landing=3.3*Math.exp(-(((x-34)/7.5)**2)-(((y-24)/5)**2));
 return shore+landing;
}
/** Follow the painted upper stream between the rocks rather than a straight north strip. */
export function lakeCascadeBanks(y:number):{center:number;half:number}{
 const points=[[-1,45.55,1],[.8,46.84,1.55],[2.38,48.34,1.34],[4.25,48.88,1.4],[5.82,49.06,1.4],[18.3,49.2,1.25]];
 let i=0;while(i<points.length-2&&y>points[i+1][0])i++;const a=points[i],b=points[i+1],t=Math.max(0,Math.min(1,(y-a[0])/(b[0]-a[0]))),smooth=t*t*(3-2*t);
 return{center:a[1]+(b[1]-a[1])*smooth,half:a[2]+(b[2]-a[2])*smooth};
}
export function lakeWaterDistance(x:number,y:number):number {
 const shore=lakeShoreDistance(x,y);
 const joined=mergeLakeRiver(shore,lakeRiverDistance(x,y));
 const inlet=lakeCascadeBanks(y);
 const stream=Math.max(Math.abs(x-inlet.center)-inlet.half,y-24);
 const basin=(Math.hypot((x-49)/4.6,(y-20.3)/4.3)-1)*4.3+.11*Math.sin(x*2.1+y*1.7);
 const source=mergeLakeRiver(stream,basin);
 const island=lakeIslandLand(x,y);
 return Math.max(mergeLakeRiver(joined,source),island);
}
export const lakeWater=(x:number,y:number)=>lakeWaterDistance(x,y)<0;
export const lakeBridge=(x:number,y:number)=>x>=LAKE_BRIDGE.x&&x<=LAKE_BRIDGE.x+LAKE_BRIDGE.width&&y>=LAKE_BRIDGE.y+LAKE_BRIDGE.height*.28&&y<=LAKE_BRIDGE.y+LAKE_BRIDGE.height*.73;
export function lakePier(x:number,y:number):boolean {
 const localX=x-LAKE_PIER.x/32,localY=y-LAKE_PIER.y/32;
 return(localX>=5.3&&localX<=18.5&&localY>=3.7&&localY<=5.2)||(localX>=1.6&&localX<=5.6&&localY>=1.6&&localY<=7.15);
}
export const LAKE_PIER_PROPS=[
 {frame:'crate',x:63.6,y:48.35,width:44,height:34},
 {frame:'anchor',x:65.2,y:48.0,width:44,height:42},
] as const;
/** Crossing a raised deck boundary is legal only at its landward entrance. */
export function lakeDeckAllowsStep(from:{x:number;y:number},to:{x:number;y:number},water:(x:number,y:number)=>boolean=(x,y)=>lakeWater(x/32,y/32)):boolean{
 const ax=from.x/32,ay=from.y/32,bx=to.x/32,by=to.y/32;
 const touches=(x:number,y:number,deck:(x:number,y:number)=>boolean)=>[[0,0],[-7,-5],[7,-5],[-7,3],[7,3]].some(([dx,dy])=>deck(x+dx/32,y+dy/32));
 if(lakePier(ax,ay)!==lakePier(bx,by)||!lakePier(ax,ay)&&touches(bx,by,lakePier)){
  const end=LAKE_PIER.x/32+18.5,low=LAKE_PIER.y/32+3.7,high=LAKE_PIER.y/32+5.2;
  if(water(...(lakePier(ax,ay)?[to.x,to.y] as const:[from.x,from.y] as const)))return false;
  if(Math.abs(ax-end)>.26||Math.abs(bx-end)>.26||ay<low||ay>high||by<low||by>high)return false;
 }
 if(lakeBridge(ax,ay)!==lakeBridge(bx,by)||!lakeBridge(ax,ay)&&touches(bx,by,lakeBridge)){
  const nearEnd=[LAKE_BRIDGE.x,LAKE_BRIDGE.x+LAKE_BRIDGE.width].some(x=>Math.abs(ax-x)<.26&&Math.abs(bx-x)<.26),low=LAKE_BRIDGE.y+LAKE_BRIDGE.height*.28,high=LAKE_BRIDGE.y+LAKE_BRIDGE.height*.73;
  if(water(...(lakeBridge(ax,ay)?[to.x,to.y] as const:[from.x,from.y] as const)))return false;
  if(!nearEnd||ay<low||ay>high||by<low||by>high)return false;
 }
 return true;
}
export const lakeShoreCoverage=(distance:number)=>Math.max(0,Math.min(1,.5-distance*32/1.5));
/** Physical ropes and the moored boat remain solid when the player can swim. */
export function lakeStructureBlockedPoint(x:number,y:number):boolean {
 const px=x-LAKE_PIER.x/32,py=y-LAKE_PIER.y/32;
 const mainRail=px>=5&&px<=18.6&&((py>=3.25&&py<=3.7)||(py>=5.2&&py<=5.65));
 const headRail=((px>=.85&&px<=1.6)&&(py>=1.1&&py<=7.6))||(px>=.85&&px<=5.8&&((py>=1.1&&py<=1.6)||(py>=7.15&&py<=7.6)));
 const boat=px>=6.5&&px<=10.5&&py>=6.4&&py<=8.8;
 const bridge=x>=LAKE_BRIDGE.x&&x<=LAKE_BRIDGE.x+LAKE_BRIDGE.width&&((y>=LAKE_BRIDGE.y+LAKE_BRIDGE.height*.18&&y<=LAKE_BRIDGE.y+LAKE_BRIDGE.height*.28)||(y>=LAKE_BRIDGE.y+LAKE_BRIDGE.height*.73&&y<=LAKE_BRIDGE.y+LAKE_BRIDGE.height*.85));
 return mainRail||headRail||boat||bridge||Math.abs(x-63.8)<1.05&&y>43.9&&y<44.9||LAKE_PIER_PROPS.some(p=>Math.abs(x-p.x)<.45&&y>p.y-.45&&y<p.y+.12);
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
export const LAKE_TRAILS:readonly (readonly (readonly number[])[])[]=[lakesideTrail,[[84,33],[90,33],[96,33]],[[64,61],[68,63],[73.5,65.5],[75,69],[75,72]],[[82.5,46],[81,46.5],[79.5,46.7]],[[34,7],[31,5],[28,5]],CABIN_APPROACH.map(p=>[p.x/32,p.y/32])];
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
const cabinTrail=smoothTrail(CABIN_APPROACH.map(p=>[p.x/32,p.y/32]));
export function lakeTrailHalfWidth(x:number,y:number,distance:number):number{
 const ordinary=1.18+.13*Math.sin(x*.43+y*.24)+.07*Math.cos(y*.8-x*.35);
 if(x<80||x>86||y<28||y>34)return ordinary;
 let branch=99;for(let i=1;i<cabinTrail.length;i++)branch=Math.min(branch,segment(x,y,cabinTrail[i-1],cabinTrail[i]));
 if(branch>distance+.001)return ordinary;
 const t=Math.max(0,Math.min(1,(y-CABIN_APPROACH[1].y/32)/3.3)),blend=t*t*(3-2*t);
 return .85*(1-blend)+ordinary*blend+Math.sin(x*1.7+y*2.3)*.025*blend;
}
/** Added copses reserve the full crown, rather than only the trunk tile. */
export function lakeTreePlantingClear(x:number,y:number,scale:number):boolean{
 if(cabinClearing(x,y)||lakeCliff(x,y)||lakeTerrace(x,y)||lakeStairs(x,y)||lakePier(x,y)||lakeBridge(x,y))return false;
 return [-1,0,1].every(dx=>[-1,0,1].every(dy=>{
  const px=x+.5+dx*2.35*scale,py=y+.78-3.1*scale+dy*3.1*scale;
  return px>=1&&px<=95&&py>=1&&py<=71&&!cabinClearing(px,py)&&lakeWaterDistance(px,py)>1.5&&lakeTrailDistance(px,py)>1.65;
 }));
}
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
// The old rectangle also admitted the moss and boulders left of the real steps.
const STAIR_FLOOR=[[465,457],[556,457],[556,825],[435,825],[445,680],[452,585]] as const;
export const lakeStairs=(x:number,y:number)=>pointInPolygon(x*32-LAKE_RIDGE.x,y*32-LAKE_RIDGE.y,STAIR_FLOOR);
/** The high terrace and the staircase have two portals, never lateral entrances. */
export function lakeElevationAllowsStep(from:{x:number;y:number},to:{x:number;y:number}):boolean {
 const ax=from.x/32,ay=from.y/32,bx=to.x/32,by=to.y/32,a=lakeTerrace(ax,ay),b=lakeTerrace(bx,by),sa=lakeStairs(ax,ay),sb=lakeStairs(bx,by);
 if(a!==b&&!(sa&&sb))return false;
 if(sa!==sb&&!(a&&b)){
  const bottom=LAKE_RIDGE.y/32+825/32;
  if(Math.abs(ay-bottom)>.26||Math.abs(by-bottom)>.26||ax<32.6||ax>36.4||bx<32.6||bx>36.4)return false;
 }
 return true;
}
export function lakeWestCliff(x:number,y:number):boolean {
 return LAKE_SIDE_RIDGES.some(p=>{
  const localY=(y*32-p.y)/p.scale,row=westContour.rows[Math.floor(localY/westContour.step)];
  const localX=p.flip?westContour.crop.width-(x*32-p.x)/p.scale:(x*32-p.x)/p.scale;
  return !!row&&localX>=row[0]-6&&localX<=row[1]+6;
 });
}
export function lakeCliff(x:number,y:number):boolean {
 if(lakeWestCliff(x,y))return true;
 if(lakeTerrace(x,y)||lakeStairs(x,y)||x>=32.3&&x<=37&&y>=18.7&&y<=23.2)return false;
 const local=(x*32-LAKE_RIDGE.x)/LAKE_RIDGE.width*ridgeContour.width;
 const front=local>=0&&local<ridgeContour.width?ridgeContour.front[Math.floor(local/ridgeContour.step)]:0;
 return !!front&&y*32<LAKE_RIDGE.y+front/ridgeContour.height*LAKE_RIDGE.height;
}
/** Sample the whole low sprite footprint, never just its root tile. */
export function lakeLowVegetationClear(x:number,y:number,edits?:MapEditData,scale=1):boolean {
 return [-.72*scale,0,.72*scale].every(dx=>[-1.05*scale,-.5*scale,0].every(dy=>{
  const px=x+.5+dx,py=y+.78+dy,terrain=edits?.terrain[`${Math.floor(px)},${Math.floor(py)}`];
  return !cabinClearing(px,py)&&px>=1&&px<=94&&py>=1&&py<=70&&(!terrain||['grass','forest','meadow','moss'].includes(terrain))&&lakeWaterDistance(px,py)>.55&&lakeTrailDistance(px,py)>1.75&&!lakeProtected(px-.5,py-.5)&&!paintedWaterPoint(edits?.terrain,px*32,py*32,(a,b)=>lakeWater(a/32,b/32));
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
  if(cabinClearing(x,y)||d<.2||d>1.6||lakeTrailDistance(x+.5,y+.5)<1.8||lakeBridge(x,y)||lakePier(x,y)||result.some(p=>p.x===x&&p.y===y))continue;
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
 // Uneven copses fill the dry outer forest without lining trees up along paths.
 const copses=[[10,32],[9,49],[14,57],[24,65],[43,67],[57,67],[65,65],[86,61],[87,52],[87,39],[79,17],[73,16],[17,16],[13,23],[82,10]];
 for(const [group,[cx,cy]]of copses.entries()){
  let added=0;const limit=4+group%4;
  for(let i=0;i<70&&added<limit;i++){
   const seed=hash(12000+group*101+i),angle=(seed%6283)/1000,radius=Math.sqrt((seed>>>8)%100/100)*(3.2+group%3*.7);
   const x=Math.round(cx+Math.cos(angle)*radius),y=Math.round(cy+Math.sin(angle)*radius*.72),scale=.74+(seed%27)/100;
   if(!lakeTreePlantingClear(x,y,scale)||result.some(p=>Math.hypot(p.x-x,p.y-y)<(p.kind==='standingTree'||p.kind==='pine'?1.85:1.2)))continue;
   const kind=seed%3?'standingTree':'pine';result.push({id:`lake-copse-${group}-${x}-${y}`,kind,x,y,scale,variant:(seed>>>5)%3});added++;
  }
 }
 // Keep larger bank vegetation distributed after opening the cabin clearing.
 let big=result.filter(p=>(p.scale??1)>1.3&&!['standingTree','pine'].includes(p.kind)).length;
 for(const p of result){
  if(big>=6)break;
  if(p.kind!=='fern'||p.scale||!lakeLowVegetationClear(p.x,p.y,undefined,1.5)||result.some(q=>(q.scale??1)>1.3&&Math.hypot(q.x-p.x,q.y-p.y)<4))continue;
  p.scale=1.5;big++;
 }
 // Dress the open boundary pockets, leaving the existing mountain faces exposed.
 const corners=[[15,8],[18,16],[10,36],[10,55],[15,65],[26,68],[40,68],[54,68],[64,67],[84,66],[89,58],[88,39],[79,8],[84,13]];
 const dryFootprint=(x:number,y:number,width:number,height:number)=>[-width/64,0,width/64].every(dx=>[-height/32,-height/64,0].every(dy=>{
  const px=x+.5+dx,py=y+.78+dy;
  return px>1&&px<95&&py>1&&py<71&&!lakeProtected(px-.5,py-.5)&&!lakeCliff(px,py)&&lakeWaterDistance(px,py)>1&&lakeTrailDistance(px,py)>1.7;
 }));
 for(const[group,[cx,cy]]of corners.entries()){
  let trees=0,rocks=0,plants=0;
  for(let i=0;i<180;i++){
   const seed=hash(18000+group*211+i),angle=(seed%6283)/1000,radius=Math.sqrt((seed>>>10)%100/100)*(4.5+group%3*.7);
   const x=Math.round(cx+Math.cos(angle)*radius),y=Math.round(cy+Math.sin(angle)*radius*.8);
   if(i<65&&trees<3+group%3){
    const scale=.72+(seed%30)/100;
    if(!lakeTreePlantingClear(x,y,scale)||!dryFootprint(x,y,100*scale,175*scale)||result.some(p=>Math.hypot(p.x-x,p.y-y)<(p.kind==='standingTree'||p.kind==='pine'?1.7:1.1)))continue;
    const kind=seed%3?'standingTree':'pine';result.push({id:`lake-corner-tree-${group}-${x}-${y}`,kind,x,y,scale,variant:(seed>>>7)%3});trees++;
   }else if(i<110&&rocks<2+group%2){
    const kind=(['mossBoulder','stone','shoreStones','fallenLog','stump'] as const)[seed%5],art=natureArt(kind);
    if(!dryFootprint(x,y,art?.width??36,art?.height??36)||result.some(p=>Math.hypot(p.x-x,p.y-y)<1.55))continue;
    result.push({id:`lake-corner-${kind}-${group}-${x}-${y}`,kind,x,y});rocks++;
   }else if(i>=110&&plants<10+group%5){
    const kind=(['tallGrassA','tallGrassB','tallGrassC','fern','fern','whiteFlowers','bush','mushrooms'] as const)[seed%8];
    if(!lakeLowVegetationClear(x,y)||result.some(p=>p.x===x&&p.y===y))continue;
    result.push({id:`lake-corner-${kind}-${group}-${x}-${y}`,kind,x,y});plants++;
   }
  }
 }
 return result.filter(p=>!cabinClearing(p.x,p.y)||p.kind.startsWith('lakeRock'));
})();
const cache=new WeakMap<MapEditData,LakeObject[]>();
export function lakeObjects(edits?:MapEditData):LakeObject[]{
 if(!edits)return LAKE_OBJECTS;const cached=cache.get(edits);if(cached)return cached;
 const ids=new Set(LAKE_OBJECTS.map(p=>p.id)),objects=LAKE_OBJECTS.flatMap(p=>{const e=edits.objects[p.id];return e?.removed?[]:[{...p,x:e?.x??p.x,y:e?.y??p.y}];});
 for(const [id,e]of Object.entries(edits.objects))if(!ids.has(id)&&e.kind&&!e.removed)objects.push({id,kind:e.kind,x:e.x,y:e.y});
 cache.set(edits,objects);return objects;
}
const cellCache=new WeakMap<MapEditData,Set<string>>();let nativeCells:Set<string>|undefined;
export function lakeBlockedPoint(px:number,py:number,edits?:MapEditData,allowWater=false):boolean {
 const x=px/32,y=py/32;
 if(Math.hypot((x-29)/.28,(y-38)/.2)<1)return true;
 if(px<32||py<32||px>3040||py>2272||lakeCliff(x,y)||lakeStructureBlockedPoint(x,y)||cabinSolidPoint(px,py))return true;
 if(cabinFloorPoint(px,py))return false;
 if(!allowWater&&!lakePier(x,y)&&!lakeBridge(x,y)&&paintedWaterPoint(edits?.terrain,px,py,(a,b)=>lakeWater(a/32,b/32)))return true;
 let cells=edits?cellCache.get(edits):nativeCells;
 if(!cells){cells=new Set(lakeObjects(edits).filter(p=>p.kind==='standingTree'||p.kind==='pine'||p.kind==='vein'||natureArt(p.kind)?.solid).map(p=>`${p.x},${p.y}`));if(edits)cellCache.set(edits,cells);else nativeCells=cells;}
 return cells.has(`${Math.floor(x)},${Math.floor(y)}`);
}
export function lakeProtected(x:number,y:number):boolean {return cabinClearing(x,y)||lakeCliff(x+.5,y+.5)||lakeTerrace(x+.5,y+.5)||lakeStairs(x+.5,y+.5)||lakeBridge(x+.5,y+.5)||lakePier(x+.5,y+.5)||(x>=90&&Math.abs(y-33)<=2)||(y>=66&&Math.abs(x-75)<=2);}
