import { TILE } from './regions';

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));
const smooth = (value: number): number => { const t = clamp(value, 0, 1); return t * t * (3 - 2 * t); };
const BRIDGE_LANDINGS = [
  { left: 42 * TILE, right: 49 * TILE, top: 18 * TILE, bottom: 20 * TILE },
  { left: 41 * TILE, right: 50 * TILE, top: 52 * TILE, bottom: 54 * TILE },
] as const;

function ellipseDistance(x: number, y: number, cx: number, cy: number, rx: number, ry: number): number {
  return (Math.hypot((x - cx) / rx, (y - cy) / ry) - 1) * Math.min(rx, ry);
}

/**
 * Continuous signed shoreline distance in world pixels: <0 water, >0 land.
 * Analytic ellipses use the original lake equations at tile-centre coordinates.
 * The river is the continuous version of its old stepped sinusoid: its left
 * bank lies between the same two tile centres for each row. No water/land tile
 * centre changes; only the shoreline between centres becomes rounded.
 * Magnitude is an approximate distance for paint; its sign is authoritative.
 * Rendering and feet collision share it.
 * Bridges are deliberately not cut out: their deck is drawn over the water,
 * and movement applies isBridgeTile separately as a walkable override.
 */
export function waterDistanceAt(x: number, y: number): number {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return Infinity;
  const phase = (y / TILE - 0.5) * 0.24;
  let left = (43.5 + Math.sin(phase) * 2) * TILE;
  // An infinitesimal right-bank allowance reproduces the original inclusive
  // last column even at exact integer bends (notably the world's first row).
  let right = left + 4 * TILE + 1e-7;
  // Keep both banks under the deck at the crossings. A one-tile smooth blend
  // outside each landing avoids a notch or an impassable gap before the bridge.
  for (const bridge of BRIDGE_LANDINGS) {
    if (y <= bridge.top - TILE || y >= bridge.bottom + TILE) continue;
    const blend = y < bridge.top ? smooth((y - bridge.top + TILE) / TILE)
      : y > bridge.bottom ? smooth((bridge.bottom + TILE - y) / TILE) : 1;
    left += Math.max(bridge.left - left, 0) * blend;
    right -= Math.max(right - bridge.right, 0) * blend;
  }
  const river = Math.max(left - x, x - right) / Math.hypot(1, Math.cos(phase) * 0.48);
  const pond = ellipseDistance(x, y, 36.5 * TILE, 30.5 * TILE, Math.sqrt(33) * TILE, Math.sqrt(15) * TILE);
  const forestPond = ellipseDistance(x, y, 80.5 * TILE, 10.5 * TILE, Math.sqrt(30) * TILE, Math.sqrt(10) * TILE);
  return Math.min(river, pond, forestPond);
}

export function isWaterPoint(x: number, y: number): boolean { return waterDistanceAt(x, y) < 0; }

type Trail = readonly [horizontal: boolean, from: number, to: number, centre: number, halfWidth: number, seed: number];
const TRAILS: readonly Trail[] = [
  [false, 15, 20, 25.5, 24, 1],
  [true, 15, 76.5, 18.5, 23, 2],
  [false, 19, 30.5, 31.5, 22, 3],
  [false, 24, 53.5, 19.5, 23, 4],
  [true, 19.5, 75.5, 53.5, 25, 5],
  [false, 18.5, 61.5, 68.5, 23, 6],
  [false, 8.5, 28.5, 71.5, 21, 7],
];

/** Capsule routes with wavy edges and rounded unions, independent of tile gates. */
export function roadDistanceAt(x: number, y: number): number {
  let distance = Infinity;
  for (const [horizontal, from, to, centre, halfWidth, seed] of TRAILS) {
    const along = horizontal ? x : y, across = horizontal ? y : x;
    // This culling only excludes pixels at least 40px beyond the visible edge.
    const reach = halfWidth + 48;
    if (along < from * TILE - reach || along > to * TILE + reach || Math.abs(across - centre * TILE) > reach) continue;
    const centreLine = centre * TILE + Math.sin(along * 0.012 + seed) * 5 + Math.sin(along * 0.033 + seed) * 3;
    const width = halfWidth + Math.sin(along * 0.019 + seed * 0.6) * 2;
    const end = along - clamp(along, from * TILE, to * TILE);
    const candidate = Math.hypot(end, across - centreLine) - width;
    // Polynomial smooth union rounds the inside corners at route junctions.
    const blend = Math.max(14 - Math.abs(distance - candidate), 0) / 14;
    distance = Math.min(distance, candidate) - blend * blend * 3.5;
  }
  return distance;
}
