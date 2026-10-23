import { CHARACTER_HEIGHT, CHARACTER_WIDTH, drawCharacter } from './art';
import { CHARACTER_DIRECTIONS, CHARACTER_WALK_FPS, CHARACTER_WALK_FRAMES, type CharacterDirection } from './character-directions';
import type { CharacterProfile, HairStyle } from './types';

type ColorField = 'skin' | 'outfit';
const PALETTES: Record<ColorField, readonly (readonly [string, string])[]> = {
  skin: [['#f5d6b4', 'Clara'], ['#d9a276', 'Dourada'], ['#9d6646', 'Castanha'], ['#56392e', 'Escura']],
  outfit: [['#638a9d', 'Azul do vale'], ['#6d8655', 'Verde musgo'], ['#c67851', 'Terracota'], ['#b99a52', 'Mostarda']],
};
const DEFAULT_PROFILE: CharacterProfile = {
  name: '', skin: '#d9a276', hairStyle: 'preso', hairColor: '#754323', outfit: '#638a9d', shirtColor: '#f0e4c9', accessory: 'nenhum',
};
const DIRECTIONS: Record<CharacterDirection, { label: string; arrow: number; row: number; column: number }> = {
  up: { label: 'Costas', arrow: -90, row: 1, column: 2 },
  'up-right': { label: 'Costas à direita', arrow: -45, row: 1, column: 3 },
  right: { label: 'Direita', arrow: 0, row: 2, column: 3 },
  'down-right': { label: 'Frente à direita', arrow: 45, row: 3, column: 3 },
  down: { label: 'Frente', arrow: 90, row: 3, column: 2 },
  'down-left': { label: 'Frente à esquerda', arrow: 135, row: 3, column: 1 },
  left: { label: 'Esquerda', arrow: 180, row: 2, column: 1 },
  'up-left': { label: 'Costas à esquerda', arrow: -135, row: 1, column: 1 },
};
const FIELD_LABELS: Record<ColorField, string> = { skin: 'Tom de pele', outfit: 'Cor da roupa' };

/** Preview and world use the same eight directions and the same character renderer. */
export function createCharacterEditor(
  holder: HTMLElement,
  options: { hasSave: boolean; icon(name: string): string; onBack(): void; onStart(profile: CharacterProfile): void },
): () => void {
  const profile = { ...DEFAULT_PROFILE };
  let direction: CharacterDirection = 'down';
  let walking = false;
  let active = true;
  let animationId = 0;
  let phase = 0;
  let previousPhase = -1;
  let walkingStartedAt = 0;
  const { icon } = options;
  const card = document.createElement('section');
  card.className = 'creation-card panel character-studio simple-character-studio';
  card.setAttribute('aria-label', 'Criação de personagem');
  card.innerHTML = `
    <header class="creation-heading"><div><span class="eyebrow">UM NOVO COMEÇO</span><h2>Quem chega ao vale?</h2><p>Escolha seu nome, pele, cabelo e roupa.</p></div><button type="button" class="icon-button back-button" aria-label="Voltar ao início">${icon('close')}</button></header>
    <form id="character-form" class="creation-content">
      <aside class="character-preview">
        <span class="preview-label">PRONTO PARA EXPLORAR</span>
        <div class="preview-stage"><div class="preview-sun"></div><div class="preview-character"><canvas aria-label="Prévia da personagem: frente"></canvas></div><div class="preview-ground"></div></div>
        <strong class="preview-name">Viajante</strong>
        <div class="preview-directions" role="group" aria-label="Direção da prévia">${[...CHARACTER_DIRECTIONS].sort((a, b) => DIRECTIONS[a].row - DIRECTIONS[b].row || DIRECTIONS[a].column - DIRECTIONS[b].column).map(id => {
          const view = DIRECTIONS[id];
          return `<button type="button" class="choice${id === direction ? ' selected' : ''}" data-direction="${id}" style="grid-row:${view.row};grid-column:${view.column}" aria-label="${view.label}" title="${view.label}" aria-pressed="${id === direction}"><span class="direction-arrow" aria-hidden="true" style="transform:rotate(${view.arrow}deg)">${icon('arrow')}</span></button>`;
        }).join('')}<span class="preview-compass-center" aria-hidden="true">8</span></div>
        <span class="preview-direction-name" aria-live="polite">Frente</span>
        <button type="button" class="preview-walk-button" data-preview-walk aria-pressed="false">${icon('arrow')} <span>Ver caminhada</span></button>
      </aside>
      <div class="character-options">
        <section class="studio-section name-section"><label class="field-label" for="character-name">Seu nome</label><div class="name-field"><input id="character-name" name="name" type="text" maxlength="24" placeholder="Como podemos te chamar?" autocomplete="off" required aria-describedby="name-count" /><span id="name-count">0/24</span></div></section>
        <section class="studio-section"><span class="field-label">Tom de pele <small data-color-label="skin"></small></span><div class="swatches" data-option="skin" role="group" aria-label="Tom de pele"></div></section>
        <section class="studio-section"><span class="field-label">Cabelo</span><div class="hair-styles" role="group" aria-label="Estilo de cabelo"><button type="button" data-hair="curto" class="choice" aria-pressed="false">Curto</button><button type="button" data-hair="preso" class="choice selected" aria-pressed="true">Preso</button></div></section>
        <section class="studio-section"><span class="field-label">Cor da roupa <small data-color-label="outfit"></small></span><div class="swatches" data-option="outfit" role="group" aria-label="Cor da roupa"></div></section>
        <p class="simple-movement-tip">${icon('arrow')} Caminhe com WASD ou as setas. Combine duas teclas para seguir na diagonal.</p>
        <footer class="creation-submit">${options.hasSave ? '<p class="save-warning">Ao começar, sua história salva neste navegador será substituída.</p>' : '<p class="creation-tip">O vale está esperando por você.</p>'}<button class="button button-primary start-button" type="submit">Começar minha história ${icon('arrow')}</button></footer>
      </div>
    </form>`;
  holder.replaceChildren(card);
  const canvas = card.querySelector<HTMLCanvasElement>('.preview-character canvas')!;
  canvas.style.width = `${CHARACTER_WIDTH * 2.5}px`;
  canvas.style.height = `${CHARACTER_HEIGHT * 2.5}px`;
  const input = card.querySelector<HTMLInputElement>('#character-name')!;
  const draw = (): void => {
    drawCharacter(canvas, profile, direction, walking ? phase : 0);
    canvas.setAttribute('aria-label', `Prévia da personagem: ${DIRECTIONS[direction].label.toLocaleLowerCase('pt-BR')}${walking ? ', caminhando' : ''}`);
  };
  const setSelected = (elements: NodeListOf<HTMLButtonElement>, selected: (button: HTMLButtonElement) => boolean): void => {
    elements.forEach(button => {
      const isSelected = selected(button);
      button.classList.toggle('selected', isSelected);
      button.setAttribute('aria-pressed', String(isSelected));
    });
  };
  const sync = (): void => {
    for (const field of Object.keys(PALETTES) as ColorField[]) {
      setSelected(card.querySelectorAll<HTMLButtonElement>(`[data-option="${field}"] button`), b => b.dataset.color === profile[field]);
      card.querySelector(`[data-color-label="${field}"]`)!.textContent = PALETTES[field].find(([color]) => color === profile[field])?.[1] ?? '';
    }
    setSelected(card.querySelectorAll<HTMLButtonElement>('[data-hair]'), b => b.dataset.hair === profile.hairStyle);
    draw();
  };
  for (const field of Object.keys(PALETTES) as ColorField[]) {
    const colors = card.querySelector(`[data-option="${field}"]`)!;
    for (const [color, label] of PALETTES[field]) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'swatch';
      button.dataset.color = color;
      button.style.setProperty('--swatch', color);
      button.title = label;
      button.setAttribute('aria-label', `${FIELD_LABELS[field]}: ${label}`);
      button.innerHTML = icon('check');
      button.addEventListener('click', () => { profile[field] = color; sync(); });
      colors.append(button);
    }
  }
  card.querySelectorAll<HTMLButtonElement>('[data-hair]').forEach(button => button.addEventListener('click', () => { profile.hairStyle = button.dataset.hair as HairStyle; sync(); }));
  card.querySelectorAll<HTMLButtonElement>('[data-direction]').forEach(button => button.addEventListener('click', () => {
    direction = button.dataset.direction as CharacterDirection;
    setSelected(card.querySelectorAll<HTMLButtonElement>('[data-direction]'), b => b === button);
    card.querySelector('.preview-direction-name')!.textContent = DIRECTIONS[direction].label;
    draw();
  }));
  const walkButton = card.querySelector<HTMLButtonElement>('[data-preview-walk]')!;
  walkButton.addEventListener('click', () => {
    walking = !walking;
    phase = walking ? 1 : 0;
    walkingStartedAt = performance.now();
    previousPhase = -1;
    walkButton.setAttribute('aria-pressed', String(walking));
    walkButton.querySelector('span')!.textContent = walking ? 'Parar caminhada' : 'Ver caminhada';
    cancelAnimationFrame(animationId);
    if (walking) animationId = requestAnimationFrame(animate);
    draw();
  });
  input.addEventListener('input', () => {
    profile.name = input.value.trim();
    input.setCustomValidity('');
    card.querySelector('.preview-name')!.textContent = profile.name || 'Viajante';
    card.querySelector('#name-count')!.textContent = `${input.value.length}/24`;
  });
  const cleanup = (): void => { active = false; cancelAnimationFrame(animationId); };
  card.querySelector('.back-button')!.addEventListener('click', () => { cleanup(); options.onBack(); });
  card.querySelector('form')!.addEventListener('submit', event => {
    event.preventDefault();
    if (!profile.name) { input.setCustomValidity('Escreva um nome para começar sua história.'); input.reportValidity(); input.focus(); return; }
    cleanup();
    options.onStart({ ...profile });
  });
  const animate = (now: number): void => {
    if (!active || !walking || !card.isConnected) return;
    phase = 1 + Math.floor((now - walkingStartedAt) * CHARACTER_WALK_FPS / 1000) % CHARACTER_WALK_FRAMES;
    if (!document.hidden && phase !== previousPhase) draw();
    previousPhase = phase;
    animationId = requestAnimationFrame(animate);
  };
  sync();
  queueMicrotask(() => { if (active && card.isConnected) input.focus(); });
  return cleanup;
}
