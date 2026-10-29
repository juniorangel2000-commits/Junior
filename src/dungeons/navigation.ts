import { dungeonBlocked } from "./maps";
import type { DungeonId } from "./config";
const SIZE = 64,
  COLS = 48,
  ROWS = 35;
const point = (i: number) => ({
  x: 32 + (i % COLS) * SIZE,
  y: 48 + Math.floor(i / COLS) * SIZE,
});
export function dungeonSegmentClear(
  id: DungeonId,
  x: number,
  y: number,
  tx: number,
  ty: number,
): boolean {
  const steps = Math.max(1, Math.ceil(Math.hypot(tx - x, ty - y) / 8));
  for (let n = 1; n <= steps; n++)
    if (
      dungeonBlocked(id, x + ((tx - x) * n) / steps, y + ((ty - y) * n) / steps)
    )
      return false;
  return true;
}
const graphs = new Map<DungeonId, number[][]>();
const fields = new Map<DungeonId, { root: number; distance: Int16Array }>();
function graph(id: DungeonId) {
  const cached = graphs.get(id);
  if (cached) return cached;
  const edges: number[][] = Array.from({ length: COLS * ROWS }, () => []);
  for (let i = 0; i < edges.length; i++) {
    const p = point(i);
    if (dungeonBlocked(id, p.x, p.y)) continue;
    for (const j of [
      i % COLS ? i - 1 : -1,
      i % COLS < COLS - 1 ? i + 1 : -1,
      i - COLS,
      i + COLS,
    ]) {
      if (j < 0 || j >= edges.length) continue;
      const q = point(j);
      if (dungeonSegmentClear(id, p.x, p.y, q.x, q.y)) edges[i].push(j);
    }
  }
  graphs.set(id, edges);
  return edges;
}
/** Shared distance field; obstacles stay static and all pursuers have the same goal. */
export function dungeonWaypoint(
  id: DungeonId,
  x: number,
  y: number,
  tx: number,
  ty: number,
): { x: number; y: number } | undefined {
  const edges = graph(id),
    near = (px: number, py: number) => {
      const result: number[] = [],
        cx = Math.round((px - 32) / SIZE),
        cy = Math.round((py - 48) / SIZE);
      for (let dy = -2; dy <= 2; dy++)
        for (let dx = -2; dx <= 2; dx++) {
          const nx = cx + dx,
            ny = cy + dy;
          if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS)
            result.push(ny * COLS + nx);
        }
      return result;
    };
  const roots = near(tx, ty).filter(
    (i) =>
      edges[i].length &&
      dungeonSegmentClear(id, tx, ty, point(i).x, point(i).y),
  );
  roots.sort(
    (a, b) =>
      Math.hypot(point(a).x - tx, point(a).y - ty) -
      Math.hypot(point(b).x - tx, point(b).y - ty),
  );
  const root = roots[0];
  if (root === undefined) return;
  let field = fields.get(id);
  if (field?.root !== root) {
    const distance = new Int16Array(edges.length).fill(-1),
      queue = [root];
    distance[root] = 0;
    for (let head = 0; head < queue.length; head++)
      for (const next of edges[queue[head]])
        if (distance[next] < 0) {
          distance[next] = distance[queue[head]] + 1;
          queue.push(next);
        }
    field = { root, distance };
    fields.set(id, field);
  }
  let best = Infinity,
    chosen: number | undefined;
  for (const i of near(x, y)) {
    const p = point(i),
      d = Math.hypot(p.x - x, p.y - y);
    if (
      d < 4 ||
      field.distance[i] < 0 ||
      !dungeonSegmentClear(id, x, y, p.x, p.y)
    )
      continue;
    const score = field.distance[i] * 1.01 + d / SIZE;
    if (score < best) {
      best = score;
      chosen = i;
    }
  }
  return chosen === undefined ? undefined : point(chosen);
}
