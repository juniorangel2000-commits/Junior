import { drawCharacter } from './art';
import type { CharacterProfile, HairStyle, HudData, InventoryData, ItemId, Tool } from './types';

interface UICallbacks {
  onNewGame(profile: CharacterProfile): void;
  onContinue(): void;
  onTool(tool: Tool): void;
  onPause(paused: boolean): void;
  onSave(): boolean;
  onMainMenu(): void;
}

const paths: Record<string, string> = {
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
};
function icon(name: string, cls = ''): string {
  return `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] ?? paths.leaf}</svg>`;
}
const tools: { id: Tool; label: string; icon: string; detail: string }[] = [
  { id: 'hand', label: 'Explorar', icon: 'hand', detail: 'Coletar, conversar e colher' },
  { id: 'plant', label: 'Plantar', icon: 'seeds', detail: 'Plantar uma semente na horta' },
  { id: 'water', label: 'Regar', icon: 'water', detail: 'Regar uma plantação' },
  { id: 'fence', label: 'Cerca', icon: 'fence', detail: 'Construir uma cerca' },
  { id: 'bench', label: 'Banco', icon: 'bench', detail: 'Construir um banco' },
  { id: 'remove', label: 'Remover', icon: 'remove', detail: 'Remover e recuperar materiais' },
];
const items: { id: ItemId; label: string; description: string }[] = [
  { id: 'wood', label: 'Madeira', description: 'Galhos e troncos. Para cercas e bancos.' },
  { id: 'stone', label: 'Pedra', description: 'Um material simples para construir.' },
  { id: 'seeds', label: 'Sementes de nabo', description: 'Plante na terra preparada e regue.' },
  { id: 'turnip', label: 'Nabos', description: 'O fruto do seu primeiro recomeço.' },
];

export class GameUI {
  private root = document.querySelector<HTMLDivElement>('#ui')!;
  private base = document.createElement('div');
  private overlay = document.createElement('div');
  private notifications = document.createElement('div');
  private mode: 'title' | 'creation' | 'hud' = 'title';
  private modal: 'pause' | 'inventory' | 'dialogue' | null = null;
  private onModalClose?: () => void;
  private existingSave = false;
  private latest?: HudData;
  private lastHudKey = '';

  constructor(private callbacks: UICallbacks) {
    this.base.className = 'ui-base';
    this.overlay.className = 'modal-root';
    this.notifications.className = 'toast-stack';
    this.notifications.setAttribute('aria-live', 'polite');
    this.root.replaceChildren(this.base, this.overlay, this.notifications);
  }

  showTitle(hasSave: boolean): void {
    this.mode = 'title';
    this.modal = null;
    this.existingSave = hasSave;
    this.overlay.replaceChildren();
    this.overlay.classList.remove('active');
    this.callbacks.onPause(true);
    this.base.innerHTML = `
      <section class="title-screen" aria-label="Menu principal">
        <header class="title-header"><a class="brand" href="#" aria-label="Depois da Chuva">${icon('leaf')}<span>ESTÚDIO DO RECOMEÇO<small>UMA HISTÓRIA FEITA DE PEQUENAS COISAS</small></span></a><span class="version-tag">EDIÇÃO DO PRIMEIRO BROTO <b>v0.1</b></span></header>
        <div class="title-copy"><div class="eyebrow"><span></span> UM RECOMEÇO À SUA ESPERA</div>
          <h1>Depois<br><em>da Chuva<span class="title-period">.</span></em></h1>
          <p>O mundo ficou em silêncio.<br>A vida encontrou um jeito de voltar.</p>
          <div class="title-actions"><button class="button button-primary" id="new-game">Novo jogo ${icon('arrow')}</button>${hasSave ? '<button class="button button-glass" id="continue-game">Continuar minha história</button>' : ''}</div>
          <div class="title-note">${icon('leaf')} Cultive a terra. Reconstrua os laços.</div>
        </div>
        <aside class="title-location"><span class="location-dot"></span><div>VALE DAS ÁGUAS<small>Um lugar para chamar de seu.</small></div></aside>
        <footer class="title-footer"><span>UM JOGO SOBRE O QUE AINDA PODE FLORESCER</span><span>TECLADO E MOUSE <i>·</i> SALVAMENTO LOCAL</span></footer>
      </section>`;
    this.base.querySelector('.brand')!.addEventListener('click', event => event.preventDefault());
    this.base.querySelector('#new-game')!.addEventListener('click', () => this.showCreation());
    this.base.querySelector('#continue-game')?.addEventListener('click', () => this.callbacks.onContinue());
  }

  private showCreation(): void {
    this.mode = 'creation';
    this.overlay.classList.remove('active');
    this.callbacks.onPause(true);
    this.base.innerHTML = '<div class="creation-backdrop"></div>';
    const profile: CharacterProfile = { name: '', skin: '#d9a474', hairStyle: 'curto', hairColor: '#4b3029', outfit: '#bd7052' };
    const card = document.createElement('section');
    card.className = 'creation-card panel';
    card.setAttribute('aria-label', 'Criação de personagem');
    card.innerHTML = `<div class="creation-heading"><div><span class="eyebrow">TODA HISTÓRIA COMEÇA COM ALGUÉM</span><h2>Quem chega ao vale?</h2></div><button class="icon-button back-button" aria-label="Voltar ao início">${icon('close')}</button></div>
      <form id="character-form" class="creation-content">
        <aside class="character-preview"><div class="preview-sun"></div><div class="preview-label">SEU NOVO COMEÇO</div><div class="preview-character"><canvas width="24" height="32" aria-label="Prévia do personagem"></canvas></div><div class="preview-ground"></div><strong class="preview-name">Viajante</strong><span>Uma vida inteira pela frente.</span><div class="preview-leaves">${icon('leaf')}${icon('leaf')}${icon('leaf')}</div></aside>
        <div class="character-options"><label class="field-label" for="character-name">Como podemos te chamar?</label><input id="character-name" name="name" type="text" maxlength="24" placeholder="Seu nome" autocomplete="off" required />
          <div class="option-group"><span class="field-label">Tom de pele</span><div class="swatches" data-option="skin"></div></div>
          <div class="option-group"><span class="field-label">Cabelo</span><div class="hair-styles"><button type="button" data-hair="curto" class="choice selected">Curto</button><button type="button" data-hair="longo" class="choice">Longo</button><button type="button" data-hair="preso" class="choice">Preso</button></div></div>
          <div class="option-group"><span class="field-label">Cor do cabelo</span><div class="swatches" data-option="hairColor"></div></div>
          <div class="option-group"><span class="field-label">Roupa</span><div class="swatches" data-option="outfit"></div></div>
          ${this.existingSave ? '<p class="save-warning">Ao começar, sua história salva neste navegador será substituída.</p>' : '<p class="creation-tip">Não é preciso ter todas as respostas. Só dar o primeiro passo.</p>'}
          <button class="button button-primary start-button" type="submit">Começar minha história ${icon('arrow')}</button>
        </div>
      </form>`;
    this.overlay.replaceChildren(card);
    const canvas = card.querySelector('canvas')!;
    const draw = (): void => drawCharacter(canvas, profile);
    draw();
    const colors = {
      skin: [['#f3d0a7', 'Claro'], ['#d9a474', 'Médio claro'], ['#aa714b', 'Médio escuro'], ['#69432f', 'Escuro']],
      hairColor: [['#302923', 'Preto'], ['#4b3029', 'Castanho'], ['#a85b33', 'Ruivo'], ['#d4ac68', 'Loiro'], ['#a8a596', 'Grisalho']],
      outfit: [['#bd7052', 'Terracota'], ['#6d8655', 'Verde musgo'], ['#638a9d', 'Azul do céu'], ['#d5b968', 'Mostarda'], ['#967789', 'Ameixa']],
    };
    for (const [key, options] of Object.entries(colors)) {
      const field = key as 'skin' | 'hairColor' | 'outfit';
      const holder = card.querySelector(`[data-option="${key}"]`)!;
      for (const [color, label] of options) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `swatch${profile[field] === color ? ' selected' : ''}`;
        button.style.setProperty('--swatch', color);
        button.setAttribute('aria-label', label);
        button.setAttribute('aria-pressed', String(profile[field] === color));
        button.title = label;
        button.addEventListener('click', () => {
          profile[field] = color;
          holder.querySelectorAll('button').forEach(b => { b.classList.remove('selected'); b.setAttribute('aria-pressed', 'false'); });
          button.classList.add('selected');
          button.setAttribute('aria-pressed', 'true');
          draw();
        });
        holder.append(button);
      }
    }
    card.querySelectorAll<HTMLButtonElement>('[data-hair]').forEach(button => button.addEventListener('click', () => {
      profile.hairStyle = button.dataset.hair as HairStyle;
      card.querySelectorAll('[data-hair]').forEach(b => b.classList.remove('selected'));
      button.classList.add('selected');
      draw();
    }));
    const input = card.querySelector<HTMLInputElement>('#character-name')!;
    input.addEventListener('input', () => {
      profile.name = input.value.trim();
      card.querySelector('.preview-name')!.textContent = profile.name || 'Viajante';
    });
    card.querySelector('.back-button')!.addEventListener('click', () => this.showTitle(this.existingSave));
    card.querySelector('form')!.addEventListener('submit', event => {
      event.preventDefault();
      if (!profile.name) { input.focus(); return; }
      this.callbacks.onNewGame({ ...profile });
    });
    setTimeout(() => input.focus(), 0);
  }

  showHUD(): void {
    this.mode = 'hud';
    this.modal = null;
    this.onModalClose = undefined;
    this.overlay.replaceChildren();
    this.overlay.classList.remove('active');
    this.lastHudKey = '';
    this.base.innerHTML = `<div class="hud">
      <header class="hud-header"><div class="hud-brand">${icon('leaf')}<div>Depois da Chuva<small>VALE DAS ÁGUAS</small></div></div><div class="day-clock"><span class="weather-icon">${icon('sun')}</span><div><strong id="hud-day">Dia 1</strong><span>Primavera <i>·</i> <b id="hud-time">08:00</b></span></div></div><div class="header-right"><div class="resources">${items.slice(0, 3).map(item => `<div class="resource" title="${item.label}">${icon(item.id)}<strong id="count-${item.id}">0</strong></div>`).join('')}</div><button class="icon-button inventory-button" title="Inventário (I)" aria-label="Abrir inventário">${icon('bag')}</button><button class="icon-button pause-button" title="Pausar (Esc)" aria-label="Pausar jogo">${icon('pause')}</button></div></header>
      <aside class="journal"><span class="eyebrow">AOS POUCOS, UM LAR</span><h3>Um novo começo</h3><p>Pequenos passos também<br>levam a grandes recomeços.</p><div class="quest" id="harvest-quest"><span class="quest-circle"></span>Colha seu primeiro nabo</div><div class="quest" id="lia-quest"><span class="quest-circle"></span>Converse com Lia <kbd>E</kbd></div><div class="journal-rule"></div><small>Seu tempo. Seu caminho.</small></aside>
      <div class="location-pill">${icon('pin')}<span id="hud-location">Minha propriedade</span></div>
      <aside class="controls-card"><div><kbd>W</kbd><span class="arrow-keys">A S D</span><span>mover</span></div><div><kbd>E</kbd><span>interagir</span></div><div><kbd>I</kbd><span>inventário</span></div><small>1–6 para trocar ferramenta</small></aside>
      <div class="bottom-center"><div class="interaction-prompt"><kbd>E</kbd><span id="hud-prompt">Explore o vale ao seu redor</span></div><div class="toolbelt">${tools.map((tool, index) => `<button class="tool${index === 0 ? ' selected' : ''}" data-tool="${tool.id}" title="${index + 1} · ${tool.detail}" aria-label="${tool.label}"><span class="tool-key">${index + 1}</span>${icon(tool.icon)}<span>${tool.label}</span></button>`).join('')}</div><span class="toolbelt-note">É nas pequenas coisas que a vida recomeça.</span></div>
    </div>`;
    this.base.querySelectorAll<HTMLButtonElement>('[data-tool]').forEach(button => button.addEventListener('click', () => {
      if (this.modal) return;
      this.callbacks.onTool(button.dataset.tool as Tool);
    }));
    this.base.querySelector('.inventory-button')!.addEventListener('click', () => {
      if (this.latest) this.toggleInventory(this.latest.inventory);
    });
    this.base.querySelector('.pause-button')!.addEventListener('click', () => this.togglePause());
    this.callbacks.onPause(false);
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
    for (const item of items.slice(0, 3)) set(`#count-${item.id}`, String(data.inventory[item.id]));
    set('#hud-location', data.location);
    set('#hud-prompt', data.prompt || 'Aproxime-se de algo para interagir');
    const night = minutes < 360 || minutes >= 1140;
    const weather = this.base.querySelector('.weather-icon')!;
    if (weather.getAttribute('data-night') !== String(night)) {
      weather.innerHTML = icon(night ? 'moon' : 'sun');
      weather.setAttribute('data-night', String(night));
    }
    this.base.querySelectorAll<HTMLButtonElement>('[data-tool]').forEach(button => {
      const selected = button.dataset.tool === data.tool;
      button.classList.toggle('selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    const quest = this.base.querySelector('#harvest-quest');
    quest?.classList.toggle('complete', data.harvests > 0);
    this.base.querySelector('#lia-quest')?.classList.toggle('complete', data.metLia);
  }

  toast(message: string): void {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = icon('leaf');
    const text = document.createElement('span');
    text.textContent = message;
    toast.append(text);
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
    drawCharacter(panel.querySelector('canvas')!, { name, skin: '#b87952', hairStyle: 'preso', hairColor: '#3b3029', outfit: '#b46e4e' });
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
    panel.className = 'inventory-card panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Inventário');
    panel.innerHTML = `<div class="modal-heading"><div><span class="eyebrow">O QUE A GENTE LEVA</span><h2>Minha mochila</h2></div><button class="icon-button" aria-label="Fechar inventário">${icon('close')}</button></div><div class="inventory-grid">${items.map(item => `<article class="inventory-item"><div class="item-icon">${icon(item.id)}<strong>${inventory[item.id]}</strong></div><h3>${item.label}</h3><p>${item.description}</p></article>`).join('')}</div><div class="inventory-footer">${icon('leaf')} O essencial cabe em pouca coisa.<span>SIMULAÇÃO PAUSADA</span></div>`;
    panel.querySelector('button')!.addEventListener('click', () => this.closeModal());
    this.overlay.append(panel);
  }

  togglePause(): void {
    if (this.mode !== 'hud') return;
    if (this.modal) { this.closeModal(); return; }
    this.openModal('pause');
    const panel = document.createElement('section');
    panel.className = 'pause-card panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Jogo pausado');
    panel.innerHTML = `<div class="pause-leaf">${icon('leaf')}</div><span class="eyebrow">O VALE PODE ESPERAR</span><h2>Uma pequena pausa.</h2><p>Respire. A sua história continua aqui.</p><div class="pause-actions"><button class="button button-primary" data-action="resume">Voltar ao vale ${icon('arrow')}</button><button class="button button-light" data-action="save">${icon('save')} Salvar meu progresso</button><button class="text-button" data-action="title">Voltar ao início</button></div><small>SIMULAÇÃO PAUSADA <i>·</i> ESC PARA VOLTAR</small>`;
    panel.querySelector('[data-action="resume"]')!.addEventListener('click', () => this.closeModal());
    panel.querySelector('[data-action="save"]')!.addEventListener('click', () => {
      this.toast(this.callbacks.onSave() ? 'Sua história foi salva neste navegador.' : 'Não foi possível salvar. Confira o armazenamento do navegador.');
    });
    panel.querySelector('[data-action="title"]')!.addEventListener('click', () => this.callbacks.onMainMenu());
    this.overlay.append(panel);
  }

  isModalOpen(): boolean { return this.mode !== 'hud' || this.modal !== null; }

  closeModal(): void {
    if (this.mode !== 'hud') return;
    const callback = this.onModalClose;
    this.onModalClose = undefined;
    this.modal = null;
    this.overlay.replaceChildren();
    this.overlay.classList.remove('active');
    this.callbacks.onPause(false);
    callback?.();
  }

  private openModal(type: 'pause' | 'inventory' | 'dialogue'): void {
    this.modal = type;
    this.overlay.replaceChildren();
    this.overlay.classList.add('active');
    this.callbacks.onPause(true);
  }
}
