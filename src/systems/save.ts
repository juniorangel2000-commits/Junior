import {validateEconomyState,newEconomyState} from './economy';
import {validateResourceField} from './resource-spawns';
import {repairPropertyShore,PROPERTY_SHORE_REVISION} from '../data/property-shore-repair';
import {collectibleKind} from '../data/nature-catalog';
import {editorObjectKind} from './map-editor';
import {MAP_BASE_REVISION,defaultMap,mergeDefaultMap,upgradeAuthorMap} from '../data/default-maps';
import { FOREST_ANIMALS } from '../data/ancient-forest';
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

// A chave e a origem do aplicativo permanecem iguais para localizar partidas antigas.
export const SAVE_KEY = 'depois-da-chuva-v1';
export const SAVE_BACKUP_KEY = 'depois-da-chuva-v1-backup';
export const SAVE_VERSION = 2;
const TOOLS: Tool[] = ['hand', 'plant', 'water', 'gate', 'repair', 'fence', 'bench', 'remove', 'hatchet', 'pickaxe', 'hoe', 'workbench', 'wall', 'door', 'floor', 'window', 'roof', 'blueprint'];
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
  if (value.forestMapEdits !== undefined && (!validateMapEdits(value.forestMapEdits)||value.forestMapEdits.area!=='forest')) return false;
  if (value.mapEdits !== undefined && (!validateMapEdits(value.mapEdits)||value.mapEdits.area!==undefined)) return false;
  if(value.propertyShoreRevision!==undefined&&value.propertyShoreRevision!==PROPERTY_SHORE_REVISION)return false;
  if(value.homesteadRevision!==undefined&&value.homesteadRevision!==1)return false;
  if(value.resourceFields!==undefined&&(!isRecord(value.resourceFields)||!validateResourceField(value.resourceFields.property,'property')||!validateResourceField(value.resourceFields.forest,'forest')))return false;
  if(value.resourceMilestones!==undefined&&(!isRecord(value.resourceMilestones)||typeof value.resourceMilestones.felled!=='boolean'||typeof value.resourceMilestones.mined!=='boolean'))return false;
  if (value.quickbar !== undefined && !validQuickbar(value.quickbar)) return false;
  if (value.activeArea !== undefined && value.activeArea !== 'property' && value.activeArea !== 'forest' && value.activeArea !== 'village') return false;
  if(value.activeArea==='village'&&(value.homePosition!==undefined||value.animalEscort!==undefined))return false;
  if(value.villageEconomy!==undefined&&!validateVillageEconomy(value.villageEconomy))return false;
  if(value.economy6!==undefined&&!validateEconomyState(value.economy6))return false;
  if(value.villageProgress!==undefined&&!validateVillageProgress(value.villageProgress))return false;
  if(value.villageInstallations!==undefined&&!validateVillageInstallations(value.villageInstallations))return false;
  if(value.villageSurvivors!==undefined&&!validateVillageSurvivors(value.villageSurvivors))return false;
  if (value.recruitedAnimals !== undefined && (!Array.isArray(value.recruitedAnimals) || new Set(value.recruitedAnimals).size !== value.recruitedAnimals.length || !value.recruitedAnimals.every(id => FOREST_ANIMALS.some(a => a.id === id)))) return false;
  if(value.animalEscort!==undefined){
    const escort=value.animalEscort;
    if(!isRecord(escort)||!FOREST_ANIMALS.some(a=>a.id===escort.id)||!['forest','property'].includes(escort.area as string)||escort.area!==(value.activeArea??'property')||escort.area==='forest'&&(value.recruitedAnimals as string[]|undefined)?.includes(escort.id as string))return false;
  }
  if(value.animalPositions!==undefined){
    if(!isRecord(value.animalPositions))return false;
    const ids=new Set<string>();
    for(const area of ['forest','property']){
      const list=value.animalPositions[area];if(!Array.isArray(list)||list.length>FOREST_ANIMALS.length)return false;
      for(const p of list){
        if(!isRecord(p)||typeof p.id!=='string'||ids.has(p.id)||!FOREST_ANIMALS.some(a=>a.id===p.id)||!finite(p.x,16,WORLD_WIDTH*TILE-16)||!finite(p.y,16,WORLD_HEIGHT*TILE-16)||!CHARACTER_DIRECTIONS.includes(p.direction as CharacterDirection))return false;
        const owned=(value.recruitedAnimals as string[]|undefined)?.includes(p.id)??false;
        if(area==='forest'&&owned||area==='property'&&!owned&&(!isRecord(value.animalEscort)||value.animalEscort.id!==p.id||value.animalEscort.area!=='property'))return false;
        ids.add(p.id);
      }
    }
    if(isRecord(value.animalEscort)&&!(value.animalPositions[value.animalEscort.area as string] as Array<{id:string}>).some(p=>p.id===(value.animalEscort as Record<string,unknown>).id))return false;
  }else if(value.animalEscort!==undefined)return false;
  if (value.forestPosition !== undefined && (!isRecord(value.forestPosition) || !finite(value.forestPosition.x, 32, 3040) || !finite(value.forestPosition.y, 32, 2272) || (value.forestPosition.direction !== undefined && !CHARACTER_DIRECTIONS.includes(value.forestPosition.direction as CharacterDirection)))) return false;
  if (value.villagePosition !== undefined && (!isRecord(value.villagePosition) || !finite(value.villagePosition.x, 32, 3040) || !finite(value.villagePosition.y, 32, 2272) || (value.villagePosition.direction !== undefined && !CHARACTER_DIRECTIONS.includes(value.villagePosition.direction as CharacterDirection)))) return false;
  if (value.wateringCanWater !== undefined && (!Number.isInteger(value.wateringCanWater) || !finite(value.wateringCanWater, 0, 8))) return false;
  if (value.homeSupplies !== undefined && (!isRecord(value.homeSupplies) || typeof value.homeSupplies.wateringCan !== 'boolean' || typeof value.homeSupplies.seedPacket !== 'boolean')) return false;
  if (!isRecord(value.player) || !finite(value.player.x, TILE / 2, WORLD_WIDTH * TILE - TILE / 2)
    || !finite(value.player.y, TILE / 2, WORLD_HEIGHT * TILE - TILE / 2)) return false;
  if (value.player.direction !== undefined && !CHARACTER_DIRECTIONS.includes(value.player.direction as CharacterDirection)) return false;
  if (value.home !== undefined && !validateHome(value.home)) return false;
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
  if (Object.keys(value.inventory).some(id => !ITEM_IDS.includes(id as typeof ITEM_IDS[number]))) return false;
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
      || !finite(crop.growth, 0, 1) || typeof crop.watered !== 'boolean' || (!crop.watered && crop.growth > 0)) return false;
    const key = String(crop.x) + ',' + String(crop.y);
    if (occupied.has(key)) return false;
    occupied.add(key);
  }
  for (const building of value.buildings) {
    if (!isRecord(building) || !integer(building.x, 1, WORLD_WIDTH - 2) || !integer(building.y, 1, WORLD_HEIGHT - 2)
      || !['gate', 'fence', 'bench', 'workbench', 'wall', 'door', 'floor', 'window', 'roof'].includes(building.kind as string)
      || isFarmTile(building.x, building.y) && !restored.has(`${building.x},${building.y}`)) return false;
    if (building.open !== undefined && (!['door','gate'].includes(building.kind as string) || typeof building.open !== 'boolean')) return false;
    if (building.rotation !== undefined && !(building.kind === 'gate' ? [0, 1, 2, 3] : building.kind === 'roof' ? [0, 1] : []).includes(building.rotation as number)) return false;
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
  // Only the new item is filled in. Missing older stock fields still reject a corrupt save.
  if (isRecord(value) && value.version === SAVE_VERSION && isRecord(value.inventory) && value.inventory.hoe === undefined) {
    value = { ...value, inventory: { ...value.inventory, hoe: 0 } };
  }
  if(isRecord(value)&&value.version===SAVE_VERSION&&isRecord(value.inventory)){
    const stock=value.inventory;
    const missing=VILLAGE_ITEM_IDS.filter(id=>!Object.hasOwn(stock,id));
    if(missing.length)value={...value,inventory:{...value.inventory,...Object.fromEntries(missing.map(id=>[id,0]))}};
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
  if(validateSave(value)){
    const data=structuredClone(value);
    if(!data.economy6){data.economy6=newEconomyState();for(const tool of ['hatchet','pickaxe','hoe'] as const){const tier=data.villageProgress?.toolLevels[tool]??0;if(tier>0&&data.inventory[tool]>0)data.economy6.tools[tool]={tier,durability:[100,250,450,800][tier]};}}
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
    economy6:newEconomyState(),day: 1, time: 8 * 60, metLia: false, villageEconomy: createVillageEconomy(), villageProgress:createVillageProgress(),
  };
}

export function loadSave(): SaveData | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? migrateSave(JSON.parse(raw)) : null;
  } catch { return null; }
}

export function hasSave(): boolean { return loadSave() !== null; }

export function saveGame(data: SaveData): boolean {
  try {
    if (!validateSave(data)) return false;
    const previous = localStorage.getItem(SAVE_KEY);
    if (previous) {
      let version: unknown;
      try { version = (JSON.parse(previous) as { version?: unknown })?.version; } catch { version = undefined; }
      // Uma versão anterior do aplicativo nunca substitui uma partida mais nova.
      if (typeof version === 'number' && version > SAVE_VERSION) return false;
      // Se o backup falhar, não substitua a partida antiga.
      if (version !== SAVE_VERSION && !localStorage.getItem(SAVE_BACKUP_KEY)) localStorage.setItem(SAVE_BACKUP_KEY, previous);
    }
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    return true;
  } catch { return false; }
}

export function clearSave(): boolean {
  try { localStorage.removeItem(SAVE_KEY); return true; } catch { return false; }
}
