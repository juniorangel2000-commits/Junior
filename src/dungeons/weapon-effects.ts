import type Phaser from "phaser";
/** Projectile aliases use the new arrow art. Original PNGs remain untouched. */
export function setupWeaponEffects(scene: Phaser.Scene): void {
  for (const [key, frame] of [
    ["dungeon-arrow", "arrow"],
    ["dungeon-arrow-evolved", "arrow-evolved"],
  ] as const) {
    if (scene.textures.exists(key)) continue;
    const source = scene.textures.get("dungeon-weapons").get(frame);
    const canvas = document.createElement("canvas");
    canvas.width = source.cutWidth;
    canvas.height = source.cutHeight;
    canvas
      .getContext("2d")!
      .drawImage(
        source.source.image as HTMLImageElement,
        source.cutX,
        source.cutY,
        source.cutWidth,
        source.cutHeight,
        0,
        0,
        canvas.width,
        canvas.height,
      );
    scene.textures.addCanvas(key, canvas)!.setFilter(0);
  }
}
