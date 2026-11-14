import type {ItemCost} from '../systems/inventory';
export const FARM_KINDS=['coop','barn','silo','stable','aprisco']as const;
export type FarmKind=typeof FARM_KINDS[number];
export type FarmTool=`farm-${FarmKind}`;
export const isFarmTool=(v:string):v is FarmTool=>FARM_KINDS.some(k=>v==='farm-'+k);
export const isLegacyHouseTool=(v:string)=>['blueprint','wall','floor','door','window','roof'].includes(v);
/** Initial tunable construction costs, paid at the actual site after its base. */
export const FIBERS_PER_HAY=3;
export const FARM_BASE_COST:ItemCost={wood:4,stone:4};
/** Regra do projeto: toda construção de animais (com `animal`) exige madeira
 * nobre dos ipês dos Campos Abertos, inclusive as próximas que forem criadas. */
export const ANIMAL_BUILDING_MATERIAL='hardwood';
/** Materials added to a cost after release. Buildings finished before that
 * are treated as fully supplied; unfinished sites must still deliver them. */
export const LATER_FARM_MATERIALS=['hardwood'] as const;
export const FARM_BUILDINGS:Record<FarmKind,{name:string;width:number;height:number;bodyRows:number;cost:ItemCost;capacity:number;animal?:'chicken'|'cow'|'horse'|'sheep';allowedAnimals?:readonly ('sheep'|'goat')[];openYard?:boolean;description:string}>={
 coop:{name:'Galinheiro',width:5,height:5,bodyRows:3,cost:{wood:40,stone:16,plank:12,hardwood:6,doorKit:1,windowKit:1},capacity:6,animal:'chicken',description:'Abrigo e cercado para as galinhas da propriedade.'},
 barn:{name:'Curral',width:7,height:6,bodyRows:4,cost:{wood:70,stone:28,plank:20,hardwood:10,doorKit:1,windowKit:1},capacity:4,animal:'cow',description:'Estábulo com cercado para as vacas da propriedade.'},
 stable:{name:'Estábulo',width:7,height:6,bodyRows:4,cost:{wood:80,stone:28,plank:24,hardwood:12,windowKit:1},capacity:1,animal:'horse',openYard:true,description:'Abrigo aberto para um cavalo domado, sem cercas nem porteira. O cavalo passeia e retorna ao seu abrigo.'},
 aprisco:{name:'Aprisco',width:7,height:6,bodyRows:4,cost:{wood:60,stone:24,plank:18,hardwood:8,doorKit:1,windowKit:1},capacity:4,animal:'sheep',allowedAnimals:['sheep','goat'],description:'Abrigo para até quatro ovelhas e cabras, com cocho e área de tosquia.'},
 silo:{name:'Silo',width:3,height:3,bodyRows:2,cost:{stone:40,wood:16,ironShard:8,fiber:20},capacity:240,description:'Armazena palha e seca o capim dos Campos Abertos em um dia. Também prepara 1 palha com 3 fibras vegetais.'},
};

/** Moradias mistas usam a mesma regra no alojamento, painel e validação do save. */
export function farmAcceptsAnimal(kind:FarmKind,animal:unknown):boolean{const d=FARM_BUILDINGS[kind];return d.allowedAnimals?d.allowedAnimals.some(k=>k===animal):!!d.animal&&d.animal===animal;}
