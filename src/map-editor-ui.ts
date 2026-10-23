import './map-editor.css';
import type { EditorObjectKind, TerrainKind } from './systems/map-editor';

export interface EditorTool {
  mode: 'select' | 'terrain' | 'restore' | 'object' | 'remove';
  terrain?: TerrainKind;
  object?: EditorObjectKind;
}
export type EditorAction = 'undo' | 'redo' | 'zoom-out' | 'zoom-fit' | 'zoom-in'
  | 'grid' | 'export' | 'load-draft' | 'apply' | 'cancel';
export interface MapEditorCallbacks {
  action(action: EditorAction): void | Promise<void>;
  tool(tool: EditorTool): void;
  brush(size: number): void;
  import(text: string): void | Promise<void>;
}
export interface MapEditorUIState {
  undo: boolean;
  redo: boolean;
  dirty: boolean;
  status: string;
  zoom: number;
  canLoadDraft: boolean;
  grid: boolean;
  selected?: string | null;
  tile?: { x: number; y: number } | null;
  error?: boolean;
}
const terrains: ReadonlyArray<{ kind: TerrainKind; label: string }> = [
  { kind: 'grass', label: 'Grama' }, { kind: 'path', label: 'Caminho' },
  { kind: 'water', label: 'Água' }, { kind: 'sand', label: 'Areia' }, { kind: 'soil', label: 'Terra' },
];
const objects: ReadonlyArray<{ kind: EditorObjectKind; label: string; hint: string }> = [
  { kind: 'standingTree', label: 'Árvore', hint: 'Posicionar árvore' },
  { kind: 'pine', label: 'Pinheiro', hint: 'Posicionar pinheiro' },
  { kind: 'stone', label: 'Pedras', hint: 'Posicionar pedras soltas' },
  { kind: 'vein', label: 'Rocha', hint: 'Posicionar rocha minerável' },
  { kind: 'tree', label: 'Galhos', hint: 'Posicionar galhos' },
  { kind: 'fiber', label: 'Fibras', hint: 'Posicionar fibras' },
  { kind: 'seeds', label: 'Sementes', hint: 'Posicionar sementes' },
  { kind: 'scrap', label: 'Sucata', hint: 'Posicionar sucata' },
];
const icons: Record<string, string> = {
  map: '<path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2V5Zm6-2v16m6-14v16"/>',
  undo: '<path d="m9 5-5 5 5 5M4 10h10a6 6 0 0 1 6 6v3"/>',
  redo: '<path d="m15 5 5 5-5 5m5-5H10a6 6 0 0 0-6 6v3"/>',
  select: '<path d="m5 3 14 10-7 1-3 7-4-18Zm8 12 4 6"/>',
  restore: '<path d="m3 14 8-10 10 8-7 9H9l-6-7Zm4-5 10 8m-8 4h13"/>',
  remove: '<path d="M5 7h14M9 7V3h6v4M7 7l1 14h8l1-14M10 10v8m4-8v8"/>',
  grid: '<path d="M3 3h18v18H3V3Zm6 0v18m6-18v18M3 9h18M3 15h18"/>',
  fit: '<path d="M3 9V3h6m6 0h6v6m0 6v6h-6m-6 0H3v-6m5-7h8v8H8V8Z"/>',
  export: '<path d="M12 3v12m-4-4 4 4 4-4M4 15v6h16v-6"/>',
  import: '<path d="M12 16V4m-4 4 4-4 4 4M4 15v6h16v-6"/>',
  save: '<path d="M4 3h13l4 4v14H3V3h1Zm3 0v7h10V3M7 21v-7h10v7"/>',
  play: '<path d="m8 4 12 8-12 8V4Z"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  brush: '<path d="m11 14 8-11 3 3-10 9M12 15c-2-5-7-2-7 1 0 2-1 4-3 5 8 1 11-2 10-6Z"/>',
  standingTree: '<path d="M10 21V14H6V11H3V7h3V4h4V2h5v3h4v4h2v5h-7v7h-4Z"/>',
  pine: '<path d="m12 2-5 6h3l-5 6h4l-6 5h7v3h4v-3h7l-6-5h4l-5-6h3l-5-6Z"/>',
  stone: '<path d="m3 17 4-8 8-4 6 8-3 7H8l-5-3Zm4-8 5 5 9-1m-9 1-4 6"/>',
  vein: '<path d="m3 19 2-9 7-7 8 6 2 10H3Zm5-7 4-4 4 4-4 4-4-4Z"/>',
  tree: '<path d="m4 20 14-16M9 14l-5-4m10-2 1-6M9 15l9-1m-5-5 8-1"/>',
  fiber: '<path d="M5 21c0-10 4-10 4-18m4 18c-3-8 3-12 2-18m4 18c-4-10 2-12 1-18"/>',
  seeds: '<path d="M12 22V10m0 4C5 14 4 6 4 6s8-1 8 8Zm0-4c0-6 7-7 7-7s1 8-7 8"/>',
  scrap: '<path d="m4 8 4-4 13 3-3 11-6 3-8-7V8Zm4-4 2 10 8 4M4 8l6 6 11-7"/>',
};
function icon(name: string): string {
  return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${icons[name] ?? icons.map}</svg>`;
}

/** DOM controls around the live Phaser view; all map edits remain with the controller. */
export class MapEditorUI {
  readonly element = document.createElement('section');
  private readonly fileInput = document.createElement('input');
  private readonly previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  private resizeObserver?: ResizeObserver;
  private alive = true;
  private referenceOpen = false;
  private selectedTool: EditorTool = { mode: 'select' };
  private brushSize = 1;
  private state: MapEditorUIState = {
    undo: false, redo: false, dirty: false, status: 'Escolha uma ferramenta para começar.',
    zoom: 1, canLoadDraft: false, grid: true, selected: null, tile: null, error: false,
  };

  constructor(private readonly callbacks: MapEditorCallbacks, host: HTMLElement = document.body) {
    this.element.className = 'map-editor-ui';
    this.element.setAttribute('aria-label', 'Editor do mapa');
    this.element.innerHTML = `
      <header class="me-header me-panel">
        <div class="me-heading-row">
          <div class="me-brand">${icon('map')}<div><span class="me-eyebrow">AFTER RAIN</span><h1>Editor do mapa</h1></div></div>
          <span class="me-draft-state" data-draft-state>Rascunho</span>
          <div class="me-file-actions" role="group" aria-label="Arquivos do mapa">
            <button type="button" data-action="load-draft" title="Recuperar o rascunho guardado neste navegador" disabled>${icon('save')}<span>Recuperar rascunho</span></button>
            <button type="button" data-import title="Abrir um mapa exportado">${icon('import')}<span>Importar</span></button>
            <button type="button" data-action="export" title="Baixar o mapa para guardar ou compartilhar">${icon('export')}<span>Exportar</span></button>
          </div>
          <div class="me-session-actions">
            <button type="button" data-action="cancel" class="me-secondary">Voltar sem aplicar</button>
            <button type="button" data-action="apply" class="me-primary">${icon('play')}<span>Aplicar e jogar</span></button>
          </div>
        </div>
        <div class="me-command-row">
          <div class="me-command-group" role="group" aria-label="Histórico de alterações">
            <button type="button" data-action="undo" title="Desfazer (Ctrl+Z)" disabled>${icon('undo')}<span>Desfazer</span></button>
            <button type="button" data-action="redo" title="Refazer (Ctrl+Y ou Ctrl+Shift+Z)" disabled>${icon('redo')}<span>Refazer</span></button>
          </div>
          <div class="me-command-group me-zoom" role="group" aria-label="Zoom do editor">
            <button type="button" data-action="zoom-out" aria-label="Diminuir zoom do editor">−</button>
            <output data-zoom aria-label="Zoom atual">100%</output>
            <button type="button" data-action="zoom-in" aria-label="Aumentar zoom do editor">+</button>
            <button type="button" data-action="zoom-fit" title="Enquadrar o mapa inteiro">${icon('fit')}<span>Enquadrar mapa</span></button>
          </div>
          <div class="me-command-group" role="group" aria-label="Guias visuais">
            <button type="button" data-action="grid" aria-pressed="true">${icon('grid')}<span>Grade</span></button>
            <button type="button" data-reference aria-expanded="false" aria-controls="map-editor-reference">${icon('map')}<span>Referência</span></button>
          </div>
          <span class="me-map-caption">Mapa atual · 96 × 72</span>
        </div>
      </header>
      <aside class="me-palette me-panel" aria-label="Ferramentas e elementos do mapa">
        <div class="me-palette-top"><span class="me-eyebrow">CRIAR E ORGANIZAR</span><h2>Seu mundo</h2></div>
        <button type="button" class="me-select-tool" data-mode="select" aria-pressed="true">${icon('select')}<span>Selecionar e mover</span></button>
        <section class="me-palette-section" aria-labelledby="me-terrain-title">
          <h3 id="me-terrain-title">Pintar o chão</h3>
          <div class="me-terrain-grid">${terrains.map(({ kind, label }) => `<button type="button" data-mode="terrain" data-terrain="${kind}" aria-label="Pintar ${label.toLowerCase()}" aria-pressed="false"><span class="me-swatch me-swatch-${kind}" aria-hidden="true"></span><span>${label}</span></button>`).join('')}
            <button type="button" data-mode="restore" title="Restaurar o terreno original nos pontos pintados" aria-pressed="false">${icon('restore')}<span>Restaurar chão</span></button>
          </div>
          <div class="me-brush-row"><span>${icon('brush')} Pincel</span><div role="group" aria-label="Tamanho do pincel">${[1, 3, 5].map(size => `<button type="button" data-brush="${size}" aria-label="Pincel ${size} por ${size}" aria-pressed="${size === 1}">${size}×${size}</button>`).join('')}</div></div>
        </section>
        <section class="me-palette-section" aria-labelledby="me-objects-title">
          <h3 id="me-objects-title">Posicionar objetos</h3>
          <div class="me-object-grid">${objects.map(({ kind, label, hint }) => `<button type="button" data-mode="object" data-object="${kind}" aria-label="${hint}" aria-pressed="false"><span class="me-object-preview" data-preview="${kind}" aria-hidden="true">${icon(kind)}</span><span>${label}</span></button>`).join('')}</div>
          <button type="button" class="me-remove-tool" data-mode="remove" aria-pressed="false">${icon('remove')}<span>Remover objeto</span></button>
        </section>
        <div class="me-selection-info"><span class="me-eyebrow">SELEÇÃO</span><p data-selection>Selecione um objeto no cenário.</p></div>
      </aside>
      <aside id="map-editor-reference" class="me-reference me-panel" aria-label="Referência do mapa expandido" hidden>
        <div class="me-reference-heading"><h2>Mapa de referência</h2><button type="button" data-reference-close aria-label="Fechar referência">${icon('close')}</button></div>
        <div class="me-reference-image"><img src="assets/references/mapa_expandido.webp" alt="Mapa conceitual expandido de After Rain, com regiões e caminhos" draggable="false"/></div>
        <p>Use esta imagem como guia para organizar as áreas do seu mundo.</p>
      </aside>
      <footer class="me-footer me-panel">
        <div class="me-feedback"><p data-status role="status" aria-live="polite" aria-atomic="true">Escolha uma ferramenta para começar.</p><output data-tile aria-label="Coordenada do mapa">—</output></div>
        <p class="me-hint">Arraste para pintar · Espaço + arraste para navegar · Ctrl+Z / Ctrl+Y · Roda: zoom</p>
      </footer>`;
    this.fileInput.type = 'file';
    this.fileInput.accept = '.json,application/json';
    this.fileInput.hidden = true;
    this.fileInput.setAttribute('aria-label', 'Importar arquivo de mapa');
    this.element.append(this.fileInput);
    host.append(this.element);
    this.bindControls();
    this.update({});
    const header = this.element.querySelector<HTMLElement>('.me-header')!;
    const measureHeader = (): void => this.element.style.setProperty('--me-header-bottom', `${Math.ceil(header.getBoundingClientRect().bottom) + 10}px`);
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(measureHeader);
      this.resizeObserver.observe(header);
    }
    measureHeader();
  }

  private bindControls(): void {
    this.element.querySelectorAll<HTMLButtonElement>('[data-action]').forEach(button => {
      button.addEventListener('click', () => this.action(button.dataset.action as EditorAction));
    });
    this.element.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach(button => {
      button.addEventListener('click', () => {
        this.selectedTool = { mode: button.dataset.mode as EditorTool['mode'],
          ...(button.dataset.terrain ? { terrain: button.dataset.terrain as TerrainKind } : {}),
          ...(button.dataset.object ? { object: button.dataset.object as EditorObjectKind } : {}),
        };
        this.paintToolSelection();
        this.callbacks.tool({ ...this.selectedTool });
      });
    });
    this.element.querySelectorAll<HTMLButtonElement>('[data-brush]').forEach(button => {
      button.addEventListener('click', () => {
        this.brushSize = Number(button.dataset.brush);
        this.element.querySelectorAll<HTMLButtonElement>('[data-brush]').forEach(control => control.setAttribute('aria-pressed', String(Number(control.dataset.brush) === this.brushSize)));
        this.callbacks.brush(this.brushSize);
      });
    });
    this.element.querySelector('[data-reference]')!.addEventListener('click', () => this.showReference(!this.referenceOpen));
    this.element.querySelector('[data-reference-close]')!.addEventListener('click', () => this.showReference(false));
    this.element.querySelector('[data-import]')!.addEventListener('click', () => this.fileInput.click());
    this.fileInput.addEventListener('change', () => { void this.readImport(); });
    // The panels use real DOM scrolling and buttons; the rest of the viewport
    // stays transparent to pointer input for Phaser's editor controller.
    for (const type of ['pointerdown', 'pointerup', 'pointermove', 'mousedown', 'mouseup', 'mousemove', 'click', 'dblclick', 'wheel', 'touchstart', 'touchmove', 'touchend']) {
      this.element.addEventListener(type, event => event.stopPropagation());
    }
    this.element.addEventListener('dragstart', event => event.preventDefault());
    this.element.addEventListener('contextmenu', event => { event.preventDefault(); event.stopPropagation(); });
    this.element.addEventListener('keydown', event => {
      event.stopPropagation();
      if ((event.ctrlKey || event.metaKey) && ['z', 'y'].includes(event.key.toLowerCase())) {
        event.preventDefault();
        const redo = event.key.toLowerCase() === 'y' || event.shiftKey;
        if (redo ? this.state.redo : this.state.undo) this.action(redo ? 'redo' : 'undo');
      } else if (event.key === 'Escape') {
        event.preventDefault();
        if (this.referenceOpen) this.showReference(false); else this.action('cancel');
      }
    });
    this.element.addEventListener('keyup', event => event.stopPropagation());
  }

  private action(action: EditorAction): void {
    if (!this.alive) return;
    try {
      void Promise.resolve(this.callbacks.action(action)).catch(() => this.update({ status: 'Não foi possível concluir a ação. Seu rascunho continua aberto.', error: true }));
    } catch { this.update({ status: 'Não foi possível concluir a ação. Seu rascunho continua aberto.', error: true }); }
  }

  private async readImport(): Promise<void> {
    const file = this.fileInput.files?.[0];
    this.fileInput.value = '';
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      this.update({ status: 'Esse arquivo é grande demais. Escolha um mapa exportado pelo editor (até 2 MB).', error: true });
      return;
    }
    try {
      const text = await file.text();
      if (this.alive) await this.callbacks.import(text);
    } catch { if (this.alive) this.update({ status: 'Não foi possível abrir esse arquivo. O mapa atual foi mantido.', error: true }); }
  }

  private paintToolSelection(): void {
    this.element.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach(button => {
      const selected = button.dataset.mode === this.selectedTool.mode
        && (this.selectedTool.mode !== 'terrain' || button.dataset.terrain === this.selectedTool.terrain)
        && (this.selectedTool.mode !== 'object' || button.dataset.object === this.selectedTool.object);
      button.setAttribute('aria-pressed', String(selected));
    });
    this.element.classList.toggle('me-painting', this.selectedTool.mode === 'terrain' || this.selectedTool.mode === 'restore');
  }

  private showReference(open: boolean): void {
    this.referenceOpen = open;
    this.element.querySelector<HTMLElement>('.me-reference')!.hidden = !open;
    this.element.querySelector('[data-reference]')!.setAttribute('aria-expanded', String(open));
    if (!open && this.element.querySelector('.me-reference')!.contains(document.activeElement)) {
      this.element.querySelector<HTMLButtonElement>('[data-reference]')!.focus();
    }
  }

  update(next: Partial<MapEditorUIState>): void {
    if (!this.alive) return;
    this.state = { ...this.state, ...next, ...(next.status !== undefined && next.error === undefined ? { error: false } : {}) };
    const state = this.state;
    this.element.querySelector<HTMLButtonElement>('[data-action="undo"]')!.disabled = !state.undo;
    this.element.querySelector<HTMLButtonElement>('[data-action="redo"]')!.disabled = !state.redo;
    this.element.querySelector<HTMLButtonElement>('[data-action="load-draft"]')!.disabled = !state.canLoadDraft;
    this.element.querySelector('[data-action="grid"]')!.setAttribute('aria-pressed', String(state.grid));
    const draft = this.element.querySelector<HTMLElement>('[data-draft-state]')!;
    draft.textContent = state.dirty ? 'Rascunho alterado' : 'Rascunho';
    draft.dataset.changed = String(state.dirty);
    this.element.querySelector('[data-zoom]')!.textContent = `${Math.round(state.zoom * 100)}%`;
    const message = this.element.querySelector<HTMLElement>('[data-status]')!;
    message.textContent = state.status;
    message.dataset.error = String(!!state.error);
    this.element.querySelector('[data-selection]')!.textContent = state.selected || 'Selecione um objeto no cenário.';
    this.element.querySelector('[data-tile]')!.textContent = state.tile ? `${state.tile.x}, ${state.tile.y}` : '—';
  }

  setThumbnails(images: Partial<Record<EditorObjectKind, string>>): void {
    for (const { kind, label } of objects) {
      const url = images[kind];
      if (!url) continue;
      const container = this.element.querySelector<HTMLElement>(`[data-preview="${kind}"]`)!;
      const image = document.createElement('img');
      image.src = url; image.alt = label; image.draggable = false;
      image.addEventListener('error', () => { if (this.alive) container.innerHTML = icon(kind); }, { once: true });
      container.replaceChildren(image);
    }
  }

  destroy(): void {
    if (!this.alive) return;
    this.alive = false;
    this.resizeObserver?.disconnect();
    this.element.remove();
    if (this.previousFocus?.isConnected) this.previousFocus.focus();
  }
}
