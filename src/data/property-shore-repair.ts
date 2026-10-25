import type {MapEditData} from '../systems/map-editor';

export const PROPERTY_SHORE_REVISION=1;
/** Old grass squares that cut the north-west beach into three visible steps. */
export const PROPERTY_SHORE_CELLS=['31,25','32,25','30,26','31,26','32,26','31,27','30,27','30,28'] as const;
export function repairPropertyShore(map:MapEditData|undefined,protectedCells:ReadonlySet<string>=new Set()):void {
  if(!map)return;
  for(const cell of PROPERTY_SHORE_CELLS)if(map.terrain[cell]==='grass'&&!protectedCells.has(cell))delete map.terrain[cell];
}
