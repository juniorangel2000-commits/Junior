import { describe, it, expect } from "vitest";
import { DungeonRun, type Enemy } from "../src/dungeons/run";
import { createDungeonProgress } from "../src/dungeons/progression";
import { rollUpgradeCards } from "../src/dungeons/upgrades";
import { validDungeonSnapshot } from "../src/dungeons/snapshot";
import {
  dungeonWaypoint,
  dungeonSegmentClear,
} from "../src/dungeons/navigation";
const make = () =>
  new DungeonRun("long-run", "mall-parking", createDungeonProgress());
describe("long session regressions", () => {
  it("keeps a long unfinished wave save valid when no spawns remain", () => {
    const r = make();
    r.state.waveRemaining = 0;
    r.state.cooldowns.sword = 30;
    r.state.enemies = [
      {
        id: 99,
        x: 2500,
        y: 2000,
        hp: 1000,
        maxHp: 1000,
        speed: 1,
        damage: 0,
        special: false,
        kind: "walker",
        streak: 0,
        lastHit: 0,
      },
    ];
    for (let n = 0; n < 1800; n++) r.step(1 / 30);
    expect(r.state.phase).toBe("fighting");
    expect(r.state.spawnClock).toBe(0);
    expect(validDungeonSnapshot(r.snapshot())).toBe(true);
  });
  it.each([10, 30, 50, 70, 90])(
    "offers a legal new weapon at level %s without forcing acquisition",
    (level) => {
      const r = make();
      r.state.level = level;
      const cards = rollUpgradeCards(r.state, () => 0.99999);
      expect(cards).toHaveLength(3);
      expect(new Set(cards.map((c) => c.id)).size).toBe(3);
      expect(
        cards.some(
          (c) => c.kind === "arsenal" && !r.state.weapons.includes(c.id),
        ),
      ).toBe(true);
      expect(r.state.weapons).toEqual(["sword"]);
    },
  );
  it("offers improvements in every slot once the Arsenal is full", () => {
    const r = make();
    r.state.level = 10;
    r.state.weapons = ["sword", "bow", "hammer", "spear"];
    expect(
      rollUpgradeCards(r.state, () => 0.999).every((c) => c.kind === "upgrade"),
    ).toBe(true);
  });
  it.each([
    [2584, 1784, 2737, 1938],
    [996, 1508, 818, 1331],
    [1380, 200, 1427, 479],
    [898.5334356561904, 997.1172192265615, 1321.1784854038667, 921.3575944351776],
  ])(
    "routes a stranded pursuer around parked obstacles from %s,%s",
    (x, y, tx, ty) => {
      const r = make();
      r.state.player.x = tx;
      r.state.player.y = ty;
      r.state.waveRemaining = 0;
      r.state.cooldowns.sword = 30;
      const e: Enemy = {
        id: 99,
        x,
        y,
        hp: 1000,
        maxHp: 1000,
        speed: 30,
        damage: 0,
        special: false,
        kind: "walker",
        streak: 0,
        lastHit: 0,
      };
      r.state.enemies = [e];
      if (x < 900 && y > 990 && y < 1000)
        e.detour = { x: 992, y: 1008 }; // Save captured from a stalled round 46.
      let closest = Infinity;
      for (let i = 0; i < 900; i++) {
        r.step(1 / 30);
        closest = Math.min(closest, Math.hypot(e.x - tx, e.y - ty));
        if (closest < 30) break;
      }
      expect(closest).toBeLessThan(30);
      expect(validDungeonSnapshot(r.snapshot())).toBe(true);
    },
  );
  it("uses a reachable waypoint and preserves detours on save and load", () => {
    const r = make();
    r.state.waveRemaining = 0;
    r.state.cooldowns.sword = 30;
    r.state.player.x = 2737;
    r.state.player.y = 1938;
    const waypoint = dungeonWaypoint("mall-parking", 2584, 1784, 2737, 1938)!;
    expect(waypoint).toBeDefined();
    expect(
      dungeonSegmentClear("mall-parking", 2584, 1784, waypoint.x, waypoint.y),
    ).toBe(true);
    r.state.enemies = [
      {
        id: 99,
        x: 2584,
        y: 1784,
        hp: 1000,
        maxHp: 1000,
        speed: 30,
        damage: 0,
        special: false,
        kind: "walker",
        streak: 0,
        lastHit: 0,
        detour: waypoint,
      },
    ];
    const copy = make();
    copy.restore(r.snapshot());
    for (let i = 0; i < 20; i++) {
      r.step(1 / 30);
      copy.step(1 / 30);
    }
    expect(copy.snapshot()).toEqual(r.snapshot());
    const bad = r.snapshot();
    bad.enemies[0].detour = { x: NaN, y: 0 };
    expect(validDungeonSnapshot(bad)).toBe(false);
  });
});
