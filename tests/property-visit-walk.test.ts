import { describe, expect, it } from 'vitest';
import { NPC_WALK_SPEED } from '../src/data/npc-speed';
import { PropertyVisitWalk } from '../src/systems/property-visit-walk';

const start = { x: 2.5 * 32, y: 3.5 * 32 };
const goal = { x: 12.5 * 32, y: 3.5 * 32 };
const corridor = (x: number, y: number) => y !== 3 || x < 2 || x > 12;

describe('caminhada das visitas à propriedade', () => {
  it('espera diante de um caminho fechado por mais de seis segundos, sem pular para a casa', () => {
    const walk = new PropertyVisitWalk(start, goal, 6);
    for (let frame = 0; frame < 300; frame++) {
      const step = walk.step(.1, (x, y) => corridor(x, y) || x === 7);
      expect({ x: step.x, y: step.y }).toEqual(start);
      expect(step.arrived).toBe(false);
    }
  });
  it('retoma o percurso quando a passagem abre e respeita obstáculos que surgem no meio da caminhada', () => {
    const walk = new PropertyVisitWalk(start, goal, 6);
    let previous = start, arrived = false;
    for (let frame = 0; frame < 350 && !arrived; frame++) {
      const closed = frame >= 4 && frame < 160;
      const step = walk.step(.1, (x, y) => corridor(x, y) || closed && x === 7);
      expect(Math.hypot(step.x - previous.x, step.y - previous.y)).toBeLessThanOrEqual(NPC_WALK_SPEED * .1 + 1e-6);
      expect(corridor(Math.floor(step.x / 32), Math.floor(step.y / 32))).toBe(false);
      if (closed) expect(step.x).toBeLessThan(7 * 32);
      previous = { x: step.x, y: step.y }; arrived = step.arrived;
    }
    expect(arrived).toBe(true);
    expect(Math.hypot(previous.x - goal.x, previous.y - goal.y)).toBeLessThan(6);
  });
  it('pausa sem andar e limita o passo após atraso ou intervalo inválido', () => {
    const walk = new PropertyVisitWalk(start, goal, 6);
    for (const dt of [.1, 20, NaN, -1]) {
      const paused = walk.step(dt, corridor, true);
      expect({ x: paused.x, y: paused.y }).toEqual(start);
    }
    const resumed = walk.step(20, corridor);
    expect(resumed.x - start.x).toBeCloseTo(NPC_WALK_SPEED * .1);
    const invalid = walk.step(NaN, corridor);
    expect(invalid.x).toBe(resumed.x);
  });
});
