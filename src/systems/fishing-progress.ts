import type {SaveData} from '../types';
import {FISH_SPECIES,fishSpecies,validFishingReward,type FishSpecimen,type FishSpeciesId,type FishingReward} from '../data/fishing-catches';
export type BaitStyle='worm'|'dough'|'insect';
export interface FishRecord {count:number;lengthCm:number;weightGrams:number;firstDay:number}
export interface FishingProgress {records:Partial<Record<FishSpeciesId,FishRecord>>;basket:FishSpecimen[];rodTier:0|1|2;bait:BaitStyle;preparedBait:boolean;orderDay?:number}
export const newFishingProgress=():FishingProgress=>({records:{},basket:[],rodTier:0,bait:'worm',preparedBait:false});
export const BAITS={worm:{name:'Minhoca',hint:'Versátil, sem preferência por espécie.',cost:1},dough:{name:'Massa caseira',hint:'Favorece tilápias e carpas. Usa duas iscas por lançamento.',cost:2},insect:{name:'Isca de inseto',hint:'Favorece lambaris e trutas. Usa duas iscas por lançamento.',cost:2}} as const;
export const RODS=['Vara de bambu','Vara reforçada','Vara equilibrada'] as const;
export const FISH_HABITS={
 lambari:{speed:1.8,turn:.65,sway:.06,frequency:4.2,hint:'Pequeno e inquieto. Mais ativo de manhã.',base:5},
 tilapia:{speed:.85,turn:2,sway:.025,frequency:1.7,hint:'Movimentos suaves. Prefere o dia e a massa caseira.',base:7},
 carpa:{speed:1.15,turn:1.7,sway:.045,frequency:2.3,hint:'Arrancadas lentas e fortes. Gosta de massa e chuva.',base:9},
 bagre:{speed:1.2,turn:1.5,sway:.035,frequency:2,hint:'Disputa junto ao fundo. Mais ativo à noite.',base:10},
 truta:{speed:2.3,turn:.65,sway:.09,frequency:5,hint:'Ágil e imprevisível. No lago, prefere manhãs e insetos.',base:38},
 dourado:{speed:2.8,turn:.45,sway:.12,frequency:6,hint:'Arrancadas intensas. No lago, prefere o fim da tarde.',base:60},
} as const;
// A stable daily forecast: opening a panel or reloading never rerolls the weather.
export const fishingWeather=(day:number):'rain'|'clear'=>((day*17+3)%7)<2?'rain':'clear';
export function speciesWeight(id:FishSpeciesId,time:number,day:number,bait:BaitStyle):number {
 const hour=((time%1440)+1440)%1440,night=hour<360||hour>=1140,morning=hour>=360&&hour<660;
 let weight=1;
 if(id==='bagre')weight*=night?2.2:.8;
 if(id==='lambari'||id==='truta')weight*=morning?1.8:night?.65:1;
 if(id==='tilapia')weight*=night?.65:1.35;
 if(id==='dourado')weight*=hour>=960&&hour<1140?1.8:1;
 if(fishingWeather(day)==='rain'&&(id==='carpa'||id==='bagre'))weight*=1.5;
 if(bait==='dough')weight*=id==='carpa'||id==='tilapia'?2:.75;
 if(bait==='insect')weight*=id==='truta'||id==='lambari'?2:.75;
 return weight;
}
export function specimenPrice(f:FishSpecimen):number {
 const species=fishSpecies(f.species),size=Math.max(0,Math.min(1,(f.lengthCm-species.minCm)/(species.maxCm-species.minCm)));
 return Math.round(FISH_HABITS[f.species].base*(.8+size*.8));
}
/** Metadata never creates inventory. Generic fish used in recipes or trades trim the basket. */
export function availableSpecimens(save:SaveData):FishSpecimen[]{
 const remaining={fish:save.inventory.fish,rareFish:save.inventory.rareFish};
 return (save.fishingProgress?.basket??[]).filter(f=>remaining[fishSpecies(f.species).stock]-->0);
}
export function recordFishingReward(save:SaveData,reward:FishingReward):void {
 const p=save.fishingProgress??=newFishingProgress();p.basket=availableSpecimens(save);
 if(reward.kind!=='fish')return;
 for(const f of reward.specimens){const r=p.records[f.species];p.records[f.species]={count:Math.min(999999,(r?.count??0)+1),lengthCm:Math.max(r?.lengthCm??0,f.lengthCm),weightGrams:Math.max(r?.weightGrams??0,f.weightGrams),firstDay:r?.firstDay??save.day};}
 p.basket.push(...structuredClone(reward.specimens));p.basket=p.basket.slice(-200);
}
const obj=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
export function validFishingProgress(v:unknown):v is FishingProgress {
 if(!obj(v)||!obj(v.records)||!Array.isArray(v.basket)||v.basket.length>200||![0,1,2].includes(v.rodTier as number)||!['worm','dough','insect'].includes(v.bait as string)||typeof v.preparedBait!=='boolean'||!v.preparedBait&&v.bait!=='worm')return false;
 if(v.orderDay!==undefined&&(!Number.isSafeInteger(v.orderDay)||Number(v.orderDay)<1||Number(v.orderDay)>999999))return false;
 return Object.entries(v.records).every(([id,r])=>FISH_SPECIES.some(f=>f.id===id)&&obj(r)&&Number.isSafeInteger(r.count)&&Number(r.count)>0&&Number(r.count)<=999999&&Number.isSafeInteger(r.firstDay)&&Number(r.firstDay)>=1&&Number(r.firstDay)<=999999&&validFishingReward({kind:'fish',specimens:[{species:id,lengthCm:r.lengthCm,weightGrams:r.weightGrams}]}))&&v.basket.every(f=>validFishingReward({kind:'fish',specimens:[f]}));
}
export function fishingOrder(day:number):{species:FishSpeciesId;quantity:number;reward:number}{
 const species=FISH_SPECIES[(day-1)%FISH_SPECIES.length].id,quantity=fishSpecies(species).stock==='rareFish'?1:2;
 return{species,quantity,reward:Math.round(FISH_HABITS[species].base*1.8*quantity+20)};
}
