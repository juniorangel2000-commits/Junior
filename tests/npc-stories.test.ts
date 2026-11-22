import {describe,it,expect} from 'vitest';
import {createNewSave,validateSave} from '../src/systems/save';
import {createCharacterProfile} from '../src/data/characters';
import {ITEMS} from '../src/data/items';
import {DISH_IDS} from '../src/data/kitchen';
import {NPC_STORIES} from '../src/data/npc-stories';
import {createSocialRuntime} from '../src/systems/npc-social';
import {storyStatus,completeStoryPart} from '../src/systems/npc-stories';
import type {SaveData} from '../src/types';

const setup=(affinity=0)=>{const root={s:createNewSave(createCharacterProfile('Amiga'))};
 root.s.npcSocial={version:1,players:{helena:{affinity},tobias:{affinity}},pairs:{},memories:{}};
 return{root,runtime:createSocialRuntime(()=>root.s,()=>true,()=>root.s)};};

describe('histórias dos moradores',()=>{
 it('os itens pedidos, as recompensas e as receitas existem',()=>{
  for(const [npc,story] of Object.entries(NPC_STORIES)){expect(story!.parts.length).toBe(3);
   for(const p of story!.parts){
    for(const i of [...Object.keys(p.need),...Object.keys(p.reward.items??{})])expect(Object.hasOwn(ITEMS,i),`${npc}: ${i}`).toBe(true);
    if(p.reward.recipe)expect((DISH_IDS as readonly string[]).includes(p.reward.recipe)).toBe(true);}
   expect(story!.parts.map(p=>p.affinity)).toEqual([3,8,15]);}
 });
 it('fica fechada sem amizade e abre com amizade',()=>{
  const {root}=setup(0);expect(storyStatus(root.s,'tobias')!.unlocked).toBe(false);
  root.s.npcSocial!.players.tobias!.affinity=3;expect(storyStatus(root.s,'tobias')!.unlocked).toBe(true);
  // Todos os dez moradores têm história (Amélia e Nilo desde a preview.47).
  for(const id of ['amelia','nilo','helena','icaro'] as const)expect(storyStatus(root.s,id),id).toBeDefined();
 });
 it('entregar gasta os itens, dá a recompensa e avança a parte',()=>{
  const {root,runtime}=setup(3);root.s.inventory.milk=3;root.s.inventory.egg=5;const coins=root.s.villageEconomy?.coins??0;
  expect(storyStatus(root.s,'helena')!.ready).toBe(true);
  const r=completeStoryPart(runtime,'helena');expect(r.ok).toBe(true);expect(r.lines?.length).toBeGreaterThan(0);
  expect(root.s.inventory.milk).toBe(0);expect(root.s.inventory.egg).toBe(1);
  expect(root.s.villageProgress!.recipes).toContain('dulceDeLeche');expect(root.s.villageEconomy!.coins).toBe(coins+80);
  expect(root.s.npcStories).toEqual({helena:1});expect(root.s.npcSocial!.players.helena!.affinity).toBe(6);
  // A parte 2 pede amizade 8.
  expect(storyStatus(root.s,'helena')!.unlocked).toBe(false);expect(completeStoryPart(runtime,'helena').ok).toBe(false);
  expect(validateSave(root.s)).toBe(true);
 });
 it('sem os itens não entrega; o save recusa história inválida',()=>{
  const {root,runtime}=setup(3);expect(completeStoryPart(runtime,'tobias').ok).toBe(false);expect(root.s.npcStories).toBeUndefined();
  const s:SaveData=createNewSave(createCharacterProfile('X'));s.npcStories={tobias:4};expect(validateSave(s)).toBe(false);
  s.npcStories={amelia:4} as never;expect(validateSave(s)).toBe(false);s.npcStories={tobias:3};expect(validateSave(s)).toBe(true);
 });
});
