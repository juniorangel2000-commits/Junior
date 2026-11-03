import type {SaveData} from '../types';
import {NPC_SOCIAL,SOCIAL_DISAGREEMENTS,type SocialNpc,type SocialMemoryKind} from '../data/npc-social';
import {MINE_MISSIONS,type MineMissionId,mineMission} from '../data/mine-missions';
import {newNpcSocial,socialPairKey,socialMemoryKey,type NpcSocialState,type SocialMemory} from './npc-social-state';
export interface SocialRuntime{current?:()=>SaveData;snapshot:()=>SaveData;write:(draft:SaveData)=>boolean;apply:(draft:SaveData)=>void}
export interface SocialContext{greeting:string;memory?:string;label:string;canRespond:boolean}
export function createSocialRuntime(snapshot:()=>SaveData,write:(save:SaveData)=>boolean,root:()=>SaveData):SocialRuntime{return{current:root,snapshot,write,apply:d=>{root().npcSocial=d.npcSocial;}};}
export const ensureNpcSocial=(save:SaveData):NpcSocialState=>save.npcSocial??=newNpcSocial();
const clamp=(n:number)=>Math.max(NPC_SOCIAL.min,Math.min(NPC_SOCIAL.max,n));
const relationship=(save:SaveData,id:SocialNpc)=>ensureNpcSocial(save).players[id]??={affinity:0};
export function recordSocialMemory(save:SaveData,npc:SocialNpc,kind:SocialMemoryKind,sequence:number,detail?:MineMissionId,day=save.day,affinity=0):boolean{
 const key=socialMemoryKey(npc,kind,detail),old=save.npcSocial?.memories[key];
 if(!Number.isSafeInteger(sequence)||sequence<1||sequence>NPC_SOCIAL.maxCount||old&&sequence<=old.sequence||day<1||day>save.day||old&&day<old.day)return false;
 const state=ensureNpcSocial(save);if(!old&&Object.keys(state.memories).length>=NPC_SOCIAL.maxMemories)return false;
 state.memories[key]={npc,kind,sequence,detail,day,count:Math.min(NPC_SOCIAL.maxCount,(old?.count??0)+1)};
 if(affinity){const p=relationship(save,npc);p.affinity=clamp(p.affinity+affinity);}return true;
}
/** Backfill only facts proved by existing durable records; never grant retroactive affinity. */
export function reconcileSocialFacts(save:SaveData):void{
 const r=save.mineRescue;if(r)recordSocialMemory(save,'bento','rescue',r.count,undefined,r.day);
 for(const def of MINE_MISSIONS){const q=save.mineMissions?.quests[def.id];if(!q)continue;
  const sequence=def.kind==='repeat'?(q.cycle??0)+1:1;
  if(q.status==='completed'&&q.completedDay){recordSocialMemory(save,'bento','request-completed',sequence,def.id,q.completedDay);if(def.visits)recordSocialMemory(save,'bento','gallery',1,def.id,q.completedDay);}
  if(q.status==='waiting'&&q.acceptedDay)recordSocialMemory(save,'bento','request-interrupted',sequence,def.id);
 }
 const trip=save.bentoWork?.trip,day=save.bentoTravel?.lastCompletedDay;if(day&&trip?.day===day&&trip.blocks>0)recordSocialMemory(save,'bento','productive-trip',day,undefined,day);
}
export function socialMemoryLine(m:SocialMemory):string{
 switch(m.kind){
  case'first-trip':return'Lembro da primeira vez que seguimos juntos na viagem à mina. É bom ter companhia no caminho.';
  case'gallery':return m.detail==='forgotten-passage'?'Aquela passagem esquecida que você encontrou ainda me deixa curioso. Há muita história debaixo da serra.':'Aquele reconhecimento das galerias que você fez ajuda a entender melhor a mina.';
  case'fled-zombies':return'Os zumbis me fizeram recuar daquela vez. Prefiro voltar inteiro para a oficina.';
  case'request-interrupted':return`O pedido “${mineMission(m.detail!).title}” precisou ficar em espera. O que você já entregou continua anotado.`;
  case'request-completed':return`Obrigado pela ajuda com “${mineMission(m.detail!).title}”. Eu não esqueci.`;
  case'rescue':return'Você me deu um susto quando desmaiou na mina. Fico contente de ver você bem de novo.';
  case'productive-trip':return'Aquela viagem rendeu materiais para minha oficina. É bom ver o trabalho da mina chegando aos depósitos.';
 }
}
export function socialContext(save:SaveData,npc:SocialNpc):SocialContext{
 const p=save.npcSocial?.players[npc],n=p?.affinity??0;
 return{label:n<=-4?'Um pouco distantes':n>=8?'Amizade':n>=3?'À vontade':'Conhecendo melhor',greeting:n<=-4?'Olá. Hoje prefiro uma conversa mais curta.':n>=8?'Que bom encontrar você! Como tem passado?':n>=3?'É bom ver você por aqui. Como vai?':'Olá! Como você está?',canRespond:p?.responseDay!==save.day};
}
function commit(runtime:SocialRuntime,draft:SaveData):boolean{try{if(!runtime.write(draft))return false;}catch{return false;}runtime.apply(draft);return true;}
export function openSocialConversation(runtime:SocialRuntime,npc:SocialNpc):SocialContext{
 const draft=structuredClone(runtime.snapshot());reconcileSocialFacts(draft);const p=relationship(draft,npc),view=socialContext(draft,npc);
 if(p.memoryDay!==draft.day){
  const memory=Object.values(draft.npcSocial!.memories).filter(m=>m.npc===npc&&(m.mentionedDay===undefined||draft.day-m.mentionedDay>=NPC_SOCIAL.memoryCooldownDays)).sort((a,b)=>b.day-a.day||b.sequence-a.sequence)[0];
  if(memory){view.memory=socialMemoryLine(memory);memory.mentionedDay=draft.day;p.memoryDay=draft.day;}
 }
 if(!commit(runtime,draft))return socialContext(runtime.snapshot(),npc);return view;
}
export function respondSocial(runtime:SocialRuntime,npc:SocialNpc,tone:'warm'|'distant'):{ok:boolean;message:string;context?:SocialContext}{
 const draft=structuredClone(runtime.snapshot()),p=relationship(draft,npc);
 if(p.responseDay===draft.day)return{ok:false,message:'Vocês já tiveram essa conversa hoje.'};
 p.affinity=clamp(p.affinity+(tone==='warm'?1:-1));p.responseDay=draft.day;
 if(!commit(runtime,draft))return{ok:false,message:'Não foi possível salvar a conversa. Tente novamente.'};
 return{ok:true,message:tone==='warm'?'Também gostei de conversar. Até a próxima!':'Tudo bem. Vou respeitar seu espaço.',context:socialContext(draft,npc)};
}
export interface SocialExchange{pair:readonly[SocialNpc,SocialNpc];day:number;delta:number;lines:readonly[string,string]}
export function socialExchangeAvailable(save:SaveData,pair:readonly[SocialNpc,SocialNpc]):boolean{const p=save.npcSocial?.pairs[socialPairKey(...pair)];return pair[0]!==pair[1]&&(!p||p.startedDay<save.day&&(p.affinity>=0||(save.day+socialPairKey(...pair).length)%3===0));}
export function beginSocialExchange(runtime:SocialRuntime,pair:readonly[SocialNpc,SocialNpc],_fallback:readonly[string,string]):SocialExchange|undefined{
 const live=runtime.current?.()??runtime.snapshot(),key=socialPairKey(...pair);
 if(!socialExchangeAvailable(live,pair))return;
 const draft=structuredClone(runtime.snapshot()),s=ensureNpcSocial(draft),old=s.pairs[key];reconcileSocialFacts(draft);
 if(pair[0]===pair[1]||old?.startedDay===draft.day||old&&old.startedDay>draft.day||old&&old.affinity<0&&(draft.day+key.length)%3!==0)return;
 const disagreement=SOCIAL_DISAGREEMENTS[key],contrast=!!disagreement&&(draft.day+key.length)%4===0;
 const opinions:readonly[string,string]|undefined=disagreement&&(pair[0]===key.split(':')[0]?disagreement:[disagreement[1],disagreement[0]]);
 let lines:readonly[string,string]=contrast?opinions!:old&&old.affinity>=6?['É bom dividir esta pausa com você.','Também gosto da nossa conversa. Até daqui a pouco.']:['Como vai? É bom conversar um pouco.','Também gosto de uma conversa antes de seguir.'];
 if(!contrast&&pair.includes('bento')){const m=Object.values(s.memories).filter(m=>m.npc==='bento'&&(m.sharedDay===undefined||draft.day-m.sharedDay>=NPC_SOCIAL.memoryCooldownDays)).sort((a,b)=>b.day-a.day)[0];if(m){const text=ambientMemoryLine(m);lines=pair[0]==='bento'?[text,'Faz bem compartilhar essas histórias com alguém.']:['Como andam as coisas na mina, Bento?',text];m.sharedDay=draft.day;}}
 s.pairs[key]={affinity:old?.affinity??0,startedDay:draft.day,completedDay:old?.completedDay,encounters:old?.encounters??0};
 if(!commit(runtime,draft))return;
 return{pair,day:draft.day,delta:contrast?-1:1,lines};
}
export function completeSocialExchange(runtime:SocialRuntime,event:SocialExchange):boolean{
 const draft=structuredClone(runtime.snapshot()),p=draft.npcSocial?.pairs[socialPairKey(...event.pair)];
 if(!p||draft.day!==event.day||p.startedDay!==event.day||p.completedDay===event.day)return false;
 p.completedDay=event.day;p.encounters=Math.min(NPC_SOCIAL.maxCount,p.encounters+1);p.affinity=clamp(p.affinity+event.delta);return commit(runtime,draft);
}

function ambientMemoryLine(m:SocialMemory):string{
 switch(m.kind){
  case'rescue':return'Encontrei alguém desmaiado na mina e levei para casa. Ainda bem que consegui ajudar.';
  case'first-trip':return'Tive companhia numa viagem à mina. Foi bom dividir o caminho.';
  case'gallery':return'Soube de uma antiga área de trabalho nas galerias. A mina ainda tem muitas histórias.';
  case'fled-zombies':return'Precisei recuar dos zumbis lá embaixo. Voltar em segurança vem primeiro.';
  case'request-interrupted':return'Um pedido da oficina precisou ficar em espera. Cada coisa no seu tempo.';
  case'request-completed':return'Recebi ajuda com um pedido da oficina. É bom poder contar com alguém.';
  case'productive-trip':return'Trouxe materiais da mina para os depósitos da oficina. A viagem rendeu.';
 }
}
