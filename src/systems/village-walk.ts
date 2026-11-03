import {directionFromVector,type CharacterDirection} from '../character-directions';
import {WORLD_WIDTH,WORLD_HEIGHT,TILE} from '../data/world-size';
type Point={x:number;y:number};
type Blocked=(x:number,y:number)=>boolean;
type Cost=(x:number,y:number)=>number;

/** Weighted A*: prefer the village streets and never cut diagonally between
 * walls, trees, garden fences or the new street lamps. */
export function* villageRouteSearch(start:Point,goal:Point,blocked:Blocked,cost:Cost=()=>1,bounds={width:WORLD_WIDTH,height:WORLD_HEIGHT},canStep?: (from:Point,to:Point)=>boolean):Generator<undefined,Point[],void>{
 const index=(x:number,y:number)=>y*bounds.width+x,inside=(x:number,y:number)=>x>=1&&y>=1&&x<bounds.width-1&&y<bounds.height-1;
 const sx=Math.floor(start.x),sy=Math.floor(start.y),gx=Math.floor(goal.x),gy=Math.floor(goal.y);
 if(!inside(sx,sy)||!inside(gx,gy))return [];
 const blockedCells=new Uint8Array(bounds.width*bounds.height),costs=new Float64Array(blockedCells.length);
 const occupied=(x:number,y:number)=>{const i=index(x,y);if(!blockedCells[i])blockedCells[i]=blocked(x,y)?2:1;return blockedCells[i]===2;};
 const weight=(x:number,y:number)=>{const i=index(x,y);return costs[i]||(costs[i]=Math.max(1,cost(x,y)));};
 if(occupied(gx,gy)||sx===gx&&sy===gy)return [];
 const from=new Int32Array(bounds.width*bounds.height).fill(-1),scores=new Float64Array(from.length).fill(Infinity);
 const open:Array<{id:number;priority:number}>=[];
 const push=(value:{id:number;priority:number})=>{let i=open.length;open.push(value);while(i>0){const p=(i-1)>>1;if(open[p].priority<=value.priority)break;open[i]=open[p];i=p;}open[i]=value;};
 const pop=()=>{const best=open[0],last=open.pop()!;if(open.length){let i=0;while(i*2+1<open.length){let child=i*2+1;if(child+1<open.length&&open[child+1].priority<open[child].priority)child++;if(open[child].priority>=last.priority)break;open[i]=open[child];i=child;}open[i]=last;}return best;};
 const source=index(sx,sy),target=index(gx,gy);scores[source]=0;push({id:source,priority:0});
 const closed=new Uint8Array(from.length);
 let expanded=0;
 while(open.length){
  if(++expanded%32===0)yield undefined;
  const current=pop().id;if(closed[current])continue;closed[current]=1;
  if(current===target){const path:Point[]=[];for(let p=target;p!==source;p=from[p]){if(p<0)return [];path.push({x:p%bounds.width,y:Math.floor(p/bounds.width)});}return path.reverse();}
  const x=current%bounds.width,y=Math.floor(current/bounds.width);
  for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){
   const nx=x+dx,ny=y+dy;if(!inside(nx,ny)||occupied(nx,ny)||dx&&dy&&(occupied(x+dx,y)||occupied(x,y+dy))||canStep&&!canStep({x,y},{x:nx,y:ny}))continue;
   const next=index(nx,ny),score=scores[current]+Math.hypot(dx,dy)*weight(nx,ny);
   if(score>=scores[next])continue;scores[next]=score;from[next]=current;push({id:next,priority:score+Math.hypot(gx-nx,gy-ny)});
  }
 }
 return [];
}

/** Synchronous callers retain the original path/result; travelling NPCs can budget search steps. */
export function villageRoute(start:Point,goal:Point,blocked:Blocked,cost:Cost=()=>1,bounds={width:WORLD_WIDTH,height:WORLD_HEIGHT},canStep?:(from:Point,to:Point)=>boolean):Point[]{
 const search=villageRouteSearch(start,goal,blocked,cost,bounds,canStep);let step=search.next();while(!step.done)step=search.next();return step.value;
}

export class VillageWalk {
 private path:Point[]=[];
 private target=0;
 private wait:number;
 private distance=0;
 private direction:CharacterDirection='down';
 constructor(private readonly stops:readonly Point[],private readonly speed=34,initialWait=8,private readonly stopWait=12,private readonly tile=TILE,private readonly walkFrames=6){this.wait=initialWait;}
 step(seconds:number,position:Point,blocked:Blocked,cost:Cost=()=>1,paused=false){
  let moved=0,x=position.x,y=position.y,arrived=false;
  if(!paused&&seconds>0&&Number.isFinite(seconds)&&this.stops.length){
   if(this.wait>0)this.wait=Math.max(0,this.wait-seconds);
   else{
    if(!this.path.length){
     const goal=this.stops[this.target];this.path=villageRoute({x:x/this.tile,y:y/this.tile},goal,blocked,cost);
     if(!this.path.length&&Math.floor(x/this.tile)===goal.x&&Math.floor(y/this.tile)===goal.y&&!blocked(goal.x,goal.y)){
      if(Math.hypot(x-(goal.x+.5)*this.tile,y-(goal.y+.5)*this.tile)<.01){arrived=true;this.target=(this.target+1)%this.stops.length;this.wait=this.stopWait;}
      else this.path=[goal];
     }else if(!this.path.length){this.target=(this.target+1)%this.stops.length;this.wait=4;}
    }
    let remaining=this.speed*seconds;
    while(this.path.length&&remaining>0){
     const point=this.path[0];if(blocked(point.x,point.y)){this.path=[];this.wait=1;break;}
     const dx=(point.x+.5)*this.tile-x,dy=(point.y+.5)*this.tile-y,d=Math.hypot(dx,dy);
     if(d<.01){this.path.shift();continue;}
     const travel=Math.min(d,remaining);x+=dx/d*travel;y+=dy/d*travel;remaining-=travel;moved+=travel;this.direction=directionFromVector(Math.abs(dx)<.05?0:dx,Math.abs(dy)<.05?0:dy);
     if(travel>=d-.001){x=(point.x+.5)*this.tile;y=(point.y+.5)*this.tile;this.path.shift();}
     if(!this.path.length){arrived=true;this.target=(this.target+1)%this.stops.length;this.wait=this.stopWait;}
    }
   }
  }
  this.distance+=moved;
  return{x,y,direction:this.direction,phase:moved>0?1+Math.floor(this.distance/5.3)%this.walkFrames:0,moving:moved>0,arrived};
 }
}
