import {calendarDate,type Season} from './systems/calendar';
/** Um valor de tempo por dia para o mundo, a HUD e a pescaria. É sorteado a partir do
 * número do dia (o mesmo dia sempre dá o mesmo tempo), então nunca muda ao carregar o
 * jogo, mas não segue padrão semanal. */
export type WorldWeather='clear'|'rain';
/** Chance de chuva por estação. */
export const RAIN_CHANCE:Readonly<Record<Season,number>>={spring:.34,summer:.18,autumn:.3,winter:.24};
/** Número entre 0 e 1 sorteado a partir do dia (hash inteiro, sem estado). */
export function dayRoll(day:number):number{
 let h=Math.imul((day>>>0)^0x9e3779b9,0x85ebca6b);
 h^=h>>>13;h=Math.imul(h,0xc2b2ae35);h^=h>>>16;
 h=Math.imul(h^0x27d4eb2f,0x165667b1);h^=h>>>15;
 return (h>>>0)/4294967296;
}
export function weatherForDay(day:number):WorldWeather {
 const value=Number.isSafeInteger(day)&&day>0?day:1;
 if(value===1)return 'clear';
 return dayRoll(value)<RAIN_CHANCE[calendarDate(value).season]?'rain':'clear';
}
export const WEATHER_NAMES:Record<WorldWeather,string>={clear:'Tempo aberto',rain:'Chuva'};
