import type {CraftingRecipe} from './recipes';
import {CRAFTED_MACHINE_IDS} from './machines';
/** Onde e em que categoria cada receita é feita (pedido do Junior, 16/11/2026;
 * docs/construcoes/FABRICACAO.md).
 * - `hand`: sem bancada, em qualquer lugar.
 * - `workbench`: bancada de trabalho (ferramentas de ferro, equipamentos, serrar).
 * - `construction`: bancada de construção (peças de construção, máquinas e kits). */
export type CraftStation='hand'|'workbench'|'construction';
export type CraftCategory='materials'|'tools'|'actions'|'preparations'|'equipment'|'constructions'|'machines'|'kits';
export const CRAFT_STATIONS:readonly CraftStation[]=['hand','workbench','construction'];
export const STATION_NAMES:Record<CraftStation,string>={hand:'Sem bancada',workbench:'Bancada de trabalho',construction:'Bancada de construção'};
export const CATEGORY_NAMES:Record<CraftCategory,string>={materials:'Materiais',tools:'Ferramentas',actions:'Ações',preparations:'Preparados',equipment:'Equipamentos',constructions:'Construções',machines:'Máquinas',kits:'Kits'};
export const CATEGORY_ORDER:readonly CraftCategory[]=['materials','tools','actions','preparations','equipment','constructions','machines','kits'];
type Group=[CraftStation,CraftCategory];
const GROUPS:Record<string,Group>={
 cord:['hand','materials'],'flaked-stone':['hand','materials'],handle:['hand','materials'],pegs:['hand','materials'],'pet-bedding-cloth':['hand','materials'],
 hatchet:['hand','tools'],pickaxe:['hand','tools'],hoe:['hand','tools'],hammer:['hand','tools'],sickle:['hand','tools'],shovel:['hand','tools'],
 'rough-planks':['hand','actions'],
 bandage:['hand','preparations'],herbalTonic:['hand','preparations'],fungalInfusion:['hand','preparations'],fertilizer:['hand','preparations'],
 campfire:['hand','constructions'],
 blade:['workbench','materials'],
 handsaw:['workbench','tools'],shears:['workbench','tools'],milkPail:['workbench','tools'],
 sword:['workbench','equipment'],backpack:['workbench','equipment'],boots:['workbench','equipment'],accessory:['workbench','equipment'],
 'sawn-planks':['workbench','actions'],
 doorKit:['construction','constructions'],windowKit:['construction','constructions'],furniture:['construction','constructions'],
 forge:['construction','constructions'],lamp:['construction','constructions'],waterPump:['construction','constructions'],
 homeKit:['construction','kits'],workshopKit:['construction','kits'],survivorKit:['construction','kits'],
 ...Object.fromEntries(CRAFTED_MACHINE_IDS.map(id=>[id,['construction','machines'] as Group])),
};
/** Receita nova sem grupo: bancada de trabalho se pedia bancada, senão à mão; categoria Materiais. */
export const recipeStation=(r:CraftingRecipe):CraftStation=>GROUPS[r.id]?.[0]??(r.requiresWorkbench?'workbench':'hand');
export const recipeCategory=(r:CraftingRecipe):CraftCategory=>GROUPS[r.id]?.[1]??'materials';
/** Bancadas ao alcance do jogador. `true`/`false` (chamadas antigas) valem só para a de trabalho. */
export interface NearStations{workbench:boolean;construction:boolean}
export const nearStations=(near:boolean|NearStations):NearStations=>typeof near==='boolean'?{workbench:near,construction:false}:near;
export const stationReady=(station:CraftStation,near:boolean|NearStations)=>station==='hand'||nearStations(near)[station];
