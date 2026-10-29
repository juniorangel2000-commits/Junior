import demolisher from "../../public/assets/visual/dungeons/boss-demolisher.json";
import sentinel from "../../public/assets/visual/dungeons/boss-sentinel.json";

export type BossDirection = "south" | "west" | "east" | "north";
const suppliedAnimations: Record<string, typeof demolisher.animation> = {
  demolisher: demolisher.animation,
  sentinel: sentinel.animation,
};

/** Full-canvas animations retain their author's spacing and a fixed body scale. */
export function bossSpritePose(
  art: string,
  direction: BossDirection,
  elapsed: number,
  resting: boolean,
) {
  const animation = suppliedAnimations[art];
  if (animation) {
    const pivot = animation.pivots[direction];
    return {
      frame: resting ? "idle-" + direction
        : `${direction}-${Math.floor(elapsed * animation.frameRate) % animation.walkFrames}`,
      originX: pivot.x / animation.canvasSize,
      originY: pivot.y / animation.canvasSize,
      referenceHeight: animation.referenceHeight,
    };
  }
  return {
    frame: `${direction}-${resting ? 0 : Math.floor(elapsed * 5) % 4}`,
    originX: 0.5,
    originY: 1,
    referenceHeight: undefined,
  };
}
