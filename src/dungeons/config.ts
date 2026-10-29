import type { ItemId } from "../types";
export type DungeonId = "abandoned-central-square" | "mall-parking";
export type WeaponId =
  | "sword"
  | "bow"
  | "spear"
  | "boomerang"
  | "hammer"
  | "rotating-blade"
  | "orbiting-shield";
export type Rarity = "common" | "rare" | "super-rare" | "legendary";
export type PetSpecies = "dog" | "cat";
export const DUNGEONS = {
  "abandoned-central-square": {
    name: "Praça Central Abandonada",
    mode: "timed",
    duration: 900,
    rounds: 0,
    difficulty: "Pressão crescente durante 15 minutos",
    width: 3072,
    height: 2304,
  },
  "mall-parking": {
    name: "Estacionamento de Shopping",
    mode: "waves",
    duration: 0,
    rounds: 50,
    difficulty: "50 rodadas com hordas progressivas",
    width: 3072,
    height: 2304,
  },
} as const;
export const DUNGEON_BALANCE = {
  transitionSeconds: 5,
  maxWeapons: 4,
  maxEnemies: 240,
  maxProjectiles: 160,
  maxEffects: 48,
  fixedStep: 1 / 30,
  contactGrace: 0.65,
  shieldRecharge: 6,
  shieldPulseRadius: 90,
  shieldPush: 24,
  enemyHealth: 20,
  enemyDamage: 8,
  enemySpeed: 30,
  playerHealth: 100,
  playerSpeed: 84,
  enemyXP: 3,
  pickupRadius: 70,
  regenerationPerLevel: 0.12,
  rareRegenPerLevel: 0.35,
  petFindChance: 0.02,
  rarePetChance: 0.05,
  materialRewards: [
    { item: "scrap", killsPerUnit: 80, max: 3 },
    { item: "cloth", killsPerUnit: 200, max: 2 },
    { item: "metalPart", killsPerUnit: 0, max: 1 },
  ] as readonly { item: ItemId; killsPerUnit: number; max: number }[],
  rarityWeights: {
    common: 60,
    rare: 30,
    "super-rare": 9,
    legendary: 1,
  } as Record<Rarity, number>,
  arsenalWeight: 16,
  spawnInterval: 2.2,
  eventInterval: 45,
  eventDuration: 12,
  eventSpeedBonus: 0.3,
  eventAttackBonus: 0.3,
  lastStandDuration: 8,
  lastStandSpeedBonus: 0.3,
  lastStandRegeneration: 5,
  baseAccuracy: 0.7,
  reward: {
    coinsPerKill: 0.03,
    coinsPerMinute: 1,
    maxCoins: 30,
    permanentXPPerKill: 1,
    permanentXPOnWin: 50,
  },
} as const;
export const WEAPONS: Record<
  WeaponId,
  {
    name: string;
    damage: number;
    cooldown: number;
    range: number;
    kind: "melee" | "ranged";
    speed: number;
  }
> = {
  sword: {
    name: "Espada",
    damage: 22,
    cooldown: 0.85,
    range: 74,
    kind: "melee",
    speed: 0,
  },
  bow: {
    name: "Arco",
    damage: 11,
    cooldown: 1.4,
    range: 380,
    kind: "ranged",
    speed: 320,
  },
  spear: {
    name: "Lança",
    damage: 18,
    cooldown: 1.6,
    range: 135,
    kind: "melee",
    speed: 0,
  },
  boomerang: {
    name: "Bumerangue",
    damage: 12,
    cooldown: 2.1,
    range: 230,
    kind: "ranged",
    speed: 210,
  },
  hammer: {
    name: "Martelo",
    damage: 25,
    cooldown: 2.4,
    range: 90,
    kind: "melee",
    speed: 0,
  },
  "rotating-blade": {
    name: "Arma Rotativa",
    damage: 9,
    cooldown: 0.5,
    range: 82,
    kind: "melee",
    speed: 0,
  },
  "orbiting-shield": {
    name: "Escudo de Choque",
    damage: 0,
    cooldown: DUNGEON_BALANCE.shieldRecharge,
    range: DUNGEON_BALANCE.shieldPulseRadius,
    kind: "melee",
    speed: 0,
  },
};
export const PETS = {
  dog: {
    name: "Cão",
    damage: 8,
    health: 70,
    speed: 112,
    cooldown: 1.5,
    specialCooldown: 15,
    protection: 0.05,
  },
  cat: {
    name: "Gato",
    damage: 6,
    health: 45,
    speed: 140,
    cooldown: 1.1,
    specialCooldown: 12,
    protection: 0.02,
  },
} as const;
