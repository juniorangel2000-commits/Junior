/** Calendário anual derivado do contador de dias salvo (SaveData.day, a partir de 1).
 * Não guarda estado próprio: partidas antigas continuam do dia em que estão. */
export const SEASONS=['spring','summer','autumn','winter'] as const;
export type Season=typeof SEASONS[number];
export const SEASON_NAMES:Record<Season,string>={spring:'Primavera',summer:'Verão',autumn:'Outono',winter:'Inverno'};
/** Com preposição: "na Primavera", "no Verão"… */
export const IN_SEASON:Record<Season,string>={spring:'na Primavera',summer:'no Verão',autumn:'no Outono',winter:'no Inverno'};
export const DAYS_PER_SEASON=28;
export const DAYS_PER_YEAR=DAYS_PER_SEASON*SEASONS.length;
export interface CalendarDate{season:Season;seasonIndex:number;dayOfSeason:number;year:number}
const safeDay=(day:number)=>Number.isFinite(day)&&day>=1?Math.floor(day):1;
export function calendarDate(day:number):CalendarDate{
 const n=safeDay(day)-1,seasonIndex=Math.floor(n/DAYS_PER_SEASON)%SEASONS.length;
 return{season:SEASONS[seasonIndex],seasonIndex,dayOfSeason:n%DAYS_PER_SEASON+1,year:Math.floor(n/DAYS_PER_YEAR)+1};
}
/** "Primavera 5" para a HUD. */
export const shortCalendarLabel=(day:number)=>{const c=calendarDate(day);return`${SEASON_NAMES[c.season]} ${c.dayOfSeason}`;};
/** "Primavera, dia 5 · Ano 1" para títulos e descrições. */
export const fullCalendarLabel=(day:number)=>{const c=calendarDate(day);return`${SEASON_NAMES[c.season]}, dia ${c.dayOfSeason} · Ano ${c.year}`;};
/** Dias restantes na estação atual, contando o dia de hoje. */
export const daysLeftInSeason=(day:number)=>DAYS_PER_SEASON-calendarDate(day).dayOfSeason+1;
