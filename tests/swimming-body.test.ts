import {describe, it, expect} from 'vitest';
import {CHARACTER_DIRECTIONS} from '../src/character-directions';
import {SwimBodyClock, swimBodyPose} from '../src/swimming/body-animation';

describe('submerged body cycle', () => {
  it.each(CHARACTER_DIRECTIONS)('closes the %s stroke without a pose or velocity discontinuity', direction => {
    const angles = (cycle: number) => {
      const p = swimBodyPose(cycle, direction);
      const limbs: Array<{upper:number;lower:number;lift?:number}> = [...p.arms, ...p.legs];
      return limbs.flatMap(j => [j.upper, j.lower, j.lift ?? 0]);
    };
    const start = angles(0), end = angles(1), before = angles(1 - 1e-5), after = angles(1e-5);
    start.forEach((angle, i) => {
      expect(end[i]).toBeCloseTo(angle, 10);
      expect(angle - before[i]).toBeCloseTo(after[i] - angle, 6);
    });
  });

  it('keeps frontal and rear kicks inside the original stance instead of spreading the legs', () => {
    for (const direction of ['down', 'up'] as const) for (let frame = 0; frame < 120; frame++) {
      const {legs} = swimBodyPose(frame / 120, direction);
      expect(legs[0].upper).toBeLessThan(0); expect(legs[0].upper + legs[0].lower).toBeLessThan(0);
      expect(legs[1].upper).toBeGreaterThan(0); expect(legs[1].upper + legs[1].lower).toBeGreaterThan(0);
      for (const leg of legs) expect(Math.abs(leg.upper + leg.lower)).toBeLessThan(.23);
    }
  });

  it('alternates visible vertical kicks and knee flexion while the opposite leg recovers', () => {
    const poses=Array.from({length:120},(_,i)=>swimBodyPose(i/120,'down').legs);
    const left=poses.map(p=>p[0].lift),right=poses.map(p=>p[1].lift);
    expect(Math.max(...left)-Math.min(...left)).toBeGreaterThan(7);
    expect(Math.max(...right)-Math.min(...right)).toBeGreaterThan(7);
    const bends=poses.map(p=>p[0].lower);expect(Math.max(...bends)-Math.min(...bends)).toBeGreaterThan(.1);
    for(const legs of poses){expect(legs[0].lift+legs[1].lift).toBeCloseTo(8);for(const leg of legs){expect(leg.lift).toBeGreaterThanOrEqual(0);expect(leg.lift).toBeLessThanOrEqual(8);}}
  });

  it('uses a slower living idle and changes cadence without restarting the phase', () => {
    const moving = new SwimBodyClock(), idle = new SwimBodyClock();
    for (let i = 0; i < 60; i++) {moving.advance(1 / 60, true, .55); idle.advance(1 / 60, false, .55);}
    expect(idle.cycle).toBeGreaterThan(.2); expect(moving.cycle).toBeGreaterThan(idle.cycle * 1.8);
    const before = moving.cycle;
    moving.advance(1 / 60, false, .55);
    expect((moving.cycle - before + 1) % 1).toBeGreaterThan(0);
    expect((moving.cycle - before + 1) % 1).toBeLessThan(.02);
    const paused = moving.cycle; moving.advance(0, false, .55); expect(moving.cycle).toBe(paused);
  });
});
