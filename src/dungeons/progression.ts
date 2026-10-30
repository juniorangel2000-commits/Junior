import { validWorldPetState, type WorldPetState } from "./world-pet-state";
import { Inventory } from "../systems/inventory";
import { ITEM_IDS } from "../data/items";
import type { ItemId } from "../types";
import type { PetSpecies, DungeonId } from "./config";
import type { SaveData } from "../types";
import { DUNGEON_BALANCE, DUNGEONS } from "./config";
export const CHARACTER_ATTRIBUTES = [
  "strength",
  "resistance",
  "agility",
  "vitality",
  "precision",
  "survival",
] as const;
export type Attribute = (typeof CHARACTER_ATTRIBUTES)[number];
export const PET_ATTRIBUTES = [
  "speed",
  "resistance",
  "perception",
  "protection",
  "efficiency",
] as const;
export type PetAttribute = (typeof PET_ATTRIBUTES)[number];
export interface OwnedPet {
  world?: WorldPetState;
  id: string;
  species: PetSpecies;
  rare: boolean;
  xp: number;
  attributes: Record<PetAttribute, number>;
}
export interface DungeonProgress {
  version: 1;
  xp: number;
  attributes: Record<Attribute, number>;
  pets: OwnedPet[];
  selectedPet?: string;
  completed: Record<DungeonId, number>;
  recentResults: string[];
  pendingMaterials?: Partial<Record<ItemId, number>>;
  petForageDay?: number;
}
export const createDungeonProgress = (): DungeonProgress => ({
  version: 1,
  xp: 0,
  attributes: {
    strength: 0,
    resistance: 0,
    agility: 0,
    vitality: 0,
    precision: 0,
    survival: 0,
  },
  pets: [],
  completed: { "abandoned-central-square": 0, "mall-parking": 0 },
  recentResults: [],
});
const record = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const count = (v: unknown, max = 999999999): v is number =>
  Number.isSafeInteger(v) && Number(v) >= 0 && Number(v) <= max;
export function validDungeonProgress(value: unknown): value is DungeonProgress {
  if (
    !record(value) ||
    value.version !== 1 ||
    !count(value.xp) ||
    !record(value.attributes) ||
    !CHARACTER_ATTRIBUTES.every((a) =>
      count((value.attributes as Record<string, unknown>)[a], 20),
    ) ||
    !Array.isArray(value.pets) ||
    value.pets.length > 100 ||
    !record(value.completed) ||
    !count(value.completed["abandoned-central-square"]) ||
    !count(value.completed["mall-parking"]) ||
    !Array.isArray(value.recentResults) ||
    value.recentResults.length > 64 ||
    value.recentResults.some(
      (id) => typeof id !== "string" || !/^[\w-]{1,90}$/.test(id),
    )
  )
    return false;
  if (
    value.pendingMaterials !== undefined &&
    (!record(value.pendingMaterials) ||
      Object.entries(value.pendingMaterials).some(
        ([id, n]) => !ITEM_IDS.includes(id as ItemId) || !count(n, 999999),
      ))
  )
    return false;
  if (value.petForageDay !== undefined && !count(value.petForageDay, 999999))
    return false;
  const ids = new Set<string>();
  for (const p of value.pets) {
    if (
      !record(p) ||
      typeof p.id !== "string" ||
      !/^[\w-]{1,90}$/.test(p.id) ||
      ids.has(p.id) ||
      !["dog", "cat"].includes(p.species as string) ||
      typeof p.rare !== "boolean" ||
      !count(p.xp) ||
      (p.world !== undefined && !validWorldPetState(p.world)) ||
      !record(p.attributes) ||
      !PET_ATTRIBUTES.every((a) =>
        count((p.attributes as Record<string, unknown>)[a], 20),
      )
    )
      return false;
    ids.add(p.id);
  }
  return (
    value.selectedPet === undefined ||
    (typeof value.selectedPet === "string" && ids.has(value.selectedPet))
  );
}
export function permanentUpgradeCost(rank: number, pet = false): number {
  if (!Number.isSafeInteger(rank) || rank < 0 || rank >= 20) return 0;
  return pet
    ? 120 + rank * 50 + rank * rank * 8
    : 150 + rank * 60 + rank * rank * 10;
}
export function buyPermanentAttribute(
  progress: DungeonProgress,
  key: Attribute,
  petId?: string,
  petKey?: PetAttribute,
): boolean {
  const pet = petId ? progress.pets.find((p) => p.id === petId) : undefined;
  if (petId && !pet) return false;
  if (pet) {
    if (!petKey || !PET_ATTRIBUTES.includes(petKey)) return false;
    const cost = permanentUpgradeCost(pet.attributes[petKey], true);
    if (cost <= 0 || pet.attributes[petKey] >= 20 || pet.xp < cost)
      return false;
    pet.xp -= cost;
    pet.attributes[petKey]++;
    return true;
  }
  if (!CHARACTER_ATTRIBUTES.includes(key)) return false;
  const cost = permanentUpgradeCost(progress.attributes[key]);
  if (cost <= 0 || progress.attributes[key] >= 20 || progress.xp < cost)
    return false;
  progress.xp -= cost;
  progress.attributes[key]++;
  return true;
}
export interface RunResult {
  id: string;
  dungeon: DungeonId;
  outcome: "victory" | "defeat" | "abandoned";
  kills: number;
  elapsed: number;
  level?: number;
  round?: number;
  completedRounds?: number;
  petId?: string;
  foundPet?: PetSpecies;
  foundPetRare?: boolean;
}
export interface DungeonReward {
  applied: boolean;
  coins: number;
  xp: number;
  progressXP?: number;
  levelXP?: number;
  victoryXP?: number;
  learningXP?: number;
  completedRounds?: number;
  materials?: Partial<Record<ItemId, number>>;
  waiting?: boolean;
}
/** Apply a completed run once; temporary levels/builds never enter SaveData. */
export function applyDungeonResult(
  save: SaveData,
  result: RunResult,
): DungeonReward {
  if (
    (result.level !== undefined &&
      (!Number.isSafeInteger(result.level) ||
        result.level < 1 ||
        result.level > 1e9)) ||
    (result.round !== undefined &&
      (!Number.isSafeInteger(result.round) ||
        result.round < 1 ||
        result.round > 50)) ||
    (result.completedRounds !== undefined &&
      (!Number.isSafeInteger(result.completedRounds) ||
        result.completedRounds < 0 ||
        result.completedRounds > 50 ||
        (result.round !== undefined &&
          result.completedRounds > result.round))) ||
    !/^[\w-]{1,90}$/.test(result.id) ||
    !Number.isSafeInteger(result.kills) ||
    result.kills < 0 ||
    result.kills > 1000000 ||
    !Number.isFinite(result.elapsed) ||
    result.elapsed < 0 ||
    result.elapsed > 1e9 ||
    !["victory", "defeat", "abandoned"].includes(result.outcome) ||
    !["abandoned-central-square", "mall-parking"].includes(result.dungeon)
  )
    return { applied: false, coins: 0, xp: 0 };
  const p = (save.dungeons ??= createDungeonProgress());
  if (p.recentResults.includes(result.id))
    return { applied: false, coins: 0, xp: 0 };
  const b = DUNGEON_BALANCE.reward;
  const timed = DUNGEONS[result.dungeon].mode === "timed";
  const seconds = Math.min(result.elapsed, 900);
  const completedRounds = timed
    ? 0
    : (result.completedRounds ??
      (result.outcome === "victory"
        ? 50
        : Math.max(0, (result.round ?? 1) - 1)));
  const active = result.kills > 0;
  const levelProgress = active
    ? Math.min((result.level ?? 1) - 1, result.kills * 2)
    : 0;
  const progressXP = !active
    ? 0
    : Math.floor(
        timed ? (seconds / 60) * b.xpPerMinute : completedRounds * b.xpPerRound,
      );
  const levelXP = levelProgress * b.xpPerLevel;
  const victoryXP =
    active && result.outcome === "victory" ? b.permanentXPOnWin : 0;
  const baseXP = progressXP + levelXP + victoryXP;
  // Reconstruct earned character XP from wallet + purchases, so spending cannot
  // reset the learning window. Existing saves need no extra counters or migration.
  const careerXP =
    p.xp +
    Object.values(p.attributes).reduce((total, rank) => {
      for (let i = 0; i < rank; i++) total += permanentUpgradeCost(i);
      return total;
    }, 0);
  const learningXP =
    result.outcome !== "abandoned" &&
    (timed ? seconds >= 120 : completedRounds >= 2) &&
    result.kills >= 20
      ? Math.max(
          0,
          Math.min(
            b.learningMinimumXP - baseXP,
            b.learningCareerLimit - careerXP - baseXP,
          ),
        )
      : 0;
  const xp = baseXP + learningXP;
  const coins =
    result.outcome === "abandoned" || !active
      ? 0
      : Math.min(
          b.maxCoins,
          Math.floor(
            (timed
              ? (seconds / 60) * b.coinsPerMinute
              : completedRounds * b.coinsPerRound) +
              levelProgress * b.coinsPerLevel +
              (result.outcome === "victory" ? b.coinsOnWin : 0),
          ),
        );
  // Normalize a completed challenge to 15 progress points in either mode.
  const materialProgress = !active
    ? 0
    : (timed ? seconds / 60 : completedRounds * 0.3) + levelProgress / 20;
  p.xp = Math.min(999999999, p.xp + xp);
  const pet = p.pets.find((p) => p.id === result.petId);
  if (pet) pet.xp = Math.min(999999999, pet.xp + xp);
  if (result.outcome === "victory")
    p.completed[result.dungeon] = Math.min(
      999999999,
      p.completed[result.dungeon] + 1,
    );
  if (
    result.foundPet &&
    ["dog", "cat"].includes(result.foundPet) &&
    p.pets.length < 100
  )
    p.pets.push({
      id: "pet-" + result.id,
      species: result.foundPet,
      rare: result.foundPetRare ?? false,
      xp: 0,
      attributes: {
        speed: 0,
        resistance: 0,
        perception: 0,
        protection: 0,
        efficiency: 0,
      },
    });
  save.villageEconomy ??= { coins: 0, met: [] };
  save.villageEconomy.coins = Math.min(
    999999999,
    save.villageEconomy.coins + coins,
  );
  const materials: Partial<Record<ItemId, number>> = {};
  if (result.outcome !== "abandoned")
    for (const rule of DUNGEON_BALANCE.materialRewards) {
      const quantity = rule.progressPerUnit
        ? Math.min(
            rule.max,
            Math.floor(materialProgress / rule.progressPerUnit),
          )
        : active && result.outcome === "victory"
          ? rule.max
          : 0;
      if (quantity) {
        materials[rule.item] = quantity;
        p.pendingMaterials ??= {};
        p.pendingMaterials[rule.item] = Math.min(
          999999,
          (p.pendingMaterials[rule.item] ?? 0) + quantity,
        );
      }
    }
  claimDungeonMaterials(save);
  p.recentResults.push(result.id);
  p.recentResults = p.recentResults.slice(-64);
  return {
    applied: true,
    coins,
    xp,
    progressXP,
    levelXP,
    victoryXP,
    learningXP,
    completedRounds,
    materials,
    waiting: Object.keys(p.pendingMaterials ?? {}).length > 0,
  };
}

export function claimDungeonMaterials(save: SaveData): void {
  const pending = save.dungeons?.pendingMaterials;
  if (!pending) return;
  const inventory = new Inventory(save.inventory);
  for (const [item, amount] of Object.entries(pending))
    if (inventory.transact({}, { [item]: amount })) {
      delete pending[item as ItemId];
    }
  Object.assign(save.inventory, inventory.data);
}
