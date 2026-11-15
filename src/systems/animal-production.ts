import type {SaveData,ItemId} from '../types';
import type {FarmSite} from './farm-construction';
import {FARM_BUILDINGS} from '../data/farm-buildings';
import {domesticAnimal} from '../data/domestic-animals';
import {Inventory} from './inventory';
import {inventoryToolCondition,wearInventoryTool} from './tool-instances';
import {DAY_START} from './farm-interior';
import {CROP_CATALOG} from '../data/crop-catalog';
import {MAX_BOND,bondQuality,gainQuality,qualityName,QUALITY_NAMES,type Quality} from './item-quality';
/** Produção animal (docs/construcoes/PRODUCAO-ANIMAL-PLANO.md, etapa 2 de
 * docs/planejamento/ANIMAIS-E-RECEITAS.md).
 * - O cocho de cada galinheiro e curral guarda palha (`site.trough`).
 * - Toda manhã, às 06:00, cada animal alojado come 1 palha do cocho da sua casa.
 *   Quem está há mais tempo sem comer come primeiro.
 * - Galinha alimentada põe um ovo num ninho livre (`site.eggs`); vaca alimentada
 *   fica pronta para uma ordenha (`animalCare.animals[id].milk`).
 * - Os dias fora da Propriedade são recuperados com o estoque real do cocho, até
 *   `MAX_CATCH_UP` manhãs; o ovo e o leite pendentes não se acumulam. */
/** `bond`: amizade (0–30). Sobe 1 a cada manhã alimentado e 1 com o carinho do dia
 * (`petted` guarda o dia de produção); cai 2 a cada manhã sem comer. Define a qualidade
 * do ovo, do leite e da lã (item-quality.ts). */
export interface AnimalCareRecord{fed?:number;milk?:boolean;woolDays?:number;wool?:boolean;duckDays?:number;bond?:number;petted?:number}
export const PRODUCING_KINDS=['chicken','cow','goat','sheep','duck','pig'] as const;
const producing=(id:string)=>(PRODUCING_KINDS as readonly string[]).includes(domesticAnimal(id)?.kind??'');
const changeBond=(rec:AnimalCareRecord,delta:number)=>{const b=Math.max(0,Math.min(MAX_BOND,(rec.bond??0)+delta));if(b)rec.bond=b;else delete rec.bond;};
export const animalQuality=(save:SaveData,id:string):Quality=>bondQuality(save.animalCare?.animals[id]?.bond);
export interface AnimalCare{day:number;animals:Record<string,AnimalCareRecord>}
export const TROUGH_CAPACITY:Partial<Record<FarmSite['kind'],number>>={coop:12,barn:8,aprisco:8,pigsty:8};
/** Lugares do chão do chiqueiro onde aparece esterco. */
export const MANURE_SPOTS=4;
/** O porco come sobras da horta: legumes, frutas e grãos colhidos (não flores, ervas ou algodão). */
export const PIG_FOOD=CROP_CATALOG.filter(c=>['vegetable','fruit','grain'].includes(c.group)).map(c=>c.harvest as ItemId);
export const NEST_COUNT=6;
export const MAX_CATCH_UP=7;
export const MILKING_SECONDS=1;
export const SHEARING_SECONDS=1.2;
export const WOOL_FED_DAYS=3;
/** Pato: um ovo a cada 2 manhãs alimentado; a pena sai a cada 4 ovos de pato recolhidos. */
export const DUCK_FED_DAYS=2;
export const FEATHER_EVERY=4;
/** Dia de produção: a manhã das 06:00 abre o dia; antes disso ainda vale o anterior. */
export const productionDay=(s:Pick<SaveData,'day'|'time'>)=>Math.max(0,Math.floor(s.day)-(s.time<DAY_START?1:0));
export const producesAnimals=(s:FarmSite)=>s.finished&&TROUGH_CAPACITY[s.kind]!==undefined;
/** Primeiro ninho sem ovo de galinha nem de pato. */
const freeNest=(site:FarmSite)=>Array.from({length:NEST_COUNT},(_,i)=>i).find(i=>!site.eggs?.includes(i)&&!site.duckEggs?.includes(i));
const productionSites=(save:SaveData)=>(save.farmConstruction?.sites??[]).filter(producesAnimals);
/** Uma manhã: alimentação pelo cocho e produção dos animais alimentados. */
function morning(save:SaveData,care:AnimalCare,day:number):void{
 for(const site of productionSites(save)){
  const queue=[...site.animals].sort((a,b)=>(care.animals[a]?.fed??-1)-(care.animals[b]?.fed??-1));
  for(const id of queue){
   const kind=domesticAnimal(id)?.kind;if(kind!=='chicken'&&kind!=='cow'&&kind!=='goat'&&kind!=='sheep'&&kind!=='duck'&&kind!=='pig')continue;
   if((site.trough??0)<1){const rec=care.animals[id];if(rec?.bond){changeBond(rec,-2);}continue;}
   site.trough=(site.trough??0)-1;const rec=care.animals[id]??={};rec.fed=day;changeBond(rec,1);
   const q=bondQuality(rec.bond),mark=(nest:number|undefined)=>{if(nest!==undefined&&q)(site.nestQuality??={})[nest]=q as 1|2;};
   if(kind==='cow'||kind==='goat')rec.milk=true;
   else if(kind==='sheep'){if(!rec.wool){const days=(rec.woolDays??0)+1;if(days>=WOOL_FED_DAYS){rec.wool=true;rec.woolDays=0;}else rec.woolDays=days;}}
   else if(kind==='pig'){const spot=Array.from({length:MANURE_SPOTS},(_,i)=>i).find(i=>!site.manure?.includes(i));if(spot!==undefined)(site.manure??=[]).push(spot);}
   else if(kind==='duck'){const days=(rec.duckDays??0)+1;const free=freeNest(site);if(days>=DUCK_FED_DAYS&&free!==undefined){(site.duckEggs??=[]).push(free);mark(free);rec.duckDays=0;}else rec.duckDays=Math.min(days,DUCK_FED_DAYS-1);}
   else{const free=freeNest(site);if(free!==undefined){(site.eggs??=[]).push(free);mark(free);}}
  }
 }
}
/** Processa as manhãs que passaram desde a última vez. Devolve se algo mudou.
 * Um save sem registro começa no dia atual, sem produção retroativa. */
export function processAnimalProduction(save:SaveData):boolean{
 const today=productionDay(save),care=save.animalCare;
 if(!care){save.animalCare={day:today,animals:{}};return true;}
 if(care.day>=today)return false;
 for(let d=Math.max(care.day+1,today-MAX_CATCH_UP+1);d<=today;d++)morning(save,care,d);
 care.day=today;
 // Registros de animais que deixaram de existir não ficam no save.
 const owned=new Set(save.recruitedAnimals??[]);for(const id of Object.keys(care.animals))if(!owned.has(id))delete care.animals[id];
 return true;
}
export const woolReady=(save:SaveData,id:string)=>domesticAnimal(id)?.kind==='sheep'&&!!save.animalCare?.animals[id]?.wool;
export const milkReady=(save:SaveData,id:string)=>!!save.animalCare?.animals[id]?.milk;
export const fedToday=(save:SaveData,id:string)=>save.animalCare?.animals[id]?.fed===productionDay(save);
export interface ProductionSummary{trough:number;capacity:number;animals:number;fed:number;eggs:number;milk:number;wool:number;manure:number}
export function productionSummary(save:SaveData,site:FarmSite):ProductionSummary{
 return{trough:site.trough??0,capacity:TROUGH_CAPACITY[site.kind]??0,animals:site.animals.length,fed:site.animals.filter(id=>fedToday(save,id)).length,eggs:(site.eggs?.length??0)+(site.duckEggs?.length??0),milk:site.animals.filter(id=>milkReady(save,id)).length,wool:site.animals.filter(id=>woolReady(save,id)).length,manure:site.manure?.length??0};
}

type Result={ok:boolean;message:string};
type Writer=(d:SaveData)=>boolean;
const fail=(message:string):Result=>({ok:false,message});
/** Altera uma cópia; só aplica no estado do jogo depois de salvar. */
function commit(save:SaveData,write:Writer,change:(d:SaveData,site:FarmSite)=>Result,siteId:number):Result{
 const d=structuredClone(save);processAnimalProduction(d);
 const site=d.farmConstruction?.sites.find(s=>s.id===siteId);if(!site||!producesAnimals(site))return fail('Construção não encontrada.');
 const r=change(d,site);if(!r.ok)return r;
 try{if(!write(d))return fail('Não foi possível salvar. Nada foi alterado.');}catch{return fail('Não foi possível salvar. Nada foi alterado.');}
 Object.assign(save,d);return r;
}
export function fillTrough(save:SaveData,siteId:number,write:Writer):Result{
 return commit(save,write,(d,site)=>{
  const cap=TROUGH_CAPACITY[site.kind]!,space=cap-(site.trough??0);
  if(site.kind==='pigsty'){
   if(space<=0)return fail(`O cocho está cheio (${cap} porções).`);
   let n=0;for(const id of PIG_FOOD){const take=Math.min(space-n,d.inventory[id]);if(take>0){d.inventory[id]-=take;n+=take;}if(n>=space)break;}
   if(!n)return fail('Traga sobras da horta: legumes, frutas ou grãos colhidos.');
   site.trough=(site.trough??0)+n;
   return{ok:true,message:`${n} ${n===1?'sobra colocada':'sobras colocadas'} no cocho (${site.trough}/${cap}). Cada porco come 1 por dia, às 06:00, e deixa esterco.`};
  }
  if(space<=0)return fail(`O cocho está cheio (${cap} palhas).`);
  const n=Math.min(space,d.inventory.hay);if(n<=0)return fail('Traga palha na mochila. Retire no silo ou prepare com fibras.');
  d.inventory.hay-=n;site.trough=(site.trough??0)+n;
  return{ok:true,message:`${n} ${n===1?'palha colocada':'palhas colocadas'} no cocho (${site.trough}/${cap}). Cada animal come 1 por dia, às 06:00.`};
 },siteId);
}
function takeNestQuality(site:FarmSite,nest:number):Quality{
 const q=site.nestQuality?.[nest]??0;if(site.nestQuality){delete site.nestQuality[nest];if(!Object.keys(site.nestQuality).length)delete site.nestQuality;}return q;
}
export function collectEgg(save:SaveData,siteId:number,nest:number,write:Writer):Result{
 return commit(save,write,(d,site)=>{
  if(site.duckEggs?.includes(nest)){
   const n=(site.duckCollected??0)+1,out:Partial<Record<ItemId,number>>={duckEgg:1,...(n%FEATHER_EVERY===0?{feather:1}:{})};
   const i=new Inventory(d.inventory);if(!i.transact({},out))return fail('Libere espaço na mochila para guardar o ovo de pato.');
   d.inventory=i.data;site.duckEggs=site.duckEggs.filter(x=>x!==nest);if(!site.duckEggs.length)delete site.duckEggs;site.duckCollected=n;
   const q=takeNestQuality(site,nest);gainQuality(d,'duckEgg',d.inventory.duckEgg,q);
   return{ok:true,message:`Você recolheu 1 ${qualityName('duckEgg',q).toLowerCase()}${out.feather?' e uma pena que estava no ninho':''}.`};
  }
  if(!site.eggs?.includes(nest))return fail('Ninho vazio. Galinhas e patos alimentados botam pela manhã.');
  const i=new Inventory(d.inventory);if(!i.transact({},{egg:1}))return fail('Libere espaço na mochila para guardar o ovo.');
  d.inventory=i.data;site.eggs=site.eggs.filter(n=>n!==nest);if(!site.eggs.length)delete site.eggs;
  const q=takeNestQuality(site,nest);gainQuality(d,'egg',d.inventory.egg,q);
  return{ok:true,message:`Você recolheu 1 ${qualityName('egg',q).toLowerCase()}.`};
 },siteId);
}
export function collectManure(save:SaveData,siteId:number,spot:number,write:Writer):Result{
 return commit(save,write,(d,site)=>{
  if(!site.manure?.includes(spot))return fail('Nada aqui. Porcos alimentados deixam esterco pela manhã.');
  const i=new Inventory(d.inventory);if(!i.transact({},{manure:1}))return fail('Libere espaço na mochila para o esterco.');
  d.inventory=i.data;site.manure=site.manure.filter(n=>n!==spot);if(!site.manure.length)delete site.manure;
  return{ok:true,message:'Você recolheu 1 esterco. Leve à composteira para fazer adubo.'};
 },siteId);
}
export function canMilk(save:SaveData,id:string):Result{
 const kind=domesticAnimal(id)?.kind,label=kind==='goat'?'cabra':'vaca';
 if(kind!=='cow'&&kind!=='goat')return fail('Este animal não pode ser ordenhado.');
 if(!milkReady(save,id))return fail(fedToday(save,id)?`Esta ${label} já foi ordenhada hoje.`:`A ${label} está sem leite. Ela precisa comer palha do cocho pela manhã.`);
 if(save.inventory.milkPail<1)return fail('Você precisa de um balde de ordenha. Faça na bancada.');
 return{ok:true,message:'Ordenhando…'};
}
/** Mantém o nome antigo para os chamadores e saves anteriores; aceita vacas e cabras. */
export function milkCow(save:SaveData,siteId:number,id:string,write:Writer):Result{
 return commit(save,write,(d,site)=>{
  if(!site.animals.includes(id))return fail('Este animal não mora aqui.');
  const check=canMilk(d,id);if(!check.ok)return check;
  const product=domesticAnimal(id)?.kind==='goat'?'goatMilk':'milk';
  const i=new Inventory(d.inventory);if(!i.transact({},{[product]:1}))return fail('Libere espaço na mochila para guardar o leite.');
  d.inventory=i.data;delete d.animalCare!.animals[id].milk;
  const q=animalQuality(d,id);gainQuality(d,product,d.inventory[product],q);
  return{ok:true,message:`Você ordenhou 1 ${qualityName(product,q).toLowerCase()}.`};
 },siteId);
}
export function canShear(save:SaveData,id:string):Result{
 if(domesticAnimal(id)?.kind!=='sheep')return fail('A tosquia é feita nas ovelhas.');
 if(!woolReady(save,id))return fail(`Lã crescendo: ${save.animalCare?.animals[id]?.woolDays??0}/${WOOL_FED_DAYS} dias alimentados.`);
 if(save.inventory.shears<1)return fail('Você precisa de uma tesoura de tosquia. Faça na bancada.');
 if(inventoryToolCondition(save.inventory,'shears').durability<=0)return fail('Repare a tesoura antes de tosquiar.');
 return{ok:true,message:'Tosquiando…'};
}
export function shearSheep(save:SaveData,siteId:number,id:string,write:Writer):Result{
 return commit(save,write,(d,site)=>{
  if(!site.animals.includes(id))return fail('Esta ovelha não mora aqui.');
  const check=canShear(d,id);if(!check.ok)return check;
  const i=new Inventory(d.inventory);if(!i.transact({},{wool:1}))return fail('Libere espaço na mochila para guardar a lã.');
  if(!wearInventoryTool(i.data,'shears'))return fail('A tesoura não está em condições de uso.');
  d.inventory=i.data;const rec=d.animalCare!.animals[id];delete rec.wool;rec.woolDays=0;
  const q=animalQuality(d,id);gainQuality(d,'wool',d.inventory.wool,q);
  return{ok:true,message:`Você recolheu 1 ${qualityName('wool',q).toLowerCase()}.`};
 },siteId);
}

export const pettedToday=(save:SaveData,id:string)=>save.animalCare?.animals[id]?.petted===productionDay(save);
/** Situação da amizade para o painel e a dica: "amizade 12/30 · produz bom". */
export function bondStatus(save:SaveData,id:string):string{const b=save.animalCare?.animals[id]?.bond??0;return`amizade ${b}/${MAX_BOND} · produz ${QUALITY_NAMES[bondQuality(b)]}`;}
/** Carinho: uma vez por dia em cada animal, soma 1 de amizade. */
export function petAnimal(save:SaveData,siteId:number,id:string,write:Writer):Result{
 return commit(save,write,(d,site)=>{
  if(!site.animals.includes(id)||!producing(id))return fail('Este animal não mora aqui.');
  const care=d.animalCare!,rec=care.animals[id]??={};
  if(rec.petted===care.day)return fail(`Já recebeu carinho hoje · ${bondStatus(d,id)}.`);
  rec.petted=care.day;changeBond(rec,1);
  return{ok:true,message:`Carinho feito · ${bondStatus(d,id)}.`};
 },siteId);
}
export function validAnimalCare(v:unknown,day:number):v is AnimalCare{
 if(!v||typeof v!=='object'||Array.isArray(v))return false;const c=v as AnimalCare;
 if(!Number.isSafeInteger(c.day)||c.day<0||c.day>day||!c.animals||typeof c.animals!=='object'||Array.isArray(c.animals))return false;
 const entries=Object.entries(c.animals);if(entries.length>64)return false;
 return entries.every(([id,r])=>typeof id==='string'&&id.length<=64&&!!r&&typeof r==='object'&&!Array.isArray(r)
  &&(r.fed===undefined||Number.isSafeInteger(r.fed)&&r.fed>=0&&r.fed<=c.day)&&(r.milk===undefined||r.milk===true)
  &&(r.wool===undefined||r.wool===true&&domesticAnimal(id)?.kind==='sheep')
  &&(r.woolDays===undefined||domesticAnimal(id)?.kind==='sheep'&&Number.isInteger(r.woolDays)&&r.woolDays>=0&&r.woolDays<WOOL_FED_DAYS)
  &&(r.duckDays===undefined||domesticAnimal(id)?.kind==='duck'&&Number.isInteger(r.duckDays)&&r.duckDays>=0&&r.duckDays<DUCK_FED_DAYS)
  &&(r.bond===undefined||Number.isInteger(r.bond)&&r.bond>0&&r.bond<=MAX_BOND)&&(r.petted===undefined||Number.isSafeInteger(r.petted)&&r.petted>=0&&r.petted<=c.day)
  &&Object.keys(r).every(k=>k==='fed'||k==='milk'||k==='wool'||k==='woolDays'||k==='duckDays'||k==='bond'||k==='petted'));
}
/** Campos de produção de cada obra: cocho e ovos só em galinheiro e curral prontos. */
export function validSiteProduction(s:FarmSite):boolean{
 const cap=TROUGH_CAPACITY[s.kind];
 if(s.trough!==undefined&&(cap===undefined||!s.finished||!Number.isSafeInteger(s.trough)||s.trough<0||s.trough>cap))return false;
 const nests=(v:number[]|undefined)=>v===undefined||s.kind==='coop'&&s.finished&&Array.isArray(v)&&v.length<=NEST_COUNT&&new Set(v).size===v.length&&v.every(n=>Number.isInteger(n)&&n>=0&&n<NEST_COUNT);
 if(!nests(s.eggs)||!nests(s.duckEggs)||s.eggs?.some(n=>s.duckEggs?.includes(n)))return false;
 if(s.manure!==undefined&&(s.kind!=='pigsty'||!s.finished||!Array.isArray(s.manure)||s.manure.length>MANURE_SPOTS||new Set(s.manure).size!==s.manure.length||s.manure.some(n=>!Number.isInteger(n)||n<0||n>=MANURE_SPOTS)))return false;
 if(s.nestQuality!==undefined&&(!s.nestQuality||typeof s.nestQuality!=='object'||Array.isArray(s.nestQuality)||!Object.entries(s.nestQuality).every(([k,q])=>(q===1||q===2)&&/^[0-5]$/.test(k)&&(s.eggs?.includes(Number(k))||s.duckEggs?.includes(Number(k))))))return false;
 if(s.duckCollected!==undefined&&(s.kind!=='coop'||!Number.isSafeInteger(s.duckCollected)||s.duckCollected<0||s.duckCollected>1e6))return false;
 return true;
}
export const farmAnimalNoun=(kind:FarmSite['kind'])=>FARM_BUILDINGS[kind].animal==='cow'?'vaca':'galinha';
