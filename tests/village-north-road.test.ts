import { describe, it, expect } from "vitest";
import { villageNorthRoadSurface } from "../src/data/village-north-road";
describe("north village road surface", () => {
  it("uses dirt at the forest gate and paving where it joins village streets", () => {
    expect(villageNorthRoadSurface(1616, 40).stone).toBe(0);
    expect(villageNorthRoadSurface(1616, 450).stone).toBe(1);
    expect(villageNorthRoadSurface(1450, 496).stone).toBe(1);
  });
  it("keeps the complete existing passage covered without painting distant grass", () => {
    for (let y = 0; y <= 496; y += 8)
      expect(villageNorthRoadSurface(1616, y).coverage).toBe(1);
    for (let x = 1424; x <= 1616; x += 8)
      expect(villageNorthRoadSurface(x, 496).coverage).toBe(1);
    for (const [x, y] of [
      [1500, 50],
      [1700, 250],
      [1350, 480],
    ])
      expect(villageNorthRoadSurface(x, y).coverage).toBe(0);
  });
  it("has varied stone remnants through the transition, with fading curbs", () => {
    const samples = [];
    for (let y = 180; y <= 340; y += 4)
      for (let x = 1604; x <= 1628; x += 4)
        samples.push(villageNorthRoadSurface(x, y).stone);
    expect(Math.min(...samples)).toBe(0);
    expect(Math.max(...samples)).toBe(1);
    expect(villageNorthRoadSurface(1638, 40).curb).toBe(0);
    expect(villageNorthRoadSurface(1638, 440).curb).toBeGreaterThan(0);
  });
});
