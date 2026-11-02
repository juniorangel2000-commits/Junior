import {MERCHANTS} from '../data/village-commerce';
import {weatherForDay,WEATHER_NAMES} from '../weather-model';
import {dayPhase,dayMinutes} from '../daylight-model';
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
export const fishingWeather=weatherForDay;
export function fishingConditions(day:number,time:number):string {
 const minutes=Math.floor(dayMinutes(time)),clock=String(Math.floor(minutes/60)).padStart(2,'0')+':'+String(minutes%60).padStart(2,'0');
 return `${dayPhase(time)} · ${clock} · ${WEATHER_NAMES[weatherForDay(day)]}`;
}
export const ROD_UPGRADES=[{coins:100,materials:{plank:4,cord:2},description:'100 C, 4 tábuas e 2 cordas'},{coins:240,materials:{plank:6,metalPart:2},description:'240 C, 6 tábuas e 2 peças metálicas'}] as const;
export const rodControlBonus=(tier:number,net=false)=>net?0:Math.max(0,Math.min(2,Math.floor(tier)))*.035;
export const rodControlLabel=(tier:number)=>`Faixa de controle +${(Math.round(rodControlBonus(tier)/.28*1000)/10).toLocaleString('pt-BR')}%`;
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
 // Identified catches earn the ordinary shop price plus a species/size premium.
 const floor=MERCHANTS.fisher.sell[species.stock]??0;
 return floor+Math.round(FISH_HABITS[f.species].base*(.25+size*.75));
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
 const fish=fishSpecies(species),bestPrice=specimenPrice({species,lengthCm:fish.maxCm,weightGrams:fish.maxGrams});
 return{species,quantity,reward:Math.ceil(bestPrice*quantity*1.25)+20};
}
