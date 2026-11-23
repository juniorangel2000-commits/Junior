import type {SaveData,TilePoint} from '../types';
import {ITEM_NAMES} from '../data/items';
import {COAST_SHORE_POINTS,coastBaseWater} from '../data/coast';
import {Inventory} from './inventory';

/** Coisas para recolher nos cenários novos (preview.47): conchas na areia da Costa e as íris
 * azuis das lagoas do Pântano. Cada ponto volta depois de alguns dias, como as frutas do Pomar. */
export type ForageItem='shell'|'blueIris'|'sand';
export interface ForageSpot{id:string;area:'coast'|'swamp';item:ForageItem;x:number;y:number;regrow:number;amount?:number}
const T=32;
/** Conchas: uma a cada 9 pontos da linha da praia, um pouco para dentro da areia. */
const SHELLS:ForageSpot[]=COAST_SHORE_POINTS.filter((_,i)=>i%9===4).slice(0,12).map((p,i)=>({
 id:`shell-${i}`,area:'coast',item:'shell',x:Math.round(p.x-p.nx*34),y:Math.round(p.y-p.ny*34),regrow:2,
}));
/** Íris: as três plantas do Pântano (src/data/swamp.ts); a flor colhida volta em uma semana. */
const IRISES:ForageSpot[]=[[11,39],[85,12],[87,38]].map(([x,y],i)=>({id:`iris-${i}`,area:'swamp',item:'blueIris',x:(x+.5)*T,y:(y+.5)*T+10,regrow:7}));
/** Areia (preview.48): montinhos secos na praia, 2 por ponto, de volta no dia seguinte. Vira vidro no Bento. */
const dry=(x:number,y:number)=>[[0,0],[20,0],[-20,0],[0,20],[0,-20]].every(([dx,dy])=>!coastBaseWater(x+dx,y+dy));
const SANDS:ForageSpot[]=COAST_SHORE_POINTS.map(p=>({x:Math.round(p.x-p.nx*64),y:Math.round(p.y-p.ny*64)})).filter((p,i)=>i%6===1&&dry(p.x,p.y)).slice(0,12).map((p,i)=>({
 id:`sand-${i}`,area:'coast',item:'sand',x:p.x,y:p.y,regrow:1,amount:2,
}));
export const FORAGE_SPOTS:readonly ForageSpot[]=[...SHELLS,...IRISES,...SANDS];
export const forageSpotsIn=(area:string)=>FORAGE_SPOTS.filter(s=>s.area===area);
export const forageReady=(s:Pick<SaveData,'day'|'forageHarvest'>,spot:ForageSpot)=>{const d=s.forageHarvest?.[spot.id];return d===undefined||s.day-d>=spot.regrow;};
const REACH=44;
export function forageNear(s:Pick<SaveData,'day'|'forageHarvest'>,area:string,p:TilePoint):ForageSpot|undefined{
 return forageSpotsIn(area).filter(spot=>forageReady(s,spot)&&Math.hypot(spot.x-p.x,spot.y-p.y)<REACH).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];
}
export function collectForage(save:SaveData,spot:ForageSpot,player:TilePoint,write:(draft:SaveData)=>boolean):string{
 if(save.activeArea!==spot.area||Math.hypot(spot.x-player.x,spot.y-player.y)>=REACH||!forageReady(save,spot))return 'Já foi recolhido ou está longe.';
 const inv=new Inventory(save.inventory);
 if(!inv.transact({},{[spot.item]:spot.amount??1}))return 'A mochila está cheia.';
 const draft={...save,inventory:inv.data,forageHarvest:{...save.forageHarvest,[spot.id]:save.day}};
 if(!write(draft))return 'Não foi possível salvar.';
 save.inventory=draft.inventory;save.forageHarvest=draft.forageHarvest;
 return `${spot.amount&&spot.amount>1?spot.amount+' × ':''}${ITEM_NAMES[spot.item]} na mochila.`;
}
export function validForageHarvest(v:unknown,day:number):boolean{
 if(v===undefined)return true;
 if(!v||typeof v!=='object'||Array.isArray(v))return false;
 return Object.entries(v).every(([id,d])=>FORAGE_SPOTS.some(s=>s.id===id)&&Number.isSafeInteger(d)&&(d as number)>=1&&(d as number)<=day);
}
