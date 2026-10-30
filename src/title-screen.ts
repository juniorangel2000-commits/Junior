import { TITLE_BACKGROUND } from './data/title-background';
import { createTitleWeather } from './title-weather';
import { gameAudio } from './audio';
import { toolbarIcon } from './toolbar-icons';

export type TitleBackgroundMode = 'animated' | 'static' | 'video' | 'off';
interface TitleScreenOptions {
  hasSave: boolean;
  icon(name: string): string;
  onNewGame(): void;
  onContinue(): void;
  onMapEditor?(): void;
  onBackgroundMode(mode: TitleBackgroundMode): void;
}

/** Approved property artwork, with live weather and the title score. */
export function createTitleScreen(holder: HTMLElement, options: TitleScreenOptions): () => void {
  const { icon } = options;
  const screen = document.createElement('section');
  screen.className = 'title-screen after-rain-title';
  screen.setAttribute('aria-label', 'Menu principal de After Rain');
  screen.innerHTML = `
    <div class="title-atmosphere" aria-hidden="true"></div>
    <header class="title-header"><div class="brand" aria-label="After Rain">${toolbarIcon('building')}<span>AFTER RAIN<small>UM REFÚGIO DEPOIS DA TEMPESTADE</small></span></div><span class="title-world-tag"><i></i> O VALE AINDA RESISTE <b>· TRÊS REGIÕES</b></span></header>
    <div class="title-copy"><div class="eyebrow"><span></span> DEPOIS DA CHUVA, NADA FICOU IGUAL.</div>
      <h1 aria-label="After Rain"><span>After</span><em>Rain<span class="title-period">.</span></em></h1>
      <p>A chuva transformou pessoas em zumbis.<br>Entre as ruínas, ainda há um recomeço.</p>
      <div class="title-actions">${options.hasSave ? `<button class="button button-primary" id="continue-game">${toolbarIcon('save')} Continuar minha história</button><button class="button button-glass" id="new-game">${toolbarIcon('inventory')} Novo jogo</button>` : `<button class="button button-primary" id="new-game">${toolbarIcon('inventory')} Novo jogo</button>`}</div>
      <div class="title-note">${icon('leaf')} Encontre abrigo. Cultive o que restou.</div>
    </div>
    <aside class="title-location"><span class="location-dot"></span><div>UM REFÚGIO ENTRE AS RUÍNAS<small>Enquanto a chuva cai, a vida resiste.</small></div></aside>
    <footer class="title-footer"><span>EXPLORAR <i>·</i> CULTIVAR <i>·</i> RECONSTRUIR</span><div class="title-footer-right"><span class="title-save-note">TECLADO E MOUSE <i>·</i> SALVAMENTO LOCAL</span><button type="button" class="title-sound" data-title-sound aria-pressed="false">${toolbarIcon('audio')}<span class="sound-label">Ouvir a chuva</span></button></div></footer>`;
  holder.replaceChildren(screen);
  if (options.onMapEditor) {
    const edit = document.createElement('button');
    edit.className = 'button button-glass';
    edit.id = 'edit-map';
    edit.innerHTML = `${toolbarIcon('map')} Editar mapa`;
    edit.addEventListener('click', options.onMapEditor);
    screen.querySelector('.title-actions')!.append(edit);
  }
  const art = document.createElement('img');
  art.className = 'title-illustration';
  art.alt = '';
  art.setAttribute('aria-hidden', 'true');
  art.decoding = 'async';
  const artViewport = document.createElement('div');
  artViewport.className = 'title-art-viewport';
  artViewport.setAttribute('aria-hidden', 'true');
  artViewport.append(art); screen.prepend(artViewport);
  let active = true;
  art.onload = () => { if (active) screen.classList.add('has-title-art'); };
  art.onerror = () => { if (active) { art.hidden = true; screen.classList.remove('has-title-art'); } };
  art.src = TITLE_BACKGROUND.image;
  // Keep the system preference as the default, with an explicit local override.
  const visual = document.createElement('details');
  visual.className = 'title-visual-settings';
  visual.innerHTML = `<summary>Efeitos visuais</summary><label>Animações e clarões<select aria-label="Animações e clarões"><option value="system">Seguir o sistema</option><option value="full">Ativos</option><option value="reduced">Reduzidos</option></select></label>`;
  screen.querySelector('.title-footer-right')!.prepend(visual);
  const motion = visual.querySelector('select')!;
  try { const saved = localStorage.getItem('after-rain-title-motion'); if (saved === 'full' || saved === 'reduced') motion.value = saved; } catch { /* Session choice still works. */ }
  const applyMotion = (): void => {
    screen.classList.toggle('title-full-motion', motion.value === 'full');
    screen.classList.toggle('title-reduced-motion', motion.value === 'reduced');
  };
  motion.addEventListener('change', () => {
    applyMotion();
    try { localStorage.setItem('after-rain-title-motion', motion.value); } catch { /* No persistent storage. */ }
  });
  applyMotion();
  const weather = createTitleWeather(screen);
  const soundButton = screen.querySelector<HTMLButtonElement>('[data-title-sound]')!;
  soundButton.setAttribute('data-audio-toggle', '');
  soundButton.title = 'Música, chuva e trovões';
  const updateSoundButton = (): void => {
    const soundRequested = gameAudio.isUnlocked && !gameAudio.settings.muted;
    soundButton.setAttribute('aria-pressed', String(soundRequested));
    soundButton.querySelector('.sound-label')!.textContent = soundRequested ? 'Silenciar' : 'Ativar som';
  };
  updateSoundButton();
  window.addEventListener('after-rain-audio-change', updateSoundButton);
  soundButton.addEventListener('click', () => {
    const soundRequested = !gameAudio.isUnlocked || gameAudio.settings.muted;
    gameAudio.setSettings({ muted: !soundRequested });
    if (soundRequested) void gameAudio.unlock();
    updateSoundButton();
  });
  const updateBackground = (): void => {
    if (!active) return;
    const visible = !document.hidden;
    weather.setAnimated(visible);
    screen.classList.toggle('background-suspended', !visible);
    options.onBackgroundMode(visible ? 'animated' : 'static');
  };
  document.addEventListener('visibilitychange', updateBackground);
  screen.querySelector('#new-game')!.addEventListener('click', options.onNewGame);
  screen.querySelector('#continue-game')?.addEventListener('click', options.onContinue);
  updateBackground();
  return (): void => {
    if (!active) return;
    active = false;
    art.onload = art.onerror = null;
    weather.destroy();
    window.removeEventListener('after-rain-audio-change', updateSoundButton);
    document.removeEventListener('visibilitychange', updateBackground);
    options.onBackgroundMode('off');
  };
}
