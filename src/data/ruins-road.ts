import {TILE, WORLD_WIDTH} from './world-size';

export const CITY_ROAD_Y = 10;
export const RUINS_ROAD_Y = 4;
export const CITY_RUINS_EXIT = {x: WORLD_WIDTH - 2, y: CITY_ROAD_Y};
export const CITY_RUINS_RETURN = {x: WORLD_WIDTH - 4, y: CITY_ROAD_Y};
export const RUINS_ENTRY = {x: 4, y: RUINS_ROAD_Y};
export const RUINS_EXIT = {x: 1, y: RUINS_ROAD_Y};
export const cityRuinsRoadProtected = (x: number,y: number): boolean =>
  x >= CITY_RUINS_RETURN.x - 2 && Math.abs(y - CITY_ROAD_Y) <= 2;

export function tileMidpoint(p: {x:number;y:number}): {x:number;y:number} {
  return {x:(p.x+.5)*TILE,y:(p.y+.5)*TILE};
}
