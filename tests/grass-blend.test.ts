import {describe,it,expect} from 'vitest';
import {grassBlendAt} from '../src/data/grass-blend';
import {paintedWaterPoint} from '../src/data/terrain-paint';
import type {TerrainKind} from '../src/systems/map-editor';
describe('bordas entre pisos de grama',()=>{
 const terrain:Record<string,TerrainKind>={'4,4':'meadow','5,4':'forest','4,5':'grass','5,5':'moss'};
 it('mantém o material escolhido no centro dos tiles',()=>{
  expect(grassBlendAt(terrain,144,144)).toMatchObject({meadow:1,forest:0,grass:0,moss:0,base:0});
  expect(grassBlendAt(terrain,176,176)).toMatchObject({moss:1,base:0});
 });
 it('mistura os materiais de forma contínua nas emendas e nos cantos',()=>{
  for(const [x,y] of [[160,144],[144,160],[160,160]]){
   const a=grassBlendAt(terrain,x-.001,y-.001)!,b=grassBlendAt(terrain,x+.001,y+.001)!;
   for(const kind of ['meadow','forest','grass','moss','base'] as const)expect(Math.abs(a[kind]-b[kind])).toBeLessThan(.001);
   expect(Object.values(a).reduce((a,b)=>a+b,0)).toBeCloseTo(1);
  }
 });
 it('faz a borda invadir um pouco o piso natural, com curvas determinísticas',()=>{
  const patch:Record<string,TerrainKind>={'4,4':'meadow','4,5':'meadow'};
  const outside=grassBlendAt(patch,126,144)!;expect(outside.meadow).toBeGreaterThan(0);expect(outside.base).toBeGreaterThan(0);
  expect(grassBlendAt(patch,110,144)).toBeUndefined();expect(grassBlendAt(patch,126,144)).toEqual(outside);
 });
 it('não altera o piso construído nem as regras de colisão da água',()=>{
  for(const kind of ['wood','paving','water','soil','sand'] as const){
   expect(grassBlendAt({...terrain,'5,4':kind},176,144)).toBeUndefined();
  }
  expect(paintedWaterPoint({'4,4':'grass'},144,144,()=>true)).toBe(false);
  expect(paintedWaterPoint({'4,4':'grass'},128.5,128.5,()=>true)).toBe(true);
 });
});
