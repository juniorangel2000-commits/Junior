import {villageAccessUnlocked} from './village-introduction';
import type {SaveData,ItemId} from '../types';
import type {MerchantId,TradeSide} from '../data/village-commerce';
import {fisherAtLake} from '../data/fisher-schedule';
import {Inventory} from './inventory';
import {trade,type CommerceResult} from './commerce';
import {listVillageServices,performVillageService} from './village-services';
type Writer=(save:SaveData)=>boolean;
const persist=(draft:SaveData,write:Writer):boolean=>{try{return write(draft);}catch{return false;}};
const unavailable={ok:false as const,reason:'unavailable' as const,message:'Damião atende no lago das 08:00 às 11:30.'};
/** Save the complete draft before exposing inventory and wallet changes. */
export function fisherTrade(save:SaveData,merchant:MerchantId,side:TradeSide,item:ItemId,quantity:number,write:Writer):CommerceResult{
 if(!villageAccessUnlocked(save)||merchant!=='fisher'||!fisherAtLake(save.time))return unavailable;
 const draft=structuredClone(save),inventory=new Inventory(draft.inventory),result=trade(merchant,side,item,quantity,inventory,draft.villageEconomy!,draft.day);
 if(!result.ok)return result;draft.inventory={...inventory.data};
 if(!persist(draft,write))return{ok:false,reason:'invalid-economy',message:'Não foi possível salvar. A negociação foi cancelada.'};
 Object.assign(save,draft);return result;
}
export function fisherService(save:SaveData,id:string,write:Writer):{ok:boolean;message:string}{
 if(!villageAccessUnlocked(save)||!fisherAtLake(save.time)||!listVillageServices('damiao').some(s=>s.id===id))return unavailable;
 const draft=structuredClone(save),result=performVillageService(draft,id);if(!result.ok)return result;
 if(!persist(draft,write))return{ok:false,message:'Não foi possível salvar. O serviço foi cancelado.'};
 Object.assign(save,draft);return result;
}
