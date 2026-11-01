export interface BirdPoint {x:number;y:number}
export interface AmbientBirdState extends BirdPoint {
 id:number;variant:number;phase:'perched'|'hop'|'fly';age:number;wait:number;cycle:number;
 flockId?:number;flock?:BirdPoint;
 from:BirdPoint;target:BirdPoint;direction:number;active:boolean;
}
const noise=(n:number)=>{const v=Math.sin(n*127.1+31.7)*43758.5453;return v-Math.floor(v);};
const free=(p:BirdPoint,canLand:(x:number,y:number)=>boolean)=>p.x>=48&&p.y>=48&&p.x<=3024&&p.y<=2256&&canLand(p.x,p.y)&&canLand(p.x-4,p.y)&&canLand(p.x+4,p.y);
function landing(id:number,center:BirdPoint,radius:number,canLand:(x:number,y:number)=>boolean):BirdPoint|undefined {
 for(let i=0;i<18;i++){
  const angle=noise(id+i*17)*Math.PI*2,d=radius*(.3+noise(id+i*19+2)*.7);
  const p={x:center.x+Math.cos(angle)*d,y:center.y+Math.sin(angle)*d};if(free(p,canLand))return p;
 }
 return undefined;
}
export function createAmbientBird(id:number,center:BirdPoint,canLand:(x:number,y:number)=>boolean):AmbientBirdState|undefined{
 const p=landing(id,center,300,canLand);if(!p)return;
 return {...p,id,variant:id%2,phase:'perched',age:0,wait:2+noise(id+3)*6,cycle:0,from:{...p},target:{...p},direction:noise(id+4)<.5?-1:1,active:true};
}
/** Separate small flocks spawn at a distance; never repopulate directly around the player. */
export function createAmbientFlock(id:number,player:BirdPoint,canLand:(x:number,y:number)=>boolean,otherCenters:readonly BirdPoint[]=[],count=2):AmbientBirdState[]|undefined {
 for(let attempt=0;attempt<24;attempt++){
  const angle=noise(id+attempt*43)*Math.PI*2,distance=420+noise(id+attempt*29+7)*240;
  const center={x:player.x+Math.cos(angle)*distance,y:player.y+Math.sin(angle)*distance};
  if(center.x<96||center.y<96||center.x>2976||center.y>2208||otherCenters.some(p=>Math.hypot(p.x-center.x,p.y-center.y)<280))continue;
  const birds:AmbientBirdState[]=[];
  for(let member=0;member<count;member++){
   const birdId=id*7+member,p=landing(birdId,center,48,(x,y)=>canLand(x,y)&&Math.hypot(x-player.x,y-player.y)>=320&&birds.every(b=>Math.hypot(b.x-x,b.y-y)>20));
   if(!p)break;
   birds.push({...p,id:birdId,variant:id%2,phase:'perched',age:0,wait:2+noise(birdId+3)*6,cycle:0,from:{...p},target:{...p},direction:noise(birdId+4)<.5?-1:1,active:true,flockId:id,flock:{...center}});
  }
  if(birds.length===count)return birds;
 }
 return undefined;
}
export const daylightBirds=(time:number):boolean=>time>=6*60&&time<19*60;
export function stepAmbientBird(b:AmbientBirdState,seconds:number,player:BirdPoint,canLand:(x:number,y:number)=>boolean,flockFlee=false):void{
 if(!b.active||!Number.isFinite(seconds)||seconds<=0)return;
 const dt=Math.min(seconds,.1);b.age+=dt;
 if(b.phase!=='fly'&&(flockFlee||Math.hypot(b.x-player.x,b.y-player.y)<78)){
  const anchor=b.flock??b,baseAngle=Math.hypot(anchor.x-player.x,anchor.y-player.y)>.01?Math.atan2(anchor.y-player.y,anchor.x-player.x):noise(b.flockId??b.id)*Math.PI*2;
  let target:BirdPoint|undefined,center:BirdPoint|undefined;
  for(const turn of [0,Math.PI/4,-Math.PI/4,Math.PI/2,-Math.PI/2,Math.PI]){
   const candidate={x:anchor.x+Math.cos(baseAngle+turn)*220,y:anchor.y+Math.sin(baseAngle+turn)*220};
   const safe=landing((b.flockId??b.id)+b.cycle*31,candidate,b.flock?48:120,(x,y)=>canLand(x,y)&&Math.hypot(x-player.x,y-player.y)>150);
   if(!safe)continue;
   center=safe;target=b.flock?landing(b.id+b.cycle*31,safe,28,canLand)??safe:safe;break;
  }
  if(!target){b.active=false;return;}
  if(b.flock)b.flock={...center!};
  b.from={x:b.x,y:b.y};b.target=target;b.phase='fly';b.age=0;b.cycle++;
 }
 if(b.phase==='perched'){
  b.wait-=dt;if(b.wait>0)return;
  const target=landing(b.id+b.cycle*53,b.flock&&Math.hypot(b.x-b.flock.x,b.y-b.flock.y)>65?b.flock:{x:b.x,y:b.y},38,(x,y)=>canLand(x,y)&&(!b.flock||Math.hypot(x-b.flock.x,y-b.flock.y)<80));
  b.cycle++;
  if(target){b.from={x:b.x,y:b.y};b.target=target;b.phase='hop';b.age=0;}else b.wait=2;
  return;
 }
 const duration=b.phase==='fly'?2.2:.45,t=Math.min(1,b.age/duration);
 b.x=b.from.x+(b.target.x-b.from.x)*t;b.y=b.from.y+(b.target.y-b.from.y)*t;
 if(Math.abs(b.target.x-b.from.x)>.01)b.direction=b.target.x>b.from.x?1:-1;
 if(t===1){
  if(!free(b.target,canLand)){b.active=false;return;}
  b.phase='perched';b.age=0;b.wait=2+noise(b.id+b.cycle*41)*6;
 }
}
export const ambientBirdLift=(b:AmbientBirdState):number=>b.phase==='perched'?0:Math.sin(Math.PI*Math.min(1,b.age/(b.phase==='fly'?2.2:.45)))*(b.phase==='fly'?34:5);
