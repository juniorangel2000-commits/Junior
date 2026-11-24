import type {CraftingRecipe} from './recipes';
import {CRAFTED_MACHINE_IDS,MACHINES} from './machines';
/** Onde e em que categoria cada receita é feita (pedido do Junior, 16/11/2026;
 * docs/construcoes/FABRICACAO.md).
 * - `hand`: sem bancada, em qualquer lugar.
 * - `workbench`: bancada de trabalho (ferramentas de ferro, equipamentos, serrar).
 * - `construction`: bancada de construção (peças de construção, máquinas e kits). */
export type CraftStation='hand'|'workbench'|'construction';
export type CraftCategory='materials'|'tools'|'healing'|'field'|'animals'|'equipment'|'combat'|'upgrades'|'house'|'furniture'|'installations'|'machines'|'projects';
export const CRAFT_STATIONS:readonly CraftStation[]=['hand','workbench','construction'];
/** Título de cada janela: a tecla C abre a das receitas sem bancada ("Fabricação"). */
export const STATION_NAMES:Record<CraftStation,string>={hand:'Fabricação',workbench:'Bancada de trabalho',construction:'Bancada de construção'};
export const CATEGORY_NAMES:Record<CraftCategory,string>={materials:'Materiais',tools:'Ferramentas',healing:'Cura',field:'Campo',animals:'Criação',equipment:'Equipamentos',combat:'Combate',upgrades:'Melhorias',house:'Peças da casa',furniture:'Móveis',installations:'Instalações',machines:'Máquinas',projects:'Projetos'};
/** Ícone (arte de um item do jogo) de cada categoria no filtro das telas de fabricar. */
export const CATEGORY_ICONS:Record<CraftCategory|'all'|'learn',string>={all:'workbench',learn:'oldMap',materials:'plank',tools:'pickaxe',upgrades:'ironIngot',healing:'bandage',field:'campfire',animals:'milkPail',equipment:'backpack',combat:'sword',house:'doorKit',furniture:'furniture',installations:'waterPump',machines:'cheesePress',projects:'log'};
export const CATEGORY_ORDER:readonly CraftCategory[]=['materials','tools','upgrades','healing','field','animals','equipment','combat','house','furniture','installations','machines','projects'];
type Group=[CraftStation,CraftCategory];
const GROUPS:Record<string,Group>={
 cord:['hand','materials'],'flaked-stone':['hand','materials'],handle:['hand','materials'],pegs:['hand','materials'],'pet-bedding-cloth':['hand','materials'],'rough-planks':['hand','materials'],
 hatchet:['hand','tools'],pickaxe:['hand','tools'],hoe:['hand','tools'],hammer:['hand','tools'],sickle:['workbench','tools'],shovel:['workbench','tools'],
 bandage:['hand','healing'],herbalTonic:['hand','healing'],fungalInfusion:['hand','healing'],
 fertilizer:['hand','field'],campfire:['hand','field'],
 blade:['workbench','materials'],'sawn-planks':['workbench','materials'],
 handsaw:['workbench','tools'],
 shears:['workbench','animals'],milkPail:['workbench','animals'],
 backpack:['workbench','equipment'],boots:['workbench','equipment'],accessory:['workbench','equipment'],
 sword:['workbench','combat'],
 doorKit:['construction','house'],windowKit:['construction','house'],
 furniture:['construction','furniture'],
 forge:['construction','installations'],lamp:['construction','installations'],waterPump:['construction','installations'],
 homeKit:['construction','projects'],workshopKit:['construction','projects'],survivorKit:['construction','projects'],
 ...Object.fromEntries(CRAFTED_MACHINE_IDS.map(id=>[id,['construction','machines'] as Group])),
};
/** Quem ensina cada receita (filtro "Para aprender"). */
const TEACHERS:Record<string,string>={bandage:'Amélia',herbalTonic:'Amélia',fungalInfusion:'Amélia',fertilizer:'Rosa',backpack:'Celina',boots:'Celina',accessory:'Celina','pet-bedding-cloth':'Celina',
 lamp:'Ícaro',waterPump:'Ícaro',homeKit:'Tobias',workshopKit:'Tobias',survivorKit:'Tobias'};
const NPC_NAMES:Record<string,string>={bento:'Bento',tobias:'Tobias',icaro:'Ícaro',helena:'Helena',augusto:'Augusto'};
export function recipeTeacher(r:CraftingRecipe):string|undefined{
 if(r.upgrade)return 'Bento';
 if(TEACHERS[r.id])return TEACHERS[r.id];
 const m=(CRAFTED_MACHINE_IDS as readonly string[]).includes(r.id)?MACHINES[r.id as keyof typeof MACHINES]:undefined;
 return m?NPC_NAMES[m.npc]:undefined;
}
/** Receita nova sem grupo: bancada de trabalho se pedia bancada, senão à mão; categoria Materiais. */
export const recipeStation=(r:CraftingRecipe):CraftStation=>r.upgrade?'workbench':GROUPS[r.id]?.[0]??(r.requiresWorkbench?'workbench':'hand');
export const recipeCategory=(r:CraftingRecipe):CraftCategory=>r.upgrade?'upgrades':GROUPS[r.id]?.[1]??'materials';
/** Bancadas ao alcance do jogador. `true`/`false` (chamadas antigas) valem só para a de trabalho. */
export interface NearStations{workbench:boolean;construction:boolean}
export const nearStations=(near:boolean|NearStations):NearStations=>typeof near==='boolean'?{workbench:near,construction:false}:near;
export const stationReady=(station:CraftStation,near:boolean|NearStations)=>station==='hand'||nearStations(near)[station];
