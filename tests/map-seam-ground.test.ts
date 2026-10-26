import {describe,it,expect} from 'vitest';
import {seamGroundColor,seamGroundWeight} from '../src/map-seam-ground';
import {TILE,WORLD_WIDTH} from '../src/data/world-size';
import type {TerrainSprites} from '../src/terrain-sprites';

describe('continuidade do piso entre a floresta e a propriedade',()=>{
 it('usa os mesmos pixels e cores em coordenadas equivalentes dos dois cenários',()=>{
  for(const y of [0,420,1200,1680,2303])for(const x of [-80,-1,0,1,80]){
   expect(seamGroundColor(undefined,'forest',WORLD_WIDTH*TILE+x,y)).toEqual(seamGroundColor(undefined,'property',x,y));
  }
 });
 it('mantém a junção opaca e dissolve a faixa nas duas direções sem degrau',()=>{
  for(const area of ['forest','property'] as const)for(const y of [0,640,1680,2303]){
   const x=(distance:number)=>area==='forest'?WORLD_WIDTH*TILE-distance:distance;
   expect(seamGroundWeight(area,x(0),y)).toBe(1);
   expect(seamGroundWeight(area,x(32),y)).toBe(1);
   expect(seamGroundWeight(area,x(256),y)).toBe(0);
   let previous=1;
   for(let d=0;d<=256;d++){const w=seamGroundWeight(area,x(d),y);expect(w).toBeLessThanOrEqual(previous);expect(Math.abs(w-previous)).toBeLessThan(.015);previous=w;}
  }
 });
 it('espelha a amostragem nos dois lados do limite de textura, preservando os desenhos da grama',()=>{
  const pixels=new Uint8ClampedArray(4*4*4);
  for(let y=0;y<4;y++)for(let x=0;x<4;x++){const at=(y*4+x)*4;pixels[at]=x*50;pixels[at+1]=y*50;pixels[at+2]=40;pixels[at+3]=255;}
  const sprite={size:4,pixels};const sprites={forest:sprite,grass:sprite,meadow:sprite,moss:sprite} as TerrainSprites;
  for(let y=0;y<16;y++){
   const left=seamGroundColor(sprites,'forest',WORLD_WIDTH*TILE-1,y),right=seamGroundColor(sprites,'property',0,y);
   for(let channel=0;channel<3;channel++)expect(left[channel]).toBeCloseTo(right[channel],8);
  }
 });
});
