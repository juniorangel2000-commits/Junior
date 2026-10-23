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

/** The menu uses the live valley unless a local, playable video has been configured. */
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
    <footer class="title-footer"><span>EXPLORAR <i>·</i> CULTIVAR <i>·</i> RECONSTRUIR</span><div class="title-footer-right"><span class="title-save-note">TECLADO E MOUSE <i>·</i> SALVAMENTO LOCAL</span><button type="button" class="title-sound" data-title-sound aria-pressed="false">${toolbarIcon('audio')}<span class="sound-label">Ouvir a chuva</span></button><button type="button" class="title-motion" data-title-motion aria-pressed="true"><span class="motion-symbol" aria-hidden="true"></span><span class="motion-label">Pausar fundo</span></button></div></footer>`;
  holder.replaceChildren(screen);
  if (options.onMapEditor) {
    const edit = document.createElement('button');
    edit.className = 'button button-glass';
    edit.id = 'edit-map';
    edit.innerHTML = `${toolbarIcon('map')} Editar mapa`;
    edit.addEventListener('click', options.onMapEditor);
    screen.querySelector('.title-actions')!.append(edit);
  }
  // Every visit starts with rain; the pause button only affects this visit.
  let animate = true;
  const weather = createTitleWeather(screen);
  let active = true;
  let video: HTMLVideoElement | undefined;
  let videoReady = false;
  let videoFailed = false;
  const motionButton = screen.querySelector<HTMLButtonElement>('[data-title-motion]')!;
  const soundButton = screen.querySelector<HTMLButtonElement>('[data-title-sound]')!;
  soundButton.setAttribute('data-audio-toggle', '');
  const updateSoundButton = (): void => {
    const soundRequested = gameAudio.isUnlocked && !gameAudio.settings.muted;
    soundButton.setAttribute('aria-pressed', String(soundRequested));
    soundButton.querySelector('.sound-label')!.textContent = soundRequested ? 'Silenciar' : 'Ouvir a chuva';
  };
  updateSoundButton();
  window.addEventListener('after-rain-audio-change', updateSoundButton);
  soundButton.addEventListener('click', () => {
    const soundRequested = !gameAudio.isUnlocked || gameAudio.settings.muted;
    gameAudio.setSettings({ muted: !soundRequested });
    if (soundRequested) void gameAudio.unlock();
    updateSoundButton();
  });
  const updateButton = (): void => {
    motionButton.setAttribute('aria-pressed', String(animate));
    motionButton.querySelector('.motion-label')!.textContent = animate ? 'Pausar fundo' : 'Animar fundo';
  };
  const fallbackMode = (): TitleBackgroundMode => animate && !document.hidden ? 'animated' : 'static';
  const failVideo = (): void => {
    if (!active || videoFailed) return;
    videoFailed = true;
    videoReady = false;
    screen.classList.remove('has-video');
    if (video) { video.pause(); video.hidden = true; video.removeAttribute('src'); video.load(); }
    options.onBackgroundMode(fallbackMode());
  };
  const updateBackground = (): void => {
    if (!active) return;
    updateButton();
    const shouldPlay = animate && !document.hidden;
    weather.setAnimated(shouldPlay);
    if (video && !videoFailed) {
      video.autoplay = shouldPlay;
      if (!shouldPlay) video.pause();
      else {
        const play = video.play();
        if (play) void play.catch((error: unknown) => {
          if (error instanceof DOMException && error.name === 'AbortError') return;
          if (active && animate && !document.hidden) failVideo();
        });
      }
      options.onBackgroundMode(videoReady ? 'video' : fallbackMode());
    } else options.onBackgroundMode(fallbackMode());
  };
  const onVideoReady = (): void => {
    if (!active || videoFailed || !video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
    videoReady = true;
    video.hidden = false;
    screen.classList.add('has-video');
    updateBackground();
  };
  const onVisibilityChange = (): void => updateBackground();
  motionButton.addEventListener('click', () => { animate = !animate; updateBackground(); });
  document.addEventListener('visibilitychange', onVisibilityChange);
  screen.querySelector('#new-game')!.addEventListener('click', options.onNewGame);
  screen.querySelector('#continue-game')?.addEventListener('click', options.onContinue);
  const configuredVideo = TITLE_BACKGROUND.video;
  // Only bundled relative paths are accepted; null creates no media element or request.
  if (configuredVideo && /^(?:\.\/)?assets\/[a-zA-Z0-9_./-]+\.(?:mp4|webm)$/.test(configuredVideo.src)
    && !configuredVideo.src.split('/').includes('..')) {
    const candidate = document.createElement('video');
    if (candidate.canPlayType(configuredVideo.type)) {
      video = candidate;
      video.className = 'title-video';
      video.hidden = true;
      video.muted = true;
      video.defaultMuted = true;
      video.loop = true;
      video.playsInline = true;
      video.preload = 'auto';
      video.setAttribute('aria-hidden', 'true');
      video.setAttribute('tabindex', '-1');
      video.addEventListener('loadeddata', onVideoReady);
      video.addEventListener('error', failVideo);
      video.src = configuredVideo.src;
      screen.prepend(video);
    }
  }
  updateBackground();
  return (): void => {
    if (!active) return;
    active = false;
    weather.destroy();
    window.removeEventListener('after-rain-audio-change', updateSoundButton);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    if (video) {
      video.removeEventListener('loadeddata', onVideoReady);
      video.removeEventListener('error', failVideo);
      video.pause();
      video.removeAttribute('src');
      video.load();
      video.remove();
    }
    options.onBackgroundMode('off');
  };
}
