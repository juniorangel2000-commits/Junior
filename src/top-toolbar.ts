import './top-toolbar.css';
import { toolbarIcon } from './toolbar-icons';

export type ToolbarAction = 'inventory' | 'map' | 'crafting' | 'building' | 'save' | 'options' | 'controls' | 'audio' | 'graphics' | 'pets';
interface ToolbarCallbacks {
  onOpenChange(open: boolean): void;
  onAction(action: ToolbarAction): void;
}

/** Only the reveal area captures the pointer while closed; the world stays playable. */
export class TopToolbar {
  private readonly root = document.createElement('div');
  private readonly panel: HTMLElement;
  private readonly handle: HTMLButtonElement;
  private open = false;

  constructor(host: HTMLElement, private readonly callbacks: ToolbarCallbacks) {
    this.root.className = 'top-toolbar';
    this.root.innerHTML = `<div class="toolbar-reveal-zone"><button type="button" class="toolbar-handle" aria-label="Abrir opções do jogo" aria-controls="game-top-toolbar" aria-expanded="false" title="Abrir opções do jogo · botão direito no cenário">${toolbarIcon('chevron')}<span>Menu do jogo</span></button></div><nav id="game-top-toolbar" class="toolbar-panel" aria-label="Opções do jogo" hidden><div class="toolbar-heading"><span>After Rain</span><small>SIMULAÇÃO PAUSADA</small></div><div class="toolbar-actions"></div><p class="toolbar-hint">Esc ou seta para recolher · botão direito no cenário para abrir</p></nav>`;
    this.panel = this.root.querySelector<HTMLElement>('.toolbar-panel')!;
    this.handle = this.root.querySelector<HTMLButtonElement>('.toolbar-handle')!;
    const actions: Array<{ id: ToolbarAction; label: string; shortcut?: string; cls: string }> = [
      { id: 'inventory', label: 'Inventário', shortcut: 'I', cls: 'inventory-button' },
      { id: 'map', label: 'Mapa', shortcut: 'M', cls: 'map-button' },
      { id: 'crafting', label: 'Fabricação', shortcut: 'C', cls: 'crafting-button' },
      { id: 'building', label: 'Construção', shortcut: 'B', cls: 'building-button' },
      { id: 'pets', label: 'Companheiros', cls: 'toolbar-pets-button' },
      { id: 'audio', label: 'Música', cls: 'toolbar-audio-button' },
      { id: 'graphics', label: 'Gráficos', cls: 'toolbar-graphics-button' },
      { id: 'save', label: 'Salvar', cls: 'toolbar-save-button' },
      { id: 'controls', label: 'Controles', cls: 'toolbar-controls-button' },
      { id: 'options', label: 'Opções', shortcut: 'Esc', cls: 'pause-button' },
    ];
    const list = this.root.querySelector<HTMLElement>('.toolbar-actions')!;
    for (const action of actions) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `toolbar-action ${action.cls}`;
      button.dataset.toolbarAction = action.id;
      button.setAttribute('aria-label', action.id === 'options' ? 'Abrir opções e pausa' : action.label);
      button.innerHTML = `${toolbarIcon(action.id)}<span>${action.label}</span>${action.shortcut ? `<kbd>${action.shortcut}</kbd>` : ''}`;
      button.addEventListener('click', () => callbacks.onAction(action.id));
      list.append(button);
    }
    this.handle.addEventListener('click', () => this.setOpen(!this.open));
    this.root.addEventListener('keydown', event => {
      if (!this.open || event.key !== 'Tab') return;
      const controls = [...this.root.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')].filter(button => button.getClientRects().length);
      const first = controls[0], last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    });
    host.append(this.root);
  }

  get isOpen(): boolean { return this.open; }

  setOpen(open: boolean, notify = true): void {
    if (open === this.open) return;
    this.open = open;
    this.root.classList.toggle('is-open', open);
    this.panel.hidden = !open;
    this.handle.setAttribute('aria-expanded', String(open));
    this.handle.setAttribute('aria-label', `${open ? 'Recolher' : 'Abrir'} opções do jogo`);
    this.handle.title = open ? 'Recolher opções do jogo (Esc)' : 'Abrir opções do jogo · botão direito no cenário';
    if (notify) {
      this.callbacks.onOpenChange(open);
      if (open) this.panel.querySelector<HTMLButtonElement>('button:not([hidden])')?.focus();
      else this.handle.focus();
    }
  }

  toggle(): void { this.setOpen(!this.open); }
  setEnabled(enabled: boolean): void { this.root.hidden = !enabled; }
  dismiss(): boolean {
    if (!this.open) return false;
    this.setOpen(false);
    return true;
  }
  focusHandle(): void { this.handle.focus(); }
  destroy(): void { this.root.remove(); }
}
