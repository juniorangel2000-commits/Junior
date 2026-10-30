import { PERMANENT_EFFECTS as P } from "./permanent-effects";
import { petPlayerBonuses } from "./pet-passives";
import { petRoamGoal } from "./pet-roaming";
import {
  petDirection,
  petActionDuration,
  PET_ATTACK_HIT_AT,
  type PetDirection,
} from "./pet-sprites";
import type { PetAttackAction } from "./pet-combat";
import {
  DUNGEONS,
  DUNGEON_BALANCE as B,
  WEAPONS,
  PETS,
  type DungeonId,
  type WeaponId,
  type PetSpecies,
} from "./config";
import { UPGRADES, rollUpgradeCards, type UpgradeCard } from "./upgrades";
import { hordeProfile, experienceForLevel, waveEnemyCount } from "./director";
import { insideSwordArc, WEAPON_DESCRIPTIONS } from "./weapon-identity";
import { dungeonWaypoint, dungeonSegmentClear } from "./navigation";
import { bossProfile, isBossRound, TIMED_BOSS_SCHEDULE } from "./bosses";
import { advanceBossCombat, type BossCombatState } from "./boss-combat";
import { EnemySpatialIndex } from "./spatial";
import { DUNGEON_ENTRY, dungeonBlocked, safeDungeonPoint } from "./maps";
import type { DungeonProgress, OwnedPet, RunResult } from "./progression";
export interface Enemy {
  id: number;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  special: boolean;
  kind: "walker" | "runner" | "brute" | "boss";
  bossTier?: number;
  streak: number;
  lastHit: number;
  detour?: { x: number; y: number };
  boss?: BossCombatState;
}
export interface Projectile {
  id: number;
  weapon: WeaponId;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  range: number;
  distance: number;
  piercing: number;
  returning: boolean;
  hits: number[];
  accuracy: number;
}
export interface Pickup {
  id: number;
  x: number;
  y: number;
  kind:
    | "xp"
    | "health"
    | "speed"
    | "attack"
    | "invulnerable"
    | "critical"
    | "magnet"
    | "level"
    | "pet";
  amount: number;
  attracted?: boolean;
  xpTier?: "normal" | "elite" | "boss";
  species?: PetSpecies;
}
export interface AttackEffect {
  id: number;
  weapon: WeaponId;
  x: number;
  y: number;
  angle: number;
  ttl: number;
  variant: number;
  radius?: number;
}
export type RunPhase =
  "fighting" | "choice" | "paused" | "victory" | "defeat" | "abandoned";
export interface RunPet {
  hurtGrace?: number;
  evade?: { remaining: number; angle: number };
  action?: PetAttackAction;
  direction?: PetDirection;
  walking?: boolean;
  running?: boolean;
  id: string;
  species: PetSpecies;
  rare: boolean;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  attack: number;
  special: number;
  rest: number;
  attributes: OwnedPet["attributes"];
}
export interface DungeonSnapshot {
  version: 1;
  id: string;
  dungeon: DungeonId;
  phase: RunPhase;
  elapsed: number;
  round: number;
  bossRound?: number;
  timedBossCount?: number;
  waveRemaining: number;
  intermission: number;
  kills: number;
  level: number;
  xp: number;
  weapons: WeaponId[];
  levels: Record<string, number>;
  player: { x: number; y: number; hp: number; invulnerable: number };
  pet?: RunPet;
  foundPet?: PetSpecies;
  foundPetRare?: boolean;
  enemies: Enemy[];
  projectiles: Projectile[];
  pickups: Pickup[];
  cards: UpgradeCard[];
  cooldowns: Partial<Record<WeaponId, number>>;
  seed: number;
  sequence: number;
  spawnClock: number;
  eventClock: number;
  lastHealthDropAt?: number;
  buffs: Record<string, number>;
  lastStandUsed: boolean;
  permanent: DungeonProgress["attributes"];
  orbitalHits: Record<string, number>;
  orbitalAngles?: Partial<Record<"rotating-blade", number>>;
  shield?: { charges: number; recharge: number };
  pendingAttacks: {
    at: number;
    weapon: WeaponId;
    x: number;
    y: number;
    damage: number;
    radius: number;
    angle?: number;
  }[];
}
const upgradeAmounts = new Map(UPGRADES.map((u) => [u.id, u.perLevel]));
const terminal = (phase: RunPhase) =>
  ["victory", "defeat", "abandoned"].includes(phase);
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
export class DungeonRun {
  state: DungeonSnapshot;
  readonly effects: AttackEffect[] = [];
  readonly impacts: {
    enemyId: number;
    x: number;
    y: number;
    damage: number;
    at: number;
    killed: boolean;
    critical: boolean;
  }[] = [];
  readonly spatial = new EnemySpatialIndex<Enemy>();
  private accumulator = 0;
  private get delayed() {
    return this.state.pendingAttacks;
  }
  private projectilePool: Projectile[] = [];
  constructor(
    id: string,
    dungeon: DungeonId,
    progress: DungeonProgress,
    petId?: string,
    seed = 1234567,
  ) {
    const owned = progress.pets.find((p) => p.id === petId);
    const maxHp =
      B.playerHealth *
      (1 +
        progress.attributes.vitality * P.vitality +
        petPlayerBonuses(owned).health);
    this.state = {
      version: 1,
      id,
      dungeon,
      phase: "fighting",
      elapsed: 0,
      round: 1,
      timedBossCount: 0,
      waveRemaining: 7,
      intermission: 0,
      kills: 0,
      level: 1,
      xp: 0,
      weapons: ["sword"],
      levels: {},
      player: { ...DUNGEON_ENTRY, hp: maxHp, invulnerable: 0 },
      enemies: [],
      projectiles: [],
      pickups: [],
      cards: [],
      cooldowns: {},
      seed: seed >>> 0 || 1,
      sequence: 0,
      spawnClock: 0,
      eventClock: 0,
      buffs: {},
      lastStandUsed: false,
      permanent: { ...progress.attributes },
      orbitalHits: {},
      orbitalAngles: {},
      pendingAttacks: [],
    };
    if (owned) {
      const c = PETS[owned.species],
        hp = c.health * (1 + owned.attributes.resistance * P.petResistance);
      this.state.pet = {
        id: owned.id,
        species: owned.species,
        rare: owned.rare,
        x: DUNGEON_ENTRY.x - 40,
        y: DUNGEON_ENTRY.y,
        hp,
        maxHp: hp,
        attack: 0,
        special: 0,
        rest: 0,
        attributes: { ...owned.attributes },
      };
    }
  }
  random = (): number => {
    let n = this.state.seed;
    n ^= n << 13;
    n ^= n >>> 17;
    n ^= n << 5;
    this.state.seed = n >>> 0;
    return this.state.seed / 4294967296;
  };
  level(id: string): number {
    return this.state.levels[id] ?? 0;
  }
  private bonus(id: string): number {
    return this.level(id) * (upgradeAmounts.get(id) ?? 0);
  }
  get maxHealth(): number {
    return (
      B.playerHealth *
      (1 +
        this.state.permanent.vitality * P.vitality +
        this.bonus("health") +
        petPlayerBonuses(this.state.pet).health)
    );
  }
  get moveSpeed(): number {
    return (
      B.playerSpeed *
      (1 +
        this.state.permanent.agility * P.agility +
        petPlayerBonuses(this.state.pet).movement +
        this.bonus("movement") +
        (this.active("speed") ? B.eventSpeedBonus : 0) +
        (this.active("last-stand") ? B.lastStandSpeedBonus : 0))
    );
  }
  get xpNeeded(): number {
    return experienceForLevel(this.state.level);
  }
  get buildComplete(): boolean {
    return (
      this.state.weapons.length === B.maxWeapons &&
      UPGRADES.every(
        (u) =>
          (u.weapon && !this.state.weapons.includes(u.weapon)) ||
          (u.pet && !this.state.pet) ||
          this.level(u.id) >= u.max,
      )
    );
  }
  private active(id: string): boolean {
    return (this.state.buffs[id] ?? 0) > this.state.elapsed;
  }
  private nextId(): number {
    return ++this.state.sequence;
  }
  pause(): void {
    if (this.state.phase === "fighting") this.state.phase = "paused";
  }
  resume(): void {
    if (this.state.phase === "paused") this.state.phase = "fighting";
  }
  abandon(): void {
    if (!terminal(this.state.phase)) this.state.phase = "abandoned";
  }
  choose(id: string): boolean {
    const s = this.state,
      card = s.cards.find((c) => c.id === id);
    if (s.phase !== "choice" || !card) return false;
    if (card.kind === "arsenal") {
      if (s.weapons.length >= B.maxWeapons || s.weapons.includes(card.id))
        return false;
      s.weapons.push(card.id);
    } else {
      const u = UPGRADES.find((u) => u.id === id);
      if (!u || (s.levels[id] ?? 0) >= u.max) return false;
      s.levels[id] = (s.levels[id] ?? 0) + 1;
      if (id === "shield-double" && s.shield)
        s.shield.charges = Math.min(2, s.shield.charges + 1);
      if (id === "health") this.healPlayer(B.playerHealth * 0.05);
    }
    s.cards = [];
    s.phase = "fighting";
    this.checkLevel();
    return true;
  }
  grantXP(amount: number): void {
    if (!Number.isFinite(amount) || amount < 0 || terminal(this.state.phase))
      return;
    this.state.xp +=
      amount *
      (1 +
        this.bonus("xp") +
        this.bonus("advanced-xp") +
        petPlayerBonuses(this.state.pet).experience);
    this.checkLevel();
  }
  private checkLevel(): void {
    const s = this.state;
    if (s.phase !== "fighting" || s.xp < this.xpNeeded) return;
    if (this.buildComplete) {
      // Keep leveling without empty card dialogs or automatic healing.
      while (s.xp >= this.xpNeeded) {
        if (s.level >= B.xpLinearStartLevel) {
          const firstCost = this.xpNeeded;
          const cost = (count: number) =>
            (count * (2 * firstCost + count - 1)) / 2;
          // Respect the existing checkpoint level bound, including huge XP grants.
          const availableLevels = Math.max(0, 1e9 - s.level);
          let levels = Math.min(
            availableLevels,
            Math.max(
              1,
              Math.floor(
                (Math.sqrt((2 * firstCost - 1) ** 2 + 8 * s.xp) -
                  (2 * firstCost - 1)) /
                  2,
              ),
            ),
          );
          while (levels > 0 && cost(levels) > s.xp) levels--;
          while (levels < availableLevels && cost(levels + 1) <= s.xp) levels++;
          s.xp -= cost(levels);
          s.level += levels;
          break;
        }
        s.xp -= this.xpNeeded;
        s.level++;
      }
      return;
    }
    s.xp -= this.xpNeeded;
    s.level++;
    s.cards = rollUpgradeCards(s, this.random);
    if (s.cards.length) s.phase = "choice";
    else {
      this.checkLevel();
    }
  }
  step(seconds: number): void {
    if (
      this.state.phase !== "fighting" ||
      !Number.isFinite(seconds) ||
      seconds <= 0
    )
      return;
    this.accumulator += Math.min(0.25, seconds);
    while (this.accumulator >= B.fixedStep && this.state.phase === "fighting") {
      this.accumulator -= B.fixedStep;
      this.tick(B.fixedStep);
    }
  }
  get horde() {
    return hordeProfile(
      this.state.dungeon,
      this.state.elapsed,
      this.state.round,
      this.state.level,
    );
  }
  private spawn(member = 0, timedTier?: number): boolean {
    const s = this.state;
    if (s.enemies.length >= B.maxEnemies) return false;
    const profile = this.horde;
    let x = 0,
      y = 0,
      found = false;
    for (let i = 0; i < 18; i++) {
      const spread = this.random();
      // After several failed placements, use the full circle to escape blocked sectors.
      const angle =
          i >= 8 || profile.pattern === "surround"
            ? spread * Math.PI * 2
            : profile.sector +
              (profile.pattern === "pincer" ? (member % 2) * Math.PI : 0) +
              (spread - 0.5) * 1.1,
        dist = 420 + this.random() * 140;
      x = clamp(s.player.x + Math.cos(angle) * dist, 64, 3000);
      y = clamp(s.player.y + Math.sin(angle) * dist, 64, 2200);
      if (
        Math.hypot(x - s.player.x, y - s.player.y) >= 260 &&
        !dungeonBlocked(s.dungeon, x, y)
      ) {
        found = true;
        break;
      }
    }
    if (!found) return false;
    const boss =
        timedTier !== undefined ||
        (DUNGEONS[s.dungeon].mode === "waves" &&
          isBossRound(s.round) &&
          s.bossRound !== s.round),
      special = boss || this.random() < profile.specialChance,
      kind = boss
        ? "boss"
        : special
          ? "brute"
          : this.random() < profile.runnerChance
            ? "runner"
            : "walker",
      stats = bossProfile(timedTier ?? s.round),
      health =
        B.enemyHealth *
        profile.health *
        (boss ? stats.health : special ? 3 : 1);
    if (boss && timedTier === undefined) s.bossRound = s.round;
    s.enemies.push({
      id: this.nextId(),
      x,
      y,
      hp: health,
      maxHp: health,
      speed:
        B.enemySpeed *
        (boss ? stats.speed : kind === "runner" ? 1.6 : special ? 0.7 : 1) *
        profile.speed,
      damage:
        B.enemyDamage *
        profile.damage *
        (boss ? stats.damage : special ? 1.5 : 1),
      special,
      kind,
      ...(timedTier !== undefined ? { bossTier: timedTier } : {}),
      streak: 0,
      lastHit: 0,
    });
    return true;
  }
  private tick(dt: number): void {
    const s = this.state;
    s.elapsed += dt;
    s.orbitalAngles ??= {};
    s.orbitalAngles["rotating-blade"] =
      ((s.orbitalAngles["rotating-blade"] ?? (s.elapsed - dt) * 3) +
        dt * 3 * (1 + this.bonus("blade-speed"))) %
      (Math.PI * 2);
    if (s.weapons.includes("orbiting-shield")) {
      s.shield ??= { charges: this.shieldCapacity, recharge: 0 };
      if (s.shield.recharge > 0) {
        s.shield.recharge = Math.max(0, s.shield.recharge - dt);
        if (s.shield.recharge === 0) s.shield.charges = this.shieldCapacity;
      }
    }
    for (let i = this.impacts.length - 1; i >= 0; i--)
      if (s.elapsed - this.impacts[i].at > 0.42) this.impacts.splice(i, 1);
    s.player.invulnerable = Math.max(0, s.player.invulnerable - dt);
    for (const effect of this.effects) effect.ttl -= dt;
    for (let i = this.effects.length - 1; i >= 0; i--)
      if (this.effects[i].ttl <= 0) this.effects.splice(i, 1);
    this.healPlayer(
      (s.permanent.survival * P.survival +
        this.level("regeneration") * B.regenerationPerLevel +
        this.level("fast-recovery") * B.rareRegenPerLevel +
        (this.active("last-stand") ? B.lastStandRegeneration : 0)) *
        dt,
    );
    if (
      this.level("last-stand") &&
      !s.lastStandUsed &&
      s.player.hp < this.maxHealth * 0.2
    ) {
      s.lastStandUsed = true;
      s.buffs["last-stand"] = s.elapsed + B.lastStandDuration;
    }
    const mode = DUNGEONS[s.dungeon].mode;
    if (
      mode === "waves" &&
      isBossRound(s.round) &&
      s.enemies.some((e) => e.kind === "boss")
    )
      s.bossRound = s.round;
    if (mode === "timed" && s.elapsed >= DUNGEONS[s.dungeon].duration) {
      s.phase = "victory";
      return;
    }
    if (mode === "timed") {
      const next = TIMED_BOSS_SCHEDULE[s.timedBossCount ?? 0];
      if (next && s.elapsed >= next.at && this.spawn(0, next.tier))
        s.timedBossCount = (s.timedBossCount ?? 0) + 1;
    }
    if (
      mode === "waves" &&
      isBossRound(s.round) &&
      s.bossRound !== s.round &&
      s.waveRemaining === 0
    )
      s.waveRemaining = 1;
    if (s.intermission > 0) s.intermission = Math.max(0, s.intermission - dt);
    else {
      s.spawnClock = Math.max(0, s.spawnClock - dt);
      if (s.spawnClock <= 0 && (mode === "timed" || s.waveRemaining > 0)) {
        const profile = this.horde,
          n = profile.batch;
        for (
          let i = 0;
          i < n &&
          s.enemies.length < B.maxEnemies &&
          (mode === "timed" || s.waveRemaining > 0);
          i++
        ) {
          const spawned = this.spawn(i);
          if (spawned && mode === "waves") s.waveRemaining--;
        }
        s.spawnClock = profile.interval;
      }
      if (mode === "waves" && s.waveRemaining === 0 && s.enemies.length === 0) {
        if (s.round >= DUNGEONS[s.dungeon].rounds) {
          // Collect earned XP and level tokens before closing the final wave.
          for (const p of s.pickups)
            if (p.kind === "xp" || p.kind === "level") p.attracted = true;
          this.collect(dt);
          if (
            s.phase === "choice" ||
            s.pickups.some((p) => p.kind === "xp" || p.kind === "level")
          )
            return;
          s.phase = "victory";
          return;
        }
        s.round++;
        s.waveRemaining = waveEnemyCount(s.round);
        s.intermission = 3;
      }
    }
    for (const e of s.enemies) {
      if (e.hp <= 0) continue;
      if (e.kind === "boss") {
        const pursue = advanceBossCombat(
          e,
          s.player,
          e.bossTier ?? s.round,
          s.dungeon,
          dt,
          (damage) => this.hurtPlayer(damage),
        );
        if (s.phase === "defeat") return;
        if (!pursue) continue;
      }
      const dx = s.player.x - e.x,
        dy = s.player.y - e.y,
        d = Math.hypot(dx, dy) || 1,
        speed = e.speed * dt;
      let mx = (dx / d) * speed,
        my = (dy / d) * speed;
      if (
        e.detour &&
        (Math.hypot(e.detour.x - e.x, e.detour.y - e.y) < speed * 2 ||
          !dungeonSegmentClear(s.dungeon, e.x, e.y, e.detour.x, e.detour.y))
      ) {
        delete e.detour;
        // Finish routing around the obstacle rather than cutting back into it
        // as soon as one intermediate waypoint has been reached.
        if (!dungeonSegmentClear(s.dungeon, e.x, e.y, s.player.x, s.player.y))
          e.detour = dungeonWaypoint(
            s.dungeon,
            e.x,
            e.y,
            s.player.x,
            s.player.y,
          );
      }
      if (
        !e.detour &&
        (dungeonBlocked(s.dungeon, e.x + mx, e.y) ||
          dungeonBlocked(s.dungeon, e.x, e.y + my))
      )
        e.detour = dungeonWaypoint(s.dungeon, e.x, e.y, s.player.x, s.player.y);
      if (e.detour) {
        const distance = Math.hypot(e.detour.x - e.x, e.detour.y - e.y) || 1;
        mx = ((e.detour.x - e.x) / distance) * speed;
        my = ((e.detour.y - e.y) / distance) * speed;
      }
      this.moveEnemy(e, mx, my);
      if (d < 22) this.hurtPlayer(e.damage);
      if (s.phase === "defeat") return;
    }
    this.spatial.rebuild(s.enemies.filter((e) => e.hp > 0));
    for (const weapon of s.weapons) {
      s.cooldowns[weapon] = Math.max(0, (s.cooldowns[weapon] ?? 0) - dt);
      if (!s.cooldowns[weapon]) this.attack(weapon);
    }
    for (let i = this.delayed.length - 1; i >= 0; i--) {
      const a = this.delayed[i];
      if (a.at <= s.elapsed) {
        if (a.weapon === "sword" && a.angle !== undefined)
          this.swordStrike(a.x, a.y, a.radius, a.damage, a.angle, 1);
        else this.area(a.weapon, a.x, a.y, a.radius, a.damage, 1);
        this.delayed.splice(i, 1);
      }
    }
    this.projectiles(dt);
    this.pet(dt);
    this.collect(dt);
    this.events();
    s.enemies = s.enemies.filter((e) => e.hp > 0);
    if (Object.keys(s.orbitalHits).length > 600)
      for (const [key, until] of Object.entries(s.orbitalHits))
        if (until < s.elapsed) delete s.orbitalHits[key];
  }
  private moveEnemy(
    e: { x: number; y: number; boss?: BossCombatState },
    dx: number,
    dy: number,
  ): void {
    // A committed charge keeps its warned lane even when struck by knockback.
    if (e.boss?.action?.kind === "charge") return;
    const id = this.state.dungeon;
    if (!dungeonBlocked(id, e.x + dx, e.y)) e.x += dx;
    if (!dungeonBlocked(id, e.x, e.y + dy)) e.y += dy;
    // Wall sliding chooses a free tangent instead of pushing through parked cars.
    if (dungeonBlocked(id, e.x + dx, e.y + dy)) {
      const step = Math.hypot(dx, dy);
      if (!dungeonBlocked(id, e.x + dy, e.y - dx)) {
        e.x += dy;
        e.y -= dx;
      } else if (!dungeonBlocked(id, e.x - dy, e.y + dx)) {
        e.x -= dy;
        e.y += dx;
      } else if (step > 0) {
        /* wait for a moving target to open a route */
      }
    }
  }
  weaponStats(id: WeaponId) {
    const w = WEAPONS[id],
      prefix =
        id === "rotating-blade"
          ? "blade"
          : id === "orbiting-shield"
            ? "shield"
            : id;
    const speed = id === "boomerang" ? 0 : this.bonus(prefix + "-speed");
    const special = !!this.level(
      id === "sword"
        ? "sword-dual"
        : id === "bow"
          ? "bow-triple"
          : id === "spear"
            ? "spear-fan"
            : id === "boomerang"
              ? "boomerang-cross"
              : id === "hammer"
                ? "hammer-double"
                : prefix + "-double",
    );
    return {
      ...w,
      damage:
        w.damage *
        (1 +
          this.bonus(w.kind) +
          this.bonus("advanced-attack") +
          this.bonus(prefix + "-damage") +
          this.state.permanent.strength * P.strength +
          (this.active("attack") ? B.eventAttackBonus : 0) +
          (special
            ? this.bonus("special-efficiency") +
              this.bonus("specialized-arsenal")
            : 0)),
      cooldown:
        w.cooldown /
        (1 +
          speed +
          this.bonus("attack-speed") +
          (w.kind === "ranged" ? this.bonus("reload") : 0) +
          (special ? this.bonus("special-cooldown") : 0)),
      range:
        w.range * (1 + this.bonus("range") + this.bonus(prefix + "-range")),
    };
  }
  private effect(
    weapon: WeaponId,
    x: number,
    y: number,
    angle = 0,
    variant = 0,
    radius?: number,
  ): void {
    if (this.effects.length >= B.maxEffects) this.effects.shift();
    this.effects.push({
      id: this.nextId(),
      weapon,
      x,
      y,
      angle,
      ttl: 0.22,
      variant,
      radius,
    });
  }
  private hit(e: Enemy, damage: number, weaponHit = true): void {
    if (e.hp <= 0) return;
    const s = this.state;
    const critical =
      weaponHit &&
      (s.permanent.precision > 0 || this.active("critical")) &&
      this.random() <
        Math.min(
          1,
          s.permanent.precision * P.precisionCritical +
            (this.active("critical") ? B.criticalChance : 0),
        );
    if (critical) damage *= B.criticalMultiplier;
    if (weaponHit && e.kind === "boss") damage *= 1 + this.bonus("boss-damage");
    if (this.level("deadly-precision")) {
      e.streak = s.elapsed - e.lastHit < 3 ? e.streak + 1 : 1;
      e.lastHit = s.elapsed;
      damage *= 1 + Math.min(0.5, e.streak * 0.04);
    }
    e.hp -= damage;
    if (this.impacts.length >= B.maxEffects) this.impacts.shift();
    this.impacts.push({
      enemyId: e.id,
      x: e.x,
      y: e.y,
      damage,
      at: s.elapsed,
      killed: e.hp <= 0,
      critical,
    });
    if (e.hp > 0) return;
    s.kills++;
    const rewardXP =
      (DUNGEONS[s.dungeon].mode === "timed" ? B.timedEnemyXP : B.enemyXP) *
      this.horde.experience *
      (e.kind === "boss" ? 2 : e.special ? 1.5 : 1);
    if (s.pickups.length < 1000)
      s.pickups.push({
        id: this.nextId(),
        x: e.x,
        y: e.y,
        kind: "xp",
        amount: rewardXP,
        xpTier: e.kind === "boss" ? "boss" : e.special ? "elite" : "normal",
      });
    else this.grantXP(rewardXP);
    if (e.kind === "boss" && s.pickups.length < 1100)
      s.pickups.push({
        id: this.nextId(),
        x: e.x,
        y: e.y,
        kind: "level",
        amount: 1,
      });
    const healingChance =
      e.kind === "boss"
        ? 1
        : e.special
          ? this.level("survival-instinct")
            ? B.instinctHealingChance
            : B.specialHealingChance
          : B.ordinaryHealingChance;
    if (this.random() < healingChance)
      this.dropHealing(e.x, e.y, e.kind === "boss" ? 25 : e.special ? 15 : 10);
  }
  private dropHealing(x: number, y: number, amount: number): void {
    const s = this.state;
    if (
      s.pickups.length >= 1000 ||
      s.pickups.filter((p) => p.kind === "health").length >=
        B.maxGroundHealing ||
      s.elapsed - (s.lastHealthDropAt ?? -B.healingDropCooldown) <
        B.healingDropCooldown ||
      dungeonBlocked(s.dungeon, x, y)
    )
      return;
    s.pickups.push({ id: this.nextId(), x, y, kind: "health", amount });
    s.lastHealthDropAt = s.elapsed;
  }
  private area(
    weapon: WeaponId,
    x: number,
    y: number,
    radius: number,
    damage: number,
    variant = 0,
  ): void {
    for (const e of this.spatial
      .query(x, y, radius)
      .filter((e) => e.hp > 0)
      .slice(
        0,
        weapon === "sword" ? 1 + this.level("sword-wide") : undefined,
      )) {
      this.hit(e, damage);
      if (weapon === "hammer" && e.hp > 0) this.pushEnemy(e, x, y, 14);
    }
    this.effect(weapon, x, y, 0, variant, radius);
  }
  private pushEnemy(e: Enemy, x: number, y: number, force: number): void {
    const dx = e.x - x,
      dy = e.y - y,
      distance = Math.hypot(dx, dy);
    const nx = distance ? dx / distance : Math.cos(this.state.elapsed),
      ny = distance ? dy / distance : Math.sin(this.state.elapsed);
    for (let step = 0; step < 4; step++)
      this.moveEnemy(e, (nx * force) / 4, (ny * force) / 4);
  }
  orbitalAngle(id: "rotating-blade"): number {
    return (
      this.state.orbitalAngles?.[id] ?? (this.state.elapsed * 3) % (Math.PI * 2)
    );
  }
  orbitalRadius(id: "rotating-blade"): number {
    return this.weaponStats(id).range;
  }
  private clearThrust(x: number, y: number, tx: number, ty: number): boolean {
    const steps = Math.ceil(Math.hypot(tx - x, ty - y) / 8);
    for (let i = 1; i <= steps; i++)
      if (
        dungeonBlocked(
          this.state.dungeon,
          x + ((tx - x) * i) / steps,
          y + ((ty - y) * i) / steps,
        )
      )
        return false;
    return true;
  }
  private swordStrike(
    x: number,
    y: number,
    radius: number,
    damage: number,
    angle: number,
    variant = 0,
  ): void {
    const wide = this.level("sword-wide");
    const targets = this.spatial
      .query(x, y, radius)
      .filter((e) => e.hp > 0 && insideSwordArc(e.x - x, e.y - y, angle, wide))
      .sort(
        (a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y),
      )
      .slice(0, 1 + wide);
    for (const e of targets) {
      this.hit(e, damage);
      if (e.hp > 0) {
        const d = Math.hypot(e.x - x, e.y - y) || 1,
          force = 6 + wide * 3;
        // Small steps preserve wall collision even with widened cuts.
        for (let i = 0; i < 3; i++)
          this.moveEnemy(
            e,
            (((e.x - x) / d) * force) / 3,
            (((e.y - y) / d) * force) / 3,
          );
      }
    }
    this.effect("sword", x, y, angle, variant);
  }
  get shieldCapacity(): number {
    return this.level("shield-double") ? 2 : 1;
  }
  private healPlayer(amount: number): void {
    this.state.player.hp = Math.min(
      this.maxHealth,
      this.state.player.hp +
        amount * (1 + petPlayerBonuses(this.state.pet).healing),
    );
  }
  /** Contact and boss skills share defense, shield charges and the same hit grace. */
  private hurtPlayer(damage: number): void {
    const s = this.state;
    if (s.player.invulnerable > 0 || this.active("invulnerable")) return;
    if (this.blockWithShield()) return;
    const reduction = Math.min(
      0.75,
      petPlayerBonuses(s.pet).protection +
        this.bonus("defense") +
        s.permanent.resistance * P.resistance +
        (s.pet && s.pet.hp > 0
          ? s.pet.attributes.protection * 0.01 + this.bonus("pet-protection")
          : 0),
    );
    s.player.hp = Math.max(
      0,
      s.player.hp - Math.max(1, damage * (1 - reduction)),
    );
    s.player.invulnerable = B.contactGrace;
    if (s.player.hp === 0) s.phase = "defeat";
  }
  get shieldRadius(): number {
    return (
      B.shieldPulseRadius *
      (1 +
        this.bonus("shield-protection") +
        (this.level("shield-double") ? 0.25 : 0))
    );
  }
  get shieldRecharge(): number {
    return (
      B.shieldRecharge /
      (1 + this.bonus("shield-speed") + this.bonus("special-cooldown"))
    );
  }
  private blockWithShield(): boolean {
    const s = this.state;
    if (!s.weapons.includes("orbiting-shield") || !s.shield?.charges)
      return false;
    s.shield.charges--;
    // Start the shared recharge with the first consumed charge, retaining the spare.
    if (s.shield.recharge === 0) s.shield.recharge = this.shieldRecharge;
    s.player.invulnerable = B.contactGrace;
    this.spatial.rebuild(s.enemies.filter((e) => e.hp > 0));
    for (const e of this.spatial.query(
      s.player.x,
      s.player.y,
      this.shieldRadius,
    ))
      this.pushEnemy(
        e,
        s.player.x,
        s.player.y,
        B.shieldPush * (1 + this.bonus("shield-push")),
      );
    this.effect(
      "orbiting-shield",
      s.player.x,
      s.player.y,
      0,
      this.level("shield-double") ? 1 : 0,
      this.shieldRadius,
    );
    return true;
  }
  private attack(id: WeaponId): void {
    if (id === "orbiting-shield") return;
    const s = this.state,
      p = s.player,
      w = this.weaponStats(id),
      targets = this.spatial
        .query(p.x, p.y, w.range + (id === "rotating-blade" ? 30 : 0))
        .filter((e) => e.hp > 0)
        .sort(
          (a, b) =>
            Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y),
        );
    if (!targets.length) return;
    const target = targets[0],
      angle = Math.atan2(target.y - p.y, target.x - p.x);
    s.cooldowns[id] = id === "rotating-blade" ? 0 : w.cooldown;
    if (id === "sword") {
      this.swordStrike(p.x, p.y, w.range, w.damage, angle);
      if (this.level("sword-dual"))
        this.delayed.push({
          at: s.elapsed + 0.18,
          weapon: id,
          x: p.x,
          y: p.y,
          damage: w.damage * 0.6,
          radius: w.range,
          angle,
        });
    } else if (id === "bow" || id === "boomerang") {
      const count =
        id === "bow"
          ? this.level("bow-triple")
            ? 3
            : this.level("bow-double")
              ? 2
              : 1
          : this.level("boomerang-cross") || this.level("boomerang-double")
            ? 2
            : 1;
      this.effect(
        id,
        p.x,
        p.y,
        angle,
        this.level(id === "bow" ? "bow-triple" : "boomerang-cross") ? 1 : 0,
      );
      for (
        let i = 0;
        i < count && s.projectiles.length < B.maxProjectiles;
        i++
      ) {
        const aim = targets[Math.min(i, targets.length - 1)],
          a =
            id === "bow"
              ? Math.atan2(aim.y - p.y, aim.x - p.x)
              : this.level("boomerang-cross")
                ? angle + i * Math.PI
                : angle + i * 0.18,
          speed =
            w.speed *
            (1 + (id === "boomerang" ? this.bonus("boomerang-speed") : 0));
        const projectile = this.projectilePool.pop() ?? ({} as Projectile);
        Object.assign(projectile, {
          id: this.nextId(),
          weapon: id,
          x: p.x,
          y: p.y,
          vx: Math.cos(a) * speed,
          vy: Math.sin(a) * speed,
          damage: w.damage,
          range: w.range,
          distance: 0,
          piercing:
            id === "bow"
              ? 1 + this.level("bow-piercing") + this.level("piercing")
              : 999,
          returning: false,
          hits: [],
          accuracy: Math.min(
            1,
            B.baseAccuracy +
              this.bonus("accuracy") +
              (id === "bow" ? this.bonus("bow-accuracy") : 0) +
              s.permanent.precision * P.precisionAccuracy,
          ),
        });
        s.projectiles.push(projectile);
      }
    } else if (id === "spear") {
      const struck = new Set<number>();
      for (const offset of this.level("spear-fan") ? [-0.3, 0, 0.3] : [0]) {
        const a = angle + offset,
          hits = targets.filter((e) => {
            const dx = e.x - p.x,
              dy = e.y - p.y,
              along = dx * Math.cos(a) + dy * Math.sin(a),
              across = Math.abs(-dx * Math.sin(a) + dy * Math.cos(a));
            return (
              !struck.has(e.id) &&
              along >= 0 &&
              along <= w.range &&
              across < 18 &&
              this.clearThrust(p.x, p.y, e.x, e.y)
            );
          });
        for (const e of hits.slice(
          0,
          1 + this.level("spear-piercing") + this.level("piercing"),
        )) {
          this.hit(e, w.damage);
          struck.add(e.id);
        }
        this.effect(id, p.x, p.y, a, this.level("spear-fan") ? 1 : 0, w.range);
      }
    } else if (id === "hammer") {
      const radius = 48 * Math.sqrt(1 + this.bonus("hammer-area"));
      this.area(id, target.x, target.y, radius, w.damage);
      if (this.level("hammer-double"))
        this.delayed.push({
          at: s.elapsed + 0.2,
          weapon: id,
          x: target.x,
          y: target.y,
          damage: w.damage,
          radius,
        });
    } else {
      const double = this.level(
          id === "rotating-blade" ? "blade-double" : "shield-double",
        ),
        a = this.orbitalAngle(id),
        n = double ? 2 : 1;
      for (let i = 0; i < n; i++) {
        const q = a + i * Math.PI,
          x = p.x + Math.cos(q) * this.orbitalRadius(id),
          y = p.y + Math.sin(q) * this.orbitalRadius(id);
        let connected = false;
        for (const e of this.spatial.query(x, y, 30)) {
          if (e.hp <= 0) continue;
          const key = id + "-" + e.id;
          if ((s.orbitalHits[key] ?? 0) > s.elapsed) continue;
          s.orbitalHits[key] = s.elapsed + w.cooldown;
          this.hit(e, w.damage);
          connected = true;
        }
        if (connected) this.effect(id, x, y, q, i, 30);
      }
    }
  }
  private projectiles(dt: number): void {
    const s = this.state;
    for (let i = s.projectiles.length - 1; i >= 0; i--) {
      const p = s.projectiles[i],
        speed = Math.hypot(p.vx, p.vy);
      let remove = false;
      if (p.weapon === "boomerang" && p.returning) {
        const dx = s.player.x - p.x,
          dy = s.player.y - p.y,
          d = Math.hypot(dx, dy) || 1;
        p.vx = (dx / d) * speed;
        p.vy = (dy / d) * speed;
        if (d < 18) remove = true;
      }
      const slices = Math.max(1, Math.ceil((speed * dt) / 12));
      for (let n = 0; n < slices && !remove; n++) {
        p.x += (p.vx * dt) / slices;
        p.y += (p.vy * dt) / slices;
        p.distance += (speed * dt) / slices;
        if (dungeonBlocked(s.dungeon, p.x, p.y)) {
          if (p.weapon === "boomerang" && !p.returning) {
            p.returning = true;
            p.hits = [];
            p.distance = 0;
          } else remove = true;
        }
        for (const e of this.spatial.query(p.x, p.y, 16))
          if (e.hp > 0 && !p.hits.includes(e.id)) {
            p.hits.push(e.id);
            if (this.random() <= p.accuracy) this.hit(e, p.damage);
            if (--p.piercing <= 0) {
              remove = true;
              break;
            }
          }
      }
      if (p.distance >= p.range * (p.returning ? 3 : 1)) {
        if (p.weapon === "boomerang" && !p.returning) {
          p.returning = true;
          p.hits = [];
          p.distance = 0;
        } else remove = true;
      }
      if (p.x < 0 || p.y < 0 || p.x > 3072 || p.y > 2304) remove = true;
      if (remove) {
        s.projectiles.splice(i, 1);
        this.projectilePool.push(p);
      }
    }
  }
  private pet(dt: number): void {
    const s = this.state,
      p = s.pet;
    if (!p) return;
    const c = PETS[p.species];
    p.hurtGrace = Math.max(0, (p.hurtGrace ?? 0) - dt);
    if (p.evade) {
      p.evade.remaining = Math.max(0, p.evade.remaining - dt);
      if (p.evade.remaining === 0) delete p.evade;
    }
    if (p.hp <= 0) {
      delete p.action;
      delete p.evade;
      p.walking = false;
      p.running = false;
      p.rest += dt;
      if (p.rest > 8) {
        p.hp = p.maxHp * 0.5;
        p.rest = 0;
      }
      return;
    }
    p.attack = Math.max(0, p.attack - dt);
    p.special = Math.max(0, p.special - dt);
    const before = { x: p.x, y: p.y };
    p.running = false;
    if (p.evade && !p.action) {
      this.moveEnemy(
        p,
        Math.cos(p.evade.angle) * 180 * dt,
        Math.sin(p.evade.angle) * 180 * dt,
      );
      p.running = true;
    }
    if (!p.action && !p.evade) {
      const playerDistance = Math.hypot(s.player.x - p.x, s.player.y - p.y);
      let goal = petRoamGoal(s.player, p, s.elapsed, p.id);
      if (playerDistance <= 220 && (p.attack === 0 || p.special === 0)) {
        const nearby = this.spatial
          .query(p.x, p.y, 180)
          .filter(
            (e) =>
              e.hp > 0 &&
              Math.hypot(e.x - s.player.x, e.y - s.player.y) < 260 &&
              dungeonSegmentClear(s.dungeon, p.x, p.y, e.x, e.y),
          );
        const enemy = nearby.sort(
          (a, b) =>
            Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y),
        )[0];
        if (enemy) {
          const dx = p.x - enemy.x,
            dy = p.y - enemy.y,
            d = Math.hypot(dx, dy) || 1;
          goal =
            d <= 100
              ? { x: p.x, y: p.y }
              : { x: enemy.x + (dx / d) * 70, y: enemy.y + (dy / d) * 70 };
        }
      }
      goal = safeDungeonPoint(s.dungeon, goal.x, goal.y);
      const waypoint = dungeonSegmentClear(s.dungeon, p.x, p.y, goal.x, goal.y)
        ? goal
        : dungeonWaypoint(s.dungeon, p.x, p.y, goal.x, goal.y);
      if (waypoint) {
        const dx = waypoint.x - p.x,
          dy = waypoint.y - p.y,
          d = Math.hypot(dx, dy) || 1;
        p.running = playerDistance > 190;
        const move = Math.min(
          Math.max(0, d - 8),
          c.speed *
            (p.running ? 1.45 : 1) *
            (1 + p.attributes.speed * 0.03) *
            dt,
        );
        this.moveEnemy(p, (dx / d) * move, (dy / d) * move);
      }
      const targets = this.spatial
        .query(p.x, p.y, 100)
        .filter(
          (e) => e.hp > 0 && dungeonSegmentClear(s.dungeon, p.x, p.y, e.x, e.y),
        );
      if (targets.length && (p.special === 0 || p.attack === 0)) {
        const target = targets.reduce((best, e) =>
          Math.hypot(e.x - p.x, e.y - p.y) <
          Math.hypot(best.x - p.x, best.y - p.y)
            ? e
            : best,
        );
        const dx = target.x - p.x,
          dy = target.y - p.y,
          d = Math.hypot(dx, dy) || 1,
          reach = Math.max(0, Math.min(70, d - 18));
        const kind = p.special === 0 ? "special" : "basic";
        p.action = {
          kind,
          age: 0,
          direction: petDirection(dx, dy),
          targetId: target.id,
          originX: p.x,
          originY: p.y,
          targetX: p.x + (dx / d) * reach,
          targetY: p.y + (dy / d) * reach,
          hit: false,
        };
        if (kind === "special")
          p.special = c.specialCooldown / (1 + this.bonus("pet-cooldown"));
        else p.attack = c.cooldown / (1 + this.bonus("pet-speed"));
      }
    }
    const action = p.action;
    if (action) {
      action.age = Math.min(
        petActionDuration(p.species, "attack"),
        action.age + dt,
      );
      const phase = action.age / petActionDuration(p.species, "attack"),
        travel = Math.sin(Math.PI * phase);
      const x = action.originX + (action.targetX - action.originX) * travel,
        y = action.originY + (action.targetY - action.originY) * travel;
      this.moveEnemy(p, x - p.x, y - p.y);
      p.direction = action.direction;
      if (!action.hit && action.age + 1e-9 >= PET_ATTACK_HIT_AT) {
        action.hit = true;
        const targets = this.spatial
          .query(p.x, p.y, 100)
          .filter(
            (e) =>
              e.hp > 0 && dungeonSegmentClear(s.dungeon, p.x, p.y, e.x, e.y),
          );
        if (action.kind === "basic") {
          const target = targets.find((e) => e.id === action.targetId);
          if (target)
            this.hit(
              target,
              c.damage *
                (1 + this.bonus("pet-damage") + p.attributes.efficiency * 0.03),
              false,
            );
        } else {
          const multiplier = this.level("relentless-companion") ? 2 : 1;
          for (const e of targets) {
            this.hit(
              e,
              c.damage *
                1.5 *
                (1 + p.attributes.efficiency * 0.05) *
                multiplier,
              false,
            );
            if (p.species === "dog") {
              const d = Math.hypot(e.x - p.x, e.y - p.y) || 1;
              this.moveEnemy(
                e,
                ((e.x - p.x) / d) * 22 * multiplier,
                ((e.y - p.y) / d) * 22 * multiplier,
              );
            }
          }
        }
      }
      if (action.age + 1e-9 >= petActionDuration(p.species, "attack"))
        delete p.action;
    }
    p.walking = Math.hypot(p.x - before.x, p.y - before.y) > 0.01;
    if (!action && p.walking)
      p.direction = petDirection(p.x - before.x, p.y - before.y);
    if ((p.hurtGrace ?? 0) === 0) {
      const contacts = this.spatial
        .query(p.x, p.y, 18)
        .filter(
          (e) =>
            e.hp > 0 && e.damage > 0 && Math.hypot(e.x - p.x, e.y - p.y) < 18,
        );
      if (contacts.length) {
        p.hurtGrace = 0.9;
        if (this.random() < c.evasion) {
          let dx = 0,
            dy = 0;
          for (const e of contacts) {
            const distance = Math.hypot(p.x - e.x, p.y - e.y) || 1;
            dx += (p.x - e.x) / distance;
            dy += (p.y - e.y) / distance;
          }
          p.evade = {
            remaining: 0.24,
            angle:
              Math.hypot(dx, dy) > 0.01
                ? Math.atan2(dy, dx)
                : (s.elapsed * 0.7) % (Math.PI * 2),
          };
        } else {
          const damage = Math.min(
            Math.max(...contacts.map((e) => e.damage)) * 0.6,
            p.maxHp * 0.35,
          );
          p.hp = Math.max(
            0,
            p.hp -
              damage /
                (1 +
                  this.bonus("pet-resistance") +
                  p.attributes.resistance * P.petResistance),
          );
          if (p.hp === 0) {
            delete p.action;
            delete p.evade;
            p.walking = false;
          }
        }
      }
    }
  }
  private collect(dt: number): void {
    const s = this.state,
      r =
        B.pickupRadius *
        (1 +
          this.bonus("pickup") +
          petPlayerBonuses(s.pet).pickup +
          (s.pet ? s.pet.attributes.perception * 0.03 : 0));
    for (let i = s.pickups.length - 1; i >= 0; i--) {
      const p = s.pickups[i],
        d = Math.hypot(p.x - s.player.x, p.y - s.player.y);
      if (
        (p.kind === "xp" || (p.kind === "level" && p.attracted)) &&
        (d < r || p.attracted)
      ) {
        const speed = Math.min(d, (p.attracted ? B.magnetSpeed : 240) * dt);
        p.x += ((s.player.x - p.x) / (d || 1)) * speed;
        p.y += ((s.player.y - p.y) / (d || 1)) * speed;
      }
      if (d > 20) continue;
      if (p.kind === "level" && s.phase !== "fighting") continue;
      if (p.kind === "health" && s.player.hp >= this.maxHealth) continue;
      s.pickups.splice(i, 1);
      if (p.kind === "xp") this.grantXP(p.amount);
      else if (p.kind === "level") {
        s.level++;
        s.cards = this.buildComplete ? [] : rollUpgradeCards(s, this.random);
        if (s.cards.length) s.phase = "choice";
      } else if (p.kind === "health") this.healPlayer(p.amount);
      else if (p.kind === "pet") {
        s.foundPet = p.species;
        s.foundPetRare = this.random() < B.rarePetChance;
      } else if (p.kind === "magnet") {
        for (const crystal of s.pickups)
          if (crystal.kind === "xp") crystal.attracted = true;
      } else s.buffs[p.kind] = s.elapsed + B.eventDuration;
    }
  }
  private events(): void {
    const s = this.state;
    if (s.elapsed < s.eventClock + B.eventInterval) return;
    s.eventClock = s.elapsed;
    const kinds = [
        "health",
        "speed",
        "attack",
        "invulnerable",
        "critical",
        "magnet",
      ] as const,
      angle = this.random() * Math.PI * 2,
      x = clamp(s.player.x + Math.cos(angle) * 130, 64, 3000),
      y = clamp(s.player.y + Math.sin(angle) * 130, 64, 2200);
    const kind = kinds[Math.floor(this.random() * kinds.length)];
    if (kind === "health") this.dropHealing(x, y, 20);
    else if (!dungeonBlocked(s.dungeon, x, y) && s.pickups.length < 1000)
      s.pickups.push({
        id: this.nextId(),
        x,
        y,
        kind,
        amount: 25,
      });
    if (
      !s.foundPet &&
      !s.pickups.some((p) => p.kind === "pet") &&
      s.pickups.length < 1000 &&
      !dungeonBlocked(s.dungeon, x, y) &&
      this.random() < B.petFindChance
    )
      s.pickups.push({
        id: this.nextId(),
        x,
        y,
        kind: "pet",
        amount: 0,
        species: this.random() < 0.5 ? "dog" : "cat",
      });
  }
  snapshot(): DungeonSnapshot {
    return structuredClone(this.state);
  }
  restore(snapshot: DungeonSnapshot): void {
    this.state = structuredClone(snapshot);
    if (
      this.state.timedBossCount === undefined &&
      DUNGEONS[this.state.dungeon].mode === "timed"
    )
      this.state.timedBossCount = TIMED_BOSS_SCHEDULE.filter(
        (b) => b.at < this.state.elapsed,
      ).length;
    Object.assign(
      this.state.player,
      safeDungeonPoint(
        this.state.dungeon,
        this.state.player.x,
        this.state.player.y,
      ),
    );
    for (const enemy of this.state.enemies) {
      const free = safeDungeonPoint(this.state.dungeon, enemy.x, enemy.y);
      if (free.x !== enemy.x || free.y !== enemy.y) {
        delete enemy.detour;
        if (enemy.boss) {
          delete enemy.boss.action;
          enemy.boss.cooldown = 5;
        }
      }
      Object.assign(enemy, free);
      if (
        enemy.detour &&
        dungeonBlocked(this.state.dungeon, enemy.detour.x, enemy.detour.y)
      )
        delete enemy.detour;
    }
    if (this.state.pet)
      Object.assign(
        this.state.pet,
        safeDungeonPoint(
          this.state.dungeon,
          this.state.pet.x,
          this.state.pet.y,
        ),
      );
    this.state.cards = this.state.cards.map((card) => {
      if (card.kind === "arsenal")
        return {
          ...card,
          name: WEAPONS[card.id].name,
          effect: WEAPON_DESCRIPTIONS[card.id],
          rarity: "arsenal",
          level: 0,
          max: 1,
        };
      const u = UPGRADES.find((u) => u.id === card.id)!;
      return {
        kind: "upgrade",
        id: u.id,
        name: u.name,
        rarity: u.rarity,
        level: this.level(u.id),
        max: u.max,
        effect: u.effect,
      };
    });
    this.effects.length = 0;
    this.impacts.length = 0;
    this.accumulator = 0;
    this.spatial.rebuild(this.state.enemies);
  }
  result(): RunResult {
    const s = this.state;
    if (!terminal(s.phase)) throw new Error("Partida ainda em andamento");
    return {
      id: s.id,
      dungeon: s.dungeon,
      outcome: s.phase as RunResult["outcome"],
      kills: s.kills,
      elapsed: s.elapsed,
      level: s.level,
      round: s.round,
      completedRounds:
        DUNGEONS[s.dungeon].mode === "waves"
          ? Math.min(
              50,
              Math.max(0, s.round - 1) +
                (s.waveRemaining === 0 && !s.enemies.some((e) => e.hp > 0)
                  ? 1
                  : 0),
            )
          : 0,
      petId: s.pet?.id,
      foundPet: s.foundPet,
      foundPetRare: s.foundPetRare,
    };
  }
}
