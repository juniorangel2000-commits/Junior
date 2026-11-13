import {describe,it,expect} from 'vitest';
import {CROP_IDS,cropStage,cropTexture} from '../src/data/crops';
import {cropSpriteLayout} from '../src/crop-layout';
import layouts from '../src/data/crop-sprite-layout.json';

describe('plantas assentadas nos canteiros',()=>{
 it('usa a mesma marca de semeadura sem broto para todas as espécies',()=>{
  for(const crop of CROP_IDS){expect(cropStage(0)).toBe(0);expect(cropTexture({crop,growth:0})).toBe('crop-planted-seed');expect(cropSpriteLayout({crop,growth:0})).toEqual(cropSpriteLayout({crop:'turnip',growth:0}));}
 });
 it('separa semeadura, broto, jovem, desenvolvimento e madura sem antecipar a colheita',()=>{
  expect([0,.01,.34,.67,.99,1].map(cropStage)).toEqual([0,1,2,3,3,4]);
 });
 it('mantém todas as fases dentro das laterais da terra arada e com o apoio no centro',()=>{
  for(const crop of CROP_IDS)for(const growth of [0,.1,.4,.8,1]){
   const a=cropSpriteLayout({crop,growth}),b=layouts[a.texture as keyof typeof layouts],scale=a.width/b.width;
   const left=a.x+(b.left-a.originX*b.width)*scale,right=a.x+(b.right+1-a.originX*b.width)*scale;
   expect(left,crop).toBeGreaterThanOrEqual(2-1e-8);expect(right,crop).toBeLessThanOrEqual(30+1e-8);
   expect(a.x).toBe(16);expect(a.y).toBeGreaterThanOrEqual(16);expect(a.y).toBeLessThanOrEqual(21);
  }
 });
 it('centraliza a massa das rasteiras maduras e apoia os caules pela raiz',()=>{
  for(const crop of ['lettuce','cabbage','pumpkin','watermelon'] as const){const a=cropSpriteLayout({crop,growth:1}),b=layouts[a.texture as keyof typeof layouts],scale=a.height/b.height;expect(a.y+((b.top+b.bottom+1)/2-a.originY*b.height)*scale).toBeCloseTo(16);}
  for(const crop of ['corn','sunflower','cotton','tomato'] as const){const a=cropSpriteLayout({crop,growth:1}),b=layouts[a.texture as keyof typeof layouts];expect(a.originY*b.height).toBe(b.bottom-1);expect(a.y).toBe(21);}
 });
});
