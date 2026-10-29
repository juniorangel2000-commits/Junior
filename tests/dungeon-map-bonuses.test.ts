import { describe, it, expect } from "vitest";
import { DungeonRun, type Enemy } from "../src/dungeons/run";
import { createDungeonProgress } from "../src/dungeons/progression";
import { UPGRADES } from "../src/dungeons/upgrades";
import { validDungeonSnapshot } from "../src/dungeons/snapshot";
const make = () => {
  const r = new DungeonRun(
    "map-bonus",
    "abandoned-central-square",
    createDungeonProgress(),
  );
  r.state.spawnClock = 20;
  return r;
};
const enemy = (r: DungeonRun, kind: Enemy["kind"]): Enemy => ({
  id: 100,
  x: r.state.player.x + 30,
  y: r.state.player.y,
  hp: 1000,
  maxHp: 1000,
  speed: 1,
  damage: 0,
  special: kind === "boss",
  kind,
  streak: 0,
  lastHit: 0,
});
describe("boss damage and map bonuses", () => {
  it("provides four twenty-percent super-rare boss ranks", () => {
    expect(UPGRADES.find((u) => u.id === "boss-damage")).toMatchObject({
      rarity: "super-rare",
      max: 4,
      perLevel: 0.2,
    });
  });
  it.each(["walker", "brute", "boss"] as const)(
    "applies boss damage only to bosses: %s",
    (kind) => {
      const r = make();
      r.state.levels["boss-damage"] = 4;
      const e = enemy(r, kind);
      r.state.enemies = [e];
      const base = r.weaponStats("sword").damage;
      r.step(1 / 30);
      expect(e.hp).toBeCloseTo(1000 - base * (kind === "boss" ? 1.8 : 1));
    },
  );
  it("collects a temporary critical bonus from the map and freezes its duration during pause", () => {
    const r = make();
    r.state.pickups = [
      { id: 50, ...r.state.player, kind: "critical", amount: 0 },
    ];
    r.step(1 / 30);
    expect(r.state.buffs.critical).toBeGreaterThan(r.state.elapsed);
    r.pause();
    const s = r.snapshot();
    r.step(0.2);
    expect(r.snapshot()).toEqual(s);
    expect(validDungeonSnapshot(s)).toBe(true);
  });
  it.each([
    [0.199, true],
    [0.2, false],
    [0.8, false],
  ] as const)(
    "uses the twenty-percent critical threshold at RNG %s",
    (rng, critical) => {
      const r = make();
      r.state.buffs.critical = 12;
      r.random = () => rng;
      const e = enemy(r, "walker");
      r.state.enemies = [e];
      const damage = r.weaponStats("sword").damage;
      r.step(1 / 30);
      expect(e.hp).toBeCloseTo(1000 - damage * (critical ? 1.5 : 1));
      expect(r.impacts[0].critical).toBe(critical);
    },
  );
  it("does not keep the critical benefit after the bonus expires", () => {
    const r = make();
    r.state.buffs.critical = 0.01;
    r.random = () => 0;
    const e = enemy(r, "walker");
    r.state.enemies = [e];
    r.step(1 / 30);
    expect(r.impacts[0].critical).toBe(false);
  });
  it("magnet attracts only experience already on the map and preserves the flight on save", () => {
    const r = make();
    r.state.pickups = [
      { id: 1, x: 500, y: 500, kind: "xp", amount: 4 },
      { id: 2, x: 600, y: 500, kind: "health", amount: 20 },
      { id: 3, ...r.state.player, kind: "magnet", amount: 0 },
    ];
    r.step(1 / 30);
    expect(r.state.pickups.find((p) => p.id === 1)?.attracted).toBe(true);
    expect(r.state.pickups.find((p) => p.id === 2)?.attracted).toBeUndefined();
    const saved = r.snapshot();
    expect(validDungeonSnapshot(saved)).toBe(true);
    const copy = make();
    copy.restore(saved);
    r.step(1 / 30);
    copy.step(1 / 30);
    expect(copy.snapshot()).toEqual(r.snapshot());
    expect(r.state.pickups.find((p) => p.id === 1)!.x).toBeGreaterThan(500);
    r.state.pickups.push({ id: 4, x: 500, y: 500, kind: "xp", amount: 4 });
    r.step(1 / 30);
    expect(r.state.pickups.find((p) => p.id === 4)?.attracted).toBeUndefined();
  });
  it("rejects invalid magnet flight metadata and boss card levels", () => {
    const r = make();
    r.state.pickups = [
      { id: 1, x: 500, y: 500, kind: "xp", amount: 4, attracted: true },
    ];
    r.state.levels["boss-damage"] = 4;
    expect(validDungeonSnapshot(r.snapshot())).toBe(true);
    r.state.levels["boss-damage"] = 5;
    expect(validDungeonSnapshot(r.snapshot())).toBe(false);
  });
  it("includes both bonuses in normal random events", () => {
    for (const [rng, kind] of [
      [0.7, "critical"],
      [0.9, "magnet"],
    ] as const) {
      const r = make();
      r.random = () => rng;
      r.state.elapsed = 45;
      r.step(1 / 30);
      expect(r.state.pickups.some((p) => p.kind === kind)).toBe(true);
    }
  });
});
