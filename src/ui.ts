import {FARM_KINDS,FARM_BUILDINGS,FARM_BASE_COST,isFarmTool} from './data/farm-buildings';
import {mountMineMissionJournal,mineMissionSummary} from './mine-mission-journal';
import type {MineMissionRuntime} from './systems/mine-missions';
import {UNIQUE_CRAFT_ITEMS} from './systems/crafting';
import {swordIcon} from './data/sword-icon';
import {weatherForDay,WEATHER_NAMES} from './weather-model';
import {mountFishingJournal} from './fishing-journal';
import {createSaveLibraryPanel} from './save-library-panel';
import type {SaveData} from './types';
import type {ShelterAction} from './systems/pet-shelter';
import {petShelterHTML} from './pet-shelter-menu';
import { petMenuHTML, petCollectionHTML, type PetMenuView, type PetCommand } from "./dungeons/pet-menu";
import { CompanionQuickPanel } from './dungeons/companion-quick-panel';
import {inspectSave,hasSave} from './systems/save';
import {inventoryCapacity} from './systems/inventory';
import {USABLE_VILLAGE_ITEMS} from './systems/consumables';
import { fencePreview, gatePreview } from './fence-art';
import { FENCE_STAGES, FENCE_NAMES, FENCE_STAGE_DAYS } from './data/fences';
import { dayPhase, SUNRISE_MINUTES, SUNSET_MINUTES } from './daylight-model';
import { getVisualSettings, setVisualSettings } from './visual-settings';
import { makeDraggablePanel } from './draggable-panel';
import { CAMERA_ZOOM_MIN, CAMERA_ZOOM_MAX } from './camera-zoom';
import './camera-zoom.css';
import { gameAudio } from './audio';
import { toolbarIcon } from './toolbar-icons';
import {controlGuide} from './control-guide';
import {DEVELOPMENT_TOOLS} from './development-tools';
import { createCharacterEditor } from './character-creator';
import { createTitleScreen } from './title-screen';
import { CinematicPlayer } from './cinematic-player';
import { NEW_GAME_OPENING } from './new-game-opening';
import './cinematic-player.css';
import { TopToolbar } from './top-toolbar';
import type { ToolbarAction } from './top-toolbar';
import type { TitleBackgroundMode } from './title-screen';
import { itemIconUrl } from './visual-assets';
import { HOME_WIDTH, HOME_HEIGHT } from './systems/home';
import { emptyQuickbar, assignQuickSlot, quickItem, quickAction, quickQuantity, isQuickSlot, inventoryEntries } from './systems/quickbar';
import {referencedTool,toolReferenceParts,syncToolInstances,durableTool,wearsOut,individualTool,activeToolCopy} from './systems/tool-instances';
import {ECONOMY_BALANCE} from './data/economy-balance';
import {fishingActive} from './fishing-ui';
import type { QuickSlot } from './types';
import './inventory-ui.css';
import { WORLD_HEIGHT, WORLD_WIDTH } from './data/regions';
import { BUILD_COSTS, BUILD_NAMES, BUILD_REQUIREMENTS } from './systems/building';
import { ITEMS, ITEM_IDS, ITEM_NAMES } from './data/items';
import { BLUEPRINT_COST } from './data/blueprints';
import { RECIPES } from './data/recipes';
import { createHomeEditor } from './home-ui';
import type { HomeEditor, HomeEditResponse,HomeEditorOptions } from './home-ui';
import type { HomeData, HomeEditAction } from './systems/home';
import type { BuildingData, CharacterProfile, HudData, InventoryData, ItemId, Tool } from './types';

interface UICallbacks {
  getMineMissionRuntime?():MineMissionRuntime|undefined;
  getFishingState?():SaveData|undefined;
  onUseItem(item:ItemId,toolId?:number):void;
  onDropItem?(item:ItemId,amount:number,toolId?:number):void;
  onNewGame(profile: CharacterProfile): void;
  onContinue(): void;
  onTool(tool: Tool,toolId?:number): void;
  onCraft(recipeId: string): void;
  onCancelCraft(): void;
  onBlueprint(): void;
  onPause(paused: boolean): void;
  onSave(): boolean;
  onMap(): Promise<string>;
  onMainMenu(): void;
  onTitleBackground(mode: TitleBackgroundMode): void;
  onAdminMenu(): void;
  onMapEditor(): void;
  onCompanions?(): void;
  onZoom(direction: -1 | 0 | 1): void;
}

const paths: Record<string, string> = {
  map: '<path d="m2 4 6-2 8 3 6-2v17l-6 2-8-3-6 2Zm6-2v17M16 5v17"/>',
  leaf: '<path d="M12 21V11m0 5C3 16 3 5 3 5s9-1 9 11Zm0-5C12 3 21 3 21 3s1 9-9 10Z"/>',
  rain: '<path d="M6 14a4 4 0 1 1 1-8 5 5 0 0 1 9 0 4 4 0 0 1 1 8Z M7 17l-1 3m6-3-1 3m6-3-1 3"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
  moon: '<path d="M20 15A9 9 0 0 1 9 3a9 9 0 1 0 11 12Z"/>',
  wood: '<path d="m5 15 9-9 5 5-9 9Z"/><ellipse cx="7.5" cy="17.5" rx="3.5" ry="3.5"/><path d="m15 5 3-2 4 4-3 3M5 17l3 1"/>',
  stone: '<path d="m3 16 4-9 8-3 6 9-4 7H8Z"/><path d="m7 7 4 6 10 0m-10 0-3 7"/>',
  seeds: '<path d="M12 21V10m0 5C5 15 4 7 4 7s8-1 8 8Zm0-5c0-6 7-7 7-7s1 8-7 8"/>',
  turnip: '<path d="M7 11c-4 6 4 9 5 11 1-2 9-5 5-11Z"/><path d="M12 11C5 10 7 3 7 3s6 1 5 8Zm0 0c-1-7 6-8 6-8s2 7-6 8"/>',
  hand: '<path d="M7 13V8a2 2 0 0 1 4 0v4-7a2 2 0 0 1 4 0v7-5a2 2 0 0 1 4 0v8c0 5-3 7-6 7-4 0-5-3-9-7a2 2 0 0 1 3-3l3 3"/>',
  water: '<path d="M7 10h9v10H7Zm2-4h5v4M16 12l5-4v9l-5-2M7 12H4a3 3 0 0 1 0-6h4"/>',
  fence: '<path d="m4 3 3 3v16H1V6Zm15 0 3 3v16h-6V6ZM7 9h9M7 16h9"/>',
  bench: '<path d="M4 5h16v8H4Zm-2 8h20v4H2Zm3 4v5m14-5v5M4 9h16"/>',
  remove: '<path d="m4 20 11-11m-2-6 8 8-4 4-8-8Zm-8 9 7 7"/>',
  bag: '<path d="M5 8h14l2 14H3Zm3 0V6a4 4 0 0 1 8 0v2M9 12h6"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  pin: '<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2"/>',
  save: '<path d="M4 3h13l4 4v14H3V3Zm3 0v7h10V3M7 21v-7h10v7"/>',
  chevron: '<path d="m7 10 5 5 5-5"/>',
  branch: '<path d="m6 22 8-20m-4 11L4 8m9-1 6-3M8 17l10-4"/>',
  log: '<path d="m5 15 9-10 6 6-9 9Z"/><ellipse cx="8" cy="17" rx="5" ry="4"/><ellipse cx="8" cy="17" rx="2" ry="1.5"/>',
  plank: '<path d="m3 7 13-4 5 14-13 4ZM5 10l10-3M9 18l10-3M10 6l4 13"/>',
  scrap: '<path d="m4 8 4-4 13 3-3 11-6 3-8-7Z"/><path d="m8 4 2 10 8 4M4 8l6 6 11-7"/>',
  hatchet: '<path d="m6 22 9-17m-3-2 8 4-3 7-8-5Z"/>',
  pickaxe: '<path d="m7 22 8-16M5 8c5-6 11-6 16 0l-6-2-5 4Z"/>',
  handsaw: '<path d="m2 17 13-12 7 7-3 3-3-2-2 4-3-1-2 4-3-1-2 2Z"/><path d="m17 7 3 3-2 2-3-3Z"/>',
  workbench: '<path d="M2 8h20v5H2Zm3 5v9m14-9v9M7 4h6v4m3-5v5M5 17h14"/>',
  wall: '<path d="M2 3h20v19H2Zm0 6h20M2 15h20M8 3v6m8 0v6M8 15v7"/>',
  door: '<path d="M4 22V2h16v20M8 22V6h8v16M13 14h1"/>',
  shelter: '<path d="m2 11 10-9 10 9M5 9v13h14V9m-9 13v-7h4v7"/>',
  fiber: '<path d="M5 22c0-10 4-10 4-20m3 20c-3-8 3-13 2-20m5 20c-4-10 2-12 1-20"/>',
  cord: '<path d="M5 3c0 5 14 3 14 9s-14 3-14 9M9 3c0 5 14 3 14 9S9 15 9 21M4 7l5-2m2 6 4-3m1 8 5-3M5 20l5-3"/>',
  flakedStone: '<path d="m3 19 9-17 9 17-9 3Z"/><path d="m12 2-1 11 10 6M3 19l8-6 1 9"/>',
  handle: '<path d="m5 20 9-17 5 3-9 17Zm9-17 5 3M7 16l5 3"/>',
  peg: '<path d="m5 3 3-1 2 18-2 2-2-2Zm9 0 3-1 2 18-2 2-2-2Z"/>',
  blade: '<path d="m3 20 9-17 9 3-13 16Zm9-17 3 7M7 14l6 3"/>',
  board: '<path d="m3 6 14-3 4 15-14 3ZM5 10l13-3M7 17l12-3"/>',
  hammer: '<path d="M2 3h13l6 5-3 4-5-3H2ZM9 9v13h5V9"/>',
  floor: '<path d="m2 7 10-5 10 5v10l-10 5-10-5Zm0 0 10 5 10-5M12 12v10M7 5l10 5M7 10v10m10-10v10"/>',
  window: '<path d="M3 2h18v20H3Zm3 3h12v14H6Zm6 0v14M6 12h12M2 22h20"/>',
  roof: '<path d="m2 12 10-9 10 9-4 9H6Zm3-3h14M8 6h8M5 15h14M7 18h10"/>',
  blueprint: '<path d="M3 2h15l3 3v17H3Zm4 5h10M7 11h10M7 15h4m3 0h3M7 19h10"/>',
  keys: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M6 9h1m4 0h1m4 0h1M6 12h1m4 0h1m4 0h1M7 16h10"/>',
};
function icon(name: string, cls = '', tier=0): string {
  if(name==='sword')return swordIcon('icon '+cls);
  const asset = name === 'gate' ? gatePreview() : name === 'fence' ? fencePreview() ?? itemIconUrl(name) : itemIconUrl(name,tier);
  if (asset) return `<img class="icon asset-icon ${cls}" src="${asset}" alt="" aria-hidden="true" draggable="false" />`;
  return `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] ?? paths.leaf}</svg>`;
}
const tools: { id: Tool; label: string; icon: string; detail: string }[] = [
  { id: 'hand', label: 'Explorar', icon: 'hand', detail: 'Coletar, conversar e colher' },
  { id: 'plant', label: 'Plantar', icon: 'seeds', detail: 'Plantar uma semente em terra preparada' },
  { id: 'water', label: 'Regar', icon: 'water', detail: 'Regar uma plantação' },
  { id: 'gate', label: 'Porteira', icon: 'gate', detail: 'R gira 4 posições · F inverte abertura · mãos + E abre/fecha' },
  { id: 'repair', label: 'Reparar cerca', icon: 'hammer', detail: 'Restaurar cerca desgastada · 1 módulo de cerca · E ou clique' },
  { id: 'fence', label: 'Cerca', icon: 'fence', detail: 'Construir uma cerca' },
  { id: 'bench', label: 'Banco', icon: 'bench', detail: 'Construir um banco' },
  { id: 'remove', label: 'Remover', icon: 'remove', detail: 'Remover e recuperar parte dos materiais'  },
  { id: 'hatchet', label: 'Machadinha', icon: 'hatchet', detail: 'Cortar árvores com uma machadinha da mochila' },
  { id: 'hoe', label: 'Enxada', icon: 'hoe', detail: 'E prepara · Shift + E desfaz canteiros vazios' },
  { id: 'pickaxe', label: 'Picareta', icon: 'pickaxe', detail: 'Minerar rochas com uma picareta da mochila' },
  { id: 'workbench', label: 'Bancada', icon: 'workbench', detail: 'Colocar uma bancada de trabalho' },
  ...FARM_KINDS.map(kind=>({id:`farm-${kind}` as Tool,label:FARM_BUILDINGS[kind].name,icon:`farm-${kind}`,detail:'Colocar base no terreno livre e entregar materiais na obra'})),
];
const items = ITEM_IDS.map(id => ({ id, label: ITEMS[id].name, description: ITEMS[id].description }));

export class GameUI {
  private gameplayLocked=false;
  setGameplayLocked(locked:boolean):void {this.gameplayLocked=locked;const hud=this.base.querySelector<HTMLElement>('.hud');if(hud)hud.inert=locked;}
  private root = document.querySelector<HTMLDivElement>('#ui')!;
  private base = document.createElement('div');
  private overlay = document.createElement('div');
  private notifications = document.createElement('div');
  private companionQuickPanel?: CompanionQuickPanel;
  private mode: 'title' | 'creation' | 'opening' | 'hud' | 'expedition' = 'title';
  private modal: 'pause' | 'inventory' | 'dialogue' | 'crafting' | 'building' | 'map' | 'home' | 'sleep' | 'slots' | 'controls' | 'audio' | 'graphics' | 'fishingJournal' | 'mineJournal' | 'pets' | null = null;
  private focusBeforeModal?: HTMLElement;
  private onModalClose?: () => void;
  private existingSave = false;
  private cleanupLibrary?: () => void;
  private cleanupCreation?: () => void;
  private cleanupTitle?: () => void;
  private cleanupOpening?: () => void;
  private latest?: HudData;
  private lastHudKey = '';
  private craftingBusy = false;
  private craftingInventory?: InventoryData;
  private craftingNearWorkbench = false;
  private homeEditor?: HomeEditor;
  private journalCollapsed = false;
  private topToolbar?: TopToolbar;
  private quickbar = emptyQuickbar();
  private locationName = '';
  private locationTimer?: ReturnType<typeof setTimeout>;

  setQuickbar(slots: QuickSlot[]): void { this.quickbar = [...slots]; this.activeSlot = -1; }
  getQuickbar(): QuickSlot[] { return [...this.quickbar]; }
  private cameraZoomFactor = 1;
  private cameraZoomEnabled = false;
  private cameraZoomTimer?: ReturnType<typeof setTimeout>;
  private activeSlot = -1;
  private draggedItem: Exclude<QuickSlot, null> | null = null;
  private selectedInventoryItem: Exclude<QuickSlot, null> | null = null;
  private slotCondition(slot:QuickSlot){const copy=this.latest&&referencedTool(this.latest.inventory,slot),kind=quickItem(slot);return copy?.condition??(this.latest&&individualTool(kind)?activeToolCopy(this.latest.inventory,kind)?.condition:undefined)??this.latest?.toolConditions?.[kind as 'hatchet'];}
  private durabilityMarkup(slot:QuickSlot):string{const c=this.slotCondition(slot),item=quickItem(slot);return c&&wearsOut(item)?`<span class="tool-durability" role="meter" aria-label="Durabilidade" aria-valuemin="0" aria-valuemax="${ECONOMY_BALANCE.durability[c.tier]}" aria-valuenow="${c.durability}"><span style="width:${c.durability/ECONOMY_BALANCE.durability[c.tier]*100}%"></span></span>`:'';}

  private slotInfo(slot: QuickSlot): { label: string; icon: string; detail: string } {
    const item = quickItem(slot);
    if (item === 'wateringCan' || slot === 'water') return { label: (this.latest?.wateringCanWater ?? 0) > 0 ? 'Regador com água' : 'Regador vazio', icon: (this.latest?.wateringCanWater ?? 0) > 0 ? 'water-full' : 'water-empty', detail: `${this.latest?.wateringCanWater ?? 0}/8 regas · Equipe e pressione E no poço ou junto ao rio/lago para encher.` };
    if (item) return { label: ITEMS[item].name+(toolReferenceParts(slot)?` · #${toolReferenceParts(slot)!.id}`:''), icon: item, detail: ITEMS[item].description };
    return tools.find(tool => tool.id === slot) ?? { label: 'Vazio', icon: 'bag', detail: 'Arraste um item da mochila para este slot.' };
  }
  activateSlot(index: number): void {
    if(this.mode!=='hud'||this.latest?.swimming)return;
    if (this.modal || !Number.isInteger(index) || index < 0 || index >= this.quickbar.length) return;
    const slot = this.quickbar[index];
    const quantity = this.latest ? quickQuantity(slot, this.latest.inventory, !!this.latest.wateringCan) : null;
    if (quantity === 0) { this.toast('Este item acabou. Recolha mais para usar este atalho.'); return; }
    this.activeSlot = index;
    if(quickItem(slot)==='sword'){this.callbacks.onTool('hand');if(this.latest?.worldWeapon!=='sword')this.callbacks.onUseItem('sword');else this.toast('Espada já equipada · E ou clique contra hostis no acampamento.');this.updateQuickbar();return;}
    const copy=toolReferenceParts(slot);
    this.callbacks.onTool(quickAction(slot),copy?.id);
    if(copy&&quickAction(slot)==='hand'&&USABLE_VILLAGE_ITEMS.includes(copy.kind))this.callbacks.onUseItem(copy.kind,copy.id);
    else if (quickItem(slot) && quickAction(slot) === 'hand') this.toast(`${this.slotInfo(slot).label}: material disponível na mochila para fabricar e construir.`);
    this.updateQuickbar();
  }
  private slotMarkup(slot: QuickSlot, index: number, inventory = false): string {
    const info = this.slotInfo(slot);
    const quantity = this.latest ? quickQuantity(slot, this.latest.inventory, !!this.latest.wateringCan) : null;
    return `<button type="button" class="${inventory ? 'bag-slot quick-target' : 'tool'}" data-slot="${index}" ${slot ? `data-tool="${quickAction(slot)}"` : ''} aria-label="Slot ${index + 1}: ${slot ? info.label : 'vazio — mãos vazias'}" title="${slot ? info.label : 'Mãos vazias'} · ${inventory ? 'solte um item aqui; Delete remove' : 'I abre a mochila; botão direito configura'}"><span class="tool-key">${index + 1}</span>${slot ? icon(info.icon,'',this.slotCondition(slot)?.tier??0) : '<span class="empty-slot">+</span>'}<strong class="slot-quantity">${toolReferenceParts(slot)?'':quantity ?? ''}</strong>${this.durabilityMarkup(slot)}</button>`;
  }
  private renderQuickbar(): void {
    const belt = this.base.querySelector('.toolbelt');
    if (!belt) return;
    belt.innerHTML = this.quickbar.map((slot, index) => this.slotMarkup(slot, index)).join('');
    belt.querySelectorAll<HTMLButtonElement>('[data-slot]').forEach(button => {
      button.onclick = () => this.activateSlot(Number(button.dataset.slot));
      button.oncontextmenu = event => { event.preventDefault(); event.stopPropagation(); this.editSlot(Number(button.dataset.slot)); };
    });
    this.updateQuickbar();
  }
  private updateQuickbar(): void {
    if (!this.latest) return;
    this.base.querySelectorAll<HTMLButtonElement>('[data-slot]').forEach(button => {
      const index = Number(button.dataset.slot), slot = this.quickbar[index];
      const quantity = quickQuantity(slot, this.latest!.inventory, !!this.latest!.wateringCan);
      button.querySelector('.slot-quantity')!.textContent = toolReferenceParts(slot)||quantity === null ? '' : String(quantity);
      button.querySelector('.tool-durability')?.remove();button.insertAdjacentHTML('beforeend',this.durabilityMarkup(slot));
      if(slot){const info=this.slotInfo(slot),img=button.querySelector<HTMLImageElement>('img.asset-icon'),src=itemIconUrl(info.icon,this.slotCondition(slot)?.tier??0);if(img&&src&&img.getAttribute('src')!==src)img.src=src;}
      const selected = quickAction(slot) === this.latest!.tool && (slot === null || quickItem(slot) ? this.activeSlot === index : true);
      button.classList.toggle('selected', selected);
      button.classList.toggle('depleted', quantity === 0);
      button.setAttribute('aria-pressed', String(selected));
      button.disabled=!!this.latest?.swimming;
      button.title=this.latest?.swimming?'Ferramentas indisponíveis durante o nado':`${slot?this.slotInfo(slot).label:'Mãos vazias'} · I abre a mochila`;
    });
  }
  private assignInventorySlot(index: number, item: Exclude<QuickSlot, null> | null): void {
    if (item && (!this.latest || (quickQuantity(item, this.latest.inventory, !!this.latest.wateringCan) ?? 0) <= 0)) return;
    const previous = this.quickbar[index];
    this.quickbar = assignQuickSlot(this.quickbar, index, item);
    if (previous !== item && this.activeSlot === index) { this.activeSlot = -1; this.callbacks.onTool('hand'); }
    this.renderQuickbar(); this.lastHudKey = ''; this.callbacks.onSave();
    if (this.modal === 'inventory') this.renderInventoryBar();
  }
  private renderInventoryBar(): void {
    const belt = this.overlay.querySelector('.inventory-quickbar');
    if (!belt) return;
    belt.innerHTML = this.quickbar.map((slot, index) => this.slotMarkup(slot, index, true)).join('');
    belt.querySelectorAll<HTMLButtonElement>('[data-slot]').forEach(button => {
      const index = Number(button.dataset.slot);
      button.ondragover = event => { if (this.draggedItem) { event.preventDefault(); button.classList.add('drop-ready'); if (event.dataTransfer) event.dataTransfer.dropEffect = 'link'; } };
      button.ondragleave = () => button.classList.remove('drop-ready');
      button.ondrop = event => {
        event.preventDefault(); button.classList.remove('drop-ready');
        const value = event.dataTransfer?.getData('application/x-after-rain-item');
        if (value && value === this.draggedItem && isQuickSlot(value)) this.assignInventorySlot(index, value);
        this.draggedItem = null;
      };
      button.onclick = () => { if (this.selectedInventoryItem) this.assignInventorySlot(index, this.selectedInventoryItem); };
      button.oncontextmenu = event => { event.preventDefault(); this.assignInventorySlot(index, null); };
      button.onkeydown = event => { if (event.key === 'Delete' || event.key === 'Backspace') { event.preventDefault(); this.assignInventorySlot(index, null); } };
    });
  }
  private editSlot(index: number): void {
    if (this.modal || this.mode !== 'hud') return;
    this.openModal('slots');
    const panel = document.createElement('section');
    panel.className = 'panel inventory-card';
    panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'true'); panel.setAttribute('aria-label', `Configurar slot ${index + 1}`);
    panel.innerHTML = `<div class="modal-heading"><h2>Slot ${index + 1}</h2><button class="icon-button" aria-label="Fechar">${icon('close')}</button></div><p>Escolha uma ação para a barra. Ferramentas e materiais precisam estar na mochila para usar.</p><div class="slot-options">${tools.map(t => `<button class="button button-light" data-assign="${t.id}">${icon(t.icon)}${t.label}</button>`).join('')}<button class="button button-light" data-assign="">Esvaziar slot</button></div>`;
    panel.querySelector('.icon-button')!.addEventListener('click', () => this.closeModal());
    panel.querySelectorAll<HTMLButtonElement>('[data-assign]').forEach(button => button.onclick = () => {
      const previous = this.quickbar[index];
      this.quickbar[index] = (button.dataset.assign || null) as Tool | null;
      if (quickAction(previous) === this.latest?.tool && previous !== this.quickbar[index]) this.callbacks.onTool('hand');
      this.renderQuickbar(); this.lastHudKey = ''; this.callbacks.onSave(); this.closeModal();
    });
    this.overlay.append(panel); panel.querySelector<HTMLButtonElement>('button')!.focus();
  }

  private setupJournalDrag(): void {
    this.journalCleanup?.();
    const panel = this.base.querySelector<HTMLElement>('.journal')!;
    const handle = panel.querySelector<HTMLElement>('.journal-heading')!;
    const tab = this.base.querySelector<HTMLElement>('.journal-reopen')!;
    const cleanPanel = makeDraggablePanel(panel, handle, this.root, 'after-rain-missions-position');
    const cleanTab = makeDraggablePanel(tab, tab, this.root, 'after-rain-missions-tab-position');
    this.journalCleanup = () => { cleanPanel(); cleanTab(); };
  }
  private journalCleanup?: () => void;


  constructor(private callbacks: UICallbacks) {
    try { this.journalCollapsed = localStorage.getItem('after-rain-missions-collapsed') === 'true'; } catch { /* A interface também funciona sem armazenamento. */ }
    this.base.className = 'ui-base';
    window.addEventListener('keydown',event=>{
      if(fishingActive())return;
      if(!this.gameplayLocked&&this.mode==='hud'&&event.key==='Escape'&&!event.repeat&&!event.defaultPrevented){
        if([...document.querySelectorAll<HTMLElement>('[role=dialog]')].some(panel=>panel.getClientRects().length>0&&!this.overlay.contains(panel)))return;
        event.preventDefault();event.stopImmediatePropagation();if(!this.dismissTopToolbar())this.togglePause();return;
      }
      if(this.gameplayLocked||this.mode!=='hud'||!this.latest||event.defaultPrevented||event.ctrlKey||event.metaKey||event.altKey||event.repeat||event.target instanceof Element&&event.target.closest('input,textarea,select,[contenteditable]:not([contenteditable="false"])'))return;
      const shortcuts={KeyI:'inventory',KeyM:'map',KeyC:'crafting',KeyB:'building',KeyJ:'fishingJournal',KeyL:'mineJournal',KeyK:'pets'} as const;
      const action=shortcuts[event.code as keyof typeof shortcuts];if(!action)return;
      if([...document.querySelectorAll<HTMLElement>('[role=dialog]')].some(panel=>panel.getClientRects().length>0&&!this.overlay.contains(panel)))return;
      event.preventDefault();event.stopImmediatePropagation();
      if(this.modal&&this.modal!==action)return;
      if(action==='inventory')this.toggleInventory(this.latest.inventory);
      else if(action==='map')this.toggleMap();
      else if(action==='crafting')this.toggleCrafting(this.latest.inventory,this.latest.nearWorkbench);
      else if(action==='building')this.toggleBuilding(this.latest.inventory,this.latest.nearWorkbench);
      else if(action==='fishingJournal')this.toggleFishingJournal();
      else if(action==='mineJournal')this.toggleMineJournal();
      else if(this.modal==='pets')this.closeModal();else this.callbacks.onCompanions?.();
    },true);
    this.overlay.className = 'modal-root';
    this.notifications.className = 'toast-stack';
    this.notifications.setAttribute('aria-live', 'polite');
    this.root.replaceChildren(this.base, this.overlay, this.notifications);
    // Mantém a navegação pelo teclado no menu que está pausando a partida.
    this.overlay.addEventListener('keydown', event => {
      if (event.key !== 'Tab' || !this.modal) return;
      const controls = Array.from(this.overlay.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), summary, [tabindex="0"]'))
        .filter(control => control.getClientRects().length > 0);
      if (!controls.length) return;
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
  }

  showTitle(hasSave: boolean): void {
    this.cleanupLibrary?.(); this.cleanupLibrary = undefined;
    this.cleanupOpening?.(); this.cleanupOpening = undefined;
    this.hideCameraZoom();
    const stored=inspectSave();
    if(stored.status==='invalid'||stored.status==='recovered'||stored.status==='future'||stored.status==='unavailable')this.toast(stored.status==='recovered'?'A partida principal não pôde ser lida. Continuar permite recuperar uma cópia de segurança.':'Não foi possível ler a partida salva. Os dados existentes foram preservados.');
    this.root.dataset.area='title';
    this.base.style.display = '';
    this.journalCleanup?.();
    this.topToolbar?.destroy();
    this.topToolbar = undefined;
    this.homeEditor?.destroy();
    this.homeEditor = undefined;
    this.cleanupTitle?.();
    this.cleanupTitle = undefined;
    this.cleanupCreation?.();
    this.cleanupCreation = undefined;
    if (this.modal === 'crafting') this.callbacks.onCancelCraft();
    this.craftingBusy = false;
    this.mode = 'title';
    this.modal = null;
    this.existingSave = hasSave;
    this.overlay.replaceChildren();
    this.overlay.classList.remove('active');
    this.callbacks.onPause(true);
    this.cleanupTitle = createTitleScreen(this.base, {
      hasSave,
      icon,
      onNewGame: () => this.showCreation(),
      onContinue: () => this.callbacks.onContinue(),
      onLoadGame: () => this.showSaveLibrary(),
      onMapEditor: DEVELOPMENT_TOOLS ? () => this.callbacks.onMapEditor() : undefined,
      onBackgroundMode: mode => this.callbacks.onTitleBackground(mode),
    });
  }

  private showSaveLibrary(): void {
    this.cleanupLibrary?.();
    this.modal='slots';
    this.overlay.classList.add('active');
    this.cleanupLibrary=createSaveLibraryPanel(this.overlay,{
      close:()=>this.showTitle(hasSave()),
      newGame:()=>{this.cleanupLibrary?.();this.cleanupLibrary=undefined;this.modal=null;this.showCreation();},
      load:()=>{this.showTitle(hasSave());this.callbacks.onContinue();},
    });
  }

  private showCreation(): void {
    this.cleanupOpening?.(); this.cleanupOpening = undefined;
    this.topToolbar?.destroy();
    this.topToolbar = undefined;
    this.cleanupTitle?.();
    this.cleanupTitle = undefined;
    this.cleanupCreation?.();
    this.mode = 'creation';
    this.overlay.classList.remove('active');
    this.callbacks.onPause(true);
    this.base.innerHTML = '<div class="creation-backdrop"></div>';
    this.cleanupCreation = createCharacterEditor(this.overlay, {
      hasSave: false,
      icon,
      onBack: () => this.showTitle(this.existingSave),
      onStart: profile => this.callbacks.onNewGame(profile),
    });
  }

  showWorldLoading(label:string):void {
    this.cleanupOpening?.();this.cleanupOpening=undefined;
    this.cleanupTitle?.();this.cleanupTitle=undefined;
    this.cleanupCreation?.();this.cleanupCreation=undefined;
    this.topToolbar?.destroy();this.topToolbar=undefined;
    this.mode='opening';this.modal=null;
    this.root.dataset.area='loading';this.root.style.display='';
    this.overlay.replaceChildren();this.overlay.classList.remove('active');
    this.base.style.display='';
    this.base.innerHTML='<section class="world-loading" role="status" aria-live="polite"><div><h2></h2><progress max="1" value="0" aria-label="Carregamento dos recursos"></progress><p>Preparando os recursos do cenário…</p></div></section>';
    this.base.querySelector('h2')!.textContent=label;
    this.callbacks.onTitleBackground('off');this.callbacks.onPause(true);
  }
  setWorldLoadingProgress(value:number):void {
    const progress=this.base.querySelector<HTMLProgressElement>('.world-loading progress');
    if(progress)progress.value=Math.max(0,Math.min(1,value));
  }

  showNewGameOpening(resources: Promise<unknown>, prepare: () => void, complete: () => void): void {
    this.cleanupOpening?.();
    this.cleanupTitle?.(); this.cleanupTitle = undefined;
    this.cleanupCreation?.(); this.cleanupCreation = undefined;
    this.hideCameraZoom();
    this.topToolbar?.destroy(); this.topToolbar = undefined;
    this.mode = 'opening'; this.modal = null;
    this.root.dataset.area = 'opening';
    this.overlay.replaceChildren(); this.overlay.classList.remove('active');
    this.base.style.display = '';
    const host = document.createElement('div'); host.className = 'new-game-opening';
    this.base.replaceChildren(host);
    this.callbacks.onTitleBackground('off');
    this.callbacks.onPause(true);
    gameAudio.setRainAtmosphere(false); gameAudio.setScene('cinematic');
    const player = new CinematicPlayer(host, {
      src: NEW_GAME_OPENING.src, poster: NEW_GAME_OPENING.poster,
      label: 'A fuga da cidade e a chegada à propriedade',
      loading: 'Preparando sua história…', description: 'Um novo começo',
      onStarted: prepare,
      attachAudio: video => gameAudio.attachCinematic(video, NEW_GAME_OPENING.music, NEW_GAME_OPENING.effects),
    }, resources, complete, () => this.callbacks.onMainMenu());
    this.cleanupOpening = () => player.destroy();
  }

  showHUD(area: 'property'|'forest'|'village'|'cityForest'|'fishingLake'|'survivorCamp'|'highland'='property'): void {
    this.cleanupOpening?.(); this.cleanupOpening = undefined;
    this.hideCameraZoom();
    this.root.dataset.area=area;
    this.root.style.display='';
    this.base.style.display = '';
    this.journalCleanup?.();
    this.topToolbar?.destroy();
    this.topToolbar = undefined;
    this.homeEditor?.destroy();
    this.homeEditor = undefined;
    this.cleanupTitle?.();
    this.cleanupTitle = undefined;
    this.cleanupCreation?.();
    this.cleanupCreation = undefined;
    this.mode = 'hud';
    this.modal = null;
    this.onModalClose = undefined;
    this.overlay.replaceChildren();
    this.overlay.classList.remove('active');
    this.lastHudKey = '';
    this.base.innerHTML = `<div class="hud">
      <header class="hud-header hud-status" aria-label="Dia, hora e recursos"><div class="day-clock"><span class="weather-icon">${icon('sun')}</span><strong id="hud-day">Dia 1</strong><span class="status-time"><b id="hud-time">08:00</b><small id="hud-day-phase">Manhã</small></span></div><div class="resources">${items.filter(item => ['wood', 'stone', 'seeds', 'plank'].includes(item.id)).map(item => `<div class="resource" title="${item.label}">${icon(item.id)}<strong id="count-${item.id}">0</strong></div>`).join('')}<div class="resource" title="Coroas (C) para comprar nas lojas da vila">${icon('crown')}<strong id="hud-coins">0</strong></div><div class="resource" title="Vigor — refeições e preparados medicinais recuperam o vigor"><strong id="hud-vigor">100</strong><small>vigor</small></div><div class="mine-health" id="hud-health" hidden><span><span id="hud-health-label">Vida</span> <b id="hud-health-value">100</b></span><meter id="hud-health-meter" min="0" max="100" value="100" aria-label="Vida na mina"></meter></div></div></header>
      <div class="camera-zoom" role="group" aria-label="Zoom da câmera" hidden>
        <button type="button" data-zoom="-1" aria-label="Diminuir zoom" title="Afastar a câmera · − ou roda do mouse">−</button>
        <button type="button" data-zoom="0" aria-label="Restaurar zoom padrão" title="Restaurar para 100% · Home"><span class="camera-zoom-value" aria-live="polite">100%</span></button>
        <button type="button" data-zoom="1" aria-label="Aumentar zoom" title="Aproximar a câmera · + ou roda do mouse">+</button>
      </div>
      <button class="journal-reopen" ${this.journalCollapsed ? '' : 'hidden'} aria-controls="journal-panel" aria-expanded="false" aria-label="Abrir missões" title="Abrir missões">${icon('leaf')}<span>Missões</span></button><aside id="journal-panel" class="journal" ${this.journalCollapsed ? 'hidden' : ''}><header class="journal-heading"><div><span class="eyebrow">AOS POUCOS, UM LAR</span><h3>Missões</h3></div><button class="journal-close" aria-controls="journal-panel" aria-label="Fechar missões" title="Fechar missões">${icon('close')}</button></header><div id="journal-content" class="journal-content"><section id="mine-journal-summary" hidden><p class="mine-mission-summary"></p><button class="button button-light mine-journal-button">Diário da mina · L</button></section><div id="farming-quest" aria-label="Missão primeira colheita"></div><div class="journal-rule"></div><div class="slice-progress" id="slice-progress"></div><p class="journal-tip">Recolha galhos e pedras. A sucata para a lâmina do serrote espera na parte oeste da propriedade.</p><small>Seu tempo. Seu caminho.</small></div></aside>
      <div class="location-pill">${icon('pin')}<span id="hud-location">Minha propriedade</span></div>
      <div class="bottom-center"><div class="interaction-prompt"><kbd id="hud-interaction-key">E</kbd><span id="hud-prompt">Explore o vale ao seu redor</span></div><div id="hud-resource-progress" class="resource-progress" hidden></div><div class="toolbelt"></div><div class="tool-status"><strong id="active-tool">Explorar</strong><span id="tool-cost">Coletar · conversar · colher</span></div></div>
    </div>`;
    this.renderQuickbar(); this.setupJournalDrag();
    this.base.querySelectorAll<HTMLButtonElement>('[data-zoom]').forEach(button => {
      button.addEventListener('click', () => this.callbacks.onZoom(Number(button.dataset.zoom) as -1 | 0 | 1));
    });
    this.updateCameraZoom(this.cameraZoomFactor, this.cameraZoomEnabled);
    this.setGameplayLocked(this.gameplayLocked);
    this.locationName = '';
    this.topToolbar = new TopToolbar(this.base.querySelector<HTMLElement>('.hud')!, {
      onOpenChange: open => this.callbacks.onPause(open || this.modal !== null),
      onAction: action => this.handleToolbarAction(action),
    });
    const setJournalClosed = (closed: boolean): void => {
      this.journalCollapsed = closed;
      this.base.querySelector<HTMLElement>('.journal')!.hidden = closed;
      const reopen = this.base.querySelector<HTMLButtonElement>('.journal-reopen')!;
      reopen.hidden = !closed;
      if (closed) reopen.focus();
      else this.base.querySelector<HTMLButtonElement>('.journal-close')!.focus();
      try { localStorage.setItem('after-rain-missions-collapsed', String(closed)); } catch { /* A preferência vale para esta sessão. */ }
    };
    this.base.querySelector('.mine-journal-button')!.addEventListener('click',()=>this.toggleMineJournal());
    this.base.querySelector('.journal-close')!.addEventListener('click', () => setJournalClosed(true));
    this.base.querySelector('.journal-reopen')!.addEventListener('click', () => setJournalClosed(false));
    this.base.querySelectorAll<HTMLButtonElement>('[data-collapse]').forEach(button => button.addEventListener('click', () => {
      const panel = this.base.querySelector(`.${button.dataset.collapse}`)!;
      const collapsed = panel.classList.toggle('is-collapsed');
      button.setAttribute('aria-expanded', String(!collapsed));
      const label = `${collapsed ? 'Mostrar' : 'Recolher'} controles`;
      button.setAttribute('aria-label', label);
      button.title = label;
    }));
    this.callbacks.onPause(false);
  }

  private hideCameraZoom(): void {
    clearTimeout(this.cameraZoomTimer); this.cameraZoomTimer = undefined;
    const control=this.base.querySelector<HTMLElement>('.camera-zoom');
    if(control)control.hidden=true;
  }

  updateCameraZoom(factor: number, enabled: boolean, reveal = false): void {
    this.cameraZoomFactor = factor;
    this.cameraZoomEnabled = enabled;
    const value = this.base.querySelector('.camera-zoom-value');
    if (value) value.textContent = `${Math.round(factor * 100)}%`;
    this.base.querySelectorAll<HTMLButtonElement>('[data-zoom]').forEach(button => {
      const direction = Number(button.dataset.zoom);
      button.disabled = !enabled || direction < 0 && factor <= CAMERA_ZOOM_MIN || direction > 0 && factor >= CAMERA_ZOOM_MAX;
    });
    if(!enabled){this.hideCameraZoom();return;}
    if(reveal){
      const control=this.base.querySelector<HTMLElement>('.camera-zoom');
      if(control){control.hidden=false;clearTimeout(this.cameraZoomTimer);this.cameraZoomTimer=setTimeout(()=>this.hideCameraZoom(),3000);}
    }
  }

  toggleTopToolbar(): void {
    if (this.mode !== 'hud' || this.modal) return;
    this.topToolbar?.toggle();
  }

  /** Expeditions own their combat UI; exploration shortcuts cannot open hidden menus. */
  suspendExploration():void {
    if(this.mode==='hud')this.closeModal();
    this.mode='expedition';this.latest=undefined;this.modal=null;
    this.topToolbar?.setOpen(false,false);this.topToolbar?.setEnabled(false);this.companionQuickPanel?.hide();
    this.hideCameraZoom();this.overlay.replaceChildren();this.overlay.classList.remove('active');
    this.root.dataset.area='dungeon';this.root.style.display='none';
  }

  dismissTopToolbar(): boolean { return this.topToolbar?.dismiss() ?? false; }

  showPetShelter(view: () => SaveData, act: (action: ShelterAction) => {ok:boolean;message:string}): void {
    this.openModal('pets');
    const render = (message = '', focus = '[data-shelter-close]') => {
      const scroll = this.overlay.querySelector('.pet-shelter-menu')?.scrollTop ?? 0;
      this.overlay.innerHTML = petShelterHTML(view());
      this.overlay.querySelector<HTMLElement>('[data-shelter-feedback]')!.textContent = message;
      const apply = (action: ShelterAction, target: string) => {
        const result = act(action);
        render(result.message, target);
      };
      this.overlay.querySelector<HTMLButtonElement>('[data-shelter-close]')!.onclick = () => this.closeModal();
      this.overlay.querySelector<HTMLButtonElement>('[data-shelter-upgrade]')?.addEventListener('click', () => apply({kind:'upgrade'}, '[data-shelter-upgrade]'));
      this.overlay.querySelectorAll<HTMLButtonElement>('[data-shelter-deliver]').forEach(button => {
        button.onclick = () => {
          const item = button.dataset.shelterDeliver as ItemId;
          const input = this.overlay.querySelector<HTMLInputElement>(`#shelter-quantity-${item}`)!;
          if (!input.reportValidity()) return;
          apply({kind:'deliver', item, amount:input.valueAsNumber}, `[data-shelter-deliver="${item}"]`);
        };
      });
      this.overlay.querySelector<HTMLButtonElement>('[data-shelter-pets]')?.addEventListener('click', () => {this.closeModal();this.callbacks.onCompanions?.();});
      const target = this.overlay.querySelector<HTMLButtonElement>(focus);
      (target && !target.disabled ? target : this.overlay.querySelector<HTMLButtonElement>('[data-shelter-close]'))?.focus({preventScroll:true});
      this.overlay.querySelector<HTMLElement>('.pet-shelter-menu')!.scrollTop = scroll;
    };
    render();
  }

  createCompanionQuickPanel(command: (command: PetCommand) => boolean): CompanionQuickPanel | undefined {
    if (this.mode !== 'hud') return;
    return this.companionQuickPanel = new CompanionQuickPanel(this.base.querySelector<HTMLElement>('.hud')!, {
      allowed: () => !this.isModalOpen(),
      toggleMenu: () => {
        if (this.modal === 'pets') this.closeModal();
        else if (this.mode === 'hud' && !this.isModalOpen()) this.callbacks.onCompanions?.();
      },
      command,
    });
  }

  showCompanions(
    view: () => PetMenuView,
    command: (command: PetCommand) => boolean,
  ): void {
    this.openModal("pets");
    let collection = false;
    const render = () => {
      const focused =
        document.activeElement instanceof HTMLElement
          ? document.activeElement.dataset.petCommand
          : undefined;
      this.overlay.innerHTML = collection
        ? petCollectionHTML(view())
        : petMenuHTML(view());
      this.overlay.querySelector<HTMLButtonElement>('[data-pet-floating]')?.addEventListener('click', () => {
        this.companionQuickPanel?.show();
        this.closeModal();
      });
      this.overlay.querySelector<HTMLButtonElement>("[data-pet-collection]")
        ?.addEventListener("click", () => {
          collection = true;
          render();
          this.overlay.querySelector<HTMLElement>("h2")?.focus();
        });
      this.overlay.querySelector<HTMLButtonElement>("[data-pet-collection-back]")
        ?.addEventListener("click", () => {
          collection = false;
          render();
          this.overlay.querySelector<HTMLButtonElement>("[data-pet-collection]")?.focus();
        });
      this.overlay.querySelector<HTMLButtonElement>(
        "[data-pet-close]",
      )!.onclick = () => this.closeModal();
      this.overlay
        .querySelectorAll<HTMLButtonElement>("[data-pet-select]")
        .forEach((button) => {
          button.onclick = () => {
            command({
              kind: "select",
              id: button.dataset.petSelect || undefined,
            });
            render();
          };
        });
      this.overlay
        .querySelectorAll<HTMLButtonElement>("[data-pet-command]")
        .forEach((button) => {
          button.onclick = () => {
            command({
              kind: button.dataset.petCommand as "follow" | "stay" | "recall" | "shelter",
            });
            render();
          };
        });
      if (focused)
        this.overlay
          .querySelector<HTMLButtonElement>(`[data-pet-command="${focused}"]`)
          ?.focus();
    };
    render();
    this.overlay.querySelector<HTMLButtonElement>("[data-pet-close]")?.focus();
  }
  toggleMineJournal():void{
    if(this.modal==='mineJournal'){this.closeModal();return;}
    if(this.mode!=='hud'||this.isModalOpen()||[...document.querySelectorAll<HTMLElement>('[role=dialog]')].some(panel=>panel.getClientRects().length>0&&!this.overlay.contains(panel)))return;
    const save=this.callbacks.getFishingState?.();if(!save)return;
    this.openModal('mineJournal');const runtime=this.callbacks.getMineMissionRuntime?.();this.onModalClose=mountMineMissionJournal(this.overlay,()=>this.callbacks.getFishingState?.()??save,()=>this.closeModal(),runtime);
  }
  toggleFishingJournal():void {
    if(this.modal==='fishingJournal'){this.closeModal();return;}
    if(this.mode!=='hud'||this.isModalOpen()||[...document.querySelectorAll<HTMLElement>('[role=dialog]')].some(panel=>panel.getClientRects().length>0&&!this.overlay.contains(panel)))return;
    const save=this.callbacks.getFishingState?.();if(!save)return;
    this.openModal('fishingJournal');
    mountFishingJournal(this.overlay,save,()=>this.closeModal(),()=>this.callbacks.onSave());
  }
  private handleToolbarAction(action: ToolbarAction): void {
    if (this.gameplayLocked || this.mode !== 'hud' || this.modal) return;
    if (action === 'save') {
      this.toast(this.callbacks.onSave() ? 'Sua história foi salva neste navegador.' : 'Não foi possível salvar. Confira o armazenamento do navegador.');
      return;
    }
    this.topToolbar?.setOpen(false, false);
    if (action === 'controls') {
      this.openModal('controls');
      this.overlay.innerHTML = `<section class="panel controls-panel" role="dialog" aria-modal="true" aria-label="Controles"><div class="modal-heading"><div><span class="eyebrow">CADA TECLA, UM NOVO CAMINHO</span><h2>Controles</h2></div><button class="icon-button" aria-label="Fechar controles">${icon('close')}</button></div>${controlGuide({mapEditor:this.latest?.mapEditorAvailable!==false,homeCustomization:this.latest?.area!=='village',interiorEditor:DEVELOPMENT_TOOLS&&this.latest?.interiorEditor})}</section>`;
      this.overlay.querySelector('button')!.onclick = () => this.closeModal();
      this.overlay.querySelector('button')!.focus();
    }
    else if (action === 'fishingJournal') this.toggleFishingJournal();
    else if (action === 'mineJournal') this.toggleMineJournal();
    else if (action === 'pets') this.callbacks.onCompanions?.();
    else if (action === 'audio') this.toggleAudio();
    else if (action === 'graphics') this.toggleGraphics();
    else if (action === 'options') this.togglePause();
    else if (action === 'map') this.toggleMap();
    else if (action === 'inventory' && this.latest) this.toggleInventory(this.latest.inventory);
    else if (action === 'crafting' && this.latest) this.toggleCrafting(this.latest.inventory, this.latest.nearWorkbench);
    else if (action === 'building' && this.latest) this.toggleBuilding(this.latest.inventory, this.latest.nearWorkbench);
  }

  updateHUD(data: HudData): void {
    syncToolInstances(data.inventory,data.toolConditions);
    const waterChanged = this.latest?.wateringCanWater !== data.wateringCanWater;
    this.latest = data;
    if (waterChanged && this.mode === 'hud') this.renderQuickbar();
    if (this.mode !== 'hud') return;
    const key = JSON.stringify(data);
    if (key === this.lastHudKey) return;
    this.lastHudKey = key;
    this.topToolbar?.setActionVisible('building',(data.area??'property')==='property'&&!data.inHome);
    const set = (selector: string, value: string): void => {
      const element = this.base.querySelector(selector);
      if (element && element.textContent !== value) element.textContent = value;
    };
    set('#hud-day', `Dia ${data.day}`);
    const minutes = Math.floor(data.time) % 1440;
    set('#hud-time', `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`);
    for (const item of items) set(`#count-${item.id}`, String(data.inventory[item.id]));
    set('#hud-location', data.location);
    set('#hud-coins',String(data.coins??0)+' C');set('#hud-vigor',String(data.vigor??100));
    const health=this.base.querySelector<HTMLElement>('#hud-health')!;health.hidden=!data.health;
    if(data.health){const hp=data.health,meter=this.base.querySelector<HTMLMeterElement>('#hud-health-meter')!;meter.max=hp.max;meter.value=hp.current;set('#hud-health-value',Math.ceil(hp.current)+'/'+hp.max);set('#hud-health-label',hp.contaminated?'Vida · ar contaminado':'Vida');health.classList.toggle('exposed',!!hp.contaminated);health.classList.toggle('critical',hp.current<hp.max*.3);}

    if (this.locationName !== data.location) {
      this.locationName = data.location;
      const pill = this.base.querySelector<HTMLElement>('.location-pill')!;
      pill.hidden = false; clearTimeout(this.locationTimer);
      this.locationTimer = setTimeout(() => { pill.hidden = true; }, 10000);
    }
    this.base.querySelector('.hud')!.classList.toggle('in-home', data.inHome === true);
    set('#hud-interaction-key', data.interactionKey ?? 'E');
    this.base.querySelector<HTMLElement>('#hud-interaction-key')!.hidden=data.interactionKey===null;
    set('#hud-prompt', data.prompt || 'Aproxime-se de algo para interagir');
    const progressLabel = this.base.querySelector<HTMLElement>('#hud-resource-progress')!;
    progressLabel.hidden = !data.resourceProgress;
    progressLabel.textContent = data.resourceProgress;
    const phase = dayPhase(minutes);
    const night = minutes < SUNRISE_MINUTES || minutes >= SUNSET_MINUTES;
    const clock = this.base.querySelector<HTMLElement>('.day-clock')!;
    const weatherState=weatherForDay(data.day);
    clock.title = `${WEATHER_NAMES[weatherState]} · ${phase} · Nascer do sol 06:00 · Pôr do sol 19:00`;
    clock.setAttribute('aria-label', `${phase}, dia ${data.day}`);
    set('#hud-day-phase', phase);
    const weather = this.base.querySelector('.weather-icon')!;
    const weatherIcon=weatherState==='rain'?'rain':night?'moon':'sun';
    if (weather.getAttribute('data-weather') !== weatherIcon) {
      weather.innerHTML = icon(weatherIcon);
      weather.setAttribute('data-weather', weatherIcon);
      weather.setAttribute('aria-label',WEATHER_NAMES[weatherState]);
    }
    this.updateQuickbar();
    const selectedTool = tools.find(tool => tool.id === data.tool) ?? tools[0];
    const buildingKind = data.tool in BUILD_COSTS ? data.tool as BuildingData['kind'] : null;
    const cost = isFarmTool(data.tool)?FARM_BASE_COST:data.tool === 'blueprint' ? BLUEPRINT_COST : buildingKind ? BUILD_COSTS[buildingKind] : data.tool === 'plant' ? { seeds: 1 } : data.tool==='repair'?{fenceKit:1}:{};
    const entries = Object.entries(cost) as [ItemId, number][];
    const missingMaterials = entries.some(([item, amount]) => data.inventory[item] < amount);
    const requirements = data.tool === 'blueprint' ? BUILD_REQUIREMENTS.wall : buildingKind ? BUILD_REQUIREMENTS[buildingKind] : null;
    const missingTools = isFarmTool(data.tool)?(data.inventory.hammer<1?['hammer' as ItemId]:[]):requirements?.tools.filter(item => data.inventory[item] < 1) ?? [];
    const missingStation = !!requirements?.nearWorkbench && !data.nearWorkbench;
    const materialText = entries.map(([item, amount]) => `${amount} ${ITEM_NAMES[item].toLocaleLowerCase('pt-BR')}`).join(' + ');
    let detail = materialText || (data.tool === 'remove' ? 'Recupera parte dos materiais' : data.tool === 'water' ? 'Cuide da sua horta' : selectedTool.detail);
    if (missingTools.length) detail += ` · Precisa de ${missingTools.map(item => ITEM_NAMES[item].toLocaleLowerCase('pt-BR')).join(' e ')}`;
    if (missingStation) detail += ' · Aproxime-se da bancada';
    set('#active-tool', buildingKind ? BUILD_NAMES[buildingKind] : selectedTool.label);
    set('#tool-cost', detail);
    const activeItem = this.quickbar[this.activeSlot] ?? null;
    if (quickItem(activeItem) && quickAction(activeItem) === data.tool) {
      set('#active-tool', this.slotInfo(activeItem).label);
      set('#tool-cost',quickItem(activeItem)==='sword'?`${data.worldWeapon==='sword'?'Espada equipada':'Espada guardada'} · E ou clique contra hostis no acampamento`:`${quickQuantity(activeItem, data.inventory, !!data.wateringCan)} na mochila · ${quickAction(activeItem) === 'hand' ? 'Material para fabricação e construção' : detail}`);
    }
    const costLabel = this.base.querySelector<HTMLElement>('#tool-cost')!;
    costLabel.classList.toggle('insufficient', missingMaterials || missingTools.length > 0 || missingStation);
    costLabel.title = missingMaterials ? 'Faltam materiais na mochila' : detail;
    const progressSteps: [keyof HudData['progress'], string][] = [
      ['collected', 'Recolher galhos, fibras e pedras'],
      ['craftedTools', 'Fabricar machadinha, picareta e martelo'],
      ['harvested', 'Cortar uma árvore e minerar'],
      ['processed', 'Transformar tronco em tábuas'],
      ['builtWorkbench', 'Colocar a bancada de trabalho'],
      ['sawn', 'Serrar tábuas na bancada'],
      ['builtShelter', 'Concluir sua primeira construção da fazenda'],
    ];
    const nextTip = !data.progress.collected ? 'Recolha galhos, pedras pequenas e fibras vegetais para começar suas ferramentas.'
      : !data.progress.craftedTools ? 'Abra C: prepare cordas, cabos e pedras lascadas. Fabrique machadinha, picareta e martelo.'
      : !data.progress.harvested ? 'Equipe a machadinha para cortar árvores ou a picareta para minerar. Aproxime-se da base e pressione E.'
      : !data.progress.processed ? 'Abra C e prepare as primeiras tábuas com a machadinha.'
      : !data.progress.builtWorkbench ? 'Fabrique um martelo e selecione a bancada na barra ou em B para colocá-la em um espaço livre.'
      : !data.progress.sawn ? 'Recolha sucata na parte oeste da propriedade. Na bancada, prepare a lâmina e o serrote para serrar tábuas regulares com C.'
      : !data.progress.builtShelter ? 'Abra B e escolha um galinheiro, curral ou silo. Coloque a base no terreno limpo e leve os materiais até a entrada da obra.'
      : 'Sua fazenda está crescendo. Aloje os animais no galinheiro e no curral, armazene palha no silo e explore os arredores. M abre o mapa.';
    set('.journal-tip', nextTip);
    const missionSave=this.callbacks.getFishingState?.(),missionPanel=this.base.querySelector<HTMLElement>('#mine-journal-summary');if(missionPanel){missionPanel.hidden=!missionSave?.mineMissions&&!missionSave?.underground;if(missionSave)missionPanel.querySelector('.mine-mission-summary')!.textContent=mineMissionSummary(missionSave);}
    const progress = this.base.querySelector('#slice-progress')!;
    const progressKey = JSON.stringify(data.progress);
    if (progress.getAttribute('data-progress') !== progressKey) {
      progress.setAttribute('data-progress', progressKey);
      progress.innerHTML = progressSteps.map(([id, label]) => `<div class="quest${data.progress[id] ? ' complete' : ''}" data-step="${id}"><span class="quest-circle"></span>${label}</div>`).join('');
    }
    const farming = data.farmingProgress;
    const farmingSteps: [string, string, boolean][] = [
      ['hoe', 'Fabricar uma enxada · C', data.inventory.hoe > 0],
      ['prepared', 'Preparar um novo canteiro · enxada + E', !!farming?.prepared],
      ['planted', 'Plantar nabo · sementes + E', !!farming?.planted],
      ['watered', 'Regar a plantinha · regador + E', !!farming?.watered],
      ['harvested', 'Colher o primeiro nabo · mãos vazias + E', !!farming?.harvested || data.harvests > 0],
    ];
    const farmingQuest = this.base.querySelector('#farming-quest');
    const farmingKey = farmingSteps.map(step => step[2]).join(',');
    if (farmingQuest && farmingQuest.getAttribute('data-progress') !== farmingKey) {
      farmingQuest.setAttribute('data-progress', farmingKey);
      farmingQuest.innerHTML = '<p class="eyebrow">PRIMEIRA COLHEITA</p>' + farmingSteps.map(([id,label,done]) =>
        `<div class="quest${done ? ' complete' : ''}" data-farming-step="${id}"><span class="quest-circle"></span>${label}</div>`).join('');
    }
  }

  toast(message: string): void {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = icon('leaf');
    const text = document.createElement('span');
    text.textContent = message;
    toast.append(text);
    while (this.notifications.children.length >= 2) this.notifications.firstElementChild?.remove();
    this.notifications.append(toast);
    setTimeout(() => { toast.classList.add('leaving'); setTimeout(() => toast.remove(), 250); }, 3800);
  }

  showDialogue(name: string, lines: string[], onClose?: () => void): void {
    if (!lines.length || this.mode !== 'hud') return;
    this.openModal('dialogue');
    this.onModalClose = onClose;
    const panel = document.createElement('section');
    panel.className = 'dialogue-card panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', `Conversa com ${name}`);
    panel.innerHTML = `<div class="dialogue-portrait" aria-hidden="true">${icon('leaf')}</div><div class="dialogue-copy"><div class="eyebrow">GENTE DO VALE</div><h2></h2><p></p><div class="dialogue-footer"><small></small><button class="text-button"></button></div></div>`;
    panel.querySelector('h2')!.textContent = name;
    let index = 0;
    const next = panel.querySelector<HTMLButtonElement>('button')!;
    const update = (): void => {
      panel.querySelector('p')!.textContent = lines[index];
      panel.querySelector('small')!.textContent = `${index + 1} de ${lines.length}`;
      next.innerHTML = `${index === lines.length - 1 ? 'Até logo' : 'Continuar'} ${icon('arrow')}`;
    };
    next.addEventListener('click', () => { if (index < lines.length - 1) { index++; update(); } else this.closeModal(); });
    update();
    this.overlay.append(panel);
    next.focus();
  }

  toggleInventory(inventory: InventoryData): void {
    if(this.gameplayLocked||fishingActive())return;
    if (this.mode !== 'hud') return;
    if (this.modal === 'inventory') { this.closeModal(); return; }
    if (this.modal) return;
    this.openModal('inventory');
    const panel = document.createElement('section');
    panel.className = 'inventory-card backpack-panel panel';
    panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-label', 'Inventário');
    this.selectedInventoryItem = null;
    const entries = inventoryEntries(inventory, !!this.latest?.wateringCan);
    panel.innerHTML = `<div class="modal-heading"><div><span class="eyebrow">TUDO PARA UM NOVO COMEÇO</span><h2>Minha mochila</h2></div><button class="icon-button" aria-label="Fechar inventário">${icon('close')}</button></div>
      <div class="backpack-meta"><span>${icon('bag')} Mochila inicial</span><strong>${entries.length} / ${inventoryCapacity(inventory)} espaços</strong></div>
      <div class="backpack-grid" aria-label="Mochila com ${inventoryCapacity(inventory)} espaços">${Array.from({ length: Math.max(entries.length,inventoryCapacity(inventory)) }, (_, index) => {
        const slot = entries[index] ?? null, info = this.slotInfo(slot);
        const quantity = quickQuantity(slot, inventory, !!this.latest?.wateringCan);
        return `<button type="button" class="bag-slot${slot ? ' occupied' : ''}" ${slot ? `data-bag-item="${slot}" draggable="true"` : 'disabled'} aria-label="${slot ? `${info.label}, quantidade ${quantity}` : `Espaço ${index + 1} vazio`}" title="${slot ? info.label : 'Vazio'}">${slot ? `${icon(info.icon,'',this.slotCondition(slot)?.tier??0)}<strong class="slot-quantity">${toolReferenceParts(slot)?'':quantity}</strong>${this.durabilityMarkup(slot)}` : ''}</button>`;
      }).join('')}</div>
      <div class="backpack-detail" aria-live="polite"><span class="detail-icon">${icon('leaf')}</span><div><strong class="detail-name">Cada coisa no seu lugar</strong><p class="detail-text">Arraste um item para a barra abaixo. Ou clique no item e depois no slot.</p></div></div>
      <div class="backpack-bar-heading"><strong>Barra rápida</strong><span>Teclas 1–9</span></div><div class="inventory-quickbar" aria-label="Nove slots da barra rápida"></div>
      <p class="backpack-help">Materiais iguais ficam empilhados. Ferramentas ocupam espaços individuais. A barra é um atalho para a mochila: não duplica nem consome itens. Botão direito ou Delete no slot remove o atalho.</p>
      <div class="inventory-footer">${icon('leaf')} Um espaço para cada descoberta.<span>SIMULAÇÃO PAUSADA · I PARA VOLTAR</span></div>`;
    panel.querySelector('.icon-button')!.addEventListener('click', () => this.closeModal());
    panel.querySelectorAll<HTMLButtonElement>('[data-bag-item]').forEach(button => {
      const item = button.dataset.bagItem as Exclude<QuickSlot, null>;
      const select = (): void => {
        this.selectedInventoryItem = item;
        const info = this.slotInfo(item);
        panel.querySelector('.detail-icon')!.innerHTML = icon(info.icon,'',this.slotCondition(item)?.tier??0);
        panel.querySelector('.detail-name')!.textContent = info.label;
        const condition=this.slotCondition(item),copy=toolReferenceParts(item);
        panel.querySelector('.detail-text')!.textContent = info.detail+(condition&&wearsOut(quickItem(item))?`${durableTool(quickItem(item))?' · Material: '+['Pedra','Ferro','Ouro','Metal Negro'][condition.tier]:''} · Durabilidade: ${condition.durability}/${ECONOMY_BALANCE.durability[condition.tier]}`:'');
        panel.querySelector('[data-use-item]')?.remove();
        panel.querySelector('[data-drop-item]')?.remove();
        const id=quickItem(item) as ItemId|undefined;
        if(id&&this.callbacks.onDropItem){const actions=document.createElement('div');actions.dataset.dropItem=id;const amount=document.createElement('input');amount.type='number';amount.min='1';amount.max=String(copy?1:inventory[id]);amount.value='1';amount.setAttribute('aria-label','Quantidade para soltar');amount.style.width='65px';const drop=document.createElement('button');drop.className='button button-light';drop.textContent='Soltar no chão';drop.onclick=()=>{const n=Number(amount.value);if(!Number.isSafeInteger(n)||n<1||n>(copy?1:inventory[id])){this.toast('Escolha uma quantidade disponível na mochila.');return;}this.callbacks.onDropItem?.(id,n,copy?.id);this.closeModal();};actions.append(amount,drop);panel.querySelector('.backpack-detail')!.append(actions);}
        if(copy&&quickAction(item)!=='hand'){const equip=document.createElement('button');equip.dataset.useItem=copy.kind;equip.className='button button-light';equip.textContent='Equipar esta ferramenta';equip.onclick=()=>{this.callbacks.onTool(quickAction(item),copy.id);this.closeModal();};panel.querySelector('.backpack-detail')!.append(equip);}
        else if(id&&USABLE_VILLAGE_ITEMS.includes(id)){const use=document.createElement('button');use.dataset.useItem=id;use.className='button button-light';use.textContent=id==='sword'?(this.latest?.worldWeapon==='sword'?'Guardar espada':'Equipar espada'):'Usar / instalar';use.onclick=()=>{this.closeModal();this.callbacks.onUseItem(id,copy?.id);};panel.querySelector('.backpack-detail')!.append(use);}
        panel.querySelectorAll('[data-bag-item]').forEach(cell => cell.classList.toggle('chosen', cell === button));
      };
      button.onclick = select;
      button.ondragstart = event => {
        select(); this.draggedItem = item;
        event.dataTransfer!.setData('application/x-after-rain-item', item);
        event.dataTransfer!.effectAllowed = 'link';
        button.classList.add('dragging');
      };
      button.ondragend = () => { this.draggedItem = null; button.classList.remove('dragging'); panel.querySelectorAll('.drop-ready').forEach(cell => cell.classList.remove('drop-ready')); };
    });
    this.overlay.append(panel); this.renderInventoryBar();
    panel.querySelector<HTMLButtonElement>('.icon-button')!.focus();
  }

  toggleCrafting(inventory: InventoryData, nearWorkbench: boolean): void {
    if(this.gameplayLocked)return;
    if (this.mode !== 'hud') return;
    if (this.modal === 'crafting') { this.closeModal(); return; }
    if (this.modal) return;
    this.openModal('crafting');
    const panel = document.createElement('section');
    panel.className = 'crafting-card panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-label', 'Fabricação');
    panel.innerHTML = `<div class="modal-heading"><div><span class="eyebrow">DAS MÃOS NASCE UM LAR</span><h2>${nearWorkbench?'Bancada de trabalho':'Fabricação manual'}</h2></div><button class="icon-button" aria-label="Fechar fabricação">${icon('close')}</button></div><p class="crafting-intro">Prepare cordas, cabos e pedras lascadas. A machadinha faz tábuas brutas; o serrote prepara tábuas regulares na bancada.</p><div class="crafting-station"></div><div class="crafting-progress" hidden><div class="crafting-progress-heading"><strong></strong><span class="crafting-percent">0%</span></div><progress max="1" value="0" aria-label="Progresso da fabricação"></progress><button class="text-button cancel-crafting">Cancelar fabricação</button></div><div class="recipe-grid"></div><div class="inventory-footer">${icon('leaf')} Recolha sucata na parte oeste da propriedade para preparar a lâmina.<span>SIMULAÇÃO PAUSADA</span></div>`;
    panel.querySelector('button')!.addEventListener('click', () => this.closeModal());
    panel.querySelector('.cancel-crafting')!.addEventListener('click', () => {
      this.callbacks.onCancelCraft();
      this.setCraftingProgress('', 1);
    });
    this.overlay.append(panel);
    this.refreshCrafting(inventory, nearWorkbench);
    panel.querySelector<HTMLButtonElement>('button')!.focus();
  }

  refreshCrafting(inventory: InventoryData, nearWorkbench: boolean): void {
    this.craftingInventory = inventory;
    this.craftingNearWorkbench = nearWorkbench;
    if (this.modal !== 'crafting') return;
    const station = this.overlay.querySelector<HTMLElement>('.crafting-station')!;
    station.classList.toggle('available', nearWorkbench);
    station.innerHTML = `${icon('workbench')}<span>${nearWorkbench ? 'Bancada ao alcance: fabrique bancos, módulos de cerca e outras peças.' : 'Fabricação manual. Aproxime-se de uma bancada para serrar.'}</span>`;
    const grid = this.overlay.querySelector<HTMLElement>('.recipe-grid')!;
    const focusedRecipe = (document.activeElement as HTMLElement | null)?.dataset.recipe;
    grid.innerHTML = RECIPES.map(recipe => {
      const missing: string[] = [];
      const inputs = Object.entries(recipe.cost) as [ItemId, number][];
      const outputs = Object.entries(recipe.output) as [ItemId, number][];
      for (const [item, quantity] of inputs) {
        if (inventory[item] < quantity) missing.push(`${quantity - inventory[item]} ${ITEM_NAMES[item].toLocaleLowerCase('pt-BR')}`);
      }
      const outputTool = outputs.find(([item]) => UNIQUE_CRAFT_ITEMS.includes(item));
      const alreadyOwned = !!outputTool && inventory[outputTool[0]] > 0;
      const missingTool = recipe.requiresTool && inventory[recipe.requiresTool] < 1;
      const missingStation = recipe.requiresWorkbench && !nearWorkbench;
      const learned=!recipe.unlock||this.latest?.learnedRecipes?.includes(recipe.unlock);
      const ready = learned && !missing.length && !missingTool && !missingStation && !alreadyOwned && !this.craftingBusy;
      const requirements = [
        recipe.requiresTool ? ITEM_NAMES[recipe.requiresTool] : '',
        recipe.requiresWorkbench ? 'Bancada próxima' : 'À mão',
        recipe.durationSeconds ? `${recipe.durationSeconds} segundos` : '',
      ].filter(Boolean).join(' · ');
      const status = this.craftingBusy ? 'Aguarde a fabricação atual ou cancele.' : alreadyOwned ? recipe.output.sword?'Você já possui uma espada.':'Você já possui esta ferramenta.'
        : missingTool ? `Precisa de ${ITEM_NAMES[recipe.requiresTool!].toLocaleLowerCase('pt-BR')}.`
        : missingStation ? 'Aproxime-se de uma bancada.'
        : missing.length ? `Faltam: ${missing.join(', ')}.` : 'Materiais e requisitos disponíveis.';
      return `<article class="recipe-card${ready ? ' ready' : ''}"><div class="recipe-title">${icon(outputs[0]?.[0] ?? 'workbench')}<h3>${recipe.name}</h3></div><p>${recipe.description}</p><div class="recipe-materials">${inputs.map(([item, quantity]) => `<span class="${inventory[item] < quantity ? 'insufficient' : ''}">${icon(item)}${quantity} ${ITEM_NAMES[item]} <small>(${inventory[item]})</small></span>`).join('')}</div><div class="recipe-output">${icon('arrow')} ${outputs.map(([item, quantity]) => `${quantity} ${ITEM_NAMES[item]}`).join(' + ')}</div><small class="recipe-requirements">${requirements}</small><div class="recipe-status${ready ? '' : ' unavailable'}">${status}</div><button class="button ${ready ? 'button-primary' : 'button-light'}" data-recipe="${recipe.id}" ${ready ? '' : 'disabled'} aria-label="Fabricar: ${recipe.name}">Fabricar ${icon('check')}</button></article>`;
    }).join('');
    grid.querySelectorAll<HTMLButtonElement>('[data-recipe]').forEach(button => button.addEventListener('click', () => {
      if (!button.disabled) this.callbacks.onCraft(button.dataset.recipe!);
    }));
    if (focusedRecipe) grid.querySelector<HTMLButtonElement>(`[data-recipe="${focusedRecipe}"]:not(:disabled)`)?.focus();
  }

  setCraftingProgress(name: string, ratio: number): void {
    const wasBusy = this.craftingBusy;
    const progress = Number.isFinite(ratio) ? Math.max(0, Math.min(1, ratio)) : 0;
    this.craftingBusy = !!name && progress < 1 && this.modal === 'crafting';
    const panel = this.overlay.querySelector<HTMLElement>('.crafting-progress');
    if (panel) {
      panel.hidden = !this.craftingBusy;
      panel.querySelector('strong')!.textContent = name;
      panel.querySelector('.crafting-percent')!.textContent = `${Math.floor(progress * 100)}%`;
      const bar = panel.querySelector('progress')!;
      bar.value = progress;
      bar.setAttribute('aria-label', name ? `Fabricação: ${name}` : 'Progresso da fabricação');
    }
    if (wasBusy !== this.craftingBusy && this.craftingInventory) {
      this.refreshCrafting(this.craftingInventory, this.craftingNearWorkbench);
    }
  }

  toggleBuilding(inventory: InventoryData, nearWorkbench: boolean): void {
    if(this.gameplayLocked)return;
    if (this.mode !== 'hud') return;
    if(this.latest&&((this.latest.area??'property')!=='property'||this.latest.inHome)){this.toast(this.latest.inHome?'Use H para personalizar os móveis da casa.':'As construções são feitas na propriedade.');return;}
    if (this.modal === 'building') { this.closeModal(); return; }
    if (this.modal) return;
    this.openModal('building');
    const panel = document.createElement('section');
    panel.className = 'building-card panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-label', 'Construção');
    const materialList = (cost: Partial<Record<ItemId,number>>): string => (Object.entries(cost) as [ItemId, number][]).map(([item, quantity]) => `<span class="${inventory[item] < quantity ? 'insufficient' : ''}">${icon(item)}${quantity} ${ITEM_NAMES[item]} <small>(${inventory[item]})</small></span>`).join('');
    const requirementText = (kind: BuildingData['kind']): string => {
      const requirement = BUILD_REQUIREMENTS[kind];
      const descriptions = requirement.tools.map(item => `${ITEM_NAMES[item]}${inventory[item] < 1 ? ' — falta na mochila' : ''}`);
      if (requirement.nearWorkbench) descriptions.push(nearWorkbench ? 'Bancada ao alcance' : 'Aproxime-se de uma bancada');
      if(kind==='bench'||kind==='fence')descriptions.push('Peça pronta na mochila · fabricação na bancada');
      return descriptions.join(' · ') || 'Construção manual';
    };
    const kinds: BuildingData['kind'][] = ['workbench', 'fence', 'gate', 'bench'];
    panel.innerHTML = `<div class="modal-heading"><div><span class="eyebrow">CUIDE DA SUA PROPRIEDADE</span><h2>Construção</h2></div><button class="icon-button" aria-label="Fechar construção">${icon('close')}</button></div><p class="crafting-intro">Escolha uma base e posicione no terreno limpo, fora dos caminhos e da água. Depois leve os materiais à entrada da obra e conclua com o martelo. Sua casa principal continua sendo o seu lar.</p><div class="build-grid">${FARM_KINDS.map(kind=>`<article class="build-option"><div class="recipe-title"><img src="assets/visual/farm/${kind}.png" alt="" style="width:72px;height:72px;object-fit:contain"/><h3>${FARM_BUILDINGS[kind].name}</h3></div><p>${FARM_BUILDINGS[kind].description}</p><strong>Para colocar a base</strong><div class="recipe-materials">${materialList(FARM_BASE_COST)}</div><small class="recipe-requirements">Martelo na mochila · área livre de ${FARM_BUILDINGS[kind].width} × ${FARM_BUILDINGS[kind].height}</small><p>Entregue depois na obra:</p><div class="recipe-materials">${materialList(FARM_BUILDINGS[kind].cost)}</div><button class="button button-primary" data-build="farm-${kind}">Selecionar base ${icon('arrow')}</button></article>`).join('')}${kinds.map(kind => `<article class="build-option"><div class="recipe-title">${icon(kind)}<h3>${BUILD_NAMES[kind]}</h3></div><div class="recipe-materials">${materialList(BUILD_COSTS[kind])}</div><small class="recipe-requirements">${requirementText(kind)}</small>${kind === 'gate' ? '<p class="fence-aging-note">R gira entre quatro posições e troca o lado da dobradiça. F inverte para onde ela abre. A seta no terreno mostra a abertura. Mãos + E abre e fecha. Não fecha sobre o jogador ou um animal.</p>' : ''}${kind === 'fence' ? `<div class="fence-stages" aria-label="Estágios de desgaste da cerca">${FENCE_STAGES.map((stage,i)=>`<figure><img src="${fencePreview(stage)}" alt="Cerca ${FENCE_NAMES[i].toLowerCase()}"/><figcaption>${FENCE_NAMES[i]}<small>${i*FENCE_STAGE_DAYS} dias</small></figcaption></figure>`).join('')}</div><p class="fence-aging-note">Conecta em todas as direções. Desgasta a cada 30 dias do jogo, até ficar arruinada; permanece no terreno até ser recolhida.</p>` : ''}<button class="button button-light" data-build="${kind}" aria-label="Selecionar construção: ${BUILD_NAMES[kind]}">Selecionar ${icon('arrow')}</button></article>`).join('')}<article class="build-option"><div class="recipe-title">${icon('hammer')}<h3>Reparar cerca</h3></div><p>Substitua um trecho desgastado usando 1 módulo de cerca fabricado na bancada. Uma cerca nova não gasta material.</p><button class="button button-light" data-build="repair">Selecionar reparo ${icon('arrow')}</button></article><article class="build-option"><div class="recipe-title">${icon('remove')}<h3>Remover</h3></div><p>Recolha uma peça colocada por você. Bancos e cercas voltam como peças prontas para reposicionar; outras construções devolvem parte dos materiais.</p><button class="button button-light" data-build="remove" aria-label="Selecionar remoção de construção">Selecionar ${icon('arrow')}</button></article></div><div class="inventory-footer">${icon('leaf')} Leve os materiais até a entrada de cada obra para finalizar.<span>SIMULAÇÃO PAUSADA</span></div>`;
    panel.querySelector('.modal-heading button')!.addEventListener('click', () => this.closeModal());
    panel.querySelectorAll<HTMLButtonElement>('[data-build]').forEach(button => button.addEventListener('click', () => {
      const mode = button.dataset.build!;
      this.closeModal();
      if (mode === 'blueprint') this.callbacks.onBlueprint();
      else this.callbacks.onTool(mode as Tool);
    }));
    this.overlay.append(panel);
    panel.querySelector<HTMLButtonElement>('.modal-heading button')!.focus();
  }

  toggleMap(): void {
    if(this.gameplayLocked)return;
    if (this.mode !== 'hud') return;
    if (this.modal === 'map') { this.closeModal(); return; }
    if (this.modal) return;
    this.openModal('map');
    const panel = document.createElement('section');
    panel.className = 'map-card panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-label', 'Mapa das regiões exploráveis');
    panel.innerHTML = `<div class="modal-heading"><div><span class="eyebrow">UM VALE PARA CONHECER</span><h2>${this.latest?.inHome ? this.latest.area==='village'?'Interior do comércio':"Interior da casa" : this.latest?.area==='highland' ? 'Platô da Nascente' : this.latest?.area==='survivorCamp' ? "Acampamento de Sobreviventes" : this.latest?.area==='fishingLake' ? "Lago entre as Serras" : this.latest?.area==='cityForest' ? "Floresta de Acesso à Cidade" : this.latest?.area==='forest' ? "Floresta Antiga" : this.latest?.area==='village' ? "Vila do Recomeço" : "Mapa completo do vale"}</h2></div><button class="icon-button" aria-label="Fechar mapa">${icon('close')}</button></div>
      <p class="map-current">Você está em <strong></strong>.</p>
      <div class="exploration-map real-map" role="img" aria-label="Cenário real e posição do personagem"><img class="map-snapshot" alt="Vista do cenário atual" /><span class="map-player" hidden><i></i><b>Você</b></span><span class="map-north">N ↑</span></div>
      <p class="map-caption">Vista atual do cenário. Seu marcador indica a posição exata.</p>
      <div class="inventory-footer">${icon('leaf')} Sempre há um caminho de volta.<span>SIMULAÇÃO PAUSADA · M OU ESC PARA VOLTAR</span></div>`;
    const map = panel.querySelector<HTMLElement>('.exploration-map')!;
    const mapWidth=this.latest?.inHome?(this.latest.interiorMapSize?.width??HOME_WIDTH):(this.latest?.worldMapSize?.width??WORLD_WIDTH);
    const mapHeight=this.latest?.inHome?(this.latest.interiorMapSize?.height??HOME_HEIGHT):(this.latest?.worldMapSize?.height??WORLD_HEIGHT);
    map.style.aspectRatio = `${mapWidth}/${mapHeight}`;
    void this.callbacks.onMap().then(url => { if (panel.isConnected) panel.querySelector<HTMLImageElement>('.map-snapshot')!.src = url; });
    panel.querySelector('.map-current strong')!.textContent = this.latest?.location || 'Propriedade';
    if(this.latest?.mapTitle)panel.querySelector('h2')!.textContent=this.latest.mapTitle;
    const position = this.latest?.playerTile;
    if (position) {
      const marker = panel.querySelector<HTMLElement>('.map-player')!;
      marker.hidden = false;
      marker.style.left = `${position.x / mapWidth * 100}%`;
      marker.style.top = `${position.y / mapHeight * 100}%`;
    }
    panel.querySelector('button')!.addEventListener('click', () => this.closeModal());
    this.overlay.append(panel);
    panel.querySelector<HTMLButtonElement>('button')!.focus();
  }

  toggleAudio(): void {
    if (this.mode !== 'hud' || this.modal) return;
    this.openModal('audio');
    const panel = document.createElement('section');
    panel.className = 'panel audio-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-label', 'Som do vale');
    panel.innerHTML = `<div class="modal-heading"><div class="audio-title">${toolbarIcon('audio')}<div><span class="eyebrow">A TRILHA DO SEU RECOMEÇO</span><h2>Som do vale</h2></div></div><button class="icon-button" aria-label="Fechar configurações de som">${icon('close')}</button></div><p class="audio-intro">Escolha como ouvir o vale.</p><div class="audio-controls"></div><div class="audio-actions"><button class="button button-light" data-sound-preview>Ouvir efeito</button><button class="text-button" data-sound-defaults>Restaurar volumes</button></div><p class="audio-note">Suas preferências são salvas automaticamente.</p>`;
    const audio = document.createElement('fieldset');
    audio.className = 'audio-settings';
    audio.innerHTML = `<legend>Som do vale</legend><label>Música <input aria-label="Volume da música" type="range" min="0" max="100" value="${Math.round(gameAudio.settings.music * 100)}"><output>${Math.round(gameAudio.settings.music * 100)}%</output></label><label>Efeitos <input aria-label="Volume dos efeitos" type="range" min="0" max="100" value="${Math.round(gameAudio.settings.effects * 100)}"><output>${Math.round(gameAudio.settings.effects * 100)}%</output></label><label class="audio-mute"><input type="checkbox" ${gameAudio.settings.muted ? 'checked' : ''}> Silenciar todos os sons</label>`;
    audio.querySelectorAll<HTMLInputElement>('input[type="range"]').forEach((slider, index) => {
      slider.addEventListener('input', () => {
        gameAudio.setSettings({ [index === 0 ? 'music' : 'effects']: Number(slider.value) / 100 });
        slider.nextElementSibling!.textContent = `${slider.value}%`;
      });
      slider.addEventListener('change', () => { if (index === 1) gameAudio.play('pickup'); });
    });
    audio.querySelector<HTMLInputElement>('input[type="checkbox"]')!.addEventListener('change', event => {
      gameAudio.setSettings({ muted: (event.target as HTMLInputElement).checked });
    });
    panel.querySelector('.audio-controls')!.append(audio);
    panel.querySelector('.icon-button')!.addEventListener('click', () => this.closeModal());
    panel.querySelector('[data-sound-preview]')!.addEventListener('click', () => gameAudio.play('pickup'));
    panel.querySelector('[data-sound-defaults]')!.addEventListener('click', () => {
      gameAudio.setSettings({ music: .45, effects: .65, muted: false });
      audio.querySelectorAll<HTMLInputElement>('input[type="range"]').forEach((slider, index) => {
        slider.value = String(Math.round((index === 0 ? gameAudio.settings.music : gameAudio.settings.effects) * 100));
        slider.nextElementSibling!.textContent = `${slider.value}%`;
      });
      audio.querySelector<HTMLInputElement>('input[type="checkbox"]')!.checked = false;
      gameAudio.play('pickup');
    });
    this.overlay.append(panel);
    panel.querySelector<HTMLButtonElement>('.icon-button')!.focus();
  }

  toggleGraphics(): void {
    if (this.mode !== 'hud' || this.modal) return;
    this.openModal('graphics');
    const panel = document.createElement('section');
    panel.className = 'panel graphics-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-label', 'Gráficos do vale');
    panel.innerHTML = `<div class="modal-heading"><div class="audio-title">${toolbarIcon('graphics')}<div><span class="eyebrow">LUZ PARA O SEU CAMINHO</span><h2>Gráficos do vale</h2></div></div><button class="icon-button" aria-label="Fechar configurações gráficas">${icon('close')}</button></div><p class="audio-intro">Ajuste a luz e as sombras do seu vale.</p><div class="graphics-controls"></div><p class="audio-note">Preferências salvas automaticamente para todos os cenários. Use a roda do mouse ou + e − para ajustar o zoom. Os botões aparecem por alguns segundos durante o ajuste.</p><button class="button button-light" data-graphics-defaults>Restaurar padrão</button>`;
    const visuals = getVisualSettings();
    const lighting = document.createElement('fieldset');
    lighting.className = 'daylight-settings';
    lighting.innerHTML = `<legend>Iluminação e shaders</legend><label><input type="checkbox" data-daylight ${visuals.daylight ? 'checked' : ''}> Iluminação das fases do dia</label><label>Intensidade <input aria-label="Intensidade da iluminação" type="range" min="0" max="100" value="${Math.round(visuals.intensity * 100)}"><output>${Math.round(visuals.intensity * 100)}%</output></label><label><input type="checkbox" data-dynamic-lighting ${visuals.dynamicLighting ? 'checked' : ''}> Sombras do sol e luzes das janelas</label><p>Transições suaves e iluminação dinâmica opcional. Preferências salvas automaticamente.</p>`;
    const enabled = lighting.querySelector<HTMLInputElement>('[data-daylight]')!;
    const strength = lighting.querySelector<HTMLInputElement>('input[type=range]')!;
    const dynamic = lighting.querySelector<HTMLInputElement>('[data-dynamic-lighting]')!;
    dynamic.disabled = !visuals.daylight;
    dynamic.addEventListener('change', () => setVisualSettings({ dynamicLighting: dynamic.checked }));
    strength.disabled = !visuals.daylight;
    enabled.addEventListener('change', () => { setVisualSettings({ daylight: enabled.checked }); strength.disabled = !enabled.checked; dynamic.disabled = !enabled.checked; });
    strength.addEventListener('input', () => { setVisualSettings({ intensity: Number(strength.value) / 100 }); strength.nextElementSibling!.textContent = `${strength.value}%`; });
    panel.querySelector('.graphics-controls')!.append(lighting);

    panel.querySelector('.icon-button')!.addEventListener('click', () => this.closeModal());
    panel.querySelector('[data-graphics-defaults]')!.addEventListener('click', () => {
      setVisualSettings({daylight:true,dynamicLighting:true,intensity:1});
      enabled.checked = true; dynamic.checked = true; dynamic.disabled = false;
      strength.value = '100'; strength.disabled = false; strength.nextElementSibling!.textContent = '100%';
    });
    this.overlay.append(panel);
    panel.querySelector<HTMLButtonElement>('.icon-button')!.focus();
  }

  togglePause(): void {
    if(fishingActive())return;
    if(this.gameplayLocked)return;
    if (this.mode !== 'hud') return;
    if (this.modal) { this.closeModal(); return; }
    this.openModal('pause');
    const panel = document.createElement('section');
    panel.className = 'pause-card panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Jogo pausado');
    panel.innerHTML = `<div class="pause-leaf">${icon('leaf')}</div><span class="eyebrow">O VALE PODE ESPERAR</span><h2>Uma pequena pausa.</h2><p>Respire. A sua história continua aqui.</p><div class="pause-actions"><button class="button button-primary" data-action="resume">Voltar ao vale ${icon('arrow')}</button><button class="button button-light" data-action="save">${icon('save')} Salvar meu progresso</button><button class="text-button pause-admin-link" data-action="admin">Administração · acesso com senha</button><button class="text-button" data-action="title">Voltar ao início</button></div><small>SIMULAÇÃO PAUSADA <i>·</i> ESC PARA VOLTAR</small>`;
    panel.querySelector('[data-action="resume"]')!.addEventListener('click', () => this.closeModal());
    panel.querySelector('[data-action="save"]')!.addEventListener('click', () => {
      this.toast(this.callbacks.onSave() ? 'Sua história foi salva neste navegador.' : 'Não foi possível salvar. Confira o armazenamento do navegador.');
    });
    panel.querySelector('[data-action="title"]')!.addEventListener('click', () => this.callbacks.onMainMenu());
    panel.querySelector('[data-action="admin"]')!.addEventListener('click', () => { this.closeModal(); this.callbacks.onAdminMenu(); });
    if(DEVELOPMENT_TOOLS&&this.latest?.mapEditorAvailable!==false){
    const editor = document.createElement('button');
    editor.className = 'button button-light';
    editor.dataset.action = 'map-editor';
    editor.textContent = this.latest?.interiorEditor?'Editar interior · H':'Editar mapa · F2';
    editor.addEventListener('click', () => this.callbacks.onMapEditor());
    panel.querySelector('.pause-actions')!.insertBefore(editor, panel.querySelector('[data-action="admin"]'));
    }
    this.overlay.append(panel);
  }

  showMapEditorMode(): void {
    this.cleanupOpening?.(); this.cleanupOpening = undefined;
    this.journalCleanup?.();
    this.journalCleanup = undefined;
    this.topToolbar?.destroy(); this.topToolbar = undefined;
    this.homeEditor?.destroy(); this.homeEditor = undefined;
    this.cleanupTitle?.(); this.cleanupTitle = undefined;
    this.cleanupCreation?.(); this.cleanupCreation = undefined;
    if (this.modal === 'crafting') this.callbacks.onCancelCraft();
    this.modal = null;
    this.overlay.replaceChildren(); this.overlay.classList.remove('active');
    this.base.style.display = 'none';
  }

  showHomeCustomization(home: HomeData, onAction: (action: HomeEditAction) => HomeEditResponse,options:HomeEditorOptions={}): void {
    if (this.mode !== 'hud' || this.modal) return;
    this.openModal('home');
    const panel = document.createElement('section');
    panel.className = 'home-customization-card panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-label', 'Personalizar minha casa');
    panel.innerHTML = `<div class="modal-heading"><div><span class="eyebrow">UM REFÚGIO COM A SUA CARA</span><h2>Minha casa</h2></div><button class="icon-button" aria-label="Fechar personalização da casa">${icon('close')}</button></div><div class="home-editor-holder"></div><div class="inventory-footer">${icon('shelter')} Móveis e acabamentos ficam salvos na sua partida.<span>SIMULAÇÃO PAUSADA · ESC PARA VOLTAR</span></div>`;
    if(options.title){panel.querySelector('h2')!.textContent=options.title;panel.setAttribute('aria-label',`Personalizar ${options.title}`);}
    if(options.eyebrow)panel.querySelector<HTMLElement>('.eyebrow')!.textContent=options.eyebrow;
    panel.querySelector('button')!.addEventListener('click', () => this.closeModal());
    this.overlay.append(panel);
    this.homeEditor = createHomeEditor(panel.querySelector<HTMLElement>('.home-editor-holder')!, home, onAction,options);
    panel.querySelector<HTMLButtonElement>('button')!.focus();
  }

  showSceneEditor(mount:(host:HTMLElement)=>()=>void):void {
    if(this.mode!=='hud'||this.modal)return;
    this.openModal('home');this.onModalClose=mount(this.overlay);
  }

  refreshHomeCustomization(home: HomeData, message?: string): void {
    if (this.modal === 'home') this.homeEditor?.refresh(home, message);
  }

  confirmCityTravel(onTravel: () => void): void {
    if (this.mode !== 'hud' || this.modal) return;
    this.openModal('dialogue');
    const panel = document.createElement('section');
    panel.className = 'sleep-card panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-label', 'Ir até a cidade?');
    panel.innerHTML = '<span class="eyebrow">A ESTRADA SEGUE ADIANTE</span><h2>Ir até a cidade?</h2><p>Prepare uma expedição e explore a cidade abandonada.</p><div class="pause-actions"><button class="button button-primary" data-city-confirm>Ir até a cidade</button><button class="button button-light" data-city-cancel>Agora não</button></div><small>ESC PARA VOLTAR</small>';
    panel.querySelector('[data-city-confirm]')!.addEventListener('click', () => { this.closeModal(); onTravel(); });
    panel.querySelector('[data-city-cancel]')!.addEventListener('click', () => this.closeModal());
    this.overlay.append(panel);
    panel.querySelector<HTMLButtonElement>('[data-city-cancel]')!.focus();
  }

  showSleep(onSleep: () => void): void {
    if (this.mode !== 'hud' || this.modal) return;
    this.openModal('sleep');
    const panel = document.createElement('section');
    panel.className = 'sleep-card panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-label', 'Dormir até a manhã');
    panel.innerHTML = `${icon('moon')}<span class="eyebrow">UM DESCANSO SEGURO</span><h2>Deixar a noite passar?</h2><p>Você acordará às <strong>08:00</strong>. Os cultivos regados continuarão crescendo enquanto você descansa.</p><div class="pause-actions"><button class="button button-primary" data-sleep-confirm>Dormir até as 08:00 ${icon('moon')}</button><button class="button button-light" data-sleep-cancel>Agora não</button></div><small>SIMULAÇÃO PAUSADA · ESC PARA VOLTAR</small>`;
    panel.querySelector('[data-sleep-confirm]')!.addEventListener('click', () => {
      this.closeModal();
      onSleep();
    });
    panel.querySelector('[data-sleep-cancel]')!.addEventListener('click', () => this.closeModal());
    this.overlay.append(panel);
    panel.querySelector<HTMLButtonElement>('[data-sleep-cancel]')!.focus();
  }

  isCraftingOpen(): boolean { return this.modal === 'crafting'; }

  isModalOpen(): boolean { return fishingActive() || this.gameplayLocked || this.mode !== 'hud' || this.modal !== null || this.topToolbar?.isOpen === true; }

  closeModal(): void {
    if (this.mode !== 'hud') return;
    this.topToolbar?.setOpen(false, false);
    this.topToolbar?.setEnabled(true);
    this.homeEditor?.destroy();
    this.homeEditor = undefined;
    if (this.modal === 'crafting') {
      this.callbacks.onCancelCraft();
      this.craftingBusy = false;
    }
    const callback = this.onModalClose;
    this.onModalClose = undefined;
    this.modal = null;
    this.draggedItem = null; this.selectedInventoryItem = null;
    this.overlay.replaceChildren();
    this.overlay.classList.remove('active');
    this.callbacks.onPause(false);
    if (this.focusBeforeModal?.closest('.toolbar-panel')) this.topToolbar?.focusHandle();
    else if (this.focusBeforeModal?.isConnected) this.focusBeforeModal.focus();
    this.focusBeforeModal = undefined;
    callback?.();
  }

  private openModal(type: 'pause' | 'inventory' | 'dialogue' | 'crafting' | 'building' | 'map' | 'home' | 'sleep' | 'slots' | 'controls' | 'audio' | 'graphics' | 'fishingJournal' | 'mineJournal' | 'pets'): void {
    this.topToolbar?.setOpen(false, false);
    this.topToolbar?.setEnabled(false);
    this.focusBeforeModal = document.activeElement instanceof HTMLElement ? document.activeElement : undefined;
    this.modal = type;
    this.overlay.replaceChildren();
    this.overlay.classList.add('active');
    this.callbacks.onPause(true);
  }
}
