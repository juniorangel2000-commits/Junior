import { describe, expect, it } from "vitest";
import { DungeonRun, type Enemy } from "../src/dungeons/run";
import { DUNGEON_BALANCE as B, type PetSpecies } from "../src/dungeons/config";
import { createDungeonProgress } from "../src/dungeons/progression";
import { petPlayerBonuses } from "../src/dungeons/pet-passives";
import { validDungeonSnapshot } from "../src/dungeons/snapshot";
import { permanentEvolutionHTML } from "../src/dungeons/permanent-ui";
import { petMenuHTML } from "../src/dungeons/pet-menu";
import { dungeonHUD } from "../src/dungeons/hud";

function make(species?: PetSpecies, rare = false) {
  const progress = createDungeonProgress();
  if (species)
    progress.pets.push({
      id: "companion",
      species,
      rare,
      xp: 0,
      attributes: {
        speed: 0,
        resistance: 0,
        perception: 0,
        protection: 0,
        efficiency: 0,
      },
    });
  progress.selectedPet = species ? "companion" : undefined;
  const run = new DungeonRun(
    "passives",
    "abandoned-central-square",
    progress,
    progress.selectedPet,
  );
  run.state.spawnClock = 20;
  run.state.eventClock = 1000;
  run.state.cooldowns.sword = 30;
  if (run.state.pet) {
    run.state.pet.attack = 20;
    run.state.pet.special = 20;
  }
  return { run, progress };
}
const cases = [
  [undefined, false, 0, 0, 0],
  ["dog", false, 0.1, 0, 0.08],
  ["dog", true, 0.2, 0, 0.16],
  ["cat", false, 0, 0.05, 0],
  ["cat", true, 0, 0.1, 0],
] as const;

describe("equipped companion species bonuses", () => {
  it.each([[0.009, true], [0.01, false], [0.049, false]] as const)(
    "uses a 1% special-variant chance per rescued pet (roll %s)",
    (roll, rare) => {
      const { run } = make();
      run.random = () => roll;
      run.state.pickups = [{ id: 100, kind: "pet", species: "dog", amount: 1,
        x: run.state.player.x, y: run.state.player.y }];
      run.step(1 / 30);
      expect(run.state.foundPet).toBe("dog");
      expect(run.state.foundPetRare).toBe(rare);
    },
  );
  it.each(cases)(
    "initial health, movement and contact protection: %s shiny=%s",
    (species, rare, health, movement, protection) => {
      const { run: r } = make(species, rare);
      expect(r.maxHealth).toBeCloseTo(B.playerHealth * (1 + health));
      expect(r.state.player.hp).toBe(r.maxHealth);
      expect(r.moveSpeed).toBeCloseTo(B.playerSpeed * (1 + movement));
      const p = r.state.player;
      r.state.enemies = [
        {
          id: 100,
          x: p.x,
          y: p.y,
          hp: 1000,
          maxHp: 1000,
          speed: 1,
          damage: 20,
          kind: "walker",
          special: false,
          streak: 0,
          lastHit: 0,
        } satisfies Enemy,
      ];
      r.step(1 / 30);
      expect(p.hp).toBeCloseTo(r.maxHealth - 20 * (1 - protection));
      if (r.state.pet) {
        r.state.pet.hp = 0;
        p.invulnerable = 0;
        r.step(1 / 30);
        expect(p.hp).toBeCloseTo(r.maxHealth - 40 * (1 - protection));
        expect(r.maxHealth).toBeCloseTo(B.playerHealth * (1 + health));
      }
    },
  );

  it.each([
    [false, 82],
    [true, 96],
  ] as const)(
    "attracts experience at the cat's actual collection radius (shiny=%s)",
    (rare, distance) => {
      const { run: r } = make("cat", rare),
        p = r.state.player;
      r.state.pickups = [
        { id: 100, kind: "xp", amount: 1, x: p.x + distance, y: p.y },
      ];
      r.step(1 / 30);
      expect(r.state.pickups[0].x).toBeLessThan(p.x + distance);
      const { run: dog } = make("dog", rare);
      dog.state.pickups = [
        {
          id: 100,
          kind: "xp",
          amount: 1,
          x: dog.state.player.x + distance,
          y: dog.state.player.y,
        },
      ];
      dog.step(1 / 30);
      expect(dog.state.pickups[0].x).toBe(dog.state.player.x + distance);
    },
  );

  it("adds the shiny cat XP bonus once without doubling XP cards", () => {
    const { run: r } = make("cat", true);
    r.state.levels["advanced-xp"] = 2;
    r.state.pet!.hp = 0;
    r.grantXP(5);
    expect(r.state.xp).toBeCloseTo(5 * (1 + 0.3 + 0.1));
    const { run: common } = make("cat");
    common.grantXP(5);
    expect(common.state.xp).toBe(5);
  });

  it("boosts shiny dog healing from floor items, regeneration and health cards, with a health cap", () => {
    const { run: r } = make("dog", true),
      p = r.state.player;
    p.hp = 20;
    r.state.pet!.hp = 0;
    r.state.pickups = [{ id: 100, kind: "health", amount: 10, x: p.x, y: p.y }];
    r.step(1 / 30);
    expect(p.hp).toBeCloseTo(31.5);
    r.state.levels.regeneration = 1;
    r.step(1 / 30);
    expect(p.hp).toBeCloseTo(31.5 + (B.regenerationPerLevel / 30) * 1.15);
    r.state.phase = "choice";
    r.state.cards = [
      {
        id: "health",
        name: "Vida",
        effect: "",
        level: 1,
        max: 5,
        rarity: "common",
        kind: "upgrade",
      },
    ];
    const before = p.hp;
    expect(r.choose("health")).toBe(true);
    expect(p.hp - before).toBeCloseTo(B.playerHealth * 0.05 * 1.15);
    p.hp = r.maxHealth - 1;
    r.state.pickups = [
      { id: 101, kind: "health", amount: 100, x: p.x, y: p.y },
    ];
    r.step(1 / 30);
    expect(p.hp).toBe(r.maxHealth);
  });

  it("does not double permanent ranks, pet health, evasion or cards", () => {
    const { run: r } = make("dog", true);
    r.state.permanent.vitality = 2;
    r.state.levels.health = 1;
    expect(r.maxHealth).toBeCloseTo(B.playerHealth * (1 + 0.08 + 0.05 + 0.2));
    expect(r.state.pet!.maxHp).toBe(make("dog").run.state.pet!.maxHp);
    const restored = make().run;
    const snapshot = r.snapshot();
    expect(validDungeonSnapshot(snapshot)).toBe(true);
    restored.restore(snapshot);
    expect(restored.maxHealth).toBe(r.maxHealth);
    expect(petPlayerBonuses(restored.state.pet)).toEqual(
      petPlayerBonuses(r.state.pet),
    );
  });

  it("describes shiny bonuses and dungeon scope consistently in companion, evolution and combat menus", () => {
    const { run, progress } = make("cat", true);
    const menu = petMenuHTML({
      pets: progress.pets,
      selected: "companion",
      nearby: true,
      icons: {},
    });
    const evolution = permanentEvolutionHTML(progress, "companion");
    const hud = dungeonHUD(run, {
      sword: "",
      bow: "",
      spear: "",
      hammer: "",
      boomerang: "",
      "rotating-blade": "",
      "orbiting-shield": "",
    });
    for (const html of [menu, evolution, hud]) {
      expect(html).toContain("✦");
      expect(html).toContain("+40% de alcance");
      expect(html).toContain("+10% de experiência recebida");
    }
    expect(menu).toContain("Nas dungeons");
  });
});
