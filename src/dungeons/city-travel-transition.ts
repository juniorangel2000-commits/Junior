import { gameAudio } from '../audio';
import type { CharacterProfile } from '../types';
import { ExpeditionIntro } from './expedition-intro';
import '../cinematic-player.css';

/** Starts before Phaser preload; the same player stays alive until the menu is ready. */
export class CityTravelTransition {
  private readonly host = document.createElement('div');
  private readonly intro: ExpeditionIntro;
  private resolve!: () => void;
  private reject!: (reason: unknown) => void;
  private complete?: () => void;
  private disposed = false;
  constructor(profile: CharacterProfile, load: () => void, back: () => void) {
    this.host.className = 'new-game-opening city-travel-loading';
    document.body.append(this.host);
    const resources = new Promise<void>((resolve, reject) => { this.resolve = resolve; this.reject = reject; });
    gameAudio.setScene('expedition'); gameAudio.setRainAtmosphere(true);
    this.intro = new ExpeditionIntro(this.host, profile, resources, () => {
      const complete = this.complete; this.destroy(); complete?.();
    }, back, load);
  }
  ready(resources: Promise<unknown>, complete: () => void): void {
    this.complete = complete;
    void resources.then(() => { if (!this.disposed) this.resolve(); }, error => this.fail(error));
  }
  fail(error: unknown): void { if (!this.disposed) this.reject(error); }
  destroy(): void {
    if (this.disposed) return;
    this.disposed = true; this.intro.destroy(); this.host.remove();
  }
}
