import Phaser from 'phaser';
import { Player } from '../player';
import { createArt } from '../art';
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
import { createNewSave, hasSave, loadSave, saveGame } from '../systems/save';
import type { BuildingData, CharacterProfile, SaveData, Tool, TilePoint } from '../types';
import type { GameUI } from '../ui';

const TOOLS: Tool[] = ['hand', 'plant', 'water', 'fence', 'bench', 'remove', 'hatchet', 'pickaxe', 'workbench', 'wall'];
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

  constructor() { super('Vale'); }

  preload(): void { preloadVisualAssets(this); }

  create(): void {
    createArt(this);
    this.loadState(createNewSave(DEFAULT_PROFILE));
    this.ui.showTitle(hasSave());
    window.addEventListener('keydown', this.handleKey);
    window.addEventListener('pagehide', this.handlePageHide);
    window.addEventListener('beforeunload', this.handlePageHide);
    document.addEventListener('visibilitychange', this.handleVisibility);
    window.addEventListener('blur', this.handleBlur);
    this.scale.on('resize', this.updateZoom, this);
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
      this.scale.off('resize', this.updateZoom, this);
    });
  }

  startNew(profile: CharacterProfile): void {
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
    this.loadState(saved);
    this.running = true;
    this.paused = false;
    this.ui.showHUD();
    this.ui.toast(`Que bom ter você de volta, ${saved.profile.name}.`);
    this.updateHUD();
  }

  setPaused(value: boolean): void {
    this.paused = value;
    this.input.keyboard?.resetKeys();
    if (value && this.running) this.persist();
  }

  selectTool(tool: Tool): void {
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
    this.cancelCrafting();
    if (this.running) this.persist();
    this.running = false;
    this.paused = true;
    this.ui.showTitle(hasSave());
  }

  persist(): boolean {
    if (!this.running || !this.state) return false;
    const data: SaveData = {
      ...this.state,
      player: { x: this.player.x, y: this.player.y, direction: this.player.facing.y < 0 ? 'up' : this.player.facing.y > 0 ? 'down' : this.player.facing.x < 0 ? 'left' : 'right' },
      inventory: { ...this.inventory.data },
      crops: this.farming.crops.map(crop => ({ ...crop })),
      buildings: this.building.buildings.map(building => ({ ...building })),
      resourceProgress: this.resources.progress.map(entry => ({ ...entry })),
      equippedTool: this.tool,
    };
    const ok = saveGame(data);
    if (!ok && !this.saveWarningShown) {
      this.saveWarningShown = true;
      this.ui.toast('Não foi possível salvar localmente. Seu progresso atual dura apenas nesta sessão.');
    }
    return ok;
  }

  private loadState(data: SaveData): void {
    this.craftJob = null;
    this.children.removeAll(true);
    this.state = structuredClone(data);
    this.inventory = new Inventory(data.inventory);
    this.farming = new Farming(data.crops);
    this.building = new Building(data.buildings);
    this.resources = new Resources(data.resourceProgress);
    this.cropSprites = [];
    this.buildingSprites = [];
    this.roofSprites = [];
    this.cropSignature = '';
    this.buildingSignature = '';
    this.world = createWorld(this, data.depletedResources, data.buildings);
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
    this.player.facing = direction === 'up' ? { x: 0, y: -1 } : direction === 'left' ? { x: -1, y: 0 } : direction === 'right' ? { x: 1, y: 0 } : { x: 0, y: 1 };
    this.input.keyboard?.resetKeys();
    this.player.update(0, this.blocked);
    this.recoverPlayerPosition();
    this.world.updateOcclusion(this.player.x, this.player.y);
    this.add.sprite(NPC_POSITION.x, NPC_POSITION.y, 'lia').setOrigin(0.5, 1).setDepth(NPC_POSITION.y);
    this.add.text(NPC_POSITION.x, NPC_POSITION.y - 40, 'Lia', {
      fontFamily: 'monospace', fontSize: '10px', color: '#fff1d2', backgroundColor: '#344d3d', padding: { x: 5, y: 3 },
    }).setOrigin(0.5).setDepth(NPC_POSITION.y + 1);
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
  }

  private updateZoom(): void { this.cameras.main.setZoom(this.scale.width < 1000 || this.scale.height < 700 ? 1 : 2); }

  private feetTiles(x = this.player.x, y = this.player.y): TilePoint[] {
    return [[-7, -5], [7, -5], [-7, 3], [7, 3]].map(([ox, oy]) => ({ x: Math.floor((x + ox) / TILE), y: Math.floor((y + oy) / TILE) }));
  }

  private recoverPlayerPosition(): void {
    if (this.feetTiles().every(point => !this.blocked(point.x, point.y))) return;
    const startX = Math.floor(this.player.x / TILE);
    const startY = Math.floor(this.player.y / TILE);
    for (let radius = 0; radius < Math.max(WORLD_WIDTH, WORLD_HEIGHT); radius++) {
      for (let y = startY - radius; y <= startY + radius; y++) for (let x = startX - radius; x <= startX + radius; x++) {
        if (Math.max(Math.abs(x - startX), Math.abs(y - startY)) !== radius) continue;
        const px = x * TILE + 16; const py = y * TILE + 16;
        if (this.feetTiles(px, py).every(point => !this.blocked(point.x, point.y))) {
          this.player.x = px; this.player.y = py;
          this.player.sprite.setPosition(px, py);
          return;
        }
      }
    }
  }

  private canPlay(): boolean { return this.running && !this.paused && !this.ui.isModalOpen() && !document.hidden; }
  private blocked = (x: number, y: number): boolean => this.world.isBlocked(x, y) || this.building.isBlocked(x, y)
    || (x === Math.floor(NPC_POSITION.x / TILE) && y === Math.floor(NPC_POSITION.y / TILE));

  private handleKey = (event: KeyboardEvent): void => {
    const target = event.target;
    if (target instanceof HTMLElement && target.matches('input, textarea, select, [contenteditable="true"]')) return;
    if (this.canPlay() && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)) event.preventDefault();
    if (event.repeat) return;
    if (event.key === 'Escape' && this.running) { event.preventDefault(); this.ui.togglePause(); return; }
    if (event.key.toLowerCase() === 'i' && this.running) { this.ui.toggleInventory(this.inventory.data); return; }
    if (event.key.toLowerCase() === 'c' && this.running) { event.preventDefault(); this.ui.toggleCrafting(this.inventory.data, this.nearWorkbench()); return; }
    if (event.key.toLowerCase() === 'b' && this.running) { event.preventDefault(); this.ui.toggleBuilding(this.inventory.data, this.nearWorkbench()); return; }
    if (event.key.toLowerCase() === 'm' && this.running) { event.preventDefault(); this.ui.toggleMap(); return; }
    if (!this.canPlay()) return;
    const number = Number(event.key);
    if (event.key >= '1' && event.key <= '9') this.selectTool(TOOLS[number - 1]);
    if (event.key === '0') this.selectTool('wall');
    if (event.key.toLowerCase() === 'p') this.selectTool('door');
    if (event.key.toLowerCase() === 'r' && this.tool === 'roof') { this.rotation = this.rotation ? 0 : 1; this.ui.toast(this.rotation ? 'Cobertura na vertical.' : 'Cobertura na horizontal.'); }
    if (event.key.toLowerCase() === 'e') { event.preventDefault(); this.interact(); }
  };

  private handlePageHide = (): void => { if (this.running) this.persist(); };
  private handleVisibility = (): void => { if (document.hidden && this.running) { this.persist(); this.input.keyboard?.resetKeys(); } };
  private handleBlur = (): void => { if (this.running && !this.ui.isModalOpen()) this.ui.togglePause(); };

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
        this.ui.toast(this.farming.harvest(tile.x, tile.y, this.inventory).message); this.afterAction(); return;
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
    if (this.tool === 'plant' || this.tool === 'water') {
      const result = this.tool === 'plant' ? this.farming.plant(tile.x, tile.y, this.inventory) : this.farming.water(tile.x, tile.y);
      this.ui.toast(result.message);
    } else if (this.tool === 'remove') {
      this.ui.toast(this.building.remove(tile.x, tile.y, this.inventory).message);
    } else if (this.tool === 'blueprint') {
      const reason = this.blueprintReason(tile);
      if (reason) { this.ui.toast(reason); return; }
      this.ui.toast(this.building.placeBlueprint(tile, this.inventory, (x, y, kind) => this.freeForBuilding(x, y, kind),
        { nearWorkbench: this.nearWorkbench() }).message);
    } else {
      const reason = this.placementReason(tile, this.tool);
      if (reason) { this.ui.toast(reason); return; }
      const result = this.building.place(this.tool, tile.x, tile.y, this.inventory, true,
        { nearWorkbench: this.nearWorkbench(), rotation: this.rotation });
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
    this.night.setAlpha(darkness);
  }

  private updateHUD(): void {
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
      prompt = crop.growth >= 1 ? 'Colher nabo' : !crop.watered ? 'Precisa de água · use 3' : `Nabo crescendo · ${Math.floor(crop.growth * 100)}%`;
    } else if (resource) {
      const definition = RESOURCE_DEFINITIONS[resource.kind];
      const hits = this.resources.progress.find(entry => entry.id === resource.id)?.hits ?? 0;
      const toolName = definition.tool === 'hand' ? 'mãos' : ITEM_NAMES[definition.tool];
      prompt = `${definition.label} · use ${toolName}`;
      if (definition.hits > 1) resourceProgress = `${definition.label}: ${hits}/${definition.hits} golpes · ${toolName}`;
    }
    this.ui.updateHUD({ name: this.state.profile.name, day: this.state.day, time: this.state.time, inventory: this.inventory.data,
      tool: this.tool, prompt, location: locationAt(Math.floor(this.player.x / TILE), Math.floor(this.player.y / TILE)),
      playerTile: { x: Math.floor(this.player.x / TILE), y: Math.floor(this.player.y / TILE) },
      harvests: this.inventory.data.turnip, metLia: this.state.metLia,
      nearWorkbench: this.nearWorkbench(), sheltered: this.shelter.sheltered, shelterReason: this.shelter.reason,
      resourceProgress, progress: this.state.progress });
  }

  update(_time: number, deltaMs: number): void {
    if (!this.state) return;
    const delta = Math.min(deltaMs / 1000, 0.25);
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
    this.player.update(delta, this.blocked);
    this.world.updateOcclusion(this.player.x, this.player.y);
    this.farming.update(delta);
    this.state.time += delta * 2;
    if (this.state.time >= 1440) { this.state.time -= 1440; this.state.day += 1; this.ui.toast(`Dia ${this.state.day}. A terra espera por você.`); }
    this.updateNight();
    const tile = this.targetTile();
    this.selection.clear();
    if (this.tool !== 'hand' && this.tileDistance(tile) < 80) {
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
      if (region.id !== this.currentRegion) {
        this.currentRegion = region.id;
        this.ui.toast(`${region.name} · ${region.description}`);
        this.persist();
      }
      this.updateShelter(); this.updateHUD(); this.syncSprites();
    }
    if (this.saveTimer > 12) { this.saveTimer = 0; this.persist(); }
  }
}
