import {HARVEST_BASKET_COST,HARVEST_BASKET_FEE,HARVEST_BASKET_DESCRIPTION} from '../data/harvest-basket';
import {ITEMS} from '../data/items';
import {bentoAvailability} from './bento-schedule';
import {newFishingProgress,availableSpecimens,specimenPrice,fishingOrder,RODS,ROD_UPGRADES,rodControlLabel} from './fishing-progress';
import {fishSpecies} from '../data/fishing-catches';
import {fulfillContract,toolCondition,configureTool} from './economy';
import {ECONOMY_BALANCE as B} from '../data/economy-balance';
import type {SaveData,ItemId} from '../types';
import {Inventory} from './inventory';
import {createVillageProgress} from '../data/village-progress';
import {createVillageEconomy,MAX_COINS} from '../data/village-commerce';
import {FOREST_ANIMALS} from '../data/ancient-forest';
import {ECOLOGY_BALANCE as ECOLOGY} from '../data/ecology-balance';
import {inventoryToolCondition,repairInventoryTool} from './tool-instances';
export interface VillageServiceOffer{id:string;label:string;description:string;item?:ItemId;disabled?:boolean;actionLabel?:string}
type Service={npc:string;label:string;description:string;run:(s:SaveData,i:Inventory)=>void};
const services:Record<string,Service>={};
const add=(id:string,npc:string,label:string,description:string,run:Service['run'])=>{services[id]={npc,label,description,run};};
const requireThat=(ok:unknown,message:string)=>{if(!ok)throw Error(message);};
function pay(s:SaveData,i:Inventory,coins:number,items:Partial<Record<ItemId,number>>={}){requireThat(s.villageEconomy!.coins>=coins,'Coroas insuficientes.');requireThat(i.spend(items),'Faltam os materiais pedidos.');s.villageEconomy!.coins-=coins;}
function reward(s:SaveData,coins:number){requireThat(s.villageEconomy!.coins<=MAX_COINS-coins,'Sua carteira está cheia.');s.villageEconomy!.coins+=coins;}
add('learn-medicine','amelia','Aprender preparados medicinais','Entregue 1 erva rara para aprender curativos e tônicos.',(s,i)=>{const p=s.villageProgress!;requireThat(!p.recipes.includes('herbalTonic'),'Você já conhece estas receitas.');pay(s,i,0,{rareHerb:1});p.recipes.push('bandage','herbalTonic');});
add('learn-infusion','amelia','Aprender infusão de cogumelos','Entregue 3 ervas e 2 cogumelos para aprender uma infusão que recupera 50 de vigor.',(s,i)=>{requireThat(!s.villageProgress!.recipes.includes('fungalInfusion'),'Você já conhece esta receita.');pay(s,i,0,ECOLOGY.infusion.learnCost);s.villageProgress!.recipes.push('fungalInfusion');});
add('brew-infusion','amelia','Encomendar infusão','Traga 3 ervas e 2 cogumelos e pague 8 Coroas pelo preparo de uma infusão.',(s,i)=>{pay(s,i,ECOLOGY.infusion.serviceFee,ECOLOGY.infusion.cost);requireThat(i.transact({},ECOLOGY.infusion.output),'A mochila está cheia. Libere espaço antes de encomendar.');});
for(const plan of ['home','workshop','survivor'] as const)add(`plan-${plan}`,'tobias',`Projeto: ${plan==='home'?'casa':plan==='workshop'?'oficina':'base de sobreviventes'}`,'50 Coroas, 8 madeiras e 4 pedras. Libera um kit de materiais na fabricação.',(s,i)=>{const p=s.villageProgress!;requireThat(!p.plans.includes(plan),'Este projeto já foi aprendido.');pay(s,i,50,{wood:8,stone:4});p.plans.push(plan);p.recipes.push(`${plan}Kit`);});
add('learn-fertilizer','rosa','Aprender adubo','20 Coroas e 4 fibras. Libera a receita de fertilizante.',(s,i)=>{requireThat(!s.villageProgress!.recipes.includes('fertilizer'),'Receita já conhecida.');pay(s,i,20,{fiber:4});s.villageProgress!.recipes.push('fertilizer');});
add('contract-accept','rosa','Aceitar contrato de colheita','Entregue 10 nabos em até 3 dias e receba 220 Coroas. Um contrato por dia.',(s)=>{const p=s.villageProgress!,c=p.contract;requireThat(!c||c.day<s.day&&(c.completed||s.day>c.dueDay),'Conclua o contrato atual ou volte em outro dia.');requireThat(s.day<=999996,'O calendário atingiu o limite.');p.contract={day:s.day,dueDay:s.day+3,delivered:0,completed:false};});
add('contract-deliver','rosa','Entregar colheita','Aceita entregas parciais. A recompensa é paga uma única vez ao completar.',(s,i)=>{const c=s.villageProgress!.contract;requireThat(c&&!c.completed&&s.day<=c.dueDay,'Não há contrato ativo dentro do prazo.');const amount=Math.min(10-c!.delivered,i.data.turnip);requireThat(amount>0,'Traga nabos para entregar.');requireThat(i.spend({turnip:amount}),'Não foi possível separar os nabos.');c!.delivered+=amount;if(c!.delivered===10){reward(s,220);c!.completed=true;}});
add('buy-chicken','rosa','Acolher uma galinha','250 Coroas. A galinha irá para a propriedade, sem ocupar a mochila.',(s,i)=>{const animal=FOREST_ANIMALS.find(a=>a.kind==='chicken'&&!s.recruitedAnimals?.includes(a.id));requireThat(animal,'Todas as galinhas disponíveis já foram acolhidas.');pay(s,i,250);s.recruitedAnimals??=[];s.recruitedAnimals.push(animal!.id);s.animalPositions??={forest:[],property:[]};s.animalPositions.forest=s.animalPositions.forest.filter(p=>p.id!==animal!.id);s.animalPositions.property.push({id:animal!.id,x:688,y:624,direction:'down'});});
add('learn-tailoring','celina','Aprender costura','30 Coroas e 6 fibras. Libera botas, acessórios e mochilas.',(s,i)=>{requireThat(!s.villageProgress!.recipes.includes('backpack'),'Você já conhece a costura.');pay(s,i,30,{fiber:6});s.villageProgress!.recipes.push('boots','accessory','backpack');});
for(const look of ['female','male'] as const)add(`outfit-${look}`,'celina',`Vestir ${look==='female'?'fazendeira':'fazendeiro'}`,'10 Coroas e uma muda de roupa. Usa os personagens originais do jogo.',(s,i)=>{pay(s,i,10,{clothing:1});s.profile.characterId=look==='female'?'farmer-female':'farmer-male';s.villageProgress!.outfit=look;});
add('fishing-lesson','damiao','Aprender pesca','Primeira aula: 30 Coroas. Segunda: 60 Coroas e 3 peixes. Melhora capturas raras.',(s,i)=>{const p=s.villageProgress!;requireThat(p.fishingSkill<2,'Você já aprendeu as duas técnicas.');pay(s,i,p.fishingSkill?60:30,p.fishingSkill?{fish:3}:{});p.fishingSkill++;});
add('rare-fish-task','damiao','Entregar peixe raro','Damião paga 180 Coroas pela primeira espécie rara. Uma única entrega.',(s,i)=>{requireThat(!s.villageProgress!.rareFishTaskCompleted,'A pesquisa desta espécie já foi concluída.');pay(s,i,0,{rareFish:1});reward(s,180);s.villageProgress!.rareFishTaskCompleted=true;});
add('fishing-rod-upgrade','damiao','Melhorar vara','Reforçada: 100 C, 4 tábuas e 2 cordas. Equilibrada: 240 C, 6 tábuas e 2 peças metálicas. Amplia a faixa de controle.',(s,i)=>{const p=s.fishingProgress??=newFishingProgress();requireThat(i.has('fishingRod'),'Traga sua vara de pesca.');requireThat(p.rodTier<2,'Sua vara já está no último estágio.');const upgrade=ROD_UPGRADES[p.rodTier as 0|1];pay(s,i,upgrade.coins,upgrade.materials);p.rodTier=(p.rodTier+1) as 1|2;});
add('fishing-baits','damiao','Aprender novas iscas','40 C e 3 fibras. Aprenda massa caseira e isca de inseto. Escolha o preparo no diário; cada lançamento preparado usa 2 iscas.',(s,i)=>{const p=s.fishingProgress??=newFishingProgress();requireThat(!p.preparedBait,'Você já conhece estes preparos.');pay(s,i,40,{fiber:3});p.preparedBait=true;});
add('fishing-specimens-sell','damiao','Vender capturas registradas','Vende os peixes identificados que ainda estão na mochila. O valor considera espécie, raridade e tamanho; consulte o total no diário.',(s,i)=>{const p=s.fishingProgress??=newFishingProgress(),basket=availableSpecimens(s);requireThat(basket.length,'Você não tem capturas registradas na mochila.');const cost={fish:0,rareFish:0};for(const f of basket)cost[fishSpecies(f.species).stock]++;pay(s,i,0,cost);reward(s,basket.reduce((n,f)=>n+specimenPrice(f),0));p.basket=[];});
add('fishing-order','damiao','Encomenda de pesca do dia','Uma encomenda diferente por dia. Entregue a espécie solicitada para receber um pagamento especial. Veja a encomenda no diário.',(s,i)=>{const p=s.fishingProgress??=newFishingProgress(),order=fishingOrder(s.day),basket=availableSpecimens(s);requireThat(p.orderDay!==s.day,'A encomenda de hoje já foi entregue.');const selected=basket.filter(f=>f.species===order.species).slice(0,order.quantity);requireThat(selected.length===order.quantity,`Traga ${order.quantity} × ${fishSpecies(order.species).name} de suas capturas registradas.`);pay(s,i,0,{[fishSpecies(order.species).stock]:order.quantity});reward(s,order.reward);p.basket=basket.filter(f=>!selected.includes(f));p.orderDay=s.day;});
add('create-harvest-basket','helena','Preparar cesta de colheita',HARVEST_BASKET_DESCRIPTION,(s,i)=>{
 requireThat(s.villageEconomy!.coins>=HARVEST_BASKET_FEE,'São necessárias 20 Coroas para o preparo.');
 requireThat(i.canAfford(HARVEST_BASKET_COST),'Traga 1 cenoura, 1 morango e 1 milho da sua colheita.');
 requireThat(i.transact(HARVEST_BASKET_COST,{harvestBasket:1}),'Libere espaço na mochila antes de encomendar a cesta.');
 s.villageEconomy!.coins-=HARVEST_BASKET_FEE;
});
add('inn-rest','helena','Hospedar até as 08:00','40 Coroas. Recupera todo o vigor e avança até a manhã seguinte.',(s,i)=>{requireThat(s.day<999999,'O calendário atingiu o limite.');pay(s,i,40);s.day++;s.time=480;s.villageProgress!.vigor=100;});
add('inn-rumor','helena','Ouvir os rumores','Conheça pistas sobre a floresta e o acampamento de sobreviventes.',s=>{const p=s.villageProgress!;for(const id of ['forest-lake','survivor-camp'])if(!p.rumors.includes(id))p.rumors.push(id);});
for(const survivor of ['marina','rui'])add(`welcome-${survivor}`,'helena',`Receber ${survivor==='marina'?'Marina':'Rui'}`,'Prepare uma base (projeto de Tobias), 4 refeições e 8 tábuas para acolher este sobrevivente.',(s,i)=>{requireThat(s.villageProgress!.plans.includes('survivor'),'Aprenda o projeto de base com Tobias.');requireThat(!s.villageSurvivors?.includes(survivor),'Este sobrevivente já foi acolhido.');pay(s,i,0,{meal:4,plank:8});s.villageSurvivors??=[];s.villageSurvivors.push(survivor);});
add('learn-machines','icaro','Aprender iluminação e bombas','80 Coroas, 6 sucatas e 2 componentes eletrônicos. Libera luminárias e bombas.',(s,i)=>{requireThat(!s.villageProgress!.recipes.includes('waterPump'),'Projetos já conhecidos.');pay(s,i,80,{scrap:6,electronicPart:2});s.villageProgress!.recipes.push('lamp','waterPump');});
for(const c of B.contracts)add(`request-${c.npc}`,c.npc,'Quadro de pedidos',`${c.quantity} ${c.item}: ${c.reward} C. Renova a cada ${c.interval} dias.`,(s)=>{const r=fulfillContract(s,c.npc);requireThat(r.ok,r.message);});
for(const tool of ['hatchet','pickaxe','hoe','sickle','shovel'] as const)add(`repair-${tool}`,'bento',`Reparar ${tool}`,'20 C. Restaura a durabilidade do material atual.',(s,i)=>{requireThat(i.has(tool),'Traga a ferramenta.');const c=toolCondition(s,tool);requireThat(c.durability<B.durability[c.tier],'A ferramenta já está em bom estado.');pay(s,i,20);configureTool(s,tool,c.tier);});
for(const tool of ['hammer','handsaw','fishingRod','net'] as const)add(`repair-${tool}`,'bento',`Reparar ${{hammer:'martelo',handsaw:'serrote',fishingRod:'vara de pesca',net:'rede'}[tool]}`,'20 C. Repara somente a cópia selecionada.',(s,i)=>{requireThat(i.has(tool),'Traga a ferramenta.');requireThat(inventoryToolCondition(i.data,tool).durability<100,'A ferramenta já está em bom estado.');pay(s,i,20);repairInventoryTool(i.data,tool);});
add('shelter-carpentry','tobias','Preparar peças para a casinha','30 C, 2 troncos e 6 madeiras: recebe 6 tábuas regulares e 6 cavilhas.',(s,i)=>{pay(s,i,30,{log:2,wood:6});requireThat(i.transact({},{board:6,peg:6}),'Libere espaço na mochila.');});
add('shelter-textiles','celina','Preparar tecidos para os pets','20 C e 8 fibras: recebe 4 tecidos e 2 cordas.',(s,i)=>{pay(s,i,20,{fiber:8});requireThat(i.transact({},{cloth:4,cord:2}),'Libere espaço na mochila.');});
add('shelter-fittings','icaro','Preparar fixadores para a casinha','12 C e 4 sucatas: recebe 2 peças metálicas.',(s,i)=>{pay(s,i,12,{scrap:4});requireThat(i.transact({},{metalPart:2}),'Libere espaço na mochila.');});
export function listVillageServices(npc:string,save?:SaveData):VillageServiceOffer[]{
 return Object.entries(services).filter(([,s])=>s.npc===npc).map(([id,s])=>{
  const offer:VillageServiceOffer={id,label:s.label,description:s.description};if(!save)return offer;
  if(id==='create-harvest-basket'){
   offer.item='harvestBasket';offer.actionLabel='Preparar 1 cesta';
   offer.description=HARVEST_BASKET_DESCRIPTION+' Na mochila: '+Object.entries(HARVEST_BASKET_COST).map(([item,amount])=>`${ITEMS[item as ItemId].name}: ${save.inventory[item as ItemId]}/${amount}`).join(' · ')+'.';
   offer.disabled=(save.villageEconomy?.coins??0)<HARVEST_BASKET_FEE||!Object.entries(HARVEST_BASKET_COST).every(([item,amount])=>save.inventory[item as ItemId]>=amount);
  }
  const tier=save.fishingProgress?.rodTier??0,basket=availableSpecimens(save),order=fishingOrder(save.day);
  if(id==='fishing-rod-upgrade'){
   offer.label=tier<2?`Melhorar para ${RODS[tier+1]}`:RODS[tier];offer.disabled=tier===2;
   offer.description=tier<2?`${ROD_UPGRADES[tier as 0|1].description}. ${rodControlLabel(tier+1)}. A melhoria permanece na sua vara.`:'Sua vara já tem todas as melhorias.';
   offer.actionLabel=tier<2?'Melhorar vara':'Melhoria máxima';
  }
  if(id==='fishing-baits'){offer.disabled=!!save.fishingProgress?.preparedBait;offer.actionLabel=offer.disabled?'Preparos aprendidos':'Aprender preparos';}
  if(id==='fishing-specimens-sell'){
   offer.disabled=basket.length===0;offer.actionLabel='Vender capturas';
   offer.description=`${basket.length} peixe(s) identificado(s) na mochila · total ${basket.reduce((n,f)=>n+specimenPrice(f),0)} C. Vende todas essas capturas, com valor por espécie, raridade e tamanho.`;
  }
  if(id==='fishing-order'){
   offer.disabled=save.fishingProgress?.orderDay===save.day;offer.actionLabel=offer.disabled?'Entregue hoje':'Entregar encomenda';
   const held=basket.filter(f=>f.species===order.species).length;
   offer.description=`${order.quantity} × ${fishSpecies(order.species).name} · ${order.reward} C. Na mochila: ${Math.min(held,order.quantity)}/${order.quantity}. ${offer.disabled?'Entregue hoje.':'Uma entrega por dia.'}`;
  }
  return offer;
 });
}
export function performVillageService(save:SaveData,id:string):{ok:boolean;message:string}{
 const service=services[id];if(!service)return{ok:false,message:'Serviço desconhecido.'};
 if(service.npc==='bento'&&!bentoAvailability(save).open)return{ok:false,message:bentoAvailability(save).message};
 const draft=structuredClone(save);draft.villageProgress??=createVillageProgress();draft.villageEconomy??=createVillageEconomy();
 try{const inventory=new Inventory(draft.inventory);draft.inventory=inventory.data;service.run(draft,inventory);draft.inventory={...inventory.data};Object.assign(save,draft);return{ok:true,message:`${service.label}: concluído.`};}catch(error){return{ok:false,message:error instanceof Error?error.message:'Não foi possível concluir.'};}
}
