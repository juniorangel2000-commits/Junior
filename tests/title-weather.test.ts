import { describe, expect, it } from 'vitest';
import { titleLightningAt } from '../src/title-weather';

describe('Tempestade da tela inicial', () => {
  it('começa só com chuva antes do primeiro relâmpago', () => {
    for (const time of [0, 1, 3, 3.5]) expect(titleLightningAt(time, false).strength).toBe(0);
    expect(titleLightningAt(3.68, false).strength).toBeCloseTo(1);
  });

  it('tem um único brilho suave e uma longa pausa entre os raios', () => {
    expect(titleLightningAt(4, false).strength).toBeLessThan(titleLightningAt(3.8, false).strength);
    for (let time = 5; time <= 17.5; time += .25) expect(titleLightningAt(time, false).strength).toBe(0);
    expect(titleLightningAt(17.68, false).strike).toBe(1);
    expect(titleLightningAt(17.68, false).strength).toBeCloseTo(1);
  });

  it('não produz flashes com preferência por movimento reduzido', () => {
    for (let time = 0; time < 120; time += .05) expect(titleLightningAt(time, true).strength).toBe(0);
  });
});
