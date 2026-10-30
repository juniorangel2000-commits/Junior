import { expect, it } from "vitest";
import { experienceForLevel } from "../src/dungeons/director";
import { DungeonRun } from "../src/dungeons/run";
import { createDungeonProgress } from "../src/dungeons/progression";
import { UPGRADES } from "../src/dungeons/upgrades";
import { validDungeonSnapshot } from "../src/dungeons/snapshot";

it("requires strictly more XP at every level, including the old cap and late game", () => {
  for (let level = 1; level < 10000; level++)
    expect(experienceForLevel(level + 1)).toBeGreaterThan(
      experienceForLevel(level),
    );
  expect([1, 10, 16, 30, 50, 100, 200].map(experienceForLevel)).toEqual([
    12, 51, 89, 103, 123, 173, 273,
  ]);
});
function complete(level: number) {
  const r = new DungeonRun(
    "curve",
    "abandoned-central-square",
    createDungeonProgress(),
  );
  r.state.weapons = ["sword", "bow", "hammer", "spear"];
  for (const u of UPGRADES)
    if (!u.pet && (!u.weapon || r.state.weapons.includes(u.weapon)))
      r.state.levels[u.id] = u.max;
  r.state.level = level;
  r.state.player.hp = 30;
  expect(r.buildComplete).toBe(true);
  return r;
}
it.each([1, 14, 16, 100, 500])(
  "charges each intervening cost for multiple level-ups from %s",
  (level) => {
    const r = complete(level);
    let expectedLevel = level,
      remainder = 2100;
    while (remainder >= experienceForLevel(expectedLevel))
      remainder -= experienceForLevel(expectedLevel++);
    r.grantXP(1000); // Maxed common and rare XP cards: +110%.
    expect(r.state.level).toBe(expectedLevel);
    expect(r.state.xp).toBeCloseTo(remainder);
    expect(r.state.player.hp).toBe(30);
    expect(r.state.cards).toEqual([]);
    expect(validDungeonSnapshot(r.snapshot())).toBe(true);
  },
);
it("preserves XP and level on restore and handles large grants without per-level loops", () => {
  const r = complete(500);
  r.state.xp = 20;
  const restored = complete(1);
  restored.restore(r.snapshot());
  expect(restored.xpNeeded).toBe(r.xpNeeded);
  expect(restored.state.xp).toBe(20);
  r.grantXP(1e9);
  expect(r.state.level).toBeGreaterThan(10000);
  expect(r.state.xp).toBeLessThan(r.xpNeeded);
  expect(validDungeonSnapshot(r.snapshot())).toBe(true);
});
