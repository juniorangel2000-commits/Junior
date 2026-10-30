import { validDungeonSnapshot } from '../src/dungeons/snapshot';
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
it('more than doubles every wave while preserving gradual growth',()=>{
 let previous=0;
 for(let round=1;round<=50;round++) {
  const old=5+round*2+Math.floor((round-1)*.75);
  expect(waveEnemyCount(round)).toBeGreaterThan(old*2);
  expect(waveEnemyCount(round)).toBeGreaterThan(previous);
  previous=waveEnemyCount(round);
 }
 expect(waveEnemyCount(1)).toBe(16);expect(waveEnemyCount(50)).toBe(311);
 expect(waveEnemyCount(999)).toBe(waveEnemyCount(50));
});
it('starts a fresh wave run with the increased budget',()=>{
 const run=new DungeonRun('larger-first-wave','mall-parking',createDungeonProgress());
 expect(run.state.waveRemaining).toBe(16);
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

it('matches timed combat pressure at equivalent wave progress, including player level',()=>{
 for(const round of [1,5,10,20,25,40,50]) for(const level of [1,100,500]) {
  const time=(round-1)/49*900;
  const timed=hordeProfile('abandoned-central-square',time,1,level);
  const waves=hordeProfile('mall-parking',0,round,level);
  for(const key of ['health','damage','speed','specialChance','runnerChance','stage'] as const)
   expect(waves[key]).toBeCloseTo(timed[key]);
  if(!timed.respite){expect(waves.batch).toBe(timed.batch);expect(waves.interval).toBeCloseTo(timed.interval);}
  expect(hordeProfile('mall-parking',time+5000,round,level)).toEqual(waves);
 }
});

it.each(['mall-parking','abandoned-central-square'] as const)('supports and restores 480 live enemies without allowing overflow in %s',map=>{
 const run=new DungeonRun('crowd-limit',map,createDungeonProgress());
 const spawn=(run as unknown as {spawn():boolean}).spawn.bind(run);
 for(let attempt=0;attempt<1000&&run.state.enemies.length<B.maxEnemies;attempt++)spawn();
 expect(run.state.enemies.length).toBe(480);expect(spawn()).toBe(false);
 const saved=run.snapshot();expect(validDungeonSnapshot(saved)).toBe(true);
 const restored=new DungeonRun('restore-crowd',map,createDungeonProgress());
 restored.restore(saved);expect(restored.state.enemies.length).toBe(480);
 expect(validDungeonSnapshot(restored.snapshot())).toBe(true);
});
