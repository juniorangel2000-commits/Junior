import type {ItemId} from '../types';
export const FISH_SPECIES=[
 {id:'lambari',name:'Lambari',rarity:'common',label:'Comum',stock:'fish',weight:40,minCm:6,maxCm:16,maxGrams:55,description:'Pequeno e ágil, costuma se reunir em cardumes perto da margem.'},
 {id:'tilapia',name:'Tilápia',rarity:'common',label:'Comum',stock:'fish',weight:30,minCm:18,maxCm:42,maxGrams:1800,description:'Prefere águas tranquilas e costuma procurar alimento no fundo.'},
 {id:'carpa',name:'Carpa',rarity:'uncommon',label:'Incomum',stock:'fish',weight:18,minCm:25,maxCm:65,maxGrams:6000,description:'Um peixe robusto, de escamas grandes, que gosta dos remansos.'},
 {id:'bagre',name:'Bagre',rarity:'uncommon',label:'Incomum',stock:'fish',weight:12,minCm:22,maxCm:55,maxGrams:3200,description:'Seus barbilhões ajudam a encontrar alimento entre pedras e galhos.'},
 {id:'truta',name:'Truta',rarity:'rare',label:'Raro',stock:'rareFish',weight:80,minCm:20,maxCm:48,maxGrams:2200,description:'Uma captura delicada, encontrada nas águas mais frescas.'},
 {id:'dourado',name:'Dourado',rarity:'very-rare',label:'Muito raro',stock:'rareFish',weight:20,minCm:35,maxCm:85,maxGrams:9000,description:'Forte e veloz, chama atenção pelas escamas douradas e nadadeiras alaranjadas.'},
] as const;
export type FishSpeciesId=typeof FISH_SPECIES[number]['id'];
export interface FishSpecimen {species:FishSpeciesId;lengthCm:number;weightGrams:number}
export const FISHING_TRASH=[
 {id:'rusty-can',name:'Lata enferrujada',item:'scrap',material:'sucata',description:'O metal ainda pode ser reaproveitado.'},
 {id:'soaked-branch',name:'Galho encharcado',item:'branch',material:'galho',description:'Um galho levado pela correnteza. Pode ser reaproveitado.'},
 {id:'old-boot',name:'Bota velha',item:'cloth',material:'tecido',description:'Não serve para calçar, mas rende retalhos para reaproveitar.'},
 {id:'tangled-rope',name:'Corda embolada',item:'cord',material:'corda',description:'Uma corda abandonada. Ainda dá para recuperar parte dela.'},
] as const;
export type FishingTrashId=typeof FISHING_TRASH[number]['id'];
export type FishingReward={kind:'fish';specimens:FishSpecimen[]}|{kind:'trash';id:FishingTrashId;quantity:1|2};
export interface FishingHaul {day:number;reward:FishingReward}
export const FISHING_TRASH_CHANCE=.12;
export const FISHING_HABITATS={lake:{rare:true,trash:.08},other:{rare:false,trash:.24}} as const;
export const fishSpecies=(id:FishSpeciesId)=>FISH_SPECIES.find(f=>f.id===id)!;
export const fishingTrash=(id:FishingTrashId)=>FISHING_TRASH.find(f=>f.id===id)!;
const fraction=(random:()=>number)=>Math.max(0,Math.min(1,random()));
export function rollFishingReward(rare:boolean,net:boolean,random:()=>number,trashChance=FISHING_TRASH_CHANCE,weightFor:(id:FishSpeciesId)=>number=()=>1):FishingReward {
 if(!rare&&fraction(random)<trashChance){const trash=FISHING_TRASH[Math.min(FISHING_TRASH.length-1,Math.floor(fraction(random)*FISHING_TRASH.length))];return{kind:'trash',id:trash.id,quantity:net?2:1};}
 const pool=FISH_SPECIES.filter(f=>(f.stock==='rareFish')===rare),total=pool.reduce((n,f)=>n+f.weight*weightFor(f.id),0),specimens:FishSpecimen[]=[];
 for(let i=0;i<(net?2:1);i++){
  let roll=fraction(random)*total;const species=pool.find(f=>{roll-=f.weight*weightFor(f.id);return roll<0;})??pool[pool.length-1];
  const lengthCm=Math.round((species.minCm+fraction(random)*(species.maxCm-species.minCm))*10)/10;
  const weightGrams=Math.max(1,Math.round(species.maxGrams*(lengthCm/species.maxCm)**3*(.9+fraction(random)*.2)));
  specimens.push({species:species.id,lengthCm,weightGrams});
 }
 return{kind:'fish',specimens};
}
export function fishingRewardItems(reward:FishingReward):Partial<Record<ItemId,number>> {
 if(reward.kind==='trash')return{[fishingTrash(reward.id).item]:reward.quantity};
 const items:Partial<Record<ItemId,number>>={};for(const fish of reward.specimens){const id=fishSpecies(fish.species).stock;items[id]=(items[id]??0)+1;}return items;
}
const record=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
export function validFishingReward(v:unknown):v is FishingReward {
 if(!record(v))return false;
 if(v.kind==='trash')return FISHING_TRASH.some(t=>t.id===v.id)&&(v.quantity===1||v.quantity===2);
 return v.kind==='fish'&&Array.isArray(v.specimens)&&v.specimens.length>=1&&v.specimens.length<=2&&v.specimens.every(f=>record(f)&&FISH_SPECIES.some(s=>s.id===f.species)&&typeof f.lengthCm==='number'&&Number.isFinite(f.lengthCm)&&f.lengthCm>0&&f.lengthCm<=1000&&typeof f.weightGrams==='number'&&Number.isInteger(f.weightGrams)&&f.weightGrams>0&&f.weightGrams<=1000000);
}
export function validFishingHaul(v:unknown):v is FishingHaul {return record(v)&&typeof v.day==='number'&&Number.isInteger(v.day)&&v.day>=1&&v.day<=999999&&validFishingReward(v.reward);}
export function fishingCatchIcon(id:FishSpeciesId|FishingTrashId):string {return `assets/visual/fishing/catches/${FISH_SPECIES.some(f=>f.id===id)?'fish':'trash'}.svg#${id}`;}
export const formatFishLength=(n:number)=>new Intl.NumberFormat('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1}).format(n)+' cm';
export const formatFishWeight=(n:number)=>n>=1000?new Intl.NumberFormat('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}).format(n/1000)+' kg':n+' g';
