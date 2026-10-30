/** Original procedural score and foley: no external recordings or network requests. */
export interface AudioSettings { music: number; effects: number; muted: boolean }
export const AUDIO_KEY = 'after-rain-audio-v1';
export function audioSettings(value: unknown): AudioSettings {
  const v = value && typeof value === 'object' ? value as Partial<AudioSettings> : {};
  const volume = (n: unknown, fallback: number): number => typeof n === 'number' && Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : fallback;
  return { music: volume(v.music, .45), effects: volume(v.effects, .65), muted: v.muted === true };
}
export type Sound = 'step' | 'ui' | 'pickup' | 'wood' | 'stone' | 'plant' | 'water' | 'craft' | 'door' | 'build' | 'thunder' | 'combat-hit' | 'sword-swing' | 'bow-shot' | 'boomerang-throw' | 'weapon-evolution' | 'spear-thrust' | 'hammer-impact' | 'shield-burst' | 'dungeon-start';
type AudioScene = 'title' | 'game' | 'expedition' | 'combat' | 'cinematic';
const BEAT = 60 / 76;
export const MUSIC_DURATION = 64 * BEAT;
const hz = (midi: number): number => 440 * 2 ** ((midi - 69) / 12);

function tone(ctx: BaseAudioContext, out: AudioNode, frequency: number, time: number, duration: number, volume: number, pad = false): void {
  const envelope = ctx.createGain();
  envelope.gain.setValueAtTime(0, time);
  envelope.gain.linearRampToValueAtTime(volume, time + (pad ? .35 : .012));
  envelope.gain.exponentialRampToValueAtTime(.0001, time + duration);
  envelope.connect(out);
  // A rounded plucked instrument with quiet upper partials.
  for (const [multiple, weight] of [[1, 1], [2, .22], [3, .07]]) {
    const oscillator = ctx.createOscillator(), gain = ctx.createGain();
    oscillator.frequency.value = frequency * multiple;
    gain.gain.value = weight;
    oscillator.connect(gain).connect(envelope);
    oscillator.start(time); oscillator.stop(time + duration + .01);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
  }
  // Disconnect the shared envelope after all partials finish, without JS timers.
  const cleanup = ctx.createConstantSource();
  cleanup.offset.value = 0; cleanup.connect(envelope); cleanup.start(time); cleanup.stop(time + duration + .02);
  cleanup.onended = () => { cleanup.disconnect(); envelope.disconnect(); };
}

export async function renderMusic(): Promise<AudioBuffer> {
  const rate = 22050, length = Math.round(MUSIC_DURATION * rate);
  const ctx = new OfflineAudioContext(1, length + rate * 4, rate);
  const dry = ctx.createGain(); dry.gain.value = .8; dry.connect(ctx.destination);
  const echo = ctx.createDelay(2), echoGain = ctx.createGain();
  echo.delayTime.value = BEAT * .75; echoGain.gain.value = .19;
  dry.connect(echo).connect(echoGain).connect(ctx.destination);
  const chords = [[48,52,55,59],[43,50,55,57],[45,52,55,60],[41,48,53,57],
    [48,52,55,59],[43,50,55,62],[41,48,53,57],[43,50,55,59]];
  const melody = [[72,76,79,76],[74,71,67,0],[72,76,79,81],[77,76,72,0],
    [76,79,84,79],[74,79,83,0],[81,77,76,72],[74,71,67,0]];
  for (let bar = 0; bar < 16; bar++) {
    const chord = chords[bar % 8], start = bar * 4 * BEAT;
    chord.forEach(note => tone(ctx, dry, hz(note), start, BEAT * 4.5, .022, true));
    tone(ctx, dry, hz(chord[0] - 12), start, BEAT * 2.8, .085);
    for (let step = 0; step < 8; step++) {
      tone(ctx, dry, hz(chord[[0,2,1,3,2,1,3,2][step]] + 12), start + step * BEAT / 2, 1.15, step % 2 ? .035 : .048);
    }
    melody[bar % 8].forEach((note, beat) => {
      if (note) tone(ctx, dry, hz(note + (bar >= 8 && beat === 2 ? -12 : 0)), start + (beat + .08) * BEAT, BEAT * 1.7, .09);
    });
  }
  const rendered = await ctx.startRendering();
  // Fold the release/echo into the start for a continuous loop without a hard seam.
  const loop = new AudioBuffer({ numberOfChannels: 1, length, sampleRate: rate });
  const target = loop.getChannelData(0), source = rendered.getChannelData(0);
  target.set(source.subarray(0, length));
  for (let i = length; i < source.length; i++) target[i - length] += source[i];
  return loop;
}

/** Slow, original felt-piano chords and sparse droplets for the rainy opening. */
export async function renderTitleMusic(): Promise<AudioBuffer> {
  const rate = 22050, length = rate * 64;
  const ctx = new OfflineAudioContext(1, length + rate * 6, rate);
  const dry = ctx.createGain(); dry.gain.value = .75; dry.connect(ctx.destination);
  const echo = ctx.createDelay(2), wet = ctx.createGain();
  echo.delayTime.value = .75; wet.gain.value = .24;
  dry.connect(echo).connect(wet).connect(ctx.destination);
  const chords = [[50,57,60,64],[46,53,57,60],[53,57,60,64],[48,55,60,62]];
  const melody = [[77,76,72],[74,72,69],[72,76,77],[74,72,67]];
  for (let bar = 0; bar < 8; bar++) {
    const start = bar * 8, chord = chords[bar % 4];
    chord.forEach(note => tone(ctx, dry, hz(note), start, 9.5, .035, true));
    tone(ctx, dry, hz(chord[0] - 12), start, 5.5, .055, true);
    for (let beat = 0; beat < 4; beat++) {
      tone(ctx, dry, hz(chord[[0,2,1,3][beat]] + 12), start + beat * 2 + .3, 3.5, .042);
    }
    melody[bar % 4].forEach((note, beat) => tone(ctx, dry, hz(note), start + beat * 2.5 + .8, 3.5, .055));
  }
  const rendered = await ctx.startRendering();
  const loop = new AudioBuffer({ numberOfChannels: 1, length, sampleRate: rate });
  const target = loop.getChannelData(0), source = rendered.getChannelData(0);
  target.set(source.subarray(0, length));
  for (let i = length; i < source.length; i++) target[i - length] += source[i];
  return loop;
}

/** Quiet original minor-key motif shared by the road video and expedition menu. */
export async function renderExpeditionMusic(): Promise<AudioBuffer> {
  const rate = 22050, length = rate * 48;
  const ctx = new OfflineAudioContext(1, length + rate * 6, rate);
  const dry = ctx.createGain(); dry.gain.value = .7; dry.connect(ctx.destination);
  const delay = ctx.createDelay(2), wet = ctx.createGain();
  delay.delayTime.value = .8; wet.gain.value = .2;
  dry.connect(delay).connect(wet).connect(ctx.destination);
  const chords = [[45,52,57,60],[41,48,53,57],[48,55,60,64],[43,50,55,59]];
  for (let bar = 0; bar < 8; bar++) {
    const start = bar * 6, chord = chords[bar % 4];
    chord.forEach(note => tone(ctx, dry, hz(note), start, 7, .028, true));
    tone(ctx, dry, hz(chord[0] - 12), start, 5, .035, true);
    for (let beat = 0; beat < 3; beat++)
      tone(ctx, dry, hz(chord[[2,1,3][beat]] + 12), start + beat * 2 + .2, 2.8, .045);
  }
  const rendered = await ctx.startRendering();
  const loop = new AudioBuffer({ numberOfChannels: 1, length, sampleRate: rate });
  const target = loop.getChannelData(0), source = rendered.getChannelData(0);
  target.set(source.subarray(0, length));
  for (let i = length; i < source.length; i++) target[i - length] += source[i];
  return loop;
}

/** A soft stereo rain bed, separate from music so the effects slider controls it. */
export function renderRain(ctx: BaseAudioContext): AudioBuffer {
  const length = Math.round(ctx.sampleRate * 12), buffer = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let channel = 0; channel < 2; channel++) {
    const samples = buffer.getChannelData(channel);
    let smoothed = 0;
    for (let i = 0; i < length; i++) {
      smoothed += .25 * (Math.random() * 2 - 1 - smoothed);
      const drift = .8 + .2 * Math.sin(2 * Math.PI * i / length + channel);
      const edge = Math.min(1, i / (ctx.sampleRate * .04), (length - 1 - i) / (ctx.sampleRate * .04));
      samples[i] = smoothed * .16 * drift * edge;
    }
  }
  return buffer;
}

class GameAudio {
  settings = audioSettings(null);
  private context?: AudioContext;
  private master?: GainNode;
  private musicGain?: GainNode;
  private effectsGain?: GainNode;
  private music?: AudioBufferSourceNode;
  private musicEnvelope?: GainNode;
  private fadingMusic?: AudioBufferSourceNode;
  private musicMode?: AudioScene;
  private scene: AudioScene = 'title';
  private rain?: AudioBufferSourceNode;
  private rainEnvelope?: GainNode;
  private fadingRain?: AudioBufferSourceNode;
  private rainBuffer?: AudioBuffer;
  private rainAtmosphere=false;
  private buffers = new Map<AudioScene, AudioBuffer>();
  private rendering?: Promise<void>;
  private installed = false;
  private focused = true;
  private lastSound = new Map<Sound, number>();
  private cinematicBuffers = new Map<string, Promise<AudioBuffer | undefined>>();

  get isUnlocked(): boolean { return !!this.context; }

  init(): void {
    if (this.installed) return;
    this.installed = true;
    try { this.settings = audioSettings(JSON.parse(localStorage.getItem(AUDIO_KEY) || 'null')); } catch { /* Defaults if storage is unavailable. */ }
    const unlock = (event: Event): void => {
      // Explicit sound toggles unlock in their click handler, preserving the
      // user's initial action before pointerdown/keydown changes the state.
      if (event.target instanceof Element && event.target.closest('[data-audio-toggle]')) return;
      void this.unlock();
    };
    window.addEventListener('pointerdown', unlock, { capture: true });
    window.addEventListener('keydown', unlock, { capture: true });
    document.addEventListener('visibilitychange', () => this.syncVisibility());
    window.addEventListener('blur', () => { this.focused = false; this.syncVisibility(); });
    window.addEventListener('focus', () => { this.focused = true; this.syncVisibility(); });
    document.addEventListener('click', event => {
      if ((event.target as Element).closest?.('button:not(:disabled)')) this.play('ui');
    });
  }

  async unlock(): Promise<void> {
    if (document.hidden || !this.focused) return;
    try {
      if (!this.context) {
        this.context = new AudioContext();
        this.master = this.context.createGain();
        this.musicGain = this.context.createGain(); this.effectsGain = this.context.createGain();
        this.musicGain.connect(this.master); this.effectsGain.connect(this.master); this.master.connect(this.context.destination);
        this.applySettings();
      }
      if (this.context.state === 'suspended') await this.context.resume();
      this.syncMusic(); this.syncRain();
      window.dispatchEvent(new Event('after-rain-audio-change'));
    } catch { /* Audio support must never prevent play or saving. */ }
  }

  setScene(scene: AudioScene): void {
    if (this.scene === scene) return;
    this.scene = scene;
    this.applySettings();
    this.syncMusic(); this.syncRain();
  }

  private syncMusic(): void {
    if (!this.context || this.musicMode === this.scene || this.rendering) return;
    const mode = this.scene, cached = this.buffers.get(mode);
    if (mode === 'combat' || mode === 'cinematic') {
      const now = this.context.currentTime;
      this.fadingMusic?.stop();
      if (this.music) {
        this.musicEnvelope!.gain.cancelAndHoldAtTime(now);
        this.musicEnvelope!.gain.linearRampToValueAtTime(0, now + .65);
        this.music.stop(now + .7); this.fadingMusic = this.music;
        this.music = undefined; this.musicEnvelope = undefined;
      }
      this.musicMode = mode;
      return;
    }
    this.rendering = (cached ? Promise.resolve(cached) : mode === 'title' ? renderTitleMusic() : mode === 'expedition' ? renderExpeditionMusic() : renderMusic()).then(buffer => {
      this.buffers.set(mode, buffer);
      if (this.scene !== mode) return;
      const ctx = this.context!, now = ctx.currentTime;
      // At most one outgoing loop; rapid menu transitions cannot accumulate sources.
      this.fadingMusic?.stop();
      if (this.music) {
        this.musicEnvelope!.gain.cancelAndHoldAtTime(now);
        this.musicEnvelope!.gain.linearRampToValueAtTime(0, now + .65);
        this.music.stop(now + .7); this.fadingMusic = this.music;
      }
      const source = ctx.createBufferSource(), envelope = ctx.createGain();
      source.buffer = buffer; source.loop = true;
      envelope.gain.setValueAtTime(0, now); envelope.gain.linearRampToValueAtTime(1, now + .65);
      source.connect(envelope).connect(this.musicGain!);
      source.onended = () => { source.disconnect(); envelope.disconnect(); if (this.fadingMusic === source) this.fadingMusic = undefined; };
      source.start(); this.music = source; this.musicEnvelope = envelope; this.musicMode = mode;
    }).catch(() => { /* Effects and rain remain available if music rendering fails. */ }).finally(() => {
      this.rendering = undefined;
      // A different scene may have been requested while offline rendering was running.
      if (this.scene !== mode) this.syncMusic();
    });
  }

  setRainAtmosphere(enabled:boolean):void{this.rainAtmosphere=enabled;this.syncRain();}

  /** Separate stems keep music/effects preferences intact and follow the video clock. */
  async attachCinematic(video: HTMLVideoElement, musicURL: string, effectsURL: string): Promise<() => void> {
    await this.unlock();
    const ctx = this.context;
    if (!ctx) return () => {};
    const load = (url: string): Promise<AudioBuffer | undefined> => {
      let pending = this.cinematicBuffers.get(url);
      if (!pending) {
        pending = fetch(url, { signal: AbortSignal.timeout(10000) })
          .then(response => { if (!response.ok) throw Error('Missing cinematic audio'); return response.arrayBuffer(); })
          .then(bytes => ctx.decodeAudioData(bytes)).catch(() => { this.cinematicBuffers.delete(url); return undefined; });
        this.cinematicBuffers.set(url, pending);
      }
      return pending;
    };
    const buffers = await Promise.all([load(musicURL), load(effectsURL)]);
    let active = true, sources: AudioBufferSourceNode[] = [], began = 0, offset = 0;
    const stop = (): void => {
      for (const source of sources) { try { source.stop(); } catch { /* Already ended. */ } source.disconnect(); }
      sources = [];
    };
    const start = (): void => {
      stop();
      if (!active || video.paused || video.ended || ctx.state !== 'running') return;
      began = ctx.currentTime; offset = video.currentTime;
      buffers.forEach((buffer, i) => {
        if (!buffer || offset >= buffer.duration) return;
        const source = ctx.createBufferSource(); source.buffer = buffer;
        source.connect(i === 0 ? this.musicGain! : this.effectsGain!);
        source.onended = () => source.disconnect();
        source.start(0, offset); sources.push(source);
      });
    };
    const sync = (): void => {
      if (sources.length && Math.abs(offset + ctx.currentTime - began - video.currentTime) > .15) start();
    };
    const contextChange = (): void => { if (ctx.state === 'running') start(); else stop(); };
    video.addEventListener('playing', start); video.addEventListener('pause', stop);
    video.addEventListener('waiting', stop); video.addEventListener('seeking', stop);
    video.addEventListener('seeked', start); video.addEventListener('timeupdate', sync);
    ctx.addEventListener('statechange', contextChange);
    if (!video.paused) start();
    return () => {
      active = false; stop();
      video.removeEventListener('playing', start); video.removeEventListener('pause', stop);
      video.removeEventListener('waiting', stop); video.removeEventListener('seeking', stop);
      video.removeEventListener('seeked', start); video.removeEventListener('timeupdate', sync);
      ctx.removeEventListener('statechange', contextChange);
    };
  }

  private syncRain(): void {
    const ctx = this.context;
    if (!ctx) return;
    const now = ctx.currentTime;
    if ((this.scene === 'title'||this.rainAtmosphere) && !this.rain) {
      this.fadingRain?.stop();
      this.rainBuffer ??= renderRain(ctx);
      const source = ctx.createBufferSource(), envelope = ctx.createGain();
      source.buffer = this.rainBuffer; source.loop = true;
      envelope.gain.setValueAtTime(0, now); envelope.gain.linearRampToValueAtTime(1, now + .65);
      source.connect(envelope).connect(this.effectsGain!);
      source.onended = () => { source.disconnect(); envelope.disconnect(); if (this.fadingRain === source) this.fadingRain = undefined; };
      source.start(); this.rain = source; this.rainEnvelope = envelope;
    } else if (this.scene !== 'title' && !this.rainAtmosphere && this.rain) {
      this.rainEnvelope!.gain.cancelAndHoldAtTime(now);
      this.rainEnvelope!.gain.linearRampToValueAtTime(0, now + .65);
      this.rain.stop(now + .7); this.fadingRain = this.rain;
      this.rain = undefined; this.rainEnvelope = undefined;
    }
  }

  private syncVisibility(): void {
    if (!this.context) return;
    if (document.hidden || !this.focused) void this.context.suspend().catch(() => {});
    else void this.unlock();
  }

  setSettings(update: Partial<AudioSettings>): void {
    this.settings = audioSettings({ ...this.settings, ...update });
    try { localStorage.setItem(AUDIO_KEY, JSON.stringify(this.settings)); } catch { /* Keep session settings. */ }
    this.applySettings();
    window.dispatchEvent(new Event('after-rain-audio-change'));
  }

  private applySettings(): void {
    if (!this.context) return;
    const time = this.context.currentTime;
    this.master!.gain.setTargetAtTime(this.settings.muted ? 0 : 1, time, .025);
    this.musicGain!.gain.setTargetAtTime(this.settings.music * (this.scene === 'expedition' || this.scene === 'combat' ? .25 : 1), time, .025);
    this.effectsGain!.gain.setTargetAtTime(this.settings.effects, time, .025);
  }

  play(sound: Sound): void {
    const ctx = this.context;
    if (!ctx || ctx.state !== 'running' || document.hidden || !this.focused || this.settings.muted || !this.settings.effects) return;
    const now = ctx.currentTime;
    if (now - (this.lastSound.get(sound) ?? -1) < (sound === 'step' ? .28 : .07)) return;
    this.lastSound.set(sound, now);
    synthesizeEffect(ctx, this.effectsGain!, sound);
  }
}
export const gameAudio = new GameAudio();

function noise(ctx: BaseAudioContext, out: AudioNode, duration: number, frequency: number, volume: number): void {
  const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * duration), ctx.sampleRate);
  const samples = buffer.getChannelData(0);
  for (let i = 0; i < samples.length; i++) samples[i] = (Math.random() * 2 - 1) * (1 - i / samples.length) ** 2;
  const source = ctx.createBufferSource(), filter = ctx.createBiquadFilter(), gain = ctx.createGain();
  source.buffer = buffer; filter.type = 'lowpass'; filter.frequency.value = frequency; gain.gain.value = volume;
  source.connect(filter).connect(gain).connect(out); source.start();
  source.onended = () => { source.disconnect(); filter.disconnect(); gain.disconnect(); };
}

export function synthesizeEffect(ctx: BaseAudioContext, out: AudioNode, sound: Sound): void {
  const now = ctx.currentTime;
  const note = (midi: number, delay = 0, duration = .15, gain = .12): void => tone(ctx, out, hz(midi), now + delay, duration, gain);
  switch (sound) {
    case 'dungeon-start': noise(ctx, out, .85, 420, .09); note(33, 0, .9, .07); note(40, .12, .75, .045); note(46, .28, .55, .035); break;
    case 'shield-burst': noise(ctx, out, .18, 1600, .09); note(52, 0, .16, .05); note(64, .04, .13, .03); break;
    case 'spear-thrust': noise(ctx, out, .07, 3000, .06); note(64, 0, .07, .03); break;
    case 'hammer-impact': noise(ctx, out, .16, 500, .13); note(36, 0, .17, .08); break;
    case 'sword-swing': noise(ctx, out, .1, 2600, .07); note(55, 0, .06, .025); break;
    case 'bow-shot': noise(ctx, out, .045, 3400, .07); note(76, 0, .07, .045); break;
    case 'boomerang-throw': noise(ctx, out, .18, 750, .07); note(57, 0, .12, .025); break;
    case 'weapon-evolution': note(60, 0, .18, .08); note(67, .1, .22, .08); note(76, .2, .4, .08); break;
    case 'combat-hit': noise(ctx, out, .055, 1400, .11); note(48, 0, .06, .045); break;
    case 'ui': note(79, 0, .065, .055); break;
    case 'pickup': note(72); note(79, .1, .3); break;
    case 'craft': note(72); note(76, .1); note(79, .2, .4); break;
    case 'water': noise(ctx, out, .65, 2400, .22); note(83, .08, .12, .035); note(88, .23, .15, .025); break;
    case 'plant': noise(ctx, out, .16, 1100, .2); note(60, 0, .1, .055); break;
    case 'step': noise(ctx, out, .09, 650, .14); break;
    case 'stone': noise(ctx, out, .09, 3800, .17); note(90, 0, .18, .08); note(97, 0, .12, .03); break;
    case 'wood': noise(ctx, out, .12, 900, .32); note(43, 0, .1, .2); break;
    case 'door': noise(ctx, out, .18, 600, .22); note(40, 0, .13, .12); break;
    case 'build': noise(ctx, out, .18, 1000, .25); note(48, 0, .13); note(60, .1, .2, .07); break;
    case 'thunder': noise(ctx, out, 2.4, 240, .36); note(29, 0, 1.8, .055); break;
  }
}
