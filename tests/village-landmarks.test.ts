import {describe,it,expect} from 'vitest';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import manifest from '../public/assets/visual/village/landmarks/manifest.json';
import {VILLAGE_LANDMARKS,villageLandmarkBlockedPoint,villageLandmarkClearing} from '../src/data/village-landmarks';
import {VILLAGE_ENTRY,VILLAGE_BUILDINGS,VILLAGE_PROPS,VILLAGE_TREES,villageBlockedAt,villagePointBlocked,villageWater} from '../src/data/village';
import {villageRoute} from '../src/systems/village-walk';

describe('public square and decorative village districts',()=>{
 it('preserves the source atlas and keeps all eight crops inside it',()=>{
  const bytes=readFileSync('public/'+manifest.file);
  expect(createHash('sha256').update(bytes).digest('hex')).toBe(manifest.sha256);
  const width=bytes.readUInt32BE(16),height=bytes.readUInt32BE(20);
  expect(Object.keys(manifest.frames)).toHaveLength(8);
  for(const r of Object.values(manifest.frames)){
   expect(r.x).toBeGreaterThanOrEqual(0);expect(r.y).toBeGreaterThanOrEqual(0);
   expect(r.x+r.width).toBeLessThanOrEqual(width);expect(r.y+r.height).toBeLessThanOrEqual(height);
  }
 });
 it('moves the well to the windmill and makes the fountain solid without making it swimmable',()=>{
  expect(VILLAGE_PROPS.find(p=>p.kind==='well')).toMatchObject({x:16,y:19});
  expect(villageWater(46,37)).toBe(false);
  const p=VILLAGE_LANDMARKS.find(p=>p.kind==='fountain')!;
  const x=(p.x+.5)*32,y=p.y*32+4;
  expect(villageLandmarkBlockedPoint(x,y)).toBe(true);expect(villagePointBlocked(x,y)).toBe(true);
  // The pedestal and overhanging sails never create a rectangular invisible wall.
  expect(villageLandmarkBlockedPoint(x-55,y-28)).toBe(false);
  expect(villageLandmarkBlockedPoint(12.5*32,10*32)).toBe(false);
 });
 it('keeps every shop approach and public building frontage reachable from the property',()=>{
  for(const b of VILLAGE_BUILDINGS)for(let y=b.y+1;y<=b.y+4;y++)for(let x=b.x-1;x<=b.x+1;x++){
   expect(villageBlockedAt(x,y),b.id+': '+x+','+y).toBe(false);
  }
  for(const p of VILLAGE_LANDMARKS.filter(p=>!['wheat','cart','fountain'].includes(p.kind))){
   const goal={x:p.x,y:p.y+2};
   expect(villageBlockedAt(goal.x,goal.y),p.id).toBe(false);
   expect(villageRoute(VILLAGE_ENTRY,goal,villageBlockedAt),p.id).not.toHaveLength(0);
  }
  for(const x of [43,49])expect(villageRoute({x,y:34},{x,y:41},villageBlockedAt)).not.toHaveLength(0);
 });
 it('clears native trees from the full building silhouettes and shares ground collision with navigation',()=>{
  for(const t of VILLAGE_TREES)expect(villageLandmarkClearing(t.x,t.y,90)).toBe(false);
  for(const p of VILLAGE_LANDMARKS){
   const [l,t,w,h]=p.footprint,x=(p.x+.5)*32+l+w/2,y=p.y*32+25+t+h/2;
   expect(villageLandmarkBlockedPoint(x,y),p.id).toBe(true);
   expect(villagePointBlocked(x,y),p.id).toBe(true);
  }
 });
});
