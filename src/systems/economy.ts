import {validateVillageEconomy} from '../data/village-commerce';
import type {SaveData,ItemId,VillageEconomy} from '../types';
import {Inventory,type ItemCost} from './inventory';
import {ECONOMY_BALANCE as B,METALS,TOOL_IDS,shard,ore,ingot,type Metal,type EconomicTool} from '../data/economy-balance';
export interface ToolCondition {tier:number;durability:number;work?:number}
export interface CraftOrder {id:number;station?:'bento'|'own';kind:'tool'|'smelt';tool?:EconomicTool;metal:Metal;tier:number;quantity:number;materials:ItemCost;fee:number;phase:'reserved'|'working'|'collected'|'cancelled';createdAt:number;readyAt:number;notified?:boolean}
export interface EconomyState {version:6;sequence:number;tools:Partial<Record<EconomicTool,ToolCondition>>;orders:CraftOrder[];contracts:Record<string,{cycle:number;completed:boolean}>;mined:Partial<Record<Metal,number>>}
export interface StockRecord {cycle:number;remaining:number;bought:number}
export function newEconomyState():EconomyState{return{version:6,sequence:0,tools:{},orders:[],contracts:{},mined:{}};}
export const gameMinute=(s:Pick<SaveData,'day'|'time'>)=>(s.day-1)*1440+s.time;
export function stockInfo(e:VillageEconomy,item:ItemId,day:number):{remaining:number;nextDay:number;cycle:number}{
 const spec=B.stock[item as keyof typeof B.stock];if(!spec||day<31)return{remaining:0,nextDay:31,cycle:-1};
 const cycle=Math.floor((day-31)/spec.interval),stored=e.stock?.[item];
 return{remaining:stored?.cycle===cycle?stored.remaining:spec.quantity,nextDay:31+(cycle+1)*spec.interval,cycle};
}
export function toolCondition(s:SaveData,tool:EconomicTool):ToolCondition {return s.economy6?.tools[tool]??{tier:0,durability:B.durability[0]};}
export function configureTool(s:SaveData,tool:EconomicTool,tier:number):void{(s.economy6??=newEconomyState()).tools[tool]={tier,durability:B.durability[tier]};}
export function toolWork(s:SaveData,tool:EconomicTool):number{const c=toolCondition(s,tool);return Math.floor(B.efficiency[c.tier]+(c.work??0));}
export function spendDurability(s:SaveData,tool:EconomicTool):boolean{const c=toolCondition(s,tool);if(c.durability<=0)return false;(s.economy6??=newEconomyState()).tools[tool]={...c,durability:c.durability-1,work:(B.efficiency[c.tier]+(c.work??0))%1};return true;}
const need=(ok:unknown,message:string)=>{if(!ok)throw Error(message);};
export function atomicEconomy(s:SaveData,change:(d:SaveData,i:Inventory)=>void):{ok:boolean;message:string}{
 if(s.villageEconomy&&!validateVillageEconomy(s.villageEconomy)||s.economy6&&!validateEconomyState(s.economy6))return{ok:false,message:'Dados econômicos inválidos. Nenhum recurso foi alterado.'};
 const d=structuredClone(s);d.economy6??=newEconomyState();d.villageEconomy??={coins:100,met:[]};
 try{const i=new Inventory(d.inventory);change(d,i);d.inventory={...i.data};Object.assign(s,d);return{ok:true,message:'Operação concluída.'};}catch(e){return{ok:false,message:e instanceof Error?e.message:'Operação recusada.'};}
}
function smeltCost(i:Inventory,m:Metal,q:number):ItemCost {const whole=Math.min(i.data[ore(m)],q),fragments=(q-whole)*B.fragmentsPerIngot;need(i.has(shard(m),fragments),'Materiais insuficientes. São necessários nove fragmentos ou um minério inteiro por lingote.');return{[ore(m)]:whole,[shard(m)]:fragments};}
export function selfSmelt(s:SaveData,m:Metal,q:number,nearForge:boolean){return atomicEconomy(s,(_d,i)=>{need(nearForge,'Aproxime-se de uma forja própria instalada.');need(METALS.includes(m)&&Number.isSafeInteger(q)&&q>0&&q<=99,'Quantidade inválida.');need(i.transact(smeltCost(i,m,q),{[ingot(m)]:q}),'Sem espaço na mochila.');});}
export function startOwnSmelt(s:SaveData,m:Metal,q:number){return atomicEconomy(s,(d,i)=>{
 need(METALS.includes(m)&&Number.isSafeInteger(q)&&q>=1&&q<=99,'Quantidade inválida.');
 need(d.economy6!.orders.filter(o=>['reserved','working'].includes(o.phase)).length<B.maxOrders,'Limite de encomendas.');
 const materials=smeltCost(i,m,q),now=gameMinute(d),readyAt=now+B.smeltMinutes[m]*q;
 need(readyAt<999999*1440,'O calendário chegou ao limite.');need(i.spend(materials),'Materiais insuficientes.');
 d.economy6!.orders.push({id:++d.economy6!.sequence,station:'own',kind:'smelt',metal:m,tier:METALS.indexOf(m)+1,quantity:q,materials,fee:0,phase:'working',createdAt:now,readyAt});
 });}
export function reserveTool(s:SaveData,tool:EconomicTool,tier:number){return atomicEconomy(s,(d,i)=>{
 need(TOOL_IDS.includes(tool)&&[1,2,3].includes(tier),'Ferramenta inválida.');need(d.economy6!.orders.filter(o=>o.phase==='reserved'||o.phase==='working').length<B.maxOrders,'Limite de encomendas pendentes.');
 need(!d.economy6!.orders.some(o=>o.kind==='tool'&&o.tool===tool&&(o.phase==='working'||o.phase==='reserved')),'Já há uma encomenda desta ferramenta.');need(i.has(tool),'Fabrique primeiro a ferramenta básica.');need(toolCondition(d,tool).tier===tier-1,'Respeite a sequência Pedra → Ferro → Ouro → Metal Negro.');
 const m=METALS[tier-1],cost:ItemCost=tier===3?{...B.blackToolRecipe}:{[ingot(m)]:B.ingots[tool][tier],[tier===2?'board':'wood']:2};
 need(i.spend(cost),'Materiais insuficientes.');const now=gameMinute(d);d.economy6!.orders.push({id:++d.economy6!.sequence,kind:'tool',tool,metal:m,tier,quantity:1,materials:cost,fee:B.labor[tool][tier],phase:'reserved',createdAt:now,readyAt:0});
 });}
export function reserveSmelt(s:SaveData,m:Metal,q:number){return atomicEconomy(s,(d,i)=>{need(METALS.includes(m)&&Number.isSafeInteger(q)&&q>=1&&q<=99,'Quantidade inválida.');need(d.economy6!.orders.filter(o=>['reserved','working'].includes(o.phase)).length<B.maxOrders,'Limite de encomendas.');const materials=smeltCost(i,m,q);need(i.spend(materials),'Materiais insuficientes.');d.economy6!.orders.push({id:++d.economy6!.sequence,kind:'smelt',metal:m,tier:METALS.indexOf(m)+1,quantity:q,materials,fee:B.smeltFee[m]*q,phase:'reserved',createdAt:gameMinute(d),readyAt:0});});}
export function orderAction(s:SaveData,id:number,action:'pay'|'cancel'|'collect'){return atomicEconomy(s,(d,i)=>{
 const order=d.economy6!.orders.find(o=>o.id===id);need(order,'Encomenda desconhecida.');const o=order!;
 if(action==='cancel'){need(o.phase==='reserved','Após o pagamento, a encomenda não pode ser cancelada. Retire-a quando ficar pronta.');need(i.transact({},o.materials),'Libere espaço para receber todos os materiais de volta.');o.phase='cancelled';return;}
 if(action==='pay'){need(o.phase==='reserved','Você precisa entregar os materiais primeiro.');need(d.villageEconomy!.coins>=o.fee,'Saldo insuficiente para pagar a mão de obra.');need(gameMinute(d)+(o.kind==='tool'?B.workDays[o.tier]*1440:B.smeltMinutes[o.metal]*o.quantity)<999999*1440,'O calendário chegou ao limite.');d.villageEconomy!.coins-=o.fee;o.phase='working';o.readyAt=gameMinute(d)+(o.kind==='tool'?B.workDays[o.tier]*1440:B.smeltMinutes[o.metal]*o.quantity);return;}
 need(o.phase==='working','Esta encomenda não está disponível para retirada.');need(gameMinute(d)>=o.readyAt,'Bento ainda está trabalhando nesta encomenda.');
 if(o.kind==='smelt')need(i.transact({},{[ingot(o.metal)]:o.quantity}),'Sem espaço na mochila.');else{need(i.has(o.tool!),'Traga a ferramenta original para receber o aprimoramento.');need(toolCondition(d,o.tool!).tier===o.tier-1,'Esta ferramenta já foi aprimorada.');configureTool(d,o.tool!,o.tier);}
 o.phase='collected';
 });}
export function fulfillContract(s:SaveData,npc:string){return atomicEconomy(s,(d,i)=>{const spec=B.contracts.find(c=>c.npc===npc);need(spec,'Pedido desconhecido.');const c=spec!,cycle=Math.floor((d.day-1)/c.interval);need(d.economy6!.contracts[npc]?.cycle!==cycle||!d.economy6!.contracts[npc]?.completed,'Este pedido já foi concluído. Aguarde a renovação.');need(i.spend({[c.item]:c.quantity}),'Materiais insuficientes.');need(d.villageEconomy!.coins<=999999999-c.reward,'Sua carteira está cheia.');d.villageEconomy!.coins+=c.reward;d.economy6!.contracts[npc]={cycle,completed:true};});}
export function validateEconomyState(value:unknown):value is EconomyState {
 if(!value||typeof value!=='object')return false;const s=value as EconomyState,integer=(n:unknown,a:number,b:number)=>Number.isSafeInteger(n)&&Number(n)>=a&&Number(n)<=b;
 if(s.version!==6||!integer(s.sequence,0,999999999)||!s.tools||typeof s.tools!=='object'||!s.contracts||typeof s.contracts!=='object'||!s.mined||typeof s.mined!=='object'||!Array.isArray(s.orders)||s.orders.length>10000)return false;
 for(const [tool,c]of Object.entries(s.tools))if(!TOOL_IDS.includes(tool as EconomicTool)||!c||!integer(c.tier,0,3)||(!integer(c.durability,0,B.durability[c.tier])||(c.work!==undefined&&(!Number.isFinite(c.work)||c.work<0||c.work>=1))))return false;
 for(const [m,n]of Object.entries(s.mined))if(!METALS.includes(m as Metal)||!integer(n,0,999999999))return false;
 const ids=new Set<number>();for(const o of s.orders){if(!o||!integer(o.id,1,s.sequence)||ids.has(o.id)||!['tool','smelt'].includes(o.kind)||!METALS.includes(o.metal)||!integer(o.tier,1,3)||METALS[o.tier-1]!==o.metal||!integer(o.quantity,1,99)||!['reserved','working','collected','cancelled'].includes(o.phase)||!Number.isFinite(o.createdAt)||o.createdAt<0||!Number.isFinite(o.readyAt)||o.readyAt<0)return false;ids.add(o.id);
 const expected=o.kind==='tool'?(o.tool&&TOOL_IDS.includes(o.tool)?o.tier===3?{...B.blackToolRecipe}:{[ingot(o.metal)]:B.ingots[o.tool][o.tier],[o.tier===2?'board':'wood']:2}:null):o.materials;
 if(!expected||!o.materials||typeof o.materials!=='object'||Object.values(o.materials).some(n=>!integer(n,0,999999)))return false;
 if((o.phase==='working'||o.phase==='collected')&&o.readyAt<o.createdAt+(o.kind==='tool'?B.workDays[o.tier]*1440:B.smeltMinutes[o.metal]*o.quantity))return false;
 if(o.station!==undefined&&!['own','bento'].includes(o.station)||o.station==='own'&&o.kind!=='smelt')return false;
 if(o.kind==='tool'){if(o.quantity!==1||o.fee!==B.labor[o.tool!][o.tier]||JSON.stringify(Object.entries(expected).sort())!==JSON.stringify(Object.entries(o.materials).sort()))return false;}
 else if(o.fee!==(o.station==='own'?0:B.smeltFee[o.metal]*o.quantity)||Object.keys(o.materials).some(k=>k!==ore(o.metal)&&k!==shard(o.metal))||(o.materials[ore(o.metal)]??0)*B.fragmentsPerIngot+(o.materials[shard(o.metal)]??0)!==o.quantity*B.fragmentsPerIngot)return false;
 }
 return Object.entries(s.contracts).every(([npc,c])=>B.contracts.some(b=>b.npc===npc)&&c&&integer(c.cycle,0,999999)&&typeof c.completed==='boolean');
}

export function notifyReadyOrders(s:SaveData,notify:(message:string)=>void):void{
 for(const o of s.economy6?.orders??[])if(o.phase==='working'&&!o.notified&&gameMinute(s)>=o.readyAt){o.notified=true;notify(o.station==='own'?`Fundição #${o.id} pronta! Retire na sua forja.`:`Sua encomenda #${o.id} está pronta! Retire com Bento.`);}
}
