import {describe,it,expect} from 'vitest';
import {PROPERTY_WELL,WELL_BASE,WELL_FRAME_DURATIONS,WELL_USE_MS,WellUseCycle,wellSolidPoint,wellSolidTile,nearPropertyWell,targetsPropertyWell} from '../src/data/property-well';

describe('poço ao lado direito da casa',()=>{
 it('mantém espaço para a entrada da casa e interação ao redor da base',()=>{
  expect(PROPERTY_WELL.x).toBeGreaterThan(29*32);expect(nearPropertyWell(25*32+16,18*32+16)).toBe(false);
  expect(nearPropertyWell(WELL_BASE.x,WELL_BASE.y+30)).toBe(true);
  expect(nearPropertyWell(WELL_BASE.x,WELL_BASE.y)).toBe(false);
 });
 it('bloqueia a pedra, permitindo passar por trás do telhado',()=>{
  expect(wellSolidPoint(WELL_BASE.x,WELL_BASE.y)).toBe(true);
  expect(wellSolidPoint(PROPERTY_WELL.x,PROPERTY_WELL.y-85)).toBe(false);
  expect(wellSolidTile(31,15)).toBe(true);expect(wellSolidTile(31,13)).toBe(false);
  expect(targetsPropertyWell(31,13)).toBe(true);
 });
 it('usa os oito tempos fornecidos e conclui apenas uma vez',()=>{
  const cycle=new WellUseCycle();expect(cycle.start()).toBe(true);expect(cycle.start()).toBe(false);
  for(let i=0;i<8;i++){
   expect(cycle.frame).toBe(i);expect(cycle.advance(WELL_FRAME_DURATIONS[i]-1)).toBe(false);
   expect(cycle.advance(1)).toBe(i===7);
  }
  expect(cycle.busy).toBe(false);expect(cycle.advance(WELL_USE_MS)).toBe(false);expect(cycle.frame).toBe(0);
 });
 it('não conclui ao pausar ou cancelar e pode começar um novo uso',()=>{
  const cycle=new WellUseCycle();cycle.start();cycle.advance(600);const frame=cycle.frame;
  expect(cycle.advance(0)).toBe(false);expect(cycle.frame).toBe(frame);
  cycle.cancel();expect(cycle.advance(WELL_USE_MS)).toBe(false);
  expect(cycle.start()).toBe(true);expect(cycle.frame).toBe(0);expect(cycle.advance(WELL_USE_MS)).toBe(true);
 });
});
