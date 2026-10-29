/** Fourth map: independent from the ancient forest and the merchant village. */
export const CITY_FOREST_SIZE={width:96,height:72,tile:32};
export const CITY_FOREST_ENTRY={x:48,y:68};
export const CITY_FOREST_EXIT={x:48,y:70};
export const VILLAGE_NORTH_GATE={x:50,y:1};
export const VILLAGE_NORTH_ARRIVAL={x:50,y:4};
export const CITY_ACCESS={id:'city-dungeons-access',x:22,y:2,direction:'up',travelDurationMs:5000,destinations:['abandoned-central-square','mall-parking'],enabled:false} as const;
export const CITY_SIGN_TEXT='↑ City';
export const CITY_FOREST_TRAILS:readonly (readonly (readonly [number,number])[])[]=[
 [[48,71],[48,64],[43,56],[46,47],[40,38],[46,28],[48,14],[48,10]],
 [[44,55],[28,57],[21,46],[28,36],[40,38]],
 [[45,47],[62,46],[74,35],[70,23],[76,14],[76,10]],
 [[46,28],[33,26],[25,19],[22,14]],
];
export const CITY_FOREST_CLEARINGS=[{x:28,y:56,rx:5,ry:3.8},{x:62,y:46,rx:5,ry:4},{x:32,y:27,rx:4.5,ry:3.5},{x:71,y:27,rx:4,ry:3.5}];
const segment=(x:number,y:number,a:readonly number[],b:readonly number[])=>{
 const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy)));
 return Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy);
};
export function villageNorthConnectionDistance(x:number,y:number):number{
 return Math.min(segment(x,y,[50.5,0],[50.5,15.5]),segment(x,y,[50.5,15.5],[44.5,15.5]),segment(x,y,[44.5,15.5],[44.5,14.5]));
}
/** Smooth curves pass through every authored junction, so rounding never
 * disconnects a clearing or moves a fence opening. */
export const CITY_FOREST_SMOOTH_TRAILS=CITY_FOREST_TRAILS.map(points=>{
 const result:(readonly [number,number])[]=[];
 for(let i=0;i<points.length-1;i++){
  const p0=points[Math.max(0,i-1)],p1=points[i],p2=points[i+1],p3=points[Math.min(points.length-1,i+2)];
  const count=Math.max(8,Math.ceil(Math.hypot(p2[0]-p1[0],p2[1]-p1[1])*1.5));
  for(let step=0;step<count;step++){
   const t=step/count,t2=t*t,t3=t2*t;
   const q=(axis:number)=>.5*((2*p1[axis])+(-p0[axis]+p2[axis])*t+(2*p0[axis]-5*p1[axis]+4*p2[axis]-p3[axis])*t2+(-p0[axis]+3*p1[axis]-3*p2[axis]+p3[axis])*t3);
   result.push([q(0),q(1)]);
  }
 }
 result.push(points[points.length-1]);return result;
});
// Index only nearby curve segments; terrain baking never scans every curve
// for every source pixel. Outside the indexed neighborhood, eight tiles is the safe sentinel.
const trailBuckets=new Map<string,{a:readonly number[];b:readonly number[]}[]>();
for(const points of CITY_FOREST_SMOOTH_TRAILS)for(let i=1;i<points.length;i++){
 const a=points[i-1],b=points[i];
 for(let by=Math.floor((Math.min(a[1],b[1])-4)/4);by<=Math.floor((Math.max(a[1],b[1])+4)/4);by++)for(let bx=Math.floor((Math.min(a[0],b[0])-4)/4);bx<=Math.floor((Math.max(a[0],b[0])+4)/4);bx++){
  const key=`${bx},${by}`,list=trailBuckets.get(key)??[];list.push({a,b});trailBuckets.set(key,list);
 }
}
export function cityForestTrailDistance(x:number,y:number):number{
 let nearest=8;
 for(const s of trailBuckets.get(`${Math.floor(x/4)},${Math.floor(y/4)}`)??[])nearest=Math.min(nearest,segment(x,y,s.a,s.b));
 return nearest;
}
/** Union of two northern strips, with a rounded external 90-degree corner. */
export function cityRoadDistance(x:number,y:number):number{
 return Math.min(segment(x,y,[22,0],[22,10]),segment(x,y,[22,10],[96,10]));
}
export const cityRoadAt=(x:number,y:number)=>cityRoadDistance(x,y)<=3;
export interface CityFenceSegment {a:readonly [number,number];b:readonly [number,number]}
export const CITY_ROAD_FENCES:readonly CityFenceSegment[]=[
 {a:[18,0],b:[18,14]},{a:[18,14],b:[46,14]},{a:[50,14],b:[74,14]},{a:[78,14],b:[96,14]},
 {a:[26,0],b:[26,6]},{a:[26,6],b:[96,6]},
];
export const CITY_FENCE_GATES=[{x:48,y:14},{x:76,y:14}];
export function cityFenceBlockedPoint(px:number,py:number):boolean{
 return CITY_ROAD_FENCES.some(s=>segment(px/32,py/32,s.a,s.b)<.13);
}
const hash=(a:number,b:number)=>(Math.imul(a+173,73856093)^Math.imul(b+391,19349663))>>>0;
export const CITY_PUDDLES=[{x:33,y:49,rx:1.3,ry:.65},{x:65,y:35,rx:1.1,ry:.65},{x:57,y:59,rx:1.5,ry:.8}];
export const cityForestWater=(x:number,y:number)=>CITY_PUDDLES.some(p=>Math.hypot((x-p.x)/p.rx,(y-p.y)/p.ry)<1);
export const CITY_FOREST_TREES=(()=>{
 const result:{x:number;y:number;variant:number;pine:boolean;scale:number}[]=[];
 for(let i=0;i<6000;i++){
  const seed=hash(i*7,i*13),x=2+(seed%92),y=3+((seed>>>10)%67);
  if(cityRoadDistance(x+.5,y+.5)<5.8||cityForestTrailDistance(x+.5,y+.5)<2.5||cityForestWater(x+.5,y+.5))continue;
  if(CITY_FOREST_CLEARINGS.some(p=>Math.hypot((x-p.x)/p.rx,(y-p.y)/p.ry)<1.25))continue;
  if(result.some(t=>Math.hypot(t.x-x,t.y-y)<2+(seed%3)*.17))continue;
  result.push({x,y,variant:(seed>>>5)%3,pine:seed%5<2,scale:.88+(seed%17)/100});
 }
 return result;
})();
export const CITY_FOREST_OBSTACLES=(()=>{
 const result:{x:number;y:number;kind:'mossBoulder'|'fallenLog'|'stump'}[]=[];
 for(let i=0;i<170;i++){
  const seed=hash(i+57,i*23),x=5+seed%86,y=19+(seed>>>12)%46;
  if(result.some(p=>p.x===x&&p.y===y)||cityForestTrailDistance(x+.5,y+.5)<2.1||cityForestWater(x+.5,y+.5)||CITY_FOREST_TREES.some(t=>Math.hypot(t.x-x,t.y-y)<1.6))continue;
  result.push({x,y,kind:i%3===0?'fallenLog':i%3===1?'mossBoulder':'stump'});
 }
 return result;
})();
const solids=new Set([...CITY_FOREST_TREES,...CITY_FOREST_OBSTACLES].map(p=>`${p.x},${p.y}`));
export function cityForestBlockedPoint(px:number,py:number):boolean{
 const x=Math.floor(px/32),y=Math.floor(py/32);
 return px<32||py<32||px>3040||py>2272||solids.has(`${x},${y}`)||cityForestWater(px/32,py/32)||cityFenceBlockedPoint(px,py);
}
export const cityForestBlockedTile=(x:number,y:number)=>cityForestBlockedPoint((x+.5)*32,(y+.5)*32);
