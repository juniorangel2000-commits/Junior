import type {SaveData,TilePoint} from '../types';
import {Inventory} from './inventory';
import {FARM_BUILDINGS} from '../data/farm-buildings';
/** Doma do cavalo dos Campos Abertos (docs/planejamento/DOMESTICACAO-CAVALO.md).
 * Decisões do Junior: sem cocho; o jogador USA a cesta de colheita e ela fica no chão
 * como objeto do cenário (não é um item solto para recolher); o cavalo vai até ela.
 * São 7 dias seguidos; um dia sem cesta faz a confiança voltar a zero. A corda só
 * depois da doma completa. O estábulo é feito pelo Codex: qualquer construção pronta
 * com `animal:'horse'` em FARM_BUILDINGS serve, e ela é exigida para conduzir o cavalo. */
export const HORSE_ID='field-horse-1';
export const TAMING_DAYS=7;
export const HORSE_NAME_MAX=16;
/** Cesta colocada no chão dos Campos, à espera do cavalo. */
export interface PlacedBasket extends TilePoint{day:number}
export interface HorseTamingState{version:1;trust:number;lastFedDay?:number;tamed:boolean;name?:string;basket?:PlacedBasket}
/** Comportamento conforme o dia de alimentação (1–7): distância livre que o jogador
 * precisa manter da cesta para o cavalo se aproximar e raio em que ele foge. */
export interface TamingPhase{label:string;clearance:number;flee:number}
export function tamingPhase(feedingDay:number):TamingPhase{
 if(feedingDay<=2)return{label:'observa de longe e só come com você afastado',clearance:300,flee:196};
 if(feedingDay<=4)return{label:'reconhece você e tolera menos distância',clearance:170,flee:120};
 return{label:'se aproxima da cesta mesmo com você por perto',clearance:56,flee:56};
}
const fresh=():HorseTamingState=>({version:1,trust:0,tamed:false});
export const horseTaming=(s:SaveData):HorseTamingState=>s.horseTaming??fresh();
export const horseOwned=(s:SaveData)=>s.recruitedAnimals?.includes(HORSE_ID)??false;
/** Cavalo fora dos Campos: conduzido para a Propriedade ou já entregue nela. */
export const horseLeftFields=(s:SaveData)=>horseOwned(s)||s.animalEscort?.id===HORSE_ID&&s.animalEscort.area==='property';
/** Estábulo pronto: qualquer construção concluída feita para cavalo. */
export const stableReady=(s:SaveData)=>s.farmConstruction?.sites.some(site=>site.finished&&(FARM_BUILDINGS as Record<string,{animal?:string}|undefined>)[site.kind]?.animal==='horse')??false;
/** Próximo dia de alimentação (1–7), já considerando a perda por dia sem cesta. */
export function feedingDay(s:SaveData,today=s.day):number{const t=horseTaming(s);return progressLost(t,today)?1:Math.min(TAMING_DAYS,t.trust+1);}
const progressLost=(t:HorseTamingState,today:number)=>!t.tamed&&t.trust>0&&t.lastFedDay!==undefined&&today>t.lastFedDay+1;
/** Zera a confiança se um dia inteiro passou sem cesta. Retorna true se zerou agora. */
export function applyTamingLoss(s:SaveData,today=s.day):boolean{
 const t=s.horseTaming;if(!t||!progressLost(t,today))return false;
 t.trust=0;delete t.lastFedDay;return true;
}
export const fedToday=(s:SaveData,today=s.day)=>horseTaming(s).lastFedDay===today;
export interface FeedResult{ok:boolean;message:string;trust?:number;tamed?:boolean;reset?:boolean}
/** O cavalo comeu a cesta no dia `day`. No máximo um avanço por dia. */
export function feedHorse(s:SaveData,day=s.day):FeedResult{
 const t=s.horseTaming??=fresh();
 if(t.tamed)return{ok:false,message:'O cavalo já confia em você.'};
 if(t.lastFedDay!==undefined&&day<=t.lastFedDay)return{ok:false,message:'O cavalo já comeu hoje. Volte amanhã com outra cesta.'};
 const reset=applyTamingLoss(s,day);
 t.trust=Math.min(TAMING_DAYS,t.trust+1);t.lastFedDay=day;delete t.basket;
 if(t.trust>=TAMING_DAYS){t.tamed=true;return{ok:true,trust:t.trust,tamed:true,reset,message:'O cavalo terminou a cesta e veio até você. Ele confia em você agora: aproxime-se e dê um nome a ele.'};}
 return{ok:true,trust:t.trust,tamed:false,reset,message:`O cavalo comeu a cesta. Confiança ${t.trust}/${TAMING_DAYS}.${reset?' Como faltou cesta em um dia, a confiança tinha voltado a zero.':''} Use outra cesta amanhã.`};
}
/** Usar a cesta nos Campos: ela é colocada no chão em `p` e sai da mochila. */
export function placeBasket(s:SaveData,p:TilePoint,write:(d:SaveData)=>boolean):{ok:boolean;message:string}{
 const t=horseTaming(s),fail=(message:string)=>({ok:false,message});
 if(s.activeArea!=='openFields')return fail('Use a cesta nos Campos Abertos, onde vive o cavalo selvagem.');
 if(horseLeftFields(s)||t.tamed)return fail('O cavalo já confia em você. Guarde a cesta.');
 if(t.basket)return fail('Já há uma cesta no chão esperando o cavalo.');
 if(fedToday(s))return fail('O cavalo já comeu hoje. Use outra cesta amanhã.');
 if(![p.x,p.y].every(Number.isFinite))return fail('Escolha um lugar livre no chão.');
 const d=structuredClone(s),i=new Inventory(d.inventory);if(!i.spend({harvestBasket:1}))return fail('Você não tem uma cesta de colheita.');
 d.inventory=i.data;d.horseTaming={...horseTaming(d),basket:{x:Math.round(p.x),y:Math.round(p.y),day:d.day}};
 try{if(!write(d))return fail('Não foi possível salvar. A cesta continua na mochila.');}catch{return fail('Não foi possível salvar. A cesta continua na mochila.');}
 Object.assign(s,{inventory:d.inventory,horseTaming:d.horseTaming});
 return{ok:true,message:t.trust<2?'Cesta no chão. Afaste-se bastante: o cavalo só vem com você longe.':'Cesta no chão. Dê espaço para o cavalo se aproximar.'};
}
/** Desistir da cesta colocada: ela volta para a mochila. */
export function pickUpBasket(s:SaveData,write:(d:SaveData)=>boolean):{ok:boolean;message:string}{
 const t=horseTaming(s),fail=(message:string)=>({ok:false,message});if(!t.basket)return fail('');
 const d=structuredClone(s),i=new Inventory(d.inventory);if(!i.transact({},{harvestBasket:1}))return fail('Libere espaço na mochila para recolher a cesta.');
 d.inventory=i.data;const next={...horseTaming(d)};delete next.basket;d.horseTaming=next;
 try{if(!write(d))return fail('Não foi possível salvar.');}catch{return fail('Não foi possível salvar.');}
 Object.assign(s,{inventory:d.inventory,horseTaming:d.horseTaming});return{ok:true,message:'Cesta recolhida.'};
}
/** Com o jogador fora dos Campos, o cavalo come a cesta colocada no chão no próprio
 * dia (ou no dia seguinte ao último em que comeu). Também aplica a perda por dia sem
 * cesta. Com o jogador presente, a cesta do dia fica para o cavalo buscar na cena. */
export function settleHorseTaming(s:SaveData,today=s.day,playerInFields=s.activeArea==='openFields'):FeedResult[]{
 const results:FeedResult[]=[],t=s.horseTaming;
 if(t?.basket&&!t.tamed&&!horseLeftFields(s)){
  const day=Math.max(t.basket.day,(t.lastFedDay??0)+1);
  if(day<today||day===today&&!playerInFields){const r=feedHorse(s,day);if(r.ok)results.push(r);}
 }
 applyTamingLoss(s,today);return results;
}
export function validHorseName(name:string):string{
 const n=name.trim().replace(/\s+/g,' ');
 if(!n)return'Escolha um nome para o cavalo.';
 if(n.length>HORSE_NAME_MAX)return`Use até ${HORSE_NAME_MAX} letras.`;
 if(!/^[\p{L}][\p{L}\p{M} '-]*$/u.test(n))return'Use apenas letras, espaços, hífen e apóstrofo.';
 return'';
}
export function nameHorse(s:SaveData,name:string,write:(d:SaveData)=>boolean):{ok:boolean;message:string}{
 const t=horseTaming(s);if(!t.tamed)return{ok:false,message:'O cavalo ainda não confia em você.'};
 const reason=validHorseName(name);if(reason)return{ok:false,message:reason};
 const d=structuredClone(s),n=name.trim().replace(/\s+/g,' ');d.horseTaming={...t,name:n};
 try{if(!write(d))return{ok:false,message:'Não foi possível salvar o nome.'};}catch{return{ok:false,message:'Não foi possível salvar o nome.'};}
 s.horseTaming=d.horseTaming;return{ok:true,message:`${n} agora tem nome. Com uma corda, você pode levá-lo ao estábulo.`};
}
/** A corda só pode ser colocada depois da doma completa, do nome e com o estábulo pronto. */
export function startHorseEscort(s:SaveData,horse:TilePoint&{direction:import('../character-directions').CharacterDirection}):{ok:boolean;message:string}{
 const t=horseTaming(s),fail=(message:string)=>({ok:false,message});
 if(s.activeArea!=='openFields')return fail('O cavalo está nos Campos Abertos.');
 if(!t.tamed)return fail('O cavalo ainda não confia em você. A corda só depois da doma completa.');
 if(!t.name)return fail('Dê um nome ao cavalo antes de conduzi-lo.');
 if(s.animalEscort)return fail('Você já está conduzindo um animal.');
 if(!stableReady(s))return fail(`Construa um estábulo na Propriedade antes de levar ${t.name}.`);
 const i=new Inventory(s.inventory);if(!i.spend({cord:1}))return fail('Leve uma corda para conduzir o cavalo.');
 Object.assign(s.inventory,i.data);s.animalEscort={id:HORSE_ID,area:'openFields'};
 const f=s.openFields??={version:1,cut:{}};f.animals=(f.animals??[]).filter(a=>a.id!==HORSE_ID).concat({id:HORSE_ID,x:horse.x,y:horse.y,direction:horse.direction});
 return{ok:true,message:`Corda colocada. Leve ${t.name} pela passagem norte até a Propriedade e depois ao estábulo.`};
}
export function validHorseTaming(v:unknown,day:number):v is HorseTamingState{
 if(!v||typeof v!=='object'||Array.isArray(v))return false;const t=v as HorseTamingState;
 if(t.version!==1||!Number.isInteger(t.trust)||t.trust<0||t.trust>TAMING_DAYS||typeof t.tamed!=='boolean'||t.tamed!==(t.trust===TAMING_DAYS))return false;
 if(t.lastFedDay!==undefined&&(!Number.isInteger(t.lastFedDay)||t.lastFedDay<1||t.lastFedDay>day))return false;
 if(t.trust>0&&t.lastFedDay===undefined)return false;
 if(t.name!==undefined&&(typeof t.name!=='string'||!t.tamed||validHorseName(t.name)!==''||t.name!==t.name.trim()))return false;
 if(t.basket!==undefined){const b=t.basket;if(!b||typeof b!=='object'||t.tamed||!Number.isFinite(b.x)||!Number.isFinite(b.y)||b.x<32||b.x>3040||b.y<32||b.y>2272||!Number.isInteger(b.day)||b.day<1||b.day>day)return false;}
 return true;
}
/** Travessia dos Campos para a Propriedade com o cavalo na corda. */
export function transferHorseToProperty(s:SaveData,arrival:TilePoint):void{
 const e=s.animalEscort;if(e?.id!==HORSE_ID||e.area!=='openFields')return;
 const old=s.openFields?.animals?.find(a=>a.id===HORSE_ID);
 if(s.openFields?.animals)s.openFields.animals=s.openFields.animals.filter(a=>a.id!==HORSE_ID);
 const p=s.animalPositions??={forest:[],property:[]};
 p.property=p.property.filter(a=>a.id!==HORSE_ID).concat({id:HORSE_ID,x:arrival.x+30,y:arrival.y+8,direction:old?.direction??'up'});
 e.area='property';
}
