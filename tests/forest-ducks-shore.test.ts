import {describe,it,expect} from 'vitest';
import {duckHabitatBlocked,DUCK_SHORE_REACH,createForestDuck} from '../src/systems/forest-ducks';
// Lago: tudo à esquerda de x=1000 é água.
const water=(x:number)=>x<1000;
const solid=()=>false;
describe('patos saem da água',()=>{
 it('passeiam pela margem até 3 blocos da água, não mais longe',()=>{
  expect(DUCK_SHORE_REACH).toBe(96);
  expect(duckHabitatBlocked(900,500,water,solid)).toBe(false);
  expect(duckHabitatBlocked(1060,500,water,solid)).toBe(false);
  expect(duckHabitatBlocked(1090,500,water,solid)).toBe(false);
  expect(duckHabitatBlocked(1200,500,water,solid)).toBe(true);
 });
 it('o cérebro do pato guarda as conferências de rota (lago fixo)',()=>{
  const d=createForestDuck('pato-teste',900,500,water,solid)!;expect(d.staticWorld).toBe(true);
 });
});
