import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import manifest from '../public/assets/visual/village/plaza/manifest.json';
import {PLAZA_BEDS,PLAZA_SEATS,PLAZA_LAMPS,plazaFurnitureBlockedPoint} from '../src/data/village-plaza';
import {VILLAGE_ENTRY,villageBlockedAt,villagePointBlocked,VILLAGE_LAWNS} from '../src/data/village';
import {MERCHANT_DAILY_PLAN} from '../src/systems/merchant-routine';
import {villageRoute} from '../src/systems/village-walk';
import {villageGroundWeights} from '../src/data/village-ground';

describe('square stone plaza, directional seating and rounded shrub beds',()=>{
 it('keeps the original art intact and the six sprite crops separate',()=>{
  for(const source of [manifest,manifest.floor,manifest.path])expect(createHash('sha256').update(readFileSync('public/'+source.file)).digest('hex')).toBe(source.sha256);
  const png=readFileSync('public/'+manifest.file),width=png.readUInt32BE(16),height=png.readUInt32BE(20);
  for(const r of Object.values(manifest.frames)){
   expect(r.x+r.width).toBeLessThanOrEqual(width);expect(r.y+r.height).toBeLessThanOrEqual(height);
   expect(r.width).toBeGreaterThan(0);expect(r.height).toBeGreaterThan(0);
  }
  expect(new Set(PLAZA_SEATS.map(p=>p.frame))).toEqual(new Set(['north','south','east','west']));
 });
 it('shares the solid furniture footprints with navigation and leaves the ten lunch stops accessible',()=>{
  for(const p of [...PLAZA_SEATS,...PLAZA_BEDS]){
   const [l,t,w,h]=p.footprint,x=(p.x+.5)*32+l+w/2,y=p.y*32+25+t+h/2;
   expect(plazaFurnitureBlockedPoint(x,y),p.id).toBe(true);expect(villagePointBlocked(x,y),p.id).toBe(true);
  }
  for(const [id,p] of Object.entries(MERCHANT_DAILY_PLAN.plaza)){
   expect(villageBlockedAt(p.x,p.y),id).toBe(false);
   expect(villageRoute(VILLAGE_ENTRY,p,villageBlockedAt),id).not.toHaveLength(0);
  }
  for(const p of VILLAGE_LAWNS)expect(villageGroundWeights(p.x,p.y)[4]).toBeLessThan(.05);
  expect(new Set(PLAZA_LAMPS.map(p=>p.x+','+p.y)).size).toBe(6);
 });
});
