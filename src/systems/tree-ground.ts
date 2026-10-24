import {TILE,WORLD_WIDTH,WORLD_HEIGHT} from '../data/world-size';

export const isTreeKind=(kind:string|undefined):boolean=>kind==='standingTree'||kind==='pine'||/^oak[A-C]$/.test(kind??'')||/^pine[A-C]$/.test(kind??'');
/** The whole root cell must be dry, including slivers at a rounded shoreline. */
export function treeGroundClear(x:number,y:number,waterPoint:(x:number,y:number)=>boolean):boolean {
  return Number.isSafeInteger(x)&&Number.isSafeInteger(y)&&x>=1&&y>=1&&x<WORLD_WIDTH-1&&y<WORLD_HEIGHT-1
    && [2,16,30].every(dx=>[2,16,30].every(dy=>!waterPoint(x*TILE+dx,y*TILE+dy)));
}
