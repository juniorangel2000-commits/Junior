import { describe, it, expect } from "vitest";
import { DungeonRun } from "../src/dungeons/run";
import { createDungeonProgress } from "../src/dungeons/progression";
import { UPGRADES, rollUpgradeCards } from "../src/dungeons/upgrades";
import { DUNGEON_BALANCE as B } from "../src/dungeons/config";
import { validDungeonSnapshot } from "../src/dungeons/snapshot";
const make = () =>
  new DungeonRun(
    "completion",
    "abandoned-central-square",
    createDungeonProgress(),
  );
describe("complete builds and scheduled weapon choices", () => {
  it.each([10, 30, 50, 70, 90])(
    "offers three distinct unowned weapons at level %s",
    (level) => {
      const r = make();
      r.state.level = level;
      const cards = rollUpgradeCards(r.state, () => 0.999);
      expect(cards).toHaveLength(3);
      expect(new Set(cards.map((c) => c.id)).size).toBe(3);
      expect(
        cards.every(
          (c) => c.kind === "arsenal" && !r.state.weapons.includes(c.id),
        ),
      ).toBe(true);
    },
  );
  it.each([2, 4, 6, 9, 11, 29, 31, 49, 51])(
    "offers only improvements between weapon milestones, level %s",
    (level) => {
      const r = make();
      r.state.level = level;
      expect(
        rollUpgradeCards(r.state, () => 0.8).every((c) => c.kind === "upgrade"),
      ).toBe(true);
    },
  );
  it("continues offering improvements at milestone levels when all four slots are occupied", () => {
    const r = make();
    r.state.level = 50;
    r.state.weapons = ["sword", "bow", "hammer", "spear"];
    expect(
      rollUpgradeCards(r.state, () => 0.8).every((c) => c.kind === "upgrade"),
    ).toBe(true);
  });
  it("limits later level costs consistently in both modes", () => {
    const r = make();
    r.state.level = 100;
    expect(r.xpNeeded).toBe(B.xpLevelCostCap);
    const waves = new DungeonRun(
      "waves",
      "mall-parking",
      createDungeonProgress(),
    );
    waves.state.level = 100;
    expect(waves.xpNeeded).toBe(r.xpNeeded);
  });
  it("counts all compatible ranks and stops useless level-ups after completion", () => {
    const r = make();
    r.state.weapons = ["sword", "bow", "hammer", "spear"];
    for (const u of UPGRADES)
      if ((!u.weapon || r.state.weapons.includes(u.weapon)) && !u.pet)
        r.state.levels[u.id] = u.max;
    expect(r.buildComplete).toBe(true);
    r.state.player.hp = 50;
    const before = r.snapshot();
    r.grantXP(99999);
    expect(r.snapshot()).toEqual(before);
    expect(validDungeonSnapshot(r.snapshot())).toBe(true);
    r.state.levels["sword-range"]--;
    expect(r.buildComplete).toBe(false);
  });
  it("does not call a pet build complete while its compatible skills remain unfinished", () => {
    const p = createDungeonProgress();
    p.pets.push({
      id: "dog",
      species: "dog",
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
    const r = new DungeonRun("dog-run", "abandoned-central-square", p, "dog");
    r.state.weapons = ["sword", "bow", "spear", "hammer"];
    for (const u of UPGRADES)
      if (!u.pet && (!u.weapon || r.state.weapons.includes(u.weapon)))
        r.state.levels[u.id] = u.max;
    expect(r.buildComplete).toBe(false);
    for (const u of UPGRADES) if (u.pet) r.state.levels[u.id] = u.max;
    expect(r.buildComplete).toBe(true);
  });
  it("honors the advertised fifteen percent Arsenal Especializado bonus", () => {
    const r = make();
    r.state.levels["sword-dual"] = 1;
    const before = r.weaponStats("sword").damage;
    r.state.levels["specialized-arsenal"] = 1;
    expect(r.weaponStats("sword").damage / before).toBeCloseTo(1.15);
  });
  it("does not overflow the drop limit with special-enemy healing drops in long full builds", () => {
    const r = make();
    r.state.weapons = ["sword", "bow", "spear", "hammer"];
    for (const u of UPGRADES)
      if (!u.pet && (!u.weapon || r.state.weapons.includes(u.weapon)))
        r.state.levels[u.id] = u.max;
    r.random = () => 0;
    r.state.spawnClock = 10;
    r.state.pickups = Array.from({ length: 1000 }, (_, i) => ({
      id: 1000 + i,
      x: 500,
      y: 500,
      kind: "xp" as const,
      amount: 4,
    }));
    r.state.enemies = Array.from({ length: 3 }, (_, i) => ({
      id: 3000 + i,
      x: r.state.player.x + 30 + i,
      y: r.state.player.y,
      hp: 1,
      maxHp: 1,
      speed: 1,
      damage: 0,
      special: true,
      kind: "brute" as const,
      streak: 0,
      lastHit: 0,
    }));
    r.step(1 / 30);
    expect(r.state.pickups.length).toBeLessThanOrEqual(1000);
    expect(r.state.kills).toBe(3);
    expect(validDungeonSnapshot(r.snapshot())).toBe(true);
  });
});
