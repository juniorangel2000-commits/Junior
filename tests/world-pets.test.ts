import { describe, it, expect, vi } from "vitest";
import { EventEmitter } from "node:events";
import type Phaser from "phaser";
import type { SaveData } from "../src/types";
import type { GameUI } from "../src/ui";
import {
  createDungeonProgress,
  validDungeonProgress,
} from "../src/dungeons/progression";
import { WorldCompanion } from "../src/dungeons/world-companion";
import {
  WorldPetController,
  installWorldCompanion,
  getWorldPetController,
} from "../src/dungeons/world-pet-controller";
import { petFreePoint } from "../src/dungeons/world-pet-state";
import { petSpritePose, PET_ART } from "../src/dungeons/pet-sprites";
class Image {
  x = 0;
  y = 0;
  visible = true;
  destroyed = false;
  frame = "";
  setPosition(x: number, y: number) {
    this.x = x;
    this.y = y;
    return this;
  }
  setVisible(v: boolean) {
    this.visible = v;
    return this;
  }
  setTexture(_texture: string, frame: string) {
    this.frame = frame;
    return this;
  }
  setData() {
    return this;
  }
  setTint() {
    return this;
  }
  setOrigin() {
    return this;
  }
  setScale() {
    return this;
  }
  setDepth() {
    return this;
  }
  setDisplaySize() {
    return this;
  }
  destroy() {
    this.destroyed = true;
    this.visible = false;
  }
}
function fixture() {
  const progress = createDungeonProgress();
  progress.pets.push({
    id: "cat-1",
    species: "cat",
    rare: false,
    xp: 0,
    attributes: {
      speed: 0,
      resistance: 0,
      perception: 0,
      protection: 0,
      efficiency: 0,
    },
  });
  progress.selectedPet = "cat-1";
  const save = { dungeons: progress } as SaveData;
  const events = new EventEmitter();
  const scene = {
    events,
    textures: { exists: () => true },
    add: { image: (x: number, y: number) => new Image().setPosition(x, y) },
  } as unknown as Phaser.Scene;
  return { save, scene, events };
}
describe("world companions", () => {
  it("copies only coordinates from a live player, never scene objects or old commands", () => {
    class PlayerPoint {
      scene = { update: () => {} };
      get x() {
        return 500;
      }
      get y() {
        return 600;
      }
    }
    expect(petFreePoint(new PlayerPoint(), () => false)).toEqual({
      x: 500,
      y: 600,
    });
    const waiting = { x: 500, y: 600, mode: "stay" };
    expect(petFreePoint(waiting, () => false)).toEqual({ x: 500, y: 600 });
  });
  it("routes around a wall without walking through it", () => {
    const { save, scene } = fixture(),
      blocked = (x: number, y: number) =>
        x < 8 ||
        y < 8 ||
        x > 3064 ||
        y > 2296 ||
        (x >= 160 && x <= 192 && y < 224);
    const companion = new WorldCompanion(
      scene,
      save,
      { x: 120, y: 160 },
      () => {},
      { area: "property", space: "outdoors", blockedPoint: blocked },
    );
    for (let i = 0; i < 100; i++) {
      companion.update(0.1, { x: 400, y: 160 });
      expect(blocked(companion.image.x, companion.image.y)).toBe(false);
    }
    expect(
      Math.hypot(companion.image.x - 400, companion.image.y - 160),
    ).toBeLessThan(160);
    expect(companion.image.x).toBeGreaterThan(192);
  });
  it("keeps a waiting pet in place and does not move it to a different map", () => {
    const { save, scene } = fixture();
    const companion = new WorldCompanion(
      scene,
      save,
      { x: 120, y: 160 },
      () => {},
      { area: "property", space: "outdoors", blockedPoint: () => false },
    );
    save.dungeons!.pets[0].world!.mode = "stay";
    companion.playTransition("sit");
    for (let i = 0; i < 20; i++) companion.update(0.1, { x: 500, y: 500 });
    expect(companion.image.x).toBe(120);
    expect(companion.image.y).toBe(160);
    const next = new WorldCompanion(scene, save, { x: 500, y: 500 }, () => {}, {
      area: "village",
      space: "outdoors",
      blockedPoint: () => false,
    });
    next.update(0.1, { x: 550, y: 550 });
    expect(next.image.visible).toBe(false);
    expect(save.dungeons!.pets[0].world!.area).toBe("property");
  });
  it("keeps a waiting cat still and plays a slow idle only occasionally", () => {
    const { save, scene } = fixture();
    const c = new WorldCompanion(scene, save, { x: 120, y: 160 }, () => {}, {
      area: "property",
      space: "outdoors",
      blockedPoint: () => false,
    });
    save.dungeons!.pets[0].world!.mode = "stay";
    c.playTransition("sit");
    const step = (n: number) => {
      for (let i = 0; i < n; i++) c.update(0.1, { x: 400, y: 400 });
    };
    step(35);
    const quiet = c.image.frame;
    step(5);
    expect(c.image.frame).toBe(quiet);
    step(20);
    expect(c.image.frame).not.toBe(quiet);
    step(25);
    expect(c.image.frame).toBe(quiet);
    expect(c.image.x).toBe(120);
    expect(c.image.y).toBe(160);
  });
  it("recalls a pet from another map and rolls back failed commands", () => {
    const { save, scene } = fixture();
    save.dungeons!.pets[0].world = {
      mode: "stay",
      area: "property",
      space: "home",
      x: 120,
      y: 160,
      direction: "south",
    };
    const ui = { toast: vi.fn() } as unknown as GameUI;
    const persist = vi.fn(() => true);
    const controller = new WorldPetController(
      scene,
      () => ({
        save,
        player: { x: 500, y: 500 },
        area: "village",
        space: "outdoors",
        blockedPoint: () => false,
        enabled: true,
        canMove: true,
      }),
      ui,
      persist,
    );
    controller.update(0);
    expect(controller.companion!.image.visible).toBe(false);
    expect(controller.command({ kind: "recall" })).toBe(true);
    expect(controller.companion!.image.visible).toBe(true);
    expect(save.dungeons!.pets[0].world).toMatchObject({
      mode: "follow",
      area: "village",
      x: 500,
      y: 500,
    });
    const before = structuredClone(save.dungeons);
    persist.mockReturnValue(false);
    expect(controller.command({ kind: "stay" })).toBe(false);
    expect(save.dungeons).toEqual(before);
  });
  it("does not spawn a pet in water when no dry point can be found", () => {
    expect(petFreePoint({ x: 500, y: 500 }, () => true)).toBeUndefined();
    const { save, scene } = fixture();
    const companion = new WorldCompanion(
      scene,
      save,
      { x: 500, y: 500 },
      () => {},
      { area: "property", space: "outdoors", blockedPoint: () => true },
    );
    companion.update(0.1, { x: 510, y: 500 });
    expect(companion.image.visible).toBe(false);
  });
  it("removes the visible pet when the player selects no companion", () => {
    const { save, scene } = fixture();
    const controller = new WorldPetController(
      scene,
      () => ({
        save,
        player: { x: 500, y: 500 },
        area: "property",
        space: "outdoors",
        blockedPoint: () => false,
        enabled: true,
        canMove: true,
      }),
      { toast: vi.fn() } as unknown as GameUI,
      () => true,
    );
    controller.update(0);
    const image = controller.companion!.image;
    expect(controller.command({ kind: "select" })).toBe(true);
    expect(controller.companion).toBeUndefined();
    expect(image.visible).toBe(false);
    expect(save.dungeons!.selectedPet).toBeUndefined();
  });
  it("registers one update hook and removes it on scene shutdown", () => {
    const { save, scene, events } = fixture(),
      context = () => ({
        save,
        player: { x: 500, y: 500 },
        area: "property" as const,
        space: "outdoors",
        blockedPoint: () => false,
        enabled: true,
        canMove: true,
      });
    const ui = { toast: vi.fn() } as unknown as GameUI;
    installWorldCompanion(scene, context, ui, () => true);
    installWorldCompanion(scene, context, ui, () => true);
    expect(events.listenerCount("postupdate")).toBe(1);
    expect(getWorldPetController(scene)).toBeDefined();
    events.emit("shutdown");
    expect(events.listenerCount("postupdate")).toBe(0);
    expect(getWorldPetController(scene)).toBeUndefined();
  });
  it("accepts older saves and validates the optional waiting position", () => {
    const { save } = fixture(),
      progress = save.dungeons!;
    expect(validDungeonProgress(progress)).toBe(true);
    progress.pets[0].world = {
      mode: "stay",
      area: "property",
      space: "home",
      x: 120,
      y: 160,
      direction: "north",
    };
    expect(validDungeonProgress(progress)).toBe(true);
    progress.pets[0].world.x = Infinity;
    expect(validDungeonProgress(progress)).toBe(false);
  });
  it("has valid anchored frames for every supplied action and four directions", () => {
    for (const species of ["cat", "dog"] as const)
      for (const action of Object.keys(PET_ART[species].animations))
        for (const direction of ["south", "north", "east", "west"] as const) {
          const pose = petSpritePose(
            species,
            action as "walk",
            direction,
            0.6,
            false,
          );
          expect(PET_ART[species].frames).toHaveProperty(pose.frame);
          expect(Number.isFinite(pose.originX)).toBe(true);
          expect(Number.isFinite(pose.originY)).toBe(true);
          expect(pose.scale).toBeGreaterThan(0);
        }
  });
});
