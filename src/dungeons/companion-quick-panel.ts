import { makeDraggablePanel } from '../draggable-panel';
import { PETS } from './config';
import type { PetCommand, PetMenuView } from './pet-menu';

/** Non-modal companion controls; removed with the owning scene. */
export class CompanionQuickPanel {
  readonly element = document.createElement('aside');
  private readonly body: HTMLElement;
  private readonly toggle: HTMLButtonElement;
  private readonly cleanupDrag: () => void;
  private signature = '';
  private expanded = true;
  private closed = false;
  private active = false;

  constructor(host: HTMLElement, private readonly actions: {
    allowed(): boolean;
    toggleMenu(): void;
    command(command: PetCommand): boolean;
  }) {
    this.element.className = 'companion-quick';
    this.element.setAttribute('aria-label', 'Atalhos dos companheiros');
    try {
      const state = localStorage.getItem('after-rain-companions-panel');
      this.closed = state === 'closed';
      this.expanded = state !== 'minimized';
    } catch { /* Keep controls available without storage. */ }
    this.element.innerHTML = `<header class="companion-quick-handle"><span>Companheiros</span><div class="companion-window-controls"><button type="button" data-companion-toggle aria-label="Minimizar companheiros" aria-expanded="true" title="Minimizar">−</button><button type="button" data-companion-close aria-label="Fechar painel dos companheiros" title="Fechar painel">×</button></div></header><div class="companion-quick-body"><p data-companion-status></p><div class="companion-quick-actions"><button type="button" data-quick-command="follow">Seguir</button><button type="button" data-quick-command="stay">Esperar</button><button type="button" data-quick-command="recall">Chamar</button></div><button type="button" data-companion-full>Todos os companheiros <kbd>K</kbd></button></div>`;
    host.append(this.element);
    this.body = this.element.querySelector('.companion-quick-body')!;
    this.toggle = this.element.querySelector('[data-companion-toggle]')!;
    this.toggle.onclick = () => {
      if (!actions.allowed()) return;
      this.expanded = !this.expanded;
      this.applyWindowState();
    };
    this.element.querySelector<HTMLButtonElement>('[data-companion-close]')!.onclick = () => {
      if (!actions.allowed()) return;
      this.closed = true;
      this.applyWindowState();
    };
    this.applyWindowState();
    this.element.querySelector<HTMLButtonElement>('[data-companion-full]')!.onclick = () => {
      if (actions.allowed()) actions.toggleMenu();
    };
    this.element.querySelectorAll<HTMLButtonElement>('[data-quick-command]').forEach(button => {
      button.onclick = () => {
        if (actions.allowed()) actions.command({ kind: button.dataset.quickCommand as 'follow' | 'stay' | 'recall' });
      };
    });
    this.cleanupDrag = makeDraggablePanel(this.element, this.element.querySelector('header')!, host, 'after-rain-companions-position');
    window.addEventListener('keydown', this.keydown);
  }

  private keydown = (event: KeyboardEvent): void => {
    const target = event.target;
    if (event.defaultPrevented || event.repeat || event.ctrlKey || event.metaKey || event.altKey || event.key.toLowerCase() !== 'k'
      || (target instanceof Element && target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])'))
      || !this.active || !this.element.isConnected) return;
    event.preventDefault();
    this.actions.toggleMenu();
  };

  update(view: PetMenuView, visible: boolean, interactive: boolean): void {
    this.active = visible;
    this.element.hidden = !visible || this.closed;
    this.element.inert = !interactive;
    const pet = view.pets.find(p => p.id === view.selected);
    const signature = JSON.stringify([pet?.id, pet?.world?.mode, view.nearby]);
    if (signature === this.signature) return;
    this.signature = signature;
    this.element.querySelector('[data-companion-status]')!.textContent = pet
      ? `${PETS[pet.species].name}${pet.rare ? ' ✦' : ''} · ${pet.world?.mode === 'shelter' ? 'Na casinha' : pet.world?.mode === 'stay' ? 'Esperando' : 'Seguindo'}`
      : 'Nenhum companheiro selecionado';
    this.element.querySelectorAll<HTMLButtonElement>('[data-quick-command]').forEach(button => {
      button.disabled = !pet || (button.dataset.quickCommand === 'stay' && !view.nearby);
      button.setAttribute('aria-pressed', String(button.dataset.quickCommand === pet?.world?.mode));
    });
  }

  hide(): void {
    this.active = false;
    this.element.hidden = true;
  }

  show(): void {
    this.closed = false;
    this.expanded = true;
    this.applyWindowState();
  }

  private applyWindowState(): void {
    this.body.hidden = !this.expanded;
    this.element.hidden = this.closed || !this.active;
    this.toggle.textContent = this.expanded ? '−' : '□';
    this.toggle.setAttribute('aria-expanded', String(this.expanded));
    const label = `${this.expanded ? 'Minimizar' : 'Restaurar'} companheiros`;
    this.toggle.setAttribute('aria-label', label);
    this.toggle.title = label;
    try {
      localStorage.setItem('after-rain-companions-panel', this.closed ? 'closed' : this.expanded ? 'expanded' : 'minimized');
    } catch { /* Keep the preference for this session. */ }
  }

  destroy(): void {
    window.removeEventListener('keydown', this.keydown);
    this.cleanupDrag();
    this.element.remove();
  }
}
