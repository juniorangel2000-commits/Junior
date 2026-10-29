import type Phaser from "phaser";
/** Small projectile/effect textures generated in memory; official PNGs stay intact. */
export function setupWeaponEffects(scene: Phaser.Scene): void {
  for (const [key, color] of [
    ["dungeon-arrow", 0xd9ddd3],
    ["dungeon-arrow-evolved", 0xf0c66d],
  ] as const) {
    if (scene.textures.exists(key)) continue;
    const ink = scene.add.graphics();
    ink.fillStyle(0x393a30).fillRect(2, 3, 27, 4);
    ink.fillStyle(0xa08255).fillRect(4, 4, 23, 2);
    ink.fillStyle(color).fillTriangle(24, 1, 32, 5, 24, 9);
    ink.fillStyle(color).fillRect(2, 2, 5, 2).fillRect(2, 6, 5, 2);
    ink.generateTexture(key, 33, 10);
    ink.destroy();
  }
}
