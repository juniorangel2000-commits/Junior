export interface VisualSettings { daylight: boolean; intensity: number }
export const VISUAL_SETTINGS_KEY = 'after-rain-visual-settings-v1';

export function visualSettings(value: unknown): VisualSettings {
  const v = value && typeof value === 'object' ? value as Partial<VisualSettings> : {};
  return { daylight: typeof v.daylight === 'boolean' ? v.daylight : true,
    intensity: typeof v.intensity === 'number' && Number.isFinite(v.intensity) ? Math.max(0, Math.min(1, v.intensity)) : 1 };
}
let current: VisualSettings | undefined;
export function getVisualSettings(): VisualSettings {
  if (!current) {
    try { current = visualSettings(JSON.parse(localStorage.getItem(VISUAL_SETTINGS_KEY) || 'null')); }
    catch { current = visualSettings(null); }
  }
  return { ...current };
}
export function setVisualSettings(update: Partial<VisualSettings>): void {
  current = visualSettings({ ...getVisualSettings(), ...update });
  try { localStorage.setItem(VISUAL_SETTINGS_KEY, JSON.stringify(current)); } catch { /* Keep this session's preference. */ }
}
