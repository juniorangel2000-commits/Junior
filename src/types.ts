import type { HomeData } from './systems/home';
import type { CharacterDirection } from './character-directions';
import type { MapEditData } from './systems/map-editor';
import type { CharacterId } from './data/characters';

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
export type ItemId = 'wood' | 'stone' | 'seeds' | 'turnip' | 'branch' | 'log' | 'plank' | 'scrap' | 'hatchet' | 'pickaxe' | 'handsaw'
  | 'fiber' | 'cord' | 'flakedStone' | 'handle' | 'peg' | 'blade' | 'board' | 'hammer';
export type InventoryData = Record<ItemId, number>;
export type OwnedTool = 'hatchet' | 'pickaxe' | 'handsaw' | 'hammer';
export type Tool = 'hand' | 'plant' | 'water' | 'fence' | 'bench' | 'remove' | 'hatchet' | 'pickaxe' | 'workbench' | 'wall' | 'door' | 'floor' | 'window' | 'roof' | 'blueprint';
export type QuickSlot = Tool | `item:${ItemId}` | 'item:wateringCan' | null;
export interface TilePoint { x: number; y: number }
export interface CropData extends TilePoint { growth: number; watered: boolean }
export interface BuildingData extends TilePoint { kind: 'fence' | 'bench' | 'workbench' | 'wall' | 'door' | 'floor' | 'window' | 'roof'; open?: boolean; rotation?: 0 | 1 }
export type ResourceKind = 'tree' | 'stone' | 'seeds' | 'scrap' | 'standingTree' | 'vein' | 'fiber';
export interface ResourceNode extends TilePoint { id: string; kind: ResourceKind }
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
export interface SaveData {
  activeArea?: 'property' | 'forest';
  forestPosition?: TilePoint & { direction?: CharacterDirection };
  recruitedAnimals?: string[];
  version: 2;
  quickbar?: QuickSlot[];
  wateringCanWater?: number;
  homeSupplies?: { wateringCan: boolean; seedPacket: boolean };
  profile: CharacterProfile;
  player: TilePoint & { direction?: CharacterDirection };
  inventory: InventoryData;
  crops: CropData[];
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
  area?: 'property'|'forest';
  wateringCan?: boolean;
  wateringCanWater?: number;
  inHome: boolean;
  playerTile?: TilePoint;
  name: string;
  day: number;
  time: number;
  inventory: InventoryData;
  tool: Tool;
  interactionKey?: 'E' | 'H';
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
