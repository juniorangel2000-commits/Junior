import {describe,it,expect} from 'vitest';
import {lakeBlockedPoint,lakeWaterDistance,LAKE_PIER,LAKE_BRIDGE} from '../src/data/fishing-lake';
import {cityForestBlockedPoint,CITY_PUDDLES} from '../src/data/city-forest';
import {VILLAGE_LAKE,villagePointBlocked,villageWaterPoint} from '../src/data/village';
import {dungeonBlocked,safeDungeonPoint} from '../src/dungeons/maps';
import {defaultMap} from '../src/data/default-maps';
import {DungeonRun} from '../src/dungeons/run';
import {createDungeonProgress} from '../src/dungeons/progression';
import {sampleWaterDepth} from '../src/swimming/config';
describe('swimmable world water with solid structures preserved',()=>{
 it('lets the player enter the fishing lake while land-only navigation still avoids water',()=>{
  expect(lakeWaterDistance(48,40)).toBeLessThan(-4);expect(lakeBlockedPoint(48*32,40*32)).toBe(true);expect(lakeBlockedPoint(48*32,40*32,undefined,true)).toBe(false);
  expect(lakeBlockedPoint(40*32,10*32,undefined,true)).toBe(true);
  expect(lakeBlockedPoint(LAKE_PIER.x+10*32,LAKE_PIER.y+3.5*32,undefined,true)).toBe(true);
  expect(lakeBlockedPoint((LAKE_BRIDGE.x+3)*32,(LAKE_BRIDGE.y+.8)*32,undefined,true)).toBe(true);
 });
 it('opens city water without changing obstacle or boundary collision',()=>{
  const p=CITY_PUDDLES[0];expect(cityForestBlockedPoint(p.x*32,p.y*32)).toBe(true);expect(cityForestBlockedPoint(p.x*32,p.y*32,undefined,true)).toBe(false);
  expect(cityForestBlockedPoint(0,0,undefined,true)).toBe(true);
 });
 it('opens the village lake without letting the player pass through fences or buildings',()=>{
  let free:{x:number;y:number}|undefined;
  for(let y=VILLAGE_LAKE.y-4;y<=VILLAGE_LAKE.y+4&&!free;y++)for(let x=VILLAGE_LAKE.x-4;x<=VILLAGE_LAKE.x+4;x++)if(villageWaterPoint(x*32,y*32)&&!villagePointBlocked(x*32,y*32,undefined,true)){free={x:x*32,y:y*32};break;}
  expect(free).toBeDefined();expect(villagePointBlocked(free!.x,free!.y)).toBe(true);expect(villagePointBlocked(0,0,undefined,true)).toBe(true);
 });
 it('allows swimming in edited dungeon water and restores the swimmer at the saved location',()=>{
  const map=defaultMap('abandoned-central-square');for(let y=60;y<=65;y++)for(let x=45;x<=50;x++)map.terrain[`${x},${y}`]='water';
  const x=48.5*32,y=62.5*32;expect(dungeonBlocked('abandoned-central-square',x,y,map)).toBe(true);expect(dungeonBlocked('abandoned-central-square',x,y,map,true)).toBe(false);
  expect(safeDungeonPoint('abandoned-central-square',x,y,map,true)).toEqual({x,y});
  expect(sampleWaterDepth((px,py)=>map.terrain[`${Math.floor(px/32)},${Math.floor(py/32)}`]==='water',x,y)).toBe(1);
  const run=new DungeonRun('swimmer','abandoned-central-square',createDungeonProgress(),undefined,1,true,map),saved=run.snapshot();saved.player.x=x;saved.player.y=y;run.restore(saved);expect(run.state.player.x).toBe(x);expect(run.state.player.y).toBe(y);
 });
});
