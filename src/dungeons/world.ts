import type Phaser from "phaser";
import { MAP_OBSTACLES, DUNGEON_TREES, urbanOriginX } from "./maps";
import type { DungeonId } from "./config";
import { DUNGEON_ART } from "./art";

export function dungeonMapCanvas(
  scene: Phaser.Scene,
  id: DungeonId,
  scale = 1,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = 3072 * scale;
  canvas.height = 2304 * scale;
  const c = canvas.getContext("2d")!;
  c.scale(scale, scale);
  c.imageSmoothingEnabled = false;
  const asphalt = scene.textures.get("city-forest-art").get("asphalt"),
    tile = document.createElement("canvas");
  tile.width = 96;
  tile.height = 96;
  tile
    .getContext("2d")!
    .drawImage(
      asphalt.source.image as HTMLImageElement,
      asphalt.cutX,
      asphalt.cutY,
      asphalt.cutWidth,
      asphalt.cutHeight,
      0,
      0,
      96,
      96,
    );
  c.fillStyle = c.createPattern(tile, "repeat")!;
  c.fillRect(0, 0, 3072, 2304);
  if (id === "abandoned-central-square") {
    c.fillStyle = "#7d8178";
    c.fillRect(650, 550, 1770, 1260);
    c.strokeStyle = "#626c63";
    c.lineWidth = 2;
    for (let x = 650; x < 2420; x += 64) {
      c.beginPath();
      c.moveTo(x, 550);
      c.lineTo(x, 1810);
      c.stroke();
    }
    for (let y = 550; y < 1810; y += 64) {
      c.beginPath();
      c.moveTo(650, y);
      c.lineTo(2420, y);
      c.stroke();
    }
    const lawn = scene.textures
      .get("asset-ground-grass")
      .getSourceImage() as HTMLImageElement;
    c.fillStyle = c.createPattern(lawn, "repeat")!;
    for (const [x, y] of [
      [830, 650],
      [1900, 650],
      [830, 1420],
      [1900, 1420],
    ]) {
      c.beginPath();
      c.roundRect(x, y, 350, 250, 65);
      c.fill();
      c.strokeStyle = "#687767";
      c.lineWidth = 5;
      c.stroke();
    }
    c.strokeStyle = "#b0b09a";
    c.lineWidth = 3;
    c.setLineDash([32, 24]);
    for (const x of [480, 2600]) {
      c.beginPath();
      c.moveTo(x, 0);
      c.lineTo(x, 2304);
      c.stroke();
    }
    c.setLineDash([]);
  } else {
    c.strokeStyle = "#b4b29a";
    c.lineWidth = 3;
    for (let row = 0; row < 4; row++)
      for (let col = 0; col < 10; col++) {
        const x = 365 + col * 265,
          y = 520 + row * 300;
        c.strokeRect(x, y, 150, 170);
      }
  }
  c.fillStyle = "#263a3555";
  for (let i = 0; i < 3000; i++) {
    const x = (i * 197) % 3072,
      y = (i * 331) % 2304;
    c.fillRect(x, y, (i % 3) + 1, 1);
  }
  return canvas;
}
export function dungeonPreview(scene: Phaser.Scene, id: DungeonId): string {
  const canvas = dungeonMapCanvas(scene, id, 0.25),
    c = canvas.getContext("2d")!;
  c.setTransform(0.25, 0, 0, 0.25, 0, 0);
  const source = scene.textures
    .get("dungeon-urban")
    .getSourceImage() as HTMLImageElement;
  for (const p of [...MAP_OBSTACLES[id]].sort((a, b) => a.y - b.y)) {
    const r = DUNGEON_ART.urban.frames[p.kind],
      scale = Math.min(p.width / r.width, p.height / r.height),
      w = r.width * scale,
      h = r.height * scale;
    c.drawImage(
      source,
      r.x,
      r.y,
      r.width,
      r.height,
      p.x - w * urbanOriginX(p.kind),
      p.y - h,
      w,
      h,
    );
  }
  return canvas.toDataURL();
}
export class DungeonWorld {
  readonly objects: Phaser.GameObjects.GameObject[];
  constructor(scene: Phaser.Scene, id: DungeonId) {
    const before = new Set(scene.children.list),
      key = "dungeon-ground-" + id;
    if (!scene.textures.exists(key))
      scene.textures.addCanvas(key, dungeonMapCanvas(scene, id))!.setFilter(0);
    scene.add.image(0, 0, key).setOrigin(0).setDepth(-100);
    for (const p of MAP_OBSTACLES[id]) {
      const r = DUNGEON_ART.urban.frames[p.kind];
      scene.add
        .image(p.x, p.y, "dungeon-urban", p.kind)
        .setOrigin(urbanOriginX(p.kind), 1)
        .setScale(Math.min(p.width / r.width, p.height / r.height))
        .setDepth(p.y)
        .setData("dungeon-obstacle", p.id);
    }
    for (const t of DUNGEON_TREES[id])
      scene.add
        .image(t.x, t.y, "asset-tree-" + t.variant)
        .setOrigin(0.5, 256 / 264)
        .setDisplaySize(144, 188)
        .setDepth(t.y);
    this.objects = scene.children.list.filter((o) => !before.has(o));
  }
  destroy(): void {
    this.objects.forEach((o) => o.destroy());
  }
}
