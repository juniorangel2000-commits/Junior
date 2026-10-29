import type Phaser from "phaser";
import type { DungeonRun } from "./run";
import { weaponIdentity, swordHalfArc } from "./weapon-identity";
import { WEAPON_PALETTES, effectProgress } from "./weapon-presentation";
const TAU = Math.PI * 2;
export function drawWeaponEffects(
  ink: Phaser.GameObjects.Graphics,
  run: DungeonRun,
): void {
  const s = run.state;
  for (const q of s.projectiles) {
    const evolved = weaponIdentity(q.weapon, s.levels).evolved;
    const palette = WEAPON_PALETTES[q.weapon],
      a = Math.atan2(q.vy, q.vx),
      length = q.weapon === "bow" ? 26 : q.returning ? 34 : 22;
    ink.lineStyle(evolved ? 3 : 2, evolved ? 0xe0bd72 : palette.trail, 0.35);
    ink.lineBetween(
      q.x - Math.cos(a) * length,
      q.y - 18 - Math.sin(a) * length,
      q.x,
      q.y - 18,
    );
    if (q.weapon === "boomerang") {
      ink.lineStyle(1, evolved ? 0xffe0a3 : palette.core, 0.65);
      ink
        .beginPath()
        .arc(q.x, q.y - 18, 15, s.elapsed * 12, s.elapsed * 12 + 2.2, false)
        .strokePath();
    }
  }
  for (const e of run.effects) {
    const t = effectProgress(e.ttl),
      alpha = 1 - t,
      evolved = weaponIdentity(e.weapon, s.levels).evolved;
    const palette = WEAPON_PALETTES[e.weapon],
      core = evolved ? 0xffdf9d : palette.core,
      trail = evolved ? 0xc6a160 : palette.trail;
    if (e.weapon === "sword") {
      const radius = run.weaponStats("sword").range,
        half = swordHalfArc(run.level("sword-wide"));
      const end = e.angle + (e.variant ? -1 : 1) * (t * 2 - 1) * half;
      for (let layer = 0; layer < 3; layer++) {
        const r = radius * (1 - layer * 0.1),
          start =
            end - (e.variant ? -1 : 1) * Math.min(half * 2, t * half * 2, 0.85);
        ink.lineStyle(
          5 - layer * 1.7,
          layer === 0 ? core : trail,
          alpha * (0.75 - layer * 0.17),
        );
        ink
          .beginPath()
          .arc(
            e.x,
            e.y - 20,
            r,
            Math.min(start, end),
            Math.max(start, end),
            false,
          )
          .strokePath();
      }
      const x = e.x + Math.cos(end) * radius,
        y = e.y - 20 + Math.sin(end) * radius;
      ink.fillStyle(core, alpha).fillRect(x - 2, y - 2, 4, 4);
    } else if (e.weapon === "spear") {
      const length = e.radius ?? run.weaponStats("spear").range,
        reach = length * Math.min(1, t * 3.2);
      ink
        .lineStyle(evolved ? 5 : 3, trail, alpha * 0.4)
        .lineBetween(
          e.x,
          e.y - 20,
          e.x + Math.cos(e.angle) * reach,
          e.y - 20 + Math.sin(e.angle) * reach,
        );
      ink
        .lineStyle(1, core, alpha)
        .lineBetween(
          e.x,
          e.y - 20,
          e.x + Math.cos(e.angle) * reach,
          e.y - 20 + Math.sin(e.angle) * reach,
        );
      for (const side of [-1, 1]) {
        const a = e.angle + Math.PI + side * 0.55,
          x = e.x + Math.cos(e.angle) * reach,
          y = e.y - 20 + Math.sin(e.angle) * reach;
        ink.lineBetween(x, y, x + Math.cos(a) * 10, y + Math.sin(a) * 10);
      }
    } else if (e.weapon === "hammer") {
      const radius = e.radius ?? 48,
        wave = radius * Math.min(1, t * 2.2);
      ink
        .lineStyle(evolved ? 4 : 3, core, alpha * 0.8)
        .strokeCircle(e.x, e.y, wave);
      ink
        .lineStyle(1, trail, alpha * 0.5)
        .strokeCircle(e.x, e.y, Math.min(radius, wave * 0.7));
      for (let i = 0; i < 8; i++) {
        const a = (i * TAU) / 8 + e.id * 0.7,
          r = radius * (0.25 + t * 0.55);
        ink
          .lineStyle(2, trail, alpha * 0.7)
          .lineBetween(
            e.x + Math.cos(a) * r * 0.65,
            e.y + Math.sin(a) * r * 0.65,
            e.x + Math.cos(a) * r,
            e.y + Math.sin(a) * r,
          );
        ink
          .fillStyle(core, alpha * 0.55)
          .fillRect(
            e.x + Math.cos(a) * r,
            e.y + Math.sin(a) * r - 10 * Math.sin(t * Math.PI),
            2,
            2,
          );
      }
    } else if (e.weapon === "orbiting-shield") {
      const r = (e.radius ?? run.shieldRadius) * Math.min(1, t * 1.4);
      ink
        .lineStyle(evolved ? 4 : 3, core, alpha * 0.85)
        .strokeCircle(e.x, e.y, r);
      ink.lineStyle(1, trail, alpha * 0.4).strokeCircle(e.x, e.y, r * 0.8);
      for (let i = 0; i < 10; i++) {
        const a = (i * TAU) / 10,
          rr = r * 0.92;
        ink
          .lineStyle(2, core, alpha * 0.7)
          .lineBetween(
            e.x + Math.cos(a) * rr,
            e.y + Math.sin(a) * rr,
            e.x + Math.cos(a) * (rr + 7),
            e.y + Math.sin(a) * (rr + 7),
          );
      }
    } else if (e.weapon === "rotating-blade") {
      for (let i = 0; i < 4; i++) {
        const a = e.angle + (i * Math.PI) / 2,
          r = 4 + t * 13;
        ink
          .lineStyle(2, core, alpha)
          .lineBetween(
            e.x + Math.cos(a) * r * 0.3,
            e.y - 20 + Math.sin(a) * r * 0.3,
            e.x + Math.cos(a) * r,
            e.y - 20 + Math.sin(a) * r,
          );
      }
    } else if (e.weapon === "bow") {
      const x = e.x + Math.cos(e.angle) * 20,
        y = e.y - 20 + Math.sin(e.angle) * 20;
      ink
        .lineStyle(1, core, alpha)
        .lineBetween(
          x - Math.sin(e.angle) * 12,
          y + Math.cos(e.angle) * 12,
          x + Math.sin(e.angle) * 12,
          y - Math.cos(e.angle) * 12,
        );
    } else if (e.weapon === "boomerang") {
      ink
        .lineStyle(2, trail, alpha * 0.5)
        .beginPath()
        .arc(e.x, e.y - 20, 12 + t * 8, e.angle - 0.8, e.angle + 0.8, false)
        .strokePath();
    }
  }
}
