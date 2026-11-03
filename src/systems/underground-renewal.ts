import {pauseMineMissions} from './mine-mission-lifecycle';
import {MINE_MISSIONS,mineMissionWorld} from '../data/mine-missions';
import {MINING_ENTRY} from '../data/mining-entry';
import type {SaveData,TilePoint} from '../types';
import {UNDERGROUND,mineCellIndex,mineCellPoint,mineZone,mineHash} from '../data/underground-layout';
import {UNDERGROUND_BALANCE,type UndergroundBalance} from '../data/underground-balance';
import {ensureUnderground,undergroundArrival,mineRockAt,type UndergroundState} from './underground';
import {mineMaterialAt} from './underground-geology';

function neighbours(i:number):number[]{const x=i%UNDERGROUND.width,y=Math.floor(i/UNDERGROUND.width);return[[x-1,y],[x+1,y],[x,y-1],[x,y+1]].filter(([x,y])=>x>=0&&y>=0&&x<UNDERGROUND.width&&y<UNDERGROUND.height).map(([x,y])=>mineCellIndex(x,y));}
/** Removing a floor vertex is allowed only if its other neighbours remain connected. */
function removalKeepsRoutes(open:Uint8Array,index:number):boolean{
 const goals=neighbours(index).filter(i=>open[i]);if(goals.length<=1)return true;
 const remaining=new Set(goals.slice(1)),seen=new Uint8Array(open.length),queue=[goals[0]];seen[goals[0]]=1;
 for(let k=0;k<queue.length;k++)for(const i of neighbours(queue[k]))if(i!==index&&open[i]&&!seen[i]){seen[i]=1;remaining.delete(i);if(!remaining.size)return true;queue.push(i);}
 return false;
}
export function mineProtectedActors(save:SaveData,extra:readonly TilePoint[]=[]):TilePoint[]{
 return[undergroundArrival(),...(save.mineInterior?[save.mineInterior]:[]),...(save.dungeons?.pets??[]).flatMap(p=>p.world?.area==='highland'&&p.world.space==='mine'?[p.world]:[]),...(save.underground?.hazards?.zombies??[]).filter(z=>z.hp>0),...(save.underground?.hazards?.bats??[]).filter(b=>b.hp>0).flatMap(b=>[b,b.home]),...(save.underground?.hazards?.cave.active?[save.underground.hazards.cave.active]:[]),...(save.bentoTravel?.trip&&['mine','mining'].includes(save.bentoTravel.trip.area)?[save.bentoTravel.trip]:[]),...MINE_MISSIONS.flatMap(q=>[...q.visits??[],...q.object?.sites??[]].map(mineMissionWorld)),...extra];
}
/** Only called as part of a durable new-entry transaction, never during exploration. */
function renew(mine:UndergroundState,day:number,actors:readonly TilePoint[],balance:UndergroundBalance):number{
 const config=balance.regeneration;
 if(mine.renewal?.lastRegeneratedDay!==undefined&&day-mine.renewal.lastRegeneratedDay<config.minimumDaysBetweenRenewals)return 0;
 const eligible=Object.entries(mine.changes).flatMap(([key,c])=>{
  const i=Number(key),p=mineCellPoint(i);
  if(!c.dug||c.dugDay===undefined||day-c.dugDay<config.days[mineMaterialAt(mine,p.x,p.y)]||mineZone(mine.seed,p.x,p.y)!=='renewable'||(c.cycle??0)>=1e9)return[];
  if(actors.some(a=>Math.abs(a.x-(p.x*32+16))<=config.actorClearance&&Math.abs(a.y-(p.y*32+16))<=config.actorClearance))return[];
  return[i];
 });
 const limit=Math.min(config.maxPerEntry,Math.ceil(eligible.length*config.fraction));if(!limit||mine.revision>=1e9)return 0;
 eligible.sort((a,b)=>mineHash(mine.seed^(mine.expedition?.id??0),a,day)-mineHash(mine.seed^(mine.expedition?.id??0),b,day));
 const open=new Uint8Array(UNDERGROUND.width*UNDERGROUND.height);
 for(let i=0;i<open.length;i++){const p=mineCellPoint(i);open[i]=Number(!mineRockAt(mine,p.x,p.y));}
 let count=0;
 for(const i of eligible){
  if(count>=limit)break;
  if(!removalKeepsRoutes(open,i))continue;
  const old=mine.changes[i],p=mineCellPoint(i),cycle=(old.cycle??0)+1;
  mine.changes[i]={cycle,renewedDay:day};
  mine.changes[i].mineral=mineMaterialAt(mine,p.x,p.y,balance);
  open[i]=0;count++;
 }
 if(count)mine.revision++;
 return count;
}
export interface MineEntryResult{ok:boolean;message:string;regenerated?:number}
export function beginMineExpedition(save:SaveData,write:(draft:SaveData)=>boolean,extraProtected:readonly TilePoint[]=[],balance:UndergroundBalance=UNDERGROUND_BALANCE):MineEntryResult{
 if(save.miningInterior||save.mineInterior&&save.underground?.access!==1||save.underground?.expedition?.inside)return{ok:false,message:'A expedição atual continua em andamento.'};
 const draft=structuredClone(save),mine=ensureUnderground(draft);
 const old=mine.expedition;
 if((old?.id??0)>=1e9||(mine.renewal?.sequence??0)>=1e9)return{ok:false,message:'O limite de expedições desta partida foi atingido.'};
 draft.activeArea='highland';draft.mineInterior=mine.access===1?{...MINING_ENTRY}:undergroundArrival();if(mine.access===1)draft.miningInterior=true;
 mine.expedition={id:(old?.id??0)+1,inside:true,enteredDay:draft.day};
 const count=old&&!old.inside&&old.exitedDay!==undefined&&draft.day>=old.exitedDay?renew(mine,draft.day,mineProtectedActors(draft,extraProtected),balance):0;
 mine.renewal={day:draft.day,count,sequence:(mine.renewal?.sequence??0)+1,...(count?{lastRegeneratedDay:draft.day}:mine.renewal?.lastRegeneratedDay!==undefined?{lastRegeneratedDay:mine.renewal.lastRegeneratedDay}:{})};
 try{if(!write(draft))return{ok:false,message:'Não foi possível salvar. A entrada na mina foi cancelada.'};}catch{return{ok:false,message:'Não foi possível salvar. A mina foi preservada.'};}
 save.underground=mine;save.mineInterior=draft.mineInterior;save.dungeons=draft.dungeons;save.activeArea=draft.activeArea;if(draft.miningInterior)save.miningInterior=true;
 return{ok:true,message:count?'Algumas galerias secundárias ganharam novas formações de rocha.':'Você entrou na Mina Antiga.',regenerated:count};
}
/** Loading an indoor save does not count as another expedition. */
export function resumeMineExpedition(save:SaveData):void{
 const mine=ensureUnderground(save);
 mine.expedition??={id:1,inside:true,enteredDay:save.day};
}
export function finishMineExpedition(save:SaveData):void{
 pauseMineMissions(save);
 if(save.underground?.expedition){save.underground.expedition.inside=false;save.underground.expedition.exitedDay=save.day;}
 delete save.mineInterior;delete save.miningInterior;
}
