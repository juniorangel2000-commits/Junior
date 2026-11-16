import {describe,it,expect} from 'vitest';
import {Farming,cropQuality,fertilizeCrop} from '../src/systems/farming';
import {Inventory} from '../src/systems/inventory';
import {cropDefinition} from '../src/data/crops';
import {createNewSave,validateSave} from '../src/systems/save';
import {createCharacterProfile} from '../src/data/characters';
/** Canteiro da fazenda inicial (21–29 × 20–24), plantado no dia 1. */
function grow(water:(day:number)=>boolean,fertilizeOn?:number){
 const f=new Farming([],[{x:22,y:21}]),inv=new Inventory({seeds:1});expect(f.plant(22,21,inv,1,'turnip').ok).toBe(true);
 const crop=f.cropAt(22,21)!,days=cropDefinition('turnip').days;
 for(let d=1;d<=days+3&&crop.growth<1;d++){if(fertilizeOn===d)fertilizeCrop(crop,d);else if(water(d))f.water(22,21);f.update(0,d+1);}
 return {f,crop};
}
describe('qualidade da colheita',()=>{
 it('regada todo dia: bom; adubada sem falhar a rega: excelente; esquecida e sem adubo: comum',()=>{
  expect(cropQuality(grow(()=>true).crop)).toBe(1);
  expect(cropQuality(grow(()=>true,1).crop)).toBe(2);
  const skipped=grow(d=>d!==2).crop;expect(skipped.care!.missed).toBeGreaterThan(0);expect(cropQuality(skipped)).toBe(0);
  expect(cropQuality(grow(d=>d!==2,1).crop)).toBe(1);
 });
 it('a colheita informa a qualidade; planta de save antigo (sem registro) é comum',()=>{
  const {f}=grow(()=>true,1),inv=new Inventory();const r=f.harvest(22,21,inv);
  expect(r.ok).toBe(true);expect(r.harvested).toEqual({item:'turnip',amount:cropDefinition('turnip').yield,quality:2});expect(r.message).toContain('excelente');
  expect(cropQuality({x:1,y:1,growth:1,watered:false,crop:'turnip',days:3,day:1})).toBe(0);
 });
 it('o save aceita o registro de cuidado e recusa valores estranhos',()=>{
  const s=createNewSave(createCharacterProfile('Horta'));s.crops=[{x:22,y:21,growth:0,watered:false,crop:'turnip',days:0,day:1,care:{missed:0,fertilized:true}}];expect(validateSave(s)).toBe(true);
  (s.crops[0] as any).care={missed:-1};expect(validateSave(s)).toBe(false);
  (s.crops[0] as any).care={missed:0,extra:1};expect(validateSave(s)).toBe(false);
 });
});
