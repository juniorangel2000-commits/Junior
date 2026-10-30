import { expect, it } from "vitest";
import { petDirection, PET_DIRECTIONS } from "../src/dungeons/pet-directions";
import { petSpritePose, PET_ART } from "../src/dungeons/pet-sprites";
import { validWorldPetState } from "../src/dungeons/world-pet-state";
import { validDungeonSnapshot } from "../src/dungeons/snapshot";
import { DungeonRun } from "../src/dungeons/run";
import { createDungeonProgress } from "../src/dungeons/progression";

it("faces eight movement directions, including diagonal sectors close to cardinal boundaries", () => {
  for (const [x, y, direction] of [
    [1, 0, "east"],
    [1, 1, "south-east"],
    [0, 1, "south"],
    [-1, 1, "south-west"],
    [-1, 0, "west"],
    [-1, -1, "north-west"],
    [0, -1, "north"],
    [1, -1, "north-east"],
    [1, 0.1, "east"],
    [1, 0.5, "south-east"],
  ] as const)
    expect(petDirection(x, y)).toBe(direction);
});

it("plays supplied diagonal walks for both species and variants, with safe fallback for four-direction actions", () => {
  for (const species of ["dog", "cat"] as const)
    for (const direction of PET_DIRECTIONS) {
      const walk = petSpritePose(species, "walk", direction, 0.3);
      expect(walk.frame).toBe(`walk-${direction}-1`); // 6 fps walking
      expect(
        petSpritePose(species, "walk", direction, 0.3, true, true),
      ).toEqual({ ...walk, texture: walk.texture + "-rare" });
      for (const action of [
        "idle",
        "run",
        "attack",
        "sit",
        "stand",
        "rest",
      ] as const) {
        const pose = petSpritePose(species, action, direction, 0.3);
        expect(PET_ART[species].frames).toHaveProperty(pose.frame);
      }
    }
});

it("accepts and restores diagonal facing in dungeon checkpoints and normal-world wait commands", () => {
  const progress = createDungeonProgress();
  progress.pets.push({
    id: "pet",
    species: "dog",
    rare: true,
    xp: 0,
    attributes: {
      speed: 0,
      resistance: 0,
      perception: 0,
      protection: 0,
      efficiency: 0,
    },
  });
  const run = new DungeonRun("directions", "mall-parking", progress, "pet");
  for (const direction of PET_DIRECTIONS) {
    run.state.pet!.direction = direction;
    const snapshot = run.snapshot();
    expect(validDungeonSnapshot(snapshot)).toBe(true);
    run.restore(snapshot);
    expect(run.state.pet!.direction).toBe(direction);
    expect(
      validWorldPetState({
        mode: "stay",
        area: "village",
        space: "outdoors",
        x: 100,
        y: 100,
        direction,
      }),
    ).toBe(true);
  }
});
