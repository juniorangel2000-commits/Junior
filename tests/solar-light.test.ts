import {describe,it,expect} from 'vitest';
import {solarLight,windowLight} from '../src/solar-light';
import {visualSettings} from '../src/visual-settings';

describe('sombras solares e luz das janelas',()=>{
 it('sol da manhã e da tarde projetam sombras em lados opostos',()=>{
  expect(solarLight(540).x).toBeLessThan(0);expect(solarLight(1020).x).toBeGreaterThan(0);
  expect(solarLight(750).length).toBeLessThan(solarLight(420).length);
 });
 it('a projeção cruza o centro continuamente, sem girar ou inverter o eixo lateral',()=>{
  const before=solarLight(749.99),center=solarLight(750),after=solarLight(750.01);
  expect(before.projectionX).toBeLessThan(0);expect(Math.abs(center.projectionX)).toBeLessThan(1e-12);expect(after.projectionX).toBeGreaterThan(0);
  expect(Math.abs(after.projectionX-before.projectionX)).toBeLessThan(.0001);
  expect(center.projectionY).toBeGreaterThan(.08);
  for(let minute=360;minute<=1140;minute++){
   const a=solarLight(minute),b=solarLight(minute+.01);
   expect(Number.isFinite(a.projectionX/a.projectionY)).toBe(true);
   expect(Math.abs(a.projectionY-b.projectionY)).toBeLessThan(.001);
  }
 });
 it.each([0,180,359,1140,1320,1439])('não projeta sombra solar à noite em %s',time=>expect(solarLight(time).opacity).toBe(0));
 it('sol nasce e se põe sem fazer a sombra aparecer subitamente',()=>{
  for(const time of [360,1140])expect(Math.abs(solarLight(time-.01).opacity-solarLight(time+.01).opacity)).toBeLessThan(.001);
 });
 it('acende gradualmente ao anoitecer, apaga de manhã e cruza meia-noite sem salto',()=>{
  expect(windowLight(1320)).toBe(1);expect(windowLight(540)).toBe(0);
  expect(windowLight(1125)).toBeGreaterThan(0);expect(windowLight(1125)).toBeLessThan(1);
  expect(windowLight(1439.99)).toBe(windowLight(0));expect(windowLight(375)).toBe(.5);
 });
 it('opção dinâmica é independente da intensidade e aceita saves de preferências anteriores',()=>{
  expect(visualSettings({daylight:true,intensity:.4})).toEqual({daylight:true,intensity:.4,dynamicLighting:true});
  expect(visualSettings({dynamicLighting:false}).dynamicLighting).toBe(false);
  expect(visualSettings({dynamicLighting:'yes'}).dynamicLighting).toBe(true);
 });
});
