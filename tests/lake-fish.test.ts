import {describe,it,expect} from 'vitest';
import {lakeFishShadows} from '../src/data/lake-fish';
import {lakeWaterDistance,lakePier,lakeBridge,lakeCliff} from '../src/data/fishing-lake';
import {defaultMap} from '../src/data/default-maps';
describe('fish shadows below the lake surface',()=>{
 it('moves small schools without putting fish on land, cliffs or decks',()=>{
  const first=lakeFishShadows(0);expect(first.length).toBeGreaterThan(5);expect(lakeFishShadows(18000)).not.toEqual(first);
  for(let t=0;t<=90000;t+=3000)for(const p of lakeFishShadows(t)){
   expect(lakeWaterDistance(p.x/32,p.y/32)).toBeLessThan(-1.4);
   expect(lakePier(p.x/32,p.y/32)||lakeBridge(p.x/32,p.y/32)||lakeCliff(p.x/32,p.y/32)).toBe(false);
   expect(p.alpha).toBeGreaterThan(.21);expect(p.alpha).toBeLessThan(.33);
  }
 });
 it('hides fish when their water has been reclaimed in the editor',()=>{
  const first=lakeFishShadows(0)[0],map=defaultMap('fishingLake');
  const x=Math.floor(first.x/32),y=Math.floor(first.y/32);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)map.terrain[`${x+dx},${y+dy}`]='grass';
  expect(lakeFishShadows(0,map).some(p=>p.id===first.id)).toBe(false);
 });
});
