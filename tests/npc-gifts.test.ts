import {describe,it,expect} from 'vitest';
import {createNewSave,validateSave} from '../src/systems/save';
import {createCharacterProfile} from '../src/data/characters';
import {ITEMS} from '../src/data/items';
import {SOCIAL_NPCS} from '../src/data/npc-social';
import {NPC_TASTES,FRIENDSHIP_REWARDS,NOT_GIFTABLE} from '../src/data/npc-gifts';
import {NPC_ANSWERS,answersFor} from '../src/data/npc-answers';
import {NPC_CONVERSATIONS} from '../src/data/npc-conversations';
import {createSocialRuntime,friendshipLabel} from '../src/systems/npc-social';
import {giveGift,giftTaste,giftChoices,answerConversation,claimFriendshipRewards} from '../src/systems/npc-gifts';
import type {SaveData} from '../src/types';

const setup=()=>{const root={s:createNewSave(createCharacterProfile('Amiga'))};const writes:SaveData[]=[];
 const runtime=createSocialRuntime(()=>root.s,d=>{writes.push(d);return true;},()=>root.s);return{root,runtime,writes};};

describe('dados de presentes e respostas',()=>{
 it('todos os itens dos gostos e dos presentes de amizade existem e podem ser dados',()=>{
  for(const npc of SOCIAL_NPCS){const t=NPC_TASTES[npc];
   for(const i of [...t.loved,...t.liked,...t.disliked]){expect(Object.hasOwn(ITEMS,i),`${npc}: ${i}`).toBe(true);expect(NOT_GIFTABLE.has(i)).toBe(false);}
   for(const r of FRIENDSHIP_REWARDS[npc])for(const i of Object.keys(r.items))expect(Object.hasOwn(ITEMS,i),`${npc}: ${i}`).toBe(true);}
 });
 it('cada conversa tem três respostas (boa, neutra e ruim)',()=>{
  for(const [npc,list] of Object.entries(NPC_CONVERSATIONS)){
   expect(NPC_ANSWERS[npc]?.length,npc).toBe(list.length);
   for(const answers of NPC_ANSWERS[npc])expect(answers.map(a=>a.tone).sort()).toEqual(['bad','good','neutral']);}
  const day1=answersFor('rosa',0,1)!,day2=answersFor('rosa',0,2)!;expect(day1[0].tone).not.toBe(day2[0].tone);
 });
 it('níveis de amizade',()=>{
  expect(friendshipLabel(0)).toBe('Conhecendo melhor');expect(friendshipLabel(3)).toBe('À vontade');expect(friendshipLabel(8)).toBe('Amizade');
  expect(friendshipLabel(15)).toBe('Grande amizade');expect(friendshipLabel(30)).toBe('Melhores amigos');expect(friendshipLabel(-5)).toBe('Um pouco distantes');
 });
});

describe('presentes',()=>{
 it('dá um presente por dia, gasta o item, muda a amizade e anota a reação',()=>{
  const {root,runtime}=setup();root.s.inventory.rareHerb=3;root.s.inventory.scrap=2;
  expect(giftTaste('amelia','rareHerb')).toBe('loved');
  const r=giveGift(runtime,'amelia','rareHerb');expect(r.ok).toBe(true);expect(r.reply).toBeTruthy();
  expect(root.s.inventory.rareHerb).toBe(2);expect(root.s.npcSocial!.players.amelia!.affinity).toBe(4);
  expect(giveGift(runtime,'amelia','scrap').ok).toBe(false);
  expect(giftChoices(root.s,'amelia').find(c=>c.item==='rareHerb')?.known).toBe('loved');
  expect(giftChoices(root.s,'amelia').find(c=>c.item==='scrap')?.known).toBeUndefined();
  root.s.day++;expect(giveGift(runtime,'amelia','scrap').ok).toBe(true);expect(root.s.npcSocial!.players.amelia!.affinity).toBe(2);
  expect(validateSave(root.s)).toBe(true);
 });
 it('não dá ferramenta nem o que não tem',()=>{
  const {root,runtime}=setup();expect(giveGift(runtime,'rosa','hoe').ok).toBe(false);expect(giveGift(runtime,'rosa','pumpkin').ok).toBe(false);
  expect(root.s.npcSocial?.players.rosa?.giftDay).toBeUndefined();
 });
 it('se não salvar, nada muda',()=>{
  const root={s:createNewSave(createCharacterProfile('Amiga'))};root.s.inventory.honey=1;
  const runtime=createSocialRuntime(()=>root.s,()=>false,()=>root.s);
  expect(giveGift(runtime,'augusto','honey').ok).toBe(false);expect(root.s.inventory.honey).toBe(1);expect(root.s.npcSocial?.players.augusto).toBeUndefined();
 });
});

describe('presentes de amizade',()=>{
 it('o morador dá o presente do nível ao chegar em 8, uma vez só',()=>{
  const {root,runtime}=setup();root.s.inventory.ironIngot=0;root.s.inventory.goldIngot=2;
  root.s.npcSocial={version:1,players:{bento:{affinity:5}},pairs:{},memories:{}};
  const r=giveGift(runtime,'bento','goldIngot');expect(r.ok).toBe(true);
  expect(root.s.npcSocial!.players.bento!.rewards).toBe(1);expect(root.s.inventory.ironIngot).toBe(3);expect(r.rewards?.[0]).toContain('Lingote');
  expect(claimFriendshipRewards(root.s,'bento').lines).toEqual([]);expect(validateSave(root.s)).toBe(true);
 });
});

describe('respostas nas conversas',()=>{
 it('resposta boa sobe, ruim desce; uma por dia',()=>{
  const {root,runtime}=setup();
  const good=answerConversation(runtime,'tobias',0,'good');expect(good.ok).toBe(true);expect(good.reply).toBeTruthy();
  expect(root.s.npcSocial!.players.tobias!.affinity).toBe(2);
  expect(answerConversation(runtime,'tobias',1,'bad').ok).toBe(false);
  root.s.day++;answerConversation(runtime,'tobias',1,'bad');expect(root.s.npcSocial!.players.tobias!.affinity).toBe(0);
 });
});

describe('save',()=>{
 it('rejeita amizade com campos inválidos',()=>{
  const s=createNewSave(createCharacterProfile('Amiga'));
  s.npcSocial={version:1,players:{rosa:{affinity:3,rewards:5}},pairs:{},memories:{}};expect(validateSave(s)).toBe(false);
  s.npcSocial={version:1,players:{rosa:{affinity:3,known:['naoExiste']}},pairs:{},memories:{}};expect(validateSave(s)).toBe(false);
  s.npcSocial={version:1,players:{rosa:{affinity:3,known:['pumpkin'],rewards:0,giftDay:1}},pairs:{},memories:{}};expect(validateSave(s)).toBe(true);
 });
});
