import type {ItemId} from '../types';
/** Cozinha, etapa 1 (docs/planejamento/ANIMAIS-E-RECEITAS.md): fogão a lenha na casa,
 * receitas ensinadas pela Helena, uma por vez, e o caderno de receitas. */
export const DISH_IDS=['kaleOmelette','gardenSalad','homemadeBread','cornBroa','carrotCake','pamonha','oatPorridge','pumpkinSoup','beanTropeiro','strawberryPie','dulceDeLeche','cheeseHoneyBread','watermelonJuice','chamomileTea'] as const;
export type DishId=typeof DISH_IDS[number];
/** Cada prato gasta 1 madeira comum como lenha. */
export const STOVE_FUEL:ItemId='wood';
export const COOKING_SECONDS=1.5;
export interface DishRecipe{id:DishId;name:string;ingredients:Partial<Record<ItemId,number>>;vigor:number;price:number;learnFee:number}
/** Na ordem em que a Helena ensina. Preço de venda inicial, a ajustar jogando. */
export const DISH_RECIPES:readonly DishRecipe[]=[
 {id:'kaleOmelette',name:'Omelete de couve',ingredients:{egg:2,kale:1},vigor:40,price:36,learnFee:20},
 {id:'gardenSalad',name:'Salada da horta',ingredients:{lettuce:1,tomato:1,carrot:1},vigor:35,price:60,learnFee:20},
 {id:'homemadeBread',name:'Pão caseiro',ingredients:{flour:2,egg:1,milk:1},vigor:45,price:80,learnFee:30},
 {id:'cornBroa',name:'Broa de milho',ingredients:{cornmeal:2,egg:1,butter:1},vigor:50,price:115,learnFee:30},
 {id:'pamonha',name:'Pamonha',ingredients:{corn:2,milk:1,butter:1},vigor:55,price:110,learnFee:35},
 {id:'pumpkinSoup',name:'Sopa de abóbora',ingredients:{pumpkin:1,sweetPotato:1,butter:1},vigor:60,price:110,learnFee:35},
 {id:'carrotCake',name:'Bolo de cenoura',ingredients:{flour:2,egg:2,carrot:1,milk:1},vigor:60,price:110,learnFee:40},
 {id:'beanTropeiro',name:'Feijão tropeiro',ingredients:{bean:2,kale:1,egg:1,cornmeal:1},vigor:70,price:100,learnFee:45},
 {id:'watermelonJuice',name:'Suco de melancia',ingredients:{watermelon:1,mint:1},vigor:30,price:70,learnFee:25},
 {id:'oatPorridge',name:'Mingau de aveia',ingredients:{oatFlakes:1,milk:1,honey:1},vigor:50,price:75,learnFee:35},
 {id:'chamomileTea',name:'Chá de camomila com mel',ingredients:{chamomile:1,honey:1},vigor:35,price:55,learnFee:30},
 {id:'dulceDeLeche',name:'Doce de leite',ingredients:{milk:3,honey:1},vigor:45,price:95,learnFee:40},
 {id:'strawberryPie',name:'Torta de morango',ingredients:{flour:2,strawberry:2,butter:1,duckEgg:1},vigor:70,price:160,learnFee:50},
 {id:'cheeseHoneyBread',name:'Pão com queijo e mel',ingredients:{homemadeBread:1,cheese:1,honey:1},vigor:80,price:170,learnFee:50},
];
export const dishRecipe=(id:unknown)=>DISH_RECIPES.find(r=>r.id===id);
export const isDish=(id:unknown):id is DishId=>DISH_IDS.includes(id as DishId);
/** Ingredientes que ainda não têm fonte no jogo: o caderno avisa em vez de esconder a receita. */
export const FUTURE_INGREDIENTS:Partial<Record<ItemId,string>>={honey:'mel chega com as abelhas',duckEgg:'ovo de pato chega com a criação de patos'};
