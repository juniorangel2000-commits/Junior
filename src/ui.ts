import { CHARACTER_WIDTH, drawCharacter } from './art';
import { createCharacterEditor } from './character-creator';
import { createTitleScreen } from './title-screen';
import { TopToolbar } from './top-toolbar';
import type { ToolbarAction } from './top-toolbar';
import type { TitleBackgroundMode } from './title-screen';
import { itemIconUrl } from './visual-assets';
import { HOME_WIDTH, HOME_HEIGHT } from './systems/home';
import { emptyQuickbar, assignQuickSlot, quickItem, quickAction, quickQuantity, isQuickSlot, inventoryEntries, INVENTORY_CAPACITY } from './systems/quickbar';
import type { QuickSlot } from './types';
import './inventory-ui.css';
import { WORLD_HEIGHT, WORLD_WIDTH } from './data/regions';
import { BUILD_COSTS, BUILD_NAMES, BUILD_REQUIREMENTS } from './systems/building';
import { ITEMS, ITEM_IDS, ITEM_NAMES } from './data/items';
import { BLUEPRINT_COST, BLUEPRINT_LABEL } from './data/blueprints';
import { RECIPES } from './data/recipes';
import { createHomeEditor } from './home-ui';
import type { HomeEditor, HomeEditResponse } from './home-ui';
import type { HomeData, HomeEditAction } from './systems/home';
import type { BuildingData, CharacterProfile, HudData, InventoryData, ItemId, Tool } from './types';

interface UICallbacks {
  onNewGame(profile: CharacterProfile): void;
  onContinue(): void;
  onTool(tool: Tool): void;
  onCraft(recipeId: string): void;
  onCancelCraft(): void;
  onBlueprint(): void;
  onPause(paused: boolean): void;
  onSave(): boolean;
  onMap(): Promise<string>;
  onMainMenu(): void;
  onTitleBackground(mode: TitleBackgroundMode): void;
  onAdminMenu(): void;
}

const paths: Record<string, string> = {
  map: '<path d="m2 4 6-2 8 3 6-2v17l-6 2-8-3-6 2Zm6-2v17M16 5v17"/>',
  leaf: '<path d="M12 21V11m0 5C3 16 3 5 3 5s9-1 9 11Zm0-5C12 3 21 3 21 3s1 9-9 10Z"/>',
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
function icon(name: string, cls = ''): string {
  const asset = itemIconUrl(name);
  if (asset) return `<img class="icon asset-icon ${cls}" src="${asset}" alt="" aria-hidden="true" draggable="false" />`;
  return `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] ?? paths.leaf}</svg>`;
}
const tools: { id: Tool; label: string; icon: string; detail: string }[] = [
  { id: 'hand', label: 'Explorar', icon: 'hand', detail: 'Coletar, conversar e colher' },
  { id: 'plant', label: 'Plantar', icon: 'seeds', detail: 'Plantar uma semente na horta' },
  { id: 'water', label: 'Regar', icon: 'water', detail: 'Regar uma plantação' },
  { id: 'fence', label: 'Cerca', icon: 'fence', detail: 'Construir uma cerca' },
  { id: 'bench', label: 'Banco', icon: 'bench', detail: 'Construir um banco' },
  { id: 'remove', label: 'Remover', icon: 'remove', detail: 'Remover e recuperar parte dos materiais'  },
  { id: 'hatchet', label: 'Machadinha', icon: 'hatchet', detail: 'Cortar árvores com uma machadinha da mochila' },
  { id: 'pickaxe', label: 'Picareta', icon: 'pickaxe', detail: 'Minerar rochas com uma picareta da mochila' },
  { id: 'workbench', label: 'Bancada', icon: 'workbench', detail: 'Colocar uma bancada de trabalho' },
  { id: 'wall', label: 'Parede', icon: 'wall', detail: 'Construir uma parede com martelo perto da bancada' },
  { id: 'door', label: 'Porta', icon: 'door', detail: 'Construir uma porta com martelo perto da bancada' },
  { id: 'floor', label: 'Piso', icon: 'floor', detail: 'Assentar piso de madeira com martelo perto da bancada' },
  { id: 'window', label: 'Janela', icon: 'window', detail: 'Colocar um módulo de janela com martelo perto da bancada' },
  { id: 'roof', label: 'Cobertura', icon: 'roof', detail: 'Cobrir o abrigo com martelo perto da bancada' },
  { id: 'blueprint', label: 'Abrigo 3×3', icon: 'blueprint', detail: 'Posicionar o molde completo de um abrigo 3×3' },
];
const items = ITEM_IDS.map(id => ({ id, label: ITEMS[id].name, description: ITEMS[id].description }));

export class GameUI {
  private root = document.querySelector<HTMLDivElement>('#ui')!;
  private base = document.createElement('div');
  private overlay = document.createElement('div');
  private notifications = document.createElement('div');
  private mode: 'title' | 'creation' | 'hud' = 'title';
  private modal: 'pause' | 'inventory' | 'dialogue' | 'crafting' | 'building' | 'map' | 'home' | 'sleep' | 'slots' | 'controls' | null = null;
  private focusBeforeModal?: HTMLElement;
  private onModalClose?: () => void;
  private existingSave = false;
  private cleanupCreation?: () => void;
  private cleanupTitle?: () => void;
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
  private activeSlot = -1;
  private draggedItem: Exclude<QuickSlot, null> | null = null;
  private selectedInventoryItem: Exclude<QuickSlot, null> | null = null;

  private slotInfo(slot: QuickSlot): { label: string; icon: string; detail: string } {
    const item = quickItem(slot);
    if (item === 'wateringCan') return { label: 'Regador', icon: 'water', detail: 'Recolhido na casa. Use para regar suas plantações.' };
    if (item) return { label: ITEMS[item].name, icon: item, detail: ITEMS[item].description };
    return tools.find(tool => tool.id === slot) ?? { label: 'Vazio', icon: 'bag', detail: 'Arraste um item da mochila para este slot.' };
  }
  activateSlot(index: number): void {
    if (this.modal) return;
    const slot = this.quickbar[index];
    if (!slot) { if (this.latest) this.toggleInventory(this.latest.inventory); return; }
    const quantity = this.latest ? quickQuantity(slot, this.latest.inventory, !!this.latest.wateringCan) : null;
    if (quantity === 0) { this.toast('Este item acabou. Recolha mais para usar este atalho.'); return; }
    this.activeSlot = index;
    this.callbacks.onTool(quickAction(slot));
    if (quickItem(slot) && quickAction(slot) === 'hand') this.toast(`${this.slotInfo(slot).label}: material disponível na mochila para fabricar e construir.`);
    this.updateQuickbar();
  }
  private slotMarkup(slot: QuickSlot, index: number, inventory = false): string {
    const info = this.slotInfo(slot);
    const quantity = this.latest ? quickQuantity(slot, this.latest.inventory, !!this.latest.wateringCan) : null;
    return `<button type="button" class="${inventory ? 'bag-slot quick-target' : 'tool'}" data-slot="${index}" ${slot ? `data-tool="${quickAction(slot)}"` : ''} aria-label="Slot ${index + 1}: ${slot ? info.label : 'vazio'}" title="${slot ? info.label : 'Slot vazio'} · ${inventory ? 'solte um item aqui; Delete remove' : 'I abre a mochila; botão direito configura'}"><span class="tool-key">${index + 1}</span>${slot ? icon(info.icon) : '<span class="empty-slot">+</span>'}<strong class="slot-quantity">${quantity ?? ''}</strong></button>`;
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
      button.querySelector('.slot-quantity')!.textContent = quantity === null ? '' : String(quantity);
      const selected = slot !== null && quickAction(slot) === this.latest!.tool && (quickItem(slot) ? this.activeSlot === index : true);
      button.classList.toggle('selected', selected);
      button.classList.toggle('depleted', quantity === 0);
      button.setAttribute('aria-pressed', String(selected));
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
    const panel = this.base.querySelector<HTMLElement>('.journal')!;
    const handle = panel.querySelector<HTMLElement>('.journal-heading')!;
    const place = (x: number, y: number): void => {
      panel.style.left = `${Math.max(0, Math.min(window.innerWidth - panel.offsetWidth, x))}px`;
      panel.style.top = `${Math.max(0, Math.min(window.innerHeight - panel.offsetHeight, y))}px`;
    };
    try { const p = JSON.parse(localStorage.getItem('after-rain-missions-position') || 'null'); if (p && Number.isFinite(p.x) && Number.isFinite(p.y)) place(p.x, p.y); } catch { /* Default position. */ }
    let drag: { x: number; y: number } | null = null;
    handle.onpointerdown = event => {
      if ((event.target as HTMLElement).closest('button') || event.button !== 0) return;
      const bounds = panel.getBoundingClientRect(); drag = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
      handle.setPointerCapture(event.pointerId); event.preventDefault();
    };
    handle.onpointermove = event => { if (drag) place(event.clientX - drag.x, event.clientY - drag.y); };
    handle.onpointerup = handle.onpointercancel = () => {
      if (!drag) return; drag = null;
      try { localStorage.setItem('after-rain-missions-position', JSON.stringify({ x: panel.offsetLeft, y: panel.offsetTop })); } catch { /* Session preference. */ }
    };
    const observer = new ResizeObserver(() => { if (!panel.hidden && panel.style.left) place(parseFloat(panel.style.left), parseFloat(panel.style.top)); });
    observer.observe(this.root); observer.observe(panel);
    this.journalCleanup?.(); this.journalCleanup = () => observer.disconnect();
  }
  private journalCleanup?: () => void;


  constructor(private callbacks: UICallbacks) {
    try { this.journalCollapsed = localStorage.getItem('after-rain-missions-collapsed') === 'true'; } catch { /* A interface também funciona sem armazenamento. */ }
    this.base.className = 'ui-base';
    this.overlay.className = 'modal-root';
    this.notifications.className = 'toast-stack';
    this.notifications.setAttribute('aria-live', 'polite');
    this.root.replaceChildren(this.base, this.overlay, this.notifications);
    // Mantém a navegação pelo teclado no menu que está pausando a partida.
    this.overlay.addEventListener('keydown', event => {
      if (event.key !== 'Tab' || !this.modal) return;
      const controls = Array.from(this.overlay.querySelectorAll<HTMLElement>('button:not(:disabled), input, summary, [tabindex="0"]'))
        .filter(control => control.getClientRects().length > 0);
      if (!controls.length) return;
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
  }

  showTitle(hasSave: boolean): void {
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
      onBackgroundMode: mode => this.callbacks.onTitleBackground(mode),
    });
  }

  private showCreation(): void {
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
      hasSave: this.existingSave,
      icon,
      onBack: () => this.showTitle(this.existingSave),
      onStart: profile => this.callbacks.onNewGame(profile),
    });
  }

  showHUD(): void {
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
      <header class="hud-header hud-status" aria-label="Dia, hora e recursos"><div class="day-clock"><span class="weather-icon">${icon('sun')}</span><strong id="hud-day">Dia 1</strong><span class="status-time"><b id="hud-time">08:00</b></span></div><div class="resources">${items.filter(item => ['wood', 'stone', 'seeds', 'plank'].includes(item.id)).map(item => `<div class="resource" title="${item.label}">${icon(item.id)}<strong id="count-${item.id}">0</strong></div>`).join('')}</div></header>
      <button class="journal-reopen" ${this.journalCollapsed ? '' : 'hidden'} aria-controls="journal-panel" aria-expanded="false" aria-label="Abrir missões" title="Abrir missões">${icon('leaf')}<span>Missões</span></button><aside id="journal-panel" class="journal" ${this.journalCollapsed ? 'hidden' : ''}><header class="journal-heading"><div><span class="eyebrow">AOS POUCOS, UM LAR</span><h3>Missões</h3></div><button class="journal-close" aria-controls="journal-panel" aria-label="Fechar missões" title="Fechar missões">${icon('close')}</button></header><div id="journal-content" class="journal-content"><div class="slice-progress" id="slice-progress"></div><p class="journal-tip">Recolha galhos e pedras. A sucata para a lâmina do serrote espera nas ruínas a oeste.</p><div class="journal-rule"></div><div class="quest" id="harvest-quest"><span class="quest-circle"></span>Colha seu primeiro nabo</div><div class="quest" id="lia-quest"><span class="quest-circle"></span>Converse com Lia <kbd>E</kbd></div><small>Seu tempo. Seu caminho.</small></div></aside>
      <div class="location-pill">${icon('pin')}<span id="hud-location">Minha propriedade</span></div>
      <div class="bottom-center"><div class="interaction-prompt"><kbd id="hud-interaction-key">E</kbd><span id="hud-prompt">Explore o vale ao seu redor</span></div><div id="hud-resource-progress" class="resource-progress" hidden></div><div class="toolbelt"></div><div class="tool-status"><strong id="active-tool">Explorar</strong><span id="tool-cost">Coletar · conversar · colher</span></div></div>
    </div>`;
    this.renderQuickbar(); this.setupJournalDrag();
    this.locationName = '';
    this.topToolbar = new TopToolbar(this.base.querySelector<HTMLElement>('.hud')!, {
      icon,
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

  toggleTopToolbar(): void {
    if (this.mode !== 'hud' || this.modal) return;
    this.topToolbar?.toggle();
  }

  dismissTopToolbar(): boolean { return this.topToolbar?.dismiss() ?? false; }

  private handleToolbarAction(action: ToolbarAction): void {
    if (this.mode !== 'hud' || this.modal) return;
    if (action === 'save') {
      this.toast(this.callbacks.onSave() ? 'Sua história foi salva neste navegador.' : 'Não foi possível salvar. Confira o armazenamento do navegador.');
      return;
    }
    this.topToolbar?.setOpen(false, false);
    if (action === 'controls') {
      this.openModal('controls');
      this.overlay.innerHTML = `<section class="panel inventory-card" role="dialog" aria-label="Controles"><div class="modal-heading"><h2>Controles</h2><button class="icon-button" aria-label="Fechar controles">${icon('close')}</button></div><p>WASD / setas — mover<br>E — interagir / usar ferramenta<br>1–9 — slots; clique no vazio para preencher<br>Botão direito no slot — trocar ou esvaziar<br>I — inventário · C — fabricar · B — construir<br>M — mapa · H — personalizar casa<br>0 — parede · P — porta · R — girar cobertura<br>Esc — fechar / pausar</p></section>`;
      this.overlay.querySelector('button')!.onclick = () => this.closeModal();
      this.overlay.querySelector('button')!.focus();
    }
    else if (action === 'options') this.togglePause();
    else if (action === 'map') this.toggleMap();
    else if (action === 'inventory' && this.latest) this.toggleInventory(this.latest.inventory);
    else if (action === 'crafting' && this.latest) this.toggleCrafting(this.latest.inventory, this.latest.nearWorkbench);
    else if (action === 'building' && this.latest) this.toggleBuilding(this.latest.inventory, this.latest.nearWorkbench);
  }

  updateHUD(data: HudData): void {
    this.latest = data;
    if (this.mode !== 'hud') return;
    const key = JSON.stringify(data);
    if (key === this.lastHudKey) return;
    this.lastHudKey = key;
    const set = (selector: string, value: string): void => {
      const element = this.base.querySelector(selector);
      if (element && element.textContent !== value) element.textContent = value;
    };
    set('#hud-day', `Dia ${data.day}`);
    const minutes = Math.floor(data.time) % 1440;
    set('#hud-time', `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`);
    for (const item of items) set(`#count-${item.id}`, String(data.inventory[item.id]));
    set('#hud-location', data.location);
    if (this.locationName !== data.location) {
      this.locationName = data.location;
      const pill = this.base.querySelector<HTMLElement>('.location-pill')!;
      pill.hidden = false; clearTimeout(this.locationTimer);
      this.locationTimer = setTimeout(() => { pill.hidden = true; }, 10000);
    }
    this.base.querySelector('.hud')!.classList.toggle('in-home', data.inHome === true);
    set('#hud-interaction-key', data.interactionKey ?? 'E');
    set('#hud-prompt', data.prompt || 'Aproxime-se de algo para interagir');
    const progressLabel = this.base.querySelector<HTMLElement>('#hud-resource-progress')!;
    progressLabel.hidden = !data.resourceProgress;
    progressLabel.textContent = data.resourceProgress;
    const night = minutes < 360 || minutes >= 1140;
    const weather = this.base.querySelector('.weather-icon')!;
    if (weather.getAttribute('data-night') !== String(night)) {
      weather.innerHTML = icon(night ? 'moon' : 'sun');
      weather.setAttribute('data-night', String(night));
    }
    this.updateQuickbar();
    const selectedTool = tools.find(tool => tool.id === data.tool) ?? tools[0];
    const buildingKind = data.tool in BUILD_COSTS ? data.tool as BuildingData['kind'] : null;
    const cost = data.tool === 'blueprint' ? BLUEPRINT_COST : buildingKind ? BUILD_COSTS[buildingKind] : data.tool === 'plant' ? { seeds: 1 } : {};
    const entries = Object.entries(cost) as [ItemId, number][];
    const missingMaterials = entries.some(([item, amount]) => data.inventory[item] < amount);
    const requirements = data.tool === 'blueprint' ? BUILD_REQUIREMENTS.wall : buildingKind ? BUILD_REQUIREMENTS[buildingKind] : null;
    const missingTools = requirements?.tools.filter(item => data.inventory[item] < 1) ?? [];
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
      set('#tool-cost', `${quickQuantity(activeItem, data.inventory, !!data.wateringCan)} na mochila · ${quickAction(activeItem) === 'hand' ? 'Material para fabricação e construção' : detail}`);
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
      ['builtShelter', 'Fechar seu primeiro abrigo'],
    ];
    const nextTip = !data.progress.collected ? 'Recolha galhos, pedras pequenas e fibras vegetais para começar suas ferramentas.'
      : !data.progress.craftedTools ? 'Abra C: prepare cordas, cabos e pedras lascadas. Fabrique machadinha, picareta e martelo.'
      : !data.progress.harvested ? 'Equipe a machadinha para cortar árvores ou a picareta para minerar. Aproxime-se da base e pressione E.'
      : !data.progress.processed ? 'Abra C e prepare as primeiras tábuas com a machadinha.'
      : !data.progress.builtWorkbench ? 'Fabrique um martelo e selecione a bancada na barra ou em B para colocá-la em um espaço livre.'
      : !data.progress.sawn ? 'Recolha sucata nas ruínas a oeste. Na bancada, prepare a lâmina e o serrote para serrar tábuas regulares com C.'
      : !data.progress.builtShelter ? 'Abra B para piso, paredes, porta, janela e cobertura, ou selecione o molde 3×3. Selecione Explorar e pressione E para abrir e fechar a porta.'
      : 'Seu primeiro lar está de pé. Atravesse a ponte para o Bosque do Pinheiro ou siga ao sul para os Campos Abertos. M abre o mapa.';
    set('.journal-tip', nextTip);
    const progress = this.base.querySelector('#slice-progress')!;
    const progressKey = JSON.stringify(data.progress);
    if (progress.getAttribute('data-progress') !== progressKey) {
      progress.setAttribute('data-progress', progressKey);
      progress.innerHTML = progressSteps.map(([id, label]) => `<div class="quest${data.progress[id] ? ' complete' : ''}" data-step="${id}"><span class="quest-circle"></span>${label}</div>`).join('');
    }
    this.base.querySelector('#harvest-quest')?.classList.toggle('complete', data.harvests > 0);
    this.base.querySelector('#lia-quest')?.classList.toggle('complete', data.metLia);
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
    panel.innerHTML = `<div class="dialogue-portrait"><canvas width="24" height="32" aria-label="Lia"></canvas></div><div class="dialogue-copy"><div class="eyebrow">GENTE DO VALE</div><h2></h2><p></p><div class="dialogue-footer"><small></small><button class="text-button"></button></div></div>`;
    panel.querySelector('h2')!.textContent = name;
    const portrait = panel.querySelector('canvas')!;
    drawCharacter(portrait, { name, skin: '#b87952', hairStyle: 'preso', hairColor: '#3b3029', outfit: '#b46e4e' });
    portrait.style.width = `${CHARACTER_WIDTH * 2}px`;
    portrait.style.height = 'auto';
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
      <div class="backpack-meta"><span>${icon('bag')} Mochila inicial</span><strong>${entries.length} / ${INVENTORY_CAPACITY} espaços</strong></div>
      <div class="backpack-grid" aria-label="Mochila com 30 espaços">${Array.from({ length: INVENTORY_CAPACITY }, (_, index) => {
        const slot = entries[index] ?? null, info = this.slotInfo(slot);
        const quantity = quickQuantity(slot, inventory, !!this.latest?.wateringCan);
        return `<button type="button" class="bag-slot${slot ? ' occupied' : ''}" ${slot ? `data-bag-item="${slot}" draggable="true"` : 'disabled'} aria-label="${slot ? `${info.label}, quantidade ${quantity}` : `Espaço ${index + 1} vazio`}" title="${slot ? info.label : 'Vazio'}">${slot ? `${icon(info.icon)}<strong class="slot-quantity">${quantity}</strong>` : ''}</button>`;
      }).join('')}</div>
      <div class="backpack-detail" aria-live="polite"><span class="detail-icon">${icon('leaf')}</span><div><strong class="detail-name">Cada coisa no seu lugar</strong><p class="detail-text">Arraste um item para a barra abaixo. Ou clique no item e depois no slot.</p></div></div>
      <div class="backpack-bar-heading"><strong>Barra rápida</strong><span>Teclas 1–9</span></div><div class="inventory-quickbar" aria-label="Nove slots da barra rápida"></div>
      <p class="backpack-help">Itens iguais ficam empilhados. A barra é um atalho para a mochila: não duplica nem consome itens. Botão direito ou Delete no slot remove o atalho.</p>
      <div class="inventory-footer">${icon('leaf')} Um espaço para cada descoberta.<span>SIMULAÇÃO PAUSADA · I PARA VOLTAR</span></div>`;
    panel.querySelector('.icon-button')!.addEventListener('click', () => this.closeModal());
    panel.querySelectorAll<HTMLButtonElement>('[data-bag-item]').forEach(button => {
      const item = button.dataset.bagItem as Exclude<QuickSlot, null>;
      const select = (): void => {
        this.selectedInventoryItem = item;
        const info = this.slotInfo(item);
        panel.querySelector('.detail-icon')!.innerHTML = icon(info.icon);
        panel.querySelector('.detail-name')!.textContent = info.label;
        panel.querySelector('.detail-text')!.textContent = info.detail;
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
    if (this.mode !== 'hud') return;
    if (this.modal === 'crafting') { this.closeModal(); return; }
    if (this.modal) return;
    this.openModal('crafting');
    const panel = document.createElement('section');
    panel.className = 'crafting-card panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-label', 'Fabricação');
    panel.innerHTML = `<div class="modal-heading"><div><span class="eyebrow">DAS MÃOS NASCE UM LAR</span><h2>Fabricação</h2></div><button class="icon-button" aria-label="Fechar fabricação">${icon('close')}</button></div><p class="crafting-intro">Prepare cordas, cabos e pedras lascadas. A machadinha faz tábuas brutas; o serrote prepara tábuas regulares na bancada.</p><div class="crafting-station"></div><div class="crafting-progress" hidden><div class="crafting-progress-heading"><strong></strong><span class="crafting-percent">0%</span></div><progress max="1" value="0" aria-label="Progresso da fabricação"></progress><button class="text-button cancel-crafting">Cancelar fabricação</button></div><div class="recipe-grid"></div><div class="inventory-footer">${icon('leaf')} Recolha sucata nas ruínas a oeste para preparar a lâmina.<span>SIMULAÇÃO PAUSADA</span></div>`;
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
    station.innerHTML = `${icon('workbench')}<span>${nearWorkbench ? 'Bancada ao alcance: receitas de estação disponíveis.' : 'Fabricação manual. Aproxime-se de uma bancada para serrar.'}</span>`;
    const grid = this.overlay.querySelector<HTMLElement>('.recipe-grid')!;
    const focusedRecipe = (document.activeElement as HTMLElement | null)?.dataset.recipe;
    grid.innerHTML = RECIPES.map(recipe => {
      const missing: string[] = [];
      const inputs = Object.entries(recipe.cost) as [ItemId, number][];
      const outputs = Object.entries(recipe.output) as [ItemId, number][];
      for (const [item, quantity] of inputs) {
        if (inventory[item] < quantity) missing.push(`${quantity - inventory[item]} ${ITEM_NAMES[item].toLocaleLowerCase('pt-BR')}`);
      }
      const outputTool = outputs.find(([item]) => ['hatchet', 'pickaxe', 'handsaw', 'hammer'].includes(item));
      const alreadyOwned = !!outputTool && inventory[outputTool[0]] > 0;
      const missingTool = recipe.requiresTool && inventory[recipe.requiresTool] < 1;
      const missingStation = recipe.requiresWorkbench && !nearWorkbench;
      const ready = !missing.length && !missingTool && !missingStation && !alreadyOwned && !this.craftingBusy;
      const requirements = [
        recipe.requiresTool ? ITEM_NAMES[recipe.requiresTool] : '',
        recipe.requiresWorkbench ? 'Bancada próxima' : 'À mão',
        recipe.durationSeconds ? `${recipe.durationSeconds} segundos` : '',
      ].filter(Boolean).join(' · ');
      const status = this.craftingBusy ? 'Aguarde a fabricação atual ou cancele.' : alreadyOwned ? 'Você já possui esta ferramenta.'
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
    if (this.mode !== 'hud') return;
    if (this.modal === 'building') { this.closeModal(); return; }
    if (this.modal) return;
    this.openModal('building');
    const panel = document.createElement('section');
    panel.className = 'building-card panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-label', 'Construção');
    const materialList = (cost: Partial<InventoryData>): string => (Object.entries(cost) as [ItemId, number][]).map(([item, quantity]) => `<span class="${inventory[item] < quantity ? 'insufficient' : ''}">${icon(item)}${quantity} ${ITEM_NAMES[item]} <small>(${inventory[item]})</small></span>`).join('');
    const requirementText = (kind: BuildingData['kind']): string => {
      const requirement = BUILD_REQUIREMENTS[kind];
      const descriptions = requirement.tools.map(item => `${ITEM_NAMES[item]}${inventory[item] < 1 ? ' — falta na mochila' : ''}`);
      if (requirement.nearWorkbench) descriptions.push(nearWorkbench ? 'Bancada ao alcance' : 'Aproxime-se de uma bancada');
      return descriptions.join(' · ') || 'Construção manual';
    };
    const kinds: BuildingData['kind'][] = ['floor', 'wall', 'door', 'window', 'roof', 'workbench', 'fence', 'bench'];
    panel.innerHTML = `<div class="modal-heading"><div><span class="eyebrow">PEÇA POR PEÇA, UM LAR</span><h2>Construção</h2></div><button class="icon-button" aria-label="Fechar construção">${icon('close')}</button></div><p class="crafting-intro">Selecione uma peça e confira a prévia no terreno. Os materiais são consumidos somente ao colocar. Use as mãos para abrir ou fechar uma porta.</p><div class="build-blueprint"><div class="recipe-title">${icon('blueprint')}<h3>${BLUEPRINT_LABEL}</h3></div><p>Um molde para começar: piso, paredes, porta, janela e cobertura, com espaço interno para se abrigar.</p><div class="recipe-materials">${materialList(BLUEPRINT_COST)}</div><small class="recipe-requirements">${requirementText('wall')}</small><button class="button button-primary" data-build="blueprint" aria-label="Selecionar molde ${BLUEPRINT_LABEL}">Selecionar molde ${icon('arrow')}</button></div><div class="build-grid">${kinds.map(kind => `<article class="build-option"><div class="recipe-title">${icon(kind)}<h3>${BUILD_NAMES[kind]}</h3></div><div class="recipe-materials">${materialList(BUILD_COSTS[kind])}</div><small class="recipe-requirements">${requirementText(kind)}</small><button class="button button-light" data-build="${kind}" aria-label="Selecionar construção: ${BUILD_NAMES[kind]}">Selecionar ${icon('arrow')}</button></article>`).join('')}<article class="build-option"><div class="recipe-title">${icon('remove')}<h3>Remover</h3></div><p>Recolha uma peça colocada por você. Cercas e bancos devolvem os materiais; as novas peças devolvem parte deles.</p><button class="button button-light" data-build="remove" aria-label="Selecionar remoção de construção">Selecionar ${icon('arrow')}</button></article></div><div class="inventory-footer">${icon('leaf')} Um abrigo precisa de piso, limites fechados, porta e cobertura.<span>SIMULAÇÃO PAUSADA</span></div>`;
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
    if (this.mode !== 'hud') return;
    if (this.modal === 'map') { this.closeModal(); return; }
    if (this.modal) return;
    this.openModal('map');
    const panel = document.createElement('section');
    panel.className = 'map-card panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-label', 'Mapa das regiões exploráveis');
    panel.innerHTML = `<div class="modal-heading"><div><span class="eyebrow">UM VALE PARA CONHECER</span><h2>${this.latest?.inHome ? "Interior da casa" : "Mapa completo do vale"}</h2></div><button class="icon-button" aria-label="Fechar mapa">${icon('close')}</button></div>
      <p class="map-current">Você está em <strong></strong>.</p>
      <div class="exploration-map real-map" role="img" aria-label="Cenário real e posição do personagem"><img class="map-snapshot" alt="Vista do cenário atual" /><span class="map-player" hidden><i></i><b>Você</b></span><span class="map-north">N ↑</span></div>
      <p class="map-caption">Vista atual do cenário. Seu marcador indica a posição exata.</p>
      <div class="inventory-footer">${icon('leaf')} Sempre há um caminho de volta.<span>SIMULAÇÃO PAUSADA · M OU ESC PARA VOLTAR</span></div>`;
    const map = panel.querySelector<HTMLElement>('.exploration-map')!;
    map.style.aspectRatio = this.latest?.inHome ? `${HOME_WIDTH}/${HOME_HEIGHT}` : `${WORLD_WIDTH}/${WORLD_HEIGHT}`;
    void this.callbacks.onMap().then(url => { if (panel.isConnected) panel.querySelector<HTMLImageElement>('.map-snapshot')!.src = url; });
    panel.querySelector('.map-current strong')!.textContent = this.latest?.location || 'Propriedade';
    const position = this.latest?.playerTile;
    if (position) {
      const marker = panel.querySelector<HTMLElement>('.map-player')!;
      marker.hidden = false;
      marker.style.left = `${position.x / (this.latest?.inHome ? HOME_WIDTH : WORLD_WIDTH) * 100}%`;
      marker.style.top = `${position.y / (this.latest?.inHome ? HOME_HEIGHT : WORLD_HEIGHT) * 100}%`;
    }
    panel.querySelector('button')!.addEventListener('click', () => this.closeModal());
    this.overlay.append(panel);
    panel.querySelector<HTMLButtonElement>('button')!.focus();
  }

  togglePause(): void {
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
    this.overlay.append(panel);
  }

  showHomeCustomization(home: HomeData, onAction: (action: HomeEditAction) => HomeEditResponse): void {
    if (this.mode !== 'hud' || this.modal) return;
    this.openModal('home');
    const panel = document.createElement('section');
    panel.className = 'home-customization-card panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-label', 'Personalizar minha casa');
    panel.innerHTML = `<div class="modal-heading"><div><span class="eyebrow">UM REFÚGIO COM A SUA CARA</span><h2>Minha casa</h2></div><button class="icon-button" aria-label="Fechar personalização da casa">${icon('close')}</button></div><div class="home-editor-holder"></div><div class="inventory-footer">${icon('shelter')} Móveis e acabamentos ficam salvos na sua partida.<span>SIMULAÇÃO PAUSADA · ESC PARA VOLTAR</span></div>`;
    panel.querySelector('button')!.addEventListener('click', () => this.closeModal());
    this.overlay.append(panel);
    this.homeEditor = createHomeEditor(panel.querySelector<HTMLElement>('.home-editor-holder')!, home, onAction);
    panel.querySelector<HTMLButtonElement>('button')!.focus();
  }

  refreshHomeCustomization(home: HomeData, message?: string): void {
    if (this.modal === 'home') this.homeEditor?.refresh(home, message);
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

  isModalOpen(): boolean { return this.mode !== 'hud' || this.modal !== null || this.topToolbar?.isOpen === true; }

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

  private openModal(type: 'pause' | 'inventory' | 'dialogue' | 'crafting' | 'building' | 'map' | 'home' | 'sleep' | 'slots' | 'controls'): void {
    this.topToolbar?.setOpen(false, false);
    this.topToolbar?.setEnabled(false);
    this.focusBeforeModal = document.activeElement instanceof HTMLElement ? document.activeElement : undefined;
    this.modal = type;
    this.overlay.replaceChildren();
    this.overlay.classList.add('active');
    this.callbacks.onPause(true);
  }
}
