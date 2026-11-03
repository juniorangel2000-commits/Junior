import type {SaveData,TilePoint,InventoryData} from '../types';
import {Inventory} from './inventory';
import {MINE_MISSIONS,MINE_REQUESTS,mineMission,mineMissionOrigin,mineMissionObjectId,mineMissionTarget,mineRequestCycle,mineMissionWorld,type MineMissionId} from '../data/mine-missions';
import {freshMineMission,newMineMissions,type MineMissionRecord,type MineMissionsState} from './mine-mission-state';
import {ensureUndergroundWorld,undergroundFits} from './underground';
import {mineSegmentClear} from './underground-hazards';
import {bentoPlayerSpace} from './bento-navigation';
import {createVillageEconomy} from '../data/village-commerce';
export interface MineMissionRuntime{snapshot:()=>SaveData;write:(draft:SaveData)=>boolean;apply:(draft:SaveData)=>void;player:()=>TilePoint}
export function createMineMissionRuntime(snapshot:()=>SaveData,write:(draft:SaveData)=>boolean,root:()=>SaveData,player:()=>TilePoint,inventory?:()=>InventoryData):MineMissionRuntime{
 return{snapshot:()=>structuredClone(snapshot()),write,player,apply:d=>{const s=root();s.mineMissions=d.mineMissions;s.underground=d.underground;s.inventory={...d.inventory};s.villageEconomy=d.villageEconomy;const live=inventory?.();if(live)Object.assign(live,d.inventory);}};
}
export function ensureMineMissions(save:SaveData):MineMissionsState{return save.mineMissions??=newMineMissions();}
export function refreshMineRequests(save:SaveData):void{
 const s=ensureMineMissions(save),cycle=mineRequestCycle(save.day);
 for(const def of MINE_MISSIONS)if(def.kind==='repeat'){const q=s.quests[def.id];if(q.status==='completed'&&(s.repeatPaidCycle??-1)<cycle)s.quests[def.id]=freshMineMission(def.id);}
}
export function mineMissionRecords(save:SaveData):MineMissionsState{const draft={...save,mineMissions:save.mineMissions?structuredClone(save.mineMissions):undefined};refreshMineRequests(draft);return draft.mineMissions!;}
export function canTalkMineRequests(save:SaveData,player:TilePoint):boolean{
 if(save.bentoExpedition?.safety||save.bentoExpedition?.defense)return false;
 const t=save.bentoTravel?.trip,space=bentoPlayerSpace(save),r=save.villageRoutines?.bento;
 if(t)return!t.transition&&t.area===space&&Math.hypot(t.x-player.x,t.y-player.y)<78;
 if(!r)return false;return(r.area==='village'&&space==='village'||r.area==='shop'&&(!r.roomOwner||r.roomOwner==='bento')&&space==='shop')&&Math.hypot(r.x-player.x,r.y-player.y)<78;
}
export type MineMissionAction='accept'|'deliver'|'claim'|'resume';
export function mineMissionCanAccept(save:SaveData,id:MineMissionId):boolean{
 const s=mineMissionRecords(save),def=mineMission(id);if(s.quests[id].status!=='available')return false;
 return def.kind==='unique'||s.repeatPaidCycle!==mineRequestCycle(save.day)&&!MINE_MISSIONS.some(d=>d.kind==='repeat'&&['active','waiting','ready'].includes(s.quests[d.id].status));
}
function transaction(runtime:MineMissionRuntime,change:(draft:SaveData)=>{ok:boolean;message:string}):{ok:boolean;message:string}{
 const draft=runtime.snapshot(),result=change(draft);if(!result.ok)return result;
 try{if(!runtime.write(draft))return{ok:false,message:'Não foi possível salvar. Seus materiais e o progresso foram preservados.'};}catch{return{ok:false,message:'Não foi possível salvar. Tente novamente.'};}
 runtime.apply(draft);return result;
}
export function actMineMission(runtime:MineMissionRuntime,id:MineMissionId,action:MineMissionAction):{ok:boolean;message:string}{
 return transaction(runtime,d=>{
  refreshMineRequests(d);const state=ensureMineMissions(d),q=state.quests[id],def=mineMission(id);if(!def)return{ok:false,message:'Pedido desconhecido.'};
  if(action!=='resume'&&!canTalkMineRequests(d,runtime.player()))return{ok:false,message:'Converse com Bento para aceitar pedidos, fazer entregas ou receber o pagamento.'};
  if(action==='accept'){
   if(!mineMissionCanAccept(d,id))return{ok:false,message:'Conclua o pedido atual. Bento oferece um pedido renovável por período de quatro dias.'};
   ensureUndergroundWorld(d);q.status='active';q.acceptedDay=d.day;if(def.kind==='repeat')q.cycle=mineRequestCycle(d.day);
   if(def.object)q.object={uid:mineMissionObjectId(id,q.cycle??0),state:'world',position:mineMissionOrigin(id,q.cycle??0)!};
   return{ok:true,message:'Pedido anotado no diário. Você pode cumpri-lo no seu tempo.'};
  }
  if(action==='resume'){
   if(q.status!=='waiting')return{ok:false,message:'Este pedido não está em espera.'};q.status='active';return{ok:true,message:'Pedido retomado. O progresso anterior foi preservado.'};
  }
  if(action==='deliver'){
   if(!def.delivery||!['active','waiting'].includes(q.status))return{ok:false,message:'Não há uma entrega pendente para este pedido.'};
   const amount=Math.min(def.delivery.quantity-q.progress,d.inventory[def.delivery.item]);if(amount<1)return{ok:false,message:'Você ainda não tem os materiais pedidos na mochila.'};
   const bag=new Inventory(d.inventory);if(!bag.spend({[def.delivery.item]:amount}))return{ok:false,message:'Não foi possível separar os materiais.'};d.inventory=bag.data;q.progress+=amount;q.status=q.progress===def.delivery.quantity?'ready':'active';
   return{ok:true,message:q.status==='ready'?'Entrega completa. Converse com Bento para receber o pagamento.':`Bento recebeu ${amount} unidade${amount===1?'':'s'}. Esta parte ficou registrada; o restante continua no diário.`};
  }
  if(q.status!=='ready'||q.progress!==mineMissionTarget(id)||def.object&&q.object?.state!=='carried')return{ok:false,message:'Ainda falta concluir o objetivo deste pedido.'};
  if(def.kind==='repeat'&&state.repeatPaidCycle===mineRequestCycle(d.day))return{ok:false,message:'Você já recebeu pelo pedido deste período.'};
  const economy=d.villageEconomy??=createVillageEconomy();if(economy.coins>MINE_REQUESTS.coinsCap-def.reward)return{ok:false,message:'Sua carteira está cheia. O pagamento continua disponível.'};
  economy.coins+=def.reward;state.rewarded+=def.reward;q.status='completed';q.completedDay=d.day;if(q.object)q.object.state='delivered';if(def.kind==='repeat')state.repeatPaidCycle=mineRequestCycle(d.day);
  return{ok:true,message:`Bento agradeceu sua ajuda. Você recebeu ${def.reward} C.`};
 });
}
export function worldMineMissionObjects(save:SaveData):Array<{id:MineMissionId;record:MineMissionRecord;label:string;frame:number;position:TilePoint}>{
 const state=save.mineMissions;if(!state)return[];return MINE_MISSIONS.flatMap(def=>{const q=state.quests[def.id];return def.object&&q.object?.state==='world'&&q.status!=='completed'?[{id:def.id,record:q,label:def.object.label,frame:def.object.frame,position:q.object.position}]:[];});
}
export function collectMineMissionObject(runtime:MineMissionRuntime,id:MineMissionId):{ok:boolean;message:string}{
 return transaction(runtime,d=>{
  const def=mineMission(id),q=ensureMineMissions(d).quests[id],m=d.underground,player=runtime.player();
  if(!def.object||!q.object||q.object.state!=='world'||q.status==='completed'||!m||!d.miningInterior||d.activeArea!=='highland'||m.hazards?.hp===0)return{ok:false,message:'Este objeto não está disponível.'};
  if(Math.hypot(player.x-q.object.position.x,player.y-q.object.position.y)>MINE_REQUESTS.interactionReach||!undergroundFits(m,player.x,player.y)||!mineSegmentClear(m,player,q.object.position))return{ok:false,message:'Aproxime-se por uma passagem livre para examinar o objeto.'};
  if(q.status==='available'){if(def.kind!=='unique')return{ok:false,message:'Combine este pedido com Bento primeiro.'};q.acceptedDay=d.day;}
  q.object.state='carried';q.progress=1;q.status='ready';return{ok:true,message:`${def.object.label} guardado entre os objetos de missão. Mostre a Bento quando voltar.`};
 });
}
export function visitMineMissionTargets(runtime:MineMissionRuntime):{ok:boolean;message:string}{
 const current=runtime.snapshot(),player=runtime.player();if(!current.miningInterior||current.activeArea!=='highland'||!current.underground||current.underground.hazards?.hp===0)return{ok:false,message:''};
 const hits=MINE_MISSIONS.flatMap(def=>{const q=current.mineMissions?.quests[def.id];if(!def.visits||q?.status==='completed'||def.kind==='repeat'&&(!q||!['active','waiting'].includes(q.status)))return[];
  return def.visits.flatMap((p,index)=>{const world=mineMissionWorld(p);return!q?.visited.includes(index)&&Math.hypot(player.x-world.x,player.y-world.y)<=MINE_REQUESTS.visitReach&&undergroundFits(current.underground!,player.x,player.y)&&mineSegmentClear(current.underground!,player,world)?[{id:def.id,index}]:[];});
 });if(!hits.length)return{ok:false,message:''};
 return transaction(runtime,d=>{const state=ensureMineMissions(d);for(const hit of hits){const q=state.quests[hit.id];if(q.visited.includes(hit.index)||q.status==='completed')continue;if(q.status==='available')q.acceptedDay=d.day;q.visited.push(hit.index);q.visited.sort();q.progress=q.visited.length;q.status=q.progress===mineMissionTarget(hit.id)?'ready':'active';}return{ok:true,message:hits.some(h=>h.id==='forgotten-passage')?'Você encontrou uma antiga área de trabalho. A descoberta ficou registrada no diário.':'Reconhecimento anotado no diário da mina.'};});
}
