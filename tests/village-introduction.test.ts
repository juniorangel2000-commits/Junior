import {describe,it,expect} from 'vitest';
import {createNewSave,migrateSave,validateSave} from '../src/systems/save';
import {createCharacterProfile} from '../src/data/characters';
import {villageAccessUnlocked,receiveDamiaoIntroduction,invitationGate,invitationGateBlocked} from '../src/systems/village-introduction';
import {damiaoAtLake} from '../src/data/fisher-schedule';
import {fisherTrade,fisherService} from '../src/systems/fisher-transactions';
import {ITEM_IDS} from '../src/data/items';
const fresh=()=>{const s=createNewSave(createCharacterProfile('Primeiro encontro'));s.activeArea='fishingLake';s.fishingLakePosition={x:92.5*32,y:33.5*32};return s;};
describe('first rod and village introduction',()=>{
 it('starts new games without a rod and blocks both entrances while keeping Damião at the lake all day',()=>{
  const s=fresh();expect(s.inventory.fishingRod).toBe(0);expect(villageAccessUnlocked(s)).toBe(false);
  for(const area of ['property','cityForest'] as const){const g=invitationGate(area);expect(invitationGateBlocked(s,area,g.x,g.y)).toBe(true);expect(invitationGateBlocked(s,area,g.x-100,g.y-100)).toBe(false);}
  for(const time of[0,479,480,690,1200,1439])expect(damiaoAtLake({...s,time})).toBe(true);
  expect(validateSave({...s,damiaoIntroduction:'sim'})).toBe(false);
 });
 it('grants exactly one free rod and saves the invitation in the same transaction',()=>{
  const s=fresh(),coins=s.villageEconomy!.coins;let stored:typeof s|undefined;
  const result=receiveDamiaoIntroduction(s,draft=>{expect(validateSave(draft)).toBe(true);stored=structuredClone(draft);return true;});
  expect(result.ok).toBe(true);expect(s.inventory.fishingRod).toBe(1);expect(s.villageEconomy!.coins).toBe(coins);expect(s.damiaoIntroduction).toBe(true);expect(villageAccessUnlocked(migrateSave(stored)!)).toBe(true);
  for(const area of ['property','cityForest'] as const){const g=invitationGate(area);expect(invitationGateBlocked(s,area,g.x,g.y)).toBe(false);}
  expect(receiveDamiaoIntroduction(s,()=>true).ok).toBe(false);expect(s.inventory.fishingRod).toBe(1);
 });
 it('does not consume or grant anything if the backpack is full or saving fails',()=>{
  const s=fresh(),before=structuredClone(s);expect(receiveDamiaoIntroduction(s,()=>false).ok).toBe(false);expect(s).toEqual(before);
  for(const id of ITEM_IDS.slice(0,30))s.inventory[id]=1;s.inventory.fishingRod=0;const full=structuredClone(s);
  expect(receiveDamiaoIntroduction(s,()=>true).ok).toBe(false);expect(s).toEqual(full);expect(villageAccessUnlocked(s)).toBe(false);
 });
 it('cannot buy a first rod or use services before completing the dialogue',()=>{
  const s=fresh(),before=structuredClone(s);expect(fisherTrade(s,'fisher','buy','fishingRod',1,()=>true).ok).toBe(false);expect(fisherService(s,'fishing-lesson',()=>true).ok).toBe(false);expect(s).toEqual(before);
  s.activeArea='property';expect(receiveDamiaoIntroduction(s,()=>true).ok).toBe(false);
 });
 it('preserves access, equipment and money in legacy saves without the new marker',()=>{
  const old=fresh();delete old.damiaoIntroduction;old.inventory.fishingRod=1;old.villageEconomy!.coins=237;
  const loaded=migrateSave(old)!;expect(loaded).not.toBeNull();expect(villageAccessUnlocked(loaded)).toBe(true);expect(loaded.inventory.fishingRod).toBe(1);expect(loaded.villageEconomy!.coins).toBe(237);expect(receiveDamiaoIntroduction(loaded,()=>true).ok).toBe(false);
 });
 it('places the physical barrier at an edited city exit as well',()=>{
  const s=fresh(),exit={x:46,y:69},g=invitationGate('cityForest',exit);expect(invitationGateBlocked(s,'cityForest',g.x,g.y,exit)).toBe(true);
 });
});
