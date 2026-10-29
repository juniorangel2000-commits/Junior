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
import { EnemySpatialIndex } from "./spatial";
import { DUNGEON_ENTRY, dungeonBlocked } from "./maps";
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
  streak: number;
  lastHit: number;
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
  kind: "xp" | "health" | "speed" | "attack" | "invulnerable" | "pet";
  amount: number;
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
}
export type RunPhase =
  "fighting" | "choice" | "paused" | "victory" | "defeat" | "abandoned";
export interface RunPet {
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
  buffs: Record<string, number>;
  lastStandUsed: boolean;
  permanent: DungeonProgress["attributes"];
  orbitalHits: Record<string, number>;
  pendingAttacks: {
    at: number;
    weapon: WeaponId;
    x: number;
    y: number;
    damage: number;
    radius: number;
  }[];
}
const upgradeAmounts = new Map(UPGRADES.map((u) => [u.id, u.perLevel]));
const terminal = (phase: RunPhase) =>
  ["victory", "defeat", "abandoned"].includes(phase);
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
export class DungeonRun {
  state: DungeonSnapshot;
  readonly effects: AttackEffect[] = [];
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
    const maxHp = B.playerHealth * (1 + progress.attributes.vitality * 0.03);
    this.state = {
      version: 1,
      id,
      dungeon,
      phase: "fighting",
      elapsed: 0,
      round: 1,
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
      pendingAttacks: [],
    };
    if (owned) {
      const c = PETS[owned.species],
        hp = c.health * (1 + owned.attributes.resistance * 0.05);
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
      (1 + this.state.permanent.vitality * 0.03 + this.bonus("health"))
    );
  }
  get moveSpeed(): number {
    return (
      B.playerSpeed *
      (1 +
        this.state.permanent.agility * 0.02 +
        this.bonus("movement") +
        (this.active("speed") ? B.eventSpeedBonus : 0) +
        (this.active("last-stand") ? B.lastStandSpeedBonus : 0))
    );
  }
  get xpNeeded(): number {
    return Math.floor(B.xpBase * B.xpGrowth ** (this.state.level - 1));
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
      if (id === "health")
        s.player.hp = Math.min(
          this.maxHealth,
          s.player.hp + B.playerHealth * 0.05,
        );
    }
    s.cards = [];
    s.phase = "fighting";
    this.checkLevel();
    return true;
  }
  grantXP(amount: number): void {
    if (!Number.isFinite(amount) || amount < 0 || terminal(this.state.phase))
      return;
    this.state.xp += amount * (1 + this.bonus("xp"));
    this.checkLevel();
  }
  private checkLevel(): void {
    const s = this.state;
    if (s.phase !== "fighting" || s.xp < this.xpNeeded) return;
    s.xp -= this.xpNeeded;
    s.level++;
    s.cards = rollUpgradeCards(s, this.random);
    if (s.cards.length) s.phase = "choice";
    else {
      s.player.hp = Math.min(this.maxHealth, s.player.hp + 10);
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
  private spawn(): boolean {
    const s = this.state;
    if (s.enemies.length >= B.maxEnemies) return false;
    let x = 0,
      y = 0,
      found = false;
    for (let i = 0; i < 18; i++) {
      const angle = this.random() * Math.PI * 2,
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
    const pressure =
        DUNGEONS[s.dungeon].mode === "timed" ? s.elapsed / 180 : s.round / 8,
      special = this.random() < Math.min(0.22, 0.03 + pressure * 0.02),
      kind = special
        ? "brute"
        : pressure > 1 && this.random() < 0.22
          ? "runner"
          : "walker";
    const health = B.enemyHealth * (1 + pressure * 0.32) * (special ? 3 : 1);
    s.enemies.push({
      id: this.nextId(),
      x,
      y,
      hp: health,
      maxHp: health,
      speed:
        B.enemySpeed *
        (kind === "runner" ? 1.6 : special ? 0.7 : 1) *
        (1 + Math.min(0.5, pressure * 0.05)),
      damage: B.enemyDamage * (1 + pressure * 0.12) * (special ? 1.5 : 1),
      special,
      kind,
      streak: 0,
      lastHit: 0,
    });
    return true;
  }
  private tick(dt: number): void {
    const s = this.state;
    s.elapsed += dt;
    s.player.invulnerable = Math.max(0, s.player.invulnerable - dt);
    for (const effect of this.effects) effect.ttl -= dt;
    for (let i = this.effects.length - 1; i >= 0; i--)
      if (this.effects[i].ttl <= 0) this.effects.splice(i, 1);
    s.player.hp = Math.min(
      this.maxHealth,
      s.player.hp +
        (s.permanent.survival * 0.02 +
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
    if (mode === "timed" && s.elapsed >= DUNGEONS[s.dungeon].duration) {
      s.phase = "victory";
      return;
    }
    if (s.intermission > 0) s.intermission = Math.max(0, s.intermission - dt);
    else {
      s.spawnClock -= dt;
      if (s.spawnClock <= 0 && (mode === "timed" || s.waveRemaining > 0)) {
        const n =
          mode === "timed"
            ? 1 + Math.floor(s.elapsed / 120)
            : Math.min(4, 1 + Math.floor(s.round / 12));
        for (
          let i = 0;
          i < n &&
          s.enemies.length < B.maxEnemies &&
          (mode === "timed" || s.waveRemaining > 0);
          i++
        ) {
          const spawned = this.spawn();
          if (spawned && mode === "waves") s.waveRemaining--;
        }
        s.spawnClock =
          mode === "timed"
            ? Math.max(0.3, B.spawnInterval - s.elapsed / 600)
            : 0.55;
      }
      if (mode === "waves" && s.waveRemaining === 0 && s.enemies.length === 0) {
        if (s.round >= DUNGEONS[s.dungeon].rounds) {
          s.phase = "victory";
          return;
        }
        s.round++;
        s.waveRemaining = 5 + s.round * 2;
        s.intermission = 3;
      }
    }
    for (const e of s.enemies) {
      const dx = s.player.x - e.x,
        dy = s.player.y - e.y,
        d = Math.hypot(dx, dy) || 1,
        speed = e.speed * dt;
      this.moveEnemy(e, (dx / d) * speed, (dy / d) * speed);
      if (
        d < 22 &&
        s.player.invulnerable === 0 &&
        !this.active("invulnerable")
      ) {
        const reduction = Math.min(
          0.75,
          this.bonus("defense") +
            s.permanent.resistance * 0.02 +
            (s.weapons.includes("orbiting-shield")
              ? this.bonus("shield-protection")
              : 0) +
            (s.pet && s.pet.hp > 0
              ? PETS[s.pet.species].protection +
                s.pet.attributes.protection * 0.01 +
                this.bonus("pet-protection")
              : 0),
        );
        s.player.hp -= Math.max(1, e.damage * (1 - reduction));
        s.player.invulnerable = B.contactGrace;
        if (s.player.hp <= 0) {
          s.player.hp = 0;
          s.phase = "defeat";
          return;
        }
      }
    }
    this.spatial.rebuild(s.enemies.filter((e) => e.hp > 0));
    for (const weapon of s.weapons) {
      s.cooldowns[weapon] = Math.max(0, (s.cooldowns[weapon] ?? 0) - dt);
      if (!s.cooldowns[weapon]) this.attack(weapon);
    }
    for (let i = this.delayed.length - 1; i >= 0; i--) {
      const a = this.delayed[i];
      if (a.at <= s.elapsed) {
        this.area(a.weapon, a.x, a.y, a.radius, a.damage);
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
  private moveEnemy(e: { x: number; y: number }, dx: number, dy: number): void {
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
          this.bonus(prefix + "-damage") +
          (w.kind === "melee" ? this.state.permanent.strength * 0.02 : 0) +
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
    });
  }
  private hit(e: Enemy, damage: number): void {
    if (e.hp <= 0) return;
    const s = this.state;
    if (this.level("deadly-precision")) {
      e.streak = s.elapsed - e.lastHit < 3 ? e.streak + 1 : 1;
      e.lastHit = s.elapsed;
      damage *= 1 + Math.min(0.5, e.streak * 0.04);
    }
    e.hp -= damage;
    if (e.hp > 0) return;
    s.kills++;
    if (s.pickups.length < 1000)
      s.pickups.push({
        id: this.nextId(),
        x: e.x,
        y: e.y,
        kind: "xp",
        amount: B.enemyXP * (e.special ? 4 : 1),
      });
    else this.grantXP(B.enemyXP * (e.special ? 4 : 1));
    if (e.special && this.level("survival-instinct") && this.random() < 0.6)
      s.pickups.push({
        id: this.nextId(),
        x: e.x + 10,
        y: e.y,
        kind: "health",
        amount: 20,
      });
  }
  private area(
    weapon: WeaponId,
    x: number,
    y: number,
    radius: number,
    damage: number,
  ): void {
    for (const e of this.spatial
      .query(x, y, radius)
      .filter((e) => e.hp > 0)
      .slice(0, weapon === "sword" ? 1 + this.level("sword-wide") : undefined))
      this.hit(e, damage);
    this.effect(weapon, x, y);
  }
  private attack(id: WeaponId): void {
    const s = this.state,
      p = s.player,
      w = this.weaponStats(id),
      targets = this.spatial
        .query(
          p.x,
          p.y,
          w.range +
            (id === "rotating-blade" || id === "orbiting-shield" ? 30 : 0),
        )
        .filter((e) => e.hp > 0)
        .sort(
          (a, b) =>
            Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y),
        );
    if (!targets.length) return;
    const target = targets[0],
      angle = Math.atan2(target.y - p.y, target.x - p.x);
    s.cooldowns[id] =
      id === "rotating-blade" || id === "orbiting-shield" ? 0 : w.cooldown;
    if (id === "sword") {
      const count = 1 + this.level("sword-wide");
      for (const e of targets.slice(0, count)) this.hit(e, w.damage);
      this.effect(id, p.x, p.y, angle);
      if (this.level("sword-dual"))
        this.delayed.push({
          at: s.elapsed + 0.18,
          weapon: id,
          x: p.x,
          y: p.y,
          damage: w.damage * 0.6,
          radius: w.range,
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
      for (
        let i = 0;
        i < count && s.projectiles.length < B.maxProjectiles;
        i++
      ) {
        const offset =
            (i - (count - 1) / 2) *
            (id === "bow" ? 0.12 : this.level("boomerang-cross") ? 0.6 : 0.2),
          a = angle + offset,
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
              s.permanent.precision * 0.01,
          ),
        });
        s.projectiles.push(projectile);
      }
    } else if (id === "spear") {
      for (const offset of this.level("spear-fan") ? [-0.3, 0, 0.3] : [0]) {
        const a = angle + offset,
          hits = targets.filter((e) => {
            const dx = e.x - p.x,
              dy = e.y - p.y,
              along = dx * Math.cos(a) + dy * Math.sin(a),
              across = Math.abs(-dx * Math.sin(a) + dy * Math.cos(a));
            return along >= 0 && along <= w.range && across < 18;
          });
        for (const e of hits.slice(
          0,
          1 + this.level("spear-piercing") + this.level("piercing"),
        ))
          this.hit(e, w.damage);
        this.effect(id, p.x, p.y, a);
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
        a = s.elapsed * (id === "rotating-blade" ? 3 : 2),
        n = double ? 2 : 1;
      for (let i = 0; i < n; i++) {
        const q = a + i * Math.PI,
          x = p.x + Math.cos(q) * w.range,
          y = p.y + Math.sin(q) * w.range;
        for (const e of this.spatial.query(x, y, 30)) {
          const key = id + "-" + e.id;
          if ((s.orbitalHits[key] ?? 0) > s.elapsed) continue;
          s.orbitalHits[key] = s.elapsed + w.cooldown;
          this.hit(e, w.damage);
          if (id === "orbiting-shield") {
            const d = Math.hypot(e.x - p.x, e.y - p.y) || 1,
              force = 16 * (1 + this.bonus("shield-push"));
            this.moveEnemy(
              e,
              ((e.x - p.x) / d) * force,
              ((e.y - p.y) / d) * force,
            );
          }
        }
        this.effect(id, x, y, q, i);
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
      if (p.distance >= p.range) {
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
    if (p.hp <= 0) {
      p.rest += dt;
      if (p.rest > 8) {
        p.hp = p.maxHp * 0.5;
        p.rest = 0;
      }
      return;
    }
    const dx = s.player.x - 35 - p.x,
      dy = s.player.y + 20 - p.y,
      d = Math.hypot(dx, dy) || 1,
      move = Math.min(d, c.speed * (1 + p.attributes.speed * 0.03) * dt);
    this.moveEnemy(p, (dx / d) * move, (dy / d) * move);
    p.attack = Math.max(0, p.attack - dt);
    p.special = Math.max(0, p.special - dt);
    const targets = this.spatial.query(p.x, p.y, 100).filter((e) => e.hp > 0);
    if (!targets.length) return;
    if (p.attack === 0) {
      this.hit(
        targets[0],
        c.damage *
          (1 + this.bonus("pet-damage") + p.attributes.efficiency * 0.03),
      );
      p.attack = c.cooldown / (1 + this.bonus("pet-speed"));
    }
    if (p.special === 0) {
      const n = this.level("relentless-companion") ? 2 : 1;
      for (let i = 0; i < n; i++)
        for (const e of targets) {
          this.hit(e, c.damage * 1.5 * (1 + p.attributes.efficiency * 0.05));
          if (p.species === "dog") {
            const d = Math.hypot(e.x - p.x, e.y - p.y) || 1;
            this.moveEnemy(e, ((e.x - p.x) / d) * 22, ((e.y - p.y) / d) * 22);
          }
        }
      p.special = c.specialCooldown / (1 + this.bonus("pet-cooldown"));
    }
    for (const e of targets)
      if (Math.hypot(e.x - p.x, e.y - p.y) < 18)
        p.hp = Math.max(
          0,
          p.hp -
            (e.damage * dt) /
              (1 +
                this.bonus("pet-resistance") +
                p.attributes.resistance * 0.05),
        );
  }
  private collect(dt: number): void {
    const s = this.state,
      r =
        B.pickupRadius *
        (1 +
          this.bonus("pickup") +
          (s.pet ? s.pet.attributes.perception * 0.03 : 0));
    for (let i = s.pickups.length - 1; i >= 0; i--) {
      const p = s.pickups[i],
        d = Math.hypot(p.x - s.player.x, p.y - s.player.y);
      if (p.kind === "xp" && d < r) {
        const speed = Math.min(d, 240 * dt);
        p.x += ((s.player.x - p.x) / (d || 1)) * speed;
        p.y += ((s.player.y - p.y) / (d || 1)) * speed;
      }
      if (d > 20) continue;
      s.pickups.splice(i, 1);
      if (p.kind === "xp") this.grantXP(p.amount);
      else if (p.kind === "health")
        s.player.hp = Math.min(this.maxHealth, s.player.hp + p.amount);
      else if (p.kind === "pet") {
        s.foundPet = p.species;
        s.foundPetRare = this.random() < B.rarePetChance;
      } else s.buffs[p.kind] = s.elapsed + B.eventDuration;
    }
  }
  private events(): void {
    const s = this.state;
    if (s.elapsed < s.eventClock + B.eventInterval) return;
    s.eventClock = s.elapsed;
    const kinds = ["health", "speed", "attack", "invulnerable"] as const,
      angle = this.random() * Math.PI * 2,
      x = clamp(s.player.x + Math.cos(angle) * 130, 64, 3000),
      y = clamp(s.player.y + Math.sin(angle) * 130, 64, 2200);
    if (!dungeonBlocked(s.dungeon, x, y) && s.pickups.length < 1000)
      s.pickups.push({
        id: this.nextId(),
        x,
        y,
        kind: kinds[Math.floor(this.random() * kinds.length)],
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
    this.state.cards = this.state.cards.map((card) => {
      if (card.kind === "arsenal")
        return {
          ...card,
          name: WEAPONS[card.id].name,
          effect: "Desbloqueia uma arma automática em um espaço livre",
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
      petId: s.pet?.id,
      foundPet: s.foundPet,
      foundPetRare: s.foundPetRare,
    };
  }
}
