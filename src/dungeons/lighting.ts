import type Phaser from "phaser";
import type { DungeonId } from "./config";
import { MAP_OBSTACLES, urbanFrame } from "./maps";
import { getVisualSettings, type VisualSettings } from "../visual-settings";
export function dungeonLightSources(id: DungeonId) {
  return MAP_OBSTACLES[id]
    .filter((p) => p.kind === "lamp")
    .map((p) => {
      const frame = urbanFrame(p.kind),
        scale = Math.min(p.width / frame.width, p.height / frame.height);
      return {
        x: p.x + 18,
        y: p.y + 8,
        bulbX: p.x + 18,
        bulbY: p.y - frame.height * scale * 0.83,
        radius: id === "mall-parking" ? 185 : 165,
      };
    });
}
export function dungeonLightingState(settings: VisualSettings, time: number) {
  const intensity = settings.dynamicLighting ? settings.intensity : 0;
  return {
    visible: intensity > 0,
    groundAlpha: intensity,
    bulbAlpha: intensity * (0.36 + 0.015 * Math.sin(time * 0.65)),
    shadowAlpha: intensity * 0.16,
  };
}
function radial(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
  color: string,
) {
  c.save();
  c.translate(x, y);
  c.scale(rx, ry);
  const gradient = c.createRadialGradient(0, 0, 0, 0, 0, 1);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  c.fillStyle = gradient;
  c.fillRect(-1, -1, 2, 2);
  c.restore();
}
export function paintDungeonFloorShadows(
  c: CanvasRenderingContext2D,
  id: DungeonId,
): void {
  for (const p of MAP_OBSTACLES[id]) {
    radial(
      c,
      p.x + 12,
      p.y + 6,
      Math.max(12, Math.min(90, p.width * 0.52)),
      Math.max(6, Math.min(26, p.width * 0.17)),
      "rgba(5,16,23,.22)",
    );
    if (p.kind === "lamp") {
      c.strokeStyle = "rgba(7,18,25,.17)";
      c.lineWidth = 4;
      c.beginPath();
      c.moveTo(p.x, p.y);
      c.lineTo(p.x + 38, p.y + 26);
      c.stroke();
    }
  }
}
export function paintDungeonFloorLights(
  c: CanvasRenderingContext2D,
  id: DungeonId,
): void {
  for (const light of dungeonLightSources(id))
    radial(
      c,
      light.x,
      light.y,
      light.radius,
      light.radius * 0.64,
      "rgba(255,193,116,.17)",
    );
  if (id === "abandoned-central-square")
    radial(c, 1536, 1148, 170, 105, "rgba(102,175,189,.065)");
}
function layerCanvas(id: DungeonId, lights: boolean) {
  const canvas = document.createElement("canvas");
  canvas.width = 1536;
  canvas.height = 1152;
  const c = canvas.getContext("2d")!;
  c.scale(0.5, 0.5);
  if (lights) paintDungeonFloorLights(c, id);
  else paintDungeonFloorShadows(c, id);
  return canvas;
}
/** Cached soft light, no normal maps, shader pipeline or per-frame canvas uploads. */
export class DungeonLighting {
  readonly shadows: Phaser.GameObjects.Image;
  readonly pools: Phaser.GameObjects.Image;
  readonly bulbs: Phaser.GameObjects.Image[] = [];
  constructor(scene: Phaser.Scene, id: DungeonId) {
    const shadowKey = "dungeon-shadow-" + id,
      lightKey = "dungeon-light-" + id,
      haloKey = "dungeon-lamp-halo";
    if (!scene.textures.exists(shadowKey))
      scene.textures.addCanvas(shadowKey, layerCanvas(id, false));
    if (!scene.textures.exists(lightKey))
      scene.textures.addCanvas(lightKey, layerCanvas(id, true));
    if (!scene.textures.exists(haloKey)) {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 128;
      const c = canvas.getContext("2d")!;
      radial(c, 64, 64, 64, 64, "rgba(255,213,143,.8)");
      scene.textures.addCanvas(haloKey, canvas);
    }
    this.shadows = scene.add
      .image(0, 0, shadowKey)
      .setOrigin(0)
      .setScale(2)
      .setDepth(-80);
    this.pools = scene.add
      .image(0, 0, lightKey)
      .setOrigin(0)
      .setScale(2)
      .setBlendMode("ADD")
      .setDepth(-70);
    for (const light of dungeonLightSources(id))
      this.bulbs.push(
        scene.add
          .image(light.bulbX, light.bulbY, haloKey)
          .setDisplaySize(46, 34)
          .setBlendMode("ADD")
          .setDepth(3900),
      );
    this.update(0);
  }
  update(time: number): void {
    const state = dungeonLightingState(getVisualSettings(), time);
    this.shadows.setVisible(state.visible).setAlpha(state.groundAlpha);
    this.pools.setVisible(state.visible).setAlpha(state.groundAlpha);
    this.bulbs.forEach((bulb) =>
      bulb.setVisible(state.visible).setAlpha(state.bulbAlpha),
    );
  }
  destroy(): void {
    this.shadows.destroy();
    this.pools.destroy();
    this.bulbs.forEach((bulb) => bulb.destroy());
  }
}
