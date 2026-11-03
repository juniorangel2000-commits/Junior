import {UNDERGROUND,inMineEntrance} from './underground-layout';
import type {TilePoint} from '../types';
export const MINING_NAME='Galerias da Mina';
export const MINING_ENTRY={x:79*32+16,y:171*32+16,direction:'up' as const};
export const MINING_EXIT={x:79*32+16,y:173*32+16,halfWidth:42,depth:24,direction:'down' as const};
export const MINING_HEIGHT=175*32;
export const MINE_HALL_RETURN={x:UNDERGROUND.entryX+362,y:UNDERGROUND.entryY+190,direction:'down' as const};
export const inMiningGallery=(p:TilePoint)=>!inMineEntrance(p.x,p.y)||p.y<UNDERGROUND.entryY+140;
