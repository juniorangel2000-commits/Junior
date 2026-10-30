import { expect, it } from 'vitest';
import { hordeProfile, waveEnemyCount } from '../src/dungeons/director';
import { DungeonRun } from '../src/dungeons/run';
import { createDungeonProgress } from '../src/dungeons/progression';
import { DUNGEON_BALANCE as B } from '../src/dungeons/config';

it('preserves initial pressure and increases arrivals through each timed phase', () => {
 const start=hordeProfile('abandoned-central-square',0,1);
 expect(start.batch).toBe(2); expect(start.interval).toBe(1.5);expect(start.speed).toBe(1);
 let previous=start;
 for(let time=1;time<=900;time++) {
  const current=hordeProfile('abandoned-central-square',time,1);
  if(!current.respite&&!previous.respite) expect(current.batch/current.interval).toBeGreaterThanOrEqual(previous.batch/previous.interval);
  expect(current.speed).toBeGreaterThan(previous.speed);previous=current;
 }
 expect(previous.batch/previous.interval).toBeGreaterThan(24);
});
it('adds wave enemies gradually, without changing the first wave or exceeding the crowd cap',()=>{
 expect(waveEnemyCount(1)).toBe(7);
 for(let round=2;round<=50;round++) {
  expect(waveEnemyCount(round)-waveEnemyCount(round-1)).toBeGreaterThanOrEqual(2);
  expect(waveEnemyCount(round)-waveEnemyCount(round-1)).toBeLessThanOrEqual(3);
  expect(waveEnemyCount(round)).toBeLessThan(B.maxEnemies);
 }
 expect(waveEnemyCount(50)).toBeGreaterThan(105);expect(waveEnemyCount(999)).toBe(waveEnemyCount(50));
});
it('applies the larger enemy budget when the real run advances to the next wave',()=>{
 const run=new DungeonRun('horde-growth','mall-parking',createDungeonProgress());
 run.state.round=48;run.state.waveRemaining=0;run.state.enemies=[];run.state.spawnClock=20;
 run.step(1/30);
 expect(run.state.round).toBe(49);expect(run.state.waveRemaining).toBe(waveEnemyCount(49));
});
it('keeps ordinary enemies slower than the base player even at maximum level pressure',()=>{
 for(const map of ['mall-parking','abandoned-central-square'] as const){
  const last=hordeProfile(map,900,50,100000);
  expect(B.enemySpeed*last.speed).toBeLessThan(B.playerSpeed);
  expect(last.speed).toBeCloseTo(1.8);
 }
});
