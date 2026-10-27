import {directionFromVector,type CharacterDirection} from '../character-directions';
import {WORLD_WIDTH,WORLD_HEIGHT,TILE} from '../data/world-size';
type Point={x:number;y:number};
type Blocked=(x:number,y:number)=>boolean;
type Cost=(x:number,y:number)=>number;
const index=(x:number,y:number)=>y*WORLD_WIDTH+x;
const inside=(x:number,y:number)=>x>=1&&y>=1&&x<WORLD_WIDTH-1&&y<WORLD_HEIGHT-1;

/** Weighted A*: prefer the village streets and never cut diagonally between
 * walls, trees, garden fences or the new street lamps. */
export function villageRoute(start:Point,goal:Point,blocked:Blocked,cost:Cost=()=>1):Point[]{
 const sx=Math.floor(start.x),sy=Math.floor(start.y),gx=Math.floor(goal.x),gy=Math.floor(goal.y);
 if(!inside(sx,sy)||!inside(gx,gy))return [];
 const blockedCells=new Uint8Array(WORLD_WIDTH*WORLD_HEIGHT),costs=new Float64Array(blockedCells.length);
 const occupied=(x:number,y:number)=>{const i=index(x,y);if(!blockedCells[i])blockedCells[i]=blocked(x,y)?2:1;return blockedCells[i]===2;};
 const weight=(x:number,y:number)=>{const i=index(x,y);return costs[i]||(costs[i]=Math.max(1,cost(x,y)));};
 if(occupied(gx,gy)||sx===gx&&sy===gy)return [];
 const from=new Int32Array(WORLD_WIDTH*WORLD_HEIGHT).fill(-1),scores=new Float64Array(from.length).fill(Infinity);
 const open:Array<{id:number;priority:number}>=[];
 const push=(value:{id:number;priority:number})=>{let i=open.length;open.push(value);while(i>0){const p=(i-1)>>1;if(open[p].priority<=value.priority)break;open[i]=open[p];i=p;}open[i]=value;};
 const pop=()=>{const best=open[0],last=open.pop()!;if(open.length){let i=0;while(i*2+1<open.length){let child=i*2+1;if(child+1<open.length&&open[child+1].priority<open[child].priority)child++;if(open[child].priority>=last.priority)break;open[i]=open[child];i=child;}open[i]=last;}return best;};
 const source=index(sx,sy),target=index(gx,gy);scores[source]=0;push({id:source,priority:0});
 const closed=new Uint8Array(from.length);
 while(open.length){
  const current=pop().id;if(closed[current])continue;closed[current]=1;
  if(current===target){const path:Point[]=[];for(let p=target;p!==source;p=from[p]){if(p<0)return [];path.push({x:p%WORLD_WIDTH,y:Math.floor(p/WORLD_WIDTH)});}return path.reverse();}
  const x=current%WORLD_WIDTH,y=Math.floor(current/WORLD_WIDTH);
  for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){
   const nx=x+dx,ny=y+dy;if(!inside(nx,ny)||occupied(nx,ny)||dx&&dy&&(occupied(x+dx,y)||occupied(x,y+dy)))continue;
   const next=index(nx,ny),score=scores[current]+Math.hypot(dx,dy)*weight(nx,ny);
   if(score>=scores[next])continue;scores[next]=score;from[next]=current;push({id:next,priority:score+Math.hypot(gx-nx,gy-ny)});
  }
 }
 return [];
}

export class VillageWalk {
 private path:Point[]=[];
 private target=0;
 private wait:number;
 private distance=0;
 private direction:CharacterDirection='down';
 constructor(private readonly stops:readonly Point[],private readonly speed=34,initialWait=8,private readonly stopWait=12,private readonly tile=TILE){this.wait=initialWait;}
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
  return{x,y,direction:this.direction,phase:moved>0?1+Math.floor(this.distance/5.3)%6:0,moving:moved>0,arrived};
 }
}
