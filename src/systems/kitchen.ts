import type {SaveData,ItemId} from '../types';
import {DISH_RECIPES,STOVE_FUEL,FUTURE_INGREDIENTS,dishRecipe,type DishRecipe} from '../data/kitchen';
import {ITEM_NAMES} from '../data/items';
import {Inventory} from './inventory';
import {createVillageProgress} from '../data/village-progress';
import {HOME_HEIGHT,HOME_WIDTH,validateHome,type HomeData} from './home';
type Result={ok:boolean;message:string};
type Writer=(d:SaveData)=>boolean;
const fail=(message:string):Result=>({ok:false,message});

export const knownDishes=(s:SaveData)=>DISH_RECIPES.filter(r=>s.villageProgress?.recipes.includes(r.id));
/** Próxima receita que a Helena ensina: uma por vez, na ordem de `DISH_RECIPES`. */
export const nextDishLesson=(s:SaveData):DishRecipe|undefined=>DISH_RECIPES.find(r=>!s.villageProgress?.recipes.includes(r.id));

export interface IngredientStatus{item:ItemId;name:string;need:number;have:number;future?:string}
/** Ingredientes de uma receita, com o que falta. A lenha entra como mais um item. */
export function dishIngredients(s:SaveData,r:DishRecipe):IngredientStatus[]{
 const need:Partial<Record<ItemId,number>>={...r.ingredients};need[STOVE_FUEL]=(need[STOVE_FUEL]??0)+1;
 return Object.entries(need).map(([id,n])=>({item:id as ItemId,name:ITEM_NAMES[id as ItemId],need:n!,have:s.inventory[id as ItemId]??0,future:FUTURE_INGREDIENTS[id as ItemId]}));
}
export const canCookDish=(s:SaveData,r:DishRecipe)=>dishIngredients(s,r).every(i=>i.have>=i.need);

/** Cozinha um prato no fogão: gasta os ingredientes e 1 madeira; salva antes de aplicar. */
export function cookDish(s:SaveData,id:string,write:Writer):Result{
 const r=dishRecipe(id);if(!r)return fail('Receita desconhecida.');
 if(!s.villageProgress?.recipes.includes(r.id))return fail('Aprenda esta receita com a Helena, na pousada.');
 const missing=dishIngredients(s,r).filter(i=>i.have<i.need);
 if(missing.length)return fail('Falta: '+missing.map(i=>`${i.need-i.have} ${i.name.toLowerCase()}`+(i.future?` (${i.future})`:'')).join(', ')+'.');
 const d=structuredClone(s),inv=new Inventory(d.inventory),cost={...r.ingredients,[STOVE_FUEL]:(r.ingredients[STOVE_FUEL]??0)+1};
 if(!inv.transact(cost,{[r.id]:1}))return fail('Libere espaço na mochila para o prato.');
 d.inventory=inv.data;
 try{if(!write(d))return fail('Não foi possível salvar. Os ingredientes foram preservados.');}catch{return fail('Não foi possível salvar. Os ingredientes foram preservados.');}
 s.inventory=d.inventory;return{ok:true,message:`${r.name} pronto! Coma pela mochila para recuperar ${r.vigor} de vigor.`};
}
/** Serviço da Helena: ensina a próxima receita. Lança erro com a mensagem, como os outros serviços. */
export function learnNextDish(s:SaveData,payCoins:(coins:number)=>void):DishRecipe{
 const r=nextDishLesson(s);if(!r)throw Error('Você já aprendeu todas as receitas da pousada.');
 payCoins(r.learnFee);(s.villageProgress??=createVillageProgress()).recipes.push(r.id);return r;
}

/** Casas salvas antes da cozinha recebem o fogão no primeiro lugar livre, de preferência
 * encostado na parede do fundo. Se não couber, a casa fica como está e o fogão pode ser
 * colocado pelo editor da casa. */
export function withWoodStove(home:HomeData,accept:(next:HomeData)=>boolean=()=>true):HomeData{
 if(home.furniture.some(p=>p.kind==='woodStove'))return home;
 const ids=home.furniture.map(p=>Number(p.id.split('-').at(-1))).filter(Number.isFinite),id=`home-woodStove-${Math.max(0,...ids)+1}`;
 const spots=[{x:5,y:2}];for(let y=2;y<HOME_HEIGHT-2;y++)for(let x=1;x<HOME_WIDTH-2;x++)spots.push({x,y});
 for(const p of spots){const next={...home,furniture:[...home.furniture,{id,kind:'woodStove' as const,x:p.x,y:p.y}]};if(validateHome(next)&&accept(next))return next;}
 return home;
}
