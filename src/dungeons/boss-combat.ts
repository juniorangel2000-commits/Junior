import type { Enemy } from "./run";
import type { DungeonId } from "./config";
import { dungeonBlocked } from "./maps";

export type BossAttackKind = "slam" | "charge" | "chains" | "plague";
export interface BossAction {
  kind: BossAttackKind;
  stage: "warning" | "active" | "recovery";
  remaining: number;
  x: number;
  y: number;
  angle: number;
  distance: number;
  hit: boolean;
}
export interface BossCombatState {
  cooldown: number;
  sequence: number;
  action?: BossAction;
}
export const BOSS_ATTACK_LABELS: Record<BossAttackKind, string> = {
  slam: "Impacto no chão · saia do círculo",
  charge: "Investida · desvie da faixa",
  chains: "Varredura de correntes · saia do arco",
  plague: "Contaminação · afaste-se da área",
};
export const bossAttackRadius = (kind: BossAttackKind) =>
  kind === "plague" ? 72 : kind === "chains" ? 190 : 105;
export const bossWindup = (round: number) => round === 50 ? 1.4 : 1.6;
const patterns: BossAttackKind[][] = [
  ["slam"], ["charge"], ["chains"], ["plague"],
  ["charge", "slam", "chains", "plague"],
];
export function bossPointInAttack(a: BossAction, x: number, y: number): boolean {
  const dx = x - a.x, dy = y - a.y;
  if (a.kind === "charge") {
    const along = dx * Math.cos(a.angle) + dy * Math.sin(a.angle);
    const across = Math.abs(-dx * Math.sin(a.angle) + dy * Math.cos(a.angle));
    return along >= -14 && along <= 274 && across <= 38;
  }
  if (Math.hypot(dx, dy) > bossAttackRadius(a.kind) + 10) return false;
  if (a.kind !== "chains") return true;
  const angle = Math.atan2(dy, dx) - a.angle;
  return Math.abs(Math.atan2(Math.sin(angle), Math.cos(angle))) <= Math.PI / 5;
}

/** Returns whether normal pursuit may continue. Every timer uses active simulation time. */
export function advanceBossCombat(
  e: Enemy,
  player: { x: number; y: number },
  round: number,
  dungeon: DungeonId,
  dt: number,
  hurt: (damage: number) => void,
): boolean {
  const b = e.boss ??= { cooldown: 5, sequence: 0 };
  if (!b.action) {
    b.cooldown = Math.max(0, b.cooldown - dt);
    if (b.cooldown > 0 || Math.hypot(player.x - e.x, player.y - e.y) > 360)
      return true;
    const pattern = patterns[Math.max(0, Math.min(4, Math.floor(round / 10) - 1))];
    const kind = pattern[b.sequence++ % pattern.length];
    b.action = {
      kind, stage: "warning", remaining: bossWindup(round),
      x: kind === "plague" ? player.x : e.x,
      y: kind === "plague" ? player.y : e.y,
      angle: Math.atan2(player.y - e.y, player.x - e.x),
      distance: 260, hit: false,
    };
    delete e.detour;
    return false;
  }
  const a = b.action;
  a.remaining = Math.max(0, a.remaining - dt);
  if (a.stage === "warning") {
    if (a.remaining > 0) return false;
    a.stage = "active";
    a.remaining = a.kind === "plague" ? 3.2 : a.kind === "charge" ? 0.65 : 0.28;
    // Start activity on the next fixed step; the warning never damages the player.
    return false;
  }
  if (a.stage === "recovery") {
    if (a.remaining === 0) {
      delete b.action;
      b.cooldown = round === 50 && e.hp <= e.maxHp / 2 ? 4.6 : 6.5;
    }
    return false;
  }
  if (a.kind === "charge") {
    const travel = Math.min(520 * dt, a.distance);
    const steps = Math.max(1, Math.ceil(travel / 4));
    for (let i = 0; i < steps && a.distance > 0; i++) {
      const x = e.x + Math.cos(a.angle) * travel / steps;
      const y = e.y + Math.sin(a.angle) * travel / steps;
      if (dungeonBlocked(dungeon, x, y)) { a.distance = 0; break; }
      e.x = x; e.y = y;
      a.distance = Math.max(0, a.distance - travel / steps);
      if (!a.hit && Math.hypot(player.x - x, player.y - y) <= 38) {
        a.hit = true;
        hurt(e.damage);
      }
    }
    if (a.distance === 0) a.remaining = 0;
  } else if (a.kind === "plague") {
    if (bossPointInAttack(a, player.x, player.y)) hurt(e.damage * 0.4);
  } else if (!a.hit) {
    a.hit = true;
    if (bossPointInAttack(a, player.x, player.y)) hurt(e.damage);
  }
  if (a.remaining === 0) {
    a.stage = "recovery";
    a.remaining = 0.8;
  }
  return a.kind === "plague" && a.stage === "active";
}
