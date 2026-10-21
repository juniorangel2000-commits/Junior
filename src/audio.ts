/** Original procedural score and foley: no external recordings or network requests. */
export interface AudioSettings { music: number; effects: number; muted: boolean }
export const AUDIO_KEY = 'after-rain-audio-v1';
export function audioSettings(value: unknown): AudioSettings {
  const v = value && typeof value === 'object' ? value as Partial<AudioSettings> : {};
  const volume = (n: unknown, fallback: number): number => typeof n === 'number' && Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : fallback;
  return { music: volume(v.music, .45), effects: volume(v.effects, .65), muted: v.muted === true };
}
export type Sound = 'step' | 'ui' | 'pickup' | 'wood' | 'stone' | 'plant' | 'water' | 'craft' | 'door' | 'build';
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

class GameAudio {
  settings = audioSettings(null);
  private context?: AudioContext;
  private master?: GainNode;
  private musicGain?: GainNode;
  private effectsGain?: GainNode;
  private music?: AudioBufferSourceNode;
  private rendering?: Promise<void>;
  private installed = false;
  private focused = true;
  private lastSound = new Map<Sound, number>();

  init(): void {
    if (this.installed) return;
    this.installed = true;
    try { this.settings = audioSettings(JSON.parse(localStorage.getItem(AUDIO_KEY) || 'null')); } catch { /* Defaults if storage is unavailable. */ }
    const unlock = (): void => { void this.unlock(); };
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
      if (!this.music && !this.rendering) {
        this.rendering = renderMusic().then(buffer => {
          const source = this.context!.createBufferSource(); source.buffer = buffer; source.loop = true;
          source.connect(this.musicGain!); source.start(); this.music = source;
        }).catch(() => { /* Sound effects remain available if rendering fails. */ }).finally(() => { this.rendering = undefined; });
      }
    } catch { /* Audio support must never prevent play or saving. */ }
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
  }

  private applySettings(): void {
    if (!this.context) return;
    const time = this.context.currentTime;
    this.master!.gain.setTargetAtTime(this.settings.muted ? 0 : 1, time, .025);
    this.musicGain!.gain.setTargetAtTime(this.settings.music, time, .025);
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
  }
}
