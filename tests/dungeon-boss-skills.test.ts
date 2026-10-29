import { describe, it, expect } from "vitest";
import { DungeonRun, type Enemy } from "../src/dungeons/run";
import { createDungeonProgress } from "../src/dungeons/progression";
import { validDungeonSnapshot } from "../src/dungeons/snapshot";
import { advanceBossCombat } from "../src/dungeons/boss-combat";
import { dungeonBlocked, MAP_OBSTACLES } from "../src/dungeons/maps";

function make(round = 10) {
  const r = new DungeonRun("boss-skills", "mall-parking", createDungeonProgress());
  r.state.round = round; r.state.bossRound = round;
  r.state.waveRemaining = 0; r.state.spawnClock = 10;
  r.state.player = { x: 1536, y: 1160, hp: 100, invulnerable: 0 };
  r.state.cooldowns.sword = 30;
  r.state.enemies = [{
    id: 10, x: 1536, y: 1100, hp: 1000, maxHp: 1000,
    speed: 30, damage: 20, kind: "boss", special: true,
    streak: 0, lastHit: 0, boss: { cooldown: 0, sequence: 0 },
  }];
  return r;
}
const step = (r: DungeonRun, count: number) => {
  for (let i = 0; i < count; i++) r.step(1 / 30);
};
describe("telegraphed boss skills", () => {
  it.each([[10, "slam"], [20, "charge"], [30, "chains"], [40, "plague"], [50, "charge"]] as const)(
    "gives round %s its own attack with a harmless stationary warning",
    (round, kind) => {
      const r = make(round); step(r, 31);
      expect(r.state.enemies[0].boss?.action?.kind).toBe(kind);
      expect(r.state.enemies[0].boss?.action?.stage).toBe("warning");
      expect(r.state.enemies[0].x).toBe(1536);
      expect(r.state.enemies[0].y).toBe(1100);
      expect(r.state.player.hp).toBe(100);
    },
  );
  it.each([10, 20, 30, 40, 50])("lets a player leave the warned area in round %s", round => {
    const r = make(round); step(r, 1);
    r.state.player.x += 250;
    step(r, 80);
    expect(r.state.player.hp).toBe(100);
  });
  it("locks aim when the warning begins instead of following the player", () => {
    for (const round of [20, 30, 40]) {
      const r = make(round); step(r, 1);
      const original = structuredClone(r.state.enemies[0].boss!.action!);
      r.state.player.x += 120; step(r, 20);
      const action = r.state.enemies[0].boss!.action!;
      expect([action.x, action.y, action.angle]).toEqual([original.x, original.y, original.angle]);
    }
  });
  it("damages once per slam and respects ordinary defense", () => {
    const r = make(); r.state.levels.defense = 2;
    step(r, 70);
    expect(r.state.player.hp).toBeGreaterThan(80);
    expect(r.state.player.hp).toBeLessThan(100);
    const hp = r.state.player.hp; step(r, 15);
    expect(r.state.player.hp).toBe(hp);
  });
  it("blocks a boss impact with one shield charge and starts the shared recharge", () => {
    const r = make(); r.state.weapons.push("orbiting-shield");
    step(r, 70);
    expect(r.state.player.hp).toBe(100);
    expect(r.state.shield?.charges).toBe(0);
    expect(r.state.shield?.recharge).toBeGreaterThan(0);
  });
  it("uses hit grace for contamination rather than dealing damage every simulation tick", () => {
    const r = make(40); step(r, 62);
    // The first active hit is 40% of the 20 damage; the 0.65s grace is still active.
    expect(r.state.player.hp).toBe(92);
  });
  it("stops a charge at a car without tunneling through it", () => {
    const car = MAP_OBSTACLES["mall-parking"].find(p => p.kind === "sedan")!;
    const e: Enemy = {
      ...make(20).state.enemies[0], x: car.x, y: car.y - 160,
      boss: { cooldown: 0, sequence: 1, action: {
        kind: "charge", stage: "active", remaining: 0.65,
        x: car.x, y: car.y - 160, angle: Math.PI / 2, distance: 260, hit: false,
      } },
    };
    for (let i = 0; i < 30; i++) {
      advanceBossCombat(e, {x: car.x, y: car.y + 200}, 20, "mall-parking", 1 / 30, () => {});
      expect(dungeonBlocked("mall-parking", e.x, e.y)).toBe(false);
    }
    expect(e.y).toBeLessThan(car.y - 60);
  });
  it("keeps a warned charge aligned when struck by hammer knockback", () => {
    const r = make(20);
    r.state.weapons.push("hammer"); r.state.cooldowns.hammer = 0;
    step(r, 1);
    const e = r.state.enemies[0];
    expect(e.hp).toBeLessThan(1000); // The hammer hit is real.
    expect(e.boss?.action?.kind).toBe("charge");
    expect(e.x).toBe(e.boss!.action!.x);
    expect(e.y).toBe(e.boss!.action!.y);
  });
  it.each([10, 20, 30, 40, 50])("preserves a warning, pause and subsequent combat across save/load in round %s", round => {
    const r = make(round); step(r, 20);
    const frozen = r.snapshot(); r.pause(); step(r, 60);
    expect(r.state.enemies).toEqual(frozen.enemies);
    const copy = make(round); copy.restore(r.snapshot());
    r.resume(); copy.resume(); step(r, 70); step(copy, 70);
    expect(copy.snapshot()).toEqual(r.snapshot());
    expect(validDungeonSnapshot(copy.snapshot())).toBe(true);
  });
  it("loads an old boss without skill state with a safe initial cooldown", () => {
    const r = make(20), old = r.snapshot(); delete old.enemies[0].boss;
    expect(validDungeonSnapshot(old)).toBe(true);
    r.restore(old); step(r, 1);
    expect(r.state.enemies[0].boss?.cooldown).toBeGreaterThan(4);
    expect(r.state.enemies[0].boss?.action).toBeUndefined();
  });
  it.each([20, 40])("preserves an active skill across save/load in round %s", round => {
    const r = make(round); step(r, 53);
    expect(r.state.enemies[0].boss?.action?.stage).toBe("active");
    const copy = make(round); copy.restore(r.snapshot());
    step(r, 30); step(copy, 30);
    expect(copy.snapshot()).toEqual(r.snapshot());
    expect(validDungeonSnapshot(copy.snapshot())).toBe(true);
  });
  it("cancels an old warning if map recovery must move its boss", () => {
    const r = make(20); step(r, 1);
    const car = MAP_OBSTACLES["mall-parking"].find(p => p.kind === "sedan")!;
    r.state.enemies[0].x = car.x; r.state.enemies[0].y = car.y;
    r.restore(r.snapshot());
    expect(r.state.enemies[0].boss?.action).toBeUndefined();
    expect(r.state.enemies[0].boss?.cooldown).toBe(5);
    expect(r.state.enemies[0].hp).toBe(1000);
  });
  it("rejects corrupt skill timers, geometry and skills on ordinary enemies", () => {
    const r = make(); step(r, 1);
    for (const change of [
      (e: Enemy) => { e.boss!.cooldown = NaN; },
      (e: Enemy) => { e.boss!.action!.remaining = 100; },
      (e: Enemy) => { e.boss!.action!.angle = Infinity; },
      (e: Enemy) => { e.kind = "walker"; },
    ]) {
      const snapshot = r.snapshot(); change(snapshot.enemies[0]);
      expect(validDungeonSnapshot(snapshot)).toBe(false);
    }
  });
  it("cycles through four attacks for the final boss", () => {
    const kinds: string[] = [];
    for (let sequence = 0; sequence < 4; sequence++) {
      const r = make(50); r.state.enemies[0].boss!.sequence = sequence;
      step(r, 1); kinds.push(r.state.enemies[0].boss!.action!.kind);
    }
    expect(kinds).toEqual(["charge", "slam", "chains", "plague"]);
  });
});
