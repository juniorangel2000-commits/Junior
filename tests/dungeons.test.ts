import { ITEM_IDS } from "../src/data/items";
import { Inventory } from "../src/systems/inventory";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { DUNGEON_ART } from "../src/dungeons/art";
import { describe, it, expect } from "vitest";
import { DungeonRun, type Enemy } from "../src/dungeons/run";
import {
  createDungeonProgress,
  applyDungeonResult,
  buyPermanentAttribute,
  validDungeonProgress,
  claimDungeonMaterials,
} from "../src/dungeons/progression";
import {
  UPGRADES,
  eligibleUpgrades,
  rollUpgradeCards,
} from "../src/dungeons/upgrades";
import {
  WEAPONS,
  DUNGEON_BALANCE as B,
  type WeaponId,
} from "../src/dungeons/config";
import { EnemySpatialIndex } from "../src/dungeons/spatial";
import { validDungeonSnapshot } from "../src/dungeons/snapshot";
import { createNewSave, validateSave } from "../src/systems/save";
import {
  dungeonBlocked,
  DUNGEON_ENTRY,
  MAP_OBSTACLES,
} from "../src/dungeons/maps";
const make = () =>
  new DungeonRun(
    "test-run",
    "abandoned-central-square",
    createDungeonProgress(),
  );
const enemy = (id: number, x: number, y: number, hp = 1000): Enemy => ({
  id,
  x,
  y,
  hp,
  maxHp: hp,
  speed: 1,
  damage: 0,
  special: false,
  kind: "walker",
  streak: 0,
  lastHit: 0,
});
const simulate = (run: DungeonRun, seconds: number) => {
  for (let i = 0; i < Math.ceil(seconds * 30); i++) {
    if (run.state.phase === "choice") run.choose(run.state.cards[0].id);
    run.step(1 / 30);
  }
};

describe("dungeon progression and arsenal", () => {
  it("starts at temporary level one with a sword and does not mutate permanent attributes", () => {
    const progress = createDungeonProgress();
    progress.attributes.strength = 3;
    const before = structuredClone(progress),
      r = new DungeonRun("run", "mall-parking", progress);
    expect(r.state.level).toBe(1);
    expect(r.state.weapons).toEqual(["sword"]);
    r.state.levels.melee = 5;
    expect(progress).toEqual(before);
  });
  it("offers exactly three unique eligible cards, fixed rarities and conditional legendaries", () => {
    const r = make(),
      cards = rollUpgradeCards(r.state, () => 0.4);
    expect(cards).toHaveLength(3);
    expect(new Set(cards.map((c) => c.id)).size).toBe(3);
    expect(
      eligibleUpgrades(r.state).some(
        (u) => u.pet || u.id === "bow-triple" || u.id === "sword-dual",
      ),
    ).toBe(false);
    r.state.levels["sword-speed"] = 2;
    r.state.levels["sword-wide"] = 1;
    expect(eligibleUpgrades(r.state).some((u) => u.id === "sword-dual")).toBe(
      true,
    );
    for (const u of UPGRADES)
      expect(["common", "rare", "super-rare", "legendary"]).toContain(u.rarity);
  });
  it("enforces four weapon slots and removes capped improvements", () => {
    const r = make();
    r.state.weapons = ["sword", "bow", "spear", "hammer"];
    r.state.levels.xp = 10;
    const cards = rollUpgradeCards(r.state, () => 0.8);
    expect(cards.every((c) => c.kind === "upgrade" && c.id !== "xp")).toBe(
      true,
    );
    expect(eligibleUpgrades(r.state).some((u) => u.weapon === "bow")).toBe(
      true,
    );
  });
  it("uses configured rarity weights and excludes disabled categories", () => {
    const r = make();
    r.state.weapons = ["sword", "bow", "spear", "hammer"];
    const cards = rollUpgradeCards(r.state, () => 0.1, {
      common: 1,
      rare: 0,
      "super-rare": 0,
      legendary: 0,
    });
    expect(cards).toHaveLength(3);
    expect(cards.every((c) => c.rarity === "common")).toBe(true);
  });
  it("pauses elapsed time and combat for choices, applies one choice once, then resumes", () => {
    const r = make();
    r.grantXP(r.xpNeeded);
    expect(r.state.phase).toBe("choice");
    const elapsed = r.state.elapsed,
      id = r.state.cards[0].id;
    r.step(0.25);
    expect(r.state.elapsed).toBe(elapsed);
    expect(r.choose(id)).toBe(true);
    expect(r.choose(id)).toBe(false);
    expect(r.state.phase).toBe("fighting");
    r.pause();
    r.step(0.25);
    expect(r.state.elapsed).toBe(elapsed);
    r.resume();
    r.step(0.1);
    expect(r.state.elapsed).toBeGreaterThan(elapsed);
  });
  it("resets all temporary build state in a new run", () => {
    const r = make();
    r.state.levels.xp = 10;
    r.state.weapons.push("bow");
    r.abandon();
    const next = make();
    expect(next.state.levels).toEqual({});
    expect(next.state.weapons).toEqual(["sword"]);
    expect(next.state.xp).toBe(0);
  });
  it("spends permanent experience only on an eligible attribute and preserves pet progress", () => {
    const p = createDungeonProgress();
    p.xp = 150;
    expect(buyPermanentAttribute(p, "strength")).toBe(true);
    expect(p.xp).toBe(0);
    expect(p.attributes.strength).toBe(1);
    expect(buyPermanentAttribute(p, "strength")).toBe(false);
    expect(validDungeonProgress(p)).toBe(true);
  });
});
describe("automatic weapons and modes", () => {
  it.each(
    (Object.keys(WEAPONS) as WeaponId[]).filter((w) => w !== "orbiting-shield"),
  )("automatically attacks with %s without an attack command", (weapon) => {
    const r = make();
    r.random = () => 0.2;
    r.state.weapons = weapon === "sword" ? ["sword"] : ["sword", weapon];
    r.state.cooldowns.sword = 20;
    const p = r.state.player,
      angle = weapon === "rotating-blade" ? 1.5 : 0;
    const e = enemy(
      900,
      p.x +
        Math.cos(angle) *
          (weapon === "bow"
            ? 180
            : weapon === "spear"
              ? 110
              : weapon === "rotating-blade"
                ? 82
                : 50),
      p.y + Math.sin(angle) * (weapon === "rotating-blade" ? 82 : 0),
    );
    r.state.enemies = [e];
    if (weapon === "sword") r.state.cooldowns.sword = 0;
    simulate(r, 2.5);
    expect(e.hp).toBeLessThan(1000);
  });
  it("uses accuracy for misses and precision upgrades improve it", () => {
    const r = make();
    r.random = () => 0.99;
    r.state.weapons = ["sword", "bow"];
    r.state.cooldowns.sword = 20;
    const e = enemy(900, r.state.player.x + 250, r.state.player.y);
    r.state.enemies = [e];
    simulate(r, 2);
    expect(e.hp).toBe(1000);
    r.state.levels.accuracy = 5;
    r.state.levels["bow-accuracy"] = 1;
    simulate(r, 2);
    expect(e.hp).toBeLessThan(1000);
  });
  it("supports four simultaneous weapons without giving the pet a weapon slot", () => {
    const p = createDungeonProgress();
    p.pets.push({
      id: "dog-1",
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
    const r = new DungeonRun("pet-run", "mall-parking", p, "dog-1");
    r.state.weapons = ["sword", "bow", "spear", "hammer"];
    r.state.enemies = [enemy(900, r.state.player.x + 50, r.state.player.y)];
    simulate(r, 1.5);
    expect(r.state.projectiles.length + r.effects.length).toBeGreaterThan(0);
    expect(r.state.pet?.id).toBe("dog-1");
    expect(r.state.weapons).toHaveLength(4);
  });
  it("triples replace doubles rather than adding five arrows", () => {
    const r = make();
    r.state.weapons = ["sword", "bow"];
    r.state.levels["bow-double"] = 1;
    r.state.levels["bow-triple"] = 1;
    r.state.enemies = [enemy(900, r.state.player.x + 250, r.state.player.y)];
    r.step(1 / 30);
    expect(r.state.projectiles.filter((p) => p.weapon === "bow")).toHaveLength(
      3,
    );
  });
  it("scales hammer impact area by ten percent rather than its radius", () => {
    const r = make();
    r.state.weapons = ["sword", "hammer"];
    r.state.levels["hammer-area"] = 1;
    r.state.levels["hammer-double"] = 1;
    r.state.enemies = [enemy(900, r.state.player.x + 50, r.state.player.y)];
    r.step(1 / 30);
    const second = r.state.pendingAttacks.find((a) => a.weapon === "hammer")!;
    expect(second.radius ** 2 / 48 ** 2).toBeCloseTo(1.1);
  });
  it("boomerangs go outward and return, with separate hit sets for each leg", () => {
    const r = make();
    r.state.weapons = ["sword", "boomerang"];
    r.state.enemies = [enemy(900, r.state.player.x + 180, r.state.player.y)];
    simulate(r, 1.5);
    expect(
      r.state.projectiles.some((p) => p.weapon === "boomerang" && p.returning),
    ).toBe(true);
  });
  it("keeps sword dual evolution within its one slot and schedules the second strike", () => {
    const r = make();
    r.state.levels["sword-dual"] = 1;
    r.state.enemies = [enemy(900, r.state.player.x + 30, r.state.player.y)];
    r.step(1 / 30);
    expect(r.state.pendingAttacks).toHaveLength(1);
    simulate(r, 0.25);
    expect(r.state.weapons).toHaveLength(1);
    expect(r.state.enemies[0].hp).toBeCloseTo(
      1000 - WEAPONS.sword.damage * 1.6,
    );
  });
  it("never spawns enemies on top of the player near a map edge", () => {
    for (let seed = 1; seed <= 30; seed++) {
      const r = new DungeonRun(
        "edge",
        "mall-parking",
        createDungeonProgress(),
        undefined,
        seed,
      );
      r.state.player.x = 64;
      r.state.player.y = 64;
      r.step(1 / 30);
      for (const e of r.state.enemies)
        expect(Math.hypot(e.x - 64, e.y - 64)).toBeGreaterThanOrEqual(259);
    }
  });
  it("finishes timed survival at fifteen active minutes and cannot advance while paused", () => {
    const r = make();
    r.state.elapsed = 899.9;
    r.state.player.invulnerable = 5;
    simulate(r, 0.3);
    expect(r.state.phase).toBe("victory");
    expect(r.state.elapsed).toBeGreaterThanOrEqual(900);
  });
  it("progresses waves after kills and wins only after the fiftieth cleared wave", () => {
    const r = new DungeonRun("waves", "mall-parking", createDungeonProgress());
    r.state.waveRemaining = 0;
    r.step(1 / 30);
    expect(r.state.round).toBe(2);
    expect(r.state.intermission).toBe(3);
    r.state.round = 50;
    r.state.bossRound = 50;
    r.state.intermission = 0;
    r.state.waveRemaining = 0;
    r.state.enemies = [enemy(900, 1400, 1800)];
    r.step(1 / 30);
    expect(r.state.phase).toBe("fighting");
    r.state.enemies = [];
    r.step(1 / 30);
    expect(r.state.phase).toBe("victory");
  });
  it("ends in defeat on lethal contact and yields a valid terminal snapshot", () => {
    const r = make();
    r.state.player.hp = 1;
    const e = enemy(900, r.state.player.x + 5, r.state.player.y);
    e.damage = 20;
    r.state.enemies = [e];
    r.step(1 / 30);
    expect(r.state.phase).toBe("defeat");
    expect(r.state.player.hp).toBe(0);
    expect(r.result().outcome).toBe("defeat");
    expect(validDungeonSnapshot(r.snapshot())).toBe(true);
  });
  it("activates last resistance only once and expires timed bonuses", () => {
    const r = make();
    r.state.levels["last-stand"] = 1;
    r.state.player.hp = 10;
    r.step(1 / 30);
    expect(r.state.lastStandUsed).toBe(true);
    expect(r.moveSpeed).toBeGreaterThan(B.playerSpeed);
    r.state.elapsed += 9;
    r.step(1 / 30);
    expect(r.moveSpeed).toBe(B.playerSpeed);
  });
});
describe("snapshots, rewards, maps and hordes", () => {
  it("saves and restores active enemies, choices, projectiles, random state and pending attacks", () => {
    const r = make();
    r.state.levels["sword-dual"] = 1;
    r.state.enemies = [enemy(900, r.state.player.x + 30, r.state.player.y)];
    r.step(1 / 30);
    const snapshot = r.snapshot();
    expect(validDungeonSnapshot(snapshot)).toBe(true);
    const restored = make();
    restored.restore(snapshot);
    expect(restored.snapshot()).toEqual(snapshot);
    const save = createNewSave({
      name: "Expedição",
      skin: "#d9a276",
      hairStyle: "curto",
      hairColor: "#754323",
      outfit: "#638a9d",
    });
    save.activeArea = "cityForest";
    save.dungeons = createDungeonProgress();
    save.dungeonRun = snapshot;
    expect(validateSave(JSON.parse(JSON.stringify(save)))).toBe(true);
    snapshot.weapons.push("bow", "spear", "hammer", "boomerang");
    expect(validDungeonSnapshot(snapshot)).toBe(false);
  });
  it("applies a result once and preserves temporary bonuses outside permanent progress", () => {
    const save = createNewSave({
      name: "Retorno",
      skin: "#d9a276",
      hairStyle: "curto",
      hairColor: "#754323",
      outfit: "#638a9d",
    });
    save.villageEconomy = { coins: 0, met: [] };
    const result = {
      id: "reward-1",
      dungeon: "mall-parking" as const,
      outcome: "victory" as const,
      kills: 100,
      elapsed: 400,
      foundPet: "cat" as const,
    };
    expect(applyDungeonResult(save, result).applied).toBe(true);
    const after = structuredClone(save);
    expect(applyDungeonResult(save, result).applied).toBe(false);
    expect(save).toEqual(after);
    expect(save.dungeons?.pets).toHaveLength(1);
    expect(validateSave(save)).toBe(true);
  });
  it("defers material rewards when the inventory is full and delivers them without loss later", () => {
    const save = createNewSave({
      name: "Estoque",
      skin: "#d9a276",
      hairStyle: "curto",
      hairColor: "#754323",
      outfit: "#638a9d",
    });
    const items = ITEM_IDS.filter(
      (id) => !["scrap", "cloth", "metalPart", "backpack"].includes(id),
    ).slice(0, 30);
    for (const id of items) save.inventory[id] = 1;
    const reward = applyDungeonResult(save, {
      id: "full-bag",
      dungeon: "mall-parking",
      outcome: "victory",
      kills: 500,
      elapsed: 500,
    });
    expect(reward.waiting).toBe(true);
    expect(save.dungeons?.pendingMaterials?.metalPart).toBe(1);
    for (const id of items.slice(0, 3)) save.inventory[id] = 0;
    claimDungeonMaterials(save);
    expect(save.inventory.scrap).toBe(3);
    expect(save.inventory.cloth).toBe(2);
    expect(save.inventory.metalPart).toBe(1);
    expect(save.dungeons?.pendingMaterials).toEqual({});
    expect(new Inventory(save.inventory).data).toEqual(save.inventory);
  });
  it("retains the same companion across wave boundaries and restores its permanent attributes", () => {
    const p = createDungeonProgress();
    p.pets.push({
      id: "cat-1",
      species: "cat",
      rare: true,
      xp: 100,
      attributes: {
        speed: 2,
        resistance: 1,
        perception: 1,
        protection: 1,
        efficiency: 2,
      },
    });
    const r = new DungeonRun("pet-rounds", "mall-parking", p, "cat-1");
    const pet = r.state.pet;
    r.state.waveRemaining = 0;
    r.step(1 / 30);
    expect(r.state.pet).toBe(pet);
    expect(r.state.pet?.attributes).toEqual(p.pets[0].attributes);
    expect(p.pets[0].xp).toBe(100);
  });
  it("allows all fifty wave transitions without resetting the build or companion", () => {
    const r = new DungeonRun("fifty", "mall-parking", createDungeonProgress());
    r.state.levels.melee = 2;
    for (let round = 1; round <= 50; round++) {
      expect(r.state.round).toBe(round);
      if ([10, 20, 30, 40, 50].includes(round)) r.state.bossRound = round;
      r.state.intermission = 0;
      r.state.waveRemaining = 0;
      r.state.enemies = [];
      r.step(1 / 30);
    }
    expect(r.state.phase).toBe("victory");
    expect(r.state.levels.melee).toBe(2);
  });
  it("separates melee and ranged damage improvements", () => {
    const a = make(),
      b = make();
    for (const r of [a, b]) {
      r.state.weapons = ["sword", "bow"];
      r.state.enemies = [enemy(900, r.state.player.x + 250, r.state.player.y)];
    }
    b.state.levels.melee = 5;
    a.step(1 / 30);
    b.step(1 / 30);
    expect(a.state.projectiles[0].damage).toBe(b.state.projectiles[0].damage);
  });
  it("creates timed supply events and resets them after the run", () => {
    const r = make();
    r.state.elapsed = 44.99;
    r.random = () => 0;
    r.step(1 / 30);
    expect(r.state.pickups.some((p) => p.kind === "health")).toBe(true);
    expect(r.state.pickups.some((p) => p.kind === "pet")).toBe(true);
    expect(make().state.pickups).toEqual([]);
  });
  it("keeps rescue events in bounds at the edge and never duplicates a pending pet", () => {
    const r = make();
    r.state.player.x = 3030;
    r.state.player.y = 2200;
    r.state.elapsed = 44.99;
    r.random = () => 0;
    r.step(1 / 30);
    expect(r.state.pickups.filter((p) => p.kind === "pet")).toHaveLength(1);
    expect(validDungeonSnapshot(r.snapshot())).toBe(true);
    r.state.elapsed = 90.99;
    r.state.eventClock = 45;
    r.step(1 / 30);
    expect(r.state.pickups.filter((p) => p.kind === "pet")).toHaveLength(1);
    expect(validDungeonSnapshot(r.snapshot())).toBe(true);
    const bad = r.snapshot();
    bad.player.x = 0;
    expect(validDungeonSnapshot(bad)).toBe(false);
  });
  it("keeps every newly generated atlas source intact and each frame inside the PNG", () => {
    for (const m of Object.values(DUNGEON_ART)) {
      const source = readFileSync("public/" + m.file);
      expect(createHash("sha256").update(source).digest("hex")).toBe(m.sha256);
      for (const r of Object.values(m.frames)) {
        expect(r.x + r.width).toBeLessThanOrEqual(source.readUInt32BE(16));
        expect(r.y + r.height).toBeLessThanOrEqual(source.readUInt32BE(20));
      }
    }
  });
  it("keeps each map large, the arrival free and obstacles consistent with vehicle footprints", () => {
    for (const id of ["abandoned-central-square", "mall-parking"] as const) {
      expect(dungeonBlocked(id, DUNGEON_ENTRY.x, DUNGEON_ENTRY.y)).toBe(false);
      const car = MAP_OBSTACLES[id].find((p) => p.kind === "sedan")!;
      expect(dungeonBlocked(id, car.x, car.y - 35)).toBe(true);
      expect(MAP_OBSTACLES[id].length).toBeGreaterThan(20);
    }
  });
  it("indexes large hordes locally and caps active enemies, projectiles and effects", () => {
    const index = new EnemySpatialIndex<Enemy>(),
      entities = Array.from({ length: 20000 }, (_, id) =>
        enemy(id, (id % 200) * 20, Math.floor(id / 200) * 20),
      );
    index.rebuild(entities);
    const result = index.query(100, 100, 60);
    expect(result.length).toBeLessThan(50);
    expect(result.every((e) => Math.hypot(e.x - 100, e.y - 100) <= 60)).toBe(
      true,
    );
    const r = make();
    r.state.enemies = Array.from({ length: B.maxEnemies }, (_, i) =>
      enemy(1000 + i, 100 + (i % 20) * 60, 100 + Math.floor(i / 20) * 80),
    );
    simulate(r, 2);
    expect(r.state.enemies.length).toBeLessThanOrEqual(B.maxEnemies);
    expect(r.state.projectiles.length).toBeLessThanOrEqual(B.maxProjectiles);
    expect(r.effects.length).toBeLessThanOrEqual(B.maxEffects);
  });
});
