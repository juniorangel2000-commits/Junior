import {describe,it,expect} from 'vitest';
import {CITY_FOREST_ENTRY,CITY_FOREST_TREES,CITY_FOREST_OBSTACLES,CITY_FOREST_CLEARINGS,CITY_FENCE_GATES,CITY_ROAD_FENCES,CITY_ACCESS,CITY_SIGN_TEXT,cityRoadAt,cityRoadDistance,cityFenceBlockedPoint,cityForestBlockedPoint} from '../src/data/city-forest';
import {villagePointBlocked} from '../src/data/village';
import {createNewSave,validateSave} from '../src/systems/save';
import {resolveMerchantLayout,createMerchantLayout} from '../src/data/merchant-rooms';

const fits=(x:number,y:number)=>[[-7,-5],[7,-5],[-7,3],[7,3]].every(([dx,dy])=>!cityForestBlockedPoint(x+dx,y+dy));
describe('independent northern city approach',()=>{
 it('keeps the normal L entirely in the northern strip',()=>{
  expect(cityRoadAt(22,2)).toBe(true);expect(cityRoadAt(22,10)).toBe(true);expect(cityRoadAt(90,10)).toBe(true);
  expect(cityRoadAt(70,2)).toBe(false);expect(cityRoadAt(22,30)).toBe(false);
  for(let y=14;y<72;y++)for(let x=0;x<96;x++)expect(cityRoadAt(x,y)).toBe(false);
 });
 it('follows both sides and both elbows with solid wooden-wire boundaries and deliberate openings',()=>{
  for(const p of [[18,8],[18,14],[32,14],[26,3],[26,6],[80,6]])expect(cityFenceBlockedPoint(p[0]*32,p[1]*32)).toBe(true);
  for(const p of CITY_FENCE_GATES)expect(fits(p.x*32,p.y*32)).toBe(true);
  expect(CITY_ROAD_FENCES.length).toBe(6);
 });
 it('supports a complete walk from the village entry through both gates, clearings and city access',()=>{
  const start={x:(CITY_FOREST_ENTRY.x+.5)*32,y:(CITY_FOREST_ENTRY.y+.5)*32};
  const visited=new Set([`${start.x},${start.y}`]),queue=[start];
  for(let i=0;i<queue.length;i++)for(const [dx,dy]of [[16,0],[-16,0],[0,16],[0,-16]]){
   const p={x:queue[i].x+dx,y:queue[i].y+dy},key=`${p.x},${p.y}`;
   if(!visited.has(key)&&fits(p.x,p.y)){visited.add(key);queue.push(p);}
  }
  for(const p of [...CITY_FOREST_CLEARINGS,...CITY_FENCE_GATES,CITY_ACCESS])expect(queue.some(q=>Math.hypot(q.x-p.x*32,q.y-p.y*32)<24),JSON.stringify(p)).toBe(true);
  expect(queue.length).toBeGreaterThan(8000);
 });
 it('keeps dense mixed trees away from asphalt and the marked city sign',()=>{
  expect(CITY_FOREST_TREES.length).toBeGreaterThan(350);
  expect(new Set(CITY_FOREST_OBSTACLES.map(p=>`${p.x},${p.y}`)).size).toBe(CITY_FOREST_OBSTACLES.length);
  expect(new Set(CITY_FOREST_TREES.map(t=>`${t.x},${t.y}`)).size).toBe(CITY_FOREST_TREES.length);
  expect(new Set(CITY_FOREST_TREES.map(t=>t.variant)).size).toBe(3);
  for(const t of CITY_FOREST_TREES)expect(cityRoadDistance(t.x+.5,t.y+.5)).toBeGreaterThan(5.7);
  expect(CITY_SIGN_TEXT).toBe('↑ City');expect(CITY_ACCESS.enabled).toBe(false);expect(CITY_ACCESS.travelDurationMs).toBe(5000);
 });
 it('clears only the short new village approach',()=>{
  for(let y=40;y<497;y+=8)for(const dx of [-7,7])expect(villagePointBlocked(50.5*32+dx,y)).toBe(false);
  for(let x=44.5*32;x<=50.5*32;x+=8)expect(villagePointBlocked(x,15.5*32)).toBe(false);
 });
 it('round-trips a fourth-area save and rejects malformed positions or incompatible rooms',()=>{
  const save=createNewSave({name:'Explorador',skin:'#d9a276',hairStyle:'curto',hairColor:'#754323',outfit:'#638a9d'});
  save.activeArea='cityForest';save.cityForestPosition={x:1552,y:2192,direction:'up'};
  expect(validateSave(JSON.parse(JSON.stringify(save)))).toBe(true);
  const room=createMerchantLayout('damiao');expect(resolveMerchantLayout('damiao',room)).toEqual(room);
  save.cityForestPosition.x=Infinity;expect(validateSave(save)).toBe(false);save.cityForestPosition.x=1552;
  save.merchantInterior={owner:'damiao',x:288,y:335};expect(validateSave(save)).toBe(false);
 });
});
