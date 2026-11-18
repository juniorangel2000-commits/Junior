import type {ItemId,SaveData} from '../types';
import type {SocialNpc} from '../data/npc-social';
import type {GameClock} from './clock';
import {NPC_SOCIAL} from '../data/npc-social';
import {ITEM_NAMES} from '../data/items';
import {REST_WEEKDAY,restDay,rainyDay} from '../data/village-schedule';
import {dayRoll} from '../weather-model';
import {Inventory} from './inventory';
import {commitSocial,ensureNpcSocial,type SocialRuntime} from './npc-social';
import type {SocialResult} from './npc-gifts';

/** Visitas à propriedade (de manhã, quando o jogador acorda em casa): um morador com amizade 8 ou mais, no dia de folga e com
 * tempo aberto, vem à propriedade de manhã, logo depois de você acordar, e traz um presente. No máximo um por dia. */
export const PROPERTY_VISIT={start:8*60,leave:10*60+15,end:11*60,minAffinity:8,chance:.65,affinity:1,arriveMinutes:30} as const;
/** Onde o visitante espera, perto da porta da casa (pixels do mapa da propriedade). */
export const PROPERTY_VISIT_SPOT={x:27.5*32,y:18.5*32} as const;
/** O visitante chega e vai embora pela estrada da vila (src/data/property-village-gate.ts). */
export const PROPERTY_VISIT_GATE={x:93.5*32,y:52.5*32} as const;
/** Etapa da visita pela hora: chegando/esperando até `leave`, depois indo embora. */
export const visitStage=(time:number):'stay'|'leave'=>time<PROPERTY_VISIT.leave?'stay':'leave';
/** Onde o visitante começa quando a cena o mostra pela primeira vez naquela etapa. */
export function visitStartPoint(time:number):{x:number;y:number}{
 return visitStage(time)==='stay'&&time<PROPERTY_VISIT.start+PROPERTY_VISIT.arriveMinutes?PROPERTY_VISIT_GATE:PROPERTY_VISIT_SPOT;
}

export interface PropertyVisitGift{items:Partial<Record<ItemId,number>>;line:string}
export const PROPERTY_VISIT_GIFTS:Readonly<Partial<Record<SocialNpc,readonly PropertyVisitGift[]>>>={
 augusto:[{items:{homemadeBread:2},line:'Passei para ver como você está. Trouxe pão do armazém, ainda quentinho.'},{items:{egg:6},line:'Sobraram ovos da entrega. Melhor aqui do que estragando no balcão.'}],
 rosa:[{items:{fertilizer:6},line:'Trouxe adubo. Já vi que a sua terra está pedindo!'},{items:{sunflowerSeeds:4},line:'Sementes de girassol. Plante perto da casa, fica uma beleza.'}],
 tobias:[{items:{plank:6},line:'Sobrou madeira da oficina. Achei que você ia aproveitar.'},{items:{nails:8},line:'Pregos. Nunca é demais numa propriedade.'}],
 amelia:[{items:{rareHerb:2},line:'Achei estas ervas no caminho. Elas crescem bem perto de casas cuidadas.'},{items:{herbalTonic:1},line:'Um tônico, para o dia de trabalho.'}],
 nilo:[{items:{goldShard:2},line:'Achei isto revirando umas caixas velhas. Fica com você.'},{items:{electronicPart:1},line:'Uma peça antiga. Quem sabe ainda funciona.'}],
 celina:[{items:{cloth:2},line:'Retalhos bons, de uma encomenda. Servem para muita coisa.'},{items:{cloth:3},line:'Trouxe tecido. Uma casa precisa de cortinas!'}],
 icaro:[{items:{spring:2},line:'Molas! Sobraram do conserto do rádio.'},{items:{gear:1},line:'Uma engrenagem. Não pergunte de onde saiu.'}],
};
const COMMENTS:Readonly<Partial<Record<SocialNpc,{empty:string;growing:string}>>>={
 augusto:{empty:'Este lugar ainda está bem cru, mas dá para ver que tem futuro.',growing:'Essa horta vai abastecer metade do meu armazém!'},
 rosa:{empty:'Tanta terra boa esperando semente... dá vontade de plantar tudo.',growing:'Que plantação bonita! Dá para ver que você cuida todo dia.'},
 tobias:{empty:'Casa firme. Quem construiu sabia o que fazia.',growing:'Você está transformando isto aqui. Dá orgulho de ver.'},
 amelia:{empty:'O ar aqui é diferente da vila. Mais calmo.',growing:'As plantas estão felizes. Dá para sentir.'},
 nilo:{empty:'Esta propriedade tem história. Antes da chuva, era uma das maiores do vale.',growing:'Você está devolvendo a vida a um lugar antigo. Bonito de ver.'},
 celina:{empty:'Uma casa tão bonita merecia umas cortinas, sabia?',growing:'Que lugar acolhedor você está fazendo!'},
 icaro:{empty:'Aqui caberia um moinho. Ou uma antena. Ou os dois!',growing:'Uma propriedade produzindo assim precisa de máquinas. Me chame quando quiser!'},
};
const VISITORS=Object.keys(REST_WEEKDAY) as SocialNpc[];

/** Quem visita hoje (ou ninguém). Não depende da hora; só do dia, do tempo e da amizade. */
export function propertyVisitor(s:Pick<SaveData,'day'|'npcSocial'>):SocialNpc|undefined{
 if(rainyDay(s.day))return;
 const candidates=VISITORS.filter(id=>restDay(id as never,s.day)&&(s.npcSocial?.players[id]?.affinity??0)>=PROPERTY_VISIT.minAffinity);
 if(!candidates.length||dayRoll(s.day*7919+11)>=PROPERTY_VISIT.chance)return;
 return candidates[Math.floor(dayRoll(s.day*104729+5)*candidates.length)%candidates.length];
}
export const visitWindow=(c:GameClock)=>c.time>=PROPERTY_VISIT.start&&c.time<PROPERTY_VISIT.end;
/** O morador está na propriedade agora (e, portanto, fora da vila). */
export function visitingProperty(id:string,s:GameClock&Partial<Pick<SaveData,'npcSocial'>>):boolean{
 return visitWindow(s)&&propertyVisitor(s as SaveData)===id;
}
export const visitGiftReceived=(s:Pick<SaveData,'day'|'propertyVisitDay'>)=>s.propertyVisitDay===s.day;
export function propertyVisitGift(id:SocialNpc,day:number):PropertyVisitGift|undefined{
 const list=PROPERTY_VISIT_GIFTS[id];return list?.[day%list.length];
}
export function propertyVisitComment(s:SaveData,id:SocialNpc):string{
 const c=COMMENTS[id];if(!c)return'';
 return (s.crops?.length??0)>=6?c.growing:c.empty;
}
/** Falas da conversa na propriedade: a saudação com presente (se ainda não recebido) e o comentário. */
export function propertyVisitDialogue(s:SaveData,id:SocialNpc):string[]{
 const gift=propertyVisitGift(id,s.day),comment=propertyVisitComment(s,id);
 return[...(!visitGiftReceived(s)&&gift?[gift.line]:['Obrigado por me receber. Já já volto para a vila.']),...(comment?[comment]:[])];
}
/** Entrega o presente da visita uma vez por dia: itens na mochila e +1 de amizade. */
export function receiveVisitGift(runtime:SocialRuntime,id:SocialNpc):SocialResult{
 const draft=structuredClone(runtime.snapshot());
 if(!visitingProperty(id,draft))return{ok:false,message:'A visita já terminou.'};
 if(visitGiftReceived(draft))return{ok:false,message:'Você já recebeu o presente de hoje.'};
 const gift=propertyVisitGift(id,draft.day);if(!gift)return{ok:false,message:'Sem presente hoje.'};
 const inv=new Inventory(draft.inventory);
 if(!inv.transact({},gift.items))return{ok:false,message:'Libere espaço na mochila para receber o presente.'};
 draft.inventory=inv.data;draft.propertyVisitDay=draft.day;
 const p=ensureNpcSocial(draft).players[id]??={affinity:0};p.affinity=Math.min(NPC_SOCIAL.max,p.affinity+PROPERTY_VISIT.affinity);
 if(!commitSocial(runtime,draft,true))return{ok:false,message:'Não foi possível salvar. O presente foi devolvido.'};
 const names=Object.entries(gift.items).map(([item,n])=>`${n} × ${ITEM_NAMES[item as ItemId]}`).join(', ');
 return{ok:true,message:`Recebido: ${names}.`,lines:[gift.line]};
}
export function validPropertyVisitDay(v:unknown):boolean{return v===undefined||Number.isSafeInteger(v)&&(v as number)>=1&&(v as number)<=999_999;}
