import Phaser from 'phaser';
import { Player } from '../player';
import { createArt } from '../art';
import { createWorld, NPC_POSITION, TILE, WORLD_WIDTH, WORLD_HEIGHT } from '../world';
import type { WorldView, ResourceNode } from '../world';
import { Inventory } from '../systems/inventory';
import { Farming } from '../systems/farming';
import { Building } from '../systems/building';
import { getLiaDialogue } from '../systems/npc';
import { createNewSave, hasSave, loadSave, saveGame } from '../systems/save';
import type { CharacterProfile, SaveData, Tool, TilePoint } from '../types';
import type { GameUI } from '../ui';

const TOOLS: Tool[] = ['hand', 'plant', 'water', 'fence', 'bench', 'remove'];
const DEFAULT_PROFILE: CharacterProfile = { name: 'Viajante', skin: '#d9a276', hairStyle: 'curto', hairColor: '#47352c', outfit: '#b16c4c' };

export class ValleyScene extends Phaser.Scene {
  ui!: GameUI;
  private world!: WorldView;
  private player!: Player;
  private inventory!: Inventory;
  private farming!: Farming;
  private building!: Building;
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

  constructor() { super('Vale'); }

  create(): void {
    createArt(this);
    this.loadState(createNewSave(DEFAULT_PROFILE));
    this.ui.showTitle(hasSave());
    window.addEventListener('keydown', this.handleKey);
    window.addEventListener('pagehide', this.handlePageHide);
    window.addEventListener('beforeunload', this.handlePageHide);
    document.addEventListener('visibilitychange', this.handleVisibility);
    window.addEventListener('blur', this.handleBlur);
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
    });
  }

  startNew(profile: CharacterProfile): void {
    this.loadState(createNewSave(profile));
    this.running = true;
    this.paused = false;
    this.ui.showHUD();
    this.ui.toast('Um novo começo. Lia está perto da horta; aproxime-se e pressione E.');
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

  selectTool(tool: Tool): void { this.tool = tool; if (this.state) this.updateHUD(); }

  mainMenu(): void {
    if (this.running) this.persist();
    this.running = false;
    this.paused = true;
    this.ui.showTitle(hasSave());
  }

  persist(): boolean {
    if (!this.running || !this.state) return false;
    const data: SaveData = {
      ...this.state,
      player: { x: this.player.x, y: this.player.y },
      inventory: { ...this.inventory.data },
      crops: this.farming.crops.map(crop => ({ ...crop })),
      buildings: this.building.buildings.map(building => ({ ...building })),
    };
    const ok = saveGame(data);
    if (!ok && !this.saveWarningShown) {
      this.saveWarningShown = true;
      this.ui.toast('O navegador bloqueou o salvamento. Seu progresso dura apenas nesta sessão.');
    }
    return ok;
  }

  private loadState(data: SaveData): void {
    this.children.removeAll(true);
    this.state = structuredClone(data);
    this.inventory = new Inventory(data.inventory);
    this.farming = new Farming(data.crops);
    this.building = new Building(data.buildings);
    this.cropSprites = [];
    this.buildingSprites = [];
    this.cropSignature = '';
    this.buildingSignature = '';
    this.world = createWorld(this, data.depletedResources);
    this.cropSoil = this.add.graphics().setDepth(-50);
    this.player = new Player(this, data.profile, data.player.x, data.player.y);
    // Recupera saves antigos que tenham colocado o personagem dentro de um obstáculo.
    if (this.blocked(Math.floor(this.player.x / TILE), Math.floor(this.player.y / TILE))) {
      this.player.x = 25 * TILE + 16;
      this.player.y = 18 * TILE + 16;
    }
    this.add.sprite(NPC_POSITION.x, NPC_POSITION.y, 'lia').setOrigin(0.5, 1).setDepth(NPC_POSITION.y);
    this.add.text(NPC_POSITION.x, NPC_POSITION.y - 40, 'Lia', {
      fontFamily: 'monospace', fontSize: '10px', color: '#fff1d2', backgroundColor: '#344d3d', padding: { x: 5, y: 3 },
    }).setOrigin(0.5).setDepth(NPC_POSITION.y + 1);
    this.selection = this.add.graphics().setDepth(4000);
    this.night = this.add.rectangle(0, 0, WORLD_WIDTH * TILE, WORLD_HEIGHT * TILE, 0x14203c, 1).setOrigin(0).setDepth(5000).setAlpha(0);
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH * TILE, WORLD_HEIGHT * TILE);
    this.cameras.main.setZoom(this.scale.width < 800 ? 1.25 : 1.65);
    this.cameras.main.startFollow(this.player.sprite, false, 0.12, 0.12);
    this.cameras.main.centerOn(this.player.x, this.player.y);
    this.tool = 'hand';
    this.lastAim = null;
    this.saveTimer = 0;
    this.hudTimer = 0;
    this.syncSprites();
    this.updateNight();
  }

  private canPlay(): boolean { return this.running && !this.paused && !this.ui.isModalOpen() && !document.hidden; }
  private blocked = (x: number, y: number): boolean => this.world.isBlocked(x, y) || !!this.building.at(x, y)
    || (x === Math.floor(NPC_POSITION.x / TILE) && y === Math.floor(NPC_POSITION.y / TILE));

  private handleKey = (event: KeyboardEvent): void => {
    const target = event.target as HTMLElement | null;
    if (target?.matches('input, textarea, select, [contenteditable="true"]')) return;
    if (event.repeat) return;
    if (event.key === 'Escape' && this.running) { event.preventDefault(); this.ui.togglePause(); return; }
    if (event.key.toLowerCase() === 'i' && this.running) { this.ui.toggleInventory(this.inventory.data); return; }
    if (!this.canPlay()) return;
    const number = Number(event.key);
    if (number >= 1 && number <= TOOLS.length) this.selectTool(TOOLS[number - 1]);
    if (event.key.toLowerCase() === 'e') { event.preventDefault(); this.interact(); }
  };

  private handlePageHide = (): void => { if (this.running) this.persist(); };
  private handleVisibility = (): void => { if (document.hidden && this.running) { this.persist(); this.input.keyboard?.resetKeys(); } };
  private handleBlur = (): void => { if (this.running && !this.ui.isModalOpen()) this.ui.togglePause(); };

  private tileDistance(tile: TilePoint): number {
    return Phaser.Math.Distance.Between(this.player.x, this.player.y, tile.x * TILE + TILE / 2, tile.y * TILE + TILE / 2);
  }

  private targetTile(): TilePoint {
    if (this.lastAim && this.time.now < this.aimUntil && this.tileDistance(this.lastAim) <= 75) return this.lastAim;
    return {
      x: Math.floor((this.player.x + this.player.facing.x * 28) / TILE),
      y: Math.floor((this.player.y + this.player.facing.y * 28) / TILE),
    };
  }

  private nearestResource(): ResourceNode | undefined {
    return this.world.resources.filter(r => !this.state.depletedResources.includes(r.id) && this.tileDistance(r) <= 62)
      .sort((a, b) => this.tileDistance(a) - this.tileDistance(b))[0];
  }

  private interact(explicitTile?: TilePoint): void {
    if (!this.canPlay()) return;
    let tile = explicitTile ?? this.targetTile();
    if (this.tileDistance(tile) > 78) { this.ui.toast('Chegue um pouco mais perto.'); return; }
    if (this.tool === 'hand') {
      const nearLia = Phaser.Math.Distance.Between(this.player.x, this.player.y, NPC_POSITION.x, NPC_POSITION.y) < 64;
      if (nearLia && (!explicitTile || Phaser.Math.Distance.Between(tile.x * TILE + 16, tile.y * TILE + 16, NPC_POSITION.x, NPC_POSITION.y) < 40)) {
        const lines = getLiaDialogue(this.state.metLia);
        this.state.metLia = true;
        this.ui.showDialogue('Lia', lines, () => { this.persist(); this.updateHUD(); });
        return;
      }
      const resource = explicitTile ? this.world.resourceAt(tile.x, tile.y) : this.nearestResource();
      if (resource && !this.state.depletedResources.includes(resource.id)) {
        const item = resource.kind === 'tree' ? 'wood' : resource.kind === 'stone' ? 'stone' : 'seeds';
        const amount = resource.kind === 'tree' ? 4 : resource.kind === 'stone' ? 3 : 3;
        this.inventory.add(item, amount);
        this.world.removeResource(resource.id);
        this.state.depletedResources.push(resource.id);
        this.ui.toast(`+${amount} ${item === 'wood' ? 'madeira' : item === 'stone' ? 'pedras' : 'sementes de nabo'}.`);
        this.afterAction();
        return;
      }
      const crop = this.farming.cropAt(tile.x, tile.y);
      if (crop) { this.ui.toast(this.farming.harvest(tile.x, tile.y, this.inventory).message); this.afterAction(); return; }
      this.ui.toast('Explore a clareira: recolha galhos, pedras e sementes. Na horta, use 2 para plantar.');
      return;
    }
    if (!explicitTile && (this.tool === 'plant' || this.tool === 'water') && !this.world.isFarm(tile.x, tile.y)) {
      const candidates: TilePoint[] = [];
      for (let y = 20; y <= 24; y++) for (let x = 21; x <= 29; x++) if (this.tileDistance({ x, y }) <= 58) candidates.push({ x, y });
      candidates.sort((a, b) => this.tileDistance(a) - this.tileDistance(b));
      if (candidates[0]) tile = candidates[0];
    }
    if (this.tool === 'plant' || this.tool === 'water') {
      if (!this.world.isFarm(tile.x, tile.y)) { this.ui.toast('Use esta ferramenta nos canteiros, ao sul da casa.'); return; }
      const result = this.tool === 'plant' ? this.farming.plant(tile.x, tile.y, this.inventory) : this.farming.water(tile.x, tile.y);
      this.ui.toast(result.message);
    } else if (this.tool === 'remove') {
      this.ui.toast(this.building.remove(tile.x, tile.y, this.inventory).message);
    } else {
      const ownTile = { x: Math.floor(this.player.x / TILE), y: Math.floor(this.player.y / TILE) };
      const npcTile = { x: Math.floor(NPC_POSITION.x / TILE), y: Math.floor(NPC_POSITION.y / TILE) };
      const free = this.world.isBuildable(tile.x, tile.y) && !(tile.x === ownTile.x && tile.y === ownTile.y)
        && !(tile.x === npcTile.x && tile.y === npcTile.y) && !this.farming.cropAt(tile.x, tile.y);
      this.ui.toast(this.building.place(this.tool, tile.x, tile.y, this.inventory, free).message);
    }
    this.afterAction();
  }

  private afterAction(): void { this.syncSprites(); this.updateHUD(); this.persist(); }

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
      this.buildingSprites = this.building.buildings.map(b => this.add.sprite(b.x * TILE + 16, b.y * TILE + 29, b.kind).setOrigin(0.5, 1).setDepth(b.y * TILE + 30));
      this.buildingSignature = buildingSignature;
    }
  }

  private updateNight(): void {
    const hour = this.state.time / 60;
    const darkness = hour >= 19 ? Math.min(0.49, (hour - 19) * 0.12) : hour < 6 ? 0.49 : hour < 8 ? (8 - hour) * 0.2 : 0;
    this.night.setAlpha(darkness);
  }

  private updateHUD(): void {
    const tile = this.targetTile();
    let prompt = 'Explorar e coletar';
    if (this.tool === 'plant') prompt = 'Plantar nabo · 1 semente';
    else if (this.tool === 'water') prompt = 'Regar o canteiro';
    else if (this.tool === 'fence') prompt = 'Construir cerca · 2 madeiras';
    else if (this.tool === 'bench') prompt = 'Colocar banco · 4 madeiras + 2 pedras';
    else if (this.tool === 'remove') prompt = 'Remover construção · recuperar materiais';
    else if (Phaser.Math.Distance.Between(this.player.x, this.player.y, NPC_POSITION.x, NPC_POSITION.y) < 64) prompt = 'Conversar com Lia';
    else if (this.farming.cropAt(tile.x, tile.y)) {
      const crop = this.farming.cropAt(tile.x, tile.y)!;
      prompt = crop.growth >= 1 ? 'Colher nabo' : !crop.watered ? 'Precisa de água · use 3' : `Nabo crescendo · ${Math.floor(crop.growth * 100)}%`;
    } else if (this.nearestResource()) prompt = 'Recolher recurso';
    this.ui.updateHUD({ name: this.state.profile.name, day: this.state.day, time: this.state.time, inventory: this.inventory.data,
      tool: this.tool, prompt, location: this.player.x < 18 * TILE ? 'Mata do recomeço' : this.player.x > 35 * TILE ? 'Margem do riacho' : 'Seu refúgio', harvests: this.inventory.data.turnip, metLia: this.state.metLia });
  }

  update(_time: number, deltaMs: number): void {
    if (!this.state || !this.canPlay()) return;
    const delta = Math.min(deltaMs / 1000, 0.08);
    this.player.update(delta, this.blocked);
    this.farming.update(delta);
    this.state.time += delta * 2;
    if (this.state.time >= 1440) { this.state.time -= 1440; this.state.day += 1; this.ui.toast(`Dia ${this.state.day}. A terra espera por você.`); }
    this.updateNight();
    const tile = this.targetTile();
    this.selection.clear();
    if (this.tool !== 'hand' && this.tileDistance(tile) < 80) {
      const valid = this.tool === 'plant' || this.tool === 'water' ? this.world.isFarm(tile.x, tile.y) : this.tool === 'remove' ? !!this.building.at(tile.x, tile.y) : this.world.isBuildable(tile.x, tile.y) && !this.building.at(tile.x, tile.y);
      this.selection.lineStyle(1.5, valid ? 0xf5d795 : 0xc87d69, 0.9).strokeRect(tile.x * TILE + 2, tile.y * TILE + 2, 28, 28);
    }
    this.hudTimer += delta;
    this.saveTimer += delta;
    if (this.hudTimer > 0.25) { this.hudTimer = 0; this.updateHUD(); this.syncSprites(); }
    if (this.saveTimer > 12) { this.saveTimer = 0; this.persist(); }
  }
}
