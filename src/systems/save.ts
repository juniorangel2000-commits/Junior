import {validOpenFields} from './open-fields';
import {HORSE_ID,validHorseTaming} from './horse-taming';
import {DOMESTIC_ANIMALS,isDomesticAnimal} from '../data/domestic-animals';
import {CROPS,isCropId} from '../data/crops';
import {validGroundItems} from './ground-items';
import {syncToolInstances,validToolInventory,activeToolCopy,toolReference} from './tool-instances';
import {TOOL_IDS} from '../data/economy-balance';
import {isLegacyHouseTool,FARM_KINDS,FARM_BUILDINGS,LATER_FARM_MATERIALS,type FarmKind} from '../data/farm-buildings';
import {validFarmConstruction} from './farm-construction';
import {validMineMissions} from './mine-mission-state';
import {validBentoExpedition} from './bento-expedition-state';
import {validBentoTravel} from './bento-travel-state';
import {validNpcSocial} from './npc-social-state';
import {validMineRescue} from './mine-rescue-state';
import {validBentoWork} from './bento-work-state';
import {validUnderground,validUndergroundPosition} from './underground';
import {validCommunityCenter,communityReady} from './community-center';
import {validCommunityInterior} from '../data/community-room';
import {validMineInterior,previousMinePosition,recoverMinePosition} from '../data/mine-room';
import {validSurvivorCamp} from './survivor-camp';
import {validFishingProgress,availableSpecimens} from './fishing-progress';
import {validFisherTravel} from './fisher-travel';
import {validFishingHaul} from '../data/fishing-catches';
import {activeSaveKey,saveKeys} from './save-slot-keys';
import {validPetShelter} from './pet-shelter';
import {validDungeonProgress} from '../dungeons/progression';
import {validDungeonSnapshot} from '../dungeons/snapshot';
import {validSmithLayout,smithFits,smithNavigation} from './smith-layout';
import {validateEconomyState,newEconomyState} from './economy';
import {validateResourceField} from './resource-spawns';
import {validTreeGrowth,growingTreeResources} from './tree-growth';
import {repairPropertyShore,PROPERTY_SHORE_REVISION} from '../data/property-shore-repair';
import {collectibleKind} from '../data/nature-catalog';
import {editorObjectKind} from './map-editor';
import {MAP_BASE_REVISION,defaultMap,mergeDefaultMap,upgradeAuthorMap} from '../data/default-maps';
import { validQuickbar, emptyQuickbar } from './quickbar';
import { CHARACTER_DIRECTIONS, type CharacterDirection } from '../character-directions';
import type { CharacterProfile, ProgressData, SaveData, Tool } from '../types';
import { isFarmTile, validSoilTile } from './farming';
import { EMPTY_INVENTORY, INITIAL_INVENTORY, ITEM_IDS, MAX_ITEM_COUNT } from './inventory';
import { RESOURCE_DEFINITIONS } from './resources';
import { buildingFootprint, buildingLayer } from './building';
import { TILE, WORLD_HEIGHT, WORLD_WIDTH } from '../data/regions';
import { Home, HOME_WIDTH, HOME_HEIGHT, validateHome } from './home';
import { validateMapEdits } from './map-editor';
import { isCharacterId } from '../data/characters';
import {createVillageEconomy,validateVillageEconomy} from '../data/village-commerce';
import {createVillageProgress,validateVillageProgress,validateVillageInstallations,validateVillageSurvivors} from '../data/village-progress';
import {VILLAGE_ITEM_IDS} from '../data/items';
import {validAnimalCare} from './animal-production';
import {blacksmithRoomPosition,previousBlacksmithPosition,BLACKSMITH_INSIDE,validateBlacksmithHome,BLACKSMITH_ROOM} from '../data/blacksmith-interior';
import {validBentoRoutine} from './bento-routine';
import {validMerchantRoutines} from './merchant-routine';
import {validResidentId,validShopResidents} from './merchant-visit';
import {merchantRoomFits,validMerchantLayout} from '../data/merchant-rooms';

// A chave e a origem do aplicativo permanecem iguais para localizar partidas antigas.
export const SAVE_KEY = 'depois-da-chuva-v1';
export const SAVE_BACKUP_KEY = 'depois-da-chuva-v1-backup';
export const SAVE_VERSION = 4;
const TOOLS: Tool[] = ['farm-coop','farm-barn','farm-silo','farm-stable','farm-aprisco','hand', 'plant', 'water', 'gate', 'repair', 'fence', 'bench', 'remove', 'hatchet', 'pickaxe', 'hoe', 'workbench', 'wall', 'door', 'floor', 'window', 'roof', 'blueprint'];
const PROGRESS_KEYS: Array<keyof ProgressData> = ['collected', 'craftedTools', 'harvested', 'processed', 'builtWorkbench', 'sawn', 'builtShelter'];
const emptyProgress = (): ProgressData => ({ collected: false, craftedTools: false, harvested: false, processed: false, builtWorkbench: false, sawn: false, builtShelter: false });
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const integer = (value: unknown, min: number, max: number): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= min && value <= max;
const finite = (value: unknown, min: number, max: number): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
const color = (value: unknown): value is string => typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);
const MAX_BUILDINGS = (WORLD_WIDTH - 2) * (WORLD_HEIGHT - 2) * 3;
const MAX_RESOURCES = WORLD_WIDTH * WORLD_HEIGHT;

export function validateProfile(value: unknown): value is CharacterProfile {
  return isRecord(value) && typeof value.name === 'string' && value.name.trim().length > 0 && value.name.length <= 24
    && (value.characterId === undefined || isCharacterId(value.characterId))
    && color(value.skin) && color(value.hairColor) && color(value.outfit)
    && ['curto', 'longo', 'preso'].includes(value.hairStyle as string)
    && (value.shirtColor === undefined || color(value.shirtColor))
    && (value.accessory === undefined || value.accessory === 'bolsa' || value.accessory === 'nenhum');
}

export function validateSave(value: unknown): value is SaveData {
  if (!isRecord(value) || value.version !== SAVE_VERSION || !validateProfile(value.profile)) return false;
  if(value.openFields!==undefined&&!validOpenFields(value.openFields,typeof value.day==='number'?value.day:0))return false;
  if(value.openFieldsPosition!==undefined&&(!isRecord(value.openFieldsPosition)||!finite(value.openFieldsPosition.x,32,3040)||!finite(value.openFieldsPosition.y,32,2272)||(value.openFieldsPosition.direction!==undefined&&!CHARACTER_DIRECTIONS.includes(value.openFieldsPosition.direction as CharacterDirection))))return false;
  if(value.selectedCrop!==undefined&&!isCropId(value.selectedCrop))return false;
  if(value.groundItems!==undefined&&!validGroundItems(value.groundItems))return false;
  if(value.farmConstruction!==undefined&&!validFarmConstruction(value.farmConstruction,value.recruitedAnimals))return false;
  if(value.animalCare!==undefined&&!validAnimalCare(value.animalCare,typeof value.day==='number'?value.day:0))return false;
  if(value.npcSocial!==undefined&&!validNpcSocial(value.npcSocial,typeof value.day==='number'?value.day:999999))return false;
  if(value.bentoTravel!==undefined&&!validBentoTravel(value.bentoTravel,typeof value.day==='number'?value.day:999999))return false;
  if(value.mineRescue!==undefined&&!validMineRescue(value.mineRescue,typeof value.day==='number'?value.day:999999))return false;
  if(value.mineMissions!==undefined&&!validMineMissions(value.mineMissions,typeof value.day==='number'?value.day:999999))return false;
  if(value.bentoExpedition!==undefined&&!validBentoExpedition(value.bentoExpedition,typeof value.day==='number'?value.day:999999))return false;
  if(value.bentoWork!==undefined&&!validBentoWork(value.bentoWork,typeof value.day==='number'?value.day:999999))return false;
  if(value.underground!==undefined&&!validUnderground(value.underground,typeof value.day==='number'?value.day:999999))return false;
  if(value.miningInterior!==undefined&&(value.miningInterior!==true||!value.mineInterior||!value.underground))return false;
  if(value.underground){const mine=value.underground as NonNullable<SaveData['underground']>;if(mine.expedition&&mine.expedition.inside!==(mine.access===1?!!value.miningInterior:!!value.mineInterior))return false;}
  if(value.mineInterior!==undefined&&(value.activeArea!=='highland'||!(value.underground?validUndergroundPosition(value.underground as NonNullable<SaveData['underground']>,value.mineInterior):validMineInterior(value.mineInterior))))return false;
  if(value.damiaoIntroduction!==undefined&&typeof value.damiaoIntroduction!=='boolean')return false;
  if (value.petShelter !== undefined && !validPetShelter(value.petShelter)) return false;
  if (value.forestMapEdits !== undefined && (!validateMapEdits(value.forestMapEdits)||value.forestMapEdits.area!=='forest')) return false;
  if(value.fisherTravel!==undefined&&!validFisherTravel(value.fisherTravel))return false;
  if(value.fishingProgress!==undefined&&!validFishingProgress(value.fishingProgress))return false;
  if(value.lastFishingHaul!==undefined&&!validFishingHaul(value.lastFishingHaul))return false;
  if(value.highlandPosition!==undefined&&(!isRecord(value.highlandPosition)||!finite(value.highlandPosition.x,16,1520)||!finite(value.highlandPosition.y,16,1008)||(value.highlandPosition.direction!==undefined&&!CHARACTER_DIRECTIONS.includes(value.highlandPosition.direction as CharacterDirection))))return false;
  if(value.highlandMapEdits!==undefined&&(!validateMapEdits(value.highlandMapEdits)||value.highlandMapEdits.area!=='highland'))return false;
  if(value.mineCollisionRevision!==undefined&&value.mineCollisionRevision!==2)return false;
  if(value.survivorCamp!==undefined&&!validSurvivorCamp(value.survivorCamp))return false;
  if(value.communityCenter!==undefined&&!validCommunityCenter(value.communityCenter))return false;
  if(value.communityInterior!==undefined&&(value.activeArea!=='village'||!communityReady(value as unknown as SaveData)||value.merchantInterior!==undefined||value.blacksmithInterior!==undefined||!validCommunityInterior(value.communityInterior)))return false;
  if(value.worldWeapon!==undefined&&!['sword','unarmed'].includes(value.worldWeapon as string))return false;
  if(value.survivorCampMapEdits!==undefined&&(!validateMapEdits(value.survivorCampMapEdits)||value.survivorCampMapEdits.area!=='survivorCamp'))return false;
  if(value.survivorCampPosition!==undefined&&(!isRecord(value.survivorCampPosition)||!finite(value.survivorCampPosition.x,24,3048)||!finite(value.survivorCampPosition.y,24,2280)||(value.survivorCampPosition.direction!==undefined&&!CHARACTER_DIRECTIONS.includes(value.survivorCampPosition.direction as CharacterDirection))))return false;
  if(value.fishingLakeMapEdits!==undefined&&(!validateMapEdits(value.fishingLakeMapEdits)||value.fishingLakeMapEdits.area!=='fishingLake'))return false;
  if(value.fishingLakePosition!==undefined&&(!isRecord(value.fishingLakePosition)||!finite(value.fishingLakePosition.x,32,3040)||!finite(value.fishingLakePosition.y,32,2272)||(value.fishingLakePosition.direction!==undefined&&!CHARACTER_DIRECTIONS.includes(value.fishingLakePosition.direction as CharacterDirection))))return false;
  if(value.cityForestMapEdits!==undefined&&(!validateMapEdits(value.cityForestMapEdits)||value.cityForestMapEdits.area!=='cityForest'))return false;
  if(value.dungeonMapEdits!==undefined){
    if(!value.dungeonMapEdits||typeof value.dungeonMapEdits!=='object'||Array.isArray(value.dungeonMapEdits))return false;
    for(const [id,map] of Object.entries(value.dungeonMapEdits))if(!['abandoned-central-square','mall-parking'].includes(id)||!validateMapEdits(map)||map.area!==id)return false;
  }
  if(value.villageMapEdits!==undefined&&(!validateMapEdits(value.villageMapEdits)||value.villageMapEdits.area!=='village'))return false;
  if (value.mapEdits !== undefined && (!validateMapEdits(value.mapEdits)||value.mapEdits.area!==undefined)) return false;
  if(value.propertyShoreRevision!==undefined&&value.propertyShoreRevision!==PROPERTY_SHORE_REVISION)return false;
  if(value.homesteadRevision!==undefined&&value.homesteadRevision!==1)return false;
  if(value.resourceFields!==undefined&&(!isRecord(value.resourceFields)||!validateResourceField(value.resourceFields.property,'property')||!validateResourceField(value.resourceFields.forest,'forest')))return false;
  if(value.treeGrowth!==undefined&&!validTreeGrowth(value.treeGrowth))return false;
  if(value.resourceMilestones!==undefined&&(!isRecord(value.resourceMilestones)||typeof value.resourceMilestones.felled!=='boolean'||typeof value.resourceMilestones.mined!=='boolean'))return false;
  if (value.quickbar !== undefined && !validQuickbar(value.quickbar)) return false;
  if(value.dungeons!==undefined&&!validDungeonProgress(value.dungeons))return false;
  if(value.dungeonRun!==undefined&&(value.activeArea!=='cityForest'||!validDungeonSnapshot(value.dungeonRun)))return false;
  if (value.activeArea !== undefined && value.activeArea !== 'property' && value.activeArea !== 'forest' && value.activeArea !== 'village' && value.activeArea !== 'cityForest' && value.activeArea !== 'fishingLake' && value.activeArea !== 'survivorCamp' && value.activeArea !== 'highland' && value.activeArea !== 'openFields') return false;
  if((value.activeArea==='village'||value.activeArea==='cityForest'||value.activeArea==='fishingLake'||value.activeArea==='survivorCamp'||value.activeArea==='highland'||value.activeArea==='openFields')&&(value.homePosition!==undefined||value.animalEscort!==undefined&&!(value.activeArea==='openFields'&&isRecord(value.animalEscort)&&value.animalEscort.id===HORSE_ID&&value.animalEscort.area==='openFields')))return false;
  if(value.blacksmithScene!==undefined&&!validSmithLayout(value.blacksmithScene))return false;
  if(value.blacksmithHome!==undefined&&!validateBlacksmithHome(value.blacksmithHome))return false;
  if(value.shopResidents!==undefined&&!validShopResidents(value.shopResidents))return false;
  if(value.villageRoutines!==undefined&&!validMerchantRoutines(value.villageRoutines))return false;
  if(value.merchantScenes!==undefined&&(!isRecord(value.merchantScenes)||Object.entries(value.merchantScenes).some(([id,room])=>!validResidentId(id)||id==='bento'||!validMerchantLayout(room))))return false;
  if(value.merchantInterior!==undefined){const p=value.merchantInterior;if(value.activeArea!=='village'||value.blacksmithInterior!==undefined||!isRecord(p)||!validResidentId(p.owner)||p.owner==='bento'||typeof p.x!=='number'||typeof p.y!=='number'||!merchantRoomFits(p.owner,p.x,p.y,(value.merchantScenes as SaveData['merchantScenes'])?.[p.owner])||(p.direction!==undefined&&!CHARACTER_DIRECTIONS.includes(p.direction as CharacterDirection)))return false;}
  const smithRoom=value.blacksmithHome?new Home(value.blacksmithHome as SaveData['home'],false):BLACKSMITH_ROOM;
  if(value.bentoRoutine!==undefined&&!validBentoRoutine(value.bentoRoutine,value.blacksmithScene?smithNavigation(value.blacksmithScene as NonNullable<SaveData['blacksmithScene']>):smithRoom))return false;
  if(value.blacksmithLayoutRevision!==undefined&&value.blacksmithLayoutRevision!==2&&value.blacksmithLayoutRevision!==3)return false;
  if(value.blacksmithInterior!==undefined){
    const p=value.blacksmithInterior;
    if(value.activeArea!=='village'||!isRecord(p)||typeof p.x!=='number'||typeof p.y!=='number'||!(value.blacksmithScene?smithFits(value.blacksmithScene as NonNullable<SaveData['blacksmithScene']>,p.x,p.y):blacksmithRoomPosition(p.x,p.y,smithRoom))||(p.direction!==undefined&&!CHARACTER_DIRECTIONS.includes(p.direction as CharacterDirection)))return false;
  }
  if(value.villageEconomy!==undefined&&!validateVillageEconomy(value.villageEconomy))return false;
  if(value.economy6!==undefined&&!validateEconomyState(value.economy6))return false;
  if(value.villageProgress!==undefined&&!validateVillageProgress(value.villageProgress))return false;
  if(value.villageInstallations!==undefined&&!validateVillageInstallations(value.villageInstallations))return false;
  if(value.villageSurvivors!==undefined&&!validateVillageSurvivors(value.villageSurvivors))return false;
  if (value.recruitedAnimals !== undefined && (!Array.isArray(value.recruitedAnimals) || new Set(value.recruitedAnimals).size !== value.recruitedAnimals.length || !value.recruitedAnimals.every(id => isDomesticAnimal(id)))) return false;
  if(value.horseTaming!==undefined&&!validHorseTaming(value.horseTaming,typeof value.day==='number'?value.day:0))return false;
  // O cavalo só sai dos Campos domado e com nome.
  const horseOut=(value.recruitedAnimals as string[]|undefined)?.includes(HORSE_ID)||isRecord(value.animalEscort)&&value.animalEscort.id===HORSE_ID;
  if(horseOut&&(!isRecord(value.horseTaming)||value.horseTaming.tamed!==true||typeof value.horseTaming.name!=='string'))return false;
  if(value.animalEscort!==undefined){
    const escort=value.animalEscort;
    if(!isRecord(escort)||!isDomesticAnimal(escort.id)||!['forest','property','openFields'].includes(escort.area as string)||escort.area!==(value.activeArea??'property')||escort.area==='forest'&&((value.recruitedAnimals as string[]|undefined)?.includes(escort.id as string)||escort.id===HORSE_ID))return false;
    if(escort.area==='openFields'&&(escort.id!==HORSE_ID||(value.recruitedAnimals as string[]|undefined)?.includes(HORSE_ID)||!isRecord(value.openFields)||!Array.isArray(value.openFields.animals)||!value.openFields.animals.some(a=>isRecord(a)&&a.id===HORSE_ID)))return false;
  }
  if(value.animalPositions!==undefined){
    if(!isRecord(value.animalPositions))return false;
    const ids=new Set<string>();
    for(const area of ['forest','property']){
      const list=value.animalPositions[area];if(!Array.isArray(list)||list.length>DOMESTIC_ANIMALS.length)return false;
      for(const p of list){
        if(!isRecord(p)||typeof p.id!=='string'||ids.has(p.id)||!isDomesticAnimal(p.id)||area==='forest'&&p.id===HORSE_ID||!finite(p.x,16,WORLD_WIDTH*TILE-16)||!finite(p.y,16,WORLD_HEIGHT*TILE-16)||!CHARACTER_DIRECTIONS.includes(p.direction as CharacterDirection))return false;
        const owned=(value.recruitedAnimals as string[]|undefined)?.includes(p.id)??false;
        if(area==='forest'&&owned||area==='property'&&!owned&&(!isRecord(value.animalEscort)||value.animalEscort.id!==p.id||value.animalEscort.area!=='property'))return false;
        ids.add(p.id);
      }
    }
    if(isRecord(value.animalEscort)&&value.animalEscort.area!=='openFields'&&!(value.animalPositions[value.animalEscort.area as string] as Array<{id:string}>).some(p=>p.id===(value.animalEscort as Record<string,unknown>).id))return false;
  }else if(value.animalEscort!==undefined&&!(isRecord(value.animalEscort)&&value.animalEscort.area==='openFields'))return false;
  if((value.activeArea==='cityForest'||value.activeArea==='fishingLake'||value.activeArea==='survivorCamp'||value.activeArea==='highland'||value.activeArea==='openFields')&&(value.merchantInterior!==undefined||value.blacksmithInterior!==undefined))return false;
  if(value.cityForestPosition!==undefined&&(!isRecord(value.cityForestPosition)||!finite(value.cityForestPosition.x,32,3040)||!finite(value.cityForestPosition.y,32,2272)||(value.cityForestPosition.direction!==undefined&&!CHARACTER_DIRECTIONS.includes(value.cityForestPosition.direction as CharacterDirection))))return false;
  if (value.forestPosition !== undefined && (!isRecord(value.forestPosition) || !finite(value.forestPosition.x, 32, 3040) || !finite(value.forestPosition.y, 32, 2272) || (value.forestPosition.direction !== undefined && !CHARACTER_DIRECTIONS.includes(value.forestPosition.direction as CharacterDirection)))) return false;
  if (value.villagePosition !== undefined && (!isRecord(value.villagePosition) || !finite(value.villagePosition.x, 32, 3040) || !finite(value.villagePosition.y, 32, 2272) || (value.villagePosition.direction !== undefined && !CHARACTER_DIRECTIONS.includes(value.villagePosition.direction as CharacterDirection)))) return false;
  if (value.wateringCanWater !== undefined && (!Number.isInteger(value.wateringCanWater) || !finite(value.wateringCanWater, 0, 8))) return false;
  if (value.homeSupplies !== undefined && (!isRecord(value.homeSupplies) || typeof value.homeSupplies.wateringCan !== 'boolean' || typeof value.homeSupplies.seedPacket !== 'boolean')) return false;
  if (!isRecord(value.player) || !finite(value.player.x, TILE / 2, WORLD_WIDTH * TILE - TILE / 2)
    || !finite(value.player.y, TILE / 2, WORLD_HEIGHT * TILE - TILE / 2)) return false;
  if (value.player.direction !== undefined && !CHARACTER_DIRECTIONS.includes(value.player.direction as CharacterDirection)) return false;
  if (value.home !== undefined && !validateHome(value.home)) return false;
  if(value.mineRescue&&(value.mineRescue as SaveData['mineRescue'])!.stage==='waking'){
    const trip=(value.bentoTravel as SaveData['bentoTravel'])?.trip;
    if(value.activeArea!=='property'||!value.homePosition||trip?.area!=='home'||trip.leg!=='rescue-dialogue'||trip.purpose!=='rescue'||!new Home(value.home as SaveData['home']).data.furniture.some(f=>f.kind==='bed'&&f.id===(value.mineRescue as SaveData['mineRescue'])!.bedId))return false;
  }
  if (value.homePosition !== undefined) {
    if (!isRecord(value.homePosition) || !finite(value.homePosition.x, TILE, (HOME_WIDTH - 1) * TILE - 1)
      || !finite(value.homePosition.y, TILE * 2, HOME_HEIGHT * TILE)) return false;
    if (value.homePosition.direction !== undefined && !CHARACTER_DIRECTIONS.includes(value.homePosition.direction as CharacterDirection)) return false;
    const home = new Home(value.home as SaveData['home']);
    if ([[-7, -5], [7, -5], [-7, 3], [7, 3]].some(([ox, oy]) => home.isBlocked(
      Math.floor(((value.homePosition as Record<string, number>).x + ox) / TILE),
      Math.floor(((value.homePosition as Record<string, number>).y + oy) / TILE)))) return false;
  }
  if (!isRecord(value.inventory) || !ITEM_IDS.every(id => integer((value.inventory as Record<string, unknown>)[id], 0, MAX_ITEM_COUNT))) return false;
  if(value.worldWeapon==='sword'&&(value.inventory.sword as number)<1)return false;
  if (Object.keys(value.inventory).some(id => id!=='toolInstances'&&!ITEM_IDS.includes(id as typeof ITEM_IDS[number]))) return false;
  if(value.inventory.toolInstances!==undefined&&!validToolInventory(value.inventory.toolInstances,value.inventory as unknown as SaveData['inventory']))return false;
  const toolBook=(value.inventory as unknown as SaveData['inventory']).toolInstances,toolIds=new Set(toolBook?.items.map(t=>t.id));
  for(const drop of (value.groundItems as SaveData['groundItems'])?.items??[])if(drop.tool){if(!toolBook||drop.tool.id>=toolBook.nextId||toolIds.has(drop.tool.id))return false;toolIds.add(drop.tool.id);}
  if (!TOOLS.includes(value.equippedTool as Tool)) return false;
  if ((value.equippedTool === 'hatchet' || value.equippedTool === 'pickaxe' || value.equippedTool === 'hoe') && (value.inventory[value.equippedTool] as number) < 1) return false;
  if (!isRecord(value.progress) || !PROGRESS_KEYS.every(key => typeof (value.progress as Record<string, unknown>)[key] === 'boolean')) return false;
  if (!integer(value.day, 1, 999_999) || !finite(value.time, 0, 1439.999999) || typeof value.metLia !== 'boolean') return false;
  const soil = new Set<string>();
  const restored = new Set<string>();
  if (value.restoredFarmSoil !== undefined) {
    if (!Array.isArray(value.restoredFarmSoil) || value.restoredFarmSoil.length > 45) return false;
    for (const point of value.restoredFarmSoil) {
      if (!isRecord(point) || !integer(point.x,21,29) || !integer(point.y,20,24)) return false;
      const key=`${point.x},${point.y}`; if (restored.has(key)) return false;
      restored.add(key);
    }
  }
  if (value.preparedSoil !== undefined) {
    if (!Array.isArray(value.preparedSoil) || value.preparedSoil.length > (WORLD_WIDTH - 2) * (WORLD_HEIGHT - 2)) return false;
    for (const point of value.preparedSoil) {
      if (!isRecord(point) || !integer(point.x, 1, WORLD_WIDTH - 2) || !integer(point.y, 1, WORLD_HEIGHT - 2)) return false;
      const key = `${point.x},${point.y}`;
      if (soil.has(key) || isFarmTile(point.x,point.y)) return false;
      soil.add(key);
    }
  }
  if (value.farmingProgress !== undefined && (!isRecord(value.farmingProgress)
    || !['prepared', 'planted', 'watered', 'harvested'].every(key => typeof (value.farmingProgress as Record<string, unknown>)[key] === 'boolean'))) return false;
  if (!Array.isArray(value.crops) || value.crops.length > (WORLD_WIDTH - 2) * (WORLD_HEIGHT - 2) || !Array.isArray(value.buildings) || value.buildings.length > MAX_BUILDINGS) return false;
  const occupied = new Set<string>();
  for (const crop of value.crops) {
    if (!isRecord(crop) || !integer(crop.x, 1, WORLD_WIDTH - 2) || !integer(crop.y, 1, WORLD_HEIGHT - 2) || !validSoilTile(crop.x, crop.y)
      || !(isFarmTile(crop.x, crop.y) && !restored.has(`${crop.x},${crop.y}`) || soil.has(`${crop.x},${crop.y}`))
      || !finite(crop.growth, 0, 1) || typeof crop.watered !== 'boolean') return false;
    // Formato antigo (crescimento por segundos): só cresce depois de regado.
    if (crop.day === undefined && crop.days === undefined && crop.crop === undefined) { if (!crop.watered && crop.growth > 0) return false; }
    // Formato por dias regados: planta conhecida, dias dentro da ficha e dia de referência até hoje.
    else if (!isCropId(crop.crop) || !integer(crop.days, 0, CROPS[crop.crop].days) || !integer(crop.day, 1, typeof value.day === 'number' ? value.day : 1)) return false;
    const key = String(crop.x) + ',' + String(crop.y);
    if (occupied.has(key)) return false;
    occupied.add(key);
  }
  for (const building of value.buildings) {
    if (!isRecord(building) || !integer(building.x, 1, WORLD_WIDTH - 2) || !integer(building.y, 1, WORLD_HEIGHT - 2)
      || !['gate', 'fence', 'bench', 'workbench', 'wall', 'door', 'floor', 'window', 'roof'].includes(building.kind as string)
      || isFarmTile(building.x, building.y) && !restored.has(`${building.x},${building.y}`)) return false;
    if (building.open !== undefined && (!['door','gate'].includes(building.kind as string) || typeof building.open !== 'boolean')) return false;
    if (building.rotation !== undefined && !(['gate','bench'].includes(building.kind as string) ? [0, 1, 2, 3] : building.kind === 'roof' ? [0, 1] : []).includes(building.rotation as number)) return false;
    if (building.gateFlip !== undefined && (building.kind !== 'gate' || typeof building.gateFlip !== 'boolean')) return false;
    if (building.fenceBuiltDay !== undefined && (building.kind !== 'fence' || !integer(building.fenceBuiltDay, 1, value.day))) return false;
    const piece = building as unknown as SaveData['buildings'][number];
    for (const tile of buildingFootprint(piece)) {
      if (!integer(tile.x, 1, WORLD_WIDTH - 2) || !integer(tile.y, 1, WORLD_HEIGHT - 2)
        || isFarmTile(tile.x,tile.y) && !restored.has(`${tile.x},${tile.y}`) || soil.has(`${tile.x},${tile.y}`)) return false;
      const key = buildingLayer(piece.kind) + ':' + String(tile.x) + ',' + String(tile.y);
      if (occupied.has(key)) return false;
      occupied.add(key);
    }
  }
  if (!Array.isArray(value.depletedResources) || value.depletedResources.length > MAX_RESOURCES
    || !value.depletedResources.every(id => typeof id === 'string' && id.length > 0 && id.length <= 80)
    || new Set(value.depletedResources).size !== value.depletedResources.length) return false;
  if (!Array.isArray(value.resourceProgress) || value.resourceProgress.length > MAX_RESOURCES) return false;
  const progressing = new Set<string>();
  for (const resource of value.resourceProgress) {
    if (!isRecord(resource) || typeof resource.id !== 'string' || resource.id.length > 80 || progressing.has(resource.id)
      || value.depletedResources.includes(resource.id)) return false;
    const forest:boolean=resource.id.startsWith('f-');const id:string=forest?resource.id.slice(2):resource.id;
    let kind=collectibleKind(editorObjectKind(id)??undefined);
    if(resource.id.startsWith('spawn-'))kind=(value.resourceFields as SaveData['resourceFields'])?.[resource.id.startsWith('spawn-f-')?'forest':'property'].nodes.find(n=>n.id===resource.id)?.kind;
    else if(resource.id.startsWith('growth-'))kind=growingTreeResources(value as unknown as SaveData,resource.id.startsWith('growth-f-')?'forest':'property').find(n=>n.id===resource.id)?.kind;
    else if(id.startsWith('editor-')){
      const object=(forest?value.forestMapEdits:value.mapEdits as SaveData['mapEdits']) as SaveData['mapEdits'];
      kind=collectibleKind(object?.objects[id]?.kind);
    }
    if(kind!=='standingTree'&&kind!=='vein'&&kind!=='fallenLog'&&kind!=='stump')return false;
    const definition = RESOURCE_DEFINITIONS[kind];
    if (!integer(resource.hits, 1, definition.hits - 1)) return false;
    progressing.add(resource.id);
  }
  return true;
}

/** Converte em memória; a leitura nunca modifica nem substitui o slot original. */
export function migrateSave(value: unknown): SaveData | null {
  if(isRecord(value)&&value.version===SAVE_VERSION&&value.underground===undefined&&value.mineCollisionRevision===undefined&&value.activeArea==='highland'&&isRecord(value.mineInterior)){
    const p=value.mineInterior;
    if(typeof p.x==='number'&&typeof p.y==='number'&&previousMinePosition(p.x,p.y)&&!validMineInterior(p)&& (p.direction===undefined||CHARACTER_DIRECTIONS.includes(p.direction as CharacterDirection)))value={...value,mineInterior:recoverMinePosition(p as unknown as import('../data/mine-room').MinePosition),mineCollisionRevision:2};
  }
  // Cosmetic catch details must never make an otherwise valid game unloadable.
  if(isRecord(value)&&value.fishingProgress!==undefined&&!validFishingProgress(value.fishingProgress)){value={...value};delete (value as Record<string,unknown>).fishingProgress;}
  if(isRecord(value)&&value.lastFishingHaul!==undefined&&!validFishingHaul(value.lastFishingHaul)){
    value={...value};delete (value as Record<string,unknown>).lastFishingHaul;
  }
  // Version 4 adds independent city/dungeon layouts and four bench views.
  // Older applications must treat these saves as future data rather than overwrite them.
  if (isRecord(value) && (value.version === 2 || value.version === 3)) value = { ...value, version: SAVE_VERSION };
  // New shop fixtures can cover a previously valid saved position. Recover
  // only proven old-layout positions, keeping inventory, money and orders intact.
  if(isRecord(value)&&value.version===SAVE_VERSION&&value.blacksmithHome===undefined&&(value.blacksmithLayoutRevision===undefined||value.blacksmithLayoutRevision===2)){
    const revision=value.blacksmithLayoutRevision;
    const displaced=(p:unknown):p is Record<string,unknown>&{x:number;y:number}=>isRecord(p)&&typeof p.x==='number'&&typeof p.y==='number'&&previousBlacksmithPosition(p.x,p.y,revision)&&!blacksmithRoomPosition(p.x,p.y);
    const p=value.blacksmithInterior,b=value.bentoRoutine;
    if(value.activeArea==='village'&&displaced(p))value={...value,blacksmithInterior:{...p,...BLACKSMITH_INSIDE},blacksmithLayoutRevision:3};
    if(displaced(b)&&b.area==='blacksmith-home'){
      const recovered={...b,...BLACKSMITH_INSIDE};
      if(validBentoRoutine(recovered))value={...(value as Record<string,unknown>),bentoRoutine:recovered,blacksmithLayoutRevision:3};
    }
  }
  // Only the new item is filled in. Missing older stock fields still reject a corrupt save.
  if (isRecord(value) && value.version === SAVE_VERSION && isRecord(value.inventory) && value.inventory.hoe === undefined) {
    value = { ...value, inventory: { ...value.inventory, hoe: 0 } };
  }
  if(isRecord(value)&&value.version===SAVE_VERSION&&isRecord(value.inventory)){
    const stock=value.inventory;
    const missing=VILLAGE_ITEM_IDS.filter(id=>!Object.hasOwn(stock,id));
    if(missing.length){const unarmed=missing.includes('sword')&&value.worldWeapon==='sword';value={...value,inventory:{...stock,...Object.fromEntries(missing.map(id=>[id,0]))},...(unarmed?{worldWeapon:'unarmed'}:{})};}
  }
  // Preserve the unpublished village preview wallet after the residents were
  // named. Reading still leaves the original save and its coin balance intact.
  if(isRecord(value)&&value.version===SAVE_VERSION&&isRecord(value.villageEconomy)){
    const economy=value.villageEconomy,met=economy.met;
    const aliases:Record<string,string>={clara:'rosa',olivia:'tobias',tomas:'augusto'};
    if(Array.isArray(met)&&new Set(met).size===met.length&&met.every(id=>typeof id==='string')
      &&met.some(id=>Object.hasOwn(aliases,id))){
      value={...value,villageEconomy:{...economy,met:[...new Set(met.map(id=>Object.hasOwn(aliases,id)?aliases[id]:id))]}};
    }
  }
  // Animal buildings gained madeira nobre in preview.34. Finished ones were
  // already built, so they count as supplied; work in progress still needs it.
  if(isRecord(value)&&value.version===SAVE_VERSION&&isRecord(value.farmConstruction)&&Array.isArray(value.farmConstruction.sites)){
    const sites=value.farmConstruction.sites.map(site=>{
      if(!isRecord(site)||site.finished!==true||!isRecord(site.delivered)||!FARM_KINDS.includes(site.kind as FarmKind))return site;
      const cost=FARM_BUILDINGS[site.kind as FarmKind].cost,missing=LATER_FARM_MATERIALS.filter(id=>cost[id]!==undefined&&site.delivered!==undefined&&(site.delivered as Record<string,unknown>)[id]===undefined);
      return missing.length?{...site,delivered:{...site.delivered,...Object.fromEntries(missing.map(id=>[id,cost[id]]))}}:site;
    });
    if(sites.some((site,i)=>site!==(value as {farmConstruction:{sites:unknown[]}}).farmConstruction.sites[i]))value={...value,farmConstruction:{...value.farmConstruction,sites}};
  }
  if(validateSave(value)){
    const data=structuredClone(value);
    if(isLegacyHouseTool(data.equippedTool))data.equippedTool='hand';
    if(data.quickbar)data.quickbar=data.quickbar.map(s=>s&&isLegacyHouseTool(s)?null:s);
    if(data.mineInterior)data.mineCollisionRevision=2;
    if(!data.communityCenter){
      data.communityCenter={stage:communityReady(data)?3:0,delivered:{}};
      if(data.activeArea==='survivorCamp'&&!communityReady(data)){data.activeArea='forest';data.forestPosition={x:1136,y:272,direction:'down'};}
    }
    if(!data.economy6){data.economy6=newEconomyState();for(const tool of ['hatchet','pickaxe','hoe'] as const){const tier=data.villageProgress?.toolLevels[tool]??0;if(tier>0&&data.inventory[tool]>0)data.economy6.tools[tool]={tier,durability:[100,250,450,800][tier]};}}
    syncToolInstances(data.inventory,data.economy6.tools);
    for(const tool of TOOL_IDS){const copy=activeToolCopy(data.inventory,tool);if(copy)data.economy6.tools[tool]=copy.condition;}
    for(const order of data.economy6.orders)if(order.kind==='tool'&&order.tool&&order.toolId===undefined&&['reserved','working'].includes(order.phase))order.toolId=activeToolCopy(data.inventory,order.tool)?.id;
    if(data.quickbar)data.quickbar=data.quickbar.map(slot=>{const kind=slot?.startsWith('item:')?slot.slice(5):undefined,copy=data.inventory.toolInstances?.items.find(t=>t.kind===kind&&t.id===data.inventory.toolInstances!.active[t.kind]);return copy?toolReference(copy):slot;});
    if(data.mapBaseRevision!==MAP_BASE_REVISION){
      if(data.mapBaseRevision===1||data.mapBaseRevision===2||data.mapBaseRevision===3){
        const protectedCells={
          property:new Set([...(data.preparedSoil??[]),...data.crops,...data.buildings.flatMap(buildingFootprint)].map(p=>`${p.x},${p.y}`)),
          forest:new Set<string>(),
        };
        const protectBody=(cells:Set<string>,point:{x:number;y:number},radiusX:number,above:number,below=above):void=>{
          for(let y=Math.floor((point.y-above)/TILE);y<=Math.floor((point.y+below)/TILE);y++)
            for(let x=Math.floor((point.x-radiusX)/TILE);x<=Math.floor((point.x+radiusX)/TILE);x++)cells.add(`${x},${y}`);
        };
        if(data.activeArea==='forest'){
          if(data.forestPosition)protectBody(protectedCells.forest,data.forestPosition,7,5,3);
        }else if(data.activeArea!=='village')protectBody(protectedCells.property,data.player,7,5,3);
        for(const area of ['property','forest'] as const)for(const animal of data.animalPositions?.[area]??[])protectBody(protectedCells[area],animal,9,6);
        data.mapEdits=upgradeAuthorMap('property',data.mapEdits,protectedCells.property,data.mapBaseRevision);data.forestMapEdits=upgradeAuthorMap('forest',data.forestMapEdits,protectedCells.forest,data.mapBaseRevision);
      }else{data.mapEdits=mergeDefaultMap('property',data.mapEdits,false);data.forestMapEdits=mergeDefaultMap('forest',data.forestMapEdits,false);}
      data.mapBaseRevision=MAP_BASE_REVISION;
    }
    if(data.propertyShoreRevision!==PROPERTY_SHORE_REVISION){
      const protectedCells=new Set([...(data.preparedSoil??[]),...data.crops,...data.buildings.flatMap(buildingFootprint)].map(p=>`${p.x},${p.y}`));
      repairPropertyShore(data.mapEdits,protectedCells);data.propertyShoreRevision=PROPERTY_SHORE_REVISION;
    }
    return data;
  }
  if (!isRecord(value) || value.version !== 1 || !isRecord(value.inventory)) return null;
  const legacyItems = ['wood', 'stone', 'seeds', 'turnip'] as const;
  if (!legacyItems.every(id => integer((value.inventory as Record<string, unknown>)[id], 0, MAX_ITEM_COUNT))) return null;
  if (!Array.isArray(value.buildings) || value.buildings.some(building => !isRecord(building) || !['fence', 'bench'].includes(building.kind as string))) return null;
  const migrated = {
    ...value,
    version: SAVE_VERSION,
    inventory: { ...EMPTY_INVENTORY, ...Object.fromEntries(legacyItems.map(id => [id, (value.inventory as Record<string, unknown>)[id]])) },
    resourceProgress: [], equippedTool: 'hand',
    progress: { ...emptyProgress(), collected: Array.isArray(value.depletedResources) && value.depletedResources.length > 0 },
  };
  return validateSave(migrated) ? structuredClone(migrated) : null;
}

export function createNewSave(profile: CharacterProfile): SaveData {
  return {
    version:SAVE_VERSION,mapBaseRevision:MAP_BASE_REVISION,propertyShoreRevision:PROPERTY_SHORE_REVISION,mapEdits:defaultMap('property'),forestMapEdits:defaultMap('forest'),
    quickbar: emptyQuickbar(), homeSupplies: { wateringCan: false, seedPacket: false },
    profile: { ...profile, name: profile.name.trim() },
    player: { x: 25 * TILE + TILE / 2, y: 18 * TILE + TILE / 2 },
    inventory: { ...INITIAL_INVENTORY },
    crops: [], buildings: [], depletedResources: [], resourceProgress: [], equippedTool: 'hand', progress: emptyProgress(),
    communityCenter:{stage:0,delivered:{}},damiaoIntroduction:false,economy6:newEconomyState(),day: 1, time: 8 * 60, metLia: false, villageEconomy: createVillageEconomy(), villageProgress:createVillageProgress(),
  };
}

export const SAVE_RECENT_KEYS = [SAVE_KEY + '-recent-1', SAVE_KEY + '-recent-2'] as const;
export const SAVE_DAMAGED_KEY = SAVE_KEY + '-preserved-invalid';
export type SaveReadResult = {status:'missing'|'invalid'|'unavailable'|'future';data:null}|{status:'valid'|'recovered';data:SaveData};
function parseStored(raw:string):SaveData|null {
  try { return migrateSave(JSON.parse(raw)); } catch { return null; }
}
function futureSave(raw:string):boolean {
  try { const v=JSON.parse(raw)?.version;return typeof v==='number'&&v>SAVE_VERSION; } catch { return false; }
}
/** Reading never rewrites or repairs storage. Future saves are never downgraded. */
export function inspectSave(base?:string):SaveReadResult {
  try {
    const keys=saveKeys(base??activeSaveKey());
    const raw=localStorage.getItem(keys.main);
    if(raw!==null&&futureSave(raw))return {status:'future',data:null};
    const data=raw===null?null:parseStored(raw);
    if(data)return {status:'valid',data};
    for(const key of [...keys.recent,keys.backup]){
      const backup=localStorage.getItem(key),recovered=backup===null?null:parseStored(backup);
      if(recovered)return {status:'recovered',data:recovered};
    }
    return {status:raw===null?'missing':'invalid',data:null};
  } catch { return {status:'unavailable',data:null}; }
}
/** Call only after the player confirms recovery/replacement. Preserve exact bytes. */
export function preserveInvalidSave():boolean {
  try {
    const keys=saveKeys(activeSaveKey());
    const raw=localStorage.getItem(keys.main);
    if(raw===null||parseStored(raw))return true;
    if(futureSave(raw))return false;
    const preserved=localStorage.getItem(keys.damaged);
    if(preserved!==null&&preserved!==raw)return false;
    if(preserved===null)localStorage.setItem(keys.damaged,raw);
    return localStorage.getItem(keys.damaged)===raw;
  } catch { return false; }
}
export function loadSave():SaveData|null { return inspectSave().data; }
export function hasSave():boolean { return loadSave()!==null; }
export function saveGame(data:SaveData):boolean {
  const original=data;
  try {
    if(!validateSave(data))return false;
    if(data.fishingProgress){data={...data,fishingProgress:{...data.fishingProgress,basket:availableSpecimens(data)}};}
    const keys=saveKeys(activeSaveKey());
    if(!validateSave(data))return false;
    const previous=localStorage.getItem(keys.main);
    if(previous!==null){
      if(futureSave(previous))return false;
      const valid=parseStored(previous);
      if(!valid&&localStorage.getItem(keys.damaged)!==previous)return false;
      if(valid&&previous!==JSON.stringify(data)){
        const version=(JSON.parse(previous) as {version?:number}).version;
        if(version!==SAVE_VERSION){
          if(localStorage.getItem(keys.backup)===null)localStorage.setItem(keys.backup,previous);
        }
        {
          const recent=localStorage.getItem(keys.recent[0]);
          if(recent!==previous){
            if(recent!==null&&parseStored(recent))localStorage.setItem(keys.recent[1],recent);
            localStorage.setItem(keys.recent[0],previous);
          }
        }
      }
    }
    localStorage.setItem(keys.main,JSON.stringify(data));
    if(original.fishingProgress&&data.fishingProgress)original.fishingProgress.basket=data.fishingProgress.basket;return true;
  } catch { return false; }
}
export function clearSave():boolean {
  try { localStorage.removeItem(activeSaveKey());return true; } catch { return false; }
}
