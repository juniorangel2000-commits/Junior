import type {SaveData,TilePoint} from '../types';
import {Inventory} from './inventory';
/** Missing in older saves: their already available world remains available. */
export const villageAccessUnlocked=(save:{damiaoIntroduction?:boolean}):boolean=>save.damiaoIntroduction!==false;
export const needsDamiaoIntroduction=(save:{damiaoIntroduction?:boolean}):boolean=>save.damiaoIntroduction===false;
export const VILLAGE_LOCK_MESSAGE='Passagem fechada · converse com Damião na cabana do lago.';
export const DAMIAO_INTRODUCTION=[
 'Olá, viajante. Sou Damião. Esta cabana é meu ponto de pesca. Veio da propriedade abandonada, ao sul do lago?',
 'Há uma vila à direita da sua propriedade, a leste. Siga por aquele caminho para encontrar os outros moradores e seus comércios.',
 'Leve esta vara de pesca: é um presente para começar sua vida por aqui. Vou liberar a passagem para a vila. Quando quiser aprender a pescar, peça uma aula comigo.',
];
export function receiveDamiaoIntroduction(save:SaveData,write:(draft:SaveData)=>boolean):{ok:boolean;message:string}{
 if(!needsDamiaoIntroduction(save)||save.activeArea!=='fishingLake')return{ok:false,message:'Este presente já foi recebido ou Damião não está por perto.'};
 const draft=structuredClone(save),inventory=new Inventory(draft.inventory);
 if(!inventory.transact({},{fishingRod:1}))return{ok:false,message:'Libere um espaço na mochila para receber a vara. A passagem será liberada junto com o presente.'};
 draft.inventory={...inventory.data};draft.damiaoIntroduction=true;
 if(!write(draft))return{ok:false,message:'Não foi possível salvar. A vara e a liberação da passagem foram canceladas; tente novamente.'};
 Object.assign(save,draft);return{ok:true,message:'Você recebeu uma vara de pesca! A vila, à direita da propriedade, está liberada.'};
}
export function invitationGate(area:'property'|'cityForest',exit?:TilePoint):{x:number;y:number;vertical:boolean}{
 const p=exit??(area==='property'?{x:94,y:52}:{x:48,y:70});
 return area==='property'?{x:(p.x-.5)*32,y:(p.y+.5)*32,vertical:true}:{x:(p.x+.5)*32,y:(p.y-.5)*32,vertical:false};
}
export function invitationGateBlocked(save:{damiaoIntroduction?:boolean},area:'property'|'cityForest',x:number,y:number,exit?:TilePoint):boolean{
 if(villageAccessUnlocked(save))return false;const gate=invitationGate(area,exit);
 return gate.vertical?Math.abs(x-gate.x)<7&&Math.abs(y-gate.y)<55:Math.abs(y-gate.y)<7&&Math.abs(x-gate.x)<55;
}
