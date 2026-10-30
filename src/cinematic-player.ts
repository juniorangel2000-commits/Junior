export interface CinematicPresentation {
  src: string;
  poster: string;
  label: string;
  description: string;
  loading: string;
  className?: string;
  attachAudio?: (video: HTMLVideoElement) => Promise<() => void>;
  onStarted?: () => void;
}

/** The scene's loader and menu image decoding must finish before any exit. */
export class CinematicPlayer {
  private readonly video = document.createElement("video");
  private readonly skip = document.createElement("button");
  private readonly play = document.createElement("button");
  private readonly status = document.createElement("span");
  private ready = false;
  private finished = false;
  private disposed = false;
  private suspended = false;
  private prepared = false;
  private playbackFailed = false;
  private cleanupAudio?: () => void;
  private playbackReady: boolean;
  private timer?: ReturnType<typeof setTimeout>;

  constructor(
    host: HTMLElement,
    private readonly presentation: CinematicPresentation,
    resources: Promise<unknown>,
    private readonly complete: () => void,
    back: () => void,
  ) {
    this.playbackReady = !presentation.attachAudio;
    const root = document.createElement("section");
    root.className = "cinematic-player " + (presentation.className ?? "");
    root.setAttribute("aria-label", presentation.label);
    this.video.src = presentation.src;
    this.video.poster = presentation.poster;
    this.video.preload = "auto";
    this.video.muted = true; // Sound is mixed by GameAudio, never a second native track.
    this.video.playsInline = true;
    this.video.setAttribute("aria-label", presentation.label);
    const controls = document.createElement("div");
    controls.className = "expedition-intro-controls";
    this.status.setAttribute("role", "status");
    this.status.textContent = presentation.loading;
    this.skip.textContent = "Pular";
    this.skip.dataset.skipIntro = "";
    this.skip.hidden = true;
    this.skip.disabled = true;
    this.skip.onclick = () => { if (this.ready) this.finish(); };
    this.play.textContent = "Reproduzir vídeo";
    this.play.dataset.playIntro = "";
    this.play.hidden = true;
    this.play.onclick = () => {
      if (this.playbackFailed) {
        this.playbackFailed = false; this.video.load();
        this.status.textContent = this.ready ? presentation.description : presentation.loading;
      }
      this.start();
    };
    controls.append(this.status, this.play, this.skip);
    root.append(this.video, controls);
    host.append(root);
    this.video.onended = () => this.finish();
    this.video.onerror = () => this.fail();
    this.video.onplaying = () => { this.play.hidden = true; this.prepare(); this.arm(); };
    this.video.ontimeupdate = () => this.arm();
    document.addEventListener("visibilitychange", this.visibility);
    window.addEventListener("blur", this.pause);
    window.addEventListener("focus", this.resume);
    void resources.then(() => {
      if (this.disposed) return;
      this.ready = true;
      this.status.textContent = this.playbackFailed ? "Não foi possível reproduzir o vídeo. Tente novamente ou pule." : presentation.description;
      this.skip.disabled = false;
      this.skip.hidden = false;
      if (this.finished) this.finish();
    }, () => {
      if (this.disposed) return;
      this.finished = true;
      this.video.pause();
      clearTimeout(this.timer);
      this.skip.hidden = true;
      this.play.hidden = false;
      this.play.textContent = "Voltar";
      this.play.onclick = back;
      this.status.textContent = "Não foi possível preparar a partida. Volte e tente novamente.";
    });
    if (presentation.attachAudio) {
      void presentation.attachAudio(this.video).then(cleanup => {
        if (this.disposed) { cleanup(); return; }
        this.cleanupAudio = cleanup;
        this.playbackReady = true;
        this.start();
      }).catch(() => { this.playbackReady = true; if (!this.disposed) this.start(); });
    } else this.start();
  }

  private prepare(): void {
    if (this.prepared || this.disposed) return;
    this.prepared = true;
    this.presentation.onStarted?.();
  }

  private start(): void {
    if (this.disposed || this.finished || this.suspended || !this.playbackReady || document.hidden) return;
    this.arm();
    void this.video.play().catch((error: DOMException) => {
      if (this.disposed || this.finished || error.name === "AbortError") return;
      if (error.name === "NotAllowedError") {
        clearTimeout(this.timer);
        this.play.hidden = false;
      } else this.fail();
    });
  }
  private arm(): void {
    clearTimeout(this.timer);
    this.timer = undefined;
    if (!this.disposed && !this.finished && !this.suspended && !this.playbackFailed && !document.hidden)
      this.timer = setTimeout(() => this.fail(), 15000);
  }
  private fail(): void {
    if (this.disposed || this.finished) return;
    this.prepare();
    this.video.pause();
    clearTimeout(this.timer); this.timer = undefined;
    this.playbackFailed = true;
    this.status.textContent = this.ready ? "Não foi possível reproduzir o vídeo. Tente novamente ou pule." : "Não foi possível reproduzir o vídeo. Tente novamente ou aguarde para pular.";
    this.play.textContent = "Tentar novamente";
    this.play.hidden = false;
  }
  private finish(): void {
    if (this.disposed) return;
    this.finished = true;
    clearTimeout(this.timer);
    this.video.pause();
    if (this.ready) {
      this.destroy();
      this.complete();
    }
  }
  private pause = (): void => { this.suspended = true; clearTimeout(this.timer); this.timer = undefined; this.video.pause(); };
  private resume = (): void => { this.suspended = false; if (!this.playbackFailed) this.start(); };
  private visibility = (): void => { if (document.hidden) this.pause(); else this.resume(); };
  destroy(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.cleanupAudio?.();
    this.cleanupAudio = undefined;
    clearTimeout(this.timer);
    document.removeEventListener("visibilitychange", this.visibility);
    window.removeEventListener("blur", this.pause);
    window.removeEventListener("focus", this.resume);
    this.video.onended = this.video.onerror = this.video.onplaying = this.video.ontimeupdate = null;
    this.video.pause();
    this.video.removeAttribute("src");
    this.video.load();
    this.video.parentElement?.remove();
  }
}

