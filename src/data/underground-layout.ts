import {pointInPolygon} from './architecture-collision';
import {forgottenGalleryFloor,mineMissionSeal} from './mine-quest-geometry';
import {mineBlockedPoint,MINE_ROOM} from './mine-room';
export const UNDERGROUND={version:1,width:160,height:192,tile:32,entryX:2176,entryY:5632} as const;
export type MineZone='protected'|'permanent'|'renewable';
export type MineDepth='surface'|'middle'|'deep'|'extreme';
export const MINE_SPINE=[{x:79,y:176},{x:79,y:165},{x:94,y:148},{x:88,y:128},{x:62,y:110},{x:68,y:88},{x:94,y:65},{x:90,y:44},{x:70,y:22},{x:78,y:10}] as const;
export const MINE_BRANCHES=[
 [{x:79,y:165},{x:55,y:165},{x:42,y:151},{x:25,y:151}],
 [{x:94,y:148},{x:119,y:144},{x:136,y:130}],
 [{x:88,y:128},{x:112,y:116},{x:130,y:100}],
 [{x:62,y:110},{x:39,y:106},{x:25,y:88}],
 [{x:68,y:88},{x:48,y:74},{x:36,y:56}],
 [{x:94,y:65},{x:120,y:62},{x:137,y:45}],
 [{x:90,y:44},{x:111,y:34},{x:123,y:18}],
 [{x:70,y:22},{x:48,y:24},{x:31,y:16}],
] as const;
export const MINE_ROOMS=[{x:79,y:165,r:7},{x:94,y:148,r:7},{x:88,y:128,r:8},{x:62,y:110,r:7},{x:68,y:88,r:7},{x:94,y:65,r:8},{x:90,y:44,r:7},{x:70,y:22,r:7}];
export const MINE_DECOR=[
 {id:'cart-west',kind:'cart',x:53,y:163,w:2,h:2},
 {id:'crate-middle',kind:'crate',x:94,y:130,w:1,h:1},
 {id:'cart-deep',kind:'cart',x:118,y:60,w:2,h:2},
 {id:'forgotten-crate',kind:'crate',x:17,y:87,w:1,h:1},
 {id:'crate-north',kind:'crate',x:73,y:23,w:1,h:1},
] as const;
export type MineDecoration=typeof MINE_DECOR[number];
/** Visuals and collision share a single ground anchor and authored footprint.
 * Reserved cells stay protected in geology/saves, but are not rock walls. */
export function mineDecorGeometry(d:MineDecoration){
 const width=d.kind==='cart'?64:32,height=d.kind==='cart'?58:36;
 const x=(d.x+d.w/2)*32,y=(d.y+d.h)*32;
 const footprint=(d.kind==='cart'?[[-.46,-18],[-.15,-29],[.44,-18],[.46,-7],[.13,-4],[-.44,-8]]:[[-.30,-12],[0,-20],[.30,-12],[.30,-6],[0,-4],[-.30,-6]]).map(([u,v])=>[x+u*width,y+v]as const);
 return{x,y,width,height,footprint};
}
const DECOR_GEOMETRY=MINE_DECOR.map(mineDecorGeometry);
export const mineDecorCell=(x:number,y:number)=>MINE_DECOR.some(d=>x>=d.x&&x<d.x+d.w&&y>=d.y&&y<d.y+d.h);
export const mineDecorBlocked=(x:number,y:number)=>DECOR_GEOMETRY.some(d=>x>=d.x-d.width/2&&x<=d.x+d.width/2&&y>=d.y-30&&y<=d.y&&pointInPolygon(x,y,d.footprint));
export const mineCellIndex=(x:number,y:number)=>y*UNDERGROUND.width+x;
export const mineCellPoint=(index:number)=>({x:index%UNDERGROUND.width,y:Math.floor(index/UNDERGROUND.width)});
export const mineDepth=(y:number):MineDepth=>y>=132?'surface':y>=88?'middle':y>=44?'deep':'extreme';
export function mineHash(seed:number,x:number,y:number):number{let n=(seed^Math.imul(x+17,374761393)^Math.imul(y+31,668265263))>>>0;n=Math.imul(n^(n>>>13),1274126177);return((n^(n>>>16))>>>0)/4294967296;}
function segmentDistance(x:number,y:number,a:{x:number;y:number},b:{x:number;y:number}):number{
 const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/(dx*dx+dy*dy)));
 return Math.hypot(x-a.x-t*dx,y-a.y-t*dy);
}
function pathDistance(x:number,y:number,path:readonly {x:number;y:number}[]):number{
 let d=Infinity;for(let i=1;i<path.length;i++)d=Math.min(d,segmentDistance(x,y,path[i-1],path[i]));return d;
}
export const inMineEntrance=(x:number,y:number)=>x>=UNDERGROUND.entryX&&x<UNDERGROUND.entryX+MINE_ROOM.width&&y>=UNDERGROUND.entryY&&y<UNDERGROUND.entryY+MINE_ROOM.height;
/** The narrow existing north portal connects directly to the main spine. */
export const inMineConnector=(x:number,y:number)=>x>=UNDERGROUND.entryX+332&&x<=UNDERGROUND.entryX+388&&y>=UNDERGROUND.entryY-48&&y<=UNDERGROUND.entryY+154;
interface Layout{rock:Uint8Array;zone:Uint8Array}
const layouts=new Map<number,Layout>();
/** Immutable geology is generated once; gameplay records only sparse changes. */
export function undergroundLayout(seed:number):Layout{
 let layout=layouts.get(seed);if(layout)return layout;
 const size=UNDERGROUND.width*UNDERGROUND.height,rock=new Uint8Array(size),zone=new Uint8Array(size);
 for(let y=0;y<UNDERGROUND.height;y++)for(let x=0;x<UNDERGROUND.width;x++){
  const i=mineCellIndex(x,y),px=x*32+16,py=y*32+16;
  if(inMineEntrance(px,py)){rock[i]=inMineConnector(px,py)?0:Number(mineBlockedPoint(px-UNDERGROUND.entryX,py-UNDERGROUND.entryY));continue;}
  if(x<4||x>=UNDERGROUND.width-4||y<4||y>=176){rock[i]=1;continue;}
  const main=pathDistance(x,y,MINE_SPINE),branch=Math.min(...MINE_BRANCHES.map(p=>pathDistance(x,y,p)));
  const room=MINE_ROOMS.some(r=>Math.hypot((x-r.x)/1.15,y-r.y)<r.r+(mineHash(seed,x>>2,y>>2)-.5)*1.1);
  const open=main<2.4||branch<1.9||room;
  rock[i]=Number(!open);
  zone[i]=open?0:branch<10?2:1;
  if(forgottenGalleryFloor(x,y)){rock[i]=0;zone[i]=0;}if(mineMissionSeal(x,y)){rock[i]=1;zone[i]=1;}
  if(MINE_DECOR.some(d=>x>=d.x&&x<d.x+d.w&&y>=d.y&&y<d.y+d.h)){rock[i]=1;zone[i]=0;}
 }
 // The portal crosses the entrance's north edge without a loading transition.
 for(let y=174;y<=180;y++)for(let x=78;x<=80;x++){const i=mineCellIndex(x,y);rock[i]=0;zone[i]=0;}
 layout={rock,zone};if(layouts.size>=4)layouts.delete(layouts.keys().next().value!);layouts.set(seed,layout);return layout;
}
export function mineZone(seed:number,x:number,y:number):MineZone{
 if(!Number.isInteger(x)||!Number.isInteger(y)||x<0||y<0||x>=UNDERGROUND.width||y>=UNDERGROUND.height)return'protected';
 const n=undergroundLayout(seed).zone[mineCellIndex(x,y)];return n===1?'permanent':n===2?'renewable':'protected';
}
