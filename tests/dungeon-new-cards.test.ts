import { describe, it, expect } from "vitest";
import { DungeonRun } from "../src/dungeons/run";
import { createDungeonProgress } from "../src/dungeons/progression";
import { UPGRADES, eligibleUpgrades } from "../src/dungeons/upgrades";
import { hordeProfile } from "../src/dungeons/director";
import { validDungeonSnapshot } from "../src/dungeons/snapshot";
import { WEAPONS, type WeaponId } from "../src/dungeons/config";
const make = () =>
  new DungeonRun(
    "new-cards",
    "abandoned-central-square",
    createDungeonProgress(),
  );
describe("super-rare experience and attack cards", () => {
  it.each(["advanced-xp", "advanced-attack"])(
    "has four fifteen-percent ranks and stops appearing after max: %s",
    (id) => {
      const card = UPGRADES.find((u) => u.id === id)!;
      expect(card.rarity).toBe("super-rare");
      expect(card.max).toBe(4);
      expect(card.perLevel).toBe(0.15);
      const r = make();
      r.state.levels[id] = 3;
      expect(eligibleUpgrades(r.state).some((u) => u.id === id)).toBe(true);
      r.state.levels[id] = 4;
      expect(eligibleUpgrades(r.state).some((u) => u.id === id)).toBe(false);
    },
  );
  it("adds fifteen percent experience per rank, up to sixty percent", () => {
    const r = make();
    r.state.phase = "paused";
    r.state.levels["advanced-xp"] = 4;
    r.grantXP(100);
    expect(r.state.xp).toBeCloseTo(160);
  });
  it("adds the common and super-rare experience bonuses without multiplying them", () => {
    const r = make();
    r.state.phase = "paused";
    r.state.levels.xp = 10;
    r.state.levels["advanced-xp"] = 4;
    r.grantXP(100);
    expect(r.state.xp).toBeCloseTo(210);
  });
  it.each(
    (Object.keys(WEAPONS) as WeaponId[]).filter((w) => w !== "orbiting-shield"),
  )("applies sixty percent attack to %s", (weapon) => {
    const r = make(),
      base = r.weaponStats(weapon).damage;
    r.state.levels["advanced-attack"] = 4;
    expect(r.weaponStats(weapon).damage).toBeCloseTo(base * 1.6);
  });
  it("persists new ranks and rejects an impossible fifth rank", () => {
    const r = make();
    r.state.levels["advanced-xp"] = 4;
    r.state.levels["advanced-attack"] = 4;
    expect(validDungeonSnapshot(r.snapshot())).toBe(true);
    const restored = make();
    restored.restore(r.snapshot());
    expect(restored.snapshot()).toEqual(r.snapshot());
    r.state.levels["advanced-xp"] = 5;
    expect(validDungeonSnapshot(r.snapshot())).toBe(false);
  });
});
describe("gradual zombie strength", () => {
  it("increases health, damage and speed continuously across the timed run", () => {
    const start = hordeProfile("abandoned-central-square", 0, 1);
    let previous = start;
    for (let t = 1; t <= 900; t++) {
      const next = hordeProfile("abandoned-central-square", t, 1);
      for (const stat of ["health", "damage", "speed"] as const)
        expect(next[stat]).toBeGreaterThan(previous[stat]);
      previous = next;
    }
    expect(previous.health).toBeCloseTo(3.3);
    expect(previous.damage).toBeCloseTo(2.2);
    expect(previous.speed).toBe(1.3);
    expect(
      hordeProfile("abandoned-central-square", 60, 1).health -
        hordeProfile("abandoned-central-square", 59.999, 1).health,
    ).toBeLessThan(0.00001);
  });
  it("increases strength every wave and caps growth at the final wave", () => {
    for (let wave = 2; wave <= 50; wave++) {
      const a = hordeProfile("mall-parking", 0, wave - 1),
        b = hordeProfile("mall-parking", 0, wave);
      expect(b.health).toBeGreaterThan(a.health);
      expect(b.damage).toBeGreaterThan(a.damage);
      expect(b.speed).toBeGreaterThan(a.speed);
    }
    expect(hordeProfile("mall-parking", 0, 100).health).toBe(
      hordeProfile("mall-parking", 0, 50).health,
    );
  });
  it("uses the current strength profile for newly spawned zombies", () => {
    for (const time of [0, 450, 899]) {
      const r = make();
      r.state.elapsed = time;
      r.state.timedBossCount = [180,360,540,720,840].filter(at => at <= time).length;
      r.random = () => 0.5;
      r.step(1 / 30);
      const e = r.state.enemies[0],
        profile = hordeProfile("abandoned-central-square", r.state.elapsed, 1);
      expect(e.maxHp).toBeCloseTo(20 * profile.health);
      expect(e.damage).toBeCloseTo(8 * profile.damage);
      expect(e.speed).toBeCloseTo(30 * profile.speed);
    }
  });
});
