import type {EconomyState,StockRecord} from './systems/economy';
import type {FiberPlant} from './data/fiber-plants';
import type {AnimalPosition,AnimalEscort} from './systems/animals';
import type {ResourceField} from './systems/resource-spawns';
import type { HomeData } from './systems/home';
import type { CharacterDirection } from './character-directions';
import type { MapEditData } from './systems/map-editor';
import type { CharacterId } from './data/characters';
import type {VillageProgress,VillageInstallation} from './data/village-progress';
export type {VillageProgress,VillageInstallation} from './data/village-progress';

export type HairStyle = 'curto' | 'longo' | 'preso';
export type CharacterAccessory = 'bolsa' | 'nenhum';
export interface CharacterProfile {
  name: string;
  /** Absent in older saves; render the default fixed character without rewriting them. */
  characterId?: CharacterId;
  /** Legacy appearance data is preserved in saves, but no longer changes player art. */
  skin: string;
  hairStyle: HairStyle;
  hairColor: string;
  outfit: string;
  /** Opcionais para manter partidas anteriores compatíveis. */
  shirtColor?: string;
  accessory?: CharacterAccessory;
}
export type ItemId = import('./data/crop-catalog').CropItemId | 'wood' | 'stone' | 'seeds' | 'turnip' | 'branch' | 'log' | 'plank' | 'scrap' | 'hatchet' | 'pickaxe' | 'hoe' | 'handsaw'
  | 'harvestBasket' | 'freshGrass' | 'hay' | 'egg' | 'milk' | 'milkPail' | 'hardwood' | 'fiber' | 'cord' | 'flakedStone' | 'handle' | 'peg' | 'blade' | 'board' | 'hammer'
  | 'herb' | 'rareHerb' | 'bandage' | 'herbalTonic' | 'fungalInfusion' | 'oakSeed' | 'pineSeed' | 'fertilizer' | 'fishingRod' | 'bait' | 'net' | 'fish' | 'rareFish' | 'meal'
  | 'ironShard' | 'ironOre' | 'ironIngot' | 'goldShard' | 'goldOre' | 'goldIngot' | 'blackMetalShard' | 'blackMetalOre' | 'blackMetalIngot' | 'sickle' | 'shovel' | 'furniture' | 'doorKit' | 'windowKit' | 'fenceKit' | 'forge' | 'mushroom'
  | 'sword' | 'lantern' | 'oldMap' | 'metalPart' | 'electronicPart' | 'waterPump' | 'lamp' | 'backpack' | 'boots' | 'cloth' | 'clothing' | 'accessory';
export type InventoryData = Record<ItemId, number> & {toolInstances?:import('./systems/tool-instances').ToolInventory};
export type OwnedTool = 'hatchet' | 'pickaxe' | 'hoe' | 'handsaw' | 'hammer';
export type Tool = 'hand' | 'plant' | 'water' | 'gate' | 'repair' | 'fence' | 'bench' | 'remove' | 'hatchet' | 'pickaxe' | 'hoe' | 'workbench' | 'wall' | 'door' | 'floor' | 'window' | 'roof' | 'blueprint' | 'farm-coop' | 'farm-barn' | 'farm-silo' | 'farm-stable';
export type QuickSlot = Tool | `item:${ItemId}` | `tool:${import('./systems/tool-instances').IndividualTool}:${number}` | 'item:wateringCan' | null;
export interface TilePoint { x: number; y: number }
/** growth: fração 0–1 derivada de days, mantida para o desenho e saves antigos.
 * watered: regada no dia `day`. Canteiros de saves antigos não têm crop/days/day e
 * são convertidos na primeira atualização (nabo, progresso proporcional). */
export interface CropData extends TilePoint { growth: number; watered: boolean; crop?: import('./data/crops').CropId; days?: number; day?: number }
export interface FarmingProgress { prepared: boolean; planted: boolean; watered: boolean; harvested: boolean }
export interface BuildingData extends TilePoint { kind: 'gate' | 'fence' | 'bench' | 'workbench' | 'wall' | 'door' | 'floor' | 'window' | 'roof'; open?: boolean; rotation?: 0 | 1 | 2 | 3; gateFlip?: boolean; fenceBuiltDay?: number }
export type ResourceKind = 'tree' | 'stone' | 'seeds' | 'scrap' | 'standingTree' | 'vein' | 'fiber' | 'fallenLog' | 'stump' | 'herb' | 'mushroom';
export interface ResourceNode extends TilePoint { id: string; kind: ResourceKind; metal?:import('./data/economy-balance').Metal; plant?: FiberPlant; treeSpecies?:'oak'|'pine';treeStage?:0|1|2|3;treePlanted?:boolean;treePlantingSoil?:boolean }
export interface ResourceProgressData { id: string; hits: number }
export interface ProgressData {
  collected: boolean;
  craftedTools: boolean;
  harvested: boolean;
  processed: boolean;
  builtWorkbench: boolean;
  sawn: boolean;
  builtShelter: boolean;
}
/** Coins and introductions survive travelling between the three scenarios. */
export interface VillageEconomy {
  coins: number;
  met: string[];
  stock?:Partial<Record<ItemId,StockRecord>>;
}
export interface SaveData {
  openFields?:import('./systems/open-fields').OpenFieldsState;
  horseTaming?:import('./systems/horse-taming').HorseTamingState;
  openFieldsPosition?:TilePoint & {direction?:CharacterDirection};
  groundItems?:import('./systems/ground-items').GroundItems;
  farmConstruction?:import('./systems/farm-construction').FarmConstruction;
  /** Alimentação e produção dos animais alojados (ovos e leite). */
  animalCare?:import('./systems/animal-production').AnimalCare;
  npcSocial?:import('./systems/npc-social-state').NpcSocialState;
  mineMissions?:import('./systems/mine-mission-state').MineMissionsState;
  mineRescue?:import('./systems/mine-rescue-state').MineRescueState;
  bentoExpedition?:import('./systems/bento-expedition-state').BentoExpeditionState;
  bentoWork?:import('./systems/bento-work-state').BentoWorkState;
  bentoTravel?:import('./systems/bento-travel-state').BentoTravelState;
  /** Mine position; legacy entrance coordinates until the underground layout is initialized. */
  underground?:import('./systems/underground').UndergroundState;
  /** Explicit underground scene; the Mina Antiga reception room remains separate. */
  miningInterior?:true;
  mineInterior?:import('./data/mine-room').MinePosition;
  highlandPosition?:TilePoint & {direction?:CharacterDirection};
  highlandMapEdits?:MapEditData;
  /** Outdoor equipment references an owned sword; missing keeps hands free. */
  worldWeapon?:'sword'|'unarmed';
  mineCollisionRevision?:2;
  communityCenter?:import('./systems/community-center').CommunityCenterData;
  communityInterior?:{x:number;y:number;direction?:CharacterDirection};
  survivorCamp?:import('./systems/survivor-camp').SurvivorCampState;
  survivorCampPosition?:TilePoint & {direction?:CharacterDirection};
  survivorCampMapEdits?:MapEditData;
  fisherTravel?:import('./systems/fisher-travel').FisherTravel;
  /** Most recent persisted catch; absent in older games. Fish stock remains compatible with village recipes/trades. */
  fishingProgress?:import('./systems/fishing-progress').FishingProgress;
  lastFishingHaul?:import('./data/fishing-catches').FishingHaul;
  petShelter?: import('./systems/pet-shelter').PetShelterData;
  dungeons?:import('./dungeons/progression').DungeonProgress;
  dungeonRun?:import('./dungeons/run').DungeonSnapshot;
  treeGrowth?:import('./systems/tree-growth').TreeGrowthData;
  economy6?:EconomyState;
  resourceFields?:{property:ResourceField;forest:ResourceField};
  resourceMilestones?:{felled:boolean;mined:boolean};
  mapBaseRevision?:number;
  propertyShoreRevision?:number;
  /** One-time homestead layout; removed starter fences/beds are never recreated. */
  homesteadRevision?:1;
  selectedCrop?:import('./data/crops').CropId;
  activeArea?: 'property' | 'forest' | 'village' | 'cityForest' | 'fishingLake' | 'survivorCamp' | 'highland' | 'openFields';
  fishingLakePosition?: TilePoint & { direction?: CharacterDirection };
  fishingLakeMapEdits?:MapEditData;
  cityForestPosition?: TilePoint & { direction?: CharacterDirection };
  forestPosition?: TilePoint & { direction?: CharacterDirection };
  villagePosition?: TilePoint & { direction?: CharacterDirection };
  blacksmithInterior?: TilePoint & {direction?:CharacterDirection};
  merchantInterior?:import('./systems/merchant-visit').ShopVisit;
  cityForestMapEdits?:MapEditData;
  dungeonMapEdits?:Partial<Record<import('./dungeons/config').DungeonId,MapEditData>>;
  villageMapEdits?:import('./systems/map-editor').MapEditData;
  merchantScenes?:Partial<Record<import('./systems/merchant-visit').ResidentId,import('./systems/smith-layout').SmithLayout>>;
  shopResidents?:import('./systems/merchant-visit').ShopResident[];
  blacksmithHome?:HomeData;
  blacksmithScene?:import('./systems/smith-layout').SmithLayout;
  blacksmithLayoutRevision?:2|3;
  bentoRoutine?:import('./systems/bento-routine').BentoRoutineState;
  villageRoutines?:Partial<Record<import('./systems/merchant-routine').RoutineId,import('./systems/merchant-routine').MerchantRoutineState>>;
  /** Absent in older saves; entering the village starts with zero coins. */
  villageEconomy?: VillageEconomy;
  villageProgress?: VillageProgress;
  /** false only for new games until Damião gifts the first rod. Missing preserves legacy access. */
  damiaoIntroduction?: boolean;
  villageInstallations?: VillageInstallation[];
  villageSurvivors?: string[];
  recruitedAnimals?: string[];
  animalPositions?: {forest:AnimalPosition[];property:AnimalPosition[]};
  animalEscort?: AnimalEscort;
  version: 4;
  quickbar?: QuickSlot[];
  wateringCanWater?: number;
  homeSupplies?: { wateringCan: boolean; seedPacket: boolean };
  profile: CharacterProfile;
  player: TilePoint & { direction?: CharacterDirection };
  inventory: InventoryData;
  crops: CropData[];
  /** Novos canteiros; a horta original continua preparada nos saves antigos. */
  preparedSoil?: TilePoint[];
  /** Quadrados da horta inicial que o jogador devolveu à grama. */
  restoredFarmSoil?: TilePoint[];
  farmingProgress?: FarmingProgress;
  buildings: BuildingData[];
  depletedResources: string[];
  resourceProgress: ResourceProgressData[];
  equippedTool: Tool;
  progress: ProgressData;
  day: number;
  time: number;
  metLia: boolean;
  /** Extensão opcional: partidas anteriores recebem a casa padrão ao entrar. */
  home?: HomeData;
  /** A posição externa permanece em player, para preservar o mundo e saves antigos. */
  homePosition?: TilePoint & { direction?: CharacterDirection };
  /** Edições esparsas preservam o mapa e os IDs das partidas anteriores. */
  mapEdits?: MapEditData;
  forestMapEdits?: MapEditData;
}
export interface HudData {
  selectedCrop?:import('./data/crops').CropId;
  health?:{current:number;max:number;contaminated?:boolean};
  mapTitle?:string;
  worldMapSize?:{width:number;height:number};
  worldWeapon?:SaveData['worldWeapon'];
  mapEditorAvailable?:boolean;
  interiorEditor?:boolean;
  toolConditions?:EconomyState['tools'];
  learnedRecipes?:string[];
  farmingProgress?: FarmingProgress;
  swimming?:boolean;
  area?: 'property'|'forest'|'village'|'cityForest'|'fishingLake'|'survivorCamp'|'highland'|'openFields';
  coins?: number;
  vigor?: number;
  wateringCan?: boolean;
  wateringCanWater?: number;
  inHome: boolean;
  playerTile?: TilePoint;
  interiorMapSize?: {width:number;height:number};
  name: string;
  day: number;
  time: number;
  inventory: InventoryData;
  tool: Tool;
  interactionKey?: 'E' | 'H' | 'G' | null;
  prompt: string;
  location: string;
  harvests: number;
  metLia: boolean;
  nearWorkbench: boolean;
  sheltered: boolean;
  shelterReason: string;
  resourceProgress: string;
  progress: ProgressData;
}
