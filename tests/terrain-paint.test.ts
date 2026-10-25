import {describe,it,expect} from 'vitest';
import {terrainPaintAlpha,paintedWaterPoint} from '../src/data/terrain-paint';
import {lakeDistance} from '../src/data/water-contours';
import type {TerrainKind} from '../src/systems/map-editor';

describe('pisos e margens naturais',()=>{
 it('preserva o centro pintado e suaviza as pontas sem criar linhas entre tiles iguais',()=>{
  const terrain:Record<string,TerrainKind>={'4,4':'grass','5,4':'grass'};
  expect(terrainPaintAlpha(terrain,4*32+16,4*32+16)).toBe(1);
  expect(terrainPaintAlpha(terrain,5*32,4*32+16)).toBe(1);
  expect(terrainPaintAlpha(terrain,4*32+.5,4*32+.5)).toBeLessThan(.1);
  expect(terrainPaintAlpha(terrain,4*32+4,4*32+16)).toBeLessThan(.7);
 });
 it('a água sob a borda suavizada usa a mesma máscara visual do piso',()=>{
  const terrain:Record<string,TerrainKind>={'4,4':'grass'};
  expect(paintedWaterPoint(terrain,144,144,()=>true)).toBe(false);
  expect(paintedWaterPoint(terrain,128.5,128.5,()=>true)).toBe(true);
  expect(paintedWaterPoint(terrain,128.5,128.5,()=>false)).toBe(false);
 });
 it('mantém pisos estruturais e água pintada integralmente cobertos',()=>{
  for(const kind of ['water','wood','paving'] as const)expect(terrainPaintAlpha({'4,4':kind},128.5,128.5)).toBe(1);
 });
 it('lagos têm um centro contínuo, baias distintas e uma única margem em cada direção',()=>{
  for(const seed of [1.8,4.1,2.7]){
   expect(lakeDistance(0,0,0,0,180,120,seed)).toBe(-120);
   for(let angle=0;angle<Math.PI*2;angle+=.2){
    let crossings=0,last=true;
    for(let r=0;r<1.5;r+=.02){const wet=lakeDistance(Math.cos(angle)*180*r,Math.sin(angle)*120*r,0,0,180,120,seed)<0;if(wet!==last)crossings++;last=wet;}
    expect(crossings).toBe(1);
   }
  }
 });
});
