import { describe, it, expect } from "vitest";
import { petRescueMarker } from "../src/dungeons/pet-rescue-marker";
const view = { x: 0, y: 0, width: 1000, height: 800 };
const screen = { x: 0, y: 0, width: 1000, height: 800 };
describe("pet rescue marker", () => {
  it("points toward the pet as the player moves around it", () => {
    const pet = { x: 500, y: 400 };
    expect(petRescueMarker({ x: 300, y: 400 }, pet, view, screen).angle).toBe(
      0,
    );
    expect(petRescueMarker({ x: 500, y: 600 }, pet, view, screen).angle).toBe(
      -90,
    );
    expect(petRescueMarker({ x: 700, y: 400 }, pet, view, screen).angle).toBe(
      180,
    );
  });
  it("keeps offscreen pets on screen and away from top and bottom HUD", () => {
    for (const pet of [
      { x: -10000, y: -10000 },
      { x: 10000, y: 10000 },
    ]) {
      const marker = petRescueMarker({ x: 500, y: 400 }, pet, view, screen);
      expect(marker.x).toBeGreaterThanOrEqual(90);
      expect(marker.x).toBeLessThanOrEqual(910);
      expect(marker.y).toBeGreaterThanOrEqual(150);
      expect(marker.y).toBeLessThanOrEqual(650);
    }
  });
  it("follows camera movement, zoom and canvas offset", () => {
    const pet = { x: 600, y: 450 },
      player = { x: 500, y: 400 };
    const a = petRescueMarker(player, pet, view, screen);
    const b = petRescueMarker(
      player,
      pet,
      { x: 100, y: 50, width: 500, height: 400 },
      { x: 20, y: 30, width: 500, height: 400 },
    );
    expect(a.x).toBe(600);
    expect(a.y).toBe(392);
    expect(b.x).toBe(430);
    expect(b.y).toBe(280);
    expect(b.angle).toBe(a.angle);
  });
  it("uses proximity feedback without overflowing a narrow screen", () => {
    const m = petRescueMarker({ x: 0, y: 0 }, { x: 30, y: 30 }, view, {
      x: 0,
      y: 0,
      width: 320,
      height: 500,
    });
    expect(m.near).toBe(true);
    expect(m.x).toBeGreaterThanOrEqual(90);
    expect(m.y).toBeGreaterThanOrEqual(150);
  });
});
