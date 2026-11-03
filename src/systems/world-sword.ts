import type {SaveData} from '../types';
export const ownsWorldSword=(save:SaveData):boolean=>Number.isSafeInteger(save.inventory.sword)&&save.inventory.sword>0;
export const hasEquippedSword=(save:SaveData):boolean=>save.worldWeapon==='sword'&&ownsWorldSword(save);
/** Equipment references the stock item; changing hands never creates or consumes a sword. */
export function equipWorldSword(save:SaveData,equipped:boolean,write:(draft:SaveData)=>boolean):{ok:boolean;message:string}{
 if(equipped&&!ownsWorldSword(save))return{ok:false,message:'Fabrique a espada na bancada: 2 lâminas de sucata, 1 cabo e 1 corda. Você também precisa do martelo.'};
 const draft=structuredClone(save);draft.worldWeapon=equipped?'sword':'unarmed';
 try{if(!write(draft))return{ok:false,message:'Não foi possível salvar o equipamento. Tente novamente.'};}catch{return{ok:false,message:'Não foi possível salvar o equipamento. Tente novamente.'};}
 save.worldWeapon=draft.worldWeapon;return{ok:true,message:equipped?'Espada equipada · E ou clique ataca os hostis; na mina, Espaço também ataca.':'Espada guardada na mochila.'};
}
