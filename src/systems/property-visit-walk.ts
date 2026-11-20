import { NPC_WALK_SPEED } from '../data/npc-speed';
import { VillageWalk } from './village-walk';

type Point = { x: number; y: number };

/** Deslocamento do visitante: uma passagem fechada interrompe a caminhada,
 * sem trocar sua posição pelo destino. VillageWalk tenta novamente o trajeto. */
export class PropertyVisitWalk {
  private position: Point;
  private readonly walk: VillageWalk;

  constructor(start: Point, private readonly goal: Point, frames: number) {
    this.position = { ...start };
    this.walk = new VillageWalk([{ x: Math.floor(goal.x / 32), y: Math.floor(goal.y / 32) }], NPC_WALK_SPEED, 0, 9999, 32, frames);
  }

  step(seconds: number, blocked: (x: number, y: number) => boolean, paused = false) {
    const elapsed = Number.isFinite(seconds) ? Math.min(.1, Math.max(0, seconds)) : 0;
    const step = this.walk.step(elapsed, this.position, blocked, () => 1, paused);
    this.position = { x: step.x, y: step.y };
    return { ...step, arrived: Math.hypot(step.x - this.goal.x, step.y - this.goal.y) < 6 };
  }
}
