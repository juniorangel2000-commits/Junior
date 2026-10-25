import { describe, expect, it } from 'vitest';
import { dayPhase, daylightAt } from '../src/daylight-model';
import { visualSettings } from '../src/visual-settings';

describe('iluminação das quatro fases', () => {
  it.each([[0,'Madrugada'],[359.99,'Madrugada'],[360,'Manhã'],[719.99,'Manhã'],[720,'Tarde'],[1139.99,'Tarde'],[1140,'Noite'],[1439.99,'Noite']] as const)('fase às %s', (time, phase) => {
    expect(dayPhase(time)).toBe(phase);
  });
  it('transições e meia-noite não causam saltos visuais', () => {
    for (let minute=0;minute<1440;minute++) {
      const a=daylightAt(minute-.001),b=daylightAt(minute+.001);
      expect(Math.abs(a.shade-b.shade)).toBeLessThan(.00002);
      expect(Math.abs(a.warmth-b.warmth)).toBeLessThan(.00002);
      expect(a.shade).toBeGreaterThanOrEqual(0);expect(a.shade).toBeLessThan(.5);
    }
  });
  it('noite legível, meio-dia neutro e fim de tarde dourado', () => {
    expect(daylightAt(180).shade).toBeGreaterThan(.4);
    expect(daylightAt(720)).toMatchObject({shade:0,warmth:0});
    expect(daylightAt(1110).warmth).toBeGreaterThan(.1);
    expect(daylightAt(480).shade).toBeLessThan(.025);
  });
  it('opção desliga todo o efeito e interior mantém luz mais suave', () => {
    expect(daylightAt(180,0)).toMatchObject({shade:0,warmth:0});
    expect(daylightAt(180,1,true).shade).toBeLessThan(.11);
    expect(daylightAt(1110,.5).warmth).toBe(daylightAt(1110).warmth*.5);
  });
  it('preferências e horários inválidos têm valores seguros', () => {
    expect(visualSettings(null)).toEqual({daylight:true,intensity:1,dynamicLighting:true});
    expect(visualSettings({daylight:false,intensity:Infinity})).toEqual({daylight:false,intensity:1,dynamicLighting:true});
    expect(visualSettings({intensity:-4}).intensity).toBe(0);
    expect(daylightAt(NaN)).toEqual(daylightAt(720));
    expect(daylightAt(-1)).toEqual(daylightAt(1439));
  });
});
