import {describe,it,expect} from 'vitest';
import {createNewSave,validateSave,migrateSave} from '../src/systems/save';
import {createCharacterProfile} from '../src/data/characters';
import {enterMineHall,returnToMineHall,upgradeMineAccess} from '../src/systems/mining-access';
import {beginMineExpedition} from '../src/systems/underground-renewal';
import {ensureUnderground,undergroundArrival} from '../src/systems/underground';
import {ensureMineHazards} from '../src/systems/underground-hazards';
import {MINING_ENTRY,MINE_HALL_RETURN} from '../src/data/mining-entry';
const fresh=()=>{const s=createNewSave(createCharacterProfile('Acesso da mina'));s.activeArea='highland';return s;};
describe('separate mine reception and mining scene',()=>{
 it('entering Mina Antiga does not start an expedition or populate dangers; explicit menu entry starts it',()=>{
  const s=fresh(),inventory=structuredClone(s.inventory);expect(enterMineHall(s,validateSave)).toBe(true);expect(s.mineInterior).toEqual(undergroundArrival());expect(s.miningInterior).toBeUndefined();expect(s.underground!.expedition).toBeUndefined();expect(s.underground!.hazards).toBeUndefined();expect(s.inventory).toEqual(inventory);
  expect(beginMineExpedition(s,validateSave).ok).toBe(true);expect(s.miningInterior).toBe(true);expect(s.mineInterior).toEqual(MINING_ENTRY);expect(s.underground!.expedition).toMatchObject({id:1,inside:true});expect(validateSave(s)).toBe(true);expect(beginMineExpedition(s,validateSave).ok).toBe(false);
 });
 it('returns through the same doorway, preserving world, health, enemies and inventory',()=>{
  const s=fresh();enterMineHall(s,validateSave);beginMineExpedition(s,validateSave);const h=ensureMineHazards(s.underground!);h.hp=63;h.zombies[0].hp=0;const before=structuredClone(s);
  expect(returnToMineHall(s,validateSave)).toBe(true);expect(s.mineInterior).toEqual(MINE_HALL_RETURN);expect(s.miningInterior).toBeUndefined();expect(s.underground!.expedition?.inside).toBe(false);expect(s.underground!.hazards).toEqual(before.underground!.hazards);expect(s.underground!.changes).toEqual(before.underground!.changes);expect(s.inventory).toEqual(before.inventory);
  expect(beginMineExpedition(s,validateSave).ok).toBe(true);expect(s.underground!.hazards!.hp).toBe(63);expect(s.underground!.hazards!.zombies[0].hp).toBe(0);
 });
 it('never changes the scene location or advances the visit if an entry/return save fails',()=>{
  const s=fresh(),before=structuredClone(s);expect(enterMineHall(s,()=>false)).toBe(false);expect(s).toEqual(before);enterMineHall(s,validateSave);const hall=structuredClone(s);expect(beginMineExpedition(s,()=>false).ok).toBe(false);expect(s).toEqual(hall);beginMineExpedition(s,validateSave);const inside=structuredClone(s);expect(returnToMineHall(s,()=>{throw Error('disk');})).toBe(false);expect(s).toEqual(inside);
 });
 it('continues a saved gallery in the separate mining scene and a saved hall in Mina Antiga',()=>{
  const s=fresh();enterMineHall(s,validateSave);beginMineExpedition(s,validateSave);const gallery=migrateSave(JSON.parse(JSON.stringify(s)))!;expect(gallery.miningInterior).toBe(true);expect(gallery.mineInterior).toEqual(MINING_ENTRY);returnToMineHall(s,validateSave);const hall=migrateSave(JSON.parse(JSON.stringify(s)))!;expect(hall.miningInterior).toBeUndefined();expect(hall.mineInterior).toEqual(MINE_HALL_RETURN);
 });
 it('migrates the previous continuous-map location without mutating the original save',()=>{
  const s=fresh();ensureUnderground(s);s.mineInterior={x:79*32+16,y:165*32+16,direction:'up'};s.underground!.expedition={id:3,inside:true,enteredDay:1};ensureMineHazards(s.underground!).hp=72;const before=structuredClone(s),loaded=migrateSave(s)!;
  expect(loaded).not.toBeNull();upgradeMineAccess(loaded);expect(loaded.miningInterior).toBe(true);expect(loaded.mineInterior).toEqual(s.mineInterior);expect(loaded.underground!.hazards!.hp).toBe(72);expect(loaded.underground!.changes).toEqual(s.underground!.changes);expect(s).toEqual(before);expect(validateSave(loaded)).toBe(true);
  s.mineInterior=undergroundArrival();const hall=migrateSave(s)!;upgradeMineAccess(hall);expect(hall.miningInterior).toBeUndefined();expect(hall.underground!.expedition?.inside).toBe(false);expect(validateSave(hall)).toBe(true);
 });
 it('rejects inconsistent or malformed scene markers',()=>{
  const s=fresh();(s as unknown as {miningInterior:unknown}).miningInterior='yes';expect(validateSave(s)).toBe(false);s.miningInterior=true;expect(validateSave(s)).toBe(false);
 });
});
