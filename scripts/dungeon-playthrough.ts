import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { deepStrictEqual } from "node:assert";
import { performance } from "node:perf_hooks";
import { DungeonRun } from "../src/dungeons/run";
import { createDungeonProgress } from "../src/dungeons/progression";
import { dungeonBlocked } from "../src/dungeons/maps";
import { UPGRADES, type UpgradeCard } from "../src/dungeons/upgrades";
import { validDungeonSnapshot } from "../src/dungeons/snapshot";
import { DUNGEON_BALANCE } from "../src/dungeons/config";
import { bossPointInAttack } from "../src/dungeons/boss-combat";
import type { DungeonId, WeaponId } from "../src/dungeons/config";

// This is a reproducible bot, not a human playtest or a claim about enjoyment.
const out =
  process.env.DUNGEON_SIM_OUTPUT || "/workspace/after-rain-playthroughs";
mkdirSync(out, { recursive: true });
const builds: Record<string, WeaponId[]> = {
  assault: ["sword", "bow", "spear", "hammer"],
  control: ["sword", "boomerang", "rotating-blade", "orbiting-shield"],
};
function score(card: UpgradeCard, run: DungeonRun, desired: WeaponId[]) {
  if (card.kind === "arsenal") return desired.includes(card.id) ? 150 : 140;
  const u = UPGRADES.find((u) => u.id === card.id)!;
  if (card.id === "regeneration" || card.id === "fast-recovery")
    return run.state.player.hp < 70 ? 120 : 65;
  if (card.id === "advanced-xp") return run.state.elapsed < 720 ? 115 : 40;
  if (card.id === "advanced-attack") return 105;
  if (card.id === "movement") return 95;
  if (card.id === "xp") return run.state.elapsed < 240 ? 100 : 35;
  if (card.id === "pickup") return 80;
  if (u.rarity === "legendary") return 110;
  if (u.weapon) return desired.includes(u.weapon) ? 100 : 85;
  return ["melee", "attack-speed", "health", "defense", "piercing"].includes(
    card.id,
  )
    ? 75
    : 40;
}
function simulate(
  dungeon: DungeonId,
  build: string,
  seed: number,
  pet: boolean | "dog" | "cat" = false,
  rare = false,
) {
  const progress = createDungeonProgress();
  const rankOption = process.argv.find((arg) =>
    arg.startsWith("--permanent-rank="),
  );
  const permanentRank = rankOption ? Number(rankOption.split("=")[1]) : 0;
  if (
    !Number.isInteger(permanentRank) ||
    permanentRank < 0 ||
    permanentRank > 20
  )
    throw Error("Invalid permanent rank");
  for (const key of Object.keys(
    progress.attributes,
  ) as (keyof typeof progress.attributes)[])
    progress.attributes[key] = permanentRank;
  const opening = process.argv
    .find((arg) => arg.startsWith("--opening="))
    ?.split("=")[1];
  if (opening) {
    for (const key of Object.keys(
      progress.attributes,
    ) as (keyof typeof progress.attributes)[])
      progress.attributes[key] = 0;
    if (opening === "attack2") progress.attributes.strength = 2;
    else if (opening === "attack3") {
      progress.attributes.strength = 2;
      progress.attributes.precision = 1;
    } else if (opening === "survival2") {
      progress.attributes.vitality = 1;
      progress.attributes.resistance = 1;
    } else if (opening === "survival3") {
      progress.attributes.vitality = 1;
      progress.attributes.resistance = 1;
      progress.attributes.survival = 1;
    } else throw Error("Invalid opening profile");
  }
  const species = pet === "cat" ? "cat" : "dog";
  const suffix = pet ? `-${species}${rare ? "-rare" : ""}` : "";
  if (pet)
    progress.pets.push({
      id: "sim-pet",
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
  if (pet) {
    const companion = progress.pets[0];
    for (const key of Object.keys(
      companion.attributes,
    ) as (keyof typeof companion.attributes)[])
      companion.attributes[key] = permanentRank;
  }
  const run = new DungeonRun(
    "sim-" + build + "-" + seed + suffix,
    dungeon,
    progress,
    pet ? "sim-pet" : undefined,
    seed,
  );
  let dx = 1,
    dy = 0,
    ticks = 0,
    latestKill = 0,
    latestDamage = 0,
    oldKills = 0,
    peakEnemies = 0,
    peakProjectiles = 0,
    peakPickups = 0,
    blocks = 0,
    lastEffect = 0,
    damageTaken = 0;
  let status = "time-budget",
    lastRound = 1;
  const choices: { at: number; id: string }[] = [],
    samples: unknown[] = [],
    timings: number[] = [];
  const began = performance.now(),
    limit = dungeon === "abandoned-central-square" ? 901 : 3600;
  let lateSnapshot = run.snapshot();
  let completedAt: number | undefined;
  let resumed: DungeonRun | undefined;
  let resumeChecks = 0,
    maxHealing = 0,
    petRecoveries = 0,
    wasRecovering = false;
  const bosses = new Set<number>();
  const dt = 1 / 30;
  while (run.state.elapsed < limit) {
    const s = run.state;
    if (run.buildComplete && completedAt === undefined) completedAt = s.elapsed;
    if (s.phase === "choice") {
      const card = [...s.cards].sort(
        (a, b) => score(b, run, builds[build]) - score(a, run, builds[build]),
      )[0];
      if (!card || !run.choose(card.id))
        throw Error("Bot cannot choose a legal card");
      if (resumed && !resumed.choose(card.id))
        throw Error("Resumed run rejects the same card");
      choices.push({ at: s.elapsed, id: card.id });
      continue;
    }
    if (s.phase !== "fighting") {
      status = s.phase;
      break;
    }
    if (ticks % 6 === 0) {
      const enemies = s.enemies.filter(
        (e) => Math.hypot(e.x - s.player.x, e.y - s.player.y) < 260,
      );
      const nearestEnemy = [...s.enemies].sort(
        (a, b) =>
          Math.hypot(a.x - s.player.x, a.y - s.player.y) -
          Math.hypot(b.x - s.player.x, b.y - s.player.y),
      )[0];
      const loot = s.pickups
        .filter((p) => p.kind === "xp" || p.kind === "health")
        .sort(
          (a, b) =>
            Math.hypot(a.x - s.player.x, a.y - s.player.y) -
            Math.hypot(b.x - s.player.x, b.y - s.player.y),
        )[0];
      let best = -Infinity,
        bx = dx,
        by = dy;
      for (let n = 0; n <= 16; n++) {
        const a = (n * Math.PI) / 8,
          x = n === 16 ? 0 : Math.cos(a),
          y = n === 16 ? 0 : Math.sin(a);
        let clear = true;
        for (let k = 1; k <= 6; k++)
          if (
            dungeonBlocked(
              dungeon,
              s.player.x + x * k * 16,
              s.player.y + y * k * 16,
            )
          ) {
            clear = false;
            break;
          }
        if (!clear) continue;
        const px = s.player.x + x * 80,
          py = s.player.y + y * 80;
        let value = (dx * x + dy * y) * 8;
        // React only to the same visible warnings/active zones shown to the player.
        for (const boss of s.enemies) {
          const a = boss.boss?.action;
          if (!a || a.stage === "recovery") continue;
          if (bossPointInAttack(a, px, py)) value -= 500;
          if (bossPointInAttack(a, s.player.x + x * 40, s.player.y + y * 40))
            value -= 150;
        }
        for (const e of enemies) {
          const distance = Math.hypot(e.x - px, e.y - py);
          const safety =
            process.argv.includes("--cautious") ||
            s.weapons.includes("bow") ||
            s.weapons.includes("boomerang") ||
            s.player.hp < 45
              ? 100
              : 55;
          if (distance < safety) value -= (safety - distance) * 4;
          const midway = Math.hypot(
            e.x - (s.player.x + x * 40),
            e.y - (s.player.y + y * 40),
          );
          if (midway < 30) value -= (30 - midway) * 8;
        }
        if (
          n === 16 &&
          enemies.length <= 6 &&
          enemies.some(
            (e) => Math.hypot(e.x - s.player.x, e.y - s.player.y) < 85,
          )
        )
          value += 12;
        if (loot && Math.hypot(loot.x - s.player.x, loot.y - s.player.y) < 300)
          value -= Math.hypot(loot.x - px, loot.y - py) * 0.22;
        else if (nearestEnemy)
          value -= Math.hypot(nearestEnemy.x - px, nearestEnemy.y - py) * 0.22;
        else value -= Math.hypot(px - 1536, py - 1350) * 0.025;
        if (value > best) {
          best = value;
          bx = x;
          by = y;
        }
      }
      dx = bx;
      dy = by;
    }
    const speed = run.moveSpeed * dt,
      p = s.player;
    if (!dungeonBlocked(dungeon, p.x + dx * speed, p.y)) p.x += dx * speed;
    if (!dungeonBlocked(dungeon, p.x, p.y + dy * speed)) p.y += dy * speed;
    const hp = p.hp;
    if (resumed) {
      resumed.state.player.x = p.x;
      resumed.state.player.y = p.y;
      resumed.step(dt);
    }
    const start = performance.now();
    run.step(dt);
    if (run.impacts.some((hit) => hit.at === s.elapsed))
      latestDamage = s.elapsed;
    const elapsedTick = performance.now() - start;
    maxHealing = Math.max(
      maxHealing,
      s.pickups.filter((p) => p.kind === "health").length,
    );
    for (const e of s.enemies) if (e.kind === "boss") bosses.add(e.id);
    const recovering = !!s.pet && s.pet.hp <= 0;
    if (recovering && !wasRecovering) petRecoveries++;
    wasRecovering = recovering;
    if (resumed && ticks % 300 === 0) {
      deepStrictEqual(resumed.snapshot(), run.snapshot());
      resumeChecks++;
    }
    if (!resumed && s.elapsed >= 450 && s.phase === "fighting") {
      resumed = new DungeonRun("restored", dungeon, progress);
      resumed.restore(run.snapshot());
    }
    if (ticks % 30 === 0) timings.push(elapsedTick);
    damageTaken += Math.max(0, hp - p.hp);
    for (const effect of run.effects)
      if (effect.id > lastEffect && effect.weapon === "orbiting-shield")
        blocks++;
    lastEffect = Math.max(lastEffect, ...run.effects.map((e) => e.id));
    peakEnemies = Math.max(peakEnemies, s.enemies.length);
    peakProjectiles = Math.max(peakProjectiles, s.projectiles.length);
    peakPickups = Math.max(peakPickups, s.pickups.length);
    if (s.kills !== oldKills) {
      oldKills = s.kills;
      latestKill = s.elapsed;
    }
    if (ticks % 900 === 0 || s.round !== lastRound) {
      samples.push({
        at: Math.round(s.elapsed),
        round: s.round,
        hp: Math.round(p.hp),
        level: s.level,
        kills: s.kills,
        enemies: s.enemies.length,
        groundXP: s.pickups
          .filter((p) => p.kind === "xp")
          .reduce((sum, p) => sum + p.amount, 0),
        weapons: [...s.weapons],
        runners: s.enemies.filter((e) => e.kind === "runner").length,
        brutes: s.enemies.filter((e) => e.kind === "brute").length,
        bossHP: s.enemies.find((e) => e.kind === "boss")?.hp,
        bossSkill: s.enemies.find((e) => e.kind === "boss")?.boss?.action?.kind,
      });
      lastRound = s.round;
    }
    if (ticks % 900 === 0 && s.phase === "fighting")
      lateSnapshot = run.snapshot();
    if (
      dungeon === "mall-parking" &&
      s.waveRemaining === 0 &&
      s.enemies.length &&
      s.elapsed - Math.max(latestKill, latestDamage) > 120
    ) {
      status = "stalled-wave";
      break;
    }
    ticks++;
    if (ticks % 3600 === 0)
      console.log(
        JSON.stringify({
          progress: true,
          dungeon,
          build,
          seed,
          elapsed: Math.round(s.elapsed),
          round: s.round,
          kills: s.kills,
          level: s.level,
          enemies: s.enemies.length,
        }),
      );
  }
  if (
    !validDungeonSnapshot(run.snapshot()) ||
    !validDungeonSnapshot(lateSnapshot)
  ) {
    writeFileSync(
      join(out, "invalid-save.json"),
      JSON.stringify({ current: run.snapshot(), late: lateSnapshot }, null, 2),
    );
    throw Error("Simulation produced an invalid save");
  }
  timings.sort((a, b) => a - b);
  const result = {
    dungeon,
    build,
    seed,
    pet,
    rare,
    permanentRank,
    opening,
    resumeChecks,
    maxHealing,
    petRecoveries,
    bossesEncountered: bosses.size,
    status,
    elapsed: Math.round(run.state.elapsed),
    round: run.state.round,
    kills: run.state.kills,
    level: run.state.level,
    hp: Math.round(run.state.player.hp),
    weapons: run.state.weapons,
    levels: run.state.levels,
    completedAt,
    remainingRanks: UPGRADES.filter(
      (u) =>
        (!u.weapon || run.state.weapons.includes(u.weapon)) &&
        (!u.pet || run.state.pet),
    ).reduce((n, u) => n + Math.max(0, u.max - run.level(u.id)), 0),
    damageTaken: Math.round(damageTaken),
    blocks,
    peakEnemies,
    peakProjectiles,
    peakPickups,
    choices,
    samples,
    wallSeconds: (performance.now() - began) / 1000,
    tickMs: {
      median: timings[Math.floor(timings.length * 0.5)],
      p95: timings[Math.floor(timings.length * 0.95)],
    },
  };
  const name = dungeon + "-" + build + "-" + seed + suffix;
  writeFileSync(join(out, name + ".json"), JSON.stringify(result, null, 2));
  writeFileSync(
    join(out, name + "-late-save.json"),
    JSON.stringify(lateSnapshot),
  );
  console.log(
    JSON.stringify({
      dungeon,
      build,
      seed,
      pet,
      status,
      elapsed: result.elapsed,
      round: result.round,
      kills: result.kills,
      level: result.level,
      weapons: result.weapons,
      peakEnemies,
      blocks,
      wallSeconds: result.wallSeconds,
    }),
  );
  return result;
}
const results = [];
if (!process.argv.includes("--pet-matrix-only")) {
  for (const dungeon of [
    "abandoned-central-square",
    "mall-parking",
  ] as DungeonId[])
    if (
      !process.argv.includes("--timed-only") ||
      dungeon === "abandoned-central-square"
    )
      if (!process.argv.includes("--waves-only") || dungeon === "mall-parking")
        for (const build of Object.keys(builds).filter((build) => {
          const chosen = process.argv
            .find((arg) => arg.startsWith("--build="))
            ?.split("=")[1];
          return !chosen || chosen === build;
        }))
          for (const seed of process.argv.some((arg) =>
            arg.startsWith("--seed="),
          )
            ? [
                Number(
                  process.argv
                    .find((arg) => arg.startsWith("--seed="))!
                    .split("=")[1],
                ),
              ]
            : process.argv.includes("--quick")
              ? [1234567]
              : [1234567, 7654321])
            results.push(simulate(dungeon, build, seed));
  if (!process.argv.includes("--quick"))
    for (const dungeon of [
      "abandoned-central-square",
      "mall-parking",
    ] as DungeonId[])
      if (
        !process.argv.includes("--timed-only") ||
        dungeon === "abandoned-central-square"
      )
        if (
          !process.argv.includes("--waves-only") ||
          dungeon === "mall-parking"
        )
          results.push(simulate(dungeon, "control", 1234567, true));
  if (process.argv.includes("--all-pets"))
    for (const [species, rare] of [
      ["dog", true],
      ["cat", false],
      ["cat", true],
    ] as const)
      results.push(
        simulate("abandoned-central-square", "control", 1234567, species, rare),
      );
} else {
  for (const species of ["dog", "cat"] as const)
    for (const rare of [false, true])
      for (const build of Object.keys(builds))
        results.push(
          simulate("abandoned-central-square", build, 7654321, species, rare),
        );
}
writeFileSync(
  join(out, "summary.json"),
  JSON.stringify(
    {
      experienceCurve: {
        linearStartLevel: DUNGEON_BALANCE.xpLinearStartLevel,
        linearStartCost: DUNGEON_BALANCE.xpLinearStartCost,
      },
      method:
        "Fixed-step deterministic bot, legal random cards, no granted XP or pre-equipped arsenal. CPU timings exclude steering, rendering and GPU.",
      results,
    },
    null,
    2,
  ),
);
