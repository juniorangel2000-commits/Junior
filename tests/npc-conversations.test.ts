import {describe,it,expect} from 'vitest';
import {NPC_CONVERSATIONS,pickConversation} from '../src/data/npc-conversations';
import {VILLAGE_NPCS} from '../src/data/village';
describe('conversas dos moradores',()=>{
 it('todo morador da vila tem pelo menos 5 conversas, cada uma com falas',()=>{
  for(const npc of VILLAGE_NPCS){const list=NPC_CONVERSATIONS[npc.id];expect(list,npc.id).toBeDefined();expect(list.length).toBeGreaterThanOrEqual(5);
   for(const c of list){expect(c.length).toBeGreaterThan(0);for(const l of c)expect(l.trim().length).toBeGreaterThan(10);}}
 });
 it('não repete a conversa anterior',()=>{
  for(let last=0;last<6;last++)for(const r of [0,.2,.5,.99])expect(pickConversation('rosa',last,()=>r)!.index).not.toBe(last);
 });
});

import {MERCHANTS} from '../src/data/village-commerce';
describe('corda vegetal',()=>{
 it('nenhum morador vende corda vegetal (ela se faz à mão)',()=>{for(const m of Object.values(MERCHANTS))expect(m.buy.cord,m.id).toBeUndefined();});
});
