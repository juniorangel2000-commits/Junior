import { it, expect } from "vitest";
import { DungeonRun } from "../src/dungeons/run";
import { createDungeonProgress } from "../src/dungeons/progression";
import { validDungeonSnapshot } from "../src/dungeons/snapshot";
const make = () => {
 const r = new DungeonRun("healing", "abandoned-central-square", createDungeonProgress());
 r.random = () => 0;
 r.state.spawnClock = 20;
 return r;
};
const event = (r: DungeonRun, at: number) => {
 r.state.elapsed = at; r.state.eventClock = at - 45; r.state.spawnClock = 20;
 r.step(1/30);
};
it("limits event healing to three items, with a shared cooldown preserved on load", () => {
 const r = make(); event(r,45); event(r,46);
 expect(r.state.pickups.filter(p=>p.kind==='health')).toHaveLength(1);
 const copy = make();copy.restore(r.snapshot());event(copy,47);
 expect(copy.state.pickups.filter(p=>p.kind==='health')).toHaveLength(1);
 event(copy,60);event(copy,75);event(copy,90);
 expect(copy.state.pickups.filter(p=>p.kind==='health')).toHaveLength(3);
 expect(copy.state.pickups.filter(p=>p.kind==='health').every(p=>p.amount===20)).toBe(true);
 expect(validDungeonSnapshot(copy.snapshot())).toBe(true);
});
it("leaves healing on the ground at full health and consumes it only when injured", () => {
 const r=make();r.state.pickups=[{id:1,x:r.state.player.x,y:r.state.player.y,kind:'health',amount:15}];
 r.step(1/30);expect(r.state.pickups).toHaveLength(1);
 r.state.player.hp=50;r.step(1/30);expect(r.state.player.hp).toBe(65);expect(r.state.pickups).toHaveLength(0);
});
it("accepts old saves and rejects invalid healing cooldowns", () => {
 const r=make();expect(validDungeonSnapshot(r.snapshot())).toBe(true);
 r.state.lastHealthDropAt=NaN;expect(validDungeonSnapshot(r.snapshot())).toBe(false);
 r.state.lastHealthDropAt=100;expect(validDungeonSnapshot(r.snapshot())).toBe(false);
});
