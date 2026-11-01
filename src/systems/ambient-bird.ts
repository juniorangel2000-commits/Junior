export interface BirdPoint {x:number;y:number}
export interface AmbientBirdState extends BirdPoint {
 id:number;variant:number;phase:'perched'|'hop'|'fly';age:number;wait:number;cycle:number;
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
export const daylightBirds=(time:number):boolean=>time>=6*60&&time<19*60;
export function stepAmbientBird(b:AmbientBirdState,seconds:number,player:BirdPoint,canLand:(x:number,y:number)=>boolean,flockFlee=false):void{
 if(!b.active||!Number.isFinite(seconds)||seconds<=0)return;
 const dt=Math.min(seconds,.1);b.age+=dt;
 if(b.phase!=='fly'&&(flockFlee||Math.hypot(b.x-player.x,b.y-player.y)<78)){
  const d=Math.hypot(b.x-player.x,b.y-player.y)||1;
  const center={x:b.x+(b.x-player.x)/d*200,y:b.y+(b.y-player.y)/d*200};
  const target=landing(b.id+b.cycle*31,center,120,canLand);
  if(!target){b.active=false;return;}
  b.from={x:b.x,y:b.y};b.target=target;b.phase='fly';b.age=0;b.cycle++;
 }
 if(b.phase==='perched'){
  b.wait-=dt;if(b.wait>0)return;
  const target=landing(b.id+b.cycle*53,{x:b.x,y:b.y},38,canLand);
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
