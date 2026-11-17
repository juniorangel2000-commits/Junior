import {describe,it,expect} from 'vitest';
import {createNewSave,validateSave} from '../src/systems/save';
import {createCharacterProfile} from '../src/data/characters';
import {placeCampfire,pickUpCampfire,nearCampfire,campfireSpot,validCampfires,MAX_CAMPFIRES_PER_SPACE} from '../src/systems/placed-campfires';

const save=()=>{const s=createNewSave(createCharacterProfile('Fogo'));s.inventory.campfire=1;return s;};
const p={x:400,y:300,facing:{x:1,y:0}};
describe('fogueira montada no chão',()=>{
 it('monta na frente do personagem, fica no save e sai da mochila',()=>{
  const s=save();const r=placeCampfire(s,'forest',p);expect(r.ok).toBe(true);
  expect(s.campfires).toEqual([{space:'forest',...campfireSpot(p)}]);expect(s.inventory.campfire).toBe(0);expect(validateSave(s)).toBe(true);
  expect(nearCampfire(s,'forest',{x:420,y:300})).toBeTruthy();expect(nearCampfire(s,'property',{x:420,y:300})).toBeUndefined();
 });
 it('não monta em lugar fechado, em lugar ocupado nem colada em outra',()=>{
  const s=save();expect(placeCampfire(s,'shop:rosa',p).ok).toBe(false);expect(placeCampfire(s,'forest',p,()=>true).ok).toBe(false);
  s.inventory.campfire=2;expect(placeCampfire(s,'forest',p).ok).toBe(true);expect(placeCampfire(s,'forest',p).message).toContain('perto');
 });
 it(`no máximo ${MAX_CAMPFIRES_PER_SPACE} por lugar`,()=>{
  const s=save();s.inventory.campfire=9;
  for(let i=0;i<MAX_CAMPFIRES_PER_SPACE;i++)expect(placeCampfire(s,'village',{x:100+i*100,y:100}).ok).toBe(true);
  expect(placeCampfire(s,'village',{x:900,y:100}).ok).toBe(false);
 });
 it('recolher devolve à mochila; o save só aceita fogueiras válidas',()=>{
  const s=save();placeCampfire(s,'highland',p);const f=s.campfires![0];
  expect(pickUpCampfire(s,f).ok).toBe(true);expect(s.inventory.campfire).toBe(1);expect(s.campfires).toBeUndefined();expect(pickUpCampfire(s,f).ok).toBe(false);
  expect(validCampfires([{space:'forest',x:1,y:2}])).toBe(true);
  for(const bad of [[{space:'mina',x:1,y:2}],[{space:'forest',x:1.5,y:2}],[{space:'forest',x:1,y:2,z:0}],'x'])expect(validCampfires(bad)).toBe(false);
 });
});
