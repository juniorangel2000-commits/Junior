import type {SaveData,TilePoint,ItemId} from '../types';
import {FIELDS_IPES} from '../data/open-fields';
import {ipeStanding} from './open-fields';
import {Inventory} from './inventory';
import {calendarDate,daysLeftInSeason} from './calendar';
import {groundClock} from './ground-items';
import {HIVE_MINUTES} from '../data/machines';
import type {PlacedMachine} from './machines';
/** Abelhas (docs/planejamento/ANIMAIS-E-RECEITAS.md, etapa 6).
 * 1. A colmeia vazia é comprada com o Augusto e colocada nos Campos Abertos, a até 2 passos
 *    do tronco de um ipê em pé (uma por ipê).
 * 2. A cada 5 dias há 40% de chance de um enxame ocupá-la. O sorteio vem do calendário e da
 *    colmeia, então recarregar o save não sorteia de novo.
 * 3. E na colmeia: povoada vira o item "colmeia povoada"; vazia volta para a mochila.
 * 4. Na Propriedade, a colmeia povoada é uma máquina que dá mel a cada 4 dias (cera a cada
 *    3 coletas) e descansa no Inverno. Margaridas ou girassóis maduros por perto dão mel de flor. */
export interface HiveTrap{id:number;ipe:string;x:number;y:number;day:number}
export interface BeekeepingState{version:1;nextId:number;traps:HiveTrap[]}
export const SWARM_EVERY_DAYS=5;
export const SWARM_CHANCE=.4;
export const TRAP_REACH=64;
export const MAX_TRAPS=6;
export const WAX_EVERY=3;
export const FLOWER_RADIUS=3;
type Result={ok:boolean;message:string};
type Writer=(d:SaveData)=>boolean;
const fail=(message:string):Result=>({ok:false,message});
const save=(s:SaveData,d:SaveData,write:Writer,keys:(keyof SaveData)[]):boolean=>{try{if(!write(d))return false;}catch{return false;}for(const k of keys)(s as unknown as Record<string,unknown>)[k]=d[k];return true;};

const roll=(trap:HiveTrap,k:number)=>{let h=(Math.imul(trap.id,374761393)^Math.imul(k,668265263)^Math.imul(Math.round(trap.x),2246822519)^Math.imul(Math.round(trap.y),3266489917))>>>0;h=Math.imul(h^h>>>15,2246822519)>>>0;h=Math.imul(h^h>>>13,3266489917)>>>0;return((h^h>>>16)>>>0)/4294967296;};
/** Dia em que o enxame chegou, se já chegou. */
export function swarmDay(trap:HiveTrap,today:number):number|undefined{
 for(let k=1;trap.day+k*SWARM_EVERY_DAYS<=today&&k<=2000;k++)if(roll(trap,k)<SWARM_CHANCE)return trap.day+k*SWARM_EVERY_DAYS;
}
export const trapSwarmed=(trap:HiveTrap,today:number)=>swarmDay(trap,today)!==undefined;
const ipeNear=(s:SaveData,p:TilePoint)=>FIELDS_IPES.filter(i=>ipeStanding(s,i.id)&&Math.hypot(i.x-p.x,i.y-p.y)<=TRAP_REACH).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];

export function placeHiveTrap(s:SaveData,p:TilePoint,write:Writer):Result{
 if(s.activeArea!=='openFields')return fail('Coloque a colmeia vazia nos Campos Abertos, perto de um ipê.');
 if(![p.x,p.y].every(Number.isFinite))return fail('Escolha um lugar livre no chão.');
 const ipe=ipeNear(s,p);if(!ipe)return fail('Fique a até 2 passos do tronco de um ipê florido.');
 const b=s.beekeeping;if(b?.traps.some(t=>t.ipe===ipe.id))return fail('Este ipê já tem uma colmeia esperando.');
 if((b?.traps.length??0)>=MAX_TRAPS)return fail('Já há colmeias demais esperando nos ipês.');
 const d=structuredClone(s),i=new Inventory(d.inventory);if(!i.spend({emptyHive:1}))return fail('Você não tem uma colmeia vazia.');
 const state=d.beekeeping??={version:1,nextId:1,traps:[]};
 state.traps.push({id:state.nextId++,ipe:ipe.id,x:Math.round(p.x),y:Math.round(p.y),day:d.day});d.inventory=i.data;
 if(!save(s,d,write,['inventory','beekeeping']))return fail('Não foi possível salvar. A colmeia continua na mochila.');
 return{ok:true,message:'Colmeia colocada junto ao ipê. A cada 5 dias um enxame pode ocupá-la.'};
}
export const nearTrap=(s:SaveData,p:TilePoint,reach=40)=>s.beekeeping?.traps.find(t=>Math.hypot(t.x-p.x,t.y-p.y)<=reach);
export function collectHiveTrap(s:SaveData,id:number,write:Writer):Result{
 const trap=s.beekeeping?.traps.find(t=>t.id===id);if(!trap)return fail('Colmeia não encontrada.');
 const swarmed=trapSwarmed(trap,s.day),d=structuredClone(s),i=new Inventory(d.inventory);
 if(!i.transact({},swarmed?{beehive:1}:{emptyHive:1}))return fail('Libere espaço na mochila para recolher a colmeia.');
 d.inventory=i.data;d.beekeeping!.traps=d.beekeeping!.traps.filter(t=>t.id!==id);
 if(!save(s,d,write,['inventory','beekeeping']))return fail('Não foi possível salvar.');
 return{ok:true,message:swarmed?'Um enxame ocupou a colmeia! Instale a colmeia povoada na Propriedade para colher mel.':'Ainda sem enxame. A colmeia vazia voltou para a mochila.'};
}
export const trapHint=(s:SaveData,t:HiveTrap)=>trapSwarmed(t,s.day)?'Colmeia com enxame · E recolher':`Colmeia vazia · enxame possível a cada 5 dias (${(s.day-t.day)%SWARM_EVERY_DAYS===0&&s.day>t.day?'hoje não veio':`próximo sorteio em ${SWARM_EVERY_DAYS-((s.day-t.day)%SWARM_EVERY_DAYS)} dia(s)`}) · E recolher`;

/** Quando o mel fica pronto: 4 dias depois; se cair no Inverno, passa para a Primavera. */
export function nextHoneyReady(startedAt:number):number{
 let ready=startedAt+HIVE_MINUTES;const day=Math.floor(ready/1440)+1;
 if(calendarDate(day).season==='winter')ready+=daysLeftInSeason(day)*1440;
 return ready;
}
/** Começa (ou recomeça) a produção de uma colmeia instalada. */
export function startHive(s:SaveData,m:PlacedMachine):void{const startedAt=groundClock(s);m.job={recipe:'hive-honey',startedAt,readyAt:nextHoneyReady(startedAt)};}
/** Mel da coleta: de flor se houver margaridas ou girassóis maduros a até 3 passos. */
export function hiveHoney(s:SaveData,m:Pick<PlacedMachine,'x'|'y'>):ItemId{
 const near=(crop:string)=>s.crops.filter(c=>c.crop===crop&&c.growth>=1&&Math.abs(c.x-m.x)<=FLOWER_RADIUS&&Math.abs(c.y-m.y)<=FLOWER_RADIUS).length;
 const daisy=near('daisy'),sunflower=near('sunflower');
 return !daisy&&!sunflower?'honey':sunflower>daisy?'sunflowerHoney':'daisyHoney';
}
/** Produtos de uma coleta: o mel e, a cada 3 coletas, cera. */
export function hiveHarvest(s:SaveData,m:PlacedMachine):Partial<Record<ItemId,number>>{
 const n=(m.harvests??0)+1;return{[hiveHoney(s,m)]:1,...(n%WAX_EVERY===0?{beeswax:1}:{})};
}
export function validBeekeeping(v:unknown,day:number):v is BeekeepingState{
 if(!v||typeof v!=='object'||Array.isArray(v))return false;const b=v as BeekeepingState;
 if(b.version!==1||!Number.isSafeInteger(b.nextId)||b.nextId<1||b.nextId>1e9||!Array.isArray(b.traps)||b.traps.length>MAX_TRAPS)return false;
 const ids=new Set<number>(),ipes=new Set<string>();
 return b.traps.every(t=>{if(!t||!Number.isSafeInteger(t.id)||t.id<1||t.id>=b.nextId||ids.has(t.id)||ipes.has(t.ipe)||!FIELDS_IPES.some(i=>i.id===t.ipe)||!Number.isFinite(t.x)||!Number.isFinite(t.y)||!Number.isInteger(t.day)||t.day<1||t.day>day)return false;
  const ipe=FIELDS_IPES.find(i=>i.id===t.ipe)!;if(Math.hypot(ipe.x-t.x,ipe.y-t.y)>TRAP_REACH+1)return false;ids.add(t.id);ipes.add(t.ipe);return true;});
}
