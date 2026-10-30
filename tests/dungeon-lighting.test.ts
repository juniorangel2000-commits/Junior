import { describe, it, expect } from "vitest";
import {
  dungeonLightSources,
  dungeonLightingState,
} from "../src/dungeons/lighting";
describe("dungeon lighting presentation", () => {
  it("anchors light sources to the existing lamps in both maps", () => {
    for (const id of ["abandoned-central-square", "mall-parking"] as const) {
      const lights = dungeonLightSources(id);
      expect(lights.length).toBeGreaterThan(0);
      expect(lights.length).toBeLessThanOrEqual(8);
      for (const light of lights) {
        expect(light.bulbY).toBeLessThan(light.y);
        expect(light.x).toBeGreaterThan(0);
        expect(light.x).toBeLessThan(3072);
        expect(light.y).toBeLessThan(2304);
        expect(light.radius).toBeLessThan(220);
      }
    }
  });
  it("honors disabled lighting and zero intensity", () => {
    for (const settings of [
      { daylight: true, dynamicLighting: false, intensity: 1 },
      { daylight: true, dynamicLighting: true, intensity: 0 },
    ]) {
      const profile = dungeonLightingState(settings, 12);
      expect(profile.visible).toBe(false);
      expect(profile.shadowAlpha).toBe(0);
      expect(profile.bulbAlpha).toBe(0);
    }
  });
  it("uses a gentle repeatable variation, frozen when simulation time is paused", () => {
    const settings = { daylight: true, dynamicLighting: true, intensity: 1 };
    const values = Array.from(
      { length: 200 },
      (_, i) => dungeonLightingState(settings, i / 10).bulbAlpha,
    );
    expect(Math.max(...values) - Math.min(...values)).toBeLessThan(0.031);
    expect(Math.max(...values)).toBeLessThan(0.4);
    expect(dungeonLightingState(settings, 8)).toEqual(
      dungeonLightingState(settings, 8),
    );
  });
});
