import type {SaveData} from '../types';
import {BENTO_WORK as B,BENTO_MATERIALS,type BentoMaterial} from '../data/bento-work';
import {ECONOMY_BALANCE as E} from '../data/economy-balance';
import {Inventory} from './inventory';
import {emptyBentoStock,bentoIronUnits,bentoStockUnits,type BentoStock,type BentoWorkState} from './bento-work-state';
import {commitBentoWork,type BentoWorkRuntime} from './bento-commit';
import {bentoAtFixture} from './bento-fixtures';
export const bentoMinute=(save:SaveData)=>(save.day-1)*1440+save.time;
export function ensureBentoWork(save:SaveData):BentoWorkState{
 return save.bentoWork??={version:1,pack:emptyBentoStock(),depot:emptyBentoStock(),pickaxe:{tier:0,durability:E.durability[0]},trip:{day:0,blocks:0,ironBlocks:0,elapsed:0},sequence:0,jobsDay:0,jobsToday:0,lastJobAt:0,ledger:{collected:emptyBentoStock(),consumed:emptyBentoStock(),deposited:0,withdrawn:0,jobs:0}};
}
export const bentoStockFrom=(inventory:Inventory):BentoStock=>Object.fromEntries(BENTO_MATERIALS.map(id=>[id,inventory.data[id]])) as BentoStock;
export function beginBentoWorkTrip(save:SaveData,day:number):void{
 const w=ensureBentoWork(save);if(w.trip.day===day)return;w.trip={day,blocks:0,ironBlocks:0,elapsed:0};delete w.mining;delete w.handling;
}
export function bentoCanCarry(w:BentoWorkState,item:BentoMaterial,amount:number):boolean{
 const weight=item==='ironOre'?E.fragmentsPerIngot:1;
 if(bentoStockUnits(w.pack)+weight*amount>B.carryUnits)return false;
 if(item==='stone')return w.pack.stone+w.depot.stone+amount<=B.depotStoneUnits;
 return bentoIronUnits(w.pack)+bentoIronUnits(w.depot)+weight*amount<=B.depotIronUnits;
}
export function bentoDepositKind(w:BentoWorkState):'stone'|'iron'|undefined{return w.pack.stone>0?'stone':bentoIronUnits(w.pack)>0?'iron':undefined;}
export function depositBentoPack(save:SaveData,kind:'stone'|'iron',runtime?:BentoWorkRuntime):boolean{
 return commitBentoWork(save,draft=>{
  const w=ensureBentoWork(draft),gain=kind==='stone'?{stone:w.pack.stone}:{ironShard:w.pack.ironShard,ironOre:w.pack.ironOre};
  const actor=draft.bentoTravel?.trip;if(actor?.area!=='shop'||!bentoAtFixture(draft,kind,actor))return false;
  if(!Object.values(gain).some(Boolean)||kind==='stone'&&w.depot.stone+w.pack.stone>B.depotStoneUnits||kind==='iron'&&bentoIronUnits(w.depot)+bentoIronUnits(w.pack)>B.depotIronUnits)return false;
  const pack=new Inventory(w.pack),depot=new Inventory(w.depot);if(!pack.spend(gain)||!depot.transact({},gain))return false;
  w.pack=bentoStockFrom(pack);w.depot=bentoStockFrom(depot);w.ledger.deposited+=kind==='stone'?(gain.stone??0):(gain.ironShard??0)+(gain.ironOre??0)*E.fragmentsPerIngot;
  if(w.handling)w.handling.committed=true;return true;
 },runtime);
}
export function planBentoPersonalJob(save:SaveData):boolean{
 const w=ensureBentoWork(save);if(w.job&&w.job.phase!=='done')return true;
 const today=w.jobsDay===save.day?w.jobsToday:0;if(today>=B.jobsPerDay||bentoMinute(save)-w.lastJobAt<B.jobCooldownMinutes||w.sequence>=1e9||bentoStockUnits(w.pack)>0)return false;
 const stone=w.depot.stone>=B.stoneJobCost,iron=bentoIronUnits(w.depot)>0;if(!stone&&!iron)return false;
 const preferStone=stone&&(!iron||w.pickaxe.durability<E.durability[0]||w.depot.stone/B.depotStoneUnits>=bentoIronUnits(w.depot)/B.depotIronUnits);
 const item:BentoMaterial=preferStone?'stone':w.depot.ironShard>=B.ironJobCost?'ironShard':'ironOre';
 w.job={id:++w.sequence,kind:preferStone?'stone':'iron',item,amount:preferStone?B.stoneJobCost:B.ironJobCost,phase:'planned',elapsed:0};return true;
}
export function withdrawBentoJob(save:SaveData,runtime?:BentoWorkRuntime):boolean{
 return commitBentoWork(save,draft=>{
  const w=ensureBentoWork(draft),job=w.job;if(!job||job.phase!=='planned')return false;
  const actor=draft.bentoTravel?.trip;if(actor?.area!=='shop'||!bentoAtFixture(draft,job.kind,actor))return false;
  const cost={[job.item]:job.amount},pack=new Inventory(w.pack),depot=new Inventory(w.depot);
  const weight=job.amount*(job.item==='ironOre'?E.fragmentsPerIngot:1);if(bentoStockUnits(w.pack)+weight>B.carryUnits||!depot.spend(cost)||!pack.transact({},cost))return false;
  w.pack=bentoStockFrom(pack);w.depot=bentoStockFrom(depot);job.phase='carrying';w.ledger.withdrawn+=weight;if(w.handling)w.handling.committed=true;return true;
 },runtime);
}
export function finishBentoJob(save:SaveData,runtime?:BentoWorkRuntime):boolean{
 return commitBentoWork(save,draft=>{
  const w=ensureBentoWork(draft),job=w.job;if(!job||job.phase!=='carrying'||job.elapsed+.00001<B.personalJobSeconds)return false;
  const actor=draft.bentoTravel?.trip;if(actor?.area!=='shop'||!bentoAtFixture(draft,'anvil',actor)||w.jobsDay===draft.day&&w.jobsToday>=B.jobsPerDay)return false;
  const pack=new Inventory(w.pack);if(!pack.spend({[job.item]:job.amount}))return false;
  w.pack=bentoStockFrom(pack);w.ledger.consumed[job.item]+=job.amount;w.ledger.jobs++;job.phase='done';w.lastJobAt=bentoMinute(draft);
  if(w.jobsDay!==draft.day){w.jobsDay=draft.day;w.jobsToday=0;}w.jobsToday++;
  if(job.kind==='stone')w.pickaxe={tier:0,durability:E.durability[0]};return true;
 },runtime);
}
