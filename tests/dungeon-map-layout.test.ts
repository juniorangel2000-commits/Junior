import { describe, it, expect } from "vitest";
import {
  DUNGEON_ENTRY,
  MAP_OBSTACLES,
  dungeonBlocked,
  safeDungeonPoint,
} from "../src/dungeons/maps";
import { DungeonRun } from "../src/dungeons/run";
import { createDungeonProgress } from "../src/dungeons/progression";
import { validDungeonSnapshot } from "../src/dungeons/snapshot";
import type { DungeonId } from "../src/dungeons/config";
describe("open dungeon layouts and existing saves", () => {
  it.each(["abandoned-central-square", "mall-parking"] as DungeonId[])(
    "keeps the entry and its immediate movement area clear in %s",
    (id) => {
      for (const dx of [-32, 0, 32])
        for (const dy of [-32, 0, 32])
          expect(
            dungeonBlocked(id, DUNGEON_ENTRY.x + dx, DUNGEON_ENTRY.y + dy),
          ).toBe(false);
    },
  );
  it("keeps the parking center open for kiting and boss fights", () => {
    for (let x = 1180; x <= 1900; x += 64)
      for (let y = 600; y <= 1820; y += 64)
        expect(dungeonBlocked("mall-parking", x, y)).toBe(false);
  });
  it("leaves broad approaches on all four sides of the fountain", () => {
    for (const [x, y] of [
      [1200, 1152],
      [1536, 850],
      [1860, 1152],
      [1536, 1470],
    ])
      expect(dungeonBlocked("abandoned-central-square", x, y)).toBe(false);
  });
  it("moves a saved actor out of a new obstacle without resetting health, XP or equipment", () => {
    const r = new DungeonRun(
      "layout-save",
      "abandoned-central-square",
      createDungeonProgress(),
    );
    r.state.player.x = 1536;
    r.state.player.y = 1152;
    r.state.player.hp = 80;
    r.state.xp = 6;
    r.state.weapons = ["sword", "bow"];
    r.state.levels["advanced-attack"] = 2;
    const old = r.snapshot();
    expect(dungeonBlocked(old.dungeon, old.player.x, old.player.y)).toBe(true);
    r.restore(old);
    expect(
      dungeonBlocked(r.state.dungeon, r.state.player.x, r.state.player.y),
    ).toBe(false);
    expect(r.state.player.hp).toBe(80);
    expect(r.state.xp).toBe(6);
    expect(r.state.weapons).toEqual(old.weapons);
    expect(r.state.levels).toEqual(old.levels);
    expect(validDungeonSnapshot(r.snapshot())).toBe(true);
  });
  it("keeps already safe saved positions unchanged", () => {
    const p = safeDungeonPoint(
      "mall-parking",
      DUNGEON_ENTRY.x,
      DUNGEON_ENTRY.y,
    );
    expect(p).toEqual(DUNGEON_ENTRY);
  });
  it("resolves enemy collisions from an old layout while preserving their remaining health", () => {
    const r = new DungeonRun(
      "enemy-layout",
      "mall-parking",
      createDungeonProgress(),
    );
    const car = MAP_OBSTACLES["mall-parking"].find((p) => p.kind === "sedan")!;
    r.state.enemies = [
      {
        id: 10,
        x: car.x,
        y: car.y,
        hp: 15,
        maxHp: 50,
        speed: 30,
        damage: 10,
        special: false,
        kind: "walker",
        streak: 0,
        lastHit: 0,
      },
    ];
    r.restore(r.snapshot());
    const e = r.state.enemies[0];
    expect(dungeonBlocked("mall-parking", e.x, e.y)).toBe(false);
    expect(e.hp).toBe(15);
    expect(e.maxHp).toBe(50);
  });
});
