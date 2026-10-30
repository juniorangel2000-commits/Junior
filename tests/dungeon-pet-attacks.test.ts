import { describe, it, expect } from "vitest";
import { DungeonRun, type Enemy } from "../src/dungeons/run";
import { createDungeonProgress } from "../src/dungeons/progression";
import { validDungeonSnapshot } from "../src/dungeons/snapshot";
import { PETS, type PetSpecies } from "../src/dungeons/config";
import { petSpritePose } from "../src/dungeons/pet-sprites";
function make(species: PetSpecies, kind: "basic" | "special") {
  const progress = createDungeonProgress();
  progress.pets.push({
    id: "pet-test",
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
      "pet-attack",
      "abandoned-central-square",
      progress,
      "pet-test",
    ),
    s = run.state,
    p = s.pet!;
  s.spawnClock = 20;
  s.eventClock = 1000;
  s.cooldowns.sword = 30;
  p.attack = kind === "basic" ? 0 : 10;
  p.special = kind === "special" ? 0 : 10;
  s.enemies = [
    {
      id: 100,
      x: p.x + 60,
      y: p.y,
      hp: 1000,
      maxHp: 1000,
      speed: 1,
      damage: 0,
      special: false,
      kind: "walker",
      streak: 0,
      lastHit: 0,
    } as Enemy,
  ];
  return run;
}
const tick = (r: DungeonRun, n: number) => {
  for (let i = 0; i < n; i++) r.step(1 / 30);
};
describe("pet jump damage", () => {
  for (const species of ["cat", "dog"] as const)
    for (const kind of ["basic", "special"] as const) {
      it(`${species} ${kind}: deals damage once on the landing frame, never on takeoff`, () => {
        const r = make(species, kind);
        tick(r, 17);
        expect(r.state.enemies[0].hp).toBe(1000);
        expect(r.state.pet!.action?.hit).toBe(false);
        tick(r, 1);
        expect(r.state.enemies[0].hp).toBe(
          1000 - PETS[species].damage * (kind === "special" ? 1.5 : 1),
        );
        expect(r.state.pet!.action?.hit).toBe(true);
        expect(
          petSpritePose(
            species,
            "attack",
            r.state.pet!.action!.direction,
            r.state.pet!.action!.age,
            false,
          ).frame,
        ).toMatch(/-6$/);
        const hp = r.state.enemies[0].hp;
        tick(r, 6);
        expect(r.state.enemies[0].hp).toBe(hp);
        expect(r.state.pet!.action).toBeUndefined();
      });
    }
  it("pauses the jump and resumes a saved windup without losing or duplicating damage", () => {
    const r = make("dog", "special");
    tick(r, 17);
    r.pause();
    const snapshot = r.snapshot();
    expect(validDungeonSnapshot(snapshot)).toBe(true);
    r.step(0.25);
    expect(r.snapshot()).toEqual(snapshot);
    const resumed = make("dog", "special");
    resumed.restore(snapshot);
    resumed.resume();
    tick(resumed, 1);
    expect(resumed.state.enemies[0].hp).toBe(1000 - PETS.dog.damage * 1.5);
    const after = resumed.snapshot();
    expect(validDungeonSnapshot(after)).toBe(true);
    const again = make("dog", "special");
    again.restore(after);
    tick(again, 5);
    expect(again.state.enemies[0].hp).toBe(after.enemies[0].hp);
  });
  it("does not start a jump through a solid bench", () => {
    const r = make("cat", "basic"),
      s = r.state;
    s.player.x = 1240;
    s.player.y = 1160;
    s.pet!.x = 1275;
    s.pet!.y = 1160;
    s.enemies[0].x = 1325;
    s.enemies[0].y = 1160;
    tick(r, 10);
    expect(s.pet!.action).toBeUndefined();
    expect(s.enemies[0].hp).toBe(1000);
  });
  it("accepts older pet snapshots and rejects malformed saved attacks", () => {
    const r = make("dog", "special");
    expect(validDungeonSnapshot(r.snapshot())).toBe(true);
    tick(r, 2);
    const s = r.snapshot();
    expect(validDungeonSnapshot(s)).toBe(true);
    s.pet!.action!.age = Infinity;
    expect(validDungeonSnapshot(s)).toBe(false);
  });
});

describe("free dungeon companion movement", () => {
  it("keeps space, explores nearby positions and resumes the same movement from a save", () => {
    const r = make("cat", "basic");
    r.state.enemies = [];
    tick(r, 120);
    const pet = r.state.pet!,
      distance = Math.hypot(pet.x - r.state.player.x, pet.y - r.state.player.y);
    expect(distance).toBeGreaterThan(55);
    expect(distance).toBeLessThan(190);
    const snapshot = r.snapshot(),
      restored = make("cat", "basic");
    restored.restore(snapshot);
    tick(r, 30);
    tick(restored, 30);
    expect(restored.state.pet!.x).toBeCloseTo(r.state.pet!.x);
    expect(restored.state.pet!.y).toBeCloseTo(r.state.pet!.y);
    expect(validDungeonSnapshot(restored.snapshot())).toBe(true);
  });
  it("regroups when far away instead of wandering off", () => {
    const r = make("dog", "basic");
    r.state.enemies = [];
    r.state.pet!.x -= 450;
    const before = Math.hypot(
      r.state.pet!.x - r.state.player.x,
      r.state.pet!.y - r.state.player.y,
    );
    tick(r, 30);
    expect(
      Math.hypot(
        r.state.pet!.x - r.state.player.x,
        r.state.pet!.y - r.state.player.y,
      ),
    ).toBeLessThan(before - 50);
    expect(r.state.pet!.running).toBe(true);
  });
  it("approaches an enemy independently and attacks without waiting for the player to move closer", () => {
    const r = make("cat", "basic");
    const start = r.state.pet!.x;
    r.state.enemies[0].x = start - 150;
    tick(r, 60);
    expect(r.state.pet!.x).toBeLessThan(start - 10);
    expect(r.state.enemies[0].hp).toBeLessThan(1000);
  });
});
