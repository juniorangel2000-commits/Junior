import type Phaser from "phaser";
import type { SaveData } from "../types";
import type { OwnedPet } from "./progression";
import { claimDungeonMaterials } from "./progression";
import { villageRoute } from "../systems/village-walk";
import { cityForestBlockedPoint } from "../data/city-forest";
import { Inventory } from "../systems/inventory";
import {
  petActionDuration,
  petDirection,
  petSpritePose,
  setupPetArt,
  type PetAction,
} from "./pet-sprites";
import {
  petFreePoint,
  type PetPoint,
  type PetWorldArea,
} from "./world-pet-state";
export interface CompanionMap {
  area: PetWorldArea;
  space: string;
  blockedPoint: (x: number, y: number) => boolean;
  forage?: boolean;
}
/** One selected companion; commands and waiting locations live in the game save. */
export class WorldCompanion {
  readonly image: Phaser.GameObjects.Image;
  private branch?: Phaser.GameObjects.Image;
  private route: PetPoint[] = [];
  private recalculate = 0;
  private time = 0;
  private waitTime = 0;
  private transition?: { action: PetAction; age: number };
  private readonly pet: OwnedPet;
  private positioned = false;
  constructor(
    private readonly scene: Phaser.Scene,
    private readonly save: SaveData,
    player: PetPoint,
    private readonly toast: (text: string) => void,
    private readonly map: CompanionMap = {
      area: "cityForest",
      space: "outdoors",
      blockedPoint: cityForestBlockedPoint,
      forage: true,
    },
  ) {
    this.pet = save.dungeons!.pets.find(
      (p) => p.id === save.dungeons!.selectedPet,
    )!;
    setupPetArt(scene);
    const pose = petSpritePose(this.pet.species, "idle", "south", 0);
    this.image = scene.add
      .image(player.x, player.y, pose.texture, pose.frame)
      .setData("world-companion", true);
    if (this.pet.rare) this.image.setTint(0xc5ba9b);
    this.place(player);
    if (map.forage) claimDungeonMaterials(save);
    this.update(0, player);
  }
  private place(player: PetPoint): void {
    const old = this.pet.world;
    if (
      old?.mode === "stay" &&
      (old.area !== this.map.area || old.space !== this.map.space)
    ) {
      this.image.setVisible(false);
      return;
    }
    const same = old?.area === this.map.area && old.space === this.map.space;
    const point = petFreePoint(same ? old : player, this.map.blockedPoint);
    if (!point) {
      this.image.setVisible(false);
      return;
    }
    this.image.setPosition(point.x, point.y).setVisible(true);
    this.positioned = true;
    this.pet.world = {
      mode: old?.mode ?? "follow",
      area: this.map.area,
      space: this.map.space,
      ...point,
      direction: old?.direction ?? "south",
    };
  }
  playTransition(action: "sit" | "stand"): void {
    if (this.pet.species === "cat") this.transition = { action, age: 0 };
    this.route = [];
    this.recalculate = 0;
  }
  setVisible(visible: boolean): void {
    this.image.setVisible(visible && this.positioned);
    this.branch?.setVisible(visible && this.pet.world?.mode !== "stay");
  }
  update(dt: number, player: PetPoint): void {
    if (!this.positioned) {
      this.place(player);
      if (!this.positioned) return;
    }
    const state = this.pet.world!;
    if (state.area !== this.map.area || state.space !== this.map.space) {
      this.image.setVisible(false);
      return;
    }
    this.image.setVisible(true);
    this.time += Math.max(0, dt);
    this.recalculate -= dt;
    if (this.transition) {
      this.transition.age += dt;
      if (
        this.transition.age >=
        petActionDuration(this.pet.species, this.transition.action)
      )
        this.transition = undefined;
    }
    const before = { x: this.image.x, y: this.image.y };
    const distance = Math.hypot(
      player.x - this.image.x,
      player.y - this.image.y,
    );
    if (dt > 0 && state.mode === "follow" && !this.transition) {
      const blockedTile = (x: number, y: number) =>
        this.blocked((x + 0.5) * 32, (y + 0.5) * 32);
      if (this.recalculate <= 0 && distance > 65) {
        this.recalculate = 0.8;
        const goal = petFreePoint(player, this.map.blockedPoint);
        this.route = goal
          ? villageRoute(
              { x: this.image.x / 32, y: this.image.y / 32 },
              { x: goal.x / 32, y: goal.y / 32 },
              blockedTile,
            ).map((p) => ({ x: (p.x + 0.5) * 32, y: (p.y + 0.5) * 32 }))
          : [];
      }
      const speed = distance > 160 ? 104 : 72;
      let remaining = speed * (1 + this.pet.attributes.speed * 0.03) * dt;
      while (this.route.length && remaining > 0 && distance > 35) {
        const next = this.route[0],
          dx = next.x - this.image.x,
          dy = next.y - this.image.y,
          d = Math.hypot(dx, dy);
        if (d < 1) {
          this.route.shift();
          continue;
        }
        const step = Math.min(d, remaining, 4),
          x = this.image.x + (dx / d) * step,
          y = this.image.y + (dy / d) * step;
        if (this.blocked(x, y)) {
          this.route = [];
          this.recalculate = 0;
          break;
        }
        this.image.setPosition(x, y);
        remaining -= step;
        if (d <= step + 0.01) this.route.shift();
        if (Math.hypot(player.x - x, player.y - y) <= 35) break;
      }
    }
    const dx = this.image.x - before.x,
      dy = this.image.y - before.y,
      walking = Math.hypot(dx, dy) > 0.01;
    if (walking) state.direction = petDirection(dx, dy);
    state.x = this.image.x;
    state.y = this.image.y;
    const action =
      this.transition?.action ??
      (state.mode === "stay"
        ? "rest"
        : walking
          ? distance > 160
            ? "run"
            : "walk"
          : "idle");
    this.waitTime =
      state.mode === "stay" && !this.transition
        ? this.waitTime + Math.max(0, dt)
        : 0;
    const restPhase = this.waitTime % 10;
    const restTime =
      restPhase >= 4 &&
      restPhase < 4 + petActionDuration(this.pet.species, "rest")
        ? restPhase - 4
        : 0;
    const pose = petSpritePose(
      this.pet.species,
      action,
      state.direction,
      this.transition?.age ??
        (action === "rest" && this.pet.species === "cat"
          ? restTime
          : this.time),
      !this.transition,
    );
    this.image
      .setTexture(pose.texture, pose.frame)
      .setOrigin(pose.originX, pose.originY)
      .setScale(pose.scale)
      .setDepth(this.image.y);
    this.forage(player, dt > 0 && state.mode === "follow" && !this.transition);
  }
  private blocked(x: number, y: number): boolean {
    return [
      [0, 0],
      [-5, -3],
      [5, -3],
      [-5, 3],
      [5, 3],
    ].some(([dx, dy]) => this.map.blockedPoint(x + dx, y + dy));
  }
  private forage(player: PetPoint, active: boolean): void {
    if (!this.map.forage) return;
    if (
      this.save.dungeons!.petForageDay !== this.save.day &&
      !this.branch &&
      this.scene.textures.exists("asset-new-branches")
    )
      this.branch = this.scene.add
        .image(28.5 * 32, 56.5 * 32, "asset-new-branches")
        .setOrigin(0.5, 1)
        .setDisplaySize(36, 27)
        .setDepth(56.5 * 32);
    this.branch?.setVisible(active);
    if (
      active &&
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
