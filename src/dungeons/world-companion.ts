import type Phaser from "phaser";
import type { SaveData } from "../types";
import type { OwnedPet } from "./progression";
import { claimDungeonMaterials } from "./progression";
import { DUNGEON_ART } from "./art";
import { setupVillagePropAtlas } from "../village-prop-atlas";
import { villageRoute } from "../systems/village-walk";
import {
  cityForestBlockedTile,
  cityForestBlockedPoint,
} from "../data/city-forest";
import { Inventory } from "../systems/inventory";
/** Companion outside combat: follows the new forest's collision grid and
 * helps find one visible fallen branch per game day, without altering old maps. */
export class WorldCompanion {
  private readonly image: Phaser.GameObjects.Image;
  private branch?: Phaser.GameObjects.Image;
  private route: { x: number; y: number }[] = [];
  private recalculate = 0;
  private time = 0;
  private readonly pet: OwnedPet;
  constructor(
    private readonly scene: Phaser.Scene,
    private readonly save: SaveData,
    player: { x: number; y: number },
    private readonly toast: (text: string) => void,
  ) {
    this.pet = save.dungeons!.pets.find(
      (p) => p.id === save.dungeons!.selectedPet,
    )!;
    setupVillagePropAtlas(
      scene,
      "dungeon-pets",
      "dungeon-pets-source",
      DUNGEON_ART.pets,
    );
    if (scene.textures.exists("dungeon-pets-source"))
      scene.textures.remove("dungeon-pets-source");
    this.image = scene.add
      .image(player.x, player.y, "dungeon-pets", this.pet.species + "-south-0")
      .setOrigin(0.5, 1)
      .setScale(this.pet.species === "dog" ? 0.12 : 0.09)
      .setDepth(player.y);
    if (this.pet.rare) this.image.setTint(0xc5ba9b);
    claimDungeonMaterials(save);
  }
  update(dt: number, player: { x: number; y: number }): void {
    if (dt <= 0) return;
    this.time += dt;
    this.recalculate -= dt;
    if (this.save.dungeons!.petForageDay !== this.save.day && !this.branch)
      this.branch = this.scene.add
        .image(28.5 * 32, 56.5 * 32, "asset-new-branches")
        .setOrigin(0.5, 1)
        .setDisplaySize(36, 27)
        .setDepth(56.5 * 32);
    if (
      this.recalculate <= 0 &&
      Math.hypot(player.x - this.image.x, player.y - this.image.y) > 65
    ) {
      this.recalculate = 0.8;
      this.route = villageRoute(
        { x: this.image.x / 32, y: this.image.y / 32 },
        { x: player.x / 32, y: player.y / 32 },
        cityForestBlockedTile,
      ).map((p) => ({ x: (p.x + 0.5) * 32, y: (p.y + 0.5) * 32 }));
    }
    const next = this.route[0],
      before = { x: this.image.x, y: this.image.y };
    if (
      next &&
      Math.hypot(player.x - this.image.x, player.y - this.image.y) > 35
    ) {
      const dx = next.x - this.image.x,
        dy = next.y - this.image.y,
        d = Math.hypot(dx, dy) || 1,
        step = Math.min(d, 110 * (1 + this.pet.attributes.speed * 0.03) * dt),
        x = this.image.x + (dx / d) * step,
        y = this.image.y + (dy / d) * step;
      if (!cityForestBlockedPoint(x, y)) this.image.setPosition(x, y);
      if (d < 3) this.route.shift();
    }
    const dx = this.image.x - before.x,
      dy = this.image.y - before.y,
      walking = Math.hypot(dx, dy) > 0.01;
    if (walking) {
      const direction =
        Math.abs(dx) > Math.abs(dy)
          ? dx < 0
            ? "west"
            : "east"
          : dy < 0
            ? "north"
            : "south";
      this.image.setFrame(
        `${this.pet.species}-${direction}-${Math.floor(this.time * 6) % 2}`,
      );
    }
    this.image.setDepth(this.image.y);
    if (
      this.branch &&
      Math.hypot(this.image.x - this.branch.x, this.image.y - this.branch.y) <
        70 &&
      Math.hypot(player.x - this.branch.x, player.y - this.branch.y) <
        100 + this.pet.attributes.perception * 3
    ) {
      const inventory = new Inventory(this.save.inventory);
      if (inventory.transact({}, { branch: 1 })) {
        Object.assign(this.save.inventory, inventory.data);
        this.save.dungeons!.petForageDay = this.save.day;
        this.branch.destroy();
        this.branch = undefined;
        this.toast("Seu companheiro encontrou um ramo seco.");
      }
    }
  }
  destroy(): void {
    this.image.destroy();
    this.branch?.destroy();
  }
}
