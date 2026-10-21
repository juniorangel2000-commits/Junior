import './admin-menu.css';
import { ITEMS, ITEM_IDS } from './data/items';
import { itemIconUrl } from './visual-assets';
import { AdminAccess } from './systems/admin';
import { MAX_ITEM_COUNT } from './systems/inventory';
import type { ActionResult } from './systems/farming';
import type { ItemId } from './types';

interface AdminMenuCallbacks {
  onPause(paused: boolean): void;
  onGrant(item: ItemId, amount: number): ActionResult;
}

/** O painel é independente do HUD; recolher retoma a simulação sem encerrar a sessão. */
export class AdminMenu {
  private readonly layer = document.createElement('div');
  private open = false;
  private minimized = false;
  private alive = true;
  private revision = 0;
  private previousFocus: HTMLElement | null = null;

  constructor(host: HTMLElement, private readonly access: AdminAccess, private readonly callbacks: AdminMenuCallbacks) {
    this.layer.className = 'admin-layer';
    host.append(this.layer);
    this.layer.addEventListener('keydown', event => {
      event.stopPropagation();
      if (event.key === 'Escape') { event.preventDefault(); this.minimize(); return; }
      if (event.key !== 'Tab' || !this.open) return;
      const controls = [...this.layer.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled)')]
        .filter(element => element.getClientRects().length > 0);
      const first = controls[0], last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    });
    this.layer.addEventListener('pointerdown', event => event.stopPropagation());
  }

  get isOpen(): boolean { return this.open; }
  get isMinimized(): boolean { return this.minimized; }

  toggle(): void {
    if (!this.alive) return;
    if (this.open) { this.minimize(); return; }
    this.previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    this.open = true;
    this.minimized = false;
    this.callbacks.onPause(true);
    this.render();
  }

  minimize(): void {
    if (!this.open) return;
    this.revision++;
    this.open = false;
    this.minimized = true;
    this.render();
    this.callbacks.onPause(false);
    this.previousFocus?.focus();
  }

  close(): void {
    const wasOpen = this.open;
    this.revision++;
    this.access.lock();
    this.open = false;
    this.minimized = false;
    this.layer.replaceChildren();
    if (wasOpen) this.callbacks.onPause(false);
    this.previousFocus?.focus();
  }

  destroy(): void { this.close(); this.alive = false; this.layer.remove(); }

  private render(): void {
    this.layer.replaceChildren();
    if (this.minimized) {
      const pill = document.createElement('div');
      pill.className = 'admin-pill';
      pill.innerHTML = `<span>Admin · ${this.access.isUnlocked ? 'sessão ativa' : 'bloqueado'}</span><button type="button" aria-label="Expandir menu de administrador">Expandir</button><button type="button" aria-label="Encerrar acesso de administrador">Sair</button>`;
      pill.querySelectorAll('button')[0].addEventListener('click', () => this.toggle());
      pill.querySelectorAll('button')[1].addEventListener('click', () => this.close());
      this.layer.append(pill);
      return;
    }
    if (!this.open) return;
    const shade = document.createElement('div');
    shade.className = 'admin-shade';
    const panel = document.createElement('section');
    panel.className = `admin-card${this.access.isUnlocked ? '' : ' admin-login'}`;
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-labelledby', 'admin-heading');
    panel.innerHTML = `<header class="admin-heading"><div><small>ACESSO RESTRITO</small><h2 id="admin-heading">${this.access.isUnlocked ? 'Itens para testes' : 'Administrador'}</h2></div><div class="admin-actions"><button type="button" data-admin-minimize aria-label="Minimizar menu de administrador">Minimizar</button><button type="button" data-admin-close>${this.access.isUnlocked ? 'Encerrar sessão' : 'Fechar'}</button></div></header>`;
    panel.querySelector('[data-admin-minimize]')!.addEventListener('click', () => this.minimize());
    panel.querySelector('[data-admin-close]')!.addEventListener('click', () => this.close());
    if (this.access.isUnlocked) this.renderItems(panel);
    else this.renderLogin(panel);
    shade.append(panel);
    this.layer.append(shade);
    panel.querySelector<HTMLInputElement>('input')?.focus();
  }

  private renderLogin(panel: HTMLElement): void {
    const form = document.createElement('form');
    form.innerHTML = '<p class="admin-note">Digite a senha do administrador para liberar os itens de teste. Este acesso local não usa contas nem servidor.</p><label>Senha do administrador<input id="admin-password" type="password" autocomplete="current-password" maxlength="256" required /></label><button class="admin-submit" type="submit">Desbloquear</button><p class="admin-status" role="status" aria-live="polite"></p>';
    form.addEventListener('submit', async event => {
      event.preventDefault();
      const input = form.querySelector('input')!;
      const submit = form.querySelector('button')!;
      const status = form.querySelector<HTMLElement>('.admin-status')!;
      const revision = this.revision;
      const password = input.value;
      input.value = '';
      submit.disabled = true;
      input.disabled = true;
      status.textContent = 'Conferindo acesso…';
      const unlocked = await this.access.unlock(password);
      if (!this.alive || !this.open || revision !== this.revision) {
        // Fechar durante a verificação não pode criar uma sessão invisível.
        if (unlocked) this.access.lock();
        return;
      }
      if (unlocked) { this.render(); return; }
      submit.disabled = false;
      input.disabled = false;
      status.dataset.error = 'true';
      status.textContent = this.access.cooldownSeconds > 0
        ? `Muitas tentativas. Aguarde ${this.access.cooldownSeconds} segundos antes de tentar novamente.`
        : 'Senha incorreta ou verificação indisponível. O acesso permanece bloqueado.';
      input.focus();
    });
    panel.append(form);
  }

  private renderItems(panel: HTMLElement): void {
    const toolbar = document.createElement('div');
    toolbar.className = 'admin-toolbar';
    toolbar.innerHTML = `<label>Buscar item<input type="search" placeholder="Nome do item" aria-label="Buscar item de teste" /></label><label>Quantidade por clique<input id="admin-quantity" type="number" value="10" min="1" max="${MAX_ITEM_COUNT}" step="1" required /></label>`;
    const grid = document.createElement('div');
    grid.className = 'admin-items';
    const status = document.createElement('p');
    status.className = 'admin-status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    const quantity = toolbar.querySelector<HTMLInputElement>('[type=number]')!;
    const renderList = (): void => {
      const search = toolbar.querySelector<HTMLInputElement>('[type=search]')!.value.trim().toLocaleLowerCase('pt-BR');
      grid.replaceChildren();
      for (const item of ITEM_IDS.filter(id => ITEMS[id].name.toLocaleLowerCase('pt-BR').includes(search))) {
        const card = document.createElement('article');
        card.className = 'admin-item';
        card.dataset.item = item;
        const title = document.createElement('strong');
        const url = itemIconUrl(item);
        if (url) { const image = document.createElement('img'); image.src = url; image.alt = ''; title.append(image); }
        title.append(ITEMS[item].name);
        const description = document.createElement('p');
        description.textContent = ITEMS[item].description;
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = 'Adicionar à mochila';
        button.addEventListener('click', () => {
          if (!this.access.isUnlocked) { this.render(); return; }
          if (!quantity.reportValidity()) return;
          const result = this.callbacks.onGrant(item, quantity.valueAsNumber);
          status.textContent = result.ok ? `${quantity.valueAsNumber} × ${ITEMS[item].name} adicionado(s) à mochila.` : result.message;
          status.dataset.error = String(!result.ok);
        });
        card.append(title, description, button);
        grid.append(card);
      }
      if (!grid.children.length) grid.textContent = 'Nenhum item encontrado.';
    };
    toolbar.querySelector('[type=search]')!.addEventListener('input', renderList);
    const note = document.createElement('p');
    note.className = 'admin-note';
    note.textContent = `Todos os ${ITEM_IDS.length} itens implementados. A simulação está pausada; minimizar permite testar no mapa. Itens adicionados fazem parte do salvamento normal.`;
    panel.append(note, toolbar, grid, status);
    renderList();
  }
}
