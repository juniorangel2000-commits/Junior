import type {BentoRoomNavigation} from './bento-routine';
export interface NavigationRect {left:number;top:number;right:number;bottom:number}
type RoomOptions=Omit<BentoRoomNavigation,'isBlocked'|'validPosition'|'cellBlocked'> & {width:number;height:number;tileSize:number};
const FOOT=[[-7,-5],[7,-5],[-7,3],[7,3]] as const;
/** Snapshot immutable editor geometry once. A* consults cached cell occupancy,
 * rather than resolving assets and parent visibility for every neighbor. */
export function compileRoomNavigation<T extends RoomOptions>(shell:(x:number,y:number)=>boolean,rects:readonly NavigationRect[],options:T) {
 const pointBlocked=(x:number,y:number)=>!shell(x,y)||rects.some(r=>x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom);
 const fits=(x:number,y:number)=>Number.isFinite(x)&&Number.isFinite(y)&&FOOT.every(([dx,dy])=>!pointBlocked(x+dx,y+dy));
 const centers=new Uint8Array(options.width*options.height),cells=new Uint8Array(centers.length),tile=options.tileSize;
 const lookup=(cache:Uint8Array,x:number,y:number,full:boolean)=>{
  if(x<0||y<0||x>=options.width||y>=options.height)return true;
  const i=y*options.width+x;if(!cache[i]){
   const blocked=full?[[0,0],[tile,0],[0,tile],[tile,tile]].some(([dx,dy])=>!fits(x*tile+dx,y*tile+dy)):!fits((x+.5)*tile,(y+.5)*tile);
   cache[i]=blocked?2:1;
  }return cache[i]===2;
 };
 return {...options,isBlocked:(x:number,y:number)=>lookup(centers,x,y,false),cellBlocked:(x:number,y:number)=>lookup(cells,x,y,true),validPosition:fits};
}
