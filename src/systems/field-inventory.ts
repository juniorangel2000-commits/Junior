import {equipWorldSword} from './world-sword';
import type {SaveData,ItemId} from '../types';
import {Inventory} from './inventory';
import {craft} from './crafting';
import {useConsumable} from './consumables';
type Result={ok:boolean;message:string};
type Writer=(draft:SaveData)=>boolean;
function persist(write:Writer,draft:SaveData):boolean{try{return write(draft);}catch{return false;}}
export function craftInField(save:SaveData,id:string,write:Writer):Result{
 const draft=structuredClone(save),inventory=new Inventory(draft.inventory),result=craft(id,inventory,false,draft.villageProgress);
 if(!result.ok)return result;draft.inventory={...inventory.data};
 if(!persist(write,draft))return{ok:false,message:'Não foi possível salvar. Os materiais foram preservados.'};
 save.inventory=draft.inventory;return result;
}
export function consumeInField(save:SaveData,item:ItemId,write:Writer):Result{
 if(item==='sword')return equipWorldSword(save,save.worldWeapon!=='sword',write);
 if(!['herb','bandage','herbalTonic','fungalInfusion','meal','oldMap'].includes(item))return{ok:false,message:'Este item é usado na propriedade ou funciona ao ser carregado na mochila.'};
 const draft=structuredClone(save),result=useConsumable(draft,item);if(!result.ok)return result;
 if(!persist(write,draft))return{ok:false,message:'Não foi possível salvar. O item foi preservado.'};
 save.inventory=draft.inventory;save.villageProgress=draft.villageProgress;return result;
}
