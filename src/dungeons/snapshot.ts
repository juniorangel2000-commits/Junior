import type { DungeonSnapshot } from "./run";
import { UPGRADES } from "./upgrades";
import { DUNGEON_BALANCE as B, WEAPONS } from "./config";
import { CHARACTER_ATTRIBUTES, PET_ATTRIBUTES } from "./progression";
const rec = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const finite = (v: unknown, min = -10000, max = 1e9): v is number =>
  typeof v === "number" && Number.isFinite(v) && v >= min && v <= max;
const count = (v: unknown, max = 1e9) =>
  finite(v, 0, max) && Number.isSafeInteger(v);
const point = (p: unknown) =>
  rec(p) && finite(p.x, 0, 3072) && finite(p.y, 0, 2304);
export function validDungeonSnapshot(value: unknown): value is DungeonSnapshot {
  if (
    !rec(value) ||
    value.version !== 1 ||
    typeof value.id !== "string" ||
    !/^[\w-]{1,90}$/.test(value.id) ||
    !["abandoned-central-square", "mall-parking"].includes(
      value.dungeon as string,
    ) ||
    ![
      "fighting",
      "choice",
      "paused",
      "victory",
      "defeat",
      "abandoned",
    ].includes(value.phase as string)
  )
    return false;
  if (
    !finite(value.elapsed, 0, 1e9) ||
    !count(value.round, 50) ||
    Number(value.round) < 1 ||
    !count(value.waveRemaining, 1000) ||
    !finite(value.intermission, 0, 10) ||
    !count(value.kills, 1e6) ||
    !count(value.level, 1e9) ||
    Number(value.level) < 1 ||
    !finite(value.xp, 0) ||
    !point(value.player) ||
    !rec(value.player) ||
    !finite(value.player.x, 32, 3040) ||
    !finite(value.player.y, 48, 2260) ||
    !finite(value.player.hp, 0, 10000) ||
    !finite(value.player.invulnerable, 0, 10)
  )
    return false;
  if (
    !Array.isArray(value.weapons) ||
    value.weapons.length < 1 ||
    value.weapons.length > B.maxWeapons ||
    value.weapons[0] !== "sword" ||
    new Set(value.weapons).size !== value.weapons.length ||
    value.weapons.some(
      (w) => typeof w !== "string" || !Object.hasOwn(WEAPONS, w),
    )
  )
    return false;
  if (
    !rec(value.levels) ||
    Object.entries(value.levels).some(
      ([id, n]) => !count(n, UPGRADES.find((u) => u.id === id)?.max ?? -1),
    )
  )
    return false;
  if (
    !rec(value.permanent) ||
    !CHARACTER_ATTRIBUTES.every((a) =>
      count((value.permanent as Record<string, unknown>)[a], 20),
    ) ||
    !count(value.seed, 4294967295) ||
    !count(value.sequence) ||
    !finite(value.spawnClock, -1, 20) ||
    !finite(value.eventClock, 0, 1e9) ||
    typeof value.lastStandUsed !== "boolean" ||
    !rec(value.buffs) ||
    Object.values(value.buffs).some((n) => !finite(n, 0, 1e9 + 20))
  )
    return false;
  if (
    !Array.isArray(value.enemies) ||
    value.enemies.length > B.maxEnemies ||
    value.enemies.some(
      (e) =>
        !point(e) ||
        !rec(e) ||
        !count(e.id) ||
        !finite(e.hp, -1e6, 1e6) ||
        !finite(e.maxHp, 1, 1e6) ||
        !finite(e.speed, 1, 1000) ||
        !finite(e.damage, 0, 1000) ||
        !["walker", "runner", "brute", "boss"].includes(e.kind as string) ||
        (e.bossTier !== undefined && (e.kind !== "boss" || ![10,20,30,40,50].includes(Number(e.bossTier)) || typeof e.bossTier !== "number")) ||
        typeof e.special !== "boolean" ||
        !count(e.streak, 1e6) ||
        !finite(e.lastHit, 0, 1e9) ||
        (e.detour !== undefined && !point(e.detour)) ||
        (e.boss !== undefined &&
          (e.kind !== "boss" || !validBossCombat(e.boss))),
    )
  )
    return false;
  if (
    !Array.isArray(value.projectiles) ||
    value.projectiles.length > B.maxProjectiles ||
    value.projectiles.some(
      (p) =>
        !point(p) ||
        !rec(p) ||
        !count(p.id) ||
        !["bow", "boomerang"].includes(p.weapon as string) ||
        ![
          "vx",
          "vy",
          "damage",
          "range",
          "distance",
          "accuracy",
          "piercing",
        ].every((k) => finite(p[k])) ||
        typeof p.returning !== "boolean" ||
        !Array.isArray(p.hits) ||
        p.hits.length > 1000 ||
        p.hits.some((h) => !count(h)),
    )
  )
    return false;
  if (
    !Array.isArray(value.pickups) ||
    value.pickups.length > 1100 ||
    value.pickups.some(
      (p) =>
        !point(p) ||
        !rec(p) ||
        !count(p.id) ||
        ![
          "xp",
          "health",
          "speed",
          "attack",
          "invulnerable",
          "critical",
          "magnet",
          "level",
          "pet",
        ].includes(p.kind as string) ||
        !finite(p.amount, 0, 100000) ||
        (p.kind === "level" && p.amount !== 1) ||
        (p.xpTier !== undefined && (p.kind !== "xp" || !["normal","elite","boss"].includes(p.xpTier as string))) ||
        (p.attracted !== undefined && typeof p.attracted !== "boolean") ||
        (p.species !== undefined &&
          !["dog", "cat"].includes(p.species as string)),
    )
  )
    return false;
  if (
    value.foundPetRare !== undefined &&
    typeof value.foundPetRare !== "boolean"
  )
    return false;
  if (
    value.foundPet !== undefined &&
    !["dog", "cat"].includes(value.foundPet as string)
  )
    return false;
  if (value.pet !== undefined) {
    const p = value.pet;
    if (
      !point(p) ||
      !rec(p) ||
      typeof p.id !== "string" ||
      typeof p.rare !== "boolean" ||
      !["dog", "cat"].includes(p.species as string) ||
      !["hp", "maxHp", "attack", "special", "rest"].every((k) =>
        finite(p[k], 0, 10000),
      ) ||
      !rec(p.attributes) ||
      !PET_ATTRIBUTES.every((a) =>
        count((p.attributes as Record<string, unknown>)[a], 20),
      )
    )
      return false;
  }
  if (
    !rec(value.cooldowns) ||
    Object.entries(value.cooldowns).some(
      ([w, n]) => !Object.hasOwn(WEAPONS, w) || !finite(n, 0, 30),
    ) ||
    !Array.isArray(value.cards) ||
    value.cards.length > 3 ||
    (value.phase === "choice" && value.cards.length === 0)
  )
    return false;
  for (const card of value.cards) {
    if (
      !rec(card) ||
      typeof card.id !== "string" ||
      !["arsenal", "upgrade"].includes(card.kind as string)
    )
      return false;
    if (
      card.kind === "arsenal"
        ? !Object.hasOwn(WEAPONS, card.id)
        : !UPGRADES.some((u) => u.id === card.id)
    )
      return false;
  }
  if (
    !rec(value.orbitalHits) ||
    Object.keys(value.orbitalHits).length > 1100 ||
    Object.values(value.orbitalHits).some((n) => !finite(n, 0, 1e9 + 10))
  )
    return false;
  if (
    value.lastHealthDropAt !== undefined &&
    (!finite(value.lastHealthDropAt, 0, 1e9) || Number(value.lastHealthDropAt) > Number(value.elapsed))
  ) return false;
  if (
    value.timedBossCount !== undefined && !count(value.timedBossCount, 5)
  ) return false;
  if (
    value.bossRound !== undefined &&
    (!count(value.bossRound, 50) ||
      ![10, 20, 30, 40, 50].includes(Number(value.bossRound)) ||
      Number(value.bossRound) > Number(value.round))
  )
    return false;
  if (
    value.shield !== undefined &&
    (!rec(value.shield) ||
      !count(value.shield.charges, 2) ||
      !finite(value.shield.recharge, 0, B.shieldRecharge))
  )
    return false;
  if (
    value.orbitalAngles !== undefined &&
    (!rec(value.orbitalAngles) ||
      Object.entries(value.orbitalAngles).some(
        ([id, angle]) =>
          id !== "rotating-blade" || !finite(angle, 0, Math.PI * 2),
      ))
  )
    return false;
  if (
    !Array.isArray(value.pendingAttacks) ||
    value.pendingAttacks.length > 100 ||
    value.pendingAttacks.some(
      (a) =>
        !point(a) ||
        !rec(a) ||
        !Object.hasOwn(WEAPONS, a.weapon as string) ||
        !finite(a.at, 0, 1e9 + 10) ||
        !finite(a.damage, 0, 100000) ||
        !finite(a.radius, 0, 1000) ||
        (a.angle !== undefined && !finite(a.angle, -Math.PI, Math.PI)),
    )
  )
    return false;
  return true;
}

function validBossCombat(value: unknown): boolean {
  if (!rec(value) || !finite(value.cooldown, 0, 10) || !count(value.sequence))
    return false;
  if (value.action === undefined) return true;
  const a = value.action;
  return rec(a) && point(a) &&
    ["slam", "charge", "chains", "plague"].includes(a.kind as string) &&
    ["warning", "active", "recovery"].includes(a.stage as string) &&
    finite(a.remaining, 0, 4) && finite(a.angle, -Math.PI, Math.PI) &&
    finite(a.distance, 0, 260) && typeof a.hit === "boolean";
}
