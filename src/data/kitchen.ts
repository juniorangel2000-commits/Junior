import type {ItemId} from '../types';
/** Cozinha, etapa 1 (docs/planejamento/ANIMAIS-E-RECEITAS.md): fogão a lenha na casa,
 * receitas ensinadas pela Helena, uma por vez, e o caderno de receitas. */
export const DISH_IDS=['orangeJuice','pearJam','applePie','crabStew','heartyBreakfast','roastedFish','roastedCorn','roastedSweetPotato','minerBroth','fishStew','honeyCake','kaleOmelette','gardenSalad','homemadeBread','cornBroa','carrotCake','pamonha','oatPorridge','pumpkinSoup','beanTropeiro','strawberryPie','dulceDeLeche','cheeseHoneyBread','watermelonJuice','chamomileTea'] as const;
export type DishId=typeof DISH_IDS[number];
/** Cada prato gasta 1 madeira comum como lenha. */
export const STOVE_FUEL:ItemId='wood';
export const COOKING_SECONDS=1.5;
/** Onde o prato é feito: fogão a lenha (casa), forno de barro (máquina ao ar livre) ou
 * fogueira portátil (qualquer cenário aberto). */
export type CookingStation='stove'|'oven'|'campfire';
/** Como a receita é aprendida: com a Helena (padrão), já conhecida com a fogueira, ou escondida. */
export type DishSource='helena'|'campfire'|'mine'|'survivors'|'oldMap';
export interface DishRecipe{id:DishId;name:string;ingredients:Partial<Record<ItemId,number>>;vigor:number;price:number;learnFee:number;station?:CookingStation;source?:DishSource}
/** Na ordem em que a Helena ensina. Preço de venda inicial, a ajustar jogando. */
export const DISH_RECIPES:readonly DishRecipe[]=[
 {id:'kaleOmelette',name:'Omelete de couve',ingredients:{egg:2,kale:1},vigor:40,price:55,learnFee:20},
 {id:'gardenSalad',name:'Salada da horta',ingredients:{lettuce:1,tomato:1,carrot:1},vigor:35,price:95,learnFee:20},
 {id:'homemadeBread',name:'Pão caseiro',ingredients:{flour:2,egg:1,milk:1},vigor:45,price:130,learnFee:30,station:'oven'},
 {id:'heartyBreakfast',name:'Café da manhã reforçado',ingredients:{homemadeBread:1,egg:1,milk:1},vigor:50,price:210,learnFee:40},
 {id:'cornBroa',name:'Broa de milho',ingredients:{cornmeal:2,egg:1,butter:1},vigor:50,price:190,learnFee:30,station:'oven'},
 {id:'pamonha',name:'Pamonha',ingredients:{corn:2,milk:1,butter:1},vigor:55,price:165,learnFee:35},
 {id:'pumpkinSoup',name:'Sopa de abóbora',ingredients:{pumpkin:1,sweetPotato:1,butter:1},vigor:60,price:205,learnFee:35},
 {id:'carrotCake',name:'Bolo de cenoura',ingredients:{flour:2,egg:2,carrot:1,milk:1},vigor:60,price:180,learnFee:40,station:'oven'},
 {id:'beanTropeiro',name:'Feijão tropeiro',ingredients:{bean:2,kale:1,egg:1,cornmeal:1},vigor:70,price:155,learnFee:45},
 {id:'watermelonJuice',name:'Suco de melancia',ingredients:{watermelon:1,mint:1},vigor:30,price:135,learnFee:25},
 {id:'oatPorridge',name:'Mingau de aveia',ingredients:{oatFlakes:1,milk:1,honey:1},vigor:50,price:120,learnFee:35},
 {id:'chamomileTea',name:'Chá de camomila com mel',ingredients:{chamomile:1,honey:1},vigor:35,price:95,learnFee:30},
 {id:'dulceDeLeche',name:'Doce de leite',ingredients:{milk:3,honey:1},vigor:45,price:120,learnFee:40},
 {id:'strawberryPie',name:'Torta de morango',ingredients:{flour:2,strawberry:2,butter:1,duckEgg:1},vigor:70,price:275,learnFee:50,station:'oven'},
 {id:'cheeseHoneyBread',name:'Pão com queijo e mel',ingredients:{homemadeBread:1,cheese:1,honey:1},vigor:80,price:285,learnFee:50},
 // Frutas do Pomar Abandonado e caranguejo da Costa (preview.47).
 {id:'orangeJuice',name:'Suco de laranja',ingredients:{orange:2},vigor:30,price:70,learnFee:20},
 {id:'pearJam',name:'Doce de pera',ingredients:{pear:2,honey:1},vigor:40,price:130,learnFee:30},
 {id:'applePie',name:'Torta de maçã',ingredients:{flour:2,apple:3,butter:1,egg:1},vigor:70,price:260,learnFee:45,station:'oven'},
 {id:'crabStew',name:'Caranguejada',ingredients:{crab:2,tomato:1,sweetPotato:1},vigor:65,price:180,learnFee:40},
 // Fogueira portátil: pratos simples, já conhecidos de quem tem a fogueira.
 {id:'roastedFish',name:'Peixe assado',ingredients:{fish:1},vigor:30,price:30,learnFee:0,station:'campfire',source:'campfire'},
 {id:'roastedCorn',name:'Milho assado',ingredients:{corn:1},vigor:20,price:40,learnFee:0,station:'campfire',source:'campfire'},
 {id:'roastedSweetPotato',name:'Batata-doce assada',ingredients:{sweetPotato:1},vigor:25,price:50,learnFee:0,station:'campfire',source:'campfire'},
 // Receitas escondidas: aparecem como "???" no caderno até serem encontradas.
 {id:'minerBroth',name:'Caldo do mineiro',ingredients:{sweetPotato:1,kale:1,egg:1},vigor:65,price:95,learnFee:0,source:'mine'},
 {id:'fishStew',name:'Ensopado de peixe',ingredients:{fish:1,tomato:1,sweetPotato:1},vigor:70,price:110,learnFee:0,source:'survivors'},
 {id:'honeyCake',name:'Bolo de mel',ingredients:{flour:2,honey:1,egg:1,milk:1},vigor:75,price:190,learnFee:0,station:'oven',source:'oldMap'},
];
export const dishRecipe=(id:unknown)=>DISH_RECIPES.find(r=>r.id===id);
export const dishStation=(r:DishRecipe):CookingStation=>r.station??'stove';
export const dishSource=(r:DishRecipe):DishSource=>r.source??'helena';
/** Receitas que a Helena ensina, na ordem das aulas. */
export const HELENA_DISHES=DISH_RECIPES.filter(r=>dishSource(r)==='helena');
export const HIDDEN_DISH_HINTS:Partial<Record<DishSource,string>>={mine:'anotação perdida na Mina',survivors:'receita dos sobreviventes do acampamento',oldMap:'segredo do mapa antigo'};
export const isDish=(id:unknown):id is DishId=>DISH_IDS.includes(id as DishId);
/** Ingredientes que ainda não têm fonte no jogo: o caderno avisa em vez de esconder a receita. */
export const FUTURE_INGREDIENTS:Partial<Record<ItemId,string>>={};
