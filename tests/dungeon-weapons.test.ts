import { describe, it, expect } from "vitest";
import { DungeonRun, type Enemy } from "../src/dungeons/run";
import { createDungeonProgress } from "../src/dungeons/progression";
import { validDungeonSnapshot } from "../src/dungeons/snapshot";
import { WEAPONS } from "../src/dungeons/config";
import { weaponIdentity } from "../src/dungeons/weapon-identity";
const make = () => {
  const r = new DungeonRun(
    "weapon-test",
    "abandoned-central-square",
    createDungeonProgress(),
  );
  r.state.spawnClock = 20;
  return r;
};
const target = (r: DungeonRun, id: number, dx: number, dy = 0): Enemy => ({
  id,
  x: r.state.player.x + dx,
  y: r.state.player.y + dy,
  hp: 1000,
  maxHp: 1000,
  speed: 1,
  damage: 0,
  special: false,
  kind: "walker",
  streak: 0,
  lastHit: 0,
});
const step = (r: DungeonRun, n: number) => {
  for (let i = 0; i < n; i++) r.step(1 / 30);
};
describe("weapon identities", () => {
  it("cuts and pushes the frontal group without striking enemies behind the sword", () => {
    const r = make();
    r.state.levels["sword-wide"] = 2;
    const front = target(r, 100, 35),
      beside = target(r, 101, 45, 15),
      rear = target(r, 102, -50);
    r.state.enemies = [front, beside, rear];
    r.step(1 / 30);
    expect(front.hp).toBeLessThan(1000);
    expect(beside.hp).toBeLessThan(1000);
    expect(rear.hp).toBe(1000);
    expect(front.x).toBeGreaterThan(r.state.player.x + 35);
  });
  it("widens the actual cut with Corte Amplo, rather than only changing the drawing", () => {
    const base = make(),
      wide = make();
    wide.state.levels["sword-wide"] = 2;
    for (const r of [base, wide])
      r.state.enemies = [target(r, 100, 30), target(r, 101, 40, 43)];
    base.step(1 / 30);
    wide.step(1 / 30);
    expect(base.state.enemies[1].hp).toBe(1000);
    expect(wide.state.enemies[1].hp).toBeLessThan(1000);
  });
  it("saves directional dual cuts and reproduces the second strike after restore", () => {
    const r = make();
    r.state.levels["sword-dual"] = 1;
    r.state.enemies = [target(r, 100, 30)];
    r.step(1 / 30);
    const save = r.snapshot();
    expect(save.pendingAttacks[0].angle).toBeCloseTo(0);
    expect(validDungeonSnapshot(save)).toBe(true);
    const restored = make();
    restored.restore(save);
    step(r, 7);
    step(restored, 7);
    expect(restored.snapshot()).toEqual(r.snapshot());
    expect(r.state.enemies[0].hp).toBeCloseTo(
      1000 - WEAPONS.sword.damage * 1.6,
    );
    expect(r.effects.some((e) => e.weapon === "sword" && e.variant === 1)).toBe(
      true,
    );
  });
  it("accepts old radial delayed attacks and rejects corrupted directional data", () => {
    const r = make();
    r.state.pendingAttacks.push({
      weapon: "sword",
      x: 1536,
      y: 1856,
      at: 1,
      damage: 10,
      radius: 74,
    });
    expect(validDungeonSnapshot(r.snapshot())).toBe(true);
    r.state.pendingAttacks[0].angle = NaN;
    expect(validDungeonSnapshot(r.snapshot())).toBe(false);
  });
  it("aims three arrows at three distinct targets and replaces double instead of adding to it", () => {
    const r = make();
    r.state.weapons.push("bow");
    r.state.levels["bow-double"] = 1;
    r.state.levels["bow-triple"] = 1;
    r.state.enemies = [
      target(r, 100, 180),
      target(r, 101, 200, 80),
      target(r, 102, 220, -80),
    ];
    r.step(1 / 30);
    const arrows = r.state.projectiles.filter((p) => p.weapon === "bow");
    expect(arrows).toHaveLength(3);
    expect(arrows[0].vy).toBeCloseTo(0);
    expect(arrows[1].vy).toBeGreaterThan(0);
    expect(arrows[2].vy).toBeLessThan(0);
  });
  it("concentrates extra arrows on the remaining target when only one is present", () => {
    const r = make();
    r.state.weapons.push("bow");
    r.state.levels["bow-double"] = 1;
    r.state.enemies = [target(r, 100, 180)];
    r.step(1 / 30);
    expect(
      r.state.projectiles
        .filter((p) => p.weapon === "bow")
        .every((p) => Math.abs(p.vy) < 0.001),
    ).toBe(true);
  });
  it("throws evolved boomerangs in opposite directions with only two projectiles", () => {
    const r = make();
    r.state.weapons.push("boomerang");
    r.state.levels["boomerang-double"] = 1;
    r.state.levels["boomerang-cross"] = 1;
    r.state.enemies = [target(r, 100, 180)];
    r.step(1 / 30);
    const p = r.state.projectiles.filter((p) => p.weapon === "boomerang");
    expect(p).toHaveLength(2);
    expect(p[0].vx * p[1].vx + p[0].vy * p[1].vy).toBeLessThan(0);
  });
  it("hits a group only once per leg and permits another hit on return", () => {
    const r = make();
    r.random = () => 0;
    r.state.weapons.push("boomerang");
    const e = target(r, 100, 150);
    r.state.enemies = [e];
    r.state.cooldowns.sword = 10;
    r.step(1 / 30);
    r.state.cooldowns.boomerang = 10;
    step(r, 80);
    expect(e.hp).toBeCloseTo(1000 - WEAPONS.boomerang.damage * 2);
  });
  it("keeps the returning boomerang alive long enough to follow a moving player", () => {
    const r = make();
    r.state.weapons.push("boomerang");
    r.state.enemies = [target(r, 100, 180)];
    r.step(1 / 30);
    const p = r.state.projectiles.find((p) => p.weapon === "boomerang")!;
    p.returning = true;
    p.distance = p.range + 1;
    p.x = r.state.player.x + 150;
    p.y = r.state.player.y;
    r.state.cooldowns.boomerang = 10;
    r.step(1 / 30);
    expect(r.state.projectiles.includes(p)).toBe(true);
    expect(p.vx).toBeLessThan(0);
  });
  it("shows evolution names without changing the weapon slot identity", () => {
    expect(weaponIdentity("bow", { "bow-triple": 1 })).toMatchObject({
      name: "Disparo Triplo",
      evolved: true,
    });
    expect(weaponIdentity("sword", {}).evolved).toBe(false);
  });
});
