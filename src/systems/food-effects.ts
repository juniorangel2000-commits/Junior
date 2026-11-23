import type {SaveData,ItemId} from '../types';
import {farmClock} from './farm-interior';
/** Efeitos dos pratos (cozinha, etapa 2). Um efeito por vez: comer outro prato com efeito
 * troca o atual. O prazo usa o relógio absoluto do jogo, então viagens, sono e recarregar
 * o save não o reiniciam. */
export const FOOD_EFFECT_IDS=['heartyBreakfast','roastedFish','beanTropeiro','watermelonJuice'] as const;
export type FoodEffectId=typeof FOOD_EFFECT_IDS[number];
export interface FoodEffect{id:FoodEffectId;until:number;extraVigor?:number}
export const FOOD_EFFECTS:Record<FoodEffectId,{name:string;description:string;minutes:number}>={
 heartyBreakfast:{name:'Energia do café',description:'+30 de vigor extra, gasto antes do vigor normal',minutes:8*60},
 roastedFish:{name:'Mão firme',description:'pesca mais fácil: a faixa de controle fica maior',minutes:6*60},
 beanTropeiro:{name:'Firme na Mina',description:'35% menos dano dos perigos da Mina',minutes:6*60},
 watermelonJuice:{name:'Passo leve',description:'anda 15% mais rápido',minutes:4*60},
};
/** Prato que dá cada efeito. */
export const DISH_EFFECT:Partial<Record<ItemId,FoodEffectId>>={heartyBreakfast:'heartyBreakfast',roastedFish:'roastedFish',beanTropeiro:'beanTropeiro',watermelonJuice:'watermelonJuice'};
export const EXTRA_VIGOR=30;
export const SPEED_BONUS=1.15;
export const MINE_DAMAGE_SCALE=.65;
export const FISHING_BAND_BONUS=.07;

export function activeFoodEffect(s:Pick<SaveData,'day'|'time'|'foodEffect'>):FoodEffect|undefined{
 const e=s.foodEffect;return e&&farmClock(s)<e.until?e:undefined;
}
export const hasFoodEffect=(s:Pick<SaveData,'day'|'time'|'foodEffect'>,id:FoodEffectId)=>activeFoodEffect(s)?.id===id;
/** Aplica o efeito do prato comido (troca o anterior). Devolve o texto para a mensagem. */
export function applyDishEffect(s:SaveData,dish:ItemId):string{
 const id=DISH_EFFECT[dish];if(!id)return'';
 const def=FOOD_EFFECTS[id];s.foodEffect={id,until:farmClock(s)+def.minutes,...(id==='heartyBreakfast'?{extraVigor:EXTRA_VIGOR}:{})};
 return ` ${def.name} por ${def.minutes/60} horas: ${def.description}.`;
}
/** Vigor extra do café reforçado ainda disponível. */
export const extraVigor=(s:Pick<SaveData,'day'|'time'|'foodEffect'>)=>{const e=activeFoodEffect(s);return e?.id==='heartyBreakfast'?e.extraVigor??0:0;};
/** Gasta vigor: primeiro o extra do café, depois o vigor normal. */
export function spendVigor(s:SaveData,amount:number):void{
 const p=s.villageProgress;if(!p||amount<=0)return;
 const e=activeFoodEffect(s),extra=e?.id==='heartyBreakfast'?e.extraVigor??0:0,fromExtra=Math.min(extra,amount);
 if(fromExtra&&e)e.extraVigor=extra-fromExtra;
 p.vigor=Math.max(0,p.vigor-(amount-fromExtra));
}
/** Multiplicador de velocidade do jogador: botas e suco de melancia. */
/** Exausto (vigor zerado e sem o extra do café): anda mais devagar até comer ou dormir. */
export const EXHAUSTED_SPEED=.7;
export const exhausted=(s:SaveData)=>(s.villageProgress?.vigor??100)<=0&&extraVigor(s)<=0;
export const playerSpeedFactor=(s:SaveData)=>(s.inventory.boots>0?1.08:1)*(hasFoodEffect(s,'watermelonJuice')?SPEED_BONUS:1)*(exhausted(s)?EXHAUSTED_SPEED:1);
/** Dormir na cama recupera todo o vigor. */
/** Quarto da casa ampliada: acorda com 120 de vigor (preview.48). */
export const BEDROOM_VIGOR=120;
export const restoreVigor=(s:SaveData,max=100)=>{if(s.villageProgress)s.villageProgress.vigor=Math.max(s.villageProgress.vigor,max);};

export function validFoodEffect(v:unknown):v is FoodEffect{
 if(!v||typeof v!=='object'||Array.isArray(v))return false;const e=v as FoodEffect;
 return FOOD_EFFECT_IDS.includes(e.id)&&Number.isFinite(e.until)&&e.until>=0&&e.until<=1e9
  &&(e.extraVigor===undefined||e.id==='heartyBreakfast'&&Number.isInteger(e.extraVigor)&&e.extraVigor>=0&&e.extraVigor<=EXTRA_VIGOR)
  &&Object.keys(e).every(k=>k==='id'||k==='until'||k==='extraVigor');
}
