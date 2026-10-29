import { describe, it, expect } from "vitest";
import { DungeonRun } from "../src/dungeons/run";
import { createDungeonProgress } from "../src/dungeons/progression";
import { validDungeonSnapshot } from "../src/dungeons/snapshot";
const make = (round: number) => {
  const r = new DungeonRun(
    "boss-test",
    "mall-parking",
    createDungeonProgress(),
    undefined,
    1234567,
  );
  r.state.round = round;
  r.state.waveRemaining = 5 + round * 2;
  r.state.spawnClock = 0;
  r.state.cooldowns.sword = 30;
  return r;
};
describe("milestone bosses", () => {
  it.each([10, 20, 30, 40, 50])(
    "spawns exactly one boss in round %s",
    (round) => {
      const r = make(round);
      for (let i = 0; i < 90; i++) r.step(1 / 30);
      expect(r.state.enemies.filter((e) => e.kind === "boss")).toHaveLength(1);
      expect(r.state.bossRound).toBe(round);
      expect(validDungeonSnapshot(r.snapshot())).toBe(true);
    },
  );
  it.each([1, 9, 11, 19, 21, 39, 41, 49])(
    "does not spawn a boss in round %s",
    (round) => {
      const r = make(round);
      r.step(1 / 30);
      expect(r.state.enemies.some((e) => e.kind === "boss")).toBe(false);
    },
  );
  it("grows health and damage each milestone and doubles both again in the final round", () => {
    const bosses = [10, 20, 30, 40, 50].map((round) => {
      const r = make(round);
      r.step(1 / 30);
      return r.state.enemies.find((e) => e.kind === "boss")!;
    });
    for (let i = 1; i < bosses.length; i++) {
      expect(bosses[i].maxHp).toBeGreaterThan(bosses[i - 1].maxHp);
      expect(bosses[i].damage).toBeGreaterThan(bosses[i - 1].damage);
    }
    expect(bosses[4].maxHp / bosses[3].maxHp).toBeGreaterThan(1.9);
    expect(bosses[4].damage / bosses[3].damage).toBeGreaterThan(1.9);
  });
  it("keeps the final round alive until its boss and remaining horde are defeated", () => {
    const r = make(50);
    r.state.waveRemaining = 0;
    r.step(1 / 30);
    expect(r.state.enemies.some((e) => e.kind === "boss")).toBe(true);
    expect(r.state.phase).toBe("fighting");
    r.state.waveRemaining = 0;
    r.state.enemies = [];
    r.step(1 / 30);
    expect(r.state.phase).toBe("victory");
  });
  it("preserves boss damage and its spawn checkpoint when loading and does not duplicate it", () => {
    const r = make(20);
    r.step(1 / 30);
    const boss = r.state.enemies.find((e) => e.kind === "boss")!;
    boss.hp -= 100;
    const copy = make(20);
    copy.restore(r.snapshot());
    for (let i = 0; i < 60; i++) {
      r.step(1 / 30);
      copy.step(1 / 30);
    }
    expect(copy.snapshot()).toEqual(r.snapshot());
    expect(copy.state.enemies.filter((e) => e.kind === "boss")).toHaveLength(1);
    expect(validDungeonSnapshot(copy.snapshot())).toBe(true);
  });
  it("requires the missing boss in an old milestone save with no spawns left", () => {
    const r = make(10);
    r.state.waveRemaining = 0;
    delete r.state.bossRound;
    const copy = make(1);
    copy.restore(r.snapshot());
    copy.step(1 / 30);
    expect(copy.state.phase).toBe("fighting");
    expect(copy.state.enemies.some((e) => e.kind === "boss")).toBe(true);
  });
  it("rejects impossible boss spawn checkpoints", () => {
    const r = make(10);
    r.state.bossRound = 20;
    expect(validDungeonSnapshot(r.snapshot())).toBe(false);
    r.state.bossRound = 11;
    expect(validDungeonSnapshot(r.snapshot())).toBe(false);
  });
});
