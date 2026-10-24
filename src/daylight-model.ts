export const SUNRISE_MINUTES = 6 * 60;
export const SUNSET_MINUTES = 19 * 60;
export type DayPhase = 'Madrugada' | 'Manhã' | 'Tarde' | 'Noite';

export function dayMinutes(time: number): number {
  return Number.isFinite(time) ? ((time % 1440) + 1440) % 1440 : 12 * 60;
}

export function dayPhase(time: number): DayPhase {
  const t = dayMinutes(time);
  return t < SUNRISE_MINUTES ? 'Madrugada' : t < 720 ? 'Manhã' : t < SUNSET_MINUTES ? 'Tarde' : 'Noite';
}

// Both ends match at midnight. Smoothstep also keeps the rate of change gentle
// at dawn/dusk, rather than switching filters at the phase boundaries.
const KEYS = [
  { at: 0, shade: .43, warmth: 0 },
  { at: 240, shade: .46, warmth: 0 },
  { at: 330, shade: .34, warmth: .025 },
  { at: 390, shade: .12, warmth: .10 },
  { at: 510, shade: 0, warmth: .035 },
  { at: 720, shade: 0, warmth: 0 },
  { at: 930, shade: 0, warmth: .025 },
  { at: 1050, shade: .025, warmth: .09 },
  { at: 1110, shade: .10, warmth: .15 },
  { at: 1170, shade: .26, warmth: .07 },
  { at: 1260, shade: .39, warmth: 0 },
  { at: 1440, shade: .43, warmth: 0 },
];

export function daylightAt(time: number, intensity = 1, indoors = false) {
  const t = dayMinutes(time);
  const strength = Number.isFinite(intensity) ? Math.max(0, Math.min(1, intensity)) : 1;
  const i = KEYS.findIndex(k => k.at > t);
  const a = KEYS[i - 1], b = KEYS[i];
  const x = (t - a.at) / (b.at - a.at), smooth = x * x * (3 - 2 * x);
  const mix = (from: number, to: number) => from + (to - from) * smooth;
  return { phase: dayPhase(t), shade: mix(a.shade, b.shade) * strength * (indoors ? .22 : 1),
    warmth: mix(a.warmth, b.warmth) * strength * (indoors ? .35 : 1) };
}
