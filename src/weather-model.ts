/** One daily weather value for the world, HUD and fishing. It never rerolls on load. */
export type WorldWeather='clear'|'rain';
export function weatherForDay(day:number):WorldWeather {
 const value=Number.isSafeInteger(day)&&day>0?day:1;
 return ((value*17+3)%7)<2?'rain':'clear';
}
export const WEATHER_NAMES:Record<WorldWeather,string>={clear:'Tempo aberto',rain:'Chuva'};
