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

/** Estação Ferroviária: a mesma via (y=4) segue a leste das Ruínas (docs/cenarios/ESTACAO-FERROVIARIA.md). */
export const RUINS_RAILWAY_EXIT = {x: WORLD_WIDTH - 2, y: RUINS_ROAD_Y};
export const RUINS_RAILWAY_RETURN = {x: WORLD_WIDTH - 4, y: RUINS_ROAD_Y};
export const RAILWAY_ROAD_Y = RUINS_ROAD_Y;
export const RAILWAY_ENTRY = {x: 4, y: RAILWAY_ROAD_Y};
export const RAILWAY_EXIT = {x: 1, y: RAILWAY_ROAD_Y};
/** Faixa da estrada perto das passagens: pinturas antigas de colisão não a bloqueiam. */
export const ruinsRailwayRoadProtected = (x: number,y: number): boolean =>
  x >= RUINS_RAILWAY_RETURN.x - 2 && Math.abs(y - RUINS_ROAD_Y) <= 2;
export const railwayRoadProtected = (x: number,y: number): boolean =>
  x <= RAILWAY_ENTRY.x + 2 && Math.abs(y - RAILWAY_ROAD_Y) <= 2;

/** A estrada segue da Estação para a faixa seca ao norte da Costa. */
export const COAST_ROAD_Y=RAILWAY_ROAD_Y;
export const RAILWAY_COAST_EXIT={x:WORLD_WIDTH-2,y:RAILWAY_ROAD_Y};
export const RAILWAY_COAST_RETURN={x:WORLD_WIDTH-4,y:RAILWAY_ROAD_Y};
export const COAST_ENTRY={x:4,y:COAST_ROAD_Y};
export const COAST_EXIT={x:1,y:COAST_ROAD_Y};
export const railwayCoastRoadProtected=(x:number,y:number):boolean=>
  x>=RAILWAY_COAST_RETURN.x-2&&Math.abs(y-RAILWAY_ROAD_Y)<=2;
export const coastRoadProtected=(x:number,y:number):boolean=>
  x<=COAST_ENTRY.x+2&&Math.abs(y-COAST_ROAD_Y)<=2;
