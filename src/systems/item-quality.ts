import type {ItemId,SaveData} from '../types';
import {ITEM_IDS,ITEM_NAMES} from '../data/items';
import {MAX_ITEM_COUNT} from './inventory';
/** Qualidade dos produtos (docs/construcoes/QUALIDADE.md).
 * 0 = comum, 1 = bom, 2 = excelente.
 *
 * A mochila continua guardando só a quantidade total de cada item. O registro
 * `save.itemQuality` diz quantas dessas unidades são boas e excelentes; o resto é comum.
 * `seen` é o total da mochila na última vez que o registro foi conferido. Se o total
 * caiu por um gasto que não conhece qualidade, as unidades comuns saem primeiro,
 * então nenhum código antigo precisa saber da qualidade. Venda, cozinha, máquinas e
 * pratos usam primeiro as melhores unidades (`takeBest`). */
export type Quality=0|1|2;
export interface QualityEntry{good:number;excellent:number;seen:number}
export type QualityLedger=Partial<Record<ItemId,QualityEntry>>;
export interface QualityHolder{itemQuality?:QualityLedger}
export interface QualityCounts{common:number;good:number;excellent:number}
export const QUALITY_NAMES=['comum','bom','excelente'] as const;
export const QUALITY_PLURAL=['comuns','bons','excelentes'] as const;
/** Multiplicador de preço e de vigor por qualidade. */
export const QUALITY_FACTOR=[1,1.25,1.5] as const;
/** Pontos de amizade do animal para cada qualidade. */
export const QUALITY_BOND=[0,10,25] as const;
export const MAX_BOND=30;
export const bondQuality=(bond:number|undefined):Quality=>(bond??0)>=QUALITY_BOND[2]?2:(bond??0)>=QUALITY_BOND[1]?1:0;

/** Itens de animal (e o que se faz com eles) que levam qualidade para máquinas e pratos. */
export const ANIMAL_QUALITY_ITEMS:readonly ItemId[]=['egg','duckEgg','milk','goatMilk','wool','cheese','goatCheese','butter','yarn','woolCloth'];
/** Separa os ingredientes (as melhores unidades primeiro) e devolve a qualidade média dos
 * itens de animal; comum se a receita não leva nenhum. */
export function takeIngredientsQuality(s:Pick<SaveData,'inventory'|'itemQuality'>,cost:Partial<Record<ItemId,number>>):Quality{
 const qs:Quality[]=[];
 for(const [id,n] of Object.entries(cost) as [ItemId,number][]){const taken=takeBest(s,id,s.inventory[id]??0,n);if(ANIMAL_QUALITY_ITEMS.includes(id))qs.push(...taken);}
 return averageQuality(qs);
}
/** Unidades de cada qualidade entre as `total` que estão na mochila agora. */
export function qualityCounts(ledger:QualityLedger|undefined,item:ItemId,total:number):QualityCounts{
 const e=ledger?.[item];total=Math.max(0,Math.floor(total));
 if(!e)return{common:total,good:0,excellent:0};
 let good=e.good,excellent=e.excellent,drop=Math.max(0,Math.max(e.seen,good+excellent)-total);
 const common=Math.max(0,e.seen-good-excellent);drop-=Math.min(drop,common);
 const g=Math.min(drop,good);good-=g;drop-=g;excellent-=Math.min(drop,excellent);
 return{common:total-good-excellent,good,excellent};
}
function store(h:QualityHolder,item:ItemId,total:number,good:number,excellent:number):void{
 if(good+excellent<=0){if(h.itemQuality){delete h.itemQuality[item];if(!Object.keys(h.itemQuality).length)delete h.itemQuality;}return;}
 (h.itemQuality??={})[item]={good,excellent,seen:total};
}
/** Confere um item antes de uma entrada que não conhece qualidade (compra, coleta do chão). */
export function touchQuality(h:QualityHolder,item:ItemId,total:number):void{if(!h.itemQuality?.[item])return;const c=qualityCounts(h.itemQuality,item,total);store(h,item,total,c.good,c.excellent);}
/** Registra `n` unidades de qualidade `q` que acabaram de entrar (o total já as inclui). */
export function gainQuality(h:QualityHolder,item:ItemId,totalAfter:number,q:Quality,n=1):void{
 if(n<=0)return;const c=qualityCounts(h.itemQuality,item,totalAfter-n);
 store(h,item,totalAfter,c.good+(q===1?n:0),c.excellent+(q===2?n:0));
}
/** Qualidades das `n` melhores unidades, sem alterar nada. */
export function peekBest(ledger:QualityLedger|undefined,item:ItemId,total:number,n:number):Quality[]{
 const c=qualityCounts(ledger,item,total),out:Quality[]=[];
 for(const [q,k] of [[2,c.excellent],[1,c.good],[0,c.common]] as const)for(let i=0;i<k&&out.length<n;i++)out.push(q);
 return out;
}
/** Separa as `n` melhores unidades antes de tirá-las da mochila (o total ainda as inclui).
 * O chamador tira as unidades da mochila em seguida. */
export function takeBest(h:QualityHolder,item:ItemId,totalBefore:number,n:number):Quality[]{
 const taken=peekBest(h.itemQuality,item,totalBefore,n),c=qualityCounts(h.itemQuality,item,totalBefore);
 if(h.itemQuality?.[item])store(h,item,Math.max(0,totalBefore-n),c.good-taken.filter(q=>q===1).length,c.excellent-taken.filter(q=>q===2).length);
 return taken;
}
/** Qualidade média, arredondada para baixo; comum quando não há unidades. */
export const averageQuality=(qs:readonly Quality[]):Quality=>qs.length?Math.floor(qs.reduce<number>((a,q)=>a+q,0)/qs.length) as Quality:0;
/** Preço de uma unidade com a qualidade aplicada. */
export const qualityPrice=(price:number,q:Quality)=>Math.round(price*QUALITY_FACTOR[q]);
/** Atualiza o registro com a mochila atual e apaga o que não tem mais unidades boas. */
export function syncQuality(s:Pick<SaveData,'inventory'|'itemQuality'>):void{
 for(const item of Object.keys(s.itemQuality??{}) as ItemId[]){const c=qualityCounts(s.itemQuality,item,s.inventory[item]??0);store(s,item,s.inventory[item]??0,c.good,c.excellent);}
}
/** Texto curto para a mochila: "2 excelentes · 1 bom · 3 comuns". Vazio se tudo é comum. */
export function qualityLabel(ledger:QualityLedger|undefined,item:ItemId,total:number):string{
 const c=qualityCounts(ledger,item,total);if(!c.good&&!c.excellent)return'';
 return([[c.excellent,2],[c.good,1],[c.common,0]] as const).filter(([n])=>n>0).map(([n,q])=>`${n} ${n===1?QUALITY_NAMES[q]:QUALITY_PLURAL[q]}`).join(' · ');
}
/** Nome do item com a qualidade, para mensagens: "Ovo excelente". */
export const qualityName=(item:ItemId,q:Quality)=>q?`${ITEM_NAMES[item]} ${QUALITY_NAMES[q]}`:ITEM_NAMES[item];
/** O registro só aceita itens conhecidos e contagens inteiras; contagens acima da mochila
 * são corrigidas na leitura (as unidades comuns saem primeiro). */
export function validQualityLedger(v:unknown):v is QualityLedger{
 if(!v||typeof v!=='object'||Array.isArray(v))return false;
 const n=(x:unknown)=>Number.isSafeInteger(x)&&(x as number)>=0&&(x as number)<=MAX_ITEM_COUNT;
 return Object.entries(v).every(([k,e])=>ITEM_IDS.includes(k as ItemId)&&!!e&&typeof e==='object'&&!Array.isArray(e)
  &&Object.keys(e).every(x=>x==='good'||x==='excellent'||x==='seen')&&n((e as QualityEntry).good)&&n((e as QualityEntry).excellent)&&n((e as QualityEntry).seen));
}
