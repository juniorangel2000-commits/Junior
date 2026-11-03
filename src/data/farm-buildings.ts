import type {ItemCost} from '../systems/inventory';
export const FARM_KINDS=['coop','barn','silo']as const;
export type FarmKind=typeof FARM_KINDS[number];
export type FarmTool=`farm-${FarmKind}`;
export const isFarmTool=(v:string):v is FarmTool=>FARM_KINDS.some(k=>v==='farm-'+k);
export const isLegacyHouseTool=(v:string)=>['blueprint','wall','floor','door','window','roof'].includes(v);
/** Initial tunable construction costs, paid at the actual site after its base. */
export const FARM_BASE_COST:ItemCost={wood:4,stone:4};
export const FARM_BUILDINGS:Record<FarmKind,{name:string;width:number;height:number;bodyRows:number;cost:ItemCost;capacity:number;animal?:'chicken'|'cow';description:string}>={
 coop:{name:'Galinheiro',width:5,height:5,bodyRows:3,cost:{wood:40,stone:16,plank:12,doorKit:1,windowKit:1},capacity:6,animal:'chicken',description:'Abrigo e cercado para as galinhas da propriedade.'},
 barn:{name:'Curral',width:7,height:6,bodyRows:4,cost:{wood:70,stone:28,plank:20,doorKit:1,windowKit:1},capacity:4,animal:'cow',description:'Estábulo com cercado para as vacas da propriedade.'},
 silo:{name:'Silo',width:3,height:3,bodyRows:2,cost:{stone:40,wood:16,ironShard:8,fiber:20},capacity:240,description:'Armazena palha. Fibras vegetais podem ser preparadas em palha no local.'},
};
