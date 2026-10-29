import type Phaser from "phaser";
import {
  MAP_OBSTACLES,
  DUNGEON_TREES,
  PARKING_BAYS,
  PARK_LAWNS,
  urbanOriginX,
} from "./maps";
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
  // Quiet the ground texture so silhouettes and experience remain readable.
  c.fillStyle = "#25303399";
  c.fillRect(0, 0, 3072, 2304);
  const grass = scene.textures
    .get("asset-ground-grass")
    .getSourceImage() as HTMLImageElement;
  const grassPattern = c.createPattern(grass, "repeat")!;
  const lawn = (x: number, y: number, w: number, h: number, r = 60) => {
    c.save();
    c.beginPath();
    c.roundRect(x, y, w, h, r);
    c.clip();
    c.fillStyle = grassPattern;
    c.fillRect(x, y, w, h);
    c.fillStyle = "#283a2e55";
    c.fillRect(x, y, w, h);
    c.restore();
  };
  if (id === "abandoned-central-square") {
    // A park square with a continuous circuit and four broad ways through it.
    c.fillStyle = "#48534a";
    c.beginPath();
    c.roundRect(585, 480, 1900, 1400, 160);
    c.fill();
    c.save();
    c.beginPath();
    c.roundRect(610, 505, 1850, 1350, 145);
    c.clip();
    c.fillStyle = "#878776";
    c.fillRect(610, 505, 1850, 1350);
    for (let y = 500, row = 0; y < 1870; y += 24, row++)
      for (let x = 590 - (row % 2) * 16; x < 2480; x += 32) {
        const worn = (((x * 13 + y * 7) % 23) + 23) % 23;
        c.fillStyle = ["#777d70", "#7e8274", "#868777"][worn % 3];
        c.fillRect(x + 1, y + 1, 30, 22);
        if (worn === 0) {
          c.fillStyle = "#9a998444";
          c.fillRect(x + 5, y + 5, 12, 1);
        }
      }
    c.fillStyle = "#434c4733";
    c.fillRect(610, 505, 1850, 1350);
    c.restore();
    for (const bed of PARK_LAWNS) {
      c.strokeStyle = "#a09b7b";
      c.lineWidth = 7;
      c.beginPath();
      c.roundRect(bed.x - 3, bed.y - 3, bed.w + 6, bed.h + 6, 65);
      c.stroke();
      lawn(bed.x, bed.y, bed.w, bed.h, 60);
    }
    // Entrance paving joins the perimeter street without closing off circulation.
    for (const [x, y, w, h] of [
      [1375, 300, 320, 240],
      [1375, 1820, 320, 310],
      [360, 1030, 300, 240],
      [2410, 1030, 300, 240],
    ]) {
      c.fillStyle = "#73796c";
      c.fillRect(x, y, w, h);
      c.strokeStyle = "#555e53";
      c.lineWidth = 1;
      for (let px = x; px < x + w; px += 32) {
        c.beginPath();
        c.moveTo(px, y);
        c.lineTo(px, y + h);
        c.stroke();
      }
      for (let py = y; py < y + h; py += 24) {
        c.beginPath();
        c.moveTo(x, py);
        c.lineTo(x + w, py);
        c.stroke();
      }
    }
    // Worn, sparse lane markings leave the outside road easy to distinguish.
    c.strokeStyle = "#aba58b66";
    c.lineWidth = 3;
    c.setLineDash([24, 45]);
    for (const x of [460, 2610]) {
      c.beginPath();
      c.moveTo(x, 420);
      c.lineTo(x, 2040);
      c.stroke();
    }
    c.setLineDash([]);
    for (const [x, y, w, h] of [
      [70, 700, 180, 310],
      [2790, 890, 200, 330],
      [710, 2050, 420, 180],
      [2060, 2060, 410, 180],
    ])
      lawn(x, y, w, h, 80);
  } else {
    // Cars stay on the sides. The center is a broad arena and north/south route.
    c.fillStyle = "#54635a44";
    c.fillRect(1110, 470, 820, 1510);
    c.strokeStyle = "#b6b19766";
    c.lineWidth = 2;
    for (const [i, bay] of PARKING_BAYS.entries()) {
      c.setLineDash(i % 4 === 0 ? [16, 5] : []);
      c.beginPath();
      c.moveTo(bay.x - 70, bay.y + 170);
      c.lineTo(bay.x - 70, bay.y);
      c.lineTo(bay.x + 70, bay.y);
      c.lineTo(bay.x + 70, bay.y + 170);
      c.stroke();
    }
    c.setLineDash([]);
    c.fillStyle = "#969e8c55";
    for (const y of [780, 1450, 2020]) {
      c.beginPath();
      c.moveTo(1536, y - 40);
      c.lineTo(1508, y);
      c.lineTo(1525, y);
      c.lineTo(1525, y + 45);
      c.lineTo(1547, y + 45);
      c.lineTo(1547, y);
      c.lineTo(1564, y);
      c.closePath();
      c.fill();
    }
    c.fillStyle = "#797e6c";
    c.fillRect(1150, 370, 770, 60);
    for (let x = 1160; x < 1900; x += 40) {
      c.fillStyle = x % 80 === 0 ? "#b2aa86" : "#757b67";
      c.fillRect(x, 373, 24, 54);
    }
    for (const [x, y, w, h] of [
      [55, 580, 190, 330],
      [2820, 550, 190, 370],
      [60, 1270, 170, 400],
      [2830, 1260, 170, 400],
      [470, 2100, 430, 160],
      [2200, 2100, 420, 160],
    ])
      lawn(x, y, w, h, 75);
    for (let i = 0; i < 28; i++) {
      const bay = PARKING_BAYS[i % PARKING_BAYS.length];
      c.fillStyle = "#101a1b33";
      c.beginPath();
      c.ellipse(
        bay.x + (i % 3) * 9,
        bay.y + 65,
        17 + (i % 13),
        7 + (i % 5),
        i * 0.7,
        0,
        Math.PI * 2,
      );
      c.fill();
    }
  }
  // Cracks, windblown litter and moss are baked once rather than live objects.
  for (let i = 0; i < 95; i++) {
    const x = 90 + ((i * 587) % 2860),
      y = 360 + ((i * 313) % 1760);
    c.strokeStyle = "#111e1d55";
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x + 7, y + 11);
    c.lineTo(x + 3, y + 18);
    c.lineTo(x + 11, y + 26);
    c.stroke();
    if (i % 4 === 0) {
      c.fillStyle = "#adb09a55";
      c.fillRect(x + 12, y + 8, 4, 2);
    }
  }
  const shade = c.createRadialGradient(1536, 1152, 600, 1536, 1152, 1900);
  shade.addColorStop(0, "#0f211b00");
  shade.addColorStop(1, "#10251e88");
  c.fillStyle = shade;
  c.fillRect(0, 0, 3072, 2304);
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
  const entries = [
    ...MAP_OBSTACLES[id].map((p) => ({
      y: p.y,
      prop: p,
      tree: undefined as (typeof DUNGEON_TREES)[DungeonId][number] | undefined,
    })),
    ...DUNGEON_TREES[id].map((t) => ({
      y: t.y,
      prop: undefined as (typeof MAP_OBSTACLES)[DungeonId][number] | undefined,
      tree: t,
    })),
  ].sort((a, b) => a.y - b.y);
  for (const entry of entries) {
    if (entry.tree) {
      const t = entry.tree,
        image = scene.textures
          .get("asset-tree-" + t.variant)
          .getSourceImage() as HTMLImageElement;
      c.drawImage(image, t.x - 72, t.y - 188 * (256 / 264), 144, 188);
      continue;
    }
    const p = entry.prop!,
      r = DUNGEON_ART.urban.frames[p.kind],
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
