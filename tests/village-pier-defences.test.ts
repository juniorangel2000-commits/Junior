import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import pier from '../public/assets/visual/village/pier/manifest.json';
import defences from '../public/assets/visual/village/defences/manifest.json';
import wheat from '../public/assets/visual/village/wheat/manifest.json';
import {VILLAGE_PIER,villagePierDeckContains} from '../src/data/village-pier';
import {VILLAGE_BARRICADES,villageBarricadeBlockedPoint} from '../src/data/village-defences';
import {villageLandmarkGroundClearing,VILLAGE_LANDMARKS} from '../src/data/village-landmarks';
import {VILLAGE_ENTRY,VILLAGE_EXIT,VILLAGE_TREES,VILLAGE_ENTRANCE_APRONS,VILLAGE_BUILDINGS,villageBlockedAt,villagePointBlocked,villageWaterPoint,villageWater,villagePathEdge} from '../src/data/village';
import {villageGroundWeights} from '../src/data/village-ground';
import {villageRoute} from '../src/systems/village-walk';

describe('organic village clearings, fishing pier and perimeter',()=>{
 it('preserves the source atlases and bounds every independent directional sprite',()=>{
  for(const m of [pier,defences,wheat]){
   const png=readFileSync('public/'+m.file);
   expect(createHash('sha256').update(png).digest('hex')).toBe(m.sha256);
   for(const r of Object.values(m.frames)){
    expect(r.x+r.width).toBeLessThanOrEqual(png.readUInt32BE(16));
    expect(r.y+r.height).toBeLessThanOrEqual(png.readUInt32BE(20));
   }
  }
  expect(Object.keys(defences.frames)).toHaveLength(16);
 });
 it('replaces sharp rectangular grass cutoffs with continuous blends across the whole map',()=>{
  for(let y=2;y<70;y+=.5)for(let x=2;x<94;x+=.5){
   const a=villageLandmarkGroundClearing(x,y),b=villageLandmarkGroundClearing(x+.01,y);
   expect(a).toBeGreaterThanOrEqual(0);expect(a).toBeLessThanOrEqual(1);
   expect(Math.abs(a-b)).toBeLessThan(.015);
  }
  // The former hard right edge of the community clearing must be continuous.
  const a=villageGroundWeights(63.499,15),b=villageGroundWeights(63.501,15);
  expect(Math.max(...a.map((n,i)=>Math.abs(n-b[i])))).toBeLessThan(.005);
 });
 it('lets the player reach the pier on dry boards while ropes and surrounding water block movement',()=>{
  expect(villageRoute(VILLAGE_ENTRY,{x:79,y:45},villageBlockedAt)).not.toHaveLength(0);
  for(let x=VILLAGE_PIER.x+16;x<VILLAGE_PIER.x+VILLAGE_PIER.width-16;x+=4){
   const y=1456;
   expect(villagePierDeckContains(x,y)).toBe(true);
   expect(villageWaterPoint(x,y)).toBe(false);
   expect(villageWater(Math.floor(x/32),45)).toBe(false);
   for(const [dx,dy] of [[-7,-5],[7,-5],[-7,3],[7,3]])expect(villagePointBlocked(x+dx,y+dy)).toBe(false);
  }
  expect(villagePointBlocked(2500,VILLAGE_PIER.y+20)).toBe(true);
  expect(villagePointBlocked(2500,VILLAGE_PIER.y+59)).toBe(true);
  expect(villageWaterPoint(2500,VILLAGE_PIER.y+100)).toBe(true);
 });
 it('opens the gazebo centre and keeps the supporting pillars solid',()=>{
  const p=VILLAGE_LANDMARKS.find(p=>p.kind==='gazebo')!,x=(p.x+.5)*32,y=p.y*32+25;
  expect(villageRoute(VILLAGE_ENTRY,{x:p.x,y:p.y-1},villageBlockedAt)).not.toHaveLength(0);
  for(let py=y-35;py<y+40;py+=3)for(const dx of [-7,7])expect(villagePointBlocked(x+dx,py)).toBe(false);
  expect(villagePointBlocked(x-65,y-12)).toBe(true);expect(villagePointBlocked(x+65,y-12)).toBe(true);
  expect([-7,7].some(dx=>villagePointBlocked(x-65+dx,y-12))).toBe(true);
 });
 it('finishes every entrance flat without widening the original road into a pad',()=>{
  expect(VILLAGE_ENTRANCE_APRONS.length).toBeGreaterThan(VILLAGE_BUILDINGS.length);
  for(const p of VILLAGE_ENTRANCE_APRONS){
   for(const dx of [-p.halfWidth+.1,p.halfWidth-.1])for(const dy of [1.1,2.3]){
    expect(villagePathEdge(p.x+dx,p.y+dy),p.id).toBeLessThan(0);
   }
  }
  expect(villagePathEdge(24,37.3)).toBeGreaterThan(0);
 });
 it('keeps the property gate open through the mixed forest and defensive perimeter',()=>{
  expect(VILLAGE_BARRICADES.filter(p=>p.blood).length).toBeGreaterThan(0);
  expect(new Set(VILLAGE_TREES.map(t=>t.kind)).size).toBe(6);
  expect(villageRoute(VILLAGE_ENTRY,VILLAGE_EXIT,villageBlockedAt)).not.toHaveLength(0);
  for(const p of VILLAGE_BARRICADES)expect(villageBarricadeBlockedPoint((p.x+.5)*32,p.y*32+21)).toBe(true);
  expect(villagePathEdge(35,47)).toBeGreaterThan(.5);
 });
});
