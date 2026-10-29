import { describe, it, expect } from "vitest";
import {
  dungeonBlocked,
  MAP_OBSTACLES,
  DUNGEON_TREES,
} from "../src/dungeons/maps";
import urban from "../public/assets/visual/dungeons/urban.json";
import type { DungeonId } from "../src/dungeons/config";
// Original exact geometry, deliberately independent of the optimized cell index.
function reference(id: DungeonId, x: number, y: number) {
  return (
    x < 32 ||
    y < 48 ||
    x > 3040 ||
    y > 2260 ||
    DUNGEON_TREES[id].some(
      (t) => Math.abs(x - t.x) < 18 && Math.abs(y - t.y) < 12,
    ) ||
    MAP_OBSTACLES[id].some((p) => {
      if (p.kind === "lamp")
        return p.solid && Math.abs(x - p.x) < 9 && y > p.y - 9 && y < p.y + 4;
      const r = urban.frames[p.kind],
        scale = Math.min(p.width / r.width, p.height / r.height),
        w = r.width * scale,
        h = r.height * scale,
        depth = ["sedan", "hatchback", "van", "suv"].includes(p.kind)
          ? h * 0.85
          : ["apartment", "mall", "booth", "shop"].includes(p.kind)
            ? 45
            : h * 0.6;
      return (
        p.solid &&
        Math.abs(x - p.x) < w * 0.36 &&
        y > p.y - depth &&
        y < p.y + 6
      );
    })
  );
}
describe("dungeon collision index", () => {
  it.each(["abandoned-central-square", "mall-parking"] as DungeonId[])(
    "preserves terrain geometry across %s",
    (id) => {
      for (let i = 0; i < 20000; i++) {
        const x = -5 + ((i * 47.173) % 3090),
          y = -5 + ((i * 83.719) % 2320);
        expect(dungeonBlocked(id, x, y), `${x},${y}`).toBe(reference(id, x, y));
      }
      for (const p of MAP_OBSTACLES[id])
        for (const dx of [-150, -9, 0, 9, 150])
          for (const dy of [-130, -9, 0, 4, 6, 12])
            expect(dungeonBlocked(id, p.x + dx, p.y + dy)).toBe(
              reference(id, p.x + dx, p.y + dy),
            );
    },
  );
  it("retains open world boundaries and blocks points just outside them", () => {
    for (const [x, y] of [
      [31.999, 100],
      [3040.001, 100],
      [100, 47.999],
      [100, 2260.001],
    ])
      expect(dungeonBlocked("mall-parking", x, y)).toBe(true);
  });
});
