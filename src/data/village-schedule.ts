import type {RoutineId} from '../systems/merchant-routine';
import type {GameClock} from '../systems/clock';
import {calendarDate} from '../systems/calendar';
import {weatherForDay} from '../weather-model';

/** Folga semanal: o resto da divisão do dia da estação por 7. Como a estação tem 28 dias,
 * a folga cai sempre nos mesmos 4 dias de cada estação. Bento (viagens à mina), Damião
 * (pescaria no lago) e Helena (pousada aberta todo dia) não tiram folga. */
export const REST_WEEKDAY:Readonly<Partial<Record<RoutineId,number>>>={
 augusto:5,rosa:0,tobias:6,amelia:5,nilo:4,celina:0,icaro:6,
};
/** Hóspedes da noite na pousada, em rodízio: três por noite. */
export const INN_GUESTS:readonly RoutineId[]=['augusto','rosa','tobias','amelia','nilo','celina','icaro','bento','damiao'];
export const INN_EVENING={end:21*60,guests:3} as const;
export const STROLL={start:9*60,end:18*60,minutes:50} as const;

export function restDay(id:RoutineId,day:number):boolean{
 const w=REST_WEEKDAY[id];return w!==undefined&&calendarDate(day).dayOfSeason%7===w;
}
/** Dias da estação em que o morador folga, para mostrar na janela dele. */
export function restDays(id:RoutineId):number[]{
 const w=REST_WEEKDAY[id];if(w===undefined)return[];
 return Array.from({length:28},(_,i)=>i+1).filter(d=>d%7===w);
}
export const rainyDay=(day:number)=>weatherForDay(day)==='rain';
export function innGuests(day:number):RoutineId[]{
 const n=INN_GUESTS.length,start=((Math.floor(day)||1)*INN_EVENING.guests)%n;
 return Array.from({length:INN_EVENING.guests},(_,k)=>INN_GUESTS[(start+k)%n]);
}
export const innGuest=(id:RoutineId,day:number)=>innGuests(day).includes(id);

/** Atividade extra do dia, além do trabalho na loja:
 * - 'inn': está (ou vai) à pousada da Helena — almoço com chuva, folga com chuva ou noite;
 * - 'stroll': folga com tempo aberto, passeando pela vila. */
export type VillageExtra='inn'|'stroll';
export function villageExtra(id:RoutineId,clock:GameClock,closing:number,lunch:{start:number;end:number}):VillageExtra|undefined{
 const t=clock.time;
 if(id==='helena')return rainyDay(clock.day)&&t>=lunch.start&&t<lunch.end?'inn':undefined;
 if(restDay(id,clock.day)&&t>=STROLL.start&&t<STROLL.end)return rainyDay(clock.day)?'inn':'stroll';
 if(!restDay(id,clock.day)&&rainyDay(clock.day)&&t>=lunch.start&&t<lunch.end)return'inn';
 if(innGuest(id,clock.day)&&t>=closing&&t<INN_EVENING.end)return'inn';
 return undefined;
}
