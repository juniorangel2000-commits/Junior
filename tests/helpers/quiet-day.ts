import {outingToday} from '../../src/systems/npc-outings';
import {rainyDay,restDay} from '../../src/data/village-schedule';
import {MERCHANT_VISITS} from '../../src/data/merchant-visits';
import type {RoutineId} from '../../src/systems/merchant-routine';

/** Primeiro dia seco em que nenhum dos moradores está de folga ou fora da vila (saídas aos
 * cenários, src/systems/npc-outings.ts). Testes da rotina da vila usam este dia. */
export function quietDay(...ids:RoutineId[]):number{
 for(let day=1;day<400;day++)if(!rainyDay(day)&&ids.every(id=>!restDay(id,day)&&!outingToday(id,day)))return day;
 throw new Error('sem dia livre para '+ids.join(', '));
}
/** Dia livre para o morador e para quem ele visita. */
export const quietVisitDay=(id:RoutineId)=>quietDay(id,MERCHANT_VISITS[id].host);
