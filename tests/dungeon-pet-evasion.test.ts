import { describe, it, expect, vi } from "vitest";
import { DungeonRun, type Enemy } from "../src/dungeons/run";
import { createDungeonProgress } from "../src/dungeons/progression";
import { validDungeonSnapshot } from "../src/dungeons/snapshot";
import type { PetSpecies } from "../src/dungeons/config";
function make(species: PetSpecies = "dog", count = 1, damage = 12) {
  const progress = createDungeonProgress();
  progress.pets.push({
    id: "pet-evasion",
    species,
    rare: false,
    xp: 0,
    attributes: {
      speed: 0,
      resistance: 0,
      perception: 0,
      protection: 0,
      efficiency: 0,
    },
  });
  const run = new DungeonRun(
      "pet-evasion",
      "abandoned-central-square",
      progress,
      "pet-evasion",
    ),
    s = run.state,
    p = s.pet!;
  s.spawnClock = 20;
  s.eventClock = 1000;
  s.cooldowns.sword = 30;
  s.buffs.invulnerable = 1000;
  p.attack = 10;
  p.special = 10;
  s.enemies = Array.from(
    { length: count },
    (_, i) =>
      ({
        id: 100 + i,
        x: p.x,
        y: p.y,
        hp: 1000,
        maxHp: 1000,
        speed: 1,
        damage,
        kind: "walker",
        special: false,
        streak: 0,
        lastHit: 0,
      }) as Enemy,
  );
  p.action = {
    kind: "basic",
    age: 0,
    direction: "south",
    targetId: 100,
    originX: p.x,
    originY: p.y,
    targetX: p.x,
    targetY: p.y,
    hit: true,
  };
  return run;
}
const tick = (r: DungeonRun, n = 1) => {
  for (let i = 0; i < n; i++) r.step(1 / 30);
};
describe("pet contact evasion", () => {
  it("avoids damage and takes a short evasive step using collision-aware movement", () => {
    const r = make();
    r.random = () => 0;
    const hp = r.state.pet!.hp;
    tick(r);
    const p = r.state.pet!;
    expect(p.hp).toBe(hp);
    expect(p.evade).toBeDefined();
    const before = { x: p.x, y: p.y };
    delete p.action;
    tick(r);
    expect(Math.hypot(p.x - before.x, p.y - before.y)).toBeGreaterThan(4);
    expect(p.running).toBe(true);
  });
  it("takes one bounded hit rather than stacking every enemy every frame", () => {
    const one = make(),
      crowd = make("dog", 40);
    one.random = () => 0.99;
    crowd.random = vi.fn(() => 0.99);
    tick(one, 10);
    tick(crowd, 10);
    expect(crowd.state.pet!.hp).toBeCloseTo(one.state.pet!.hp);
    expect(crowd.random).toHaveBeenCalledTimes(1);
    expect(crowd.state.pet!.hp).toBeCloseTo(crowd.state.pet!.maxHp - 7.2);
  });
  it("prevents a single strong hit from knocking out a healthy pet", () => {
    const r = make("cat", 1, 1000);
    r.random = () => 0.99;
    tick(r);
    expect(r.state.pet!.hp).toBeCloseTo(r.state.pet!.maxHp * 0.65);
  });
  it("makes the cat more evasive while keeping both pets vulnerable to failed dodges", () => {
    const dog = make("dog"),
      cat = make("cat");
    dog.random = () => 0.75;
    cat.random = () => 0.75;
    tick(dog);
    tick(cat);
    expect(dog.state.pet!.hp).toBeLessThan(dog.state.pet!.maxHp);
    expect(cat.state.pet!.hp).toBe(cat.state.pet!.maxHp);
  });
  it("preserves protection and the dodge when paused or restored", () => {
    const r = make();
    r.random = () => 0;
    tick(r);
    r.pause();
    const snapshot = r.snapshot();
    expect(validDungeonSnapshot(snapshot)).toBe(true);
    r.step(0.25);
    expect(r.snapshot()).toEqual(snapshot);
    const restored = make();
    restored.restore(snapshot);
    restored.resume();
    tick(restored, 3);
    expect(restored.state.pet!.hp).toBe(snapshot.pet!.hp);
    expect(restored.state.pet!.hurtGrace).toBeGreaterThan(0);
    expect(validDungeonSnapshot(restored.snapshot())).toBe(true);
  });
  it("accepts older snapshots but rejects malformed dodge timers", () => {
    const r = make(),
      snapshot = r.snapshot();
    expect(validDungeonSnapshot(snapshot)).toBe(true);
    snapshot.pet!.hurtGrace = Infinity;
    expect(validDungeonSnapshot(snapshot)).toBe(false);
  });
});
