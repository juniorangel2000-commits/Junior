import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
const views=['south','west','east','north','south-west','south-east','north-west','north-east'];
const size=(path:string)=>{const png=readFileSync(resolve('public/assets/visual/village/bento/Idle',path));expect(png.subarray(1,4).toString()).toBe('PNG');return{width:png.readUInt32BE(16),height:png.readUInt32BE(20)};};
describe('approved Bento movement sprites',()=>{
 it.each(views)('has a complete idle and six authored walking frames facing %s',view=>{
  const idle=size('rotations/'+view+'.png');expect(idle.height).toBe(256);expect(idle.width).toBeGreaterThanOrEqual(192);expect(idle.width).toBeLessThanOrEqual(256);
  for(let frame=0;frame<6;frame++)expect(size(`animations/Walking/${view}/frame_${String(frame).padStart(3,'0')}.png`)).toEqual({width:256,height:256});
 });
});
