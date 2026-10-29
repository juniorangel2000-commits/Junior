import {it,expect} from 'vitest';
import {DungeonRun} from '../src/dungeons/run';
import {createDungeonProgress} from '../src/dungeons/progression';
import {TIMED_BOSS_SCHEDULE} from '../src/dungeons/bosses';
import {validDungeonSnapshot} from '../src/dungeons/snapshot';
const make=()=>new DungeonRun('timed-bosses','abandoned-central-square',createDungeonProgress());
it('spawns the five distinct bosses once at their scheduled minutes',()=>{
 const r=make();r.state.spawnClock=20;
 for(const [i,b] of TIMED_BOSS_SCHEDULE.entries()){
 r.state.elapsed=b.at-0.05;r.step(1/30);expect(r.state.timedBossCount).toBe(i);
 r.step(1/30);expect(r.state.timedBossCount).toBe(i+1);
 expect(r.state.enemies.filter(e=>e.kind==='boss'&&e.bossTier===b.tier)).toHaveLength(1);
 r.step(1/30);expect(r.state.timedBossCount).toBe(i+1);
 expect(validDungeonSnapshot(r.snapshot())).toBe(true);
 r.state.enemies=[];r.state.spawnClock=20;
 }
});
it('preserves spawn checkpoints and boss identity across save/load',()=>{
 const r=make();r.state.elapsed=180;r.step(1/30);
 const copy=make();copy.restore(r.snapshot());copy.step(1/30);
 expect(copy.state.timedBossCount).toBe(1);
 expect(copy.state.enemies.filter(e=>e.kind==='boss')).toHaveLength(1);
 expect(copy.state.enemies.find(e=>e.kind==='boss')?.bossTier).toBe(10);
});
it('does not release missed bosses together when continuing an older save',()=>{
 const r=make();r.state.elapsed=800;const s=r.snapshot();delete s.timedBossCount;
 r.restore(s);r.step(1/30);expect(r.state.timedBossCount).toBe(4);
 expect(r.state.enemies.some(e=>e.kind==='boss')).toBe(false);
});
it('still ends the timed mode at fifteen minutes',()=>{
 const r=make();r.state.elapsed=899.99;r.step(1/30);expect(r.state.phase).toBe('victory');
});
