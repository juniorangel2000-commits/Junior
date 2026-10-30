import { expect, it } from "vitest";
import { DungeonRun, type Enemy } from "../src/dungeons/run";
import { createDungeonProgress } from "../src/dungeons/progression";
import { WEAPONS, DUNGEON_BALANCE as B } from "../src/dungeons/config";
import { permanentEvolutionHTML } from "../src/dungeons/permanent-ui";

function make(rank = 0) {
  const progress = createDungeonProgress();
  for (const key of Object.keys(
    progress.attributes,
  ) as (keyof typeof progress.attributes)[])
    progress.attributes[key] = rank;
  progress.pets.push({
    id: "pet",
    species: "dog",
    rare: false,
    xp: 0,
    attributes: {
      speed: 0,
      resistance: rank,
      perception: 0,
      protection: 0,
      efficiency: 0,
    },
  });
  const run = new DungeonRun(
    "permanent",
    "abandoned-central-square",
    progress,
    "pet",
  );
  run.state.spawnClock = 20;
  run.state.eventClock = 1000;
  return { run, progress };
}
it("strength improves melee and ranged weapons, with additive card bonuses", () => {
  const { run } = make(5);
  expect(run.weaponStats("sword").damage).toBeCloseTo(
    WEAPONS.sword.damage * 1.15,
  );
  expect(run.weaponStats("bow").damage).toBeCloseTo(WEAPONS.bow.damage * 1.15);
  run.state.levels.melee = 1;
  expect(run.weaponStats("sword").damage).toBeGreaterThan(
    WEAPONS.sword.damage * 1.15,
  );
  expect(run.weaponStats("bow").damage).toBeCloseTo(WEAPONS.bow.damage * 1.15);
});
it("vitality, agility, survival and pet resistance give their advertised bonuses at entry and after restore", () => {
  const { run: r } = make(5),
    base = make().run;
  expect(r.maxHealth - base.maxHealth).toBeCloseTo(B.playerHealth * 0.2);
  expect(r.state.player.hp).toBe(r.maxHealth);
  expect(r.moveSpeed).toBeCloseTo(B.playerSpeed * 1.1);
  expect(r.state.pet!.maxHp / base.state.pet!.maxHp).toBeCloseTo(1.4);
  r.state.player.hp = 10;
  r.state.cooldowns.sword = 20;
  r.step(1 / 30);
  expect(r.state.player.hp).toBeCloseTo(10 + 0.3 / 30);
  const restored = make().run;
  restored.restore(r.snapshot());
  expect(restored.maxHealth).toBe(r.maxHealth);
  expect(restored.weaponStats("bow")).toEqual(r.weaponStats("bow"));
});
it("precision gives melee critical hits without needing the temporary map pickup", () => {
  const { run: r } = make(10),
    p = r.state.player;
  r.random = () => 0.04;
  const e: Enemy = {
    id: 100,
    x: p.x + 40,
    y: p.y,
    hp: 1000,
    maxHp: 1000,
    speed: 1,
    damage: 0,
    kind: "walker",
    special: false,
    streak: 0,
    lastHit: 0,
  };
  r.state.enemies = [e];
  r.step(1 / 30);
  expect(r.impacts[0].critical).toBe(true);
  expect(1000 - e.hp).toBeCloseTo(
    WEAPONS.sword.damage * 1.3 * B.criticalMultiplier,
  );
  const { run: base } = make();
  base.random = () => 0.04;
  base.state.enemies = [
    { ...e, x: base.state.player.x + 40, y: base.state.player.y, hp: 1000 },
  ];
  base.step(1 / 30);
  expect(base.impacts[0].critical).toBe(false);
});
it("upgrade descriptions state actual effects without changing acquired ranks or XP", () => {
  const { progress } = make(5),
    before = structuredClone(progress);
  const html = permanentEvolutionHTML(progress);
  expect(html).toContain("+15% de dano das armas");
  expect(html).toContain("+2,5% de crítico");
  expect(html).toContain("+0,3 de vida por segundo");
  expect(permanentEvolutionHTML(progress, "pet")).toContain("+40% de vida");
  expect(progress).toEqual(before);
});
