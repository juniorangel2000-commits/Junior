import {describe,expect,it} from 'vitest';
import {advanceCrop,Farming} from '../src/systems/farming';
import {cropDefinition} from '../src/data/crops';
import {weatherForDay} from '../src/weather-model';
import {calendarDate} from '../src/systems/calendar';
import type {CropData} from '../src/types';

/** Um dia de chuva na primavera cujo dia anterior foi seco, também na primavera. */
function rainyDay():number{
 for(let d=3;d<400;d++)if(weatherForDay(d)==='rain'&&weatherForDay(d-1)==='clear'&&calendarDate(d).season==='spring'&&calendarDate(d-1).season==='spring')return d;
 throw Error('sem dia de chuva');
}
const turnip=(day:number):CropData=>({x:0,y:0,growth:0,watered:false,crop:'turnip',days:0,day,care:{missed:0}}) as CropData;

describe('a chuva rega a horta (preview.48)',()=>{
 it('o dia de chuva conta como regado; o dia seco anterior, não',()=>{
  const rain=rainyDay(),crop=turnip(rain-1);
  expect(advanceCrop(crop,cropDefinition('turnip'),rain+1)).toBe(true);
  expect(crop.days).toBe(1);
  expect(crop.care!.missed).toBe(1);
 });
 it('no dia de chuva a horta inteira aparece regada',()=>{
  const rain=rainyDay(),f=new Farming([turnip(rain)]);
  f.update(1,rain);
  expect(f.crops[0].watered).toBe(true);
 });
});
