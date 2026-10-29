import type Phaser from "phaser";
import type { MapEditData } from "./systems/map-editor";
import { terrainPaintAlpha } from "./data/terrain-paint";
import { readTerrainSprites } from "./terrain-sprites";
import { readVillagePaving } from "./village-scenery-art";
import { villageNorthRoadSurface } from "./data/village-north-road";
/** Bake once per map visit; original terrain art and the passage collision stay intact. */
export function drawVillageNorthRoad(
  scene: Phaser.Scene,
  edits?: MapEditData,
  namespace = "village",
): void {
  const key = namespace + "-north-connection-v2";
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const canvas = document.createElement("canvas");
  canvas.width = 3072;
  canvas.height = 524;
  const c = canvas.getContext("2d")!,
    sprites = readTerrainSprites(scene),
    paving = readVillagePaving(scene, "village-path-paving-source");
  if (sprites) {
    const dirt = sprites["path-dry"],
      stone = paving ?? sprites.paving;
    const left = 1392,
      width = 256,
      pixels = c.createImageData(width, 524);
    for (let y = 0; y < 524; y++)
      for (let localX = 0; localX < width; localX++) {
        const x = left + localX,
          surface = villageNorthRoadSurface(x, y);
        if (surface.coverage <= 0) continue;
        const dirtAt = ((y % dirt.size) * dirt.size + (x % dirt.size)) * 4,
          stoneAt = ((y % stone.size) * stone.size + (x % stone.size)) * 4;
        const along = y < 496 ? y : 496 + 1616 - x,
          phase = along / 14 - Math.floor(along / 14);
        const shade =
          (phase < 0.075 ? 0.66 : 1) * (0.96 + Math.sin(along * 0.11) * 0.04);
        const colors = [164, 156, 136];
        const authored = edits?.terrain[
          `${Math.floor(x / 32)},${Math.floor(y / 32)}`
        ]
          ? terrainPaintAlpha(edits.terrain, x, y)
          : 0;
        const at = (y * width + localX) * 4;
        for (let channel = 0; channel < 3; channel++) {
          const base =
            dirt.pixels[dirtAt + channel] * (1 - surface.stone) +
            stone.pixels[stoneAt + channel] * surface.stone;
          pixels.data[at + channel] =
            base * (1 - surface.curb) + colors[channel] * shade * surface.curb;
        }
        pixels.data[at + 3] = Math.round(
          surface.coverage * (1 - authored) * 255,
        );
      }
    c.putImageData(pixels, left, 0);
  } else {
    c.strokeStyle = "#a68e65";
    c.lineWidth = 48;
    c.lineJoin = "round";
    c.beginPath();
    c.moveTo(1616, 0);
    c.lineTo(1616, 496);
    c.lineTo(1424, 496);
    c.lineTo(1424, 464);
    c.stroke();
  }
  scene.textures.addCanvas(key, canvas)?.setFilter(0);
  scene.add.image(0, 0, key).setOrigin(0).setDepth(-99);
}
