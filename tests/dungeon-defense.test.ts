import { describe, it, expect } from "vitest";
import { DungeonRun, type Enemy } from "../src/dungeons/run";
import { createDungeonProgress } from "../src/dungeons/progression";
import { WEAPONS, type WeaponId } from "../src/dungeons/config";
import { validDungeonSnapshot } from "../src/dungeons/snapshot";
import { weaponIdentity } from "../src/dungeons/weapon-identity";
const make = (weapon: WeaponId) => {
  const r = new DungeonRun(
    "defense",
    "abandoned-central-square",
    createDungeonProgress(),
  );
  r.state.weapons = ["sword", weapon];
  r.state.cooldowns.sword = 20;
  r.state.spawnClock = 20;
  return r;
};
const enemy = (r: DungeonRun, id: number, x: number, y = 0): Enemy => ({
  id,
  x: r.state.player.x + x,
  y: r.state.player.y + y,
  hp: 1000,
  maxHp: 1000,
  speed: 1,
  damage: 10,
  special: false,
  kind: "walker",
  streak: 0,
  lastHit: 0,
});
const advance = (r: DungeonRun, n: number) => {
  for (let i = 0; i < n; i++) r.step(1 / 30);
};
describe("remaining weapons and shock shield", () => {
  it("pierces a line up to its limit without hitting enemies off that line", () => {
    const r = make("spear");
    r.state.levels["spear-piercing"] = 2;
    r.state.enemies = [
      enemy(r, 1, 50),
      enemy(r, 2, 80),
      enemy(r, 3, 110),
      enemy(r, 4, 80, 45),
    ];
    r.step(1 / 30);
    expect(r.state.enemies.slice(0, 3).every((e) => e.hp < 1000)).toBe(true);
    expect(r.state.enemies[3].hp).toBe(1000);
  });
  it("does not multiply damage when a close target overlaps all fan rays", () => {
    const r = make("spear");
    r.state.levels["spear-fan"] = 1;
    r.state.enemies = [enemy(r, 1, 35)];
    r.step(1 / 30);
    expect(r.state.enemies[0].hp).toBeCloseTo(1000 - WEAPONS.spear.damage);
    expect(r.effects.filter((e) => e.weapon === "spear")).toHaveLength(3);
  });
  it("shows the actual spear length in the transient effect", () => {
    const r = make("spear");
    r.state.levels["spear-range"] = 4;
    r.state.enemies = [enemy(r, 1, 100)];
    r.step(1 / 30);
    expect(r.effects.find((e) => e.weapon === "spear")?.radius).toBeCloseTo(
      r.weaponStats("spear").range,
    );
  });
  it("hits a group and pushes survivors with both hammer strikes", () => {
    const r = make("hammer");
    r.state.levels["hammer-double"] = 1;
    r.state.enemies = [enemy(r, 1, 50), enemy(r, 2, 70)];
    r.step(1 / 30);
    expect(r.state.enemies.every((e) => e.hp < 1000)).toBe(true);
    const after = r.state.enemies[1].x;
    advance(r, 7);
    expect(r.state.enemies[1].x).toBeGreaterThan(after);
    expect(
      r.effects.some((e) => e.weapon === "hammer" && e.variant === 1),
    ).toBe(true);
  });
  it("draws hammer impact with the exact damage radius including area upgrades", () => {
    const r = make("hammer");
    r.state.levels["hammer-area"] = 3;
    r.state.enemies = [enemy(r, 1, 50)];
    r.step(1 / 30);
    expect(r.effects.find((e) => e.weapon === "hammer")?.radius).toBeCloseTo(
      48 * Math.sqrt(1.3),
    );
  });
  it("accelerates the blade orbit continuously without teleporting on upgrade", () => {
    const r = make("rotating-blade");
    advance(r, 10);
    const before = r.orbitalAngle("rotating-blade");
    r.state.levels["blade-speed"] = 3;
    r.step(1 / 30);
    expect(r.orbitalAngle("rotating-blade") - before).toBeCloseTo(0.124);
  });
  it("keeps blade phase after load and freezes it while paused", () => {
    const r = make("rotating-blade");
    advance(r, 20);
    const saved = r.snapshot(),
      other = make("rotating-blade");
    other.restore(saved);
    expect(validDungeonSnapshot(saved)).toBe(true);
    r.pause();
    const angle = r.orbitalAngle("rotating-blade");
    r.step(0.2);
    expect(r.orbitalAngle("rotating-blade")).toBe(angle);
    r.resume();
    r.step(1 / 30);
    other.step(1 / 30);
    expect(other.snapshot()).toEqual(r.snapshot());
  });
  it("does not create repeated blade attack effects when there is no contact", () => {
    const r = make("rotating-blade");
    advance(r, 50);
    expect(r.effects).toHaveLength(0);
  });
  it("automatically absorbs a hit, repels a nearby group and starts recharge", () => {
    const r = make("orbiting-shield");
    r.state.enemies = [enemy(r, 1, 10), enemy(r, 2, 50)];
    r.step(1 / 30);
    expect(r.state.player.hp).toBe(100);
    expect(r.state.shield?.charges).toBe(0);
    expect(r.state.shield?.recharge).toBeCloseTo(6);
    expect(r.state.enemies[1].x).toBeGreaterThan(r.state.player.x + 50);
    expect(r.effects.some((e) => e.weapon === "orbiting-shield")).toBe(true);
    // It is a defensive pulse, rather than another damage source.
    expect(r.state.enemies.every((e) => e.hp === 1000)).toBe(true);
  });
  it("allows damage when depleted and restores the charge after active recharge time", () => {
    const r = make("orbiting-shield");
    r.state.enemies = [enemy(r, 1, 10)];
    r.step(1 / 30);
    r.state.player.invulnerable = 0;
    r.state.enemies[0].x = r.state.player.x + 10;
    r.step(1 / 30);
    expect(r.state.player.hp).toBe(90);
    r.state.enemies = [];
    advance(r, 181);
    expect(r.state.shield?.charges).toBe(1);
  });
  it("offers two blocks and a larger pulse with Barreira de Impacto", () => {
    const r = make("orbiting-shield");
    r.state.levels["shield-double"] = 1;
    r.state.enemies = [enemy(r, 1, 10)];
    r.step(1 / 30);
    expect(r.state.shield?.charges).toBe(1);
    r.state.player.invulnerable = 0;
    r.state.enemies[0].x = r.state.player.x + 10;
    r.step(1 / 30);
    expect(r.state.shield?.charges).toBe(0);
    expect(r.state.player.hp).toBe(100);
    expect(r.shieldRadius).toBe(112.5);
  });
  it("pauses and saves shield recharge without restoring spent charges early", () => {
    const r = make("orbiting-shield");
    r.state.enemies = [enemy(r, 1, 10)];
    r.step(1 / 30);
    r.state.enemies = [];
    advance(r, 20);
    r.pause();
    const save = r.snapshot();
    expect(validDungeonSnapshot(save)).toBe(true);
    r.step(0.2);
    expect(r.snapshot()).toEqual(save);
    const other = make("orbiting-shield");
    other.restore(save);
    other.resume();
    r.resume();
    advance(other, 20);
    advance(r, 20);
    expect(other.snapshot()).toEqual(r.snapshot());
    expect(r.state.shield?.charges).toBe(0);
  });
  it("loads old snapshots and validates the new optional shield fields", () => {
    const r = make("orbiting-shield"),
      save = r.snapshot();
    delete save.shield;
    delete save.orbitalAngles;
    expect(validDungeonSnapshot(save)).toBe(true);
    r.restore(save);
    r.step(1 / 30);
    expect(r.state.shield?.charges).toBe(1);
    const bad = r.snapshot();
    bad.shield!.charges = 3;
    expect(validDungeonSnapshot(bad)).toBe(false);
    bad.shield!.charges = 1;
    bad.shield!.recharge = NaN;
    expect(validDungeonSnapshot(bad)).toBe(false);
  });
  it("lets upgrades shorten shield recharge and enlarge the pulse with stable weapon IDs", () => {
    const r = make("orbiting-shield");
    r.state.levels["shield-speed"] = 4;
    r.state.levels["shield-protection"] = 3;
    expect(r.shieldRecharge).toBeCloseTo(5);
    expect(r.shieldRadius).toBeCloseTo(103.5);
    expect(weaponIdentity("orbiting-shield", { "shield-double": 1 }).name).toBe(
      "Barreira de Impacto",
    );
    expect(r.state.weapons).toHaveLength(2);
  });
});
