import {describe,it,expect} from 'vitest';
import {Farming,careLevel,fertilizeCrop,rollCropQuality,CROP_QUALITY_CHANCES} from '../src/systems/farming';
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
 it('nível de cuidado: rega diária e adubo valem um ponto cada; planta antiga é nível 0',()=>{
  expect(careLevel(grow(()=>true).crop)).toBe(1);expect(careLevel(grow(()=>true,1).crop)).toBe(2);
  const skipped=grow(d=>d!==2).crop;expect(skipped.care!.missed).toBeGreaterThan(0);expect(careLevel(skipped)).toBe(0);
  expect(careLevel(grow(d=>d!==2,1).crop)).toBe(1);
  expect(careLevel({x:1,y:1,growth:1,watered:false,crop:'turnip',days:3,day:1})).toBe(0);
 });
 it('a qualidade é sorteada: o cuidado aumenta as chances, mas não garante excelente',()=>{
  for(const level of [0,1,2] as const){
   const care=level===0?{missed:3}:level===1?{missed:0}:{missed:0,fertilized:true as const},counts=[0,0,0];
   for(let x=1;x<=40;x++)for(let y=1;y<=50;y++)counts[rollCropQuality({x,y,growth:1,watered:false,crop:'turnip',days:4,day:7,care},1)[0]]++;
   CROP_QUALITY_CHANCES[level].forEach((p,q)=>expect(Math.abs(counts[q]/2000-p)).toBeLessThan(.04));
  }
  const c={x:5,y:5,growth:1,watered:false,crop:'turnip' as const,days:4,day:9,care:{missed:0}};expect(rollCropQuality(c,3)).toEqual(rollCropQuality(c,3));
 });
 it('a colheita informa a qualidade de cada unidade',()=>{
  const {f}=grow(()=>true,1),inv=new Inventory();const r=f.harvest(22,21,inv);
  expect(r.ok).toBe(true);expect(r.harvested!.item).toBe('turnip');expect(r.harvested!.qualities).toHaveLength(cropDefinition('turnip').yield);
 });
 it('o save aceita o registro de cuidado e recusa valores estranhos',()=>{
  const s=createNewSave(createCharacterProfile('Horta'));s.crops=[{x:22,y:21,growth:0,watered:false,crop:'turnip',days:0,day:1,care:{missed:0,fertilized:true}}];expect(validateSave(s)).toBe(true);
  (s.crops[0] as any).care={missed:-1};expect(validateSave(s)).toBe(false);
  (s.crops[0] as any).care={missed:0,extra:1};expect(validateSave(s)).toBe(false);
 });
});
