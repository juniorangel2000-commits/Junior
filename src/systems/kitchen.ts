import type {SaveData,ItemId} from '../types';
import {DISH_RECIPES,HELENA_DISHES,STOVE_FUEL,FUTURE_INGREDIENTS,dishRecipe,dishStation,dishSource,type DishRecipe,type CookingStation,type DishSource} from '../data/kitchen';
import {ITEM_NAMES} from '../data/items';
import {Inventory} from './inventory';
import {createVillageProgress} from '../data/village-progress';
import {takeIngredientsQuality,gainQuality,qualityName,qualityPrice,takeBest,QUALITY_FACTOR,type Quality} from './item-quality';
import {HOME_HEIGHT,HOME_WIDTH,validateHome,type HomeData} from './home';
type Result={ok:boolean;message:string};
type Writer=(d:SaveData)=>boolean;
const fail=(message:string):Result=>({ok:false,message});

/** Receita conhecida: aprendida (Helena ou escondida) ou da fogueira, que não precisa de aula. */
export const knowsDish=(s:SaveData,r:DishRecipe)=>dishSource(r)==='campfire'||!!s.villageProgress?.recipes.includes(r.id);
export const knownDishes=(s:SaveData,station?:CookingStation)=>DISH_RECIPES.filter(r=>knowsDish(s,r)&&(!station||dishStation(r)===station));
/** Receitas escondidas ainda não encontradas para esta estação: o caderno mostra "???". */
export const hiddenDishes=(s:SaveData,station:CookingStation)=>DISH_RECIPES.filter(r=>!['helena','campfire'].includes(dishSource(r))&&dishStation(r)===station&&!knowsDish(s,r));
/** Próxima receita que a Helena ensina: uma por vez, na ordem de `HELENA_DISHES`. */
export const nextDishLesson=(s:SaveData):DishRecipe|undefined=>HELENA_DISHES.find(r=>!s.villageProgress?.recipes.includes(r.id));
export const STATION_NAMES:Record<CookingStation,string>={stove:'fogão a lenha',oven:'forno de barro',campfire:'fogueira'};

export interface IngredientStatus{item:ItemId;name:string;need:number;have:number;future?:string}
/** Ingredientes de uma receita, com o que falta. A lenha entra como mais um item. */
export function dishIngredients(s:SaveData,r:DishRecipe):IngredientStatus[]{
 const need:Partial<Record<ItemId,number>>={...r.ingredients};need[STOVE_FUEL]=(need[STOVE_FUEL]??0)+1;
 return Object.entries(need).map(([id,n])=>({item:id as ItemId,name:ITEM_NAMES[id as ItemId],need:n!,have:s.inventory[id as ItemId]??0,future:FUTURE_INGREDIENTS[id as ItemId]}));
}
export const canCookDish=(s:SaveData,r:DishRecipe)=>dishIngredients(s,r).every(i=>i.have>=i.need);

/** Confere receita, estação e ingredientes. */
export function cookCheck(s:SaveData,id:string,station:CookingStation):Result&{recipe?:DishRecipe}{
 const r=dishRecipe(id);if(!r)return fail('Receita desconhecida.');
 if(dishStation(r)!==station)return fail(`${r.name} é feito no ${STATION_NAMES[dishStation(r)]}.`);
 if(!knowsDish(s,r))return fail(dishSource(r)==='helena'?'Aprenda esta receita com a Helena, na pousada.':'Você ainda não encontrou esta receita.');
 const missing=dishIngredients(s,r).filter(i=>i.have<i.need);
 if(missing.length)return fail('Falta: '+missing.map(i=>`${i.need-i.have} ${i.name.toLowerCase()}`+(i.future?` (${i.future})`:'')).join(', ')+'.');
 return{ok:true,message:'',recipe:r};
}
export const dishCost=(r:DishRecipe)=>({...r.ingredients,[STOVE_FUEL]:(r.ingredients[STOVE_FUEL]??0)+1});
/** Cozinha um prato no fogão ou na fogueira: gasta os ingredientes e 1 madeira; salva antes de aplicar. */
export function cookDish(s:SaveData,id:string,write:Writer,station:CookingStation='stove'):Result{
 const check=cookCheck(s,id,station);if(!check.recipe)return check;const r=check.recipe;
 const d=structuredClone(s),inv=new Inventory(d.inventory),cost=dishCost(r);
 if(!inv.transact(cost,{[r.id]:1}))return fail('Libere espaço na mochila para o prato.');
 const q=takeIngredientsQuality(d,cost);d.inventory=inv.data;gainQuality(d,r.id,d.inventory[r.id],q);
 try{if(!write(d))return fail('Não foi possível salvar. Os ingredientes foram preservados.');}catch{return fail('Não foi possível salvar. Os ingredientes foram preservados.');}
 s.inventory=d.inventory;if(d.itemQuality)s.itemQuality=d.itemQuality;else delete s.itemQuality;return{ok:true,message:dishReadyMessage(r,q)};
}
/** Vigor de um prato com a qualidade aplicada. */
export const dishVigor=(r:DishRecipe,q:Quality)=>Math.round(r.vigor*QUALITY_FACTOR[q]);
const dishReadyMessage=(r:DishRecipe,q:Quality)=>`${qualityName(r.id,q)} pronto! Coma pela mochila para recuperar ${dishVigor(r,q)} de vigor.`;
/** Serviço da Helena: ensina a próxima receita. Lança erro com a mensagem, como os outros serviços. */
export function learnNextDish(s:SaveData,payCoins:(coins:number)=>void):DishRecipe{
 const r=nextDishLesson(s);if(!r)throw Error('Você já aprendeu todas as receitas da pousada.');
 payCoins(r.learnFee);(s.villageProgress??=createVillageProgress()).recipes.push(r.id);return r;
}
/** Encontra uma receita escondida (Mina, sobreviventes ou mapa antigo). Devolve a receita
 * se ela acabou de ser descoberta; o chamador salva. */
export function discoverDish(s:SaveData,source:DishSource):DishRecipe|undefined{
 const r=DISH_RECIPES.find(r=>dishSource(r)===source);const p=s.villageProgress??=createVillageProgress();
 if(!r||p.recipes.includes(r.id))return;p.recipes.push(r.id);return r;
}
/** Descobre a receita e salva; se salvar falhar, a descoberta é desfeita para tentar de novo depois. */
export function discoverDishAndSave(s:SaveData,source:DishSource,persist:()=>boolean):DishRecipe|undefined{
 const r=discoverDish(s,source);if(!r)return;
 let ok=false;try{ok=persist();}catch{ok=false;}
 if(!ok){s.villageProgress!.recipes=s.villageProgress!.recipes.filter(id=>id!==r.id);return;}
 return r;
}
export const discoveryMessage=(r:DishRecipe)=>`Receita encontrada: ${r.name}. Ela já está no caderno de receitas.`;
/** Cozinha em qualquer cenário: altera o estado do cenário, sincroniza a mochila dele
 * (Vale e Vila guardam uma cópia própria) e salva; se salvar falhar, desfaz tudo. */
export function cookInScene(s:SaveData,id:string,station:CookingStation,persist:()=>boolean,sync:(inventory:SaveData['inventory'])=>void=()=>{}):Result{
 const check=cookCheck(s,id,station);if(!check.recipe)return check;const r=check.recipe;
 const before=s.inventory,beforeQuality=structuredClone(s.itemQuality),inv=new Inventory(structuredClone(before));
 if(!inv.transact(dishCost(r),{[r.id]:1}))return fail('Libere espaço na mochila para o prato.');
 const q=takeIngredientsQuality(s,dishCost(r));s.inventory=inv.data;gainQuality(s,r.id,s.inventory[r.id],q);sync(s.inventory);
 let saved=false;try{saved=persist();}catch{saved=false;}
 if(!saved){s.inventory=before;if(beforeQuality)s.itemQuality=beforeQuality;else delete s.itemQuality;sync(before);return fail('Não foi possível salvar. Os ingredientes foram preservados.');}
 return{ok:true,message:dishReadyMessage(r,q)};
}

/** Prato do dia da pousada: a Helena paga o dobro por 1 unidade, uma vez por dia.
 * Escolhido pelo calendário entre os pratos da Helena, então recarregar não sorteia de novo. */
export const DISH_OF_DAY_FACTOR=2;
export function dishOfDay(day:number):DishRecipe{
 const pool=DISH_RECIPES.filter(r=>dishSource(r)==='helena'&&!Object.keys(r.ingredients).some(k=>FUTURE_INGREDIENTS[k as ItemId]));
 return pool[((Math.imul(Math.max(1,Math.floor(day)),2654435761)>>>0)%pool.length)];
}
export function sellDishOfDay(s:SaveData,i:Inventory,reward:(coins:number)=>void):DishRecipe{
 const r=dishOfDay(s.day);
 if(s.kitchen?.dishOfDaySold===s.day)throw Error('A Helena já comprou o prato do dia. Volte amanhã.');
 if(!i.has(r.id))throw Error(`Traga 1 ${r.name.toLowerCase()} para o prato do dia.`);
 const q=takeBest(s,r.id,i.data[r.id],1)[0]??0;i.spend({[r.id]:1});
 reward(qualityPrice(r.price,q)*DISH_OF_DAY_FACTOR);(s.kitchen??={}).dishOfDaySold=s.day;return r;
}
export function validKitchenState(v:unknown,day:number):v is NonNullable<SaveData['kitchen']>{
 if(!v||typeof v!=='object'||Array.isArray(v))return false;const k=v as NonNullable<SaveData['kitchen']>;
 return Object.keys(k).every(x=>x==='dishOfDaySold')&&(k.dishOfDaySold===undefined||Number.isSafeInteger(k.dishOfDaySold)&&k.dishOfDaySold>=1&&k.dishOfDaySold<=day);
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
