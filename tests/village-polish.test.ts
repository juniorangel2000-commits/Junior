import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {VILLAGE_BUILDINGS,VILLAGE_DOOR_APPROACHES,VILLAGE_TREES,VILLAGE_PROPS,VILLAGE_ENTRY,VILLAGE_EXIT,VILLAGE_FENCES,VILLAGE_LAWNS,villageBlockedAt,villageWater,villageLakeDistance,villageGround,villagePointBlocked} from '../src/data/village';
import {villageGroundWeights} from '../src/data/village-ground';
import {VillageWalk,villageRoute} from '../src/systems/village-walk';

describe('village scenery, approaches and future circulation',()=>{
 it('keeps all three-tile door approaches clear for residents and the player',()=>{
  expect(VILLAGE_DOOR_APPROACHES).toHaveLength(10);
  for(const b of VILLAGE_BUILDINGS)for(let y=b.y+1;y<=b.y+4;y++)for(let x=b.x-1;x<=b.x+1;x++)expect(villageBlockedAt(x,y),`${b.id}: ${x},${y}`).toBe(false);
 });
 it('preserves the property passage and access to every front door through solid garden borders',()=>{
  for(const p of [...VILLAGE_DOOR_APPROACHES,VILLAGE_EXIT])expect(villageRoute(VILLAGE_ENTRY,p,villageBlockedAt),'id' in p?p.id:'exit').not.toHaveLength(0);
  expect(VILLAGE_FENCES.every(p=>villageBlockedAt(p.x,p.y))).toBe(true);
  expect(villageBlockedAt(26,26)).toBe(false);expect(villageBlockedAt(20,30)).toBe(false);
 });
 it('opens the workshop floor while retaining furnace, anvil and post collision',()=>{
  for(const p of [{x:61,y:32},{x:62,y:32},{x:63,y:32},{x:63,y:31}]){
   expect(villageBlockedAt(p.x,p.y),`floor ${p.x},${p.y}`).toBe(false);
   const x=(p.x+.5)*32,y=(p.y+.5)*32;
   for(const [dx,dy]of [[-7,-5],[7,-5],[-7,3],[7,3]])expect(villagePointBlocked(x+dx,y+dy)).toBe(false);
  }
  expect(villageBlockedAt(62,31)).toBe(true); // Anvil stump.
  expect(villageBlockedAt(63,30)).toBe(true); // Furnace.
  expect(villageRoute({x:63,y:34},{x:63,y:31},villageBlockedAt).length).toBeGreaterThan(0);
 });
 it('has six kinds of trees, with every base on dry ground and outside furnishings',()=>{
  expect(new Set(VILLAGE_TREES.map(t=>t.kind)).size).toBe(6);
  for(const tree of VILLAGE_TREES){expect(villageWater(tree.x,tree.y)).toBe(false);expect(VILLAGE_PROPS.some(p=>Math.hypot(p.x-tree.x,p.y-tree.y)<2.5)).toBe(false);}
 });
 it('normalizes organic ground blends, keeping planting islands grassy and streets readable',()=>{
  for(let y=0;y<72;y+=2)for(let x=0;x<96;x+=2){const w=villageGroundWeights(x,y);expect(w.every(n=>Number.isFinite(n)&&n>=0&&n<=1)).toBe(true);expect(w.reduce((a,b)=>a+b,0)).toBeCloseTo(1,5);}
  for(const p of VILLAGE_LAWNS)expect(villageGroundWeights(p.x,p.y)[4]).toBeLessThan(.05);
  expect(villageGround(2,52)).toBe('path');
 });
 it('uses an irregular lake contour with different east/west shoulders',()=>{
  expect(Math.abs(villageLakeDistance(92.8,44)-villageLakeDistance(81.2,44))).toBeGreaterThan(.1);
 });
});

describe('Bento walking along the new village',()=>{
 it('does not cut diagonally through a tight blocked corner',()=>{
  const blocked=(x:number,y:number)=>x===3&&y===2||x===2&&y===3;
  const route=villageRoute({x:2,y:2},{x:3,y:3},blocked);
  expect(route[0]).not.toEqual({x:3,y:3});expect(route.every(p=>!blocked(p.x,p.y))).toBe(true);
 });
 it('prefers a short street detour to crossing private lawns',()=>{
  const route=villageRoute({x:10,y:10},{x:16,y:10},()=>false,(_x,y)=>y===11?1:8);
  expect(route.some(p=>p.y===11)).toBe(true);
 });
 it('connects the workshop, square and Augusto with collision-safe routes',()=>{
  for(const point of [{x:62,y:33},{x:57,y:34},{x:49,y:41},{x:35,y:34}]){
   const route=villageRoute({x:57,y:33},point,villageBlockedAt,(x,y)=>['path','paving'].includes(villageGround(x,y))?1:2.4);
   expect(route.length).toBeGreaterThan(0);expect(route.every(p=>!villageBlockedAt(p.x,p.y))).toBe(true);
  }
 });
 it('plays only the six original frames while moving and stops for a conversation',()=>{
  const walker=new VillageWalk([{x:62,y:33}]),blocked=()=>false;let p={x:57.5*32,y:33.5*32},moved=0;
  for(let i=0;i<110;i++){const s=walker.step(.1,p,blocked);p={x:s.x,y:s.y};if(s.moving){moved++;expect(s.phase).toBeGreaterThanOrEqual(1);expect(s.phase).toBeLessThanOrEqual(6);}}
  expect(moved).toBeGreaterThan(0);const stop=walker.step(1,p,blocked,()=>1,true);expect({x:stop.x,y:stop.y}).toEqual(p);expect(stop.phase).toBe(0);
 });
 it('preserves all 56 original character PNGs, including different idle/walk canvas sizes',()=>{
  const root='public/assets/visual/village/bento',m=JSON.parse(readFileSync(`${root}/manifest.json`,'utf8'));
  expect(m.originalPngs).toHaveLength(56);
  for(const f of m.originalPngs)expect(createHash('sha256').update(readFileSync(`${root}/${f.file}`)).digest('hex')).toBe(f.sha256);
  expect(new Set(m.originalPngs.map((f:{width:number})=>f.width))).toEqual(new Set([192,256]));
 });
});
