import {advanceSurvivorResidents} from './survivor-residents';
import type {SaveData} from '../types';
import {CAMP_ENTRY,CAMP_VISITOR_SLOTS,campBlockedPoint,campHash} from '../data/survivor-camp';
import {villageRoute} from './village-walk';
import {CHARACTER_DIRECTIONS,directionFromVector,type CharacterDirection} from '../character-directions';
export const CAMP_VISIT_DAYS=3,MAX_CAMP_RESIDENTS=8;
export type SurvivorArea='survivorCamp'|'forest'|'property'|'village';
export type SurvivorTaskKind='wood'|'herbs'|'water';
export interface SurvivorHelp {kind:SurvivorTaskKind;phase:'outbound'|'working'|'returning'|'ready';minutes:number;day:number;message?:string}
export interface CampPerson {area?:SurvivorArea;settled?:boolean;homeInside?:boolean;helpDay?:number;task?:SurvivorHelp;id:string;name:string;character:'farmer-male'|'farmer-female';x:number;y:number;hp:number;status:'arriving'|'staying'|'leaving'|'gone'|'resident';direction:CharacterDirection;distance:number}
export interface SurvivorCampState {cycle:number;nextVisitDay:number;kind:'peaceful'|'hostile';warned:boolean;aggressive:boolean;warningGrace?:number;members:CampPerson[];residents:CampPerson[]}
const PEOPLE=[['Nara','farmer-female'],['Caio','farmer-male'],['Bruna','farmer-female'],['Artur','farmer-male'],['Sofia','farmer-female'],['Henrique','farmer-male'],['Olívia','farmer-female'],['Samuel','farmer-male']] as const;
function visit(save:SaveData,cycle:number,residents:CampPerson[]):SurvivorCampState {
 let seed=0;for(const ch of save.profile.name)seed=(Math.imul(seed,31)+ch.charCodeAt(0))>>>0;
 const kind=cycle===0||campHash(cycle,seed)>.38?'peaceful':'hostile',pool=PEOPLE.filter(([name])=>!residents.some(r=>r.name===name)),names=pool.length?pool:PEOPLE;
 const members=Array.from({length:Math.min(3,names.length)},(_,i):CampPerson=>{const[name,character]=names[(cycle*3+i)%names.length];return{id:`camp-${cycle}-${i}`,name:kind==='hostile'?['Vigia','Saqueador','Batedor'][i]:name,character,x:(CAMP_ENTRY.x+.5)*32+(i-1)*24,y:2270,hp:40,status:'arriving',direction:'up',distance:0};});
 return{cycle,nextVisitDay:Math.min(999999,save.day+CAMP_VISIT_DAYS),kind,warned:false,aggressive:false,members,residents};
}
export function ensureSurvivorCamp(save:SaveData):SurvivorCampState {return save.survivorCamp??=visit(save,0,[]);}
interface Route {key:string;points:{x:number;y:number}[];wait:number}
const routes=new WeakMap<CampPerson,Route>();
export function advanceSurvivorCamp(save:SaveData,seconds:number,player?:{x:number;y:number}):void {
 let camp=save.survivorCamp;if(!camp||!Number.isFinite(seconds)||seconds<=0)return;const dt=Math.min(seconds,.1);
 if(save.day>=camp.nextVisitDay-1)for(const p of camp.members)if(p.status!=='gone')p.status='leaving';
 if(camp.members.every(p=>p.status==='gone')&&save.day>=camp.nextVisitDay&&camp.cycle<999999)camp=save.survivorCamp=visit(save,camp.cycle+1,camp.residents);
 const edits=save.survivorCampMapEdits;
 for(const[index,p]of camp.members.entries()){
  if(p.status==='gone')continue;
  const slot=CAMP_VISITOR_SLOTS[index%CAMP_VISITOR_SLOTS.length];
  const chase=camp.kind==='hostile'&&camp.aggressive&&p.hp>0&&player&&p.status!=='leaving'&&Math.hypot(p.x-player.x,p.y-player.y)<650;
  if(chase&&Math.hypot(p.x-player!.x,p.y-player!.y)<28)continue;
  const goal=p.status==='leaving'?{x:1552,y:2256}:chase?player!:slot;
  if(Math.hypot(p.x-goal.x,p.y-goal.y)<5){if(p.status==='leaving'){p.status='gone';continue;}if(p.status==='arriving')p.status='staying';continue;}
  const key=`${Math.floor(goal.x/32)},${Math.floor(goal.y/32)}`;let route=routes.get(p);
  if(!route||route.key!==key){route={key,points:[],wait:0};routes.set(p,route);}
  route.wait-=dt;
  if(!route.points.length&&route.wait<=0){route.points=villageRoute({x:p.x/32,y:p.y/32},{x:goal.x/32,y:goal.y/32},(x,y)=>campBlockedPoint((x+.5)*32,(y+.5)*32,edits));route.wait=1;}
  const next=route.points[0],target=next?{x:(next.x+.5)*32,y:(next.y+.5)*32}:Math.floor(p.x/32)===Math.floor(goal.x/32)&&Math.floor(p.y/32)===Math.floor(goal.y/32)?goal:undefined;
  if(!target)continue;const dx=target.x-p.x,dy=target.y-p.y,d=Math.hypot(dx,dy),step=Math.min(d,(chase?56:46)*dt);
  if(d<.1){route.points.shift();continue;}
  const x=p.x+dx/d*step,y=p.y+dy/d*step;if(campBlockedPoint(x,y,edits)){route.points=[];route.wait=1;continue;}
  p.x=x;p.y=y;p.distance+=step;p.direction=directionFromVector(Math.abs(dx)<.05?0:dx,Math.abs(dy)<.05?0:dy);if(step>=d-.01)route.points.shift();
 }
 advanceSurvivorResidents(save,dt);
}
export function recruitCampVisitor(save:SaveData,id:string,write:(draft:SaveData)=>boolean):{ok:boolean;message:string}{
 const draft=structuredClone(save),camp=draft.survivorCamp,p=camp?.members.find(p=>p.id===id);
 if(!camp||camp.kind!=='peaceful'||!p||!['arriving','staying'].includes(p.status))return{ok:false,message:'Este visitante não está disponível para recrutamento.'};
 if(camp.residents.length>=MAX_CAMP_RESIDENTS)return{ok:false,message:'A casa comunitária já abriga oito aliados.'};
 if(camp.residents.some(r=>r.id===id))return{ok:false,message:'Este sobrevivente já faz parte do grupo.'};
 p.status='resident';p.area='survivorCamp';p.settled=false;camp.members=camp.members.filter(v=>v.id!==id);camp.residents.push(p);
 try{if(!write(draft))return{ok:false,message:'Não foi possível salvar. O recrutamento foi preservado para tentar novamente.'};}catch{return{ok:false,message:'Não foi possível salvar. Tente novamente.'};}
 save.survivorCamp=camp;return{ok:true,message:`${p.name} se juntou ao seu grupo e vai morar na casa comunitária da vila.`};
}
export function campPersonValid(v:unknown):v is CampPerson {
 if(!v||typeof v!=='object')return false;const p=v as CampPerson;
 return (p.area===undefined||['survivorCamp','forest','property','village'].includes(p.area))&&(p.settled===undefined||typeof p.settled==='boolean')&&(p.homeInside===undefined||typeof p.homeInside==='boolean')&&(p.helpDay===undefined||Number.isSafeInteger(p.helpDay)&&p.helpDay>=1&&p.helpDay<=999999)&&(p.task===undefined||validHelp(p.task))&&typeof p.id==='string'&&/^camp-\d{1,6}-[0-2]$/.test(p.id)&&typeof p.name==='string'&&p.name.length>0&&p.name.length<=32&&['farmer-male','farmer-female'].includes(p.character)&&Number.isFinite(p.x)&&p.x>=16&&p.x<=3056&&Number.isFinite(p.y)&&p.y>=16&&p.y<=2288&&Number.isInteger(p.hp)&&p.hp>=0&&p.hp<=40&&['arriving','staying','leaving','gone','resident'].includes(p.status)&&CHARACTER_DIRECTIONS.includes(p.direction)&&Number.isFinite(p.distance)&&p.distance>=0;
}
function validHelp(t:SurvivorHelp):boolean{return !!t&&typeof t==='object'&&['wood','herbs','water'].includes(t.kind)&&['outbound','working','returning','ready'].includes(t.phase)&&Number.isFinite(t.minutes)&&t.minutes>=0&&t.minutes<=40&&Number.isSafeInteger(t.day)&&t.day>=1&&t.day<=999999&&(t.message===undefined||typeof t.message==='string'&&t.message.length<=160);}
export function advanceHostileWarning(c:SurvivorCampState,seconds:number,distance:number,advancing=false):void {
 if(c.kind!=='hostile'||!c.warned||c.aggressive||!Number.isFinite(seconds)||seconds<=0)return;
 if(distance>210){c.warningGrace=5;return;}c.warningGrace=Math.max(0,(c.warningGrace??5)-Math.min(seconds,.1));if(c.warningGrace===0||advancing&&distance<75)c.aggressive=true;
}
export function validSurvivorCamp(v:unknown):v is SurvivorCampState {
 if(!v||typeof v!=='object')return false;const c=v as SurvivorCampState;
 return Number.isSafeInteger(c.cycle)&&c.cycle>=0&&c.cycle<=999999&&Number.isSafeInteger(c.nextVisitDay)&&c.nextVisitDay>=1&&c.nextVisitDay<=999999&&['peaceful','hostile'].includes(c.kind)&&(c.warningGrace===undefined||Number.isFinite(c.warningGrace)&&c.warningGrace>=0&&c.warningGrace<=5)&&typeof c.warned==='boolean'&&typeof c.aggressive==='boolean'&&(!c.aggressive||c.kind==='hostile'&&c.warned)&&Array.isArray(c.members)&&c.members.length<=3&&c.members.every(p=>campPersonValid(p)&&p.status!=='resident')&&Array.isArray(c.residents)&&c.residents.length<=MAX_CAMP_RESIDENTS&&c.residents.every(p=>campPersonValid(p)&&p.status==='resident')&&new Set([...c.members,...c.residents].map(p=>p.id)).size===c.members.length+c.residents.length;
}
