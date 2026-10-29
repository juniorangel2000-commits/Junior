import type Phaser from "phaser";
import type { Enemy } from "./run";
import { bossProfile } from "./bosses";
import { bossAttackRadius, bossWindup } from "./boss-combat";

/** Outlined ground shapes communicate geometry even when colors are hard to distinguish. */
export function drawBossAttacks(
  ink: Phaser.GameObjects.Graphics,
  enemies: Enemy[],
  round: number,
): void {
  for (const e of enemies) {
    const a = e.boss?.action;
    if (!a || a.stage === "recovery" || e.hp <= 0) continue;
    const warning = a.stage === "warning";
    const color = bossProfile(e.bossTier ?? round).color;
    const progress = warning ? 1 - a.remaining / bossWindup(e.bossTier ?? round) : 1;
    ink.lineStyle(warning ? 3 : 4, warning ? 0xffdfad : color, 0.95);
    ink.fillStyle(color, warning ? 0.12 : 0.25);
    if (a.kind === "charge") {
      const nx = -Math.sin(a.angle) * 38, ny = Math.cos(a.angle) * 38;
      const tx = a.x + Math.cos(a.angle) * 274;
      const ty = a.y + Math.sin(a.angle) * 274;
      ink.fillPoints([
        { x: a.x + nx, y: a.y + ny }, { x: tx + nx, y: ty + ny },
        { x: tx - nx, y: ty - ny }, { x: a.x - nx, y: a.y - ny },
      ], true);
      ink.strokePoints([
        { x: a.x + nx, y: a.y + ny }, { x: tx + nx, y: ty + ny },
        { x: tx - nx, y: ty - ny }, { x: a.x - nx, y: a.y - ny },
      ], true);
      // Three chevrons point in the locked direction of the charge.
      for (const d of [70, 140, 210]) {
        const x = a.x + Math.cos(a.angle) * d, y = a.y + Math.sin(a.angle) * d;
        ink.lineBetween(x + nx * 0.4, y + ny * 0.4, x + Math.cos(a.angle) * 18, y + Math.sin(a.angle) * 18);
        ink.lineBetween(x - nx * 0.4, y - ny * 0.4, x + Math.cos(a.angle) * 18, y + Math.sin(a.angle) * 18);
      }
    } else if (a.kind === "chains") {
      const radius = bossAttackRadius(a.kind) + 10, half = Math.PI / 5;
      ink.beginPath();
      ink.moveTo(a.x, a.y);
      ink.arc(a.x, a.y, radius, a.angle - half, a.angle + half, false);
      ink.closePath();
      ink.fillPath(); ink.strokePath();
    } else {
      const radius = bossAttackRadius(a.kind) + 10;
      ink.fillCircle(a.x, a.y, radius);
      ink.strokeCircle(a.x, a.y, radius);
      if (warning) ink.strokeCircle(a.x, a.y, radius * Math.max(0.04, progress));
      if (a.kind === "plague") {
        // Crosses distinguish a persistent hazard from the single shockwave.
        for (const dx of [-24, 0, 24]) {
          ink.lineBetween(a.x + dx - 5, a.y - 5, a.x + dx + 5, a.y + 5);
          ink.lineBetween(a.x + dx - 5, a.y + 5, a.x + dx + 5, a.y - 5);
        }
      }
    }
    if (warning) {
      ink.lineStyle(3, 0xfff0c2, 1);
      ink.lineBetween(e.x, e.y - 100, e.x, e.y - 88);
      ink.fillStyle(0xfff0c2, 1).fillCircle(e.x, e.y - 83, 2);
    }
  }
}
