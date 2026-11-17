import type {ItemId} from '../types';
/** Ícaro separa sucata (preview.41, ideia do Junior). Você entrega até 10 sucatas por dia e paga
 * em moedas; na manhã seguinte busca o que saiu: pregos (o mais comum), dobradiça, molas,
 * engrenagem (a mais rara) ou nada, quando era só ferrugem. O Bento vende as mesmas peças, caro. */
export const PART_IDS=['nails','hinge','spring','gear'] as const;
export type PartId=typeof PART_IDS[number];
export const SCRAP_SORT_FEE=5;
export const SCRAP_SORT_MAX=10;
export interface ScrapSorting{day:number;count:number}
/** Chance de cada sucata, na ordem: o resto (15%) é ferrugem. */
export const SCRAP_CHANCES:readonly [PartId,number][]=[['nails',.35],['hinge',.2],['spring',.18],['gear',.12]];
const seeded=(seed:number)=>{let t=seed>>>0;return()=>{t=(t+0x6D2B79F5)>>>0;let r=Math.imul(t^(t>>>15),1|t);r=(r+Math.imul(r^(r>>>7),61|r))^r;return((r^(r>>>14))>>>0)/4294967296;};};
/** O que sai de `count` sucatas entregues no dia `day` (sempre o mesmo resultado para o mesmo dia). */
export function sortScrap(day:number,count:number):Partial<Record<PartId,number>>{
 const rand=seeded(day*7919+count*104729+17),out:Partial<Record<PartId,number>>={};
 for(let i=0;i<count;i++){
  let r=rand();
  for(const [part,chance] of SCRAP_CHANCES){
   if(r<chance){out[part]=(out[part]??0)+(part==='nails'?1+Math.floor(rand()*3):1);break;}
   r-=chance;
  }
 }
 return out;
}
export const scrapSortingReady=(job:ScrapSorting|undefined,day:number)=>!!job&&day>job.day;
export function validScrapSorting(v:unknown):boolean{
 if(v===undefined)return true;
 if(!v||typeof v!=='object'||Array.isArray(v))return false;
 const o=v as Record<string,unknown>;
 return Object.keys(o).every(k=>k==='day'||k==='count')&&Number.isSafeInteger(o.day)&&(o.day as number)>=1&&Number.isSafeInteger(o.count)&&(o.count as number)>=1&&(o.count as number)<=SCRAP_SORT_MAX;
}
export const PART_NAMES:Record<PartId,[string,string]>={nails:['prego','pregos'],hinge:['dobradiça','dobradiças'],spring:['mola','molas'],gear:['engrenagem','engrenagens']};
export const partsLabel=(parts:Partial<Record<ItemId,number>>)=>{
 const list=PART_IDS.filter(p=>(parts[p]??0)>0).map(p=>`${parts[p]} ${parts[p]===1?PART_NAMES[p][0]:PART_NAMES[p][1]}`);
 return list.length?list.join(', '):'nada: era tudo ferrugem';
};
