import type {SaveData} from '../types';
import {toolCondition} from './economy';
/** Níveis da espada: improvisada (0), ferro, ouro e metal negro. */
export const SWORD_TIER_NAMES=['Espada improvisada','Espada de ferro','Espada de ouro','Espada de metal negro'] as const;
export const SWORD_TIER_FILES=['improvisada','ferro','ouro','metal-negro'] as const;
/** Quanto cada nível bate a mais que a improvisada. */
export const SWORD_POWER=[1,1.4,1.9,2.6] as const;
/** Cor do arco do golpe em cada nível: [miolo, rastro]. */
export const SWORD_SLASH:readonly (readonly [number,number])[]=[[0xd9d4c7,0x9a8f80],[0xe6eee2,0x87b9b5],[0xffe9a3,0xd4a647],[0xe7c6ff,0x8a4fc4]];
export const swordTier=(save:SaveData):number=>save.inventory.sword>0?toolCondition(save,'sword').tier:0;
export const swordDamage=(save:SaveData,base:number):number=>Math.round(base*SWORD_POWER[swordTier(save)]);
export const ownsWorldSword=(save:SaveData):boolean=>Number.isSafeInteger(save.inventory.sword)&&save.inventory.sword>0;
export const hasEquippedSword=(save:SaveData):boolean=>save.worldWeapon==='sword'&&ownsWorldSword(save);
/** Equipment references the stock item; changing hands never creates or consumes a sword. */
export function equipWorldSword(save:SaveData,equipped:boolean,write:(draft:SaveData)=>boolean):{ok:boolean;message:string}{
 if(equipped&&!ownsWorldSword(save))return{ok:false,message:'Fabrique a espada na bancada: 2 lâminas de sucata, 1 cabo e 1 corda. Você também precisa do martelo.'};
 const draft=structuredClone(save);draft.worldWeapon=equipped?'sword':'unarmed';
 try{if(!write(draft))return{ok:false,message:'Não foi possível salvar o equipamento. Tente novamente.'};}catch{return{ok:false,message:'Não foi possível salvar o equipamento. Tente novamente.'};}
 save.worldWeapon=draft.worldWeapon;return{ok:true,message:equipped?'Espada equipada · E ou clique ataca os hostis; na mina, Espaço também ataca.':'Espada guardada na mochila.'};
}
