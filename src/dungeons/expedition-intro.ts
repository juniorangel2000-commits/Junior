import { resolveCharacter } from "../data/characters";
import type { CharacterProfile } from "../types";

export function expeditionVideo(profile: Pick<CharacterProfile, "characterId">): string {
  return `assets/video/expedition/road-${resolveCharacter(profile).id === "farmer-male" ? "male" : "female"}`;
}

/** The scene's loader and menu image decoding must finish before any exit. */
export class ExpeditionIntro {
  private readonly video = document.createElement("video");
  private readonly skip = document.createElement("button");
  private readonly play = document.createElement("button");
  private readonly status = document.createElement("span");
  private ready = false;
  private finished = false;
  private disposed = false;
  private suspended = false;
  private timer?: ReturnType<typeof setTimeout>;

  constructor(
    host: HTMLElement,
    profile: Pick<CharacterProfile, "characterId">,
    resources: Promise<unknown>,
    private readonly complete: () => void,
    back: () => void,
  ) {
    const root = document.createElement("section"), base = expeditionVideo(profile);
    root.className = "dungeon-travel expedition-intro";
    root.setAttribute("aria-label", "Viagem até a cidade");
    this.video.src = `${base}.mp4`;
    this.video.poster = `${base}.jpg`;
    this.video.preload = "auto";
    this.video.muted = true; // Sound is mixed by GameAudio, never a second native track.
    this.video.playsInline = true;
    this.video.setAttribute("aria-label", "Caminhando pela estrada em direção à cidade");
    const controls = document.createElement("div");
    controls.className = "expedition-intro-controls";
    this.status.setAttribute("role", "status");
    this.status.textContent = "Preparando a cidade…";
    this.skip.textContent = "Pular";
    this.skip.dataset.skipIntro = "";
    this.skip.hidden = true;
    this.skip.disabled = true;
    this.skip.onclick = () => { if (this.ready) this.finish(); };
    this.play.textContent = "Reproduzir vídeo";
    this.play.dataset.playIntro = "";
    this.play.hidden = true;
    this.play.onclick = () => this.start();
    controls.append(this.status, this.play, this.skip);
    root.append(this.video, controls);
    host.append(root);
    this.video.onended = () => this.finish();
    this.video.onerror = () => this.fail();
    this.video.onplaying = () => { this.play.hidden = true; this.arm(); };
    this.video.ontimeupdate = () => this.arm();
    document.addEventListener("visibilitychange", this.visibility);
    window.addEventListener("blur", this.pause);
    window.addEventListener("focus", this.resume);
    void resources.then(() => {
      if (this.disposed) return;
      this.ready = true;
      this.status.textContent = "A estrada para a cidade";
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
      this.status.textContent = "Não foi possível preparar a cidade. Volte e tente novamente.";
    });
    this.start();
  }

  private start(): void {
    if (this.disposed || this.finished || this.suspended || document.hidden) return;
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
    if (!this.disposed && !this.finished && !this.suspended && !document.hidden)
      this.timer = setTimeout(() => this.fail(), 15000);
  }
  private fail(): void {
    if (this.disposed || this.finished) return;
    this.video.pause();
    this.status.textContent = "Preparando o menu de expedições…";
    this.finish();
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
  private resume = (): void => { this.suspended = false; this.start(); };
  private visibility = (): void => { if (document.hidden) this.pause(); else this.resume(); };
  destroy(): void {
    if (this.disposed) return;
    this.disposed = true;
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

export async function decodeExpeditionPreviews(previews: Record<string, string>): Promise<void> {
  await Promise.all(Object.values(previews).map(src => {
    const image = new Image();
    image.src = src;
    return image.decode();
  }));
  await document.fonts.ready;
}
