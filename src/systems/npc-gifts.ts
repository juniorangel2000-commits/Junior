import type {ItemId,SaveData} from '../types';
import type {SocialNpc} from '../data/npc-social';
import {NPC_SOCIAL} from '../data/npc-social';
import {DISH_IDS} from '../data/kitchen';
import {ITEM_NAMES} from '../data/items';
import {NPC_TASTES,NOT_GIFTABLE,GIFT_AFFINITY,FRIENDSHIP_REWARD_LEVELS,FRIENDSHIP_REWARDS,type GiftTaste} from '../data/npc-gifts';
import {ANSWER_AFFINITY,NPC_ANSWERS,type AnswerTone} from '../data/npc-answers';
import {Inventory} from './inventory';
import {MAX_KNOWN_GIFTS} from './npc-social-state';
import {commitSocial,ensureNpcSocial,socialContext,type SocialContext,type SocialRuntime} from './npc-social';
/** Presentes, respostas nas conversas e presentes de amizade (preview.43).
 * Tudo passa pelo `SocialRuntime`: um rascunho do save é alterado, salvo e só então aplicado. */
export interface SocialResult{ok:boolean;message:string;context?:SocialContext;reply?:string;rewards?:string[]}
const fail=(message:string):SocialResult=>({ok:false,message});
const clamp=(n:number)=>Math.max(NPC_SOCIAL.min,Math.min(NPC_SOCIAL.max,n));
const relation=(s:SaveData,npc:SocialNpc)=>ensureNpcSocial(s).players[npc]??={affinity:0};

export function giftTaste(npc:SocialNpc,item:ItemId):GiftTaste{
 const t=NPC_TASTES[npc];
 if(t.loved.includes(item))return'loved';if(t.liked.includes(item))return'liked';if(t.disliked.includes(item))return'disliked';
 return(DISH_IDS as readonly string[]).includes(item)?'liked':'neutral';
}
export const giftable=(item:ItemId):boolean=>!NOT_GIFTABLE.has(item);
/** Itens da mochila que dá para presentear, com a reação já conhecida (se o jogador já deu antes). */
export function giftChoices(save:SaveData,npc:SocialNpc):{item:ItemId;count:number;known?:GiftTaste}[]{
 const known=new Set(save.npcSocial?.players[npc]?.known??[]);
 return(Object.entries(save.inventory) as [ItemId,unknown][]).filter(([item,n])=>typeof n==='number'&&n>0&&giftable(item)&&Object.hasOwn(ITEM_NAMES,item))
  .map(([item,n])=>({item,count:n as number,known:known.has(item)?giftTaste(npc,item):undefined}));
}
/** Entrega os presentes de amizade dos níveis já alcançados. Fica pendente se a mochila estiver cheia. */
export function claimFriendshipRewards(s:SaveData,npc:SocialNpc):{lines:string[];inventory:boolean}{
 const p=relation(s,npc),lines:string[]=[];let inventory=false;
 while((p.rewards??0)<FRIENDSHIP_REWARD_LEVELS.length&&p.affinity>=FRIENDSHIP_REWARD_LEVELS[p.rewards??0]){
  const reward=FRIENDSHIP_REWARDS[npc][p.rewards??0],inv=new Inventory(s.inventory);
  if(!inv.transact({},reward.items as Partial<Record<ItemId,number>>)){lines.push('Tenho um presente para você, mas sua mochila está cheia. Libere espaço e volte aqui.');break;}
  s.inventory=inv.data;inventory=true;p.rewards=(p.rewards??0)+1;
  const items=Object.entries(reward.items).map(([id,n])=>`${n} × ${ITEM_NAMES[id as ItemId]}`).join(', ');
  lines.push(`${reward.line} (Recebido: ${items}.)`);
 }
 return{lines,inventory};
}
export function giveGift(runtime:SocialRuntime,npc:SocialNpc,item:ItemId):SocialResult{
 const draft=structuredClone(runtime.snapshot()),p=relation(draft,npc);
 if(p.giftDay===draft.day)return fail('Você já deu um presente hoje. Volte amanhã.');
 if(!giftable(item))return fail('Isto não dá para dar de presente.');
 const inv=new Inventory(draft.inventory);if(!inv.spend({[item]:1}))return fail('Você não tem este item na mochila.');
 draft.inventory=inv.data;
 const taste=giftTaste(npc,item);p.affinity=clamp(p.affinity+GIFT_AFFINITY[taste]);p.giftDay=draft.day;
 const known=p.known??=[];if(!known.includes(item)&&known.length<MAX_KNOWN_GIFTS)known.push(item);
 const rewards=claimFriendshipRewards(draft,npc);
 if(!commitSocial(runtime,draft,true))return fail('Não foi possível salvar. O presente ficou com você.');
 const reply=NPC_TASTES[npc].lines[taste];
 return{ok:true,message:TASTE_NOTE[taste],reply,rewards:rewards.lines,context:socialContext(draft,npc)};
}
export const TASTE_NOTE:Record<GiftTaste,string>={loved:'♥♥ Adorou o presente!',liked:'♥ Gostou do presente.',neutral:'Recebeu o presente.',disliked:'✗ Não gostou do presente.'};
export const TASTE_BADGE:Record<GiftTaste,string>={loved:'♥♥ adora',liked:'♥ gosta',neutral:'· tanto faz',disliked:'✗ não gosta'};
/** Resposta do jogador ao fim da conversa (src/data/npc-answers.ts). Uma por dia. */
export function answerConversation(runtime:SocialRuntime,npc:SocialNpc,conversation:number,tone:AnswerTone):SocialResult{
 const answer=NPC_ANSWERS[npc]?.[conversation]?.find(a=>a.tone===tone);if(!answer)return fail('Esta conversa não tem essa resposta.');
 const draft=structuredClone(runtime.snapshot()),p=relation(draft,npc);
 if(p.responseDay===draft.day)return fail('Vocês já conversaram hoje.');
 p.affinity=clamp(p.affinity+ANSWER_AFFINITY[tone]);p.responseDay=draft.day;
 const rewards=claimFriendshipRewards(draft,npc);
 if(!commitSocial(runtime,draft,rewards.inventory))return fail('Não foi possível salvar a conversa. Tente novamente.');
 return{ok:true,message:tone==='good'?'♥ Gostou da resposta.':tone==='bad'?'✗ Não gostou da resposta.':'',reply:answer.reply,rewards:rewards.lines,context:socialContext(draft,npc)};
}
/** Ao abrir a conversa: entrega presente de amizade que ficou pendente (mochila cheia antes). */
export function collectPendingRewards(runtime:SocialRuntime,npc:SocialNpc):string[]{
 const draft=structuredClone(runtime.snapshot()),r=claimFriendshipRewards(draft,npc);
 if(!r.inventory)return r.lines;
 return commitSocial(runtime,draft,true)?r.lines:[];
}
