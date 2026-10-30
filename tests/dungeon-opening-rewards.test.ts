import { expect, it } from "vitest";
import { createNewSave, validateSave } from "../src/systems/save";
import {
  applyDungeonResult,
  buyPermanentAttribute,
  createDungeonProgress,
} from "../src/dungeons/progression";

const makeSave = () => {
  const save = createNewSave({
    name: "Teste",
    skin: "#d9a276",
    hairStyle: "curto",
    hairColor: "#754323",
    outfit: "#638a9d",
  });
  save.dungeons = createDungeonProgress();
  return save;
};
const attempt = (
  id: string,
  outcome: "defeat" | "abandoned" = "defeat",
  kills = 20,
  elapsed = 120,
) => ({
  id,
  outcome,
  kills,
  elapsed,
  dungeon: "abandoned-central-square" as const,
});

it("lets two qualifying early defeats fund a first chosen improvement", () => {
  const save = makeSave();
  for (const id of ["first", "second"]) {
    const reward = applyDungeonResult(save, attempt(id));
    expect(reward.xp).toBe(100);
    expect(reward.progressXP).toBe(80);
    expect(reward.learningXP).toBe(20);
  }
  expect(buyPermanentAttribute(save.dungeons!, "strength")).toBe(true);
  expect(save.dungeons!.attributes.strength).toBe(1);
  expect(save.dungeons!.xp).toBe(50);
  expect(validateSave(save)).toBe(true);
});

it("does not reset learning support when XP is spent, and stops it after the initial career budget", () => {
  const save = makeSave();
  save.dungeons!.attributes.strength = 1; // 150 XP already spent
  save.dungeons!.xp = 430; // career total 580
  const reward = applyDungeonResult(save, attempt("near-limit"));
  expect(reward.xp).toBe(80); // ordinary rewards pass 600; no more support
  expect(reward.learningXP).toBe(0);
  expect(buyPermanentAttribute(save.dungeons!, "vitality")).toBe(true);
  expect(applyDungeonResult(save, attempt("after-spending")).learningXP).toBe(
    0,
  );
});

it("caps the last learning award at the remaining budget", () => {
  const save = makeSave();
  save.dungeons!.xp = 500;
  const reward = applyDungeonResult(save, attempt("last-support"));
  expect(reward.learningXP).toBe(20);
  expect(reward.xp).toBe(100);
  expect(save.dungeons!.xp).toBe(600);
});

it("does not grant support for idling, short attempts or abandonment", () => {
  for (const result of [
    attempt("idle", "defeat", 0, 900),
    attempt("short", "defeat", 20, 119),
    attempt("few-kills", "defeat", 19, 120),
    attempt("abandon", "abandoned", 20, 900),
  ]) {
    const reward = applyDungeonResult(makeSave(), result);
    expect(reward.learningXP).toBe(0);
    if (result.kills === 0) expect(reward.xp).toBe(0);
    if (result.outcome === "abandoned") {
      expect(reward.progressXP).toBe(600);
      expect(reward.xp).toBe(600);
      expect(reward.coins).toBe(0);
    }
  }
});

it("caps time rewards at the challenge duration and applies each result once", () => {
  const save = makeSave();
  save.dungeons!.xp = 1000;
  const result = attempt("long", "defeat", 100, 900);
  const reward = applyDungeonResult(save, result);
  expect(reward.progressXP).toBe(600);
  expect(reward.xp).toBe(600);
  const before = structuredClone(save);
  expect(applyDungeonResult(save, result).applied).toBe(false);
  expect(save).toEqual(before);
});
