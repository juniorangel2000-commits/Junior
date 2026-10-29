import courier from "../../public/assets/visual/dungeons/zombie-courier.json";
import resident from "../../public/assets/visual/dungeons/zombie-resident.json";
import type { BossDirection } from "./boss-sprites";

/** Stable visual variety: IDs survive save/load and do not consume combat RNG. */
export function enemySpritePose(id: number, direction: BossDirection, elapsed: number, runner: boolean) {
  const variant = id % 2;
  const manifest = variant === 1 ? courier : resident;
  const frameRate = runner ? 9 : 5;
  const animation = manifest.animation;
  return {
    texture: variant === 1 ? "dungeon-zombie-courier" : "dungeon-zombie-resident",
    frame: `${direction}-${Math.floor(elapsed * frameRate) % animation.walkFrames}`,
    originX: animation.pivots[direction].x / animation.canvasSize,
    originY: animation.pivots[direction].y / animation.canvasSize,
    referenceHeight: animation.referenceHeight,
  };
}
