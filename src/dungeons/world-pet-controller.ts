import {canAdoptPet, homePet} from '../systems/pet-shelter';
import {ShelterResidents} from './shelter-residents';
import { installAmbientBirds } from '../ambient-birds';
import { PET_SPECIES } from './config';
import type Phaser from "phaser";
import type { SaveData } from "../types";
import type { GameUI } from "../ui";
import { WorldCompanion, type CompanionMap } from "./world-companion";
import { petFreePoint, type PetPoint } from "./world-pet-state";
import { petPortrait, setupPetArt } from "./pet-sprites";
import type { PetCommand, PetMenuView } from "./pet-menu";
import type { CompanionQuickPanel } from './companion-quick-panel';
export interface WorldPetContext extends CompanionMap {
  save: SaveData;
  player: PetPoint;
  enabled: boolean;
  canMove: boolean;
}
const controllerSlot = Symbol.for("after-rain-world-pet-controller");
type CompanionScene = Phaser.Scene & { [controllerSlot]?: WorldPetController };
export const getWorldPetController = (scene: Phaser.Scene) =>
  (scene as CompanionScene)[controllerSlot];
export function installWorldCompanion(
  scene: Phaser.Scene,
  context: () => WorldPetContext,
  ui: GameUI,
  persist: () => boolean,
): void {
  if (getWorldPetController(scene)) return;
  installAmbientBirds(scene, context);
  const controller = new WorldPetController(scene, context, ui, persist);
  (scene as CompanionScene)[controllerSlot] = controller;
  const update = (_time: number, delta: number) =>
    controller.update(Math.min(0.1, Math.max(0, delta / 1000)));
  scene.events.on("postupdate", update);
  scene.events.once("shutdown", () => {
    scene.events.off("postupdate", update);
    controller.destroy();
    if (getWorldPetController(scene) === controller)
      delete (scene as CompanionScene)[controllerSlot];
  });
  controller.update(0);
}
export class WorldPetController {
  companion?: WorldCompanion;
  private residents?: ShelterResidents;
  private quickPanel?: CompanionQuickPanel;
  private key = "";
  private save?: SaveData;
  constructor(
    private readonly scene: Phaser.Scene,
    private readonly context: () => WorldPetContext,
    private readonly ui: GameUI,
    private readonly persist: () => boolean,
  ) {}
  update(dt: number): void {
    const c = this.context();
    if (this.quickPanel && !this.quickPanel.element.isConnected) {
      this.quickPanel.destroy();
      this.quickPanel = undefined;
    }
    if (c.save.petShelter?.stage === 3) this.residents ??= new ShelterResidents(this.scene);
    this.residents?.update(c, dt);
    if (!c.enabled) {
      this.companion?.setVisible(false);
      this.quickPanel?.hide();
      return;
    }
    this.quickPanel ??= this.ui.createCompanionQuickPanel?.(command => this.command(command));
    const pet = c.save.dungeons?.pets.find(
        (p) => p.id === c.save.dungeons?.selectedPet && p.world?.mode !== "shelter",
      ),
      key = pet ? `${pet.id}:${c.area}:${c.space}` : "";
    if (key !== this.key || c.save !== this.save) {
      this.companion?.destroy();
      this.companion = undefined;
      this.key = key;
      this.save = c.save;
      if (pet) {
        setupPetArt(this.scene);
        this.companion = new WorldCompanion(
          this.scene,
          c.save,
          c.player,
          (text) => this.ui.toast(text),
          c,
        );
      }
    }
    this.companion?.update(c.canMove ? dt : 0, c.player);
    this.quickPanel?.update({
      pets: c.save.dungeons?.pets ?? [], selected: c.save.dungeons?.selectedPet,
      nearby: !!this.companion?.image.visible, icons: {},
    }, true, !this.ui.isModalOpen());
  }
  private view(): PetMenuView {
    const c = this.context(),
      p = c.save.dungeons,
      icons: Record<string, string> = {};
    setupPetArt(this.scene);
    for (const species of PET_SPECIES) {
      for (const rare of [false, true]) {
        icons[`${species}${rare ? "-rare" : ""}`] = petPortrait(
          this.scene,
          species,
          rare,
        );
      }
    }
    return {
      pets: p?.pets ?? [],
      selected: p?.selectedPet,
      nearby: !!this.companion?.image.visible,
      icons,
      shelterReady: c.save.petShelter?.stage === 3,
      adoptionAvailable: canAdoptPet(c.save),
    };
  }
  openMenu(): void {
    this.update(0);
    this.ui.showCompanions(
      () => this.view(),
      (command) => this.command(command),
    );
  }
  command(command: PetCommand): boolean {
    const c = this.context(),
      p = c.save.dungeons;
    if (!p) return false;
    const before = structuredClone(p);
    let transition: "sit" | "stand" | undefined;
    if (command.kind === "shelter") {
      const result = homePet(c.save, p.selectedPet??'');
      if(!result.ok){this.ui.toast(result.message);return false;}
    } else if (command.kind === "select") {
      if (command.id && !p.pets.some((pet) => pet.id === command.id))
        return false;
      p.selectedPet = command.id;
    } else {
      const pet = p.pets.find((pet) => pet.id === p.selectedPet);
      if (!pet) return false;
      if (command.kind === "stay") {
        if (!this.companion?.image.visible) return false;
        pet.world = {
          mode: "stay",
          area: c.area,
          space: c.space,
          x: this.companion.image.x,
          y: this.companion.image.y,
          direction: pet.world?.direction ?? "south",
        };
        transition = "sit";
      } else {
        const existing =
          pet.world?.area === c.area && pet.world.space === c.space;
        const point = petFreePoint(
          command.kind === "follow" && existing ? pet.world! : c.player,
          c.blockedPoint,
        );
        if (!point) {
          this.ui.toast(
            "Aproxime-se de um chão livre para chamar o companheiro.",
          );
          return false;
        }
        pet.world = {
          mode: "follow",
          area: c.area,
          space: c.space,
          ...point,
          direction: pet.world?.direction ?? "south",
        };
        transition = "stand";
      }
    }
    if (!this.persist()) {
      c.save.dungeons = before;
      this.save = undefined;
      this.update(0);
      this.ui.toast(
        "Não foi possível salvar o comando. A alteração foi desfeita.",
      );
      return false;
    }
    this.save = undefined;
    this.update(0);
    if (transition) this.companion?.playTransition(transition);
    this.ui.toast(
      command.kind === "stay"
        ? "Seu companheiro vai esperar aqui."
        : command.kind === "recall"
          ? "Seu companheiro voltou para perto."
          : "Companheiro atualizado.",
    );
    return true;
  }
  destroy(): void {
    this.quickPanel?.destroy();
    this.quickPanel = undefined;
    this.residents?.destroy();
    this.residents = undefined;
    this.companion?.destroy();
    this.companion = undefined;
    this.key = "";
  }
}
