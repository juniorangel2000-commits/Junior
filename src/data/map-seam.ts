import { WORLD_WIDTH, WORLD_HEIGHT } from './world-size';
import type { EditorObjectKind } from '../systems/map-editor';
import type { MapEditData } from '../systems/map-editor';

export type SeamArea = 'property' | 'forest';
export type SeamGrass = 'grass' | 'forest' | 'moss';
export const MAP_SEAM_ROW = 52;
export const SEAM_BAND_TILES = 8;

/** Author seam IDs survive tree removal and editor round trips. Sparse legacy
 * drafts retain their original world until the author-map upgrade is applied. */
export function hasMapSeam(edits:MapEditData|undefined):boolean {
 return !!edits&&(edits.continuation===1||Object.keys(edits.objects).some(id=>/-seam-[fp]-/.test(id)));
}

/** Both areas use one coordinate field: forest is west of the property. */
export function seamGlobalX(x: number, area: SeamArea): number {
  return area === 'forest' ? x - WORLD_WIDTH : x;
}

export function seamBand(x: number, y: number, area: SeamArea): boolean {
  return y >= 0 && y < WORLD_HEIGHT && x >= 0 && x < WORLD_WIDTH
    && (area === 'forest' ? x >= WORLD_WIDTH - SEAM_BAND_TILES : x < SEAM_BAND_TILES);
}

/** The shared opening extends a little inward to reach the existing clearing. */
export function seamPassage(x: number, y: number, area: SeamArea): boolean {
  return Math.abs(y - MAP_SEAM_ROW) <= 2 && x >= 0 && x < WORLD_WIDTH
    && (area === 'forest' ? x >= WORLD_WIDTH - 12 : x < SEAM_BAND_TILES);
}

/** Editable material patches follow the same smooth field on either side. */
export function seamGrassKind(globalX: number, y: number): SeamGrass {
  const opening = Math.abs(y - MAP_SEAM_ROW) < 1.5 + Math.sin(globalX * .35) * .35;
  if (opening) return 'grass';
  const field = Math.sin(globalX * .45 + y * .19)
    + Math.sin(globalX * .16 - y * .43) * .65
    + Math.cos(globalX * .32 + y * .07) * .4;
  return field > .85 ? 'grass' : field < -.7 ? 'moss' : 'forest';
}

export interface SeamTree { x: number; y: number; kind: EditorObjectKind; id: string }
const treeKinds = ['oakA', 'pineB', 'oakC', 'pineA', 'oakB', 'pineC'] as const;
const seedAt = (x: number, y: number): number => (Math.imul(x + 31, 73856093) ^ Math.imul(y + 17, 19349663)) >>> 0;

/** Offset woodland pockets replace the doubled straight wall at the map join.
 * No trunk crosses the shared edge, and the portal stays clear of foreground
 * canopies as well as collision. Every tree is an ordinary editable map object. */
export function seamTreePlan(area: SeamArea): SeamTree[] {
  const result: SeamTree[] = [];
  for (let row = 3; row < WORLD_HEIGHT - 2; row += 5) for (const column of [-7, -4, 3, 6]) {
    const seed = seedAt(column, row);
    if (seed % 5 === 0) continue;
    const globalX = column === -7 ? column + (seed >>> 5) % 2
      : column === 3 ? column + (seed >>> 5) % 2 : column;
    const y = row + (seed >>> 12) % 3;
    if (y >= 50 && y <= 59) continue;
    if ((area === 'forest') !== (globalX < 0)) continue;
    const x = area === 'forest' ? globalX + WORLD_WIDTH : globalX;
    const kind = treeKinds[(seed >>> 17) % treeKinds.length];
    result.push({ x, y, kind, id: `editor-${kind}-seam-${area === 'forest' ? 'f' : 'p'}-${x}-${y}` });
  }
  return result;
}
