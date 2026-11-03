import type {SaveData} from '../types';
import type {GameClock} from './clock';
import {BENTO_WEEKLY_PLAN as B} from '../data/bento-schedule';
import {mineHash} from '../data/underground-layout';
import type {BentoTravelState} from './bento-travel-state';
export const bentoWeekday=(day:number)=>1+(day-1)%7;
export function bentoSeed(name:string):number{let seed=2166136261;for(const c of name+':bento')seed=Math.imul(seed^c.charCodeAt(0),16777619);return seed>>>0;}
export function bentoMineDay(day:number,seed:number,plan:{regularDays:readonly number[];occasionalDay:number;occasionalChance:number}=B):boolean{
 const weekday=bentoWeekday(day);return plan.regularDays.includes(weekday)||weekday===plan.occasionalDay&&mineHash(seed,Math.floor((day-1)/7),341)<plan.occasionalChance;
}
export function bentoTripPending(save:Pick<SaveData,'day'|'time'|'profile'|'bentoTravel'>):boolean{
 const state=save.bentoTravel;return!state?.trip&&state?.lastAttemptDay!==save.day&&save.time>=B.preparationStart&&save.time<B.latestDeparture&&bentoMineDay(save.day,state?.seed??bentoSeed(save.profile.name));
}
export const bentoTravelling=(clock:GameClock&{bentoTravel?:BentoTravelState})=>!!clock.bentoTravel?.trip&&clock.bentoTravel.trip.purpose!=='workshop';
export function bentoAvailability(save:Pick<SaveData,'time'|'day'|'bentoTravel'|'villageRoutines'>):{open:boolean;message:string}{
 const trip=save.bentoTravel?.trip;
 if(trip?.purpose==='rescue')return{open:false,message:trip.area==='home'?'Bento está ajudando você a se recuperar em casa.':'Bento está voltando para a oficina depois do resgate. A ferraria reabre quando ele retomar o atendimento.'};
 if(trip&&trip.purpose!=='workshop'){const message=trip.leg==='unload'?'Bento está guardando os materiais da mina. A ferraria reabre quando ele terminar.':trip.blocked?'Bento está esperando a passagem ficar livre. A ferraria está fechada.':trip.leg==='prepare'?'Bento está preparando a viagem à mina. A ferraria está fechada.':['survey','explore','inspect'].includes(trip.leg)?'Bento está explorando a Mina Antiga. A ferraria reabre quando ele voltar.':['mining-back','hall-back','highland-back','lake-back','city-back','village-back','shop-back','settle'].includes(trip.leg)?'Bento está voltando da mina. A ferraria reabre quando ele retomar o atendimento.':'Bento está a caminho da Mina Antiga. A ferraria está fechada.';return{open:false,message};}
 const routine=save.villageRoutines?.bento,inside=!routine||routine.area==='shop'&&(!routine.roomOwner||routine.roomOwner==='bento');
 const work=save.time>=480&&save.time<1140&&(save.time<720||save.time>=770);
 return{open:inside&&work,message:!work?save.time>=720&&save.time<770?'Ferraria fechada · intervalo de Bento · volta às 12:50.':'Ferraria fechada · atendimento das 08:00 às 19:00.':!inside?'Bento está fora da oficina. Aguarde seu retorno para usar os serviços.':'Bento está atendendo na ferraria.'};
}
