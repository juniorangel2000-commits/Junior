import type {SaveData} from '../types';
import {TILE} from '../data/world-size';
import {PROPERTY_WELL} from '../data/property-well';
import {HOMESTEAD_GATE} from '../data/property-homestead';
import {HOME_ENTRANCE_WORLD} from './home';
import {weatherForDay} from '../weather-model';

/** Marina e Rui, acolhidos pela Helena, moram na propriedade do jogador. Durante o dia
 * andam entre tarefas; à noite entram em casa. Tudo é derivado da hora e do save: nada
 * novo é gravado, e partidas antigas continuam iguais. */
export type PropertySurvivorId='marina'|'rui';
export const PROPERTY_SURVIVORS:readonly PropertySurvivorId[]=['marina','rui'];
export const SURVIVOR_NAMES:Record<PropertySurvivorId,string>={marina:'Marina',rui:'Rui'};
/** Acordam às 07:00 e entram em casa às 20:00. */
export const SURVIVOR_DAY={wake:7*60,sleep:20*60,swapMinutes:40} as const;

type Task='home'|'crops'|'garden'|'well'|'workbench'|'porch'|'inside';
interface Slot{from:number;to:number;tasks:readonly Task[]}
const PLAN:Record<PropertySurvivorId,readonly Slot[]>={
 marina:[{from:7*60,to:11*60,tasks:['crops','garden']},{from:11*60,to:12*60+30,tasks:['home']},{from:12*60+30,to:15*60,tasks:['well','crops']},{from:15*60,to:18*60,tasks:['garden','crops']},{from:18*60,to:20*60,tasks:['home']}],
 rui:[{from:7*60,to:10*60,tasks:['workbench']},{from:10*60,to:12*60,tasks:['well','garden']},{from:12*60,to:13*60+30,tasks:['home']},{from:13*60+30,to:17*60,tasks:['workbench','well','crops']},{from:17*60,to:20*60,tasks:['home']}],
};
const LINES:Record<PropertySurvivorId,Record<Task,string>>={
 marina:{home:'Uma pausa para descansar. Que bom morar aqui.',crops:'Estou de olho nas plantações. Estão crescendo bonitas!',garden:'A horta perto da casa precisa de carinho todo dia.',well:'Fui buscar água no poço.',workbench:'Vim ver a bancada.',porch:'Que chuva! Melhor esperar aqui na varanda.',inside:''},
 rui:{home:'Hora de descansar um pouco.',crops:'Dando uma olhada nas plantações. Nenhuma praga por aqui.',garden:'Conferindo a cerca da horta.',well:'Água fresca do poço, para o trabalho de hoje.',workbench:'Consertando umas coisas na bancada.',porch:'Com essa chuva, nem dá para trabalhar lá fora.',inside:''},
};
const tile=(x:number,y:number)=>({x:(x+.5)*TILE,y:(y+.5)*TILE});
/** Lugar de descanso em frente de casa (o mesmo de antes, quando ficavam parados). */
export const survivorHome=(index:number)=>({x:990+index*55,y:630});
export interface SurvivorActivity{task:Task;line:string;point:{x:number;y:number};visible:boolean}

export function survivorActivity(id:PropertySurvivorId,s:Pick<SaveData,'day'|'time'|'crops'|'buildings'|'villageSurvivors'>):SurvivorActivity{
 const index=Math.max(0,(s.villageSurvivors??[]).indexOf(id)),home=survivorHome(index),t=s.time;
 if(t<SURVIVOR_DAY.wake||t>=SURVIVOR_DAY.sleep)return{task:'inside',line:'',point:{x:HOME_ENTRANCE_WORLD.x,y:HOME_ENTRANCE_WORLD.y+8},visible:false};
 if(weatherForDay(s.day)==='rain')return{task:'porch',line:LINES[id].porch,point:{x:home.x,y:home.y-6},visible:true};
 const slot=PLAN[id].find(p=>t>=p.from&&t<p.to)??{from:0,to:0,tasks:['home'] as const};
 const turn=Math.floor((t-slot.from)/SURVIVOR_DAY.swapMinutes);
 let task=slot.tasks[turn%slot.tasks.length];
 const point=(k:Task):{x:number;y:number}|undefined=>{
  if(k==='home')return home;
  if(k==='well')return{x:PROPERTY_WELL.x+(index?28:-28),y:PROPERTY_WELL.y+34};
  if(k==='garden')return tile(HOMESTEAD_GATE.x+(index?1:0),HOMESTEAD_GATE.y+1);
  if(k==='workbench'){const b=(s.buildings??[]).find(b=>b.kind==='workbench');return b?tile(b.x,b.y+1):undefined;}
  if(k==='crops'){const list=s.crops??[];if(!list.length)return undefined;const c=list[(turn*3+index*5+s.day)%list.length];return tile(c.x,c.y+1);}
 };
 let p=point(task);
 // Sem plantação ou sem bancada: a horta perto de casa substitui a tarefa.
 if(!p){task='garden';p=point('garden')!;}
 return{task,line:LINES[id][task],point:p,visible:true};
}
