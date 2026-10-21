import { describe, expect, it } from 'vitest';
import { advanceClock, MAX_DAY, sleepUntilMorning } from '../src/systems/clock';
import { Farming } from '../src/systems/farming';
import { GAME_MINUTES_PER_SECOND } from '../src/systems/clock';

describe('noite e descanso', () => {
  it('dorme à noite e acorda no dia seguinte sem perder os minutos transcorridos', () => {
    expect(sleepUntilMorning({ day: 3, time: 21 * 60 + 30 })).toMatchObject({ ok: true, day: 4, time: 480, elapsedMinutes: 630 });
  });
  it('dormir de madrugada mantém o dia atual', () => {
    expect(sleepUntilMorning({ day: 4, time: 3 * 60 })).toMatchObject({ ok: true, day: 4, time: 480, elapsedMinutes: 300 });
  });
  it.each([480, 700, 1139.99])('recusa sono diurno em %s sem alterar o relógio', time => {
    expect(sleepUntilMorning({ day: 1, time })).toMatchObject({ ok: false, day: 1, time, elapsedMinutes: 0 });
  });
  it('avança cultivos regados durante o sono sem regar os secos', () => {
    const clock = { day: 1, time: 1140 };
    const crops = new Farming([{ x: 21, y: 20, growth: 0, watered: true }, { x: 22, y: 20, growth: 0, watered: false }]);
    const rest = sleepUntilMorning(clock);
    crops.update(rest.elapsedMinutes / GAME_MINUTES_PER_SECOND);
    expect(crops.crops.map(c => c.growth)).toEqual([1, 0]);
  });
  it('mantém calendário válido no limite e no rollover normal', () => {
    expect(advanceClock({ day: 2, time: 1439.8 }, .5).day).toBe(3);
    expect(advanceClock({ day: 2, time: 1439.8 }, .5).time).toBeCloseTo(.3);
    expect(advanceClock({ day: MAX_DAY, time: 1439 }, 2)).toEqual({ day: MAX_DAY, time: 1439.999 });
    expect(sleepUntilMorning({ day: MAX_DAY, time: 1140 }).ok).toBe(false);
  });
});
