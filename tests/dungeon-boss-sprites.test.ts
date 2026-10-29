import { describe, it, expect } from "vitest";
import { bossSpritePose, type BossDirection } from "../src/dungeons/boss-sprites";
import demolisher from "../public/assets/visual/dungeons/boss-demolisher.json";
import sentinel from "../public/assets/visual/dungeons/boss-sentinel.json";

const directions: BossDirection[] = ["south", "west", "east", "north"];
describe.each([["demolisher", demolisher], ["sentinel", sentinel]] as const)("supplied %s animation", (art, manifest) => {
  it.each(directions)("plays four walk frames and a separate stationary pose facing %s", direction => {
    const walking = [0, 0.2, 0.4, 0.6].map(t => bossSpritePose(art, direction, t, false));
    expect(new Set(walking.map(p => p.frame)).size).toBe(4);
    const idle = bossSpritePose(art, direction, 3.7, true);
    expect(idle.frame).toBe("idle-" + direction);
    expect(walking.some(p => p.frame === idle.frame)).toBe(false);
    for (const pose of [...walking, idle]) {
      expect(manifest.frames).toHaveProperty(pose.frame);
      expect(pose.referenceHeight).toBe(184);
      expect(pose.originX).toBe(0.5);
      expect(pose.originY).toBeGreaterThan(0.85);
      expect(pose.originY).toBeLessThan(0.95);
    }
    expect(new Set([...walking, idle].map(p => p.originY)).size).toBe(1);
  });
  it("uses only four cardinal directions and retains every supplied frame's full 256px canvas", () => {
    expect(Object.keys(manifest.frames)).toHaveLength(20);
    expect(Object.keys(manifest.animation.pivots).sort()).toEqual([...directions].sort());
    for (const [key, frame] of Object.entries(manifest.frames)) {
      expect(key).toMatch(/^(south|west|east|north)-[0-3]$|^idle-(south|west|east|north)$/);
      expect(frame.width).toBe(256);
      expect(frame.height).toBe(256);
    }
  });
});
it("keeps the other bosses' existing sprite presentation", () => {
    for (const art of ["chained", "contaminated", "devourer"]) {
      expect(bossSpritePose(art, "west", 0.4, false)).toEqual({frame: "west-2", originX: 0.5, originY: 1, referenceHeight: undefined});
    }
  });
