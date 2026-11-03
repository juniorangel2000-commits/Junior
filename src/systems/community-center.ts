import type {SaveData,InventoryData,ItemId} from '../types';
import {Inventory} from './inventory';
export interface CommunityCenterData {stage:0|1|2|3;delivered?:Partial<InventoryData>}
export type CommunityAction={kind:'deliver';item:ItemId;amount:number}|{kind:'upgrade'};
export const COMMUNITY_STEPS:readonly {name:string;description:string;cost:Partial<InventoryData>}[]=[
 {name:'Limpar e preparar',description:'Remover os entulhos, firmar a base e preparar o piso.',cost:{stone:16,plank:12,cord:4}},
 {name:'Reparar a estrutura',description:'Reforçar paredes, portas e telhado para tornar o prédio seguro.',cost:{board:16,peg:24,metalPart:4}},
 {name:'Preparar o alojamento',description:'Montar as camas e organizar os suprimentos para receber oito moradores.',cost:{cloth:12,fiber:24,meal:8}},
];
/** Old recruited groups keep their home; visiting an old camp alone grants no unlock. */
export function communityStage(save:Pick<SaveData,'communityCenter'|'survivorCamp'>):CommunityCenterData['stage']{
 return save.communityCenter?.stage??((save.survivorCamp?.residents.length??0)>0?3:0);
}
export const communityReady=(save:Pick<SaveData,'communityCenter'|'survivorCamp'>)=>communityStage(save)===3;
export function validCommunityCenter(value:unknown):value is CommunityCenterData{
 if(!value||typeof value!=='object'||Array.isArray(value))return false;const c=value as CommunityCenterData;
 if(!Number.isInteger(c.stage)||c.stage<0||c.stage>3)return false;
 const cost:Partial<InventoryData>=COMMUNITY_STEPS[c.stage]?.cost??{};
 return c.delivered===undefined||!!c.delivered&&typeof c.delivered==='object'&&!Array.isArray(c.delivered)&&Object.entries(c.delivered).every(([id,n])=>Object.hasOwn(cost,id)&&Number.isSafeInteger(n)&&n>=0&&n<=cost[id as ItemId]!);
}
export function communityRemaining(save:SaveData):Partial<InventoryData>{
 return Object.fromEntries(Object.entries(COMMUNITY_STEPS[communityStage(save)]?.cost??{}).map(([id,n])=>[id,n!-(save.communityCenter?.delivered?.[id as ItemId]??0)]));
}
/** Commit stock and progress together only after the durable write succeeds. */
export function repairCommunity(save:SaveData,action:CommunityAction,write:(draft:SaveData)=>boolean):{ok:boolean;message:string}{
 const draft=structuredClone(save),stage=communityStage(draft);
 if(stage===3)return{ok:false,message:'O centro comunitário já está pronto.'};
 draft.communityCenter??={stage,delivered:{}};
 const center=draft.communityCenter,remaining=communityRemaining(draft),inventory=new Inventory(draft.inventory);
 if(action.kind==='deliver'){
  const n=remaining[action.item];
  if(n===undefined||!Number.isSafeInteger(action.amount)||action.amount<1||action.amount>n)return{ok:false,message:'Escolha uma quantidade válida para um material desta etapa.'};
  if(!inventory.spend({[action.item]:action.amount}))return{ok:false,message:'Você não tem essa quantidade na mochila.'};
  center.delivered={...center.delivered,[action.item]:(center.delivered?.[action.item]??0)+action.amount};
 }else{
  if(!inventory.has('hammer'))return{ok:false,message:'Traga um martelo para concluir a etapa. Ele não será consumido.'};
  if(!inventory.spend(remaining))return{ok:false,message:'Ainda faltam materiais para concluir esta etapa.'};
  center.stage=(stage+1) as CommunityCenterData['stage'];center.delivered={};
 }
 draft.inventory={...inventory.data};
 try{if(!write(draft))return{ok:false,message:'Não foi possível salvar. Os materiais e a reforma foram preservados.'};}catch{return{ok:false,message:'Não foi possível salvar. Nenhum material foi consumido.'};}
 save.communityCenter=center;save.inventory=draft.inventory;
 return{ok:true,message:action.kind==='deliver'?'Material entregue e guardado.':center.stage===3?'Centro comunitário pronto! O interior, o acampamento e o recrutamento estão liberados.':`${COMMUNITY_STEPS[stage].name}: concluído.`};
}
