import { CHARACTER_HEIGHT, CHARACTER_WIDTH, drawCharacter } from './art';
import type { CharacterDirection } from './art';
import type { CharacterProfile, HairStyle } from './types';

type ColorField = 'skin' | 'hairColor' | 'outfit' | 'shirtColor';
const PALETTES: Record<ColorField, readonly (readonly [string, string])[]> = {
  skin: [['#f5d6b4', 'Porcelana'], ['#e8ba90', 'Areia'], ['#d9a276', 'Mel'], ['#b47b54', 'Canela'], ['#8c593e', 'Castanha'], ['#56392e', 'Ébano']],
  hairColor: [['#302923', 'Preto'], ['#754323', 'Castanho'], ['#a85b33', 'Ruivo'], ['#d4ac68', 'Loiro'], ['#a8a596', 'Grisalho'], ['#653d50', 'Ameixa']],
  outfit: [['#638a9d', 'Azul do vale'], ['#6d8655', 'Verde musgo'], ['#c67851', 'Terracota'], ['#b99a52', 'Mostarda'], ['#967789', 'Amora'], ['#4c626c', 'Ardósia']],
  shirtColor: [['#f0e4c9', 'Linho'], ['#d4ba85', 'Palha'], ['#b4c6ab', 'Sálvia'], ['#d7b2a5', 'Rosa antigo'], ['#acc2cb', 'Névoa'], ['#817b72', 'Pedra']],
};
const DEFAULT_PROFILE: CharacterProfile = {
  name: '', skin: '#d9a276', hairStyle: 'preso', hairColor: '#754323', outfit: '#638a9d', shirtColor: '#f0e4c9', accessory: 'bolsa',
};
const PRESETS: readonly { id: string; label: string; detail: string; profile: CharacterProfile }[] = [
  { id: 'vale', label: 'Do vale', detail: 'O começo de tudo', profile: DEFAULT_PROFILE },
  { id: 'bosque', label: 'Do bosque', detail: 'Entre folhas e trilhas', profile: { ...DEFAULT_PROFILE, skin: '#8c593e', hairStyle: 'longo', hairColor: '#302923', outfit: '#6d8655', shirtColor: '#d4ba85' } },
  { id: 'oficina', label: 'Da oficina', detail: 'Mãos que constroem', profile: { ...DEFAULT_PROFILE, skin: '#e8ba90', hairStyle: 'curto', hairColor: '#a85b33', outfit: '#4c626c', shirtColor: '#b4c6ab', accessory: 'nenhum' } },
];
const DIRECTIONS: readonly [CharacterDirection, string][] = [['down', 'Frente'], ['left', 'Esquerda'], ['up', 'Costas'], ['right', 'Direita']];
const FIELD_LABELS: Record<ColorField, string> = { skin: 'Tom de pele', hairColor: 'Cor do cabelo', outfit: 'Macacão', shirtColor: 'Camisa' };

/** Owns the preview animation so leaving the editor always releases its frame callback. */
export function createCharacterEditor(
  holder: HTMLElement,
  options: { hasSave: boolean; icon(name: string): string; onBack(): void; onStart(profile: CharacterProfile): void },
): () => void {
  let profile = { ...DEFAULT_PROFILE };
  let direction: CharacterDirection = 'down';
  let walking = false;
  let active = true;
  let animationId = 0;
  let phase = 0;
  let previousPhase = -1;
  const { icon } = options;
  const card = document.createElement('section');
  card.className = 'creation-card panel character-studio';
  card.setAttribute('aria-label', 'Criação de personagem');
  card.innerHTML = `
    <header class="creation-heading"><div><span class="eyebrow">UM NOVO ROSTO PARA UM NOVO COMEÇO</span><h2>Quem chega ao vale?</h2><p>Escolha os detalhes de quem vai fazer esta história florescer.</p></div><button type="button" class="icon-button back-button" aria-label="Voltar ao início">${icon('close')}</button></header>
    <form id="character-form" class="creation-content">
      <aside class="character-preview">
        <span class="preview-label">FEITO DO SEU JEITO</span><span class="preview-season">${icon('leaf')} Primeiro dia de primavera</span>
        <div class="preview-stage"><div class="preview-sun"></div><div class="preview-character"><canvas aria-label="Prévia do personagem de frente"></canvas></div><div class="preview-ground"></div><span class="preview-stage-flower flower-a">✦</span><span class="preview-stage-flower flower-b">✦</span></div>
        <strong class="preview-name">Viajante</strong><span class="preview-subtitle">Uma vida inteira pela frente.</span>
        <div class="preview-directions" role="group" aria-label="Direção da prévia">${DIRECTIONS.map(([id, label]) => `<button type="button" class="choice${id === direction ? ' selected' : ''}" data-direction="${id}" aria-pressed="${id === direction}">${label}</button>`).join('')}</div>
        <button type="button" class="preview-walk-button" data-preview-walk aria-pressed="false">${icon('arrow')} <span>Ver caminhada</span></button>
        <p class="preview-hint">A mesma aparência acompanha você no mapa.</p>
      </aside>
      <div class="character-options">
        <section class="studio-section name-section"><label class="field-label" for="character-name">Como podemos te chamar?</label><div class="name-field"><input id="character-name" name="name" type="text" maxlength="24" placeholder="Seu nome" autocomplete="off" required aria-describedby="name-count" /><span id="name-count">0/24</span></div></section>
        <section class="studio-section"><div class="studio-section-heading"><h3>Um ponto de partida</h3><button type="button" class="reset-appearance" data-reset-appearance>Redefinir aparência</button></div><div class="character-presets" role="group" aria-label="Aparências prontas">${PRESETS.map(p => `<button type="button" class="character-preset${p.id === 'vale' ? ' selected' : ''}" data-preset="${p.id}" aria-pressed="${p.id === 'vale'}"><canvas aria-hidden="true"></canvas><span><strong>${p.label}</strong><small>${p.detail}</small></span></button>`).join('')}</div></section>
        <section class="studio-section studio-features"><div class="option-group"><span class="field-label">Tom de pele <small data-color-label="skin"></small></span><div class="swatches" data-option="skin" role="group" aria-label="Tom de pele"></div></div><div class="option-group"><span class="field-label">Cabelo</span><div class="hair-styles" role="group" aria-label="Estilo de cabelo"><button type="button" data-hair="curto" class="choice" aria-pressed="false">Curto</button><button type="button" data-hair="longo" class="choice" aria-pressed="false">Longo</button><button type="button" data-hair="preso" class="choice selected" aria-pressed="true">Coque</button></div></div><div class="option-group"><span class="field-label">Cor do cabelo <small data-color-label="hairColor"></small></span><div class="swatches" data-option="hairColor" role="group" aria-label="Cor do cabelo"></div></div></section>
        <section class="studio-section studio-wardrobe"><h3>Pronto para o caminho</h3><div class="wardrobe-colors"><div class="option-group"><span class="field-label">Macacão <small data-color-label="outfit"></small></span><div class="swatches" data-option="outfit" role="group" aria-label="Cor do macacão"></div></div><div class="option-group"><span class="field-label">Camisa <small data-color-label="shirtColor"></small></span><div class="swatches" data-option="shirtColor" role="group" aria-label="Cor da camisa"></div></div></div><div class="accessory-row"><span class="field-label">Acessório</span><div class="hair-styles" role="group" aria-label="Acessório"><button type="button" class="choice selected" data-accessory="bolsa" aria-pressed="true">${icon('bag')} Bolsa de viagem</button><button type="button" class="choice" data-accessory="nenhum" aria-pressed="false">Sem bolsa</button></div></div></section>
        <footer class="creation-submit">${options.hasSave ? '<p class="save-warning">Ao começar, sua história salva neste navegador será substituída.</p>' : '<p class="creation-tip">Tudo pronto? O vale está esperando por você.</p>'}<button class="button button-primary start-button" type="submit">Começar minha história ${icon('arrow')}</button></footer>
      </div>
    </form>`;
  holder.replaceChildren(card);
  const canvas = card.querySelector<HTMLCanvasElement>('.preview-character canvas')!;
  canvas.style.width = `${CHARACTER_WIDTH * 4}px`;
  canvas.style.height = `${CHARACTER_HEIGHT * 4}px`;
  const input = card.querySelector<HTMLInputElement>('#character-name')!;
  const draw = (): void => {
    drawCharacter(canvas, profile, direction, walking ? phase : 0);
    canvas.setAttribute('aria-label', `Prévia do personagem: ${DIRECTIONS.find(([id]) => id === direction)![1].toLocaleLowerCase('pt-BR')}${walking ? ', caminhando' : ''}`);
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
    setSelected(card.querySelectorAll<HTMLButtonElement>('[data-accessory]'), b => b.dataset.accessory === profile.accessory);
    setSelected(card.querySelectorAll<HTMLButtonElement>('[data-preset]'), b => {
      const preset = PRESETS.find(p => p.id === b.dataset.preset)!;
      return (['skin', 'hairStyle', 'hairColor', 'outfit', 'shirtColor', 'accessory'] as const).every(field => profile[field] === preset.profile[field]);
    });
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
  card.querySelectorAll<HTMLButtonElement>('[data-accessory]').forEach(button => button.addEventListener('click', () => { profile.accessory = button.dataset.accessory as 'bolsa' | 'nenhum'; sync(); }));
  card.querySelectorAll<HTMLButtonElement>('[data-preset]').forEach(button => {
    const preset = PRESETS.find(p => p.id === button.dataset.preset)!;
    const thumbnail = button.querySelector('canvas')!;
    drawCharacter(thumbnail, preset.profile);
    thumbnail.style.width = `${CHARACTER_WIDTH}px`;
    thumbnail.style.height = `${CHARACTER_HEIGHT}px`;
    button.addEventListener('click', () => { profile = { ...preset.profile, name: profile.name }; sync(); });
  });
  card.querySelector('[data-reset-appearance]')!.addEventListener('click', () => { profile = { ...DEFAULT_PROFILE, name: profile.name }; sync(); });
  card.querySelectorAll<HTMLButtonElement>('[data-direction]').forEach(button => button.addEventListener('click', () => {
    direction = button.dataset.direction as CharacterDirection;
    setSelected(card.querySelectorAll<HTMLButtonElement>('[data-direction]'), b => b === button);
    draw();
  }));
  const walkButton = card.querySelector<HTMLButtonElement>('[data-preview-walk]')!;
  walkButton.addEventListener('click', () => {
    walking = !walking;
    phase = 0;
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
    phase = Math.floor(now / 150) % 4;
    if (walking && !document.hidden && phase !== previousPhase) draw();
    previousPhase = phase;
    animationId = requestAnimationFrame(animate);
  };
  sync();
  queueMicrotask(() => { if (active && card.isConnected) input.focus(); });
  return cleanup;
}
