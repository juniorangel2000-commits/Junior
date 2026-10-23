import { gameAudio } from '../audio';
import Phaser from 'phaser';
import { Player } from '../player';
import { CHARACTER_HEIGHT, createArt } from '../art';
import { directionFromVector, directionVector } from '../character-directions';
import { preloadVisualAssets } from '../visual-assets';
import { locationAt, getRegionAt } from '../data/regions';
import { createWorld, NPC_POSITION, TILE, WORLD_WIDTH, WORLD_HEIGHT } from '../world';
import type { WorldView, ResourceNode } from '../world';
import { Inventory, ITEM_NAMES } from '../systems/inventory';
import { Farming } from '../systems/farming';
import { Building, BUILD_COSTS, BUILD_NAMES, BUILD_REQUIREMENTS, buildingFootprint, buildingLayer } from '../systems/building';
import { BLUEPRINT_COST, BLUEPRINT_LABEL, BLUEPRINT_SHELTER } from '../data/blueprints';
import { RECIPES } from '../data/recipes';
import { craft, canCraft } from '../systems/crafting';
import { Resources, RESOURCE_DEFINITIONS } from '../systems/resources';
import { detectShelter } from '../systems/shelter';
import type { ShelterInfo } from '../systems/shelter';
import { getLiaDialogue } from '../systems/npc';
import { HOME_SUPPLIES, collectHomeSupply } from '../systems/home-supplies';
import { emptyQuickbar } from '../systems/quickbar';
import { createNewSave, hasSave, loadSave, saveGame } from '../systems/save';
import type { BuildingData, CharacterProfile, SaveData, Tool, TilePoint } from '../types';
import type { GameUI } from '../ui';
import type { TitleBackgroundMode } from '../title-screen';
import { titleCameraPose } from '../title-camera';
import { Home, HOME_SPAWN, HOME_EXIT, HOME_ENTRANCE_WORLD, HOME_WIDTH, HOME_HEIGHT } from '../systems/home';
import { createHomeArt, drawHome } from '../home-art';
import { GAME_MINUTES_PER_SECOND, advanceClock, sleepUntilMorning } from '../systems/clock';
import { AdminAccess, grantAdminItem } from '../systems/admin';
import { AdminMenu } from '../admin-menu';
import type { HomeEditAction } from '../home-ui';
import { HOUSE_WINDOW_LIGHTS } from '../house-sprites';
import { baseCameraZoom, homeFitsCamera, loadCameraZoom, saveCameraZoom, stepCameraZoom } from '../camera-zoom';
import { MapEditor } from '../map-editor';
import { emptyMapEdits, isProtectedMapTile } from '../systems/map-editor';
import type { MapEditData } from '../systems/map-editor';

const DEFAULT_PROFILE: CharacterProfile = { name: 'Viajante', skin: '#d9a276', hairStyle: 'preso', hairColor: '#754323', outfit: '#638a9d' };

export class ValleyScene extends Phaser.Scene {
  ui!: GameUI;
  private world!: WorldView;
  private player!: Player;
  private inventory!: Inventory;
  private farming!: Farming;
  private building!: Building;
  private resources!: Resources;
  private state!: SaveData;
  private running = false;
  private paused = true;
  private tool: Tool = 'hand';
  private cropSprites: Phaser.GameObjects.Sprite[] = [];
  private buildingSprites: Phaser.GameObjects.Sprite[] = [];
  private cropSignature = '';
  private buildingSignature = '';
  private cropSoil!: Phaser.GameObjects.Graphics;
  private selection!: Phaser.GameObjects.Graphics;
  private night!: Phaser.GameObjects.Rectangle;
  private lastAim: TilePoint | null = null;
  private aimUntil = 0;
  private saveTimer = 0;
  private hudTimer = 0;
  private saveWarningShown = false;
  private rotation: 0 | 1 = 0;
  private roofSprites: Phaser.GameObjects.Image[] = [];
  private damageMarks!: Phaser.GameObjects.Graphics;
  private shelter: ShelterInfo = { sheltered: false, tiles: [], reason: 'Construa piso, paredes, porta e cobertura para formar seu abrigo.' };
  private craftJob: { id: string; name: string; elapsed: number; duration: number } | null = null;
  private nextInteractionAt = 0;
  private currentRegion = '';
  private titleBackgroundMode: TitleBackgroundMode = 'off';
  private titleElapsed = 0;
  private titleLights?: Phaser.GameObjects.Graphics;
  private npcLabel?: Phaser.GameObjects.Text;
  private supplySprites: Phaser.GameObjects.Image[] = [];
  private home = new Home();
  private inHome = false;
  private outdoorPosition: SaveData['player'] = { ...HOME_ENTRANCE_WORLD };
  private outdoorVisibility = new Map<Phaser.GameObjects.GameObject, boolean>();
  private homeView?: ReturnType<typeof drawHome>;
  private adminAccess = new AdminAccess();
  private adminMenu?: AdminMenu;
  private cameraZoomFactor = loadCameraZoom();
  private wheelZoomDistance = 0;
  private lastWheelZoomAt = 0;
  private mapEditor?: MapEditor;
  private editingMap = false;

  constructor() { super('Vale'); }

  preload(): void { preloadVisualAssets(this); }

  create(): void {
    createArt(this);
    createHomeArt(this);
    this.adminMenu = new AdminMenu(document.querySelector<HTMLElement>('#ui')!, this.adminAccess, {
      onPause: paused => {
        if (paused && this.running && this.ui.isModalOpen()) this.ui.closeModal();
        this.setPaused(paused || this.ui.isModalOpen());
      },
      onGrant: (item, amount) => {
        if (!this.running) return { ok: false, message: 'Abra uma partida antes de usar o menu.' };
        const result = grantAdminItem(this.adminAccess, this.inventory, item, amount);
        if (result.ok) { this.updateHUD(); this.persist(); }
        return result;
      },
    });
    this.loadState(createNewSave(DEFAULT_PROFILE));
    this.ui.showTitle(hasSave());
    window.addEventListener('keydown', this.handleKey);
    window.addEventListener('pagehide', this.handlePageHide);
    window.addEventListener('beforeunload', this.handlePageHide);
    document.addEventListener('visibilitychange', this.handleVisibility);
    window.addEventListener('blur', this.handleBlur);
    this.game.canvas.addEventListener('contextmenu', this.handleContextMenu);
    this.game.canvas.addEventListener('wheel', this.handleCameraWheel, { passive: false });
    this.scale.on('resize', this.handleCameraResize, this);
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (!this.canPlay() || pointer.button !== 0) return;
      const tile = { x: Math.floor(pointer.worldX / TILE), y: Math.floor(pointer.worldY / TILE) };
      this.lastAim = tile;
      this.aimUntil = this.time.now + 3000;
      this.interact(tile);
    });
    this.events.once('shutdown', () => {
      window.removeEventListener('keydown', this.handleKey);
      window.removeEventListener('pagehide', this.handlePageHide);
      window.removeEventListener('beforeunload', this.handlePageHide);
      document.removeEventListener('visibilitychange', this.handleVisibility);
      window.removeEventListener('blur', this.handleBlur);
      this.game.canvas.removeEventListener('contextmenu', this.handleContextMenu);
      this.game.canvas.removeEventListener('wheel', this.handleCameraWheel);
      this.scale.off('resize', this.handleCameraResize, this);
      this.adminMenu?.destroy();
      this.mapEditor?.destroy();
    });
  }

  startNew(profile: CharacterProfile): void {
    gameAudio.setScene('game');
    this.adminMenu?.close();
    this.loadState(createNewSave(profile));
    this.running = true;
    this.paused = false;
    this.ui.showHUD();
    this.ui.toast('Recolha galhos, pedras e fibras perto da casa. Abra a fabricação com C.');
    this.persist();
    this.updateHUD();
  }

  continueGame(): void {
    const saved = loadSave();
    if (!saved) { this.ui.toast('Não foi possível ler o save. Você pode começar um novo jogo.'); return; }
    gameAudio.setScene('game');
    this.adminMenu?.close();
    this.loadState(saved);
    this.running = true;
    this.paused = false;
    this.ui.showHUD();
    this.ui.toast(`Que bom ter você de volta, ${saved.profile.name}.`);
    this.updateHUD();
  }

  setPaused(value: boolean): void {
    this.paused = value;
    this.ui.updateCameraZoom(this.cameraZoomFactor, !value && this.running);
    this.input.keyboard?.resetKeys();
    if (value && this.running) this.persist();
  }

  openAdminMenu(): void {
    if (!this.running) return;
    if (this.ui.isModalOpen()) this.ui.closeModal();
    this.adminMenu?.toggle();
  }

  openMapEditor(): void {
    if (this.editingMap) return;
    const wasRunning = this.running;
    const original = this.snapshotState();
    const base = wasRunning ? original : loadSave() ?? createNewSave(DEFAULT_PROFILE);
    this.editingMap = true;
    this.adminMenu?.close(); this.cancelCrafting();
    this.ui.showMapEditorMode();
    this.paused = true;
    this.input.keyboard?.resetKeys();
    // The complete baseline also validates imports referencing already harvested nodes.
    this.loadState({ ...base, homePosition: undefined, mapEdits: undefined, depletedResources: [], resourceProgress: [] });
    const originalObjects = this.world.editorObjects.map(object => ({ ...object, depleted: base.depletedResources.includes(object.id) }));
    const protectedTiles = new Set(base.buildings.flatMap(buildingFootprint).map(p => `${p.x},${p.y}`));
    const preserveProgress = (edits: MapEditData): MapEditData => {
      const data = structuredClone(edits);
      for (const entry of base.resourceProgress) {
        const old = base.mapEdits?.objects[entry.id];
        if (entry.id.startsWith('editor-') && old && !data.objects[entry.id]) data.objects[entry.id] = { ...old, removed: true };
      }
      return data;
    };
    const rebuild = (edits: MapEditData): void => {
      this.loadState({ ...base, homePosition: undefined, mapEdits: preserveProgress(edits) });
      this.cameras.main.stopFollow().removeBounds();
      this.player.sprite.setVisible(false);
      this.night.setVisible(false); this.selection.clear();
      this.world.updateOcclusion(-1000, -1000);
      this.paused = true;
    };
    const close = (): void => {
      this.mapEditor?.destroy(); this.mapEditor = undefined;
      this.editingMap = false;
      this.input.keyboard?.resetKeys();
    };
    const initial = base.mapEdits ?? emptyMapEdits();
    rebuild(initial);
    this.mapEditor = new MapEditor(this, initial, {
      rebuild,
      originalObjects,
      objects: () => this.world.editorObjects,
      protectedTile: (x, y) => isProtectedMapTile(x, y) || protectedTiles.has(`${x},${y}`),
      canPlace: (x, y, ignoreId) => {
        const current = this.world.editorObjects.find(o => o.id === ignoreId && o.x === x && o.y === y);
        return !!current || !this.world.isBlocked(x, y);
      },
      apply: edits => {
        this.loadState({ ...base, homePosition: undefined, mapEdits: preserveProgress(edits) });
        const data = this.snapshotState();
        if (!saveGame(data)) { rebuild(edits); return false; }
        close();
        this.running = true; this.paused = false;
        gameAudio.setScene('game'); this.ui.showHUD(); this.updateHUD();
        this.ui.toast('Mapa aplicado e partida salva. Use Exportar no editor para me enviar o mapa.');
        return true;
      },
      cancel: () => {
        close(); this.loadState(original); this.running = wasRunning;
        if (wasRunning) { this.paused = false; this.ui.showHUD(); this.updateHUD(); }
        else { this.paused = true; this.ui.showTitle(hasSave()); }
      },
    });
  }

  openHomeMenu(): void {
    if (!this.running || this.adminMenu?.isOpen) return;
    if (!this.inHome) { this.ui.toast('Entre na casa da propriedade para personalizar o interior.'); return; }
    if (this.ui.isModalOpen()) this.ui.closeModal();
    this.ui.showHomeCustomization(structuredClone(this.home.data), (action: HomeEditAction) => {
      if (!this.inHome || !this.running) return { ok: false, message: 'Entre em casa primeiro.', home: structuredClone(this.home.data) };
      const before = structuredClone(this.home.data);
      let result = this.home.apply(action, { x: Math.floor(this.player.x / TILE), y: Math.floor(this.player.y / TILE) });
      if (result.ok && this.feetTiles().some(tile => this.home.isBlocked(tile.x, tile.y))) {
        this.home = new Home(before);
        result = { ok: false, message: 'Deixe livre o espaço onde você está. Mova o personagem primeiro.' };
      }
      if (result.ok) {
        this.refreshHomeView();
        this.updateHUD();
        this.persist();
      }
      return { ...result, home: structuredClone(this.home.data) };
    });
  }

  private playerPosition(): SaveData['player'] {
    return { x: this.player.x, y: this.player.y, direction: directionFromVector(this.player.facing.x, this.player.facing.y) };
  }

  private nearHouseEntrance(): boolean {
    return !this.inHome && this.player.y >= 16 * TILE + 5
      && Phaser.Math.Distance.Between(this.player.x, this.player.y, HOME_ENTRANCE_WORLD.x, HOME_ENTRANCE_WORLD.y) <= 58;
  }

  private nearHomeExit(): boolean {
    return this.inHome && this.player.y >= 8 * TILE && this.player.x >= 4.5 * TILE && this.player.x <= 7.5 * TILE
      && this.tileDistance(HOME_EXIT) <= 60;
  }

  private enterHome(position?: SaveData['player'], notify = true): void {
    if (this.inHome) return;
    this.outdoorPosition = this.playerPosition();
    // Preserve each object's visibility: title lighting and hidden roofs must not reappear on leaving.
    this.outdoorVisibility.clear();
    for (const object of this.children.list) {
      if (object === this.player.sprite || object === this.night) continue;
      if ('visible' in object && 'setVisible' in object) {
        this.outdoorVisibility.set(object, Boolean(object.visible));
        (object as Phaser.GameObjects.Image).setVisible(false);
      }
    }
    this.inHome = true;
    this.refreshHomeView();
    this.player.x = position?.x ?? HOME_SPAWN.x;
    this.player.y = position?.y ?? HOME_SPAWN.y;
    this.player.facing = directionVector(position?.direction ?? 'up');
    this.input.keyboard?.resetKeys();
    this.player.update(0, this.blocked, this.blockedPoint);
    this.updateZoom();
    this.lastAim = null;
    this.selection.clear();
    this.nextInteractionAt = this.time.now + 350;
    this.updateShelter(); this.updateNight();
    if (notify) {
      gameAudio.play('door');
      this.ui.toast('Seu refúgio. H personaliza os móveis; E usa a cama ou sai pela porta.');
      this.updateHUD(); this.persist();
    }
  }

  private refreshHomeView(): void {
    this.homeView?.destroy();
    this.homeView = drawHome(this, this.home.data);
    this.supplySprites.forEach(sprite => sprite.destroy());
    this.supplySprites = HOME_SUPPLIES.filter(s => !this.state.homeSupplies?.[s.id]).map(s =>
      this.add.image((s.x + .5) * TILE, (s.y + .5) * TILE, s.texture).setDisplaySize(25, 25).setDepth(10000));
  }

  private leaveHome(notify = true): void {
    if (!this.inHome) return;
    this.homeView?.destroy(); this.homeView = undefined;
    this.supplySprites.forEach(sprite => sprite.destroy()); this.supplySprites = [];
    for (const [object, visible] of this.outdoorVisibility) {
      if (object.scene) (object as Phaser.GameObjects.Image).setVisible(visible);
    }
    this.outdoorVisibility.clear();
    this.inHome = false;
    this.player.x = this.outdoorPosition.x;
    this.player.y = this.outdoorPosition.y;
    this.player.facing = { x: 0, y: 1 };
    this.player.update(0, this.blocked, this.blockedPoint);
    this.recoverPlayerPosition();
    this.input.keyboard?.resetKeys();
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH * TILE, WORLD_HEIGHT * TILE);
    this.cameras.main.setBackgroundColor('#6b8053');
    this.updateZoom();
    this.cameras.main.startFollow(this.player.sprite, false, .12, .12).centerOn(this.player.x, this.player.y);
    this.lastAim = null;
    this.nextInteractionAt = this.time.now + 350;
    this.syncSprites(); this.updateShelter(); this.updateNight();
    if (notify) { gameAudio.play('door'); this.updateHUD(); this.persist(); }
  }

  private interactHome(tile?: TilePoint): void {
    if (tile && this.tileDistance(tile) > 78) { this.ui.toast('Chegue um pouco mais perto.'); return; }
    if (this.nearHomeExit() && (!tile || ((tile.x === 5 || tile.x === 6) && tile.y >= 8))) {
      this.leaveHome(); return;
    }
    const supply = HOME_SUPPLIES.find(s => !this.state.homeSupplies?.[s.id] && this.tileDistance(s) <= 48 && (!tile || (tile.x === s.x && tile.y === s.y)));
    if (supply) {
      if (collectHomeSupply(this.state, this.inventory, supply.id)) {
        gameAudio.play('pickup');
        this.refreshHomeView(); this.updateHUD(); this.persist();
        this.ui.toast(supply.id === 'wateringCan' ? 'Regador recolhido. Escolha um slot para equipá-lo.' : 'Você recolheu 7 sementes de nabo.');
      } else this.ui.toast('Não há espaço para as sementes.');
      return;
    }
    const playerTile = { x: Math.floor(this.player.x / TILE), y: Math.floor(this.player.y / TILE) };
    const bed = this.home.bedNear(playerTile, 1.1);
    if (bed && (!tile || this.home.at(tile.x, tile.y)?.id === bed.id)) {
      const preview = sleepUntilMorning(this.state);
      if (!preview.ok) { this.ui.toast(preview.message); return; }
      this.ui.showSleep(() => {
        // Recheck access and time after the confirmation; sleeping never runs from a stale menu.
        if (!this.running || !this.inHome || !this.home.bedNear({ x: Math.floor(this.player.x / TILE), y: Math.floor(this.player.y / TILE) }, 1.1)) return;
        const result = sleepUntilMorning(this.state);
        if (!result.ok) { this.ui.toast(result.message); return; }
        this.state.day = result.day;
        this.state.time = result.time;
        this.farming.update(result.elapsedMinutes / GAME_MINUTES_PER_SECOND);
        this.nextInteractionAt = this.time.now + 400;
        this.updateNight(); this.updateHUD(); this.persist();
        this.ui.toast(result.message);
      });
      return;
    }
    this.ui.toast('Use H para personalizar os móveis da casa.');
  }

  setTitleBackground(mode: TitleBackgroundMode): void {
    if (mode !== 'off') gameAudio.setScene('title');
    const wasOff = this.titleBackgroundMode === 'off';
    this.titleBackgroundMode = mode;
    this.cameras.main.zoomEffect.reset();
    document.body.classList.toggle('rainy-title-active', mode !== 'off');
    this.night?.setVisible(mode === 'off');
    this.titleLights?.setVisible(mode !== 'off');
    this.npcLabel?.setVisible(mode === 'off');
    if (mode === 'off') {
      this.updateZoom();
      if (this.player && !this.inHome) {
        this.cameras.main.startFollow(this.player.sprite, false, .12, .12);
        this.cameras.main.centerOn(this.player.x, this.player.y);
      }
      return;
    }
    if (wasOff) this.titleElapsed = 0;
    this.cameras.main.stopFollow();
    this.updateTitleBackground(0);
  }

  private updateTitleBackground(delta: number): void {
    if (this.titleBackgroundMode === 'animated' && !document.hidden) this.titleElapsed = (this.titleElapsed + delta) % 36;
    const pose = titleCameraPose(this.scale.width, this.scale.height, this.titleElapsed);
    this.cameras.main.setZoom(pose.zoom).centerOn(pose.x, pose.y);
  }

  selectTool(tool: Tool): void {
    if (tool === 'water' && !this.state.homeSupplies?.wateringCan) { this.ui.toast('Recolha o regador dentro da casa.'); return; }
    if ((tool === 'hatchet' || tool === 'pickaxe') && !this.inventory.has(tool)) {
      this.ui.toast('Fabrique essa ferramenta primeiro. Abra a fabricação com C.');
      return;
    }
    this.tool = tool;
    if (this.state) { this.state.equippedTool = tool; this.updateHUD(); }
  }

  craftRecipe(id: string): void {
    if (!this.running || !this.ui.isCraftingOpen() || this.craftJob) return;
    const recipe = RECIPES.find(entry => entry.id === id);
    if (!recipe) return;
    if (!canCraft(recipe, this.inventory, this.nearWorkbench())) {
      this.ui.toast('Confira os materiais, a ferramenta e a proximidade da bancada.');
      return;
    }
    if (recipe.durationSeconds) {
      this.craftJob = { id, name: recipe.name, elapsed: 0, duration: recipe.durationSeconds };
      this.ui.setCraftingProgress(recipe.name, 0);
    } else this.finishCrafting(id);
  }

  cancelCrafting(): void {
    if (!this.craftJob) return;
    this.craftJob = null;
    this.ui.setCraftingProgress('', 1);
    this.ui.refreshCrafting(this.inventory.data, this.nearWorkbench());
    this.ui.toast('Fabricação cancelada. Nenhum material foi consumido.');
  }

  private finishCrafting(id: string): void {
    const result = craft(id, this.inventory, this.nearWorkbench());
    if (result.ok) {
      gameAudio.play('craft');
      this.state.progress.craftedTools = this.inventory.has('hatchet') && this.inventory.has('pickaxe') && this.inventory.has('hammer');
      if (id === 'rough-planks') this.state.progress.processed = true;
      if (id === 'sawn-planks') this.state.progress.sawn = true;
    }
    this.ui.setCraftingProgress('', 1);
    this.ui.toast(result.message);
    this.afterAction();
    this.ui.refreshCrafting(this.inventory.data, this.nearWorkbench());
  }

  mainMenu(): void {
    this.adminMenu?.close();
    this.cancelCrafting();
    if (this.running) this.persist();
    if (this.inHome) this.leaveHome(false);
    this.running = false;
    this.paused = true;
    this.ui.showTitle(hasSave());
  }

  captureMap(): Promise<string> {
    const width = (this.inHome ? HOME_WIDTH : WORLD_WIDTH) * TILE;
    const height = (this.inHome ? HOME_HEIGHT : WORLD_HEIGHT) * TILE;
    const scale = Math.min(1, 960 / width);
    const texture = this.make.renderTexture({ width: Math.round(width * scale), height: Math.round(height * scale) }, false);
    texture.camera.setZoom(scale).setScroll(0, 0).setOrigin(0, 0);
    this.children.depthSort();
    const objects = this.children.list.filter(object => object !== this.night && object !== this.selection && object !== this.player.sprite && 'visible' in object && object.visible);
    texture.draw(objects);
    return new Promise(resolve => texture.snapshot(image => {
      const url = image instanceof HTMLImageElement ? image.src : '';
      texture.destroy(); resolve(url);
    }));
  }

  persist(): boolean {
    if (!this.running || !this.state || this.editingMap) return false;
    const ok = saveGame(this.snapshotState());
    if (!ok && !this.saveWarningShown) {
      this.saveWarningShown = true;
      this.ui.toast('Não foi possível salvar localmente. Seu progresso atual dura apenas nesta sessão.');
    }
    return ok;
  }

  private snapshotState(): SaveData {
    return structuredClone({
      ...this.state,
      quickbar: this.ui.getQuickbar(),
      player: this.inHome ? { ...this.outdoorPosition } : this.playerPosition(),
      home: structuredClone(this.home.data),
      homePosition: this.inHome ? this.playerPosition() : undefined,
      inventory: { ...this.inventory.data },
      crops: this.farming.crops.map(crop => ({ ...crop })),
      buildings: this.building.buildings.map(building => ({ ...building })),
      resourceProgress: this.resources.progress.map(entry => ({ ...entry })),
      equippedTool: this.tool,
    });
  }

  private loadState(data: SaveData): void {
    this.craftJob = null;
    this.inHome = false;
    this.homeView = undefined;
    this.outdoorVisibility.clear();
    this.children.removeAll(true);
    this.state = structuredClone(data);
    this.supplySprites = [];
    this.ui.setQuickbar(data.quickbar ?? emptyQuickbar());
    this.inventory = new Inventory(data.inventory);
    this.farming = new Farming(data.crops);
    this.building = new Building(data.buildings);
    this.resources = new Resources(data.resourceProgress);
    this.home = new Home(data.home);
    this.cropSprites = [];
    this.buildingSprites = [];
    this.roofSprites = [];
    this.cropSignature = '';
    this.buildingSignature = '';
    this.world = createWorld(this, data.depletedResources, data.buildings, data.mapEdits);
    // A warm refuge in the opening only; the facade and gameplay lighting stay intact.
    this.titleLights = this.add.graphics().setDepth(16 * TILE + 5).setVisible(false);
    const newHouseArt = this.textures.exists('house-cottage-source');
    const windowLights = newHouseArt ? HOUSE_WINDOW_LIGHTS
      : [{ x: 52, y: 163, width: 13, height: 20 }, { x: 184, y: 163, width: 13, height: 20 }];
    if (this.textures.exists('asset-house')) for (const light of windowLights) {
      const x = 24.5 * TILE - 128 + light.x, y = 16 * TILE + 4 - 224 + light.y;
      this.titleLights.fillStyle(0xe2ac55, .06).fillCircle(x + light.width / 2, y + light.height / 2, 23);
      this.titleLights.fillStyle(0xffbd6e, .78);
      const rows = newHouseArt ? 2 : 3;
      const paneWidth = (light.width - 2) / 2, paneHeight = (light.height - (rows - 1) * 2) / rows;
      for (let row = 0; row < rows; row++) for (let col = 0; col < 2; col++) {
        this.titleLights.fillRect(Math.round(x + col * (paneWidth + 2)), Math.round(y + row * (paneHeight + 2)), Math.floor(paneWidth), Math.floor(paneHeight));
      }
    }
    // Uma estação já salva tem prioridade sobre novos pontos de coleta.
    for (const b of data.buildings) {
      for (const point of buildingFootprint(b)) {
        const resource = this.world.resourceAt(point.x, point.y);
        if (resource && !this.state.depletedResources.includes(resource.id)) {
          this.world.removeResource(resource.id);
          this.state.depletedResources.push(resource.id);
          const partial = this.resources.progress.findIndex(entry => entry.id === resource.id);
          if (partial >= 0) this.resources.progress.splice(partial, 1);
        }
      }
    }
    this.cropSoil = this.add.graphics().setDepth(-50);
    this.damageMarks = this.add.graphics().setDepth(3500);
    this.player = new Player(this, data.profile, data.player.x, data.player.y);
    const direction = data.player.direction;
    this.player.facing = directionVector(direction ?? 'down');
    this.input.keyboard?.resetKeys();
    this.player.update(0, this.blocked, this.blockedPoint);
    this.recoverPlayerPosition();
    this.world.updateOcclusion(this.player.x, this.player.y);
    this.add.sprite(NPC_POSITION.x, NPC_POSITION.y, 'lia').setOrigin(0.5, 1).setDepth(NPC_POSITION.y);
    this.npcLabel = this.add.text(NPC_POSITION.x, NPC_POSITION.y - CHARACTER_HEIGHT - 6, 'Lia', {
      fontFamily: 'monospace', fontSize: '10px', color: '#fff1d2',
      stroke: '#263b31', strokeThickness: 2,
    }).setOrigin(0.5, 1).setDepth(NPC_POSITION.y + 1);
    this.selection = this.add.graphics().setDepth(4000);
    this.night = this.add.rectangle(0, 0, WORLD_WIDTH * TILE, WORLD_HEIGHT * TILE, 0x14203c, 1).setOrigin(0).setDepth(5000).setAlpha(0);
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH * TILE, WORLD_HEIGHT * TILE);
    this.updateZoom();
    this.cameras.main.startFollow(this.player.sprite, false, 0.12, 0.12);
    this.cameras.main.centerOn(this.player.x, this.player.y);
    this.tool = data.equippedTool;
    this.lastAim = null;
    this.saveTimer = 0;
    this.saveWarningShown = false;
    this.nextInteractionAt = 0;
    this.hudTimer = 0;
    this.currentRegion = getRegionAt(Math.floor(this.player.x / TILE), Math.floor(this.player.y / TILE)).id;
    this.syncSprites();
    this.updateNight();
    this.updateShelter();
    if (data.homePosition) this.enterHome(data.homePosition, false);
  }

  changeCameraZoom(direction: -1 | 0 | 1): void {
    if (!this.canPlay()) return;
    const next = stepCameraZoom(this.cameraZoomFactor, direction);
    if (next === this.cameraZoomFactor) return;
    this.cameraZoomFactor = next;
    saveCameraZoom(next);
    this.updateZoom(true);
  }

  private handleCameraWheel = (event: WheelEvent): void => {
    // Only the scene canvas consumes wheel input. Panels keep their own scrolling,
    // and browser zoom / trackpad pinch shortcuts are left to the browser.
    if (!this.canPlay() || event.ctrlKey || event.metaKey || event.altKey || !event.deltaY) return;
    event.preventDefault();
    if (event.timeStamp - this.lastWheelZoomAt > 250) this.wheelZoomDistance = 0;
    this.lastWheelZoomAt = event.timeStamp;
    const pixels = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? this.scale.height : 1);
    if (Math.sign(pixels) !== Math.sign(this.wheelZoomDistance)) this.wheelZoomDistance = 0;
    this.wheelZoomDistance += pixels;
    if (Math.abs(this.wheelZoomDistance) < 40) return;
    this.changeCameraZoom(this.wheelZoomDistance < 0 ? 1 : -1);
    this.wheelZoomDistance = 0;
  };

  private handleCameraResize = (): void => { if (this.mapEditor) this.mapEditor.resize(); else this.updateZoom(); };

  private updateZoom(animate = false): void {
    if (this.titleBackgroundMode !== 'off') { this.updateTitleBackground(0); return; }
    const camera = this.cameras.main;
    const homeWidth = HOME_WIDTH * TILE, homeHeight = HOME_HEIGHT * TILE;
    const zoom = baseCameraZoom(this.scale.width, this.scale.height, this.inHome ? homeHeight : undefined) * this.cameraZoomFactor;
    camera.zoomEffect.reset();
    if (animate) camera.zoomTo(zoom, 180, 'Sine.easeOut', true);
    else camera.setZoom(zoom);
    if (this.inHome) {
      camera.setBackgroundColor('#1b2b26');
      if (homeFitsCamera(this.scale.width, this.scale.height, zoom, homeWidth, homeHeight)) {
        camera.stopFollow().removeBounds().centerOn(homeWidth / 2, homeHeight / 2);
      } else {
        // Close views follow the player; the whole room stays centered when it fits.
        camera.setBounds(-TILE, -TILE, homeWidth + 2 * TILE, homeHeight + 2 * TILE)
          .startFollow(this.player.sprite, false, .12, .12).centerOn(this.player.x, this.player.y);
      }
    } else {
      camera.setBounds(0, 0, WORLD_WIDTH * TILE, WORLD_HEIGHT * TILE).setBackgroundColor('#6b8053')
        .startFollow(this.player.sprite, false, .12, .12);
    }
    this.ui.updateCameraZoom(this.cameraZoomFactor, this.canPlay());
  }

  private feetTiles(x = this.player.x, y = this.player.y): TilePoint[] {
    return [[-7, -5], [7, -5], [-7, 3], [7, 3]].map(([ox, oy]) => ({ x: Math.floor((x + ox) / TILE), y: Math.floor((y + oy) / TILE) }));
  }

  private recoverPlayerPosition(): void {
    const clearFeet = (x: number, y: number): boolean => [[-7, -5], [7, -5], [-7, 3], [7, 3]]
      .every(([ox, oy]) => !this.blockedPoint(x + ox, y + oy));
    if (clearFeet(this.player.x, this.player.y)) return;
    const startX = Math.floor(this.player.x / TILE);
    const startY = Math.floor(this.player.y / TILE);
    for (let radius = 0; radius < Math.max(WORLD_WIDTH, WORLD_HEIGHT); radius++) {
      for (let y = startY - radius; y <= startY + radius; y++) for (let x = startX - radius; x <= startX + radius; x++) {
        if (Math.max(Math.abs(x - startX), Math.abs(y - startY)) !== radius) continue;
        const px = x * TILE + 16; const py = y * TILE + 16;
        if (clearFeet(px, py)) {
          this.player.x = px; this.player.y = py;
          this.player.sprite.setPosition(px, py);
          return;
        }
      }
    }
  }

  private canPlay(): boolean { return !this.editingMap && this.running && !this.paused && !this.ui.isModalOpen() && !this.adminMenu?.isOpen && !document.hidden; }
  private blocked = (x: number, y: number): boolean => this.inHome ? this.home.isBlocked(x, y)
    : this.world.isBlocked(x, y) || this.building.isBlocked(x, y)
      || (x === Math.floor(NPC_POSITION.x / TILE) && y === Math.floor(NPC_POSITION.y / TILE));

  private blockedPoint = (x: number, y: number): boolean => {
    const tx = Math.floor(x / TILE), ty = Math.floor(y / TILE);
    if (this.inHome) return this.home.isBlocked(tx, ty);
    // A floor already saved on dry land covers a newly rounded shoreline sliver.
    // It never overrides solid obstacles or an original water cell.
    const savedFloor = this.building.at(tx, ty, 'floor')?.kind === 'floor' && !this.world.isBlocked(tx, ty);
    return (this.world.isBlockedPoint(x, y) && !savedFloor) || this.building.isBlocked(tx, ty)
      || (tx === Math.floor(NPC_POSITION.x / TILE) && ty === Math.floor(NPC_POSITION.y / TILE));
  };

  private handleKey = (event: KeyboardEvent): void => {
    if (this.editingMap) return;
    if (event.ctrlKey && event.shiftKey && event.key === 'F10' && this.running) {
      event.preventDefault(); if (!event.repeat) this.openAdminMenu(); return;
    }
    if (this.adminMenu?.isOpen) {
      if (event.key === 'Escape') { event.preventDefault(); this.adminMenu.minimize(); }
      return;
    }
    const target = event.target;
    if (event.key !== 'Escape' && target instanceof HTMLElement && target.matches('input, textarea, select, [contenteditable="true"]')) return;
    if (event.key === 'F2' && !event.repeat) { event.preventDefault(); this.openMapEditor(); return; }
    if (event.key === ' ' && target instanceof HTMLElement && target.closest('button')) return;
    if (this.canPlay() && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)) event.preventDefault();
    if (event.repeat) return;
    if (event.key === 'Escape' && this.running) {
      event.preventDefault();
      if (!this.ui.dismissTopToolbar()) this.ui.togglePause();
      return;
    }
    if (event.key.toLowerCase() === 'i' && this.running) { this.ui.toggleInventory(this.inventory.data); return; }
    if (event.key.toLowerCase() === 'c' && this.running) { event.preventDefault(); this.ui.toggleCrafting(this.inventory.data, this.nearWorkbench()); return; }
    if (event.key.toLowerCase() === 'b' && this.running) {
      event.preventDefault();
      if (this.inHome) this.ui.toast('Use H para personalizar os móveis da casa.');
      else this.ui.toggleBuilding(this.inventory.data, this.nearWorkbench());
      return;
    }
    if (event.key.toLowerCase() === 'm' && this.running) { event.preventDefault(); this.ui.toggleMap(); return; }
    if (event.key.toLowerCase() === 'h' && this.running) { event.preventDefault(); this.openHomeMenu(); return; }
    if (!this.canPlay()) return;
    if (!event.ctrlKey && !event.metaKey && !event.altKey) {
      if (event.key === '+' || event.key === '=' || event.key === '-' || event.key === '_' || event.key === 'Home') {
        event.preventDefault();
        this.changeCameraZoom(event.key === 'Home' ? 0 : event.key === '-' || event.key === '_' ? -1 : 1);
        return;
      }
    }
    const number = Number(event.key);
    if (event.key >= '1' && event.key <= '9') this.ui.activateSlot(number - 1);
    if (event.key === '0') this.selectTool('wall');
    if (event.key.toLowerCase() === 'p') this.selectTool('door');
    if (event.key.toLowerCase() === 'r' && this.tool === 'roof') { this.rotation = this.rotation ? 0 : 1; this.ui.toast(this.rotation ? 'Cobertura na vertical.' : 'Cobertura na horizontal.'); }
    if (event.key.toLowerCase() === 'e') { event.preventDefault(); this.interact(); }
  };

  private handlePageHide = (): void => { if (this.running) this.persist(); };
  private handleContextMenu = (event: MouseEvent): void => {
    event.preventDefault();
    if (this.editingMap) return;
    if (!this.running || this.adminMenu?.isOpen) return;
    if (this.ui.dismissTopToolbar()) return;
    if (!this.ui.isModalOpen()) this.ui.toggleTopToolbar();
  };
  private handleVisibility = (): void => { if (document.hidden && this.running) { this.persist(); this.input.keyboard?.resetKeys(); } };
  private handleBlur = (): void => { if (!this.editingMap && this.running && !this.ui.isModalOpen() && !this.adminMenu?.isOpen) this.ui.togglePause(); };

  private tileDistance(tile: TilePoint): number {
    return Phaser.Math.Distance.Between(this.player.x, this.player.y, tile.x * TILE + TILE / 2, tile.y * TILE + TILE / 2);
  }

  private clearReach(tile: TilePoint): boolean {
    const targetX = tile.x * TILE + 16; const targetY = tile.y * TILE + 16;
    const steps = Math.max(1, Math.ceil(Phaser.Math.Distance.Between(this.player.x, this.player.y, targetX, targetY) / 4));
    for (let i = 1; i < steps; i++) {
      const x = Math.floor((this.player.x + (targetX - this.player.x) * i / steps) / TILE);
      const y = Math.floor((this.player.y + (targetY - this.player.y) * i / steps) / TILE);
      if ((x !== tile.x || y !== tile.y) && this.blocked(x, y)) return false;
    }
    return true;
  }

  private nearWorkbench(): boolean {
    if (this.inHome) return false;
    return this.building.buildings.some(b => b.kind === 'workbench' && this.tileDistance(b) <= 112 && this.clearReach(b));
  }

  private targetTile(): TilePoint {
    if (this.lastAim && this.time.now < this.aimUntil && this.tileDistance(this.lastAim) <= 75) return this.lastAim;
    return {
      x: Math.floor((this.player.x + this.player.facing.x * 28) / TILE),
      y: Math.floor((this.player.y + this.player.facing.y * 28) / TILE),
    };
  }

  private nearestResource(): ResourceNode | undefined {
    const nearby = this.world.resources.filter(r => this.tileDistance(r) <= 62 && this.clearReach(r));
    const usable = nearby.filter(r => RESOURCE_DEFINITIONS[r.kind].tool === 'hand' || RESOURCE_DEFINITIONS[r.kind].tool === this.tool);
    return (usable.length ? usable : nearby).sort((a, b) => this.tileDistance(a) - this.tileDistance(b))[0];
  }

  private freeForBuilding(x: number, y: number, kind: BuildingData['kind']): boolean {
    if (!this.world.isBuildable(x, y) || this.farming.cropAt(x, y)) return false;
    if (buildingLayer(kind) === 'structure') {
      if (this.feetTiles().some(point => point.x === x && point.y === y)) return false;
      if (Math.floor(NPC_POSITION.x / TILE) === x && Math.floor(NPC_POSITION.y / TILE) === y) return false;
    }
    if (kind === 'door') {
      // Há espaço para entrar/sair por pelo menos um eixo.
      const passable = (tx: number, ty: number) => !this.blocked(tx, ty);
      if (!((passable(x, y - 1) && passable(x, y + 1)) || (passable(x - 1, y) && passable(x + 1, y)))) return false;
    }
    return true;
  }

  private placementReason(tile: TilePoint, kind: BuildingData['kind']): string {
    const piece: BuildingData = { ...tile, kind, ...(kind === 'roof' ? { rotation: this.rotation } : {}) };
    if (!buildingFootprint(piece).every(point => this.freeForBuilding(point.x, point.y, kind)
      && !this.building.at(point.x, point.y, buildingLayer(kind)))) return 'Espaço bloqueado ou camada ocupada.';
    const requirements = BUILD_REQUIREMENTS[kind];
    if (requirements.tools.some(item => !this.inventory.has(item))) return 'Fabrique um martelo antes de construir.';
    if (requirements.nearWorkbench && !this.nearWorkbench()) return 'Aproxime-se de uma bancada.';
    if (!this.inventory.canAfford(BUILD_COSTS[kind])) return 'Faltam materiais. Consulte o custo abaixo.';
    return '';
  }

  private blueprintReason(origin: TilePoint): string {
    for (const relative of BLUEPRINT_SHELTER) {
      const piece = { ...relative, x: relative.x + origin.x, y: relative.y + origin.y };
      if (!buildingFootprint(piece).every(point => this.freeForBuilding(point.x, point.y, piece.kind)
        && !this.building.at(point.x, point.y, buildingLayer(piece.kind)))) return 'O projeto precisa de uma área livre de 3×3.';
    }
    if (this.blocked(origin.x + 1, origin.y + 3)) return 'Deixe acesso livre ao sul da porta.';
    if (!this.inventory.has('hammer')) return 'Fabrique um martelo antes de construir.';
    if (!this.nearWorkbench()) return 'Aproxime-se de uma bancada.';
    if (!this.inventory.canAfford(BLUEPRINT_COST)) return 'Faltam materiais para o projeto. Consulte B.';
    return '';
  }

  private interact(explicitTile?: TilePoint): void {
    if (!this.canPlay() || this.time.now < this.nextInteractionAt) return;
    if (this.inHome) { this.interactHome(explicitTile); return; }
    if (this.nearHouseEntrance() && (!explicitTile || (explicitTile.x >= 23 && explicitTile.x <= 25 && explicitTile.y >= 15 && explicitTile.y <= 16))) {
      this.enterHome(); return;
    }
    let tile = explicitTile ?? this.targetTile();
    if (this.tileDistance(tile) > 78) { this.ui.toast('Chegue um pouco mais perto.'); return; }
    if (!this.clearReach(tile)) { this.ui.toast('Há um obstáculo entre você e o alvo.'); return; }
    if (this.tool === 'hand') {
      const door = this.building.at(tile.x, tile.y, 'structure');
      if (door?.kind === 'door') {
        if (door.open && this.feetTiles().some(point => point.x === tile.x && point.y === tile.y)) {
          this.ui.toast('Saia da passagem antes de fechar a porta.'); return;
        }
        this.ui.toast(this.building.toggleDoor(tile.x, tile.y).message);
        gameAudio.play('door');
        this.nextInteractionAt = this.time.now + 220;
        this.afterAction(); return;
      }
      const nearLia = Phaser.Math.Distance.Between(this.player.x, this.player.y, NPC_POSITION.x, NPC_POSITION.y) < 64;
      if (nearLia && this.clearReach({ x: Math.floor(NPC_POSITION.x / TILE), y: Math.floor(NPC_POSITION.y / TILE) })
        && (!explicitTile || Phaser.Math.Distance.Between(tile.x * TILE + 16, tile.y * TILE + 16, NPC_POSITION.x, NPC_POSITION.y) < 40)) {
        const lines = getLiaDialogue(this.state.metLia);
        this.state.metLia = true;
        this.ui.showDialogue('Lia', lines, () => { this.persist(); this.updateHUD(); });
        return;
      }
      const station = this.building.at(tile.x, tile.y, 'structure');
      if (station?.kind === 'workbench') { this.ui.toggleCrafting(this.inventory.data, this.nearWorkbench()); return; }
    }
    if (this.tool === 'hand' || this.tool === 'hatchet' || this.tool === 'pickaxe') {
      const resource = explicitTile ? this.world.resourceAt(tile.x, tile.y)
        : this.world.resourceAt(tile.x, tile.y) ?? this.nearestResource();
      if (resource && this.clearReach(resource) && this.tileDistance(resource) <= 78) {
        const result = this.resources.hit(resource, this.tool, this.inventory);
        if (result.ok) {
          this.nextInteractionAt = this.time.now + 260;
          this.resourceFeedback(resource);
          gameAudio.play(this.tool === 'pickaxe' ? 'stone' : this.tool === 'hatchet' ? 'wood' : 'pickup');
          if (result.depleted) {
            this.world.removeResource(resource.id);
            this.state.depletedResources.push(resource.id);
            this.state.progress.collected = this.state.progress.collected
              || ['tree-', 'stone-', 'fiber-'].every(prefix => this.state.depletedResources.some(id => id.startsWith(prefix)));
            this.state.progress.harvested = this.state.depletedResources.some(id => id.startsWith('standingTree-'))
              && this.state.depletedResources.some(id => id.startsWith('vein-'));
          }
        }
        this.ui.toast(result.message); this.afterAction(); return;
      }
      if (this.tool === 'hand' && this.farming.cropAt(tile.x, tile.y)) {
        const result = this.farming.harvest(tile.x, tile.y, this.inventory);
        if (result.ok) gameAudio.play('pickup');
        this.ui.toast(result.message); this.afterAction(); return;
      }
      this.ui.toast('Recolha galhos, pedras e fibras. C abre fabricação; B abre construção.'); return;
    }
    if (!explicitTile && (this.tool === 'plant' || this.tool === 'water') && !this.world.isFarm(tile.x, tile.y)) {
      const candidates: TilePoint[] = [];
      for (let y = 20; y <= 24; y++) for (let x = 21; x <= 29; x++) {
        const crop = this.farming.cropAt(x, y);
        if (this.tileDistance({ x, y }) <= 58 && this.clearReach({ x, y })
          && (this.tool === 'plant' ? !crop : crop && !crop.watered)) candidates.push({ x, y });
      }
      candidates.sort((a, b) => this.tileDistance(a) - this.tileDistance(b));
      if (candidates[0]) tile = candidates[0];
    }
    if (this.tool === 'water' && !this.state.homeSupplies?.wateringCan) { this.ui.toast('Recolha o regador dentro da casa.'); return; }
    if (this.tool === 'plant' || this.tool === 'water') {
      const result = this.tool === 'plant' ? this.farming.plant(tile.x, tile.y, this.inventory) : this.farming.water(tile.x, tile.y);
      if (result.ok) gameAudio.play(this.tool);
      this.ui.toast(result.message);
    } else if (this.tool === 'remove') {
      const result = this.building.remove(tile.x, tile.y, this.inventory);
      if (result.ok) gameAudio.play('build');
      this.ui.toast(result.message);
    } else if (this.tool === 'blueprint') {
      const reason = this.blueprintReason(tile);
      if (reason) { this.ui.toast(reason); return; }
      const result = this.building.placeBlueprint(tile, this.inventory, (x, y, kind) => this.freeForBuilding(x, y, kind),
        { nearWorkbench: this.nearWorkbench() });
      if (result.ok) gameAudio.play('build');
      this.ui.toast(result.message);
    } else {
      const reason = this.placementReason(tile, this.tool);
      if (reason) { this.ui.toast(reason); return; }
      const result = this.building.place(this.tool, tile.x, tile.y, this.inventory, true,
        { nearWorkbench: this.nearWorkbench(), rotation: this.rotation });
      if (result.ok) gameAudio.play('build');
      if (result.ok && this.tool === 'workbench') this.state.progress.builtWorkbench = true;
      this.ui.toast(result.message);
    }
    this.nextInteractionAt = this.time.now + 220;
    this.afterAction();
  }

  private resourceFeedback(resource: ResourceNode): void {
    const color = resource.kind === 'vein' || resource.kind === 'stone' ? 0xbfc6ac : 0xd9b778;
    for (let i = 0; i < 5; i++) {
      const chip = this.add.rectangle(resource.x * TILE + 16, resource.y * TILE + 12, 3, 3, color).setDepth(3600);
      this.tweens.add({ targets: chip, x: chip.x + (i - 2) * 8, y: chip.y - 10 - (i % 2) * 6,
        alpha: 0, duration: 350, onComplete: () => chip.destroy() });
    }
  }

  private afterAction(): void { this.syncSprites(); this.updateShelter(); this.updateHUD(); this.persist(); }

  private syncSprites(): void {
    const crops = this.farming.crops;
    const cropSignature = crops.map(c => `${c.x},${c.y},${c.growth >= 1 ? 2 : c.growth >= 0.45 ? 1 : 0},${c.watered}`).join(';');
    if (cropSignature !== this.cropSignature) {
      this.cropSprites.forEach(sprite => sprite.destroy());
      this.cropSoil.clear();
      this.cropSprites = crops.map(c => {
        if (c.watered) this.cropSoil.fillStyle(0x443c30, 0.55).fillRect(c.x * TILE + 2, c.y * TILE + 2, 28, 28);
        const stage = c.growth >= 1 ? 2 : c.growth >= 0.45 ? 1 : 0;
        const sprite = this.add.sprite(c.x * TILE + 16, c.y * TILE + 29, `crop-${stage}`).setOrigin(0.5, 1).setDepth(c.y * TILE + 25);
        if (!c.watered) sprite.setTint(0xd5ba86);
        return sprite;
      });
      this.cropSignature = cropSignature;
    }
    const buildingSignature = JSON.stringify(this.building.buildings);
    if (buildingSignature !== this.buildingSignature) {
      this.buildingSprites.forEach(sprite => sprite.destroy());
      this.roofSprites.forEach(sprite => sprite.destroy());
      this.roofSprites = [];
      this.buildingSprites = [];
      for (const b of this.building.buildings) {
        if (b.kind === 'roof') {
          const sprite = this.add.image(b.x * TILE, b.y * TILE, b.rotation ? 'roof-vertical' : 'roof')
            .setOrigin(0, 0).setDepth(3000).setData('tiles', buildingFootprint(b));
          this.roofSprites.push(sprite);
        } else {
          const texture = b.kind === 'door' && b.open ? 'door-open' : b.kind;
          const sprite = b.kind === 'floor' ? this.add.sprite(b.x * TILE, b.y * TILE, texture).setOrigin(0, 0).setDepth(-20)
            : this.add.sprite(b.x * TILE + 16, b.y * TILE + 29, texture).setOrigin(0.5, 1).setDepth(b.y * TILE + 30);
          this.buildingSprites.push(sprite);
        }
      }
      this.buildingSignature = buildingSignature;
    }
    this.damageMarks.clear();
    for (const progress of this.resources.progress) {
      const node = this.world.resources.find(resource => resource.id === progress.id);
      if (!node) continue;
      const x = node.x * TILE; const y = node.y * TILE;
      this.damageMarks.fillStyle(0x253d32, 0.9).fillRect(x + 2, y + 27, 28, 5);
      this.damageMarks.fillStyle(0xe6c481, 1).fillRect(x + 3, y + 28, 26 * progress.hits / RESOURCE_DEFINITIONS[node.kind].hits, 3);
      this.damageMarks.lineStyle(2, 0xead6a8, 0.9).lineBetween(x + 12, y + 11, x + 18, y + 21);
    }
  }

  private updateShelter(): void {
    if (this.inHome) {
      this.shelter = { sheltered: true, tiles: [], reason: 'Você está dentro da casa da propriedade.' };
      return;
    }
    this.shelter = detectShelter({ x: Math.floor(this.player.x / TILE), y: Math.floor(this.player.y / TILE) }, this.building.buildings);
    if (this.shelter.sheltered && !this.state.progress.builtShelter) {
      this.state.progress.builtShelter = true;
      this.ui.toast('Seu primeiro abrigo está pronto. Um pequeno lar depois da chuva.');
      this.persist();
    }
    const connected = new Set([`${Math.floor(this.player.x / TILE)},${Math.floor(this.player.y / TILE)}`]);
    const hidden = new Set<Phaser.GameObjects.Image>();
    let expanded = this.roofSprites.some(roof => (roof.getData('tiles') as TilePoint[]).some(tile => connected.has(`${tile.x},${tile.y}`)));
    while (expanded) {
      expanded = false;
      for (const roof of this.roofSprites) {
        if (hidden.has(roof)) continue;
        const tiles = roof.getData('tiles') as TilePoint[];
        if (tiles.some(tile => [[0, 0], [0, 1], [0, -1], [1, 0], [-1, 0]].some(([dx, dy]) => connected.has(`${tile.x + dx},${tile.y + dy}`)))) {
          hidden.add(roof); tiles.forEach(tile => connected.add(`${tile.x},${tile.y}`)); expanded = true;
        }
      }
    }
    for (const roof of this.roofSprites) roof.setAlpha(hidden.has(roof) ? 0.08 : 1);
  }

  private updateNight(): void {
    const hour = this.state.time / 60;
    const darkness = hour >= 19 ? Math.min(0.49, (hour - 19) * 0.12) : hour < 6 ? 0.49 : hour < 8 ? (8 - hour) * 0.245 : 0;
    this.night.setAlpha(this.inHome ? Math.min(.12, darkness) : darkness);
  }

  private updateHUD(): void {
    if (this.inHome) {
      const playerTile = { x: Math.floor(this.player.x / TILE), y: Math.floor(this.player.y / TILE) };
      const bed = this.home.bedNear(playerTile, 1.1);
      const nearExit = this.nearHomeExit();
      const supply = HOME_SUPPLIES.find(s => !this.state.homeSupplies?.[s.id] && this.tileDistance(s) <= 48);
      this.ui.updateHUD({ wateringCan: !!this.state.homeSupplies?.wateringCan, inHome: true, name: this.state.profile.name, day: this.state.day, time: this.state.time,
        inventory: this.inventory.data, tool: this.tool,
        playerTile: { x: this.player.x / TILE, y: this.player.y / TILE },
        interactionKey: nearExit || bed || supply ? 'E' : 'H',
        prompt: nearExit ? 'Sair de casa' : supply ? supply.label : bed ? 'Dormir até as 08:00 · disponível à noite' : 'Personalizar sua casa',
        location: 'Minha casa', harvests: this.inventory.data.turnip, metLia: this.state.metLia,
        nearWorkbench: false, sheltered: true, shelterReason: 'Interior da casa da propriedade.', resourceProgress: '', progress: this.state.progress });
      return;
    }
    const tile = this.targetTile();
    let prompt = 'Explorar e coletar';
    const resource = this.world.resourceAt(tile.x, tile.y) ?? this.nearestResource();
    let resourceProgress = '';
    if (this.tool === 'plant') prompt = 'Plantar nabo · 1 semente';
    else if (this.tool === 'water') prompt = 'Regar o canteiro';
    else if (this.tool === 'blueprint') prompt = this.blueprintReason(tile) || `Montar ${BLUEPRINT_LABEL} · clique ou E`;
    else if (this.tool in BUILD_COSTS) prompt = this.placementReason(tile, this.tool as BuildingData['kind']) || `Colocar ${BUILD_NAMES[this.tool as BuildingData['kind']]} · clique ou E`;
    else if (this.tool === 'remove') prompt = 'Desmontar peça · novas peças devolvem 60%';
    else if (this.building.at(tile.x, tile.y, 'structure')?.kind === 'door' && this.tool === 'hand') prompt = 'Abrir ou fechar porta';
    else if (this.building.at(tile.x, tile.y, 'structure')?.kind === 'workbench' && this.tool === 'hand') prompt = 'Usar bancada · fabricação';
    else if (Phaser.Math.Distance.Between(this.player.x, this.player.y, NPC_POSITION.x, NPC_POSITION.y) < 64) prompt = 'Conversar com Lia';
    else if (this.farming.cropAt(tile.x, tile.y)) {
      const crop = this.farming.cropAt(tile.x, tile.y)!;
      prompt = crop.growth >= 1 ? 'Colher nabo' : !crop.watered ? 'Precisa de água · equipe o regador' : `Nabo crescendo · ${Math.floor(crop.growth * 100)}%`;
    } else if (resource) {
      const definition = RESOURCE_DEFINITIONS[resource.kind];
      const hits = this.resources.progress.find(entry => entry.id === resource.id)?.hits ?? 0;
      const toolName = definition.tool === 'hand' ? 'mãos' : ITEM_NAMES[definition.tool];
      prompt = `${definition.label} · use ${toolName}`;
      if (definition.hits > 1) resourceProgress = `${definition.label}: ${hits}/${definition.hits} golpes · ${toolName}`;
    }
    if (this.nearHouseEntrance()) prompt = 'Entrar em casa';
    this.ui.updateHUD({ wateringCan: !!this.state.homeSupplies?.wateringCan, inHome: false, name: this.state.profile.name, day: this.state.day, time: this.state.time, inventory: this.inventory.data,
      tool: this.tool, prompt, location: locationAt(Math.floor(this.player.x / TILE), Math.floor(this.player.y / TILE)),
      playerTile: { x: this.player.x / TILE, y: this.player.y / TILE },
      harvests: this.inventory.data.turnip, metLia: this.state.metLia,
      nearWorkbench: this.nearWorkbench(), sheltered: this.shelter.sheltered, shelterReason: this.shelter.reason,
      resourceProgress, progress: this.state.progress });
  }

  update(_time: number, deltaMs: number): void {
    if (!this.state) return;
    const delta = Math.min(deltaMs / 1000, 0.25);
    if (this.titleBackgroundMode !== 'off') { this.updateTitleBackground(delta); return; }
    if (this.craftJob) {
      if (!this.ui.isCraftingOpen() || document.hidden) this.cancelCrafting();
      else {
        this.craftJob.elapsed += delta;
        this.ui.setCraftingProgress(this.craftJob.name, Math.min(0.999, this.craftJob.elapsed / this.craftJob.duration));
        if (this.craftJob.elapsed >= this.craftJob.duration) {
          const id = this.craftJob.id; this.craftJob = null; this.finishCrafting(id);
        }
      }
    }
    if (!this.canPlay()) return;
    this.cameras.main.setLerp(1 - Math.exp(-9 * delta));
    const previousX = this.player.x, previousY = this.player.y;
    this.player.update(delta, this.blocked, this.blockedPoint);
    if (Math.hypot(this.player.x - previousX, this.player.y - previousY) > .1) gameAudio.play('step');
    if (!this.inHome) this.world.updateOcclusion(this.player.x, this.player.y);
    this.farming.update(delta);
    const previousDay = this.state.day;
    Object.assign(this.state, advanceClock(this.state, delta * GAME_MINUTES_PER_SECOND));
    if (this.state.day !== previousDay) this.ui.toast(`Dia ${this.state.day}. A terra espera por você.`);
    this.updateNight();
    const tile = this.targetTile();
    this.selection.clear();
    if (!this.inHome && this.tool !== 'hand' && this.tileDistance(tile) < 80) {
      const kind = this.tool in BUILD_COSTS ? this.tool as BuildingData['kind'] : null;
      const crop = this.farming.cropAt(tile.x, tile.y);
      const valid = this.clearReach(tile) && (kind ? !this.placementReason(tile, kind) : this.tool === 'blueprint' ? !this.blueprintReason(tile)
        : this.tool === 'plant' ? this.world.isFarm(tile.x, tile.y) && !crop && this.inventory.has('seeds')
        : this.tool === 'water' ? !!crop && !crop.watered : this.tool === 'remove' ? !!this.building.at(tile.x, tile.y) : !!this.world.resourceAt(tile.x, tile.y));
      const footprint = this.tool === 'blueprint' ? Array.from({ length: 9 }, (_, i) => ({ x: tile.x + i % 3, y: tile.y + Math.floor(i / 3) }))
        : kind ? buildingFootprint({ ...tile, kind, rotation: this.rotation }) : [tile];
      for (const point of footprint) {
        this.selection.fillStyle(valid ? 0xf5d795 : 0xc87d69, 0.18).fillRect(point.x * TILE + 1, point.y * TILE + 1, 30, 30);
        this.selection.lineStyle(1, valid ? 0xf5d795 : 0xc87d69, 0.9).strokeRect(point.x * TILE + 2, point.y * TILE + 2, 28, 28);
        if (!valid) this.selection.lineBetween(point.x * TILE + 9, point.y * TILE + 9, point.x * TILE + 23, point.y * TILE + 23);
      }
    }
    this.hudTimer += delta;
    this.saveTimer += delta;
    if (this.hudTimer > 0.25) {
      this.hudTimer = 0;
      const region = getRegionAt(Math.floor(this.player.x / TILE), Math.floor(this.player.y / TILE));
      if (!this.inHome && region.id !== this.currentRegion) {
        this.currentRegion = region.id;
        this.ui.toast(`${region.name} · ${region.description}`);
        this.persist();
      }
      this.updateShelter(); this.updateHUD(); if (!this.inHome) this.syncSprites();
    }
    if (this.saveTimer > 12) { this.saveTimer = 0; this.persist(); }
  }
}
