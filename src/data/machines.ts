import type {ItemId} from '../types';
import type {ItemCost} from '../systems/inventory';
export const MACHINE_IDS=['cheesePress','butterChurn','spinningWheel','loom','stoneMill'] as const;
export type MachineKind=typeof MACHINE_IDS[number];
export const MACHINE_PRODUCTS=['cheese','goatCheese','butter','yarn','flour','cornmeal','oatFlakes','cloth'] as const;
export const isMachine=(v:unknown):v is MachineKind=>MACHINE_IDS.includes(v as MachineKind);
export const MACHINES:Record<MachineKind,{name:string;width:number;npc:'bento'|'tobias'|'icaro';learnFee:number;cost:ItemCost}>={
 cheesePress:{name:'Queijeira',width:1,npc:'bento',learnFee:60,cost:{board:8,ironIngot:2,peg:4}},
 butterChurn:{name:'Batedeira de manteiga',width:1,npc:'bento',learnFee:50,cost:{board:6,ironShard:4,peg:2}},
 spinningWheel:{name:'Roca',width:2,npc:'tobias',learnFee:40,cost:{board:8,cord:4,peg:4}},
 loom:{name:'Tear',width:2,npc:'tobias',learnFee:50,cost:{board:12,cord:6,peg:6,hardwood:2}},
 stoneMill:{name:'Moinho de pedra',width:2,npc:'icaro',learnFee:60,cost:{stone:20,ironIngot:2,board:6,metalPart:1}},
};
export interface MachineRecipe{id:string;machine:MachineKind;input:ItemId;amount:number;output:ItemId;quantity:number;minutes:number}
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
export const machineIngredient=(v:unknown)=>MACHINE_RECIPES.some(r=>r.input===v);
