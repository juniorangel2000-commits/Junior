export type HairStyle = 'curto' | 'longo' | 'preso';
export interface CharacterProfile {
  name: string;
  skin: string;
  hairStyle: HairStyle;
  hairColor: string;
  outfit: string;
}
export type ItemId = 'wood' | 'stone' | 'seeds' | 'turnip';
export type InventoryData = Record<ItemId, number>;
export type Tool = 'hand' | 'plant' | 'water' | 'fence' | 'bench' | 'remove';
export interface TilePoint { x: number; y: number }
export interface CropData extends TilePoint { growth: number; watered: boolean }
export interface BuildingData extends TilePoint { kind: 'fence' | 'bench' }
export interface SaveData {
  version: 1;
  profile: CharacterProfile;
  player: TilePoint;
  inventory: InventoryData;
  crops: CropData[];
  buildings: BuildingData[];
  depletedResources: string[];
  day: number;
  time: number;
  metLia: boolean;
}
export interface HudData {
  name: string;
  day: number;
  time: number;
  inventory: InventoryData;
  tool: Tool;
  prompt: string;
  location: string;
  harvests: number;
  metLia: boolean;
}
