import type {ItemId,SaveData} from '../types';
import {PROJECTS,projectDef,type ProjectDef} from '../data/projects';
import type {Inventory} from './inventory';
import {ITEM_NAMES} from '../data/items';

/** O que já foi entregue a cada obra. `funded` é o dia em que tudo ficou pago: a obra fica pronta
 * `days` dias depois. Campo opcional do save. */
export interface ProjectProgress{coins:number;items:Partial<Record<ItemId,number>>;funded?:number}
export type ProjectsState=Record<string,ProjectProgress>;
export type ProjectStatus='locked'|'open'|'building'|'done';

const progressOf=(s:Pick<SaveData,'projects'>,id:string):ProjectProgress=>s.projects?.[id]??{coins:0,items:{}};
export function projectStatus(s:Pick<SaveData,'projects'|'day'>,id:string):ProjectStatus{
 const def=projectDef(id);if(!def)return 'locked';const p=progressOf(s,id);
 if(p.funded!==undefined)return s.day>=p.funded+def.days?'done':'building';
 if(def.requires&&projectStatus(s,def.requires)!=='done')return 'locked';
 return 'open';
}
export const projectDone=(s:Pick<SaveData,'projects'|'day'>,id:string)=>projectStatus(s,id)==='done';
export const projectReadyDay=(s:Pick<SaveData,'projects'>,id:string)=>{const p=progressOf(s,id),d=projectDef(id);return p.funded!==undefined&&d?p.funded+d.days:undefined;};
/** O que ainda falta entregar. */
export function projectMissing(s:Pick<SaveData,'projects'>,def:ProjectDef):{coins:number;items:Partial<Record<ItemId,number>>}{
 const p=progressOf(s,def.id);
 return{coins:Math.max(0,def.coins-p.coins),items:Object.fromEntries(Object.entries(def.items).map(([i,n])=>[i,Math.max(0,(n as number)-(p.items[i as ItemId]??0))]).filter(([,n])=>(n as number)>0))};
}
/** Entrega o que o jogador tiver (até completar). Lança erro com a explicação se nada puder ser entregue. */
export function donateToProject(s:SaveData,inv:Inventory,id:string):string{
 const def=projectDef(id);if(!def)throw Error('Obra desconhecida.');
 const status=projectStatus(s,id);
 if(status==='locked')throw Error(`Primeiro termine: ${projectDef(def.requires!)?.name}.`);
 if(status==='building')throw Error(`Em obra. Fica pronta no dia ${projectReadyDay(s,id)}.`);
 if(status==='done')throw Error('Esta obra já está pronta.');
 const miss=projectMissing(s,def),wallet=s.villageEconomy!.coins;
 const coins=Math.min(miss.coins,wallet);
 const items:Partial<Record<ItemId,number>>={};
 for(const [i,n] of Object.entries(miss.items)){const have=inv.data[i as ItemId]??0,give=Math.min(have,n as number);if(give>0)items[i as ItemId]=give;}
 if(!coins&&!Object.keys(items).length)throw Error('Você não tem nada do que falta: '+describeCost(miss)+'.');
 if(Object.keys(items).length&&!inv.spend(items))throw Error('Não foi possível entregar os materiais.');
 s.villageEconomy!.coins-=coins;
 const p=progressOf(s,id),next:ProjectProgress={coins:p.coins+coins,items:{...p.items}};
 for(const [i,n] of Object.entries(items))next.items[i as ItemId]=(next.items[i as ItemId]??0)+(n as number);
 const left=projectMissing({projects:{[id]:next}},def);
 if(!left.coins&&!Object.keys(left.items).length)next.funded=s.day;
 s.projects={...s.projects,[id]:next};
 const given=describeCost({coins,items});
 return next.funded!==undefined?`${def.name}: tudo entregue (${given}). A obra começa hoje e fica pronta no dia ${s.day+def.days}.`:`${def.name}: você entregou ${given}. Ainda falta ${describeCost(left)}.`;
}
export function describeCost(c:{coins:number;items:Partial<Record<ItemId,number>>}):string{
 const parts=[...(c.coins?[`${c.coins.toLocaleString('pt-BR')} coroas`]:[]),...Object.entries(c.items).map(([i,n])=>`${n} × ${ITEM_NAMES[i as ItemId]}`)];
 return parts.join(', ')||'nada';
}
/** Avisos de obras que ficaram prontas entre `from` (exclusivo) e `to` (inclusivo). */
export function projectsFinishedBetween(s:Pick<SaveData,'projects'>,from:number,to:number):ProjectDef[]{
 return PROJECTS.filter(d=>{const r=projectReadyDay(s,d.id);return r!==undefined&&r>from&&r<=to;});
}
export function validProjects(v:unknown,day:number):boolean{
 if(v===undefined)return true;
 if(!v||typeof v!=='object'||Array.isArray(v))return false;
 return Object.entries(v).every(([id,p])=>{
  const def=projectDef(id);if(!def||!p||typeof p!=='object'||Array.isArray(p))return false;
  const q=p as ProjectProgress;
  if(!Number.isSafeInteger(q.coins)||q.coins<0||q.coins>def.coins||!q.items||typeof q.items!=='object'||Array.isArray(q.items))return false;
  if(!Object.entries(q.items).every(([i,n])=>i in def.items&&Number.isSafeInteger(n)&&(n as number)>=0&&(n as number)<=(def.items[i as ItemId]??0)))return false;
  if(q.funded!==undefined&&(!Number.isSafeInteger(q.funded)||q.funded<1||q.funded>day))return false;
  return true;
 });
}
