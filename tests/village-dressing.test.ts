import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import props from '../public/assets/visual/village/lived-in/props.json';
import mill from '../public/assets/visual/village/lived-in/windmill.json';
import {VILLAGE_DRESSING,villageDressingBounds,villageDressingBlockedPoint} from '../src/data/village-dressing';
import {VILLAGE_BUILDINGS,VILLAGE_TREES,villageDoorApproach,villagePathEdge,villageWaterPoint} from '../src/data/village';
import {villageBuildingArtBands,villageArtRectsOverlap} from '../src/data/village-building-art';
import {villageTallGrassPositions} from '../src/village-greenery';
import {windmillAngle,villageIdleDirection} from '../src/data/village-ambient';

describe('outdoor work areas and ambient life',()=>{
 it('keeps generated source art intact and all atlas frames within its bounds',()=>{
  for(const m of [props,mill]){
   const source=readFileSync('public/'+m.file);
   expect(createHash('sha256').update(source).digest('hex')).toBe(m.sha256);
   for(const r of Object.values(m.frames)){
    expect(r.x).toBeGreaterThanOrEqual(0);expect(r.y).toBeGreaterThanOrEqual(0);
    expect(r.x+r.width).toBeLessThanOrEqual(source.readUInt32BE(16));
    expect(r.y+r.height).toBeLessThanOrEqual(source.readUInt32BE(20));
   }
  }
 });
 it('gives all ten merchants a distinct outdoor fitting',()=>{
  const shops=VILLAGE_DRESSING.filter(p=>!['community','cottage'].includes(p.owner));
  expect(new Set(shops.map(p=>p.owner)).size).toBe(10);
  expect(new Set(shops.map(p=>p.frame)).size).toBe(10);
 });
 it('keeps the entire artwork off paving, water, facades and other fittings',()=>{
  const bands=VILLAGE_BUILDINGS.flatMap(villageBuildingArtBands);
  for(const p of VILLAGE_DRESSING){
   const b=villageDressingBounds(p);
   expect(villageDoorApproach(p.x,p.y),p.id).toBe(false);
   expect(bands.some(r=>villageArtRectsOverlap(b,r)),p.id).toBe(false);
   expect(VILLAGE_DRESSING.some(q=>q!==p&&villageArtRectsOverlap(b,villageDressingBounds(q))),p.id).toBe(false);
   for(const x of [b.left,(b.left+b.right)/2,b.right])for(const y of [b.top,(b.top+b.bottom)/2,b.bottom]){
    expect(villageWaterPoint(x,y),p.id).toBe(false);
    expect(villagePathEdge(x/32-.5,y/32-.5),p.id).toBeGreaterThan(.3);
   }
  }
 });
 it('reserves the lower physical footprint while allowing passage behind the props',()=>{
  for(const p of VILLAGE_DRESSING){
   const b=villageDressingBounds(p),x=(b.left+b.right)/2;
   expect(villageDressingBlockedPoint(x,b.bottom-8),p.id).toBe(true);
   expect(villageDressingBlockedPoint(x,b.top-5),p.id).toBe(false);
  }
 });
 it('keeps vegetation and complete tree canopies clear of the new work areas',()=>{
  const bands=VILLAGE_DRESSING.map(villageDressingBounds);
  for(const p of villageTallGrassPositions()){
   const x=(p.x+.5)*32,y=p.y*32+25;
   expect(bands.some(b=>villageArtRectsOverlap({left:x-24,right:x+24,top:y-42,bottom:y},b))).toBe(false);
  }
  for(const p of VILLAGE_TREES){
   const x=(p.x+.5)*32,y=p.y*32+25;
   expect(bands.some(b=>villageArtRectsOverlap({left:x-88,right:x+88,top:y-211,bottom:y+6},b))).toBe(false);
  }
 });
 it('rotates slowly around a fixed hub and wraps without a visible jump',()=>{
  expect(windmillAngle(30000)).toBeCloseTo(Math.PI/2);
  expect(Math.cos(windmillAngle(120000))).toBeCloseTo(Math.cos(windmillAngle(119999)),6);
  expect(windmillAngle(240000)).toBe(0);
 });
 it('only glances after a pause and immediately yields to walking or conversation',()=>{
  expect(villageIdleDirection('down',2,0)).toBe('down');
  expect(villageIdleDirection('down',13,0)).toBe('right');
  expect(villageIdleDirection('down',13,0,true)).toBe('down');
  expect(villageIdleDirection('down',0,0)).toBe('down');
  expect(villageIdleDirection('down',16,0)).toBe('down');
 });
});
