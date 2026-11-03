import {mineMissionSeal} from '../data/mine-quest-geometry';
import {UNDERGROUND_BALANCE,type UndergroundBalance,type MineMaterial} from '../data/underground-balance';
import {mineHash,mineDepth,mineZone,mineCellIndex} from '../data/underground-layout';
import type {UndergroundState} from './underground';
export const MINE_MATERIALS:readonly MineMaterial[]=['stone','iron','gold','blackMetal'];
/** Seed + cell + renewal cycle, independent of rendering, visits, clock and reload count. */
export function mineMaterialAt(mine:UndergroundState,x:number,y:number,balance:UndergroundBalance=UNDERGROUND_BALANCE):MineMaterial{
 const change=mine.changes[mineCellIndex(x,y)];
 if(change?.mineral)return change.mineral;
 if(mineMissionSeal(x,y))return'stone';
 // Work begun before deposits existed remains plain stone.
 if(change?.hits||change?.dug)return'stone';
 const zone=mineZone(mine.seed,x,y);if(zone==='protected')return'stone';
 const chance=balance.deposits[mineDepth(y)],weight=balance.galleryWeight[zone];
 const sample=mineHash(mine.seed^0x65a71bc3,x+(change?.cycle??0)*7919,y);
 if(sample<chance.blackMetal*weight)return'blackMetal';
 if(sample<(chance.blackMetal+chance.gold)*weight)return'gold';
 if(sample<(chance.blackMetal+chance.gold+chance.iron)*weight)return'iron';
 return'stone';
}
