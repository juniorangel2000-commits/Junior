import type {SaveData,ItemId,TilePoint} from '../types';
import {Inventory} from './inventory';
import {createVillageProgress} from '../data/village-progress';
export const USABLE_VILLAGE_ITEMS:ItemId[]=['furniture','doorKit','windowKit','fenceKit','sickle','shovel','forge','herb','bandage','herbalTonic','meal','oldMap','fertilizer','lamp','waterPump','fishingRod','net'];
export function useConsumable(s:SaveData,item:ItemId,point?:TilePoint,blocked?: (x:number,y:number)=>boolean):{ok:boolean;message:string}{
 const p=s.villageProgress??createVillageProgress(),i=new Inventory(s.inventory);
 if(!i.has(item))return{ok:false,message:'Você não possui este item.'};
 const healing:Partial<Record<ItemId,number>>={herb:10,bandage:30,herbalTonic:70,meal:50};
 if(healing[item]){if(p.vigor>=100)return{ok:false,message:'Seu vigor já está completo.'};i.spend({[item]:1});p.vigor=Math.min(100,p.vigor+healing[item]!);}
 else if(item==='oldMap'){if(p.rumors.includes('old-ruins'))return{ok:false,message:'Você já conhece estas anotações.'};i.spend({oldMap:1});p.rumors.push('old-ruins');}
 else if(item==='fertilizer') {const crop=point&&s.crops.find(c=>c.x===point.x&&c.y===point.y);if(!crop||crop.growth>=1)return{ok:false,message:'Fique ao lado de um canteiro plantado em crescimento.'};i.spend({fertilizer:1});crop.growth=Math.min(1,crop.growth+.2);crop.watered=true;}
 else if(item==='lamp'||item==='waterPump'||item==='forge') {if(s.activeArea==='forest'||s.activeArea==='village'||!point||point.x<1||point.x>94||point.y<1||point.y>70||blocked?.(point.x,point.y)||s.crops.some(c=>c.x===point.x&&c.y===point.y)||s.villageInstallations?.some(c=>c.x===point.x&&c.y===point.y))return{ok:false,message:'Escolha chão livre na propriedade para instalar.'};if((s.villageInstallations?.length??0)>=64)return{ok:false,message:'Limite de equipamentos atingido.'};i.spend({[item]:1});s.villageInstallations??=[];s.villageInstallations.push({kind:item==='lamp'?'lamp':item==='forge'?'forge':'pump',...point});}
 else return{ok:false,message:'Este equipamento funciona ao ser carregado na mochila.'};
 s.villageProgress=p;s.inventory={...i.data};return{ok:true,message:item==='oldMap'?'Pista descoberta: ruínas antigas.':item==='lamp'||item==='waterPump'||item==='forge'?'Equipamento instalado.':'Item utilizado.'};
}
