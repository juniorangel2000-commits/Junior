import {describe,it,expect} from 'vitest';
import {lakeSurfaceMotion,lakeCascadeMotion,lakeImpactMotion,LAKE_CASCADE} from '../src/data/lake-water-motion';
import {lakeWater,lakePier,lakeBridge} from '../src/data/fishing-lake';
import {defaultMap} from '../src/data/default-maps';
describe('lake water overlays',()=>{
 it('moves transparent surface highlights while avoiding banks and deck floors',()=>{
  const a=lakeSurfaceMotion(0),b=lakeSurfaceMotion(500);expect(a.length).toBeGreaterThan(30);expect(b).not.toEqual(a);
  for(const p of b){expect(lakeWater(p.x/32,p.y/32)).toBe(true);expect(lakePier(p.x/32,p.y/32)||lakeBridge(p.x/32,p.y/32)).toBe(false);expect(p.alpha).toBeLessThan(.18);}
  const map=defaultMap('fishingLake');for(const p of b)map.terrain[`${Math.floor(p.x/32)},${Math.floor(p.y/32)}`]='wood';expect(lakeSurfaceMotion(500,map)).toEqual([]);
 });
 it('keeps falling streaks inside the original cascade and produces bounded landing spray',()=>{
  const a=lakeCascadeMotion(0),b=lakeCascadeMotion(150);expect(a).not.toEqual(b);
  for(const p of b){expect(p.y).toBeGreaterThanOrEqual(LAKE_CASCADE.top);expect(p.y).toBeLessThanOrEqual(LAKE_CASCADE.bottom);expect(Math.abs(p.x-LAKE_CASCADE.x)).toBeLessThan(27);}
  for(const p of lakeImpactMotion(1000)){expect(Math.abs(p.x-LAKE_CASCADE.x)).toBeLessThan(73);expect(Math.abs(p.y-LAKE_CASCADE.bottom)).toBeLessThan(40);}
 });
});
