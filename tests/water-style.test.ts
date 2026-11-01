import {describe,it,expect} from 'vitest';
import {waterFinishChannel} from '../src/data/water-style';
import {animatedWaterRGB} from '../src/data/water-animation';
describe('approved forest water finish',()=>{
 it('preserves the approved darker depth and restrained pale shallows',()=>{
  expect([48,130,138].map((v,c)=>waterFinishChannel(v,c,-100))).toEqual([43.2,117,124.2]);
  const near=[48,130,138].map((v,c)=>waterFinishChannel(v,c,0));
  expect(near[0]).toBeCloseTo(64.94);expect(near[1]).toBeCloseTo(140.12);expect(near[2]).toBeCloseTo(142.84);
 });
 it('changes continuously with depth and keeps sampled colours within the palette range',()=>{
  for(let c=0;c<3;c++)for(let d=-150;d<0;d++){
   const a=waterFinishChannel(160,c,d),b=waterFinishChannel(160,c,d+.1);
   expect(a).toBeGreaterThanOrEqual(0);expect(a).toBeLessThanOrEqual(255);expect(Math.abs(a-b)).toBeLessThan(1);
  }
 });
 it('applies the same depth finish before animating the original material',()=>{
  const pixels=new Uint8ClampedArray(96*96*4);for(let i=0;i<pixels.length;i+=4)pixels.set([48,130,138,255],i);
  const result=animatedWaterRGB(0,0,0,{size:96,pixels});
  expect(result[0]).toBeGreaterThanOrEqual(43);expect(result[0]).toBeLessThan(65);
  expect(animatedWaterRGB(64,0,0,{size:96,pixels})).toEqual(result);
 });
});
