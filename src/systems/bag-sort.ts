import type {ItemId,QuickSlot} from '../types';
import {ITEMS} from '../data/items';
import {CROP_CATALOG} from '../data/crop-catalog';
import {cropFromSeed} from '../data/crops';
import {DISH_IDS} from '../data/kitchen';
import {individualTool} from './tool-instances';

/** Botão "Organizar" da mochila: alterna a ordem em que os itens aparecem. É só a
 * exibição; o save não muda. A escolha fica guardada no navegador. */
export const BAG_SORTS=['default','type','name','amount'] as const;
export type BagSort=typeof BAG_SORTS[number];
export const BAG_SORT_LABELS:Record<BagSort,string>={default:'Organizar',type:'Por tipo',name:'Por nome',amount:'Por quantidade'};
const KEY='after-rain-bag-sort';
export function loadBagSort():BagSort{try{const v=localStorage.getItem(KEY);return (BAG_SORTS as readonly string[]).includes(v??'')?v as BagSort:'default';}catch{return 'default';}}
export function saveBagSort(sort:BagSort):void{try{localStorage.setItem(KEY,sort);}catch{/* sem armazenamento: vale só nesta sessão */}}
/** Próxima ordem ao clicar: tipo → nome → quantidade → tipo… */
export const nextBagSort=(sort:BagSort):BagSort=>sort==='type'?'name':sort==='name'?'amount':'type';

export type BagCategory='tool'|'seed'|'food'|'material';
export const BAG_CATEGORY_NAMES:Record<BagCategory,string>={tool:'Ferramenta',seed:'Semente',food:'Comida e colheita',material:'Material'};
const TOOLS=new Set<string>(['sword','fishingRod','net','shears','milkPail','lantern','backpack','boots','wateringCan']);
const FOOD=new Set<string>([...DISH_IDS,...CROP_CATALOG.map(c=>c.harvest),'egg','duckEgg','milk','goatMilk','honey','daisyHoney','sunflowerHoney','cheese','goatCheese','butter','fish','rareFish','meal','strawberryJam','watermelonJam','herbalTonic','fungalInfusion','mushroom','herb','rareHerb','harvestBasket']);
export function bagCategory(id:string):BagCategory{
 if(individualTool(id)||TOOLS.has(id))return'tool';
 if(cropFromSeed(id)||id==='oakSeed'||id==='pineSeed')return'seed';
 if(FOOD.has(id))return'food';
 return'material';
}
const ORDER:BagCategory[]=['tool','seed','food','material'];
/** Id do item de uma entrada da mochila (`item:wood`, `tool:hatchet:3`, `item:wateringCan`). */
export function bagItemId(slot:Exclude<QuickSlot,null>):string{const [kind,id]=String(slot).split(':');return kind==='item'||kind==='tool'?id:String(slot);}
const nameOf=(id:string)=>ITEMS[id as ItemId]?.name??(id==='wateringCan'?'Regador':id);
/** Ordena as entradas sem mudar a quantidade de cada uma. A ordem 'default' é a original. */
export function sortBagEntries<T extends Exclude<QuickSlot,null>>(entries:readonly T[],sort:BagSort,amount:(slot:T)=>number):T[]{
 const list=entries.map((slot,index)=>({slot,index,id:bagItemId(slot)}));
 const byName=(a:typeof list[number],b:typeof list[number])=>nameOf(a.id).localeCompare(nameOf(b.id),'pt-BR')||a.index-b.index;
 if(sort==='type')list.sort((a,b)=>ORDER.indexOf(bagCategory(a.id))-ORDER.indexOf(bagCategory(b.id))||byName(a,b));
 else if(sort==='name')list.sort(byName);
 else if(sort==='amount')list.sort((a,b)=>amount(b.slot)-amount(a.slot)||byName(a,b));
 return list.map(e=>e.slot);
}
