import { describe, it, expect } from "vitest";
import { WEAPONS, type WeaponId } from "../src/dungeons/config";
import {
  WEAPON_EVOLUTIONS,
  weaponSpriteFrame,
  swordHalfArc,
} from "../src/dungeons/weapon-identity";
import {
  attackSpritePose,
  weaponDisplaySize,
} from "../src/dungeons/weapon-presentation";
import { drawWeaponEffects } from "../src/dungeons/weapon-render";
import { DungeonRun, type AttackEffect } from "../src/dungeons/run";
import { createDungeonProgress } from "../src/dungeons/progression";
import atlas from "../public/assets/visual/dungeons/weapons-remake.json";
import type Phaser from "phaser";
const ids = Object.keys(WEAPONS) as WeaponId[];
const effect = (weapon: WeaponId, ttl: number, variant = 0): AttackEffect => ({
  id: 1,
  weapon,
  x: 300,
  y: 300,
  angle: 0,
  ttl,
  variant,
});
describe("weapon visual remake", () => {
  it("has a dedicated base and evolved frame for all seven weapons", () => {
    for (const id of ids) {
      const base = weaponSpriteFrame(id, {}),
        evolved = weaponSpriteFrame(id, { [WEAPON_EVOLUTIONS[id].id]: 1 });
      expect(base).not.toBe(evolved);
      expect(atlas.frames).toHaveProperty(base);
      expect(atlas.frames).toHaveProperty(evolved);
    }
  });
  it("keeps the sword inside its frontal arc and reverses the alternate cut", () => {
    for (const wide of [0, 1, 2])
      for (const ttl of [0.22, 0.18, 0.11, 0.04, 0]) {
        const first = attackSpritePose(effect("sword", ttl), 90, wide);
        const second = attackSpritePose(effect("sword", ttl, 1), 90, wide);
        expect(Math.abs(first.angle)).toBeLessThanOrEqual(swordHalfArc(wide));
        expect(first.angle).toBeCloseTo(-second.angle);
      }
  });
  it("keeps the spear tip within its real reach throughout the thrust", () => {
    for (const range of [85, 120, 160])
      for (let i = 0; i <= 22; i++) {
        const pose = attackSpritePose(effect("spear", i / 100), range, 0);
        expect(pose.x - 300 + pose.width / 2).toBeLessThanOrEqual(
          range + 0.001,
        );
      }
  });
  it("keeps upgraded sword art small instead of scaling it with combat reach", () => {
    const basic = attackSpritePose(effect("sword", 0.11), 64, 0),
      upgraded = attackSpritePose(effect("sword", 0.11), 180, 2, true);
    expect(basic.width).toBeLessThanOrEqual(36);
    expect(upgraded.width).toBeLessThanOrEqual(36);
    expect(upgraded.width).toBe(basic.width);
  });
  it("preserves the source proportions of every base and evolved weapon", () => {
    for (const id of [...ids, "arrow"] as const)
      for (const evolved of [false, true]) {
        const size = weaponDisplaySize(id, evolved),
          frame =
            atlas.frames[
              `${id}${evolved ? "-evolved" : ""}` as keyof typeof atlas.frames
            ];
        expect(size.width / size.height).toBeCloseTo(
          frame.width / frame.height,
        );
        expect(Math.max(size.width, size.height)).toBeLessThanOrEqual(60);
      }
  });
  it("draws all attack types without changing combat state or effect lifetimes", () => {
    const run = new DungeonRun(
      "visual-test",
      "abandoned-central-square",
      createDungeonProgress(),
    );
    run.effects.push(...ids.map((id) => effect(id, 0.11)));
    const before = JSON.stringify({
      state: run.snapshot(),
      effects: run.effects,
    });
    const calls: unknown[][] = [];
    const graphics = new Proxy(
      {},
      {
        get:
          (_, method) =>
          (...args: unknown[]) => {
            calls.push([method, ...args]);
            for (const arg of args)
              if (typeof arg === "number")
                expect(Number.isFinite(arg)).toBe(true);
            return graphics;
          },
      },
    ) as Phaser.GameObjects.Graphics;
    drawWeaponEffects(graphics, run);
    expect(calls.length).toBeLessThan(200);
    expect(calls.length).toBeGreaterThan(20);
    expect(
      JSON.stringify({ state: run.snapshot(), effects: run.effects }),
    ).toBe(before);
  });
});
