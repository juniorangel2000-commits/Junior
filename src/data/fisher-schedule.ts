import {needsDamiaoIntroduction} from '../systems/village-introduction';
/** Morning at the lake; the existing village lunch and afternoon visits remain. */
export const FISHER_LAKE_HOURS={start:480,end:690,label:'08:00–11:30'} as const;
export const fisherAtLake=(time:number):boolean=>Number.isFinite(time)&&time>=FISHER_LAKE_HOURS.start&&time<FISHER_LAKE_HOURS.end;

export const damiaoAtLake=(save:{time:number;damiaoIntroduction?:boolean}):boolean=>needsDamiaoIntroduction(save)||fisherAtLake(save.time);
