import {describe,it,expect} from 'vitest';
import {freeArrival,actorsOverlap} from '../src/systems/actor-arrival';
import {HOME_OUTDOOR_SPAWN} from '../src/systems/home';
describe('shared home exit',()=>{
 it('keeps an NPC on the doorway anchor and places the arriving player on free ground',()=>{
  const npc={...HOME_OUTDOOR_SPAWN},before={...npc};
  const blocked=(x:number,y:number)=>x<npc.x-40||x>npc.x+40||y<npc.y-8||y>npc.y+80;
  const player=freeArrival(HOME_OUTDOOR_SPAWN,blocked,[npc]);
  expect(player).not.toBeNull();expect(actorsOverlap(player!,npc)).toBe(false);expect(npc).toEqual(before);
  for(const[dx,dy]of[[-7,-5],[7,-5],[-7,3],[7,3]])expect(blocked(player!.x+dx,player!.y+dy)).toBe(false);
  expect(actorsOverlap({...player!,y:player!.y+4},npc)).toBe(false);
 });
 it('keeps the normal arrival when the NPC is still inside the house',()=>{expect(freeArrival(HOME_OUTDOOR_SPAWN,()=>false,[])).toEqual(HOME_OUTDOOR_SPAWN);});
});
