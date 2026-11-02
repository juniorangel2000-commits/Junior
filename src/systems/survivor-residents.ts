import type {SaveData} from '../types';
import type {CampPerson,SurvivorArea,SurvivorTaskKind} from './survivor-camp';
import {CAMP_ENTRY} from '../data/survivor-camp';
import {FOREST_CAMP_RETURN,FOREST_CAMP_EXIT} from '../data/forest-camp-access';
import {defaultMap} from '../data/default-maps';
import {PROPERTY_VILLAGE_ENTRY,PROPERTY_VILLAGE_EXIT} from '../data/property-village-gate';
import {VILLAGE_ENTRY,VILLAGE_EXIT} from '../data/village';
import {villageRoute} from './village-walk';
import {directionFromVector} from '../character-directions';
import {survivorNavigation} from './survivor-navigation';
import {Inventory} from './inventory';
export const COMMUNITY_DOOR={x:1840,y:560};
export const SURVIVOR_TASKS={wood:{label:'Buscar madeira caída',description:'Recolher 4 madeiras na Floresta Antiga e trazer até a vila.',minutes:30},herbs:{label:'Coletar ervas',description:'Recolher 2 ervas na Floresta Antiga e trazer até a vila.',minutes:40},water:{label:'Regar a horta',description:'Regar até 6 plantas na propriedade. Usa água do poço.',minutes:20}} as const;
const center=(p:{x:number;y:number})=>({x:(p.x+.5)*32,y:(p.y+.5)*32});
const homeSlot=(index:number)=>({x:1760+(index%4)*48,y:608+Math.floor(index/4)*48});
interface Leg {goal:{x:number;y:number};next?:SurvivorArea;arrival?:{x:number;y:number}}
function legs(save:SaveData,p:CampPerson,target:SurvivorArea):Leg {
 const area=p.area??'survivorCamp',forest=save.forestMapEdits??defaultMap('forest'),property=save.mapEdits??defaultMap('property');
 if(area==='survivorCamp')return{goal:center({x:CAMP_ENTRY.x,y:70}),next:'forest',arrival:center(FOREST_CAMP_RETURN)};
 if(area==='forest')return target==='survivorCamp'?{goal:center(FOREST_CAMP_EXIT),next:'survivorCamp',arrival:center(CAMP_ENTRY)}:{goal:center(forest.points?.exit??{x:94,y:52}),next:'property',arrival:center(property.points?.entry??{x:2,y:52})};
 if(area==='property')return target==='forest'?{goal:center(property.points?.exit??{x:1,y:52}),next:'forest',arrival:center(forest.points?.entry??{x:93,y:52})}:{goal:center(PROPERTY_VILLAGE_EXIT),next:'village',arrival:center(save.villageMapEdits?.points?.entry??VILLAGE_ENTRY)};
 return{goal:center(save.villageMapEdits?.points?.exit??VILLAGE_EXIT),next:'property',arrival:center(PROPERTY_VILLAGE_ENTRY)};
}
const paths=new WeakMap<CampPerson,{key:string;points:{x:number;y:number}[];retry:number}>();
/** Return true only at the requested point. No blocked route becomes a teleport. */
function walk(save:SaveData,p:CampPerson,goal:{x:number;y:number},dt:number):boolean {
 const area=p.area??'survivorCamp',blocked=survivorNavigation(save,area),key=`${area}:${Math.floor(goal.x/32)},${Math.floor(goal.y/32)}`;
 if(Math.hypot(p.x-goal.x,p.y-goal.y)<3)return true;
 let route=paths.get(p);if(!route||route.key!==key){route={key,points:[],retry:0};paths.set(p,route);}route.retry-=dt;
 if(!route.points.length&&route.retry<=0){route.points=villageRoute({x:p.x/32,y:p.y/32},{x:goal.x/32,y:goal.y/32},blocked);route.retry=1;}
 const tile=route.points[0],same=Math.floor(p.x/32)===Math.floor(goal.x/32)&&Math.floor(p.y/32)===Math.floor(goal.y/32),to=tile?center(tile):same?goal:undefined;if(!to)return false;
 if(blocked(Math.floor(to.x/32),Math.floor(to.y/32))){route.points=[];return false;}
 const dx=to.x-p.x,dy=to.y-p.y,d=Math.hypot(dx,dy);if(d<.01){route.points.shift();return false;}
 const distance=Math.min(d,46*dt),x=p.x+dx/d*distance,y=p.y+dy/d*distance;
 if(blocked(Math.floor(x/32),Math.floor(y/32))){route.points=[];return false;}
 p.x=x;p.y=y;p.direction=directionFromVector(Math.abs(dx)<.05?0:dx,Math.abs(dy)<.05?0:dy);p.distance+=distance;if(distance>=d-.01)route.points.shift();return false;
}
function workGoal(save:SaveData,p:CampPerson):{area:SurvivorArea;point:{x:number;y:number}}|undefined {
 const kind=p.task!.kind,area=kind==='water'?'property':'forest',blocked=survivorNavigation(save,area);
 if(kind==='water'){
  const crop=save.crops.find(c=>!c.watered);if(!crop)return undefined;
  for(const [dx,dy]of [[0,1],[1,0],[-1,0],[0,-1]])if(!blocked(crop.x+dx,crop.y+dy))return{area,point:center({x:crop.x+dx,y:crop.y+dy})};return undefined;
 }
 const preferred=kind==='wood'?{x:30,y:53}:{x:26,y:35};
 for(let r=0;r<8;r++)for(let y=preferred.y-r;y<=preferred.y+r;y++)for(let x=preferred.x-r;x<=preferred.x+r;x++)if(!blocked(x,y))return{area,point:center({x,y})};return undefined;
}
export function advanceSurvivorResidents(save:SaveData,seconds:number):void {
 if(!save.survivorCamp||!Number.isFinite(seconds)||seconds<=0)return;const dt=Math.min(seconds,.1);
 for(const[index,p]of save.survivorCamp.residents.entries()){
  p.area??='survivorCamp';const task=p.task;
  if(p.homeInside){if(save.time<1140&&save.time>=480||task&&task.phase!=='ready'){p.homeInside=false;}else continue;}
  if(task?.phase==='working'){
   task.minutes=Math.min(SURVIVOR_TASKS[task.kind].minutes,task.minutes+dt);
   if(task.minutes>=SURVIVOR_TASKS[task.kind].minutes){
    if(task.kind==='water'){let count=0;for(const crop of save.crops)if(!crop.watered&&count<6){crop.watered=true;count++;}task.message=count?`Reguei ${count} plantas da sua horta.`:'A horta já estava regada quando cheguei.';}
    task.phase='returning';
   }continue;
  }
  const working=p.settled&&task&&task.phase==='outbound',destination=working?workGoal(save,p):undefined;
  if(working&&!destination){task.phase='returning';task.message='Não encontrei plantas que precisassem de água. Vou voltar.';}
  const target=destination?.area??'village';
  if(p.area!==target){const leg=legs(save,p,target);if(walk(save,p,leg.goal,dt)&&leg.next&&leg.arrival){const blocked=survivorNavigation(save,leg.next);if(!blocked(Math.floor(leg.arrival.x/32),Math.floor(leg.arrival.y/32))){p.area=leg.next;p.x=leg.arrival.x;p.y=leg.arrival.y;paths.delete(p);}}continue;}
  if(destination){if(walk(save,p,destination.point,dt)){task!.phase='working';task!.minutes=0;}continue;}
  const arrivingHome=!p.settled||task?.phase==='returning',night=save.time>=1140||save.time<480,point=arrivingHome||night?COMMUNITY_DOOR:homeSlot(index);
  if(walk(save,p,point,dt)){
   if(arrivingHome){p.settled=true;if(task?.phase==='returning')task.phase='ready';}
   if(night&&(!task||task.phase==='ready'))p.homeInside=true;
  }
 }
}
function transact(save:SaveData,write:(draft:SaveData)=>boolean,change:(draft:SaveData)=>string):{ok:boolean;message:string}{
 const draft=structuredClone(save);let message:string;try{message=change(draft);if(!write(draft))return{ok:false,message:'Não foi possível salvar. Nenhum pedido ou item foi alterado.'};}catch(e){return{ok:false,message:e instanceof Error?e.message:'Não foi possível salvar.'};}
 save.survivorCamp=draft.survivorCamp;save.inventory=draft.inventory;return{ok:true,message};
}
export function askSurvivorHelp(save:SaveData,id:string,kind:SurvivorTaskKind,write:(draft:SaveData)=>boolean):{ok:boolean;message:string}{
 return transact(save,write,d=>{const p=d.survivorCamp?.residents.find(p=>p.id===id);if(!p)throw Error('Este sobrevivente ainda não foi recrutado.');if(p.task)throw Error('Conclua o pedido atual antes de pedir outra ajuda.');if(p.helpDay===d.day)throw Error('Já ajudei hoje. Amanhã posso ajudar de novo.');if(kind==='water'&&!d.crops.some(c=>!c.watered))throw Error('A horta não tem plantas precisando de água.');if(d.time>=1140||d.time<480)throw Error('Agora vou descansar. Podemos combinar uma tarefa a partir das 08:00.');p.helpDay=d.day;p.task={kind,phase:'outbound',minutes:0,day:d.day};return p.settled?'Combinado. Vou fazer isso e depois volto para a casa comunitária.':'Combinado. Primeiro vou me instalar na casa comunitária, depois faço isso.';});
}
export function collectSurvivorHelp(save:SaveData,id:string,write:(draft:SaveData)=>boolean):{ok:boolean;message:string}{
 return transact(save,write,d=>{const p=d.survivorCamp?.residents.find(p=>p.id===id),t=p?.task;if(!p||!t||t.phase!=='ready'||p.area!=='village')throw Error('Ainda não voltei da tarefa.');const gain=t.kind==='wood'?{wood:4}:t.kind==='herbs'?{herb:2}:{};const inventory=new Inventory(d.inventory);if(!inventory.transact({},gain))throw Error('Sua mochila está cheia. Guarde os resultados comigo e volte depois.');d.inventory={...inventory.data};delete p.task;return t.message??(t.kind==='wood'?'Trouxe 4 madeiras caídas para você.':'Trouxe 2 ervas para você.');});
}
