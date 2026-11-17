import type {ItemId,SaveData} from '../types';
import type {SocialNpc} from '../data/npc-social';
import {SOCIAL_NPCS,NPC_SOCIAL} from '../data/npc-social';
import {ITEM_NAMES} from '../data/items';
import {NPC_STORIES,STORY_AFFINITY,type NpcStory,type StoryPart} from '../data/npc-stories';
import {createVillageProgress} from '../data/village-progress';
import {createVillageEconomy} from '../data/village-commerce';
import {Inventory} from './inventory';
import {commitSocial,ensureNpcSocial,socialContext,type SocialRuntime} from './npc-social';
import {claimFriendshipRewards,type SocialResult} from './npc-gifts';
/** Histórias pessoais dos moradores (src/data/npc-stories.ts). */
export interface StoryStatus{story:NpcStory;done:number;part?:StoryPart;unlocked:boolean;needs:{item:ItemId;have:number;need:number}[];ready:boolean}
export function validNpcStories(v:unknown):boolean{
 if(v===undefined)return true;
 if(!v||typeof v!=='object'||Array.isArray(v))return false;
 return Object.entries(v).every(([id,n])=>(SOCIAL_NPCS as readonly string[]).includes(id)&&!!NPC_STORIES[id as SocialNpc]&&Number.isSafeInteger(n)&&(n as number)>=0&&(n as number)<=3);
}
export function storyStatus(s:SaveData,npc:SocialNpc):StoryStatus|undefined{
 const story=NPC_STORIES[npc];if(!story)return undefined;
 const done=s.npcStories?.[npc]??0,part=story.parts[done];
 if(!part)return{story,done,unlocked:false,needs:[],ready:false};
 const affinity=s.npcSocial?.players[npc]?.affinity??0,unlocked=affinity>=part.affinity;
 const needs=(Object.entries(part.need) as [ItemId,number][]).map(([item,need])=>({item,need,have:Math.max(0,Number(s.inventory[item])||0)}));
 return{story,done,part,unlocked,needs,ready:unlocked&&needs.every(n=>n.have>=n.need)};
}
const rewardText=(r:StoryPart['reward'])=>[
 ...Object.entries(r.items??{}).map(([id,n])=>`${n} × ${ITEM_NAMES[id as ItemId]}`),
 ...(r.coins?[`${r.coins} Coroas`]:[]),...(r.recipe?[`receita: ${ITEM_NAMES[r.recipe as ItemId]??r.recipe}`]:[])].join(', ');
export function storyRewardText(part:StoryPart):string{return rewardText(part.reward);}
/** Entrega a parte atual: gasta os itens, dá a recompensa e avança a história. */
export function completeStoryPart(runtime:SocialRuntime,npc:SocialNpc):SocialResult{
 const draft=structuredClone(runtime.snapshot()),status=storyStatus(draft,npc);
 if(!status?.part)return{ok:false,message:'Esta história já terminou.'};
 if(!status.unlocked)return{ok:false,message:'Fique mais próximo para ouvir o resto da história.'};
 const part=status.part,inv=new Inventory(draft.inventory);
 if(!inv.spend(part.need as Partial<Record<ItemId,number>>))return{ok:false,message:'Ainda faltam itens para entregar.'};
 if(part.reward.items&&!inv.transact({},part.reward.items as Partial<Record<ItemId,number>>))return{ok:false,message:'Libere espaço na mochila para receber a recompensa.'};
 draft.inventory=inv.data;
 if(part.reward.coins){draft.villageEconomy??=createVillageEconomy();draft.villageEconomy.coins+=part.reward.coins;}
 if(part.reward.recipe){draft.villageProgress??=createVillageProgress();if(!draft.villageProgress.recipes.includes(part.reward.recipe))draft.villageProgress.recipes.push(part.reward.recipe);}
 (draft.npcStories??={})[npc]=status.done+1;
 const p=ensureNpcSocial(draft).players[npc]??={affinity:0};p.affinity=Math.min(NPC_SOCIAL.max,p.affinity+STORY_AFFINITY);
 const rewards=claimFriendshipRewards(draft,npc);
 if(!commitSocial(runtime,draft,true))return{ok:false,message:'Não foi possível salvar. A entrega foi cancelada.'};
 const last=status.done+1===status.story.parts.length;
 return{ok:true,message:`${last?'História concluída':'Parte concluída'}: ${part.title}. Recebido: ${rewardText(part.reward)}.`,lines:part.thanks,rewards:rewards.lines,context:socialContext(draft,npc)};
}
