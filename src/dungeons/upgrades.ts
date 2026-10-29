import { DUNGEON_BALANCE, WEAPONS, type WeaponId, type Rarity } from "./config";
import { WEAPON_DESCRIPTIONS } from "./weapon-identity";
export interface Upgrade {
  id: string;
  name: string;
  rarity: Rarity;
  max: number;
  perLevel: number;
  effect: string;
  weapon?: WeaponId;
  pet?: boolean;
  requires?: Readonly<Record<string, number>>;
}
const upgrade = (
  id: string,
  name: string,
  rarity: Rarity,
  max: number,
  perLevel: number,
  effect: string,
  extra: Partial<Upgrade> = {},
): Upgrade => ({ id, name, rarity, max, perLevel, effect, ...extra });
export const UPGRADES: readonly Upgrade[] = [
  upgrade(
    "xp",
    "Experiência Acelerada",
    "common",
    10,
    0.05,
    "+5% de experiência por nível",
  ),
  upgrade(
    "advanced-xp",
    "Aprendizado Intensivo",
    "super-rare",
    4,
    0.15,
    "+15% de experiência por melhoria; até +60%",
  ),
  upgrade(
    "advanced-attack",
    "Potência de Combate",
    "super-rare",
    4,
    0.15,
    "+15% de dano das armas por melhoria; até +60%",
  ),
  upgrade(
    "boss-damage",
    "Dano contra Chefes",
    "super-rare",
    4,
    0.2,
    "+20% de dano das armas contra chefes por melhoria; até +80%",
  ),
  upgrade(
    "pickup",
    "Coleta Ampliada",
    "common",
    10,
    0.15,
    "+15% de alcance para atrair experiência; até +150%",
  ),
  upgrade(
    "movement",
    "Velocidade de Movimento",
    "common",
    5,
    0.03,
    "+3% de velocidade",
  ),
  upgrade("health", "Vida Máxima", "common", 5, 0.05, "+5% de vida máxima"),
  upgrade(
    "regeneration",
    "Recuperação de Vida",
    "common",
    5,
    DUNGEON_BALANCE.regenerationPerLevel,
    "Recuperação gradual configurável",
  ),
  ...(
    [
      ["defense", "Defesa", 5, 0.05],
      ["melee", "Ataque Corpo a Corpo", 5, 0.05],
      ["ranged", "Ataque à Distância", 5, 0.05],
      ["accuracy", "Precisão", 5, 0.05],
      ["attack-speed", "Velocidade de Ataque", 5, 0.05],
      ["reload", "Velocidade de Recarga", 5, 0.05],
      ["piercing", "Perfuração", 2, 1],
      ["range", "Alcance de Ataques", 4, 0.08],
    ] as const
  ).map(([id, name, max, amount]) =>
    upgrade(
      id,
      name,
      "rare",
      max,
      amount,
      amount < 1
        ? `+${Math.round(amount * 100)}% por nível`
        : "+1 alvo por nível",
    ),
  ),
  upgrade(
    "special-cooldown",
    "Recarga Especial",
    "super-rare",
    3,
    0.1,
    "+10% de frequência das habilidades especiais",
  ),
  upgrade(
    "fast-recovery",
    "Recuperação Acelerada",
    "super-rare",
    3,
    DUNGEON_BALANCE.rareRegenPerLevel,
    "Recuperação adicional configurável",
  ),
  upgrade(
    "special-efficiency",
    "Eficiência Especial",
    "super-rare",
    3,
    0.15,
    "+15% de eficiência dos ataques especiais",
  ),
  ...(
    [
      ["pet-speed", "Velocidade de Ataque do Pet", 0.1],
      ["pet-damage", "Dano do Pet", 0.15],
      ["pet-resistance", "Resistência do Pet", 0.15],
      ["pet-protection", "Proteção do Pet", 0.05],
      ["pet-cooldown", "Recarga Especial do Pet", 0.1],
    ] as const
  ).map(([id, name, amount]) =>
    upgrade(
      id,
      name,
      "super-rare",
      3,
      amount,
      `+${Math.round(amount * 100)}% por nível`,
      { pet: true },
    ),
  ),
  upgrade(
    "last-stand",
    "Última Resistência",
    "legendary",
    1,
    1,
    "Abaixo de 20% de vida, velocidade e recuperação por 8s; uma vez por partida",
  ),
  upgrade(
    "deadly-precision",
    "Precisão Mortal",
    "legendary",
    1,
    1,
    "Acertos sucessivos no mesmo alvo ampliam o dano temporariamente",
  ),
  upgrade(
    "relentless-companion",
    "Companheiro Implacável",
    "legendary",
    1,
    1,
    "Duas execuções consecutivas da habilidade especial do pet",
    { pet: true },
  ),
  upgrade(
    "survival-instinct",
    "Instinto de Sobrevivência",
    "legendary",
    1,
    1,
    "Inimigos especiais podem deixar suprimentos de recuperação",
  ),
  upgrade(
    "specialized-arsenal",
    "Arsenal Especializado",
    "legendary",
    1,
    0.15,
    "+15% de eficiência das evoluções das armas equipadas",
  ),
  ...(
    [
      ["sword-damage", "Corte Poderoso", "sword", "rare", 5, 0.05],
      ["sword-speed", "Golpes Rápidos", "sword", "rare", 5, 0.05],
      ["sword-range", "Alcance Aprimorado", "sword", "rare", 4, 0.08],
      ["sword-wide", "Corte Amplo", "sword", "super-rare", 2, 1],
      ["bow-speed", "Disparo Rápido", "bow", "rare", 4, 0.05],
      ["bow-piercing", "Perfuração do Arco", "bow", "rare", 2, 1],
      ["bow-accuracy", "Precisão Aprimorada", "bow", "rare", 5, 0.05],
      ["bow-double", "Flecha Adicional", "bow", "super-rare", 1, 1],
      ["spear-range", "Lança Alongada", "spear", "rare", 4, 0.08],
      ["spear-piercing", "Perfuração Aprimorada", "spear", "rare", 2, 1],
      ["spear-speed", "Estocada Rápida", "spear", "super-rare", 3, 0.1],
      ["boomerang-speed", "Voo Rápido", "boomerang", "rare", 4, 0.08],
      ["boomerang-range", "Alcance Estendido", "boomerang", "rare", 4, 0.1],
      ["boomerang-double", "Lançamento Duplo", "boomerang", "super-rare", 1, 1],
      ["hammer-damage", "Impacto Poderoso", "hammer", "rare", 5, 0.05],
      ["hammer-speed", "Golpe Rápido", "hammer", "rare", 4, 0.05],
      ["hammer-area", "Impacto Ampliado", "hammer", "super-rare", 3, 0.1],
      ["blade-range", "Raio Ampliado", "rotating-blade", "rare", 5, 0.1],
      ["blade-damage", "Lâmina Reforçada", "rotating-blade", "rare", 5, 0.05],
      [
        "blade-speed",
        "Rotação Acelerada",
        "rotating-blade",
        "super-rare",
        3,
        0.08,
      ],
      ["shield-push", "Impacto Defensivo", "orbiting-shield", "rare", 4, 0.05],
      ["shield-speed", "Recarga do Escudo", "orbiting-shield", "rare", 4, 0.05],
      [
        "shield-protection",
        "Onda Ampliada",
        "orbiting-shield",
        "super-rare",
        3,
        0.05,
      ],
    ] as const
  ).map(([id, name, weapon, rarity, max, amount]) =>
    upgrade(
      id,
      name,
      rarity,
      max,
      amount,
      amount < 1
        ? `+${Math.round(amount * 100)}% por nível`
        : "+1 alvo/projétil por nível",
      { weapon },
    ),
  ),
  upgrade(
    "sword-dual",
    "Espadas Duplas",
    "legendary",
    1,
    0.6,
    "Segundo corte frontal alternado, com 60% do dano, no mesmo espaço",
    { weapon: "sword", requires: { "sword-speed": 2, "sword-wide": 1 } },
  ),
  upgrade(
    "bow-triple",
    "Disparo Triplo",
    "legendary",
    1,
    3,
    "Três flechas direcionadas, priorizando alvos diferentes; substitui o disparo duplo",
    { weapon: "bow", requires: { "bow-double": 1 } },
  ),
  upgrade(
    "spear-fan",
    "Estocada em Leque",
    "legendary",
    1,
    3,
    "Três linhas de perfuração; cada inimigo recebe um acerto por ataque",
    { weapon: "spear" },
  ),
  upgrade(
    "boomerang-cross",
    "Trajetória Cruzada",
    "legendary",
    1,
    1,
    "Dois bumerangues em sentidos opostos; atingem grupos na ida e na volta",
    { weapon: "boomerang" },
  ),
  upgrade(
    "hammer-double",
    "Martelada Dupla",
    "legendary",
    1,
    2,
    "Dois impactos consecutivos com recuo do grupo",
    { weapon: "hammer" },
  ),
  upgrade(
    "blade-double",
    "Lâminas Duplas",
    "legendary",
    1,
    2,
    "Duas lâminas em posições opostas, com velocidade de órbita melhorável",
    { weapon: "rotating-blade" },
  ),
  upgrade(
    "shield-double",
    "Barreira de Impacto",
    "legendary",
    1,
    2,
    "Duas cargas para absorver golpes e onda de repulsão 25% maior",
    { weapon: "orbiting-shield" },
  ),
];
export type UpgradeCard =
  | {
      kind: "upgrade";
      id: string;
      name: string;
      rarity: Rarity;
      level: number;
      max: number;
      effect: string;
    }
  | {
      kind: "arsenal";
      id: WeaponId;
      name: string;
      rarity: "arsenal";
      level: 0;
      max: 1;
      effect: string;
    };
export interface UpgradeBuild {
  level?: number;
  weapons: WeaponId[];
  levels: Record<string, number>;
  pet?: unknown;
}
export function eligibleUpgrades(build: UpgradeBuild): Upgrade[] {
  return UPGRADES.filter(
    (u) =>
      (build.levels[u.id] ?? 0) < u.max &&
      (!u.weapon || build.weapons.includes(u.weapon)) &&
      (!u.pet || !!build.pet) &&
      Object.entries(u.requires ?? {}).every(
        ([id, level]) => (build.levels[id] ?? 0) >= level,
      ),
  );
}
export function rollUpgradeCards(
  build: UpgradeBuild,
  random: () => number,
  weights: Record<Rarity, number> = DUNGEON_BALANCE.rarityWeights,
): UpgradeCard[] {
  const pool: { card: UpgradeCard; weight: number }[] = eligibleUpgrades(
    build,
  ).map((u) => ({
    card: {
      kind: "upgrade",
      id: u.id,
      name: u.name,
      rarity: u.rarity,
      level: build.levels[u.id] ?? 0,
      max: u.max,
      effect: u.effect,
    },
    weight: weights[u.rarity],
  }));
  const scheduledOffer =
    build.level !== undefined &&
    build.level >= DUNGEON_BALANCE.arsenalFirstOfferLevel &&
    (build.level - DUNGEON_BALANCE.arsenalFirstOfferLevel) %
      DUNGEON_BALANCE.arsenalOfferEveryLevels ===
      0;
  const weaponOffer = build.level === undefined || scheduledOffer;
  if (weaponOffer && build.weapons.length < DUNGEON_BALANCE.maxWeapons)
    for (const id of Object.keys(WEAPONS) as WeaponId[])
      if (!build.weapons.includes(id))
        pool.push({
          card: {
            kind: "arsenal",
            id,
            name: WEAPONS[id].name,
            rarity: "arsenal",
            level: 0,
            max: 1,
            effect: WEAPON_DESCRIPTIONS[id],
          },
          weight: DUNGEON_BALANCE.arsenalWeight,
        });
  for (let i = pool.length - 1; i >= 0; i--)
    if (pool[i].weight <= 0) pool.splice(i, 1);
  const chosen: UpgradeCard[] = [];
  if (scheduledOffer && build.weapons.length < DUNGEON_BALANCE.maxWeapons) {
    const arsenal = pool.filter((p) => p.card.kind === "arsenal");
    while (chosen.length < 3 && arsenal.length) {
      const index = Math.floor(
        Math.max(0, Math.min(0.999999, random())) * arsenal.length,
      );
      chosen.push(arsenal.splice(index, 1)[0].card);
    }
    return chosen;
  }
  while (chosen.length < 3 && pool.length) {
    const total = pool.reduce((n, p) => n + Math.max(0, p.weight), 0);
    let ticket = Math.max(0, Math.min(0.999999, random())) * total,
      index = 0;
    for (; index < pool.length - 1; index++) {
      ticket -= Math.max(0, pool[index].weight);
      if (ticket < 0) break;
    }
    chosen.push(pool.splice(index, 1)[0].card);
  }
  return chosen;
}

export function nextWeaponOfferLevel(level: number): number {
  const first = DUNGEON_BALANCE.arsenalFirstOfferLevel,
    interval = DUNGEON_BALANCE.arsenalOfferEveryLevels;
  return level < first
    ? first
    : first + (Math.floor((level - first) / interval) + 1) * interval;
}
