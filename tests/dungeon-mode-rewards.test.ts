import { expect, it } from "vitest";
import { createNewSave, validateSave } from "../src/systems/save";
import {
  applyDungeonResult,
  createDungeonProgress,
  type RunResult,
} from "../src/dungeons/progression";
import { DungeonRun } from "../src/dungeons/run";

function save() {
  const s = createNewSave({
    name: "Recompensas",
    skin: "#d9a276",
    hairStyle: "curto",
    hairColor: "#754323",
    outfit: "#638a9d",
  });
  s.dungeons = createDungeonProgress();
  s.dungeons.xp = 1000;
  return s;
}
const timed = (changes: Partial<RunResult> = {}): RunResult => ({
  id: "timed",
  dungeon: "abandoned-central-square",
  outcome: "defeat",
  elapsed: 600,
  kills: 500,
  level: 100,
  ...changes,
});
const waves = (changes: Partial<RunResult> = {}): RunResult =>
  timed({
    id: "waves",
    dungeon: "mall-parking",
    round: 21,
    completedRounds: 20,
    level: 50,
    ...changes,
  });

it("rewards time plus reached level, independent of excess kills", () => {
  const a = applyDungeonResult(save(), timed());
  expect(a.progressXP).toBe(400);
  expect(a.levelXP).toBe(594);
  expect(a.xp).toBe(994);
  expect(a.coins).toBe(24);
  expect(applyDungeonResult(save(), timed({ kills: 5000 }))).toEqual(a);
  expect(
    applyDungeonResult(save(), timed({ elapsed: 900 })).xp,
  ).toBeGreaterThan(a.xp);
  expect(applyDungeonResult(save(), timed({ level: 150 })).xp).toBeGreaterThan(
    a.xp,
  );
});

it("rewards completed rounds plus reached level, with no incentive to wait", () => {
  const a = applyDungeonResult(save(), waves({ elapsed: 60 }));
  expect(a.progressXP).toBe(800);
  expect(a.levelXP).toBe(294);
  expect(a.xp).toBe(1094);
  expect(a.coins).toBe(19);
  expect(applyDungeonResult(save(), waves({ elapsed: 6000 }))).toEqual(a);
  expect(
    applyDungeonResult(save(), waves({ completedRounds: 25, round: 26 })).xp,
  ).toBeGreaterThan(a.xp);
  expect(applyDungeonResult(save(), waves({ level: 100 })).xp).toBeGreaterThan(
    a.xp,
  );
});

it.each([timed, waves])(
  "adds a clear victory bonus and preserves earned XP on abandonment",
  (factory) => {
    const defeat = applyDungeonResult(save(), factory());
    const win = applyDungeonResult(save(), factory({ outcome: "victory" }));
    expect(win.xp - defeat.xp).toBe(150);
    expect(win.coins - defeat.coins).toBe(5);
    expect(win.materials?.metalPart).toBe(1);
    const abandoned = applyDungeonResult(
      save(),
      factory({ outcome: "abandoned" }),
    );
    expect(abandoned.xp).toBe(defeat.xp);
    expect(abandoned.coins).toBe(0);
    expect(abandoned.materials).toEqual({});
  },
);

it("derives materials from progress and level, and keeps the inventory/save consistent", () => {
  const s = save();
  const reward = applyDungeonResult(s, timed({ elapsed: 180, level: 1 }));
  expect(reward.materials).toEqual({ scrap: 1 });
  expect(validateSave(s)).toBe(true);
  expect(
    applyDungeonResult(save(), timed({ elapsed: 180, level: 81 })).materials,
  ).toEqual({ scrap: 2, cloth: 1 });
});

it("reports current level and actual cleared rounds, including final-round and intermission boundaries", () => {
  const r = new DungeonRun(
    "round-report",
    "mall-parking",
    createDungeonProgress(),
  );
  r.state.level = 77;
  r.state.round = 25;
  r.state.phase = "abandoned";
  r.state.waveRemaining = 1;
  r.state.enemies = [];
  expect(r.result()).toMatchObject({
    level: 77,
    round: 25,
    completedRounds: 24,
  });
  r.state.waveRemaining = 0;
  expect(r.result().completedRounds).toBe(25);
  r.state.round = 50;
  r.state.phase = "victory";
  expect(r.result().completedRounds).toBe(50);
});

it("does not reward idle sessions or forged levels beyond combat activity", () => {
  expect(
    applyDungeonResult(save(), timed({ kills: 0, level: 1 })),
  ).toMatchObject({ xp: 0, coins: 0, materials: {} });
  expect(
    applyDungeonResult(save(), timed({ kills: 1, level: 1000 })).levelXP,
  ).toBe(12);
  expect(applyDungeonResult(save(), timed({ elapsed: 9000 }))).toEqual(
    applyDungeonResult(save(), timed({ elapsed: 900 })),
  );
});

it("retains early support in rounds and does not duplicate rewards", () => {
  const s = save();
  s.dungeons!.xp = 0;
  const result = waves({ completedRounds: 2, round: 3, kills: 20, level: 2 });
  const reward = applyDungeonResult(s, result);
  expect(reward.progressXP).toBe(80);
  expect(reward.levelXP).toBe(6);
  expect(reward.learningXP).toBe(14);
  expect(reward.xp).toBe(100);
  const before = structuredClone(s);
  expect(applyDungeonResult(s, result).applied).toBe(false);
  expect(s).toEqual(before);
});

it.each([
  { level: 0 },
  { level: 1.5 },
  { level: Infinity },
  { round: 0 },
  { completedRounds: 51 },
  { round: 10, completedRounds: 11 },
])("rejects invalid progress without changing the save: %j", (changes) => {
  const s = save(),
    before = structuredClone(s);
  expect(applyDungeonResult(s, timed(changes)).applied).toBe(false);
  expect(s).toEqual(before);
});
