import type {InventoryData} from '../types';
import {TOOL_IDS,ECONOMY_BALANCE as B,type EconomicTool} from '../data/economy-balance';
export const INDIVIDUAL_TOOLS=[...TOOL_IDS,'hammer','handsaw','fishingRod','net','sword','shears'] as const;
export type IndividualTool=typeof INDIVIDUAL_TOOLS[number];
export interface ToolCopy {id:number;kind:IndividualTool;condition:{tier:number;durability:number;work?:number}}
export interface ToolInventory {version:1;nextId:number;items:ToolCopy[];active:Partial<Record<IndividualTool,number>>}
export const individualTool=(item:unknown):item is IndividualTool=>INDIVIDUAL_TOOLS.includes(item as IndividualTool);
export const durableTool=(item:unknown):item is EconomicTool=>TOOL_IDS.includes(item as EconomicTool);
export const WEARING_TOOLS=INDIVIDUAL_TOOLS.filter(k=>k!=='sword');
export const wearsOut=(item:unknown):item is Exclude<IndividualTool,'sword'>=>WEARING_TOOLS.includes(item as Exclude<IndividualTool,'sword'>);
type Legacy=Partial<Record<EconomicTool,{tier:number;durability:number;work?:number}>>;
/** Counts remain available to recipes; every physical tool has a stable identity. */
export function syncToolInstances(stock:InventoryData,legacy?:Legacy):ToolInventory {
 let book=stock.toolInstances;
 if(!book&&INDIVIDUAL_TOOLS.every(kind=>!stock[kind]))return{version:1,nextId:1,items:[],active:{}};
 if(book&&INDIVIDUAL_TOOLS.every(kind=>book!.items.filter(t=>t.kind===kind).length===stock[kind]&&(!stock[kind]||book!.items.some(t=>t.kind===kind&&t.id===book!.active[kind]))))return book;
 const first=!book;book=book?structuredClone(book):{version:1,nextId:1,items:[],active:{}};
 for(const kind of INDIVIDUAL_TOOLS){
  const owned=book.items.filter(t=>t.kind===kind),count=stock[kind];
  if(count<owned.length){const keep=[...owned].sort((a,b)=>Number(b.id===book!.active[kind])-Number(a.id===book!.active[kind])).slice(0,count);book.items=book.items.filter(t=>t.kind!==kind||keep.includes(t));}
  for(let n=owned.length;n<count;n++){const condition=first&&durableTool(kind)?legacy?.[kind]:undefined;book.items.push({id:book.nextId++,kind,condition:{tier:condition?.tier??0,durability:condition?.durability??B.durability[0],...(condition?.work!==undefined?{work:condition.work}:{})}});}
  if(!book.items.some(t=>t.kind===kind&&t.id===book!.active[kind])){const t=book.items.find(t=>t.kind===kind);if(t)book.active[kind]=t.id;else delete book.active[kind];}
 }
 stock.toolInstances=book;return book;
}
export function activeToolCopy(stock:InventoryData,kind:IndividualTool):ToolCopy|undefined {const b=stock.toolInstances;return b?.items.find(t=>t.kind===kind&&t.id===b.active[kind])??b?.items.find(t=>t.kind===kind);}
export function inventoryToolCondition(stock:InventoryData,kind:IndividualTool){return activeToolCopy(stock,kind)?.condition??{tier:0,durability:B.durability[0]};}
export function wearInventoryTool(stock:InventoryData,kind:IndividualTool,amount=1):boolean {if(!Number.isSafeInteger(amount)||amount<1||!stock[kind]||inventoryToolCondition(stock,kind).durability<amount)return false;syncToolInstances(stock);activeToolCopy(stock,kind)!.condition.durability-=amount;return true;}
export function repairInventoryTool(stock:InventoryData,kind:IndividualTool):void {syncToolInstances(stock);const c=activeToolCopy(stock,kind)?.condition;if(c){c.durability=B.durability[c.tier];delete c.work;}}
export function selectToolCopy(stock:InventoryData,id:number):boolean {const b=syncToolInstances(stock),t=b.items.find(t=>t.id===id);if(!t)return false;b.active[t.kind]=id;return true;}
export function validToolCopy(value:unknown):value is ToolCopy {
 if(!value||typeof value!=='object'||Array.isArray(value))return false;const t=value as ToolCopy;
 const c=t.condition;if(!c||typeof c!=='object'||Array.isArray(c))return false;
 return Number.isSafeInteger(t.id)&&t.id>0&&t.id<1e9&&individualTool(t.kind)&&Number.isInteger(c.tier)&&c.tier>=0&&c.tier<=3&&(!durableTool(t.kind)?c.tier===0:true)&&Number.isInteger(c.durability)&&c.durability>=0&&c.durability<=B.durability[c.tier]&&(c.work===undefined||Number.isFinite(c.work)&&c.work>=0&&c.work<1);
}
export function validToolInventory(value:unknown,stock?:InventoryData):value is ToolInventory {
 if(!value||typeof value!=='object'||Array.isArray(value))return false;const b=value as ToolInventory;
 if(b.version!==1||!Number.isSafeInteger(b.nextId)||b.nextId<1||b.nextId>=1e9||!Array.isArray(b.items)||b.items.length>10000||!b.active||typeof b.active!=='object'||Array.isArray(b.active))return false;
 const ids=new Set<number>();if(!b.items.every(t=>validToolCopy(t)&&t.id<b.nextId&&!ids.has(t.id)&&!!ids.add(t.id)))return false;
 return Object.entries(b.active).every(([k,id])=>individualTool(k)&&b.items.some(t=>t.kind===k&&t.id===id))&&(!stock||INDIVIDUAL_TOOLS.every(k=>b.items.filter(t=>t.kind===k).length===stock[k]));
}
export const toolReference=(t:Pick<ToolCopy,'id'|'kind'>)=>`tool:${t.kind}:${t.id}` as const;
export function toolReferenceParts(value:unknown):{kind:IndividualTool;id:number}|undefined {if(typeof value!=='string')return;const m=/^tool:([a-zA-Z]+):([1-9]\d{0,8})$/.exec(value);if(m&&individualTool(m[1]))return{kind:m[1],id:Number(m[2])};}
export function referencedTool(stock:InventoryData,reference:unknown):ToolCopy|undefined {const p=toolReferenceParts(reference);return p?stock.toolInstances?.items.find(t=>t.id===p.id&&t.kind===p.kind):undefined;}
