import { TILE } from './data/regions';

/** Presentation only: a closed camera path leaves the world and saved position untouched. */
export function titleCameraPose(width: number, height: number, elapsed: number): { x: number; y: number; zoom: number } {
  const zoom = Math.max(1, Math.min(2, width / 800));
  const phase = elapsed * Math.PI * 2 / 36;
  return {
    x: 24.5 * TILE - width * .18 / zoom + Math.sin(phase) * 22,
    y: 14 * TILE - height * .02 / zoom + (Math.cos(phase) - 1) * 12,
    zoom,
  };
}
