import {ECONOMY_BALANCE as B,NON_COMMERCIAL} from './economy-balance';
import type {ItemId,VillageEconomy} from '../types';

export type {VillageEconomy} from '../types';
export const MAX_COINS=999_999_999;
export const MAX_TRADE_QUANTITY=99;
export const VILLAGE_NPC_IDS=['augusto','bento','amelia','tobias','rosa','nilo','celina','damiao','helena','icaro'] as const;
export type VillageNpcId=typeof VILLAGE_NPC_IDS[number];
export type MerchantId='general'|'blacksmith'|'herbalist'|'carpenter'|'seeds'|'traveler'|'tailor'|'fisher'|'inn'|'mechanic';
export type TradeSide='buy'|'sell';
export interface Merchant {
  id:MerchantId;
  npcId:VillageNpcId;
  name:string;
  shop:string;
  description:string;
  /** Unit prices in coins. Items absent from a list cannot be traded here. */
  buy:Partial<Record<ItemId,number>>;
  sell:Partial<Record<ItemId,number>>;
}

/** Buying and immediately reselling, including common crafted outputs, never
 * creates coins. Harvests and gathered resources provide the initial income. */
export const MERCHANTS:Record<MerchantId,Merchant>={
  general:{
    id:'general',npcId:'augusto',name:'Augusto',shop:'Armazém do Augusto',
    description:'Um pouco do que a propriedade precisa. Augusto compra recursos e mantém uma seleção de suprimentos.',
    buy:{seeds:8,wood:8,stone:6,branch:4,fiber:4,cord:15},
    sell:{turnip:18,seeds:2,wood:2,stone:2,branch:1,fiber:1},
  },
  seeds:{
    id:'seeds',npcId:'rosa',name:'Rosa',shop:'Sementes da Rosa',
    description:'Sementes para recomeçar a horta. Rosa compra sua colheita e fibras recolhidas na mata.',
    buy:{seeds:8,fiber:4,cord:15},
    sell:{turnip:18,seeds:2,fiber:1,cord:3},
  },
  blacksmith:{
    id:'blacksmith',npcId:'bento',name:'Bento',shop:'Ferraria do Bento',
    description:'Ferramentas prontas para a propriedade. Bento também compra pedra e sucata.',
    buy:{hatchet:120,pickaxe:140,hoe:100,hammer:90,stone:6,scrap:12,flakedStone:14},
    sell:{stone:2,scrap:4,flakedStone:4},
  },
  herbalist:{
    id:'herbalist',npcId:'amelia',name:'Amélia',shop:'Ervas da Amélia',
    description:'Amélia conhece a vegetação da região e negocia sementes, fibras e cordas vegetais.',
    buy:{fiber:4,seeds:9,cord:16},
    sell:{fiber:1,seeds:2,cord:3},
  },
  carpenter:{
    id:'carpenter',npcId:'tobias',name:'Tobias',shop:'Carpintaria do Tobias',
    description:'Madeira e peças para construir. Tobias compra os materiais que sobram das suas coletas.',
    buy:{handsaw:180,wood:8,branch:4,log:24,plank:12,board:18,handle:10,peg:3},
    sell:{wood:2,branch:1,log:6,plank:3,board:5,handle:2,peg:1},
  },
  traveler:{
    id:'traveler',npcId:'nilo',name:'Nilo',shop:'Antiguidades do Nilo',
    description:'Nilo traz ferramentas e materiais de outras regiões e compra o que pode levar na viagem.',
    buy:{handsaw:195,board:20,scrap:13,cord:18,hoe:110,flakedStone:15},
    sell:{scrap:4,board:5,wood:2,turnip:18},
  },
  tailor:{
    id:'tailor',npcId:'celina',name:'Celina',shop:'Ateliê da Celina',
    description:'No ateliê, Celina negocia as fibras e cordas usadas em trabalhos manuais.',
    buy:{cord:15,fiber:4},sell:{fiber:1,cord:3},
  },
  fisher:{
    id:'fisher',npcId:'damiao',name:'Damião',shop:'Cabana do Damião',
    description:'Damião conhece os rios e negocia galhos, fibras e cordas para preparar equipamentos.',
    buy:{branch:4,cord:15,fiber:4},sell:{branch:1,fiber:1,cord:3},
  },
  inn:{
    id:'inn',npcId:'helena',name:'Helena',shop:'Pousada da Helena',
    description:'Helena compra os nabos da sua horta para abastecer a cozinha da pousada.',
    buy:{turnip:36,wood:10},sell:{turnip:18,wood:2},
  },
  mechanic:{
    id:'mechanic',npcId:'icaro',name:'Ícaro',shop:'Oficina do Ícaro',
    description:'Sucata ganha utilidade nas mãos de Ícaro. A oficina negocia peças metálicas e martelos.',
    buy:{scrap:12,blade:30,hammer:100},sell:{scrap:4,blade:10},
  },
};

Object.assign(MERCHANTS.general.buy,{meal:28,lantern:95,bait:3});
Object.assign(MERCHANTS.herbalist.buy,{herb:6,bandage:18,herbalTonic:40});
Object.assign(MERCHANTS.herbalist.sell,{herb:2,rareHerb:25});
Object.assign(MERCHANTS.seeds.buy,{fertilizer:22});
Object.assign(MERCHANTS.fisher.buy,{fishingRod:70,bait:3,net:120,fish:18});
Object.assign(MERCHANTS.fisher.sell,{fish:8,rareFish:45});
Object.assign(MERCHANTS.tailor.buy,{cloth:8,clothing:25,boots:95,backpack:150,accessory:70});
Object.assign(MERCHANTS.inn.buy,{meal:28});Object.assign(MERCHANTS.inn.sell,{fish:8});
Object.assign(MERCHANTS.mechanic.buy,{metalPart:16,electronicPart:35,lantern:100});
Object.assign(MERCHANTS.traveler.buy,{oldMap:80,rareHerb:80,electronicPart:45,net:140});

// Canonical 6.0 catalogues supersede only incompatible earlier commercial offers.
MERCHANTS.blacksmith.buy={scrap:12};MERCHANTS.blacksmith.sell={scrap:4,blade:10};
MERCHANTS.traveler.buy={oldMap:80};MERCHANTS.traveler.sell={oldMap:20};
MERCHANTS.traveler.description='Compra e vende antiguidades encontradas na região.';
MERCHANTS.herbalist.description='Ervas, cogumelos, plantas medicinais e preparados para exploração.';
Object.assign(MERCHANTS.herbalist.sell,{mushroom:4});
Object.assign(MERCHANTS.carpenter.buy,{furniture:180,doorKit:90,windowKit:70,fenceKit:25});
Object.assign(MERCHANTS.carpenter.sell,{furniture:100,doorKit:40,windowKit:30,fenceKit:10});
MERCHANTS.general.buy.plank=18;
for(const merchant of Object.values(MERCHANTS)){
 for(const item of NON_COMMERCIAL){delete merchant.buy[item as ItemId];delete merchant.sell[item as ItemId];}
 for(const [item,prices]of Object.entries(B.prices)){
  if(Object.hasOwn(merchant.buy,item))merchant.buy[item as ItemId]=prices![0];
  if(Object.hasOwn(merchant.sell,item))merchant.sell[item as ItemId]=prices![1];
 }
 for(const item of ['turnip','fish'] as ItemId[])if(merchant.sell[item])merchant.sell[item]=item==='turnip'?8:18;
 if(merchant.buy.fish)merchant.buy.fish=35;
}
for(const item of ['ironShard','ironIngot','goldShard','goldIngot','blackMetalIngot'] as ItemId[])MERCHANTS.blacksmith.buy[item]=B.prices[item]![0];
for(const item of ['ironShard','ironIngot','goldShard','goldIngot','blackMetalShard','blackMetalIngot'] as ItemId[])MERCHANTS.blacksmith.sell[item]=B.prices[item]![1];
const validDay=(day:number):boolean=>Number.isSafeInteger(day)&&day>=1&&day<=999_999;

/** The calendar, not wall-clock randomness, controls availability and stock.
 * Reopening a shop or reloading a save cannot reroll today's offers. */
export function isMerchantOpen(id:string,day=1):boolean {
  return Object.hasOwn(MERCHANTS,id)&&validDay(day);
}

export function merchantSchedule(id:string):string {
  if(!Object.hasOwn(MERCHANTS,id))return 'Comércio indisponível.';
  return id==='blacksmith'?'Venda de minerais liberada no dia 31. Serviços disponíveis desde o início.':'Aberto todos os dias.';
}

function rotatingOffers(offers:Merchant['buy'],count:number,day:number,salt:number):Merchant['buy'] {
  const entries=Object.entries(offers);let seed=(Math.imul(day,salt)^0x9e3779b9)>>>0;
  for(let i=entries.length-1;i>0;i--){
    seed=(Math.imul(seed,1664525)+1013904223)>>>0;
    const j=seed%(i+1);[entries[i],entries[j]]=[entries[j],entries[i]];
  }
  return Object.fromEntries(entries.slice(0,count));
}

/** Closed merchants remain identifiable for dialogue and schedule labels, but
 * advertise no offers. Only the rotating shops return a derived catalogue. */
export function getMerchant(id:string,day=1):Merchant|undefined {
  if(!Object.hasOwn(MERCHANTS,id)||!validDay(day))return undefined;
  const merchant=MERCHANTS[id as MerchantId];
  if(!isMerchantOpen(id,day))return {...merchant,buy:{},sell:{}};
  if(id==='general')return {...merchant,buy:rotatingOffers(merchant.buy,4,day,73856093)};
  if(id==='blacksmith'&&day<B.mineralTradeDay)return {...merchant,buy:{}};
  return merchant;
}

export function unitPrice(merchantId:string,side:TradeSide,item:ItemId,day=1):number|undefined {
  const merchant=getMerchant(merchantId,day);
  if(!merchant||(side!=='buy'&&side!=='sell'))return undefined;
  return Object.hasOwn(merchant[side],item)?merchant[side][item]:undefined;
}

export function createVillageEconomy():VillageEconomy {return {coins:B.initialCrowns,met:[]};}

export function validateVillageEconomy(value:unknown):value is VillageEconomy {
  if(typeof value!=='object'||value===null||Array.isArray(value))return false;
  const economy=value as VillageEconomy;
  return Number.isSafeInteger(economy.coins)&&economy.coins>=0&&economy.coins<=MAX_COINS
    &&Array.isArray(economy.met)&&economy.met.length<=VILLAGE_NPC_IDS.length
    &&new Set(economy.met).size===economy.met.length
    &&(economy.stock===undefined||typeof economy.stock==='object'&&economy.stock!==null&&!Array.isArray(economy.stock)&&Object.entries(economy.stock).every(([id,r])=>{const spec=B.stock[id as keyof typeof B.stock];return !!spec&&!!r&&Number.isSafeInteger(r.cycle)&&r.cycle>=0&&Number.isSafeInteger(r.remaining)&&r.remaining>=0&&r.remaining<=spec.quantity&&Number.isSafeInteger(r.bought)&&r.bought>=0&&r.remaining+r.bought===spec.quantity;}))
    &&economy.met.every(id=>(VILLAGE_NPC_IDS as readonly string[]).includes(id));
}

/** First introductions have no coin reward and are idempotent after reloading. */
export function meetVillager(economy:VillageEconomy,npcId:string):boolean {
  if(!validateVillageEconomy(economy)||!(VILLAGE_NPC_IDS as readonly string[]).includes(npcId)||economy.met.includes(npcId))return false;
  economy.met.push(npcId);return true;
}
