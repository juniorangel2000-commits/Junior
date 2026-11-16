import {describe,it,expect} from 'vitest';
import {createNewSave,validateSave,migrateSave} from '../src/systems/save';
import {createCharacterProfile} from '../src/data/characters';
import {Building,buildingFootprint} from '../src/systems/building';
import {Inventory} from '../src/systems/inventory';
import type {SaveData} from '../src/types';
/** Bancadas de 2 blocos (preview.39). Uma área livre longe da fazenda inicial. */
const X=60,Y=40;
const save=(buildings:SaveData['buildings'])=>{const s:any=createNewSave(createCharacterProfile('Bancada'));s.buildings=buildings;return s;};
describe('bancadas de 2 blocos',()=>{
 it('bancada de trabalho e de construção novas ocupam 2 blocos; a estreita, 1',()=>{
  expect(buildingFootprint({kind:'workbench',x:X,y:Y})).toEqual([{x:X,y:Y},{x:X+1,y:Y}]);
  expect(buildingFootprint({kind:'constructionBench',x:X,y:Y})).toHaveLength(2);
  expect(buildingFootprint({kind:'workbench',x:X,y:Y,narrow:true})).toEqual([{x:X,y:Y}]);
  const b=new Building(),inv=new Inventory({board:8,stone:6,peg:4,hammer:1});
  expect(b.place('constructionBench',X,Y,inv,true).ok).toBe(true);expect(b.at(X+1,Y)?.kind).toBe('constructionBench');
 });
 it('bancada antiga cresce para 2 blocos quando o bloco ao lado está livre',()=>{
  const m=migrateSave(save([{kind:'workbench',x:X,y:Y}]))!;expect(m.buildings[0].narrow).toBeUndefined();expect(validateSave(m)).toBe(true);
 });
 it('bancada antiga com algo encostado à direita fica estreita e a partida continua válida',()=>{
  const m=migrateSave(save([{kind:'workbench',x:X,y:Y},{kind:'wall',x:X+1,y:Y}]))!;expect(m.buildings[0].narrow).toBe(true);expect(validateSave(m)).toBe(true);
  expect(migrateSave(structuredClone(m))!.buildings[0].narrow).toBe(true);
 });
 it('duas bancadas antigas lado a lado: a da esquerda não cresce para cima da outra',()=>{
  const m=migrateSave(save([{kind:'workbench',x:X,y:Y},{kind:'workbench',x:X+1,y:Y}]))!;
  expect(m.buildings[0].narrow).toBe(true);expect(m.buildings[1].narrow).toBeUndefined();expect(validateSave(m)).toBe(true);
 });
 it('o save só aceita estreita na bancada de trabalho',()=>{
  const s=save([{kind:'constructionBench',x:X,y:Y,narrow:true}]);expect(validateSave(s)).toBe(false);
 });
});
