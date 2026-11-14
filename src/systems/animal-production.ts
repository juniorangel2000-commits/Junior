import type {SaveData} from '../types';
import type {FarmSite} from './farm-construction';
import {FARM_BUILDINGS} from '../data/farm-buildings';
import {domesticAnimal} from '../data/domestic-animals';
import {Inventory} from './inventory';
import {DAY_START} from './farm-interior';
/** Produção animal (docs/construcoes/PRODUCAO-ANIMAL-PLANO.md, etapa 2 de
 * docs/planejamento/ANIMAIS-E-RECEITAS.md).
 * - O cocho de cada galinheiro e curral guarda palha (`site.trough`).
 * - Toda manhã, às 06:00, cada animal alojado come 1 palha do cocho da sua casa.
 *   Quem está há mais tempo sem comer come primeiro.
 * - Galinha alimentada põe um ovo num ninho livre (`site.eggs`); vaca alimentada
 *   fica pronta para uma ordenha (`animalCare.animals[id].milk`).
 * - Os dias fora da Propriedade são recuperados com o estoque real do cocho, até
 *   `MAX_CATCH_UP` manhãs; o ovo e o leite pendentes não se acumulam. */
export interface AnimalCareRecord{fed?:number;milk?:boolean}
export interface AnimalCare{day:number;animals:Record<string,AnimalCareRecord>}
export const TROUGH_CAPACITY:Partial<Record<FarmSite['kind'],number>>={coop:12,barn:8};
export const NEST_COUNT=6;
export const MAX_CATCH_UP=7;
export const MILKING_SECONDS=1;
/** Dia de produção: a manhã das 06:00 abre o dia; antes disso ainda vale o anterior. */
export const productionDay=(s:Pick<SaveData,'day'|'time'>)=>Math.max(0,Math.floor(s.day)-(s.time<DAY_START?1:0));
export const producesAnimals=(s:FarmSite)=>s.finished&&TROUGH_CAPACITY[s.kind]!==undefined;
const productionSites=(save:SaveData)=>(save.farmConstruction?.sites??[]).filter(producesAnimals);
/** Uma manhã: alimentação pelo cocho e produção dos animais alimentados. */
function morning(save:SaveData,care:AnimalCare,day:number):void{
 for(const site of productionSites(save)){
  const queue=[...site.animals].sort((a,b)=>(care.animals[a]?.fed??-1)-(care.animals[b]?.fed??-1));
  for(const id of queue){
   if((site.trough??0)<1)break;
   const kind=domesticAnimal(id)?.kind;if(kind!=='chicken'&&kind!=='cow')continue;
   site.trough=(site.trough??0)-1;const rec=care.animals[id]??={};rec.fed=day;
   if(kind==='cow')rec.milk=true;
   else{const eggs=site.eggs??=[];const free=Array.from({length:NEST_COUNT},(_,i)=>i).find(i=>!eggs.includes(i));if(free!==undefined)eggs.push(free);}
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
export const milkReady=(save:SaveData,id:string)=>!!save.animalCare?.animals[id]?.milk;
export const fedToday=(save:SaveData,id:string)=>save.animalCare?.animals[id]?.fed===productionDay(save);
export interface ProductionSummary{trough:number;capacity:number;animals:number;fed:number;eggs:number;milk:number}
export function productionSummary(save:SaveData,site:FarmSite):ProductionSummary{
 return{trough:site.trough??0,capacity:TROUGH_CAPACITY[site.kind]??0,animals:site.animals.length,fed:site.animals.filter(id=>fedToday(save,id)).length,eggs:site.eggs?.length??0,milk:site.animals.filter(id=>milkReady(save,id)).length};
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
  if(space<=0)return fail(`O cocho está cheio (${cap} palhas).`);
  const n=Math.min(space,d.inventory.hay);if(n<=0)return fail('Traga palha na mochila. Retire no silo ou prepare com fibras.');
  d.inventory.hay-=n;site.trough=(site.trough??0)+n;
  return{ok:true,message:`${n} ${n===1?'palha colocada':'palhas colocadas'} no cocho (${site.trough}/${cap}). Cada animal come 1 por dia, às 06:00.`};
 },siteId);
}
export function collectEgg(save:SaveData,siteId:number,nest:number,write:Writer):Result{
 return commit(save,write,(d,site)=>{
  if(!site.eggs?.includes(nest))return fail('Ninho vazio. Galinhas alimentadas botam pela manhã.');
  const i=new Inventory(d.inventory);if(!i.transact({},{egg:1}))return fail('Libere espaço na mochila para guardar o ovo.');
  d.inventory=i.data;site.eggs=site.eggs.filter(n=>n!==nest);if(!site.eggs.length)delete site.eggs;
  return{ok:true,message:'Você recolheu 1 ovo.'};
 },siteId);
}
export function canMilk(save:SaveData,id:string):Result{
 if(!milkReady(save,id))return fail(fedToday(save,id)?'Esta vaca já foi ordenhada hoje.':'Vaca sem leite. Ela precisa comer palha do cocho pela manhã.');
 if(save.inventory.milkPail<1)return fail('Você precisa de um balde de ordenha. Faça na bancada.');
 return{ok:true,message:'Ordenhando…'};
}
export function milkCow(save:SaveData,siteId:number,id:string,write:Writer):Result{
 return commit(save,write,(d,site)=>{
  if(!site.animals.includes(id))return fail('Esta vaca não mora aqui.');
  const check=canMilk(d,id);if(!check.ok)return check;
  const i=new Inventory(d.inventory);if(!i.transact({},{milk:1}))return fail('Libere espaço na mochila para guardar o leite.');
  d.inventory=i.data;delete d.animalCare!.animals[id].milk;
  return{ok:true,message:'Você ordenhou 1 leite.'};
 },siteId);
}

export function validAnimalCare(v:unknown,day:number):v is AnimalCare{
 if(!v||typeof v!=='object'||Array.isArray(v))return false;const c=v as AnimalCare;
 if(!Number.isSafeInteger(c.day)||c.day<0||c.day>day||!c.animals||typeof c.animals!=='object'||Array.isArray(c.animals))return false;
 const entries=Object.entries(c.animals);if(entries.length>64)return false;
 return entries.every(([id,r])=>typeof id==='string'&&id.length<=64&&!!r&&typeof r==='object'&&!Array.isArray(r)
  &&(r.fed===undefined||Number.isSafeInteger(r.fed)&&r.fed>=0&&r.fed<=c.day)&&(r.milk===undefined||r.milk===true)
  &&Object.keys(r).every(k=>k==='fed'||k==='milk'));
}
/** Campos de produção de cada obra: cocho e ovos só em galinheiro e curral prontos. */
export function validSiteProduction(s:FarmSite):boolean{
 const cap=TROUGH_CAPACITY[s.kind];
 if(s.trough!==undefined&&(cap===undefined||!s.finished||!Number.isSafeInteger(s.trough)||s.trough<0||s.trough>cap))return false;
 if(s.eggs!==undefined&&(s.kind!=='coop'||!s.finished||!Array.isArray(s.eggs)||s.eggs.length>NEST_COUNT||new Set(s.eggs).size!==s.eggs.length||s.eggs.some(n=>!Number.isInteger(n)||n<0||n>=NEST_COUNT)))return false;
 return true;
}
export const farmAnimalNoun=(kind:FarmSite['kind'])=>FARM_BUILDINGS[kind].animal==='cow'?'vaca':'galinha';
