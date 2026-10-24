import { TILE } from './world-size';

/** Fit the wider river at the existing northern and southern crossing rows. */
export const PROPERTY_BRIDGES = [
  { id: 'north', x: 41, y: 18, width: 6, height: 2 },
  { id: 'south', x: 42, y: 52, width: 7, height: 2 },
] as const;
export const BRIDGE_RAIL_WIDTH = 6;
export function bridgeAtPoint(x:number,y:number) {
  return PROPERTY_BRIDGES.find(b=>x>=b.x*TILE && x<(b.x+b.width)*TILE && y>=b.y*TILE && y<(b.y+b.height)*TILE);
}
export function bridgeRailAtPoint(x:number,y:number):boolean {
  const bridge=bridgeAtPoint(x,y);
  return !!bridge && (y<bridge.y*TILE+BRIDGE_RAIL_WIDTH || y>=(bridge.y+bridge.height)*TILE-BRIDGE_RAIL_WIDTH);
}

/** Actual wet ground, including shallow wading, cannot become a bridge entrance. */
export function bridgeAllowsStep(fromX:number,fromY:number,toX:number,toY:number,water:(x:number,y:number)=>boolean):boolean {
  const from=bridgeAtPoint(fromX,fromY),to=bridgeAtPoint(toX,toY);
  return !(!from && to && water(fromX,fromY)) && !(from && !to && water(toX,toY));
}
