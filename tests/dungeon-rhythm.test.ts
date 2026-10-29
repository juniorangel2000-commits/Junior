import { describe, it, expect } from "vitest";
import { hordeProfile, experienceForLevel } from "../src/dungeons/director";
import { DungeonRun } from "../src/dungeons/run";
import { createDungeonProgress } from "../src/dungeons/progression";
import { validDungeonSnapshot } from "../src/dungeons/snapshot";
import { DUNGEON_BALANCE as B } from "../src/dungeons/config";

const create = () =>
  new DungeonRun("rhythm", "abandoned-central-square", createDungeonProgress());
describe("survival rhythm", () => {
  it("increases arrivals substantially across the timed challenge, with a bounded final pressure", () => {
    const profiles = [0, 60, 180, 360, 600, 780].map((t) =>
      hordeProfile("abandoned-central-square", t, 1),
    );
    for (let i = 1; i < profiles.length; i++) {
      expect(profiles[i].batch / profiles[i].interval).toBeGreaterThan(
        profiles[i - 1].batch / profiles[i - 1].interval,
      );
      expect(profiles[i].health).toBeGreaterThan(profiles[i - 1].health);
    }
    expect(profiles[5].batch).toBeLessThanOrEqual(12);
  });
  it("alternates surrounding, flanking and pincer arrivals and grants a short breathing window", () => {
    const at = (t: number) => hordeProfile("abandoned-central-square", t, 1);
    expect(new Set([at(0).pattern, at(30).pattern, at(60).pattern]).size).toBe(
      3,
    );
    expect(at(79).respite).toBe(false);
    expect(at(80).respite).toBe(true);
    expect(at(89.9).respite).toBe(true);
    expect(at(90).respite).toBe(false);
    expect(at(85).batch / at(85).interval).toBeLessThan(
      at(70).batch / at(70).interval,
    );
  });
  it("scales wave profiles without introducing a timed respite into wave combat", () => {
    const first = hordeProfile("mall-parking", 85, 1),
      last = hordeProfile("mall-parking", 85, 50);
    expect(first.respite).toBe(false);
    expect(last.batch).toBeGreaterThan(first.batch);
    expect(last.health).toBeGreaterThan(first.health);
  });
  it("keeps later level costs attainable and increasing", () => {
    for (let level = 1; level < 80; level++)
      expect(experienceForLevel(level + 1)).toBeGreaterThan(
        experienceForLevel(level),
      );
    expect(experienceForLevel(30)).toBeLessThan(600);
    expect(experienceForLevel(1)).toBe(12);
  });
  it("leaves existing enemies pursuing during respite, and freezes the director while paused", () => {
    const r = create();
    r.state.elapsed = 85;
    r.state.spawnClock = 10;
    r.state.enemies.push({
      id: 900,
      x: r.state.player.x + 200,
      y: r.state.player.y,
      hp: 100,
      maxHp: 100,
      speed: 30,
      damage: 0,
      special: false,
      kind: "walker",
      streak: 0,
      lastHit: 0,
    });
    const x = r.state.enemies[0].x;
    r.step(1 / 30);
    expect(r.state.enemies[0].x).toBeLessThan(x);
    const profile = r.horde,
      time = r.state.elapsed;
    r.pause();
    r.step(0.2);
    expect(r.horde).toEqual(profile);
    expect(r.state.elapsed).toBe(time);
  });
  it("restores the same phase and deterministic future spawns without new save fields", () => {
    const r = create();
    r.state.elapsed = 365;
    r.state.player.invulnerable = 5;
    r.step(1 / 30);
    const saved = r.snapshot();
    expect(validDungeonSnapshot(saved)).toBe(true);
    const restored = create();
    restored.restore(saved);
    expect(restored.horde).toEqual(r.horde);
    for (let i = 0; i < 100; i++) {
      r.step(1 / 30);
      restored.step(1 / 30);
    }
    expect(restored.snapshot()).toEqual(r.snapshot());
  });
  it("gives visible hits without changing RNG or allowing unbounded feedback objects", () => {
    const r = create();
    r.state.spawnClock = 10;
    r.state.enemies = Array.from({ length: 20 }, (_, i) => ({
      id: 100 + i,
      x: r.state.player.x + 40,
      y: r.state.player.y,
      hp: 10000,
      maxHp: 10000,
      speed: 1,
      damage: 0,
      special: false,
      kind: "walker" as const,
      streak: 0,
      lastHit: 0,
    }));
    r.state.levels["sword-wide"] = 3;
    for (let i = 0; i < 90; i++) r.step(1 / 30);
    expect(r.impacts.length).toBeGreaterThan(0);
    expect(r.impacts.length).toBeLessThanOrEqual(B.maxEffects);
    const before = structuredClone(r.impacts);
    r.pause();
    r.step(0.2);
    expect(r.impacts).toEqual(before);
    r.restore(r.snapshot());
    expect(r.impacts).toHaveLength(0);
  });
});
