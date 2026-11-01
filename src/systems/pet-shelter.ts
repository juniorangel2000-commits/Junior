import type { SaveData, InventoryData, ItemId } from '../types';
import { Inventory } from './inventory';
import { buildingFootprint } from './building';
import type { OwnedPet } from '../dungeons/progression';

export const PET_SHELTER_CAPACITY = 3;
export interface PetShelterData { stage: 0 | 1 | 2 | 3; x: number; y: number }
export const SHELTER_STEPS: readonly { name: string; description: string; cost: Partial<InventoryData> }[] = [
  { name: 'Preparar a base', description: 'Limpar os escombros e reforçar o piso e os apoios.', cost: { plank: 6, stone: 8, cord: 2 } },
  { name: 'Reparar estrutura e telhado', description: 'Trocar as tábuas e fixar uma nova cobertura.', cost: { board: 8, peg: 12, metalPart: 2 } },
  { name: 'Preparar camas e potes', description: 'Concluir o abrigo, preparar camas e abastecer os potes. Libera três companheiros.', cost: { cloth: 6, fiber: 12, meal: 2 } },
];
export const SHELTER_SOURCES: Partial<Record<ItemId, string>> = {
  plank: 'Tobias vende; fabrique com troncos e machadinha.',
  stone: 'Augusto e Bento vendem; também pode ser coletada.',
  cord: 'Rosa e Celina vendem; também pode ser fabricada.',
  board: 'Tobias vende e prepara por serviço; também pode ser serrada na bancada.',
  peg: 'Tobias vende e prepara por serviço; também pode ser fabricada.',
  metalPart: 'Ícaro vende e prepara por serviço; o kit de oficina também fornece peças.',
  cloth: 'Celina vende e prepara por serviço; a costura libera a fabricação.',
  fiber: 'Rosa e Celina vendem; também pode ser coletada.',
  meal: 'Helena vende refeições na pousada.',
};
export function validPetShelter(value: unknown): value is PetShelterData {
  if (!value || typeof value !== 'object') return false;
  const v = value as PetShelterData;
  return Number.isInteger(v.stage) && v.stage >= 0 && v.stage <= 3
    && Number.isInteger(v.x) && Number.isInteger(v.y) && v.x >= 880 && v.x <= 1088 && v.y >= 224 && v.y <= 384;
}
export function shelterReserved(site: Pick<PetShelterData, 'x' | 'y'>, x: number, y: number): boolean {
  return Math.abs(x * 32 + 16 - site.x) <= 84 && y * 32 + 16 >= site.y - 90 && y * 32 + 16 <= site.y + 72;
}
export function shelterSolid(site: Pick<PetShelterData, 'x' | 'y'>, x: number, y: number): boolean {
  return Math.abs(x - site.x) < 35 && y > site.y - 29 && y < site.y - 5;
}
export function initializePetShelter(save: SaveData): void {
  if (save.petShelter) return;
  const occupied = [...save.buildings.flatMap(buildingFootprint), ...save.crops, ...(save.preparedSoil??[])];
  const sites = [{ x: 960, y: 352 }, { x: 896, y: 288 }, { x: 1056, y: 352 }, { x: 896, y: 224 }];
  const free = sites.find(site => !occupied.some(p => shelterReserved(site, p.x, p.y))
    && !Object.entries(save.mapEdits?.terrain ?? {}).some(([key, terrain]) => {
      const [x, y] = key.split(',').map(Number);
      return shelterReserved(site, x, y) && !['grass', 'moss', 'forest', 'meadow', 'soil', 'path'].includes(terrain);
    }) && !Object.values(save.mapEdits?.objects ?? {}).some(p => !p.removed && shelterReserved(site, p.x, p.y)));
  // Never remove player buildings, crops or deliberate map edits to place the shelter.
  if (free) save.petShelter = { ...free, stage: 0 };
}
export function canAdoptPet(save: Pick<SaveData, 'petShelter' | 'dungeons'>): boolean {
  return save.petShelter?.stage === 3 && (save.dungeons?.pets.length ?? 0) < PET_SHELTER_CAPACITY;
}
export function shelterUpgrade(save: SaveData): { ok: boolean; message: string } {
  const shelter = save.petShelter;
  if (!shelter) return { ok: false, message: 'Libere uma área atrás da casa para o abrigo.' };
  if (shelter.stage === 3) return { ok: false, message: 'A casinha já está totalmente reparada.' };
  const inventory = new Inventory(save.inventory), step = SHELTER_STEPS[shelter.stage];
  if (!inventory.has('hammer')) return { ok: false, message: 'Traga um martelo. Ele não será consumido.' };
  if (!inventory.spend(step.cost)) return { ok: false, message: 'Faltam materiais para esta etapa.' };
  save.inventory = { ...inventory.data };
  shelter.stage = (shelter.stage + 1) as PetShelterData['stage'];
  return { ok: true, message: shelter.stage === 3 ? 'Casinha pronta! Agora você pode resgatar até três companheiros.' : `${step.name}: concluído.` };
}
export function isShelterPet(pet: OwnedPet): boolean { return pet.world?.mode === 'shelter'; }
export function homePet(save: SaveData, id: string): { ok: boolean; message: string } {
  const pet = save.dungeons?.pets.find(p => p.id === id), site = save.petShelter;
  if (!pet || site?.stage !== 3) return { ok: false, message: 'Conclua os três reparos da casinha primeiro.' };
  const others = save.dungeons!.pets.filter(p => p.id !== id && isShelterPet(p));
  if (others.length >= PET_SHELTER_CAPACITY) return { ok: false, message: 'As três vagas da casinha estão ocupadas.' };
  pet.world = { mode: 'shelter', area: 'property', space: 'outdoors', x: site.x + (others.length - 1) * 24, y: site.y + 24, direction: 'south' };
  return { ok: true, message: 'Seu companheiro foi para o quintal da casinha.' };
}
