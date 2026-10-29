import Phaser from "phaser";
import type { SaveData, Tool, ItemId } from "../types";
import type { GameUI } from "../ui";
import { Player } from "../player";
import { gameAudio } from "../audio";
import { saveGame } from "../systems/save";
import {
  DUNGEON_BALANCE as B,
  WEAPONS,
  type DungeonId,
  type WeaponId,
} from "../dungeons/config";
import { DungeonRun } from "../dungeons/run";
import {
  createDungeonProgress,
  applyDungeonResult,
  buyPermanentAttribute,
  claimDungeonMaterials,
} from "../dungeons/progression";
import { preloadDungeonArt, setupDungeonArt } from "../dungeons/art";
import { DungeonWorld, dungeonPreview } from "../dungeons/world";
import { dungeonBlocked } from "../dungeons/maps";
import { DungeonUI } from "../dungeons/ui";
interface DungeonStart {
  save: SaveData;
  ui: GameUI;
  onReturn: (save: SaveData, title?: boolean) => void;
}
export class DungeonScene extends Phaser.Scene {
  private state!: SaveData;
  private gameUI!: GameUI;
  private onReturn!: DungeonStart["onReturn"];
  private ui!: DungeonUI;
  private mode: "travel" | "menu" | "run" = "travel";
  private run?: DungeonRun;
  private player?: Player;
  private world?: DungeonWorld;
  private travelObjects: Phaser.GameObjects.GameObject[] = [];
  private travelElapsed = 0;
  private rain?: Phaser.GameObjects.Graphics;
  private elapsedSave = 0;
  private elapsedHUD = 0;
  private lastPhase = "";
  private settled = false;
  private returning = false;
  private previews!: Record<DungeonId, string>;
  private enemyImages = new Map<number, Phaser.GameObjects.Image>();
  private projectileImages = new Map<number, Phaser.GameObjects.Image>();
  private enemyPool: Phaser.GameObjects.Image[] = [];
  private projectilePool: Phaser.GameObjects.Image[] = [];
  private effects: Phaser.GameObjects.Image[] = [];
  private impactGraphics?: Phaser.GameObjects.Graphics;
  private damageNumbers: Phaser.GameObjects.Text[] = [];
  private lastImpactAt = -1;
  private orbitals: Phaser.GameObjects.Image[] = [];
  private petImage?: Phaser.GameObjects.Image;
  private rescueImage?: Phaser.GameObjects.Image;
  private pickups?: Phaser.GameObjects.Graphics;
  private reward: {
    coins: number;
    xp: number;
    materials?: Partial<Record<ItemId, number>>;
    waiting?: boolean;
  } = { coins: 0, xp: 0 };
  constructor() {
    super("Dungeons");
  }
  preload(): void {
    preloadDungeonArt(this);
  }
  create(data: DungeonStart): void {
    this.state = structuredClone(data.save);
    this.state.activeArea = "cityForest";
    this.state.dungeons ??= createDungeonProgress();
    claimDungeonMaterials(this.state);
    this.gameUI = data.ui;
    this.onReturn = data.onReturn;
    this.returning = false;
    this.settled = false;
    this.run = undefined;
    this.mode = "travel";
    this.travelElapsed = 0;
    this.elapsedSave = 0;
    this.elapsedHUD = 0;
    this.lastPhase = "";
    this.enemyImages.clear();
    this.projectileImages.clear();
    this.enemyPool = [];
    this.projectilePool = [];
    this.effects = [];
    this.damageNumbers = [];
    this.impactGraphics = undefined;
    this.lastImpactAt = -1;
    this.orbitals = [];
    this.petImage = undefined;
    this.rescueImage = undefined;
    setupDungeonArt(this);
    this.cameras.main.setBounds(0, 0, 3072, 2304);
    document.querySelector<HTMLElement>("#ui")!.style.display = "none";
    const icons = Object.fromEntries(
      (Object.keys(WEAPONS) as WeaponId[]).map((id) => [
        id,
        this.textures.getBase64("dungeon-weapons", id),
      ]),
    ) as Record<WeaponId, string>;
    this.previews = {
      "abandoned-central-square": dungeonPreview(
        this,
        "abandoned-central-square",
      ),
      "mall-parking": dungeonPreview(this, "mall-parking"),
    };
    this.ui = new DungeonUI(
      {
        start: (id, pet) => this.startRun(id, pet),
        back: () => this.back(),
        choose: (id) => {
          if (this.run?.choose(id)) {
            this.lastPhase = "";
            this.persist();
          }
        },
        resume: () => {
          this.run?.resume();
          this.lastPhase = "";
        },
        abandon: () => {
          this.run?.abandon();
          this.lastPhase = "";
          this.finish();
        },
        retry: () => this.finish(),
        pet: (id) => {
          const p = this.state.dungeons!,
            before = p.selectedPet;
          p.selectedPet = id;
          if (!this.persist()) p.selectedPet = before;
        },
        evolve: (key, pet, petKey) => {
          const p = this.state.dungeons!,
            before = structuredClone(p);
          if (buyPermanentAttribute(p, key, pet, petKey) && !this.persist())
            Object.assign(p, before);
        },
      },
      icons,
    );
    this.input.keyboard!.on("keydown", this.key, this);
    window.addEventListener("pagehide", this.save);
    window.addEventListener("beforeunload", this.save);
    window.addEventListener("blur", this.blur);
    document.addEventListener("visibilitychange", this.visibility);
    this.events.once("shutdown", () => {
      this.ui.destroy();
      gameAudio.setRainAtmosphere(false);
      this.world?.destroy();
      this.world = undefined;
      this.input.keyboard?.off("keydown", this.key, this);
      window.removeEventListener("pagehide", this.save);
      window.removeEventListener("beforeunload", this.save);
      window.removeEventListener("blur", this.blur);
      document.removeEventListener("visibilitychange", this.visibility);
    });
    if (this.state.dungeonRun) {
      const snapshot = this.state.dungeonRun;
      this.startRun(snapshot.dungeon, snapshot.pet?.id, true);
      this.run!.restore(snapshot);
      this.syncPlayer();
      if (snapshot.phase === "fighting") this.run!.pause();
      this.lastPhase = "";
    } else this.startTravel();
  }
  private startTravel(): void {
    const before = new Set(this.children.list),
      asphalt = this.textures.get("city-forest-art").get("asphalt");
    this.add.rectangle(0, 0, 3072, 2304, 0x303f3b).setOrigin(0).setDepth(-100);
    this.add
      .tileSprite(1536, 1152, 360, 2304, "city-forest-art", asphalt.name)
      .setDepth(-99);
    const g = this.add.graphics().setDepth(-98);
    g.lineStyle(3, 0xaaa68b, 0.7);
    for (let y = 0; y < 2304; y += 70) g.lineBetween(1536, y, 1536, y + 35);
    for (let i = 0; i < 8; i++)
      this.add
        .image(
          i % 2 ? 1880 : 1190,
          300 + i * 240,
          "dungeon-urban",
          i % 3 ? "apartment" : "shop",
        )
        .setOrigin(0.5, 1)
        .setDisplaySize(260, 280)
        .setDepth(300 + i * 240);
    this.add
      .rectangle(0, 0, 3072, 2304, 0x263c48, 0.22)
      .setOrigin(0)
      .setDepth(4000);
    this.rain = this.add.graphics().setScrollFactor(0).setDepth(4100);
    this.travelObjects = this.children.list.filter((o) => !before.has(o));
    this.cameras.main.stopFollow().setZoom(1.3).centerOn(1536, 1850);
    this.ui.travel();
    gameAudio.setRainAtmosphere(true);
    gameAudio.play("thunder");
  }
  private menu(): void {
    this.mode = "menu";
    this.travelObjects.forEach((o) => o.destroy());
    this.travelObjects = [];
    this.rain = undefined;
    gameAudio.setRainAtmosphere(false);
    this.ui.menu(this.state.dungeons!, this.previews);
  }
  private startRun(id: DungeonId, pet?: string, resume = false): void {
    if (!resume && this.state.dungeonRun) return;
    this.mode = "run";
    this.settled = false;
    this.reward = { coins: 0, xp: 0 };
    this.travelObjects.forEach((o) => o.destroy());
    this.travelObjects = [];
    this.rain = undefined;
    gameAudio.setRainAtmosphere(false);
    this.run = new DungeonRun(
      "run-" + crypto.randomUUID(),
      id,
      this.state.dungeons!,
      pet,
      Math.floor(Math.random() * 4294967295),
    );
    this.world?.destroy();
    this.world = new DungeonWorld(this, id);
    this.player = new Player(
      this,
      this.state.profile,
      this.run.state.player.x,
      this.run.state.player.y,
      "dungeon-player",
    );
    this.cameras.main
      .setZoom(this.scale.width < 1000 ? 1.3 : 1.8)
      .startFollow(this.player.sprite, true, 0.16, 0.16);
    this.pickups = this.add.graphics().setDepth(5);
    this.impactGraphics = this.add.graphics().setDepth(5000);
    this.lastPhase = "";
    this.syncPlayer();
    if (!resume) this.persist();
  }
  private syncPlayer(): void {
    const p = this.run!.state.player;
    this.player!.x = p.x;
    this.player!.y = p.y;
    this.player!.update(
      0,
      () => false,
      () => false,
      false,
    );
  }
  private key(e: KeyboardEvent): void {
    if (
      e.repeat ||
      this.returning ||
      (e.target instanceof HTMLElement &&
        e.target.matches('input,select,textarea,[contenteditable="true"]'))
    )
      return;
    if (e.key === "Escape") {
      e.preventDefault();
      if (this.mode === "travel") return;
      if (this.mode === "menu") {
        this.back();
        return;
      }
      if (this.run?.state.phase === "fighting") {
        this.run.pause();
        this.input.keyboard?.resetKeys();
        this.ui.pause(this.run);
        this.lastPhase = "paused";
        this.persist();
      } else if (this.run?.state.phase === "paused") {
        this.run.resume();
        this.ui.resume();
        this.lastPhase = "";
      }
    }
  }
  private imagePool(
    map: Map<number, Phaser.GameObjects.Image>,
    pool: Phaser.GameObjects.Image[],
    ids: Set<number>,
  ): void {
    for (const [id, img] of map)
      if (!ids.has(id)) {
        img.setVisible(false);
        pool.push(img);
        map.delete(id);
      }
  }
  private renderRun(): void {
    const run = this.run!,
      s = run.state,
      p = s.player;
    this.imagePool(
      this.enemyImages,
      this.enemyPool,
      new Set(s.enemies.map((e) => e.id)),
    );
    const flashed = new Set(
      run.impacts.filter((h) => s.elapsed - h.at < 0.09).map((h) => h.enemyId),
    );
    for (const e of s.enemies) {
      let image = this.enemyImages.get(e.id);
      if (!image) {
        image =
          this.enemyPool.pop() ??
          this.add.image(e.x, e.y, "dungeon-zombie", "south-0");
        image.clearTint().setVisible(true);
        this.enemyImages.set(e.id, image);
      }
      const dx = p.x - e.x,
        dy = p.y - e.y,
        direction =
          Math.abs(dx) > Math.abs(dy)
            ? dx < 0
              ? "west"
              : "east"
            : dy < 0
              ? "north"
              : "south";
      image
        .setTexture(
          "dungeon-zombie",
          direction +
            "-" +
            (Math.floor(s.elapsed * (e.kind === "runner" ? 9 : 5)) % 4),
        )
        .setOrigin(0.5, 1)
        .setScale(e.special ? 0.25 : 0.2)
        .setPosition(e.x, e.y)
        .setDepth(e.y);
      if (flashed.has(e.id)) image.setTintFill(0xffebc2);
      else if (e.special) image.setTint(0xb59e8b);
      else image.clearTint();
    }
    this.imagePool(
      this.projectileImages,
      this.projectilePool,
      new Set(s.projectiles.map((p) => p.id)),
    );
    for (const q of s.projectiles) {
      let img = this.projectileImages.get(q.id);
      if (!img) {
        img =
          this.projectilePool.pop() ??
          this.add.image(q.x, q.y, "dungeon-weapons", "spear");
        this.projectileImages.set(q.id, img);
      }
      img
        .setVisible(true)
        .setTexture(
          "dungeon-weapons",
          q.weapon === "bow" ? "spear" : "boomerang",
        )
        .setPosition(q.x, q.y - 18)
        .setDisplaySize(
          q.weapon === "bow" ? 30 : 29,
          q.weapon === "bow" ? 7 : 24,
        )
        .setRotation(
          q.weapon === "boomerang" ? s.elapsed * 12 : Math.atan2(q.vy, q.vx),
        )
        .setDepth(q.y + 1);
    }
    const ink = this.impactGraphics!;
    ink.clear();
    this.damageNumbers.forEach((text) => text.setVisible(false));
    for (const [i, hit] of run.impacts.entries()) {
      const age = s.elapsed - hit.at,
        alpha = Math.max(0, 1 - age / 0.42);
      const text =
        this.damageNumbers[i] ??
        (this.damageNumbers[i] = this.add
          .text(0, 0, "", {
            fontFamily: "monospace",
            fontSize: "12px",
            fontStyle: "bold",
            stroke: "#1c231e",
            strokeThickness: 3,
          })
          .setOrigin(0.5)
          .setDepth(5001));
      text
        .setVisible(true)
        .setText(String(Math.round(hit.damage)))
        .setColor(hit.killed ? "#ffe3a0" : "#f0eee0")
        .setPosition(hit.x, hit.y - 42 - age * 32)
        .setAlpha(alpha);
      ink.lineStyle(1.5, hit.killed ? 0xe6c17c : 0xf5ecd1, alpha);
      if (age < 0.14) {
        const r = 4 + age * 50;
        ink.lineBetween(hit.x - r, hit.y - 24 - r, hit.x + r, hit.y - 24 + r);
        ink.lineBetween(hit.x + r, hit.y - 24 - r, hit.x - r, hit.y - 24 + r);
      }
    }
    // Sound follows simulation time; repeated renders while paused never replay a hit.
    const latest = run.impacts.at(-1);
    if (latest && latest.at - this.lastImpactAt >= 0.1) {
      gameAudio.play("combat-hit");
      this.lastImpactAt = latest.at;
    }
    for (const effect of run.effects) {
      if (effect.weapon !== "sword" && effect.weapon !== "hammer") continue;
      const age = 0.22 - effect.ttl,
        alpha = effect.ttl / 0.22;
      ink.lineStyle(effect.weapon === "hammer" ? 3 : 2, 0xe4d6af, alpha);
      if (effect.weapon === "hammer")
        ink.strokeCircle(effect.x, effect.y - 12, 12 + age * 140);
      else
        ink
          .beginPath()
          .arc(
            effect.x,
            effect.y - 20,
            run.weaponStats("sword").range * 0.8,
            effect.angle - 0.75 + age * 3,
            effect.angle + 0.75 + age * 3,
            false,
          )
          .strokePath();
    }
    this.effects.forEach((img) => img.setVisible(false));
    for (const [i, e] of run.effects.entries()) {
      const image =
        this.effects[i] ??
        (this.effects[i] = this.add.image(
          e.x,
          e.y,
          "dungeon-weapons",
          e.weapon,
        ));
      image
        .setVisible(true)
        .setTexture("dungeon-weapons", e.weapon)
        .setPosition(
          e.x + Math.cos(e.angle) * 24,
          e.y - 23 + Math.sin(e.angle) * 24,
        )
        .setDisplaySize(
          e.weapon === "spear" ? 85 : 54,
          e.weapon === "spear" ? 16 : 45,
        )
        .setRotation(e.angle + (0.22 - e.ttl) * 3)
        .setAlpha(Math.min(1, e.ttl * 8))
        .setDepth(e.y + 2);
    }
    this.orbitals.forEach((img) => img.setVisible(false));
    let oi = 0;
    for (const id of ["rotating-blade", "orbiting-shield"] as const)
      if (s.weapons.includes(id)) {
        const prefix = id === "rotating-blade" ? "blade" : "shield",
          count = run.level(prefix + "-double") ? 2 : 1;
        for (let i = 0; i < count; i++) {
          const a = s.elapsed * (id === "rotating-blade" ? 3 : 2) + i * Math.PI,
            r = run.weaponStats(id).range,
            img =
              this.orbitals[oi] ??
              (this.orbitals[oi] = this.add.image(0, 0, "dungeon-weapons", id));
          oi++;
          img
            .setVisible(true)
            .setTexture("dungeon-weapons", id)
            .setPosition(p.x + Math.cos(a) * r, p.y - 20 + Math.sin(a) * r)
            .setDisplaySize(36, 36)
            .setRotation(a)
            .setDepth(p.y + Math.sin(a) * r);
        }
      }
    this.pickups!.clear();
    for (const q of s.pickups) {
      if (q.kind === "pet") continue;
      this.pickups!.fillStyle(
        q.kind === "xp" ? 0xb6c99a : q.kind === "health" ? 0xd9a392 : 0x97b8bd,
        0.9,
      ).fillCircle(q.x, q.y - 3, q.kind === "xp" ? 3 : 7);
    }
    const rescue = s.pickups.find((q) => q.kind === "pet");
    if (rescue?.species) {
      this.rescueImage ??= this.add
        .image(rescue.x, rescue.y, "dungeon-pets", rescue.species + "-south-0")
        .setOrigin(0.5, 1)
        .setData("dungeon-rescue-pet", true);
      this.rescueImage
        .setVisible(true)
        .setTexture("dungeon-pets", rescue.species + "-south-0")
        .setPosition(rescue.x, rescue.y)
        .setScale(rescue.species === "dog" ? 0.12 : 0.09)
        .setDepth(rescue.y);
    } else this.rescueImage?.setVisible(false);
    if (s.pet) {
      this.petImage ??= this.add.image(
        s.pet.x,
        s.pet.y,
        "dungeon-pets",
        "dog-south-0",
      );
      const dx = p.x - s.pet.x,
        dy = p.y - s.pet.y,
        dir =
          Math.abs(dx) > Math.abs(dy)
            ? dx < 0
              ? "west"
              : "east"
            : dy < 0
              ? "north"
              : "south";
      this.petImage
        .setTexture(
          "dungeon-pets",
          `${s.pet.species}-${dir}-${Math.floor(s.elapsed * 5) % 2}`,
        )
        .setScale(s.pet.species === "dog" ? 0.12 : 0.09)
        .setOrigin(0.5, 1)
        .setPosition(s.pet.x, s.pet.y)
        .setDepth(s.pet.y)
        .setAlpha(s.pet.hp > 0 ? 1 : 0.45);
      if (s.pet.rare) this.petImage.setTint(0xc5ba9b);
      else this.petImage.clearTint();
    }
    this.player!.sprite.setAlpha(s.player.invulnerable > 0 ? 0.65 : 1);
  }
  private finish(): void {
    if (
      !this.run ||
      !["victory", "defeat", "abandoned"].includes(this.run.state.phase)
    )
      return;
    if (this.settled) {
      this.ui.result(this.run, this.reward, true);
      return;
    }
    const before = structuredClone(this.state),
      result = applyDungeonResult(this.state, this.run.result());
    delete this.state.dungeonRun;
    if (saveGame(this.state)) {
      this.reward = {
        coins: result.coins,
        xp: result.xp,
        materials: result.materials,
        waiting: result.waiting,
      };
      this.settled = true;
      this.ui.result(this.run, this.reward, true);
    } else {
      this.state = before;
      this.ui.result(this.run, { coins: 0, xp: 0 }, false);
    }
  }
  private back(title = false): void {
    if (this.returning) return;
    if (this.run && !this.settled) {
      if (["victory", "defeat", "abandoned"].includes(this.run.state.phase)) {
        this.finish();
        return;
      }
      this.run.pause();
      this.ui.pause(this.run);
      return;
    }
    if (!this.persist()) return;
    this.returning = true;
    const state = structuredClone(this.state);
    this.scene.stop();
    this.onReturn(state, title);
  }
  persist(): boolean {
    if (this.returning) return false;
    this.state.activeArea = "cityForest";
    if (this.run && !this.settled) this.state.dungeonRun = this.run.snapshot();
    return saveGame(this.state);
  }
  private save = (): void => {
    this.persist();
  };
  private blur = (): void => {
    this.input.keyboard?.resetKeys();
    if (this.run?.state.phase === "fighting") {
      this.run.pause();
      this.lastPhase = "";
    }
    this.persist();
  };
  private visibility = (): void => {
    if (document.hidden) this.blur();
  };
  setPaused(paused: boolean): void {
    if (paused) this.run?.pause();
    else {
      this.run?.resume();
      this.ui.resume();
    }
    this.lastPhase = "";
  }
  selectTool(_tool: Tool): void {
    this.gameUI.toast("Os ataques desta expedição são automáticos.");
  }
  craftRecipe(_id: string): void {
    this.gameUI.toast("As melhorias são escolhidas nas cartas da expedição.");
  }
  async useVillageItem(_item: ItemId): Promise<void> {
    this.gameUI.toast("Use os suprimentos encontrados durante a expedição.");
  }
  openMapEditor(): void {
    this.gameUI.toast("O editor não está disponível durante as expedições.");
  }
  changeCameraZoom(direction: -1 | 0 | 1): void {
    this.cameras.main.setZoom(
      direction === 0
        ? 1.8
        : Math.max(0.7, Math.min(3, this.cameras.main.zoom + direction * 0.1)),
    );
  }
  captureMap(): Promise<string> {
    return Promise.resolve(
      this.previews[this.run?.state.dungeon ?? "abandoned-central-square"],
    );
  }
  mainMenu(): void {
    if (this.run && !this.settled) {
      this.run.abandon();
      this.finish();
    }
    if (!this.run || this.settled) this.back(true);
  }
  update(time: number, ms: number): void {
    if (this.returning || document.hidden) return;
    const dt = Math.min(ms / 1000, 0.1);
    if (this.mode === "travel") {
      this.travelElapsed += dt;
      this.cameras.main.centerOn(
        1536,
        1850 - Math.min(1, this.travelElapsed / B.transitionSeconds) * 1000,
      );
      this.rain?.clear().lineStyle(1, 0xb8cbd1, 0.32);
      for (let i = 0; i < 110; i++) {
        const x = (i * 127 + time * 0.025) % this.scale.width,
          y = (i * 239 + time * 0.5) % this.scale.height;
        this.rain?.lineBetween(x, y, x - 5, y + 17);
      }
      if (this.travelElapsed >= B.transitionSeconds) this.menu();
      return;
    }
    if (this.mode !== "run" || !this.run || !this.player) return;
    const run = this.run,
      s = run.state;
    if (s.phase === "fighting") {
      this.player.speedMultiplier = run.moveSpeed / 84;
      this.player.update(
        dt,
        () => false,
        (x, y) => dungeonBlocked(s.dungeon, x, y),
      );
      s.player.x = this.player.x;
      s.player.y = this.player.y;
      run.step(dt);
      if (this.player.x < 32 || this.player.y < 48) {
        this.player.x = s.player.x;
        this.player.y = s.player.y;
      }
    } else
      this.player.update(
        0,
        () => false,
        () => false,
        false,
      );
    this.renderRun();
    this.elapsedHUD += dt;
    if (this.elapsedHUD > 0.1 || s.phase !== this.lastPhase) {
      this.ui.update(run);
      this.elapsedHUD = 0;
    }
    if (s.phase !== this.lastPhase) {
      this.lastPhase = s.phase;
      if (s.phase !== "fighting") this.input.keyboard?.resetKeys();
      if (s.phase === "choice") this.ui.cards(run);
      else if (s.phase === "paused") this.ui.pause(this.run);
      else if (["victory", "defeat", "abandoned"].includes(s.phase))
        this.finish();
    }
    this.elapsedSave += dt;
    if (this.elapsedSave > 5) {
      this.elapsedSave = 0;
      this.persist();
    }
  }
}
