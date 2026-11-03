import type {Metal} from './economy-balance';
import type {MineDepth} from './underground-layout';
export type MineMaterial='stone'|Metal;
export interface UndergroundBalance{
 deposits:Record<MineDepth,Record<Metal,number>>;
 galleryWeight:{permanent:number;renewable:number};
 regeneration:{days:Record<MineMaterial,number>;fraction:number;maxPerEntry:number;actorClearance:number;minimumDaysBetweenRenewals:number};
}
/** PROVISIONAL balance for testing. No probability, interval or quota here is final. */
export const UNDERGROUND_BALANCE:UndergroundBalance={
 deposits:{
  surface:{iron:.20,gold:0,blackMetal:0},
  middle:{iron:.23,gold:.02,blackMetal:0},
  deep:{iron:.25,gold:.035,blackMetal:.0008},
  extreme:{iron:.27,gold:.05,blackMetal:.0016},
 },
 galleryWeight:{permanent:1,renewable:.85},
 regeneration:{days:{stone:3,iron:5,gold:9,blackMetal:14},fraction:.35,maxPerEntry:64,actorClearance:64,minimumDaysBetweenRenewals:3},
};
