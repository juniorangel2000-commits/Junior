import {DISH_RECIPES,dishStation,STOVE_FUEL} from './kitchen';
import type {ItemId} from '../types';
import type {ItemCost} from '../systems/inventory';
export const MACHINE_IDS=['cheesePress','butterChurn','spinningWheel','loom','stoneMill','clayOven','beehive'] as const;
export type MachineKind=typeof MACHINE_IDS[number];
export const MACHINE_PRODUCTS=['cheese','goatCheese','butter','yarn','flour','cornmeal','oatFlakes','cloth'] as const;
export const isMachine=(v:unknown):v is MachineKind=>MACHINE_IDS.includes(v as MachineKind);
export const MACHINES:Record<MachineKind,{name:string;width:number;npc:'bento'|'tobias'|'icaro'|'helena'|'augusto';learnFee:number;cost:ItemCost}>={
 cheesePress:{name:'Queijeira',width:1,npc:'bento',learnFee:60,cost:{board:8,ironIngot:2,peg:4}},
 butterChurn:{name:'Batedeira de manteiga',width:1,npc:'bento',learnFee:50,cost:{board:6,ironShard:4,peg:2}},
 spinningWheel:{name:'Roca',width:2,npc:'tobias',learnFee:40,cost:{board:8,cord:4,peg:4}},
 loom:{name:'Tear',width:2,npc:'tobias',learnFee:50,cost:{board:12,cord:6,peg:6,hardwood:2}},
 clayOven:{name:'Forno de barro',width:2,npc:'helena',learnFee:60,cost:{stone:24,wood:10,board:4,ironShard:2}},
 /** Colmeia povoada: não se monta nem se aprende; vem do enxame dos ipês (beekeeping.ts). */
 beehive:{name:'Colmeia',width:1,npc:'augusto',learnFee:0,cost:{}},
 stoneMill:{name:'Moinho de pedra',width:2,npc:'icaro',learnFee:60,cost:{stone:20,ironIngot:2,board:6,metalPart:1}},
};
/** `ingredients`: receita de vários itens (forno), carregada pelo caderno, não pelo item solto. */
export interface MachineRecipe{id:string;machine:MachineKind;input:ItemId;amount:number;output:ItemId;quantity:number;minutes:number;ingredients?:Partial<Record<ItemId,number>>}
export const MACHINE_RECIPES:readonly MachineRecipe[]=[
 {id:'cheese',machine:'cheesePress',input:'milk',amount:1,output:'cheese',quantity:1,minutes:1440},
 {id:'goatCheese',machine:'cheesePress',input:'goatMilk',amount:1,output:'goatCheese',quantity:1,minutes:1440},
 {id:'butter',machine:'butterChurn',input:'milk',amount:2,output:'butter',quantity:1,minutes:720},
 {id:'yarn',machine:'spinningWheel',input:'wool',amount:1,output:'yarn',quantity:1,minutes:1440},
 {id:'cloth',machine:'loom',input:'yarn',amount:2,output:'cloth',quantity:1,minutes:1440},
 {id:'flour',machine:'stoneMill',input:'wheat',amount:2,output:'flour',quantity:1,minutes:720},
 {id:'cornmeal',machine:'stoneMill',input:'corn',amount:2,output:'cornmeal',quantity:1,minutes:720},
 {id:'oatFlakes',machine:'stoneMill',input:'oat',amount:2,output:'oatFlakes',quantity:1,minutes:720},
];
/** Forno de barro: pães e bolos do caderno, meio dia por fornada, com 1 madeira de lenha. */
export const OVEN_MINUTES=720;
(MACHINE_RECIPES as MachineRecipe[]).push(...DISH_RECIPES.filter(r=>dishStation(r)==='oven').map(r=>{const ingredients={...r.ingredients,[STOVE_FUEL]:(r.ingredients[STOVE_FUEL]??0)+1},[input,amount]=Object.entries(r.ingredients)[0] as [ItemId,number];
 return{id:'oven-'+r.id,machine:'clayOven' as const,input,amount,output:r.id,quantity:1,minutes:OVEN_MINUTES,ingredients};}));
/** Colmeia: produz sozinha a cada 4 dias, sem carga (o mel de flor é decidido na coleta). */
export const HIVE_MINUTES=4*1440;
(MACHINE_RECIPES as MachineRecipe[]).push({id:'hive-honey',machine:'beehive',input:'honey',amount:0,output:'honey',quantity:1,minutes:HIVE_MINUTES,ingredients:{}});
/** Máquinas que se aprendem com um morador e se montam na bancada. */
export const CRAFTED_MACHINE_IDS=MACHINE_IDS.filter(id=>id!=='beehive');
export const machineIngredient=(v:unknown)=>MACHINE_RECIPES.some(r=>!r.ingredients&&r.input===v);
