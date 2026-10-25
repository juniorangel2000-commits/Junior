import { TILE } from './regions';

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));
export {waterDistanceAt,isWaterPoint} from './property-water';

type Trail = readonly [horizontal: boolean, from: number, to: number, centre: number, halfWidth: number, seed: number];
const TRAILS: readonly Trail[] = [
  // O acesso termina na soleira da casa, centrada em 24,5 tiles.
  [true, 47, 76.5, 19, 22, 2],
  [false, 24, 53.5, 19.5, 23, 4],
  [true, 19.5, 75.5, 53.5, 25, 5],
  [false, 18.5, 61.5, 68.5, 23, 6],
  [false, 8.5, 28.5, 71.5, 21, 7],
];

// Quadratic segments align the doorway, the bend and the bridge deck centre.
const HOME_PATH:readonly (readonly [number,number])[]=Array.from({length:65},(_,i)=>{
  const t=i/64,u=1-t;
  return [u*u*24.5*TILE+2*u*t*24.1*TILE+t*t*41*TILE,
    u*u*16.2*TILE+2*u*t*19.5*TILE+t*t*19*TILE] as const;
});
function homePathDistance(x:number,y:number):number {
  let nearest=Infinity;
  for(let i=1;i<HOME_PATH.length;i++) {
    const [ax,ay]=HOME_PATH[i-1],[bx,by]=HOME_PATH[i],dx=bx-ax,dy=by-ay;
    const t=clamp(((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy),0,1);
    nearest=Math.min(nearest,Math.hypot(x-ax-t*dx,y-ay-t*dy));
  }
  return nearest-(20+Math.sin(x*.014+y*.009)*1.5);
}

/** Capsule routes with wavy edges and rounded unions, independent of tile gates. */
export function roadDistanceAt(x: number, y: number): number {
  let distance = x>22*TILE&&x<42*TILE&&y>15*TILE&&y<21*TILE?homePathDistance(x,y):Infinity;
  for (const [horizontal, from, to, centre, halfWidth, seed] of TRAILS) {
    const along = horizontal ? x : y, across = horizontal ? y : x;
    // This culling only excludes pixels at least 40px beyond the visible edge.
    const reach = halfWidth + 48;
    if (along < from * TILE - reach || along > to * TILE + reach || Math.abs(across - centre * TILE) > reach) continue;
    const centreLine = centre * TILE + (seed === 1 ? Math.sin(along*.019)*1.5 : Math.sin(along * 0.012 + seed) * 5 + Math.sin(along * 0.033 + seed) * 3);
    const width = halfWidth + Math.sin(along * 0.019 + seed * 0.6) * 2;
    const end = along - clamp(along, from * TILE, to * TILE);
    const candidate = Math.hypot(end, across - centreLine) - width;
    // Polynomial smooth union rounds the inside corners at route junctions.
    const blend = Math.max(14 - Math.abs(distance - candidate), 0) / 14;
    distance = Math.min(distance, candidate) - blend * blend * 3.5;
  }
  return distance;
}
