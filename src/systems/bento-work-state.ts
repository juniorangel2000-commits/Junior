import type {TilePoint} from '../types';
import type {ToolCondition} from './economy';
import type {BentoMaterial} from '../data/bento-work';
import {BENTO_MATERIALS,BENTO_WORK as B} from '../data/bento-work';
import {ECONOMY_BALANCE as E} from '../data/economy-balance';
import type {ToolUseSnapshot} from './tool-use';
import {validToolUseSnapshot} from './tool-use';
export type BentoStock=Record<BentoMaterial,number>;
export const emptyBentoStock=():BentoStock=>({stone:0,ironShard:0,ironOre:0});
export const bentoStockUnits=(s:BentoStock)=>s.stone+s.ironShard+s.ironOre*E.fragmentsPerIngot;
export const bentoIronUnits=(s:BentoStock)=>s.ironShard+s.ironOre*E.fragmentsPerIngot;
export interface BentoMiningTarget{cell:TilePoint;origin:TilePoint;id:string}
export interface BentoWorkState{
 version:1;pack:BentoStock;depot:BentoStock;pickaxe:ToolCondition;
 trip:{day:number;blocks:number;ironBlocks:number;elapsed:number};
 mining?:{target:BentoMiningTarget;swing?:ToolUseSnapshot;pause:number};
 handling?:{kind:'stone'|'iron';action:'deposit'|'withdraw';elapsed:number;committed:boolean};
 job?:{id:number;kind:'stone'|'iron';item:BentoMaterial;amount:number;phase:'planned'|'carrying'|'done';elapsed:number};
 sequence:number;jobsDay:number;jobsToday:number;lastJobAt:number;
 ledger:{collected:BentoStock;consumed:BentoStock;deposited:number;withdrawn:number;jobs:number};
}
const number=(v:unknown,max=1e9)=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=max;
const integer=(v:unknown,max=1e9)=>number(v,max)&&Number.isSafeInteger(v);
const point=(p:unknown):p is TilePoint=>!!p&&typeof p==='object'&&number((p as TilePoint).x,5120)&&number((p as TilePoint).y,6144);
export const validBentoStock=(v:unknown):v is BentoStock=>!!v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length===3&&Object.entries(v).every(([k,n])=>BENTO_MATERIALS.includes(k as BentoMaterial)&&integer(n));
export function validBentoWork(value:unknown,maxDay=999999):value is BentoWorkState{
 if(!value||typeof value!=='object'||Array.isArray(value))return false;const w=value as BentoWorkState;
 if(w.version!==1||!validBentoStock(w.pack)||!validBentoStock(w.depot)||bentoStockUnits(w.pack)>B.carryUnits||w.depot.stone>B.depotStoneUnits||bentoIronUnits(w.depot)>B.depotIronUnits)return false;
 if(!w.pickaxe||w.pickaxe.tier!==0||!integer(w.pickaxe.durability,E.durability[0])||w.pickaxe.work!==undefined&&(!number(w.pickaxe.work,1)||w.pickaxe.work>=1))return false;
 if(!w.trip||!integer(w.trip.day,maxDay)||!integer(w.trip.blocks,B.maxBlocks)||!integer(w.trip.ironBlocks,B.maxIronBlocks)||w.trip.ironBlocks>w.trip.blocks||!number(w.trip.elapsed,B.miningSeconds+.001))return false;
 if(!integer(w.sequence)||!integer(w.jobsDay,maxDay)||!integer(w.jobsToday,B.jobsPerDay)||!number(w.lastJobAt,1440*1_000_001))return false;
 if(!w.ledger||!validBentoStock(w.ledger.collected)||!validBentoStock(w.ledger.consumed)||![w.ledger.deposited,w.ledger.withdrawn,w.ledger.jobs].every(v=>integer(v)))return false;
 if(w.mining){const m=w.mining;if(!m.target||!point(m.target.cell)||!Number.isInteger(m.target.cell.x)||!Number.isInteger(m.target.cell.y)||m.target.cell.x>=160||m.target.cell.y>=175||!point(m.target.origin)||typeof m.target.id!=='string'||m.target.id.length>80||!number(m.pause,3)||m.swing!==undefined&&!validToolUseSnapshot(m.swing))return false;}
 if(w.handling&&(!['stone','iron'].includes(w.handling.kind)||!['deposit','withdraw'].includes(w.handling.action)||!number(w.handling.elapsed,B.handlingSeconds+.001)||typeof w.handling.committed!=='boolean'))return false;
 if(w.job&&(!integer(w.job.id)||w.job.id<1||w.job.id>w.sequence||!['stone','iron'].includes(w.job.kind)||!BENTO_MATERIALS.includes(w.job.item)||!integer(w.job.amount,9)||w.job.amount<1||!['planned','carrying','done'].includes(w.job.phase)||!number(w.job.elapsed,B.personalJobSeconds+.001)))return false;
 if(w.job&&(w.job.kind==='stone'?(w.job.item!=='stone'||w.job.amount!==B.stoneJobCost):(w.job.item==='stone'||w.job.amount!==B.ironJobCost)))return false;
 if(w.mining?.swing?.strike&&(w.mining.swing.strike.tool!=='pickaxe'||w.mining.swing.strike.target.id!==w.mining.target.id))return false;
 if(BENTO_MATERIALS.some(id=>w.pack[id]+w.depot[id]+w.ledger.consumed[id]!==w.ledger.collected[id]))return false;
 return true;
}
