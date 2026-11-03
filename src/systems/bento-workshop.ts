import {directionFromVector} from '../character-directions';
import type {SaveData} from '../types';
import {BENTO_WORK as B} from '../data/bento-work';
import {bentoAtFixture,bentoFixture} from './bento-fixtures';
import {depositBentoPack,withdrawBentoJob,finishBentoJob,ensureBentoWork} from './bento-stock';
import type {BentoWorkRuntime} from './bento-commit';
const face=(actor:{x:number;y:number;direction:import('../character-directions').CharacterDirection},rect:{left:number;right:number;top:number;bottom:number})=>{const dx=(rect.left+rect.right)/2-actor.x,dy=(rect.top+rect.bottom)/2-actor.y;actor.direction=directionFromVector(Math.abs(dx)>Math.abs(dy)?dx:0,Math.abs(dy)>=Math.abs(dx)?dy:0);};
export function stepBentoHandling(save:SaveData,kind:'stone'|'iron',action:'deposit'|'withdraw',seconds:number,runtime:BentoWorkRuntime):'busy'|'done'|'blocked'{
 const actor=save.bentoTravel?.trip;if(actor?.area!=='shop'||!bentoAtFixture(save,kind,actor))return'blocked';
 const f=bentoFixture(save,kind)!;face(actor,f.rect);
 let work=ensureBentoWork(save);
 if(!work.handling||work.handling.kind!==kind||work.handling.action!==action)work.handling={kind,action,elapsed:0,committed:false};
 work.handling.elapsed=Math.min(B.handlingSeconds,work.handling.elapsed+seconds);
 if(!work.handling.committed&&work.handling.elapsed>=B.handlingSeconds/2){
  const saved=action==='deposit'?depositBentoPack(save,kind,runtime):withdrawBentoJob(save,runtime);if(!saved)return'blocked';work=ensureBentoWork(save);
 }
 if(work.handling!.elapsed+.00001>=B.handlingSeconds&&work.handling!.committed){delete work.handling;return'done';}return'busy';
}
export function stepBentoForge(save:SaveData,seconds:number,runtime:BentoWorkRuntime):'busy'|'done'|'blocked'{
 const actor=save.bentoTravel?.trip,work=ensureBentoWork(save),job=work.job;if(job?.phase==='done')return'done';
 if(actor?.area!=='shop'||!job||job.phase!=='carrying'||!bentoAtFixture(save,'anvil',actor))return'blocked';
 const f=bentoFixture(save,'anvil')!;face(actor,f.rect);
 job.elapsed=Math.min(B.personalJobSeconds,job.elapsed+seconds);
 if(job.elapsed+.00001>=B.personalJobSeconds)return finishBentoJob(save,runtime)?'done':'blocked';return'busy';
}
