import {DISH_RECIPES,DISH_IDS} from '../data/kitchen';
import {fertilizeCrop} from './farming';
import type {SaveData,ItemId,TilePoint} from '../types';
import {Inventory} from './inventory';
import {createVillageProgress} from '../data/village-progress';
import {plantTree} from './tree-growth';
import {ECOLOGY_BALANCE as B} from '../data/ecology-balance';
import {applyDishEffect} from './food-effects';
import {DISH_EFFECT} from './food-effects';
import {takeBest,QUALITY_FACTOR,qualityName,type Quality} from './item-quality';
export const USABLE_VILLAGE_ITEMS:ItemId[]=[...DISH_IDS,'cheesePress','butterChurn','spinningWheel','loom','stoneMill','milk','goatMilk','wool','yarn','wheat','corn','oat','sword','furniture','doorKit','windowKit','fenceKit','sickle','shovel','forge','herb','bandage','herbalTonic','fungalInfusion','oakSeed','pineSeed','meal','oldMap','fertilizer','lamp','waterPump','fishingRod','net'];
export function useConsumable(s:SaveData,item:ItemId,point?:TilePoint,blocked?: (x:number,y:number)=>boolean):{ok:boolean;message:string}{
 if(item==='harvestBasket')return{ok:false,message:'Use a cesta nos Campos Abertos: ela fica no chão para o cavalo selvagem.'};
 if(item==='oakSeed'||item==='pineSeed')return point?plantTree(s,item,point,blocked??(()=>true)):{ok:false,message:'Escolha terra livre para plantar.'};
 const p=s.villageProgress??createVillageProgress(),i=new Inventory(s.inventory);let quality:Quality=0,gained=0;
 if(!i.has(item))return{ok:false,message:'Você não possui este item.'};
 const healing:Partial<Record<ItemId,number>>={herb:10,bandage:30,herbalTonic:70,fungalInfusion:B.infusion.vigor,meal:50,...Object.fromEntries(DISH_RECIPES.map(r=>[r.id,r.vigor]))};
 if(healing[item]){const health=s.mineInterior?s.underground?.hazards:undefined;if(p.vigor>=100&&(!health||health.hp>=100)&&!DISH_EFFECT[item])return{ok:false,message:'Seu vigor já está completo.'};quality=takeBest(s,item,i.data[item],1)[0]??0;const amount=Math.round(healing[item]!*QUALITY_FACTOR[quality]);gained=amount;if(health)health.hp=Math.min(100,health.hp+amount);i.spend({[item]:1});p.vigor=Math.min(100,p.vigor+amount);}
 else if(item==='oldMap'){const recipe=!p.recipes.includes('honeyCake');if(p.rumors.includes('old-ruins')&&!recipe)return{ok:false,message:'Você já conhece estas anotações.'};i.spend({oldMap:1});if(!p.rumors.includes('old-ruins'))p.rumors.push('old-ruins');if(recipe)p.recipes.push('honeyCake');}
 else if(item==='fertilizer') {const crop=point&&s.crops.find(c=>c.x===point.x&&c.y===point.y);if(!crop||crop.growth>=1)return{ok:false,message:'Fique ao lado de um canteiro plantado em crescimento.'};i.spend({fertilizer:1});fertilizeCrop(crop,s.day);}
 else if(item==='lamp'||item==='waterPump'||item==='forge') {if(s.activeArea==='forest'||s.activeArea==='village'||!point||point.x<1||point.x>94||point.y<1||point.y>70||blocked?.(point.x,point.y)||s.crops.some(c=>c.x===point.x&&c.y===point.y)||s.villageInstallations?.some(c=>c.x===point.x&&c.y===point.y))return{ok:false,message:'Escolha chão livre na propriedade para instalar.'};if((s.villageInstallations?.length??0)>=64)return{ok:false,message:'Limite de equipamentos atingido.'};i.spend({[item]:1});s.villageInstallations??=[];s.villageInstallations.push({kind:item==='lamp'?'lamp':item==='forge'?'forge':'pump',...point});}
 else return{ok:false,message:'Este equipamento funciona ao ser carregado na mochila.'};
 s.villageProgress=p;s.inventory={...i.data};const dish=DISH_RECIPES.find(r=>r.id===item);if(dish)return{ok:true,message:`${qualityName(item,quality)}: +${gained} de vigor.`+applyDishEffect(s,item)};
 return{ok:true,message:item==='oldMap'?'Pista descoberta: ruínas antigas. No verso do mapa há uma receita: Bolo de mel, anotada no caderno.':item==='lamp'||item==='waterPump'||item==='forge'?'Equipamento instalado.':'Item utilizado.'};
}
