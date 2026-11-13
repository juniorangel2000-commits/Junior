import {describe,it,expect} from 'vitest';
import {calendarDate,shortCalendarLabel,fullCalendarLabel,daysLeftInSeason,DAYS_PER_SEASON,DAYS_PER_YEAR,SEASONS} from '../src/systems/calendar';

describe('calendário anual',()=>{
 it('tem quatro estações de 28 dias, na ordem primavera, verão, outono e inverno',()=>{
  expect(SEASONS).toEqual(['spring','summer','autumn','winter']);expect(DAYS_PER_SEASON).toBe(28);expect(DAYS_PER_YEAR).toBe(112);
 });
 it('converte o contador de dias salvo em estação, dia e ano',()=>{
  expect(calendarDate(1)).toEqual({season:'spring',seasonIndex:0,dayOfSeason:1,year:1});
  expect(calendarDate(28)).toMatchObject({season:'spring',dayOfSeason:28,year:1});
  expect(calendarDate(29)).toMatchObject({season:'summer',dayOfSeason:1,year:1});
  expect(calendarDate(30)).toMatchObject({season:'summer',dayOfSeason:2,year:1});
  expect(calendarDate(85)).toMatchObject({season:'winter',dayOfSeason:1,year:1});
  expect(calendarDate(112)).toMatchObject({season:'winter',dayOfSeason:28,year:1});
  expect(calendarDate(113)).toEqual({season:'spring',seasonIndex:0,dayOfSeason:1,year:2});
  expect(calendarDate(999999)).toMatchObject({year:Math.floor(999998/112)+1});
 });
 it('trata valores inválidos como o primeiro dia, sem quebrar a interface',()=>{
  for(const day of [0,-5,Number.NaN,Number.POSITIVE_INFINITY])expect(calendarDate(day)).toMatchObject({season:'spring',dayOfSeason:1,year:1});
  expect(calendarDate(3.9)).toMatchObject({dayOfSeason:3});
 });
 it('gera os textos da interface em português',()=>{
  expect(shortCalendarLabel(1)).toBe('Primavera 1');expect(shortCalendarLabel(57)).toBe('Outono 1');
  expect(fullCalendarLabel(30)).toBe('Verão, dia 2 · Ano 1');expect(fullCalendarLabel(113)).toBe('Primavera, dia 1 · Ano 2');
 });
 it('conta os dias que faltam na estação, incluindo hoje',()=>{
  expect(daysLeftInSeason(1)).toBe(28);expect(daysLeftInSeason(28)).toBe(1);expect(daysLeftInSeason(29)).toBe(28);
 });
});
