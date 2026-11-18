import {bentoTravelling,bentoTripPending,bentoAvailability} from './bento-schedule';
import {beginFisherLakeTrip} from './fisher-travel';
import type {SaveData} from '../types';
import {damiaoAtLake,FISHER_LAKE_HOURS} from '../data/fisher-schedule';
import {CHARACTER_DIRECTIONS,type CharacterDirection} from '../character-directions';
import {merchantOutside,type ResidentId} from './merchant-visit';
import {VillageWalk} from './village-walk';
import {villageGround} from '../data/village';
import type {BentoRoomNavigation} from './bento-routine';
import type {GameClock} from './clock';
import {MERCHANT_VISITS} from '../data/merchant-visits';
import {MERCHANT_LUNCHES,merchantLunchHours} from '../data/merchant-lunches';
import {villageExtra,restDay,restDays,INN_GUESTS,STROLL,type VillageExtra} from '../data/village-schedule';

export type RoutineId='augusto'|'bento'|'rosa'|'tobias'|'amelia'|'nilo'|'celina'|'damiao'|'helena'|'icaro';
export type RoutineArea='village'|'shop';
export interface MerchantRoutineState {
 area:RoutineArea;x:number;y:number;direction:CharacterDirection;stop:number;wait:number;
 serviceUntil:number;socialUntil:number;socialDay:number;
 /** Omitted in legacy saves and when the resident occupies their own shop. */
 roomOwner?:RoutineId;
 updatedAt?:number;
}
export const MERCHANT_DAILY_PLAN={
 opening:8*60,lunch:12*60,return:13*60+30,closing:{augusto:20*60,bento:19*60,rosa:18*60,tobias:18*60,amelia:18*60,nilo:18*60,celina:18*60,damiao:18*60,helena:22*60,icaro:18*60},
 speed:34,stopSeconds:6,guideMinutes:45,socialMinutes:12,
 plaza:{augusto:{x:50,y:41},bento:{x:49,y:41},rosa:{x:48,y:43},tobias:{x:45,y:43},amelia:{x:47,y:43},nilo:{x:50,y:43},celina:{x:51,y:43},damiao:{x:43,y:41},helena:{x:44,y:41},icaro:{x:46,y:43}},
} as const;
const absolute=(c:GameClock)=>c.day*1440+c.time;
export const dailyMerchant=(id:ResidentId):id is RoutineId=>id==='augusto'||id==='bento'||id==='rosa'||id==='tobias'||id==='amelia'||id==='nilo'||id==='celina'||id==='damiao'||id==='helena'||id==='icaro';
/** Com `day`, considera também a folga semanal (loja fechada o dia todo). */
export function merchantPeriod(id:RoutineId,time:number,day?:number):'work'|'break'|'closed'{
 const p=MERCHANT_DAILY_PLAN;
 if(day!==undefined&&restDay(id,day))return'closed';
 const lunch=MERCHANT_LUNCHES[id];
 return time<p.opening||time>=p.closing[id]?'closed':time>=lunch.start&&time<lunch.end?'break':'work';
}
export const merchantMayEnter=(shop:RoutineId,clock:GameClock,actor:'player'|RoutineId='player'):boolean=>actor===shop||(shop==='bento'?bentoAvailability(clock).open:merchantPeriod(shop,clock.time,clock.day)!=='closed');
export function validMerchantRoutine(v:unknown):v is MerchantRoutineState{
 if(!v||typeof v!=='object')return false;const s=v as MerchantRoutineState;
 return (s.area==='village'||s.area==='shop')&&Number.isFinite(s.x)&&Number.isFinite(s.y)
  &&(s.area==='shop'?s.x>=0&&s.x<=576&&s.y>=0&&s.y<=384:s.x>=32&&s.x<=3040&&s.y>=32&&s.y<=2272)
  &&CHARACTER_DIRECTIONS.includes(s.direction)&&Number.isInteger(s.stop)&&s.stop>=0&&s.stop<4
  &&Number.isFinite(s.wait)&&s.wait>=0&&s.wait<=60
  &&[s.serviceUntil,s.socialUntil].every(n=>Number.isFinite(n)&&n>=0&&n<=1440*1_000_001)
  &&Number.isSafeInteger(s.socialDay)&&s.socialDay>=0&&s.socialDay<=999999
  &&(s.updatedAt===undefined||Number.isFinite(s.updatedAt)&&s.updatedAt>=0&&s.updatedAt<=1440*1_000_001)
  &&(s.roomOwner===undefined||s.area==='shop'&&dailyMerchant(s.roomOwner));
}
export function validMerchantRoutines(value:unknown):boolean{
 return !!value&&typeof value==='object'&&!Array.isArray(value)&&Object.entries(value).every(([id,s])=>dailyMerchant(id as ResidentId)&&validMerchantRoutine(s));
}
export interface RoutineEnvironment {
 cellBlocked?:(area:RoutineArea,x:number,y:number)=>boolean;
 blocked:(area:RoutineArea,x:number,y:number,owner?:RoutineId)=>boolean;
 fits:(area:RoutineArea,x:number,y:number,owner?:RoutineId)=>boolean;
 arrival:(area:RoutineArea,preferred:{x:number;y:number},owner?:RoutineId)=>{x:number;y:number}|null;
}

/** Uses the existing village A* and walk cycle. Only game-clock minutes select
 * destinations; a blocked doorway never transfers or duplicates the resident. */
export class MerchantDailyRoutine {
 readonly state:MerchantRoutineState;
 private walker?:VillageWalk;
 private target='';
 private walking=false;
 private conversationHeld=false;
 private external=false;
 setExternal(value:boolean):void{this.external=value;if(value){this.walking=false;this.resetPath();}}
 get externallyControlled(){return this.external;}
 constructor(readonly owner:RoutineId,position:{x:number;y:number;direction:CharacterDirection;shop:boolean},private room:BentoRoomNavigation,saved?:MerchantRoutineState,private readonly walkFrames=6,private readonly navigationFor?:(owner:RoutineId)=>BentoRoomNavigation){
  this.state=structuredClone(validMerchantRoutine(saved)?saved:{area:position.shop?'shop':'village',x:position.x,y:position.y,direction:position.direction,stop:0,wait:0,serviceUntil:0,socialUntil:0,socialDay:0});
 }
 setRoom(room:BentoRoomNavigation):void{this.room=room;this.resetPath();}
 private resetPath():void{this.walker=undefined;this.target='';}
 get roomOwner():RoutineId{return this.state.roomOwner??this.owner;}
 get homeNavigation():BentoRoomNavigation{return this.room;}
 get navigation():BentoRoomNavigation{return this.roomOwner===this.owner?this.room:this.navigationFor?.(this.roomOwner)??this.room;}
 get activity():string{return this.target;}
 get isMoving():boolean{return this.walking;}
 get plazaReady():boolean{
  const p=MERCHANT_DAILY_PLAN.plaza[this.owner];
  return !this.external&&this.state.area==='village'&&this.target==='plaza'&&!this.walking&&Math.hypot(this.state.x-(p.x+.5)*32,this.state.y-(p.y+.5)*32)<24;
 }
 holdStill(held:boolean):void{this.conversationHeld=held;}
 isServing(clock:GameClock):boolean{if(this.owner==='bento'&&'bentoTravel'in clock&&(clock as SaveData).bentoTravel?.trip?.purpose==='workshop')return bentoAvailability(clock as SaveData).open;return !this.external&&!(this.owner==='bento'&&bentoTravelling(clock))&&!(this.owner==='damiao'&&damiaoAtLake(clock))&&this.state.area==='shop'&&this.roomOwner===this.owner&&(merchantPeriod(this.owner,clock.time,clock.day)==='work'||merchantPeriod(this.owner,clock.time,clock.day)==='break'&&this.state.serviceUntil>absolute(clock));}
 private visit(clock:GameClock){if(this.owner==='bento'&&'profile'in clock&&bentoTripPending(clock as SaveData))return;const plan=MERCHANT_VISITS[this.owner];return this.navigationFor&&this.state.serviceUntil<=absolute(clock)&&clock.time>=plan.start&&clock.time<plan.end&&merchantMayEnter(plan.host,clock,this.owner)?plan:undefined;}
 conversation(clock:GameClock):{host:RoutineId;id:RoutineId;text:string}|undefined{
  if(this.external||this.owner==='bento'&&bentoTravelling(clock)||this.owner==='damiao'&&damiaoAtLake(clock))return;
  const plan=this.visit(clock);if(merchantPeriod(this.owner,clock.time,clock.day)!=='work'||!plan||this.walking||this.state.area!=='shop'||this.roomOwner!==plan.host||this.activity!=='visit-talk'||this.state.wait<=0||Math.hypot(this.state.x-288,this.state.y-230)>56)return;
  return{host:plan.host,id:this.owner,text:plan.lines[0]};
 }
 holdConversation(clock:GameClock):void{this.state.socialUntil=absolute(clock)+.15;}
 availability(clock:GameClock):{message:string;canGuide:boolean}{
  if(this.owner==='bento'&&(bentoTravelling(clock)||'profile'in clock&&bentoTripPending(clock as SaveData)))return{message:bentoTravelling(clock)?bentoAvailability(clock).message:'Bento vai preparar a viagem à mina. Aguarde o retorno para pedir atendimento.',canGuide:false};
  if(this.owner==='damiao'&&damiaoAtLake(clock))return{message:'Na cabana do lago · '+FISHER_LAKE_HOURS.label,canGuide:false};
  const lunch=merchantLunchHours(this.owner),extra=this.extra(clock),off=restDay(this.owner,clock.day),days=restDays(this.owner);
  if(off)return{message:extra==='inn'?'Folga hoje · na pousada da Helena por causa da chuva':extra==='stroll'?'Folga hoje · passeando pela vila':'Folga hoje · loja fechada',canGuide:false};
  if(extra==='inn'&&this.owner!=='helena')return{message:clock.time>=MERCHANT_DAILY_PLAN.closing[this.owner]?'Jantando na pousada da Helena · até as 21:00':`Almoço na pousada (chuva) · volta às ${lunch.end}`,canGuide:false};
  const folga=days.length?` · folga nos dias ${days.slice(0,-1).join(', ')} e ${days.at(-1)}`:'';
  const period=merchantPeriod(this.owner,clock.time,clock.day),hours=`08:00–${lunch.start} e ${lunch.end}–${String(MERCHANT_DAILY_PLAN.closing[this.owner]/60).padStart(2,'0')}:00`;
  const visit=this.visit(clock);if(visit)return{message:visit.purpose+' · volta após a visita',canGuide:false};
  return {message:this.isServing(clock)?`Atendendo na loja · ${hours}`:period==='break'?`Intervalo na praça · volta às ${lunch.end}`:period==='closed'?`Atendimento encerrado · abre às 08:00 · ${hours}${folga}`:`A caminho da loja · ${hours}`,canGuide:period==='work'};
 }
 guided(clock:GameClock,position:{x:number;y:number},shop:boolean):void{
  Object.assign(this.state,{x:position.x,y:position.y},{area:shop?'shop':'village',wait:0,socialUntil:0,serviceUntil:absolute(clock)+MERCHANT_DAILY_PLAN.guideMinutes,direction:shop?'down':this.state.direction});delete this.state.roomOwner;this.resetPath();
 }
 /** Pousada ou passeio do dia (src/data/village-schedule.ts); só com navegação entre lojas. */
 extra(clock:GameClock):VillageExtra|undefined{return this.navigationFor?villageExtra(this.owner,clock,MERCHANT_DAILY_PLAN.closing[this.owner],MERCHANT_LUNCHES[this.owner]):undefined;}
 socialize(clock:GameClock):void{this.state.socialUntil=absolute(clock)+MERCHANT_DAILY_PLAN.socialMinutes;this.state.socialDay=clock.day;this.resetPath();}
 /** Passeio da folga: praça, depois a frente de duas lojas de vizinhos, trocando a cada 50 min. */
 private strollPoint(clock:GameClock):{x:number;y:number}{
  const ids=Object.keys(MERCHANT_DAILY_PLAN.closing) as RoutineId[],i=ids.indexOf(this.owner),plaza=MERCHANT_DAILY_PLAN.plaza[this.owner];
  const spots=[{x:(plaza.x+.5)*32,y:(plaza.y+.5)*32},...[3,6].map(k=>{const o=merchantOutside(ids[(i+k)%ids.length]);return{x:o.x,y:o.y+40};})];
  return spots[Math.floor((clock.time-STROLL.start)/STROLL.minutes)%spots.length];
 }
 private blocked(area:RoutineArea,x:number,y:number,env:RoutineEnvironment):boolean {
  if(area==='village'){
   if((env.cellBlocked??env.blocked)(area,x,y))return true;
   // A tile center can be clear while a facade edge crosses the actor's feet
   // between centers. Reserve a small walk corridor around each route cell.
   return [[-8,-8],[8,-8],[-8,8],[8,8]].some(([dx,dy])=>!env.fits(area,(x+.5)*32+dx,(y+.5)*32+dy));
  }
  if(env.cellBlocked)return env.cellBlocked(area,x,y);
  if(env.blocked(area,x,y))return true;const tile=this.navigation.tileSize??32;
  return area==='shop'&&[[0,0],[tile,0],[0,tile],[tile,tile]].some(([dx,dy])=>!env.fits(area,x*tile+dx,y*tile+dy));
 }
 private goal(point:{x:number;y:number},tile:number,env:RoutineEnvironment):{x:number;y:number}|undefined{
  const x=Math.floor(point.x/tile),y=Math.floor(point.y/tile),open=(x:number,y:number)=>!this.blocked(this.state.area,x,y,env);
  if(open(x,y))return{x,y};
  // Edited furniture or a passing actor may occupy a stop. Choose nearby ground
  // instead of walking through it or repeatedly trying the occupied coordinate.
  for(let r=1;r<=6;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++)if(Math.max(Math.abs(dx),Math.abs(dy))===r&&open(x+dx,y+dy))return{x:x+dx,y:y+dy};
 }
 private move(point:{x:number;y:number},key:string,seconds:number,env:RoutineEnvironment){
  const s=this.state,tile=s.area==='shop'?(this.navigation.tileSize??32):32;
  if(this.target!==key){this.resetPath();this.target=key;}
  if(!this.walker){const goal=this.goal(point,tile,env);if(!goal)return{moving:false,phase:0,arrived:false};this.walker=new VillageWalk([goal],s.area==='village'&&this.navigationFor?48:MERCHANT_DAILY_PLAN.speed,0,0,tile,this.walkFrames);}
  const step=this.walker.step(seconds,s,(x,y)=>this.blocked(s.area,x,y,env),s.area==='village'?(x,y)=>['path','paving'].includes(villageGround(x,y))?1:2.4:()=>1);
  if(step.moving&&!env.fits(s.area,step.x,step.y)){this.resetPath();s.wait=.3;return{moving:false,phase:0,arrived:false};}
  s.x=step.x;s.y=step.y;if(step.moving)s.direction=step.direction;
  this.walking=step.moving;
  return{moving:step.moving,phase:step.phase,arrived:step.arrived};
 }
 step(seconds:number,clock:GameClock,env:RoutineEnvironment){
  const s=this.state;let phase=0,moving=false,transferred=false;
  this.walking=false;
  if(Number.isFinite(seconds)&&seconds>0)s.updatedAt=absolute(clock);
  if(this.owner==='damiao'&&damiaoAtLake(clock))return{...s,phase,moving,transferred};
  if(this.external||this.owner==='bento'&&bentoTravelling(clock))return{...s,phase,moving,transferred};
  if(this.conversationHeld)return{...s,phase,moving,transferred};
  if(!Number.isFinite(seconds)||seconds<=0)return{...s,phase,moving,transferred};seconds=Math.min(seconds,.1);
  const now=absolute(clock),period=merchantPeriod(this.owner,clock.time,clock.day),extra=this.extra(clock);
  const inn=extra==='inn'&&this.owner!=='helena'&&merchantMayEnter('helena',clock,this.owner);
  const visit=period==='work'&&!extra?this.visit(clock):undefined,destination=inn?'helena':visit?.host??this.owner;
  if(s.socialUntil>now&&period==='break')return{...s,phase,moving,transferred};
  if(s.socialUntil>now&&s.area==='shop'&&this.roomOwner===this.owner&&destination===this.owner&&period==='work'){
   const result=this.move({x:288,y:151},'receiving-visitor',seconds,env);phase=result.phase;moving=result.moving;
   return{...s,phase,moving,transferred};
  }
  if(s.wait>0){s.wait=Math.max(0,s.wait-seconds);return{...s,phase,moving,transferred};}
  const toLake=this.owner==='damiao'&&'profile' in clock&&(clock as SaveData).fisherTravel?.mode==='village'&&clock.time>=420&&clock.time<690;
  if(toLake&&s.area==='village'){const step=this.move({x:50.5*32,y:2.5*32},'lake-departure',seconds,env);if(step.arrived)beginFisherLakeTrip(clock as SaveData);return{...s,phase:step.phase,moving:step.moving,transferred};}
  const outside=toLake||extra==='stroll'||!inn&&period==='break'&&s.serviceUntil<=now;
  const transfer=(area:RoutineArea,preferred:{x:number;y:number},owner:RoutineId=this.owner)=>{const free=env.arrival(area,preferred,owner);if(!free||Math.hypot(free.x-preferred.x,free.y-preferred.y)>24){s.wait=1;return;}Object.assign(s,free,{area,stop:0,wait:.3});if(area==='shop'&&owner!==this.owner)s.roomOwner=owner;else delete s.roomOwner;this.resetPath();transferred=true;};
  if(s.area==='shop'&&(outside||this.roomOwner!==destination)){
   const current=this.roomOwner,nav=this.navigation,door=nav.exit??nav.entry??{x:288,y:335};
   const result=this.move(door,'exit',seconds,env);phase=result.phase;moving=result.moving;
   if(result.arrived&&Math.hypot(s.x-door.x,s.y-door.y)<16)transfer('village',merchantOutside(current));
  }else if(s.area==='village'&&!outside){
   const result=this.move(merchantOutside(destination),inn?'inn':visit?'visit-'+destination:'return',seconds,env);phase=result.phase;moving=result.moving;
   const nav=destination===this.owner?this.room:this.navigationFor!(destination);
   if(result.arrived&&Math.hypot(s.x-merchantOutside(destination).x,s.y-merchantOutside(destination).y)<25&&merchantMayEnter(destination,clock,this.owner))transfer('shop',nav.entry??{x:288,y:335},destination);
  }else if(s.area==='village'&&extra==='stroll'){
   const p=this.strollPoint(clock),result=this.move(p,'stroll-'+Math.floor(clock.time/STROLL.minutes),seconds,env);phase=result.phase;moving=result.moving;if(result.arrived)s.wait=3;
  }else if(s.area==='village'){
   const p=MERCHANT_DAILY_PLAN.plaza[this.owner],result=this.move({x:(p.x+.5)*32,y:(p.y+.5)*32},'plaza',seconds,env);phase=result.phase;moving=result.moving;if(result.arrived)s.wait=1;
  }else if(inn&&this.roomOwner==='helena'){
   const nav=this.navigation,stops=nav.stops?.length?nav.stops:[{x:36,y:19}],tile=nav.tileSize??32,p=stops[(INN_GUESTS.indexOf(this.owner)+1)%stops.length];
   const result=this.move({x:(p.x+.5)*tile,y:(p.y+.5)*tile},'inn-seat',seconds,env);phase=result.phase;moving=result.moving;if(result.arrived){s.direction='down';s.wait=4;}
  }else if(visit&&this.roomOwner===visit.host){
   const result=this.move({x:288,y:230},'visit-talk',seconds,env);phase=result.phase;moving=result.moving;
   if(result.arrived){s.direction='up';s.wait=1;}
  }else if(period!=='closed'){
   const stops=this.room.stops?.length?this.room.stops:[{x:36,y:19}],tile=this.room.tileSize??32,plan=MERCHANT_VISITS[this.owner],index=this.navigationFor?plan.workOrder[s.stop%plan.workOrder.length]:s.stop,p=stops[index%stops.length];
   const result=this.move({x:(p.x+.5)*tile,y:(p.y+.5)*tile},'work-'+s.stop,seconds,env);phase=result.phase;moving=result.moving;
   if(result.arrived){s.stop=(s.stop+1)%Math.min(4,stops.length);s.wait=this.navigationFor?plan.pause:MERCHANT_DAILY_PLAN.stopSeconds;this.resetPath();}
  }else{const tile=this.room.tileSize??32,p=this.room.stops?.[0]??{x:36,y:18};const result=this.move({x:(p.x+.5)*tile,y:(p.y+.5)*tile},'rest',seconds,env);phase=result.phase;moving=result.moving;if(result.arrived){s.direction='down';s.wait=2;}}
  return{...s,phase,moving,transferred};
 }
}
export const MERCHANT_SMALL_TALK=[
 ['Bento, preciso de umas dobradiças para o armazém.','Passa na ferraria depois do intervalo. Eu separo para você.'],
 ['O movimento está bom hoje, Bento?','Sempre aparece uma ferramenta precisando de cuidado.'],
 ['Guardei alguns suprimentos para a oficina.','Obrigado, Augusto. Depois levo as peças que você pediu.'],
] as const;
