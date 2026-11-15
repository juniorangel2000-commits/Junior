import type {SaveData,ItemId,TilePoint} from '../types';
import {MACHINES,MACHINE_RECIPES,isMachine,machineIngredient,type MachineKind} from '../data/machines';
import {cookCheck} from './kitchen';
import {startHive,hiveHarvest,nextHoneyReady} from './beekeeping';
import {calendarDate} from './calendar';
import {FARM_INTERIORS,hasInterior} from '../data/farm-interiors';
import {farmReserved} from './farm-construction';
import {Inventory} from './inventory';
import {ITEM_NAMES} from '../data/items';
import {groundClock} from './ground-items';
import {takeIngredientsQuality,gainQuality,qualityName,type Quality} from './item-quality';
export type MachineSpace='property'|`farm:${number}`;
/** `harvests`: coletas de mel da colmeia (a cera sai a cada 3). */
export interface PlacedMachine extends TilePoint{id:number;kind:MachineKind;space:MachineSpace;job?:{recipe:string;startedAt:number;readyAt:number;/** Qualidade do produto, herdada da matéria-prima de animal. */quality?:1|2};harvests?:number}
export interface MachineState{version:1;nextId:number;items:PlacedMachine[]}
export interface MachineRuntime{
 read:()=>SaveData;snapshot:()=>SaveData;write:(d:SaveData)=>boolean;apply:(d:SaveData)=>void;
 player:()=>TilePoint&{facing:{x:number;y:number}};space:()=>MachineSpace|undefined;
 bounds:()=>{width:number;height:number};blocked:(x:number,y:number)=>boolean;
 placement:(x:number,y:number)=>string;actors:()=>readonly TilePoint[];enabled:()=>boolean;
}
export const machineFootprint=(m:Pick<PlacedMachine,'x'|'y'|'kind'>)=>Array.from({length:MACHINES[m.kind].width},(_,i)=>({x:m.x+i,y:m.y}));
export const machineReserved=(s:SaveData,space:MachineSpace,x:number,y:number)=>s.machines?.items.some(m=>m.space===space&&m.y===y&&x>=m.x&&x<m.x+MACHINES[m.kind].width)??false;
export const machineContains=(m:PlacedMachine,x:number,y:number)=>x>=m.x*32+2&&x<=(m.x+MACHINES[m.kind].width)*32-2&&y>=m.y*32+2&&y<=(m.y+1)*32-2;
export function machinePointBlocked(s:SaveData,space:MachineSpace,x:number,y:number):boolean{return s.machines?.items.some(m=>m.space===space&&machineContains(m,x,y))??false;}
export const machineDistance=(m:PlacedMachine,p:TilePoint)=>Math.hypot(Math.max(m.x*32-p.x,0,p.x-(m.x+MACHINES[m.kind].width)*32),Math.max(m.y*32-p.y,0,p.y-(m.y+1)*32));
export const machineReady=(s:SaveData,m:PlacedMachine)=>!!m.job&&groundClock(s)>=m.job.readyAt;
const fail=(message:string)=>({ok:false,message});
function commit(rt:MachineRuntime,change:(s:SaveData)=>{ok:boolean;message:string}){
 if(!rt.enabled()||!rt.space())return fail('Use as máquinas na Propriedade ou dentro dos abrigos.');
 const d=structuredClone(rt.snapshot()),result=change(d);if(!result.ok)return result;
 try{if(!rt.write(d))return fail('Não foi possível salvar. Os itens foram preservados.');}catch{return fail('Não foi possível salvar. Os itens foram preservados.');}
 rt.apply(d);return result;
}
/** Uma máquina do outro lado da parede não pode receber cargas nem ser recolhida. */
export function nearMachine(rt:MachineRuntime):PlacedMachine|undefined{
 const s=rt.read(),space=rt.space(),p=rt.player();if(!space)return;
 return s.machines?.items.filter(m=>{
  if(m.space!==space||machineDistance(m,p)>42)return false;
  const x=Math.max(m.x*32,Math.min((m.x+MACHINES[m.kind].width)*32,p.x)),y=Math.max(m.y*32,Math.min((m.y+1)*32,p.y)),n=Math.max(1,Math.ceil(Math.hypot(x-p.x,y-p.y)/5));
  for(let i=0;i<n;i++){const px=p.x+(x-p.x)*i/n,py=p.y+(y-p.y)*i/n;if(rt.blocked(px,py)||s.machines?.items.some(other=>other!==m&&other.space===space&&machineContains(other,px,py)))return false;}
  return true;
 }).sort((a,b)=>machineDistance(a,p)-machineDistance(b,p))[0];
}
/** Em interiores verifica todo o piso; ao ar livre protege os corredores locais.
 * Só roda ao instalar, sem busca de caminhos no update de cada quadro. */
function keepsPassages(rt:MachineRuntime,s:SaveData,m:PlacedMachine):boolean{
 const size=rt.bounds(),step=16,space=m.space;
 const left=space==='property'?Math.max(0,m.x*32-128):0,top=space==='property'?Math.max(0,m.y*32-128):0;
 const right=space==='property'?Math.min(size.width,(m.x+MACHINES[m.kind].width)*32+128):size.width,bottom=space==='property'?Math.min(size.height,(m.y+1)*32+128):size.height;
 const w=Math.floor((right-left)/step),h=Math.floor((bottom-top)/step),fits=(x:number,y:number,after:boolean)=>[[-8,-5],[8,-5],[-8,4],[8,4]].every(([dx,dy])=>!rt.blocked(x+dx,y+dy)&&!machinePointBlocked(s,space,x+dx,y+dy)&&(!after||!machineContains(m,x+dx,y+dy)));
 const before=new Uint8Array(w*h),after=new Uint8Array(w*h);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const px=left+x*step+8,py=top+y*step+8;before[y*w+x]=+fits(px,py,false);after[y*w+x]=+fits(px,py,true);}
 const p=rt.player();let seed=-1,distance=Infinity;for(let i=0;i<before.length;i++)if(before[i]){const d=Math.hypot(left+i%w*step+8-p.x,top+Math.floor(i/w)*step+8-p.y);if(d<distance){seed=i;distance=d;}}
 if(seed<0||!after[seed])return false;
 const visit=(grid:Uint8Array)=>{const seen=new Set<number>([seed]),queue=[seed];for(let i=0;i<queue.length;i++){const id=queue[i],x=id%w,y=Math.floor(id/w);for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,n=ny*w+nx;if(nx>=0&&nx<w&&ny>=0&&ny<h&&grid[n]&&!seen.has(n)){seen.add(n);queue.push(n);}}}return seen;};
 const from=visit(before),to=visit(after);return [...from].every(i=>!after[i]||to.has(i));
}
export function machinePlacementReason(rt:MachineRuntime,s:SaveData,m:PlacedMachine):string{
 const size=rt.bounds(),p=rt.player();
 if(m.x<1||m.y<1||(m.x+MACHINES[m.kind].width)*32>=size.width||(m.y+1)*32>=size.height)return 'Escolha um espaço livre dentro do cenário.';
 for(const t of machineFootprint(m)){
  if(machineReserved(s,m.space,t.x,t.y))return 'Outra máquina ocupa esse espaço.';
  const reason=rt.placement(t.x,t.y);if(reason)return reason;
  if(m.space==='property'&&farmReserved(s,t.x,t.y))return 'Deixe a construção e sua entrada livres.';
  if([p,...rt.actors()].some(a=>a.x>t.x*32-9&&a.x<(t.x+1)*32+9&&a.y>t.y*32-6&&a.y<(t.y+1)*32+6))return 'Espere os personagens e animais saírem desse espaço.';
 }
 if(!keepsPassages(rt,s,m))return 'Deixe livre a passagem até a porta e os objetos.';
 return '';
}
export function placeMachine(rt:MachineRuntime,kind:MachineKind){return commit(rt,s=>{
 if(kind==='clayOven'&&rt.space()!=='property')return fail('O forno de barro fica ao ar livre, na Propriedade.');
 if(kind==='beehive'&&rt.space()!=='property')return fail('Instale a colmeia ao ar livre, na Propriedade.');
 const p=rt.player(),dx=Math.sign(p.facing.x),dy=Math.sign(p.facing.y),width=MACHINES[kind].width;
 const m:PlacedMachine={id:s.machines?.nextId??1,kind,space:rt.space()!,x:Math.floor(p.x/32)+dx-(dx<0?width-1:0),y:Math.floor(p.y/32)+dy};
 const reason=machinePlacementReason(rt,s,m);if(reason)return fail(reason);
 if((s.machines?.items.length??0)>=128||m.id>=1e9)return fail('Não há espaço para registrar outra máquina.');
 const i=new Inventory(s.inventory);if(!i.spend({[kind]:1}))return fail('Você não tem esta máquina na mochila.');
 s.inventory=i.data;const state=s.machines??={version:1,nextId:1,items:[]};state.items.push(m);state.nextId++;
 if(kind==='beehive'){startHive(s,m);return{ok:true,message:'Colmeia instalada. As abelhas fazem mel a cada 4 dias; margaridas ou girassóis por perto dão mel de flor.'};}
 return{ok:true,message:MACHINES[kind].name+' instalada. Use a matéria-prima perto dela para carregar.'};
});}
function accessible(rt:MachineRuntime,s:SaveData,id:number){const m=s.machines?.items.find(m=>m.id===id);return m&&m.space===rt.space()&&nearMachine(rt)?.id===id?m:undefined;}
export function loadMachine(rt:MachineRuntime,id:number,item:ItemId){return commit(rt,s=>{
 const m=accessible(rt,s,id);if(!m)return fail('Aproxime-se da máquina pelo lado livre.');
 if(m.job)return fail(machineReady(s,m)?'Recolha o produto pronto antes de colocar outra carga.':'A máquina já está trabalhando.');
 const options=MACHINE_RECIPES.filter(r=>!r.ingredients&&r.machine===m.kind&&r.input===item);if(!options.length)return fail('Esta máquina não trabalha com esse ingrediente.');
 const has=(r:typeof options[number])=>Object.entries({[item]:r.amount,...r.extra}).every(([k,n])=>(s.inventory[k as ItemId]??0)>=(n??0));
 const recipe=options.find(has)??options[0];
 const i=new Inventory(s.inventory);if(!i.spend({[item]:recipe.amount,...recipe.extra}))return fail(`Leve ${recipe.amount} × ${ITEM_NAMES[item]}`+(options.some(r=>r.extra)?' e '+options.map(r=>Object.entries(r.extra??{}).map(([k,n])=>`${n} × ${ITEM_NAMES[k as ItemId]}`).join(', ')).join(' ou '):'')+' para carregar.');
 const q=takeIngredientsQuality(s,{[item]:recipe.amount,...recipe.extra});
 const startedAt=groundClock(s);m.job={recipe:recipe.id,startedAt,readyAt:startedAt+recipe.minutes,...(q?{quality:q as 1|2}:{})};s.inventory=i.data;
 return{ok:true,message:MACHINES[m.kind].name+' trabalhando.'};
});}
export function collectMachine(rt:MachineRuntime,id:number){return commit(rt,s=>{
 const m=accessible(rt,s,id);if(!m)return fail('Aproxime-se da máquina pelo lado livre.');
 const i=new Inventory(s.inventory);
 if(m.kind==='beehive'){
  if(!m.job||!machineReady(s,m))return fail(calendarDate(s.day).season==='winter'?'As abelhas descansam no Inverno. O mel volta na Primavera.':'As abelhas estão fazendo mel. Volte quando o pote aparecer.');
  const out=hiveHarvest(s,m);if(!i.transact({},out))return fail('Libere espaço na mochila para recolher o mel.');
  s.inventory=i.data;m.harvests=(m.harvests??0)+1;startHive(s,m);
  return{ok:true,message:'Você recolheu '+Object.entries(out).map(([k,n])=>`${n} × ${ITEM_NAMES[k as ItemId]}`).join(' e ')+'.'};
 }
 if(m.job){if(!machineReady(s,m))return fail('A máquina está trabalhando. Aguarde o produto ficar pronto.');const r=MACHINE_RECIPES.find(r=>r.id===m.job!.recipe)!;
  if(!i.transact({},{[r.output]:r.quantity}))return fail('Libere espaço na mochila para recolher o produto.');const q:Quality=m.job.quality??0;delete m.job;s.inventory=i.data;gainQuality(s,r.output,s.inventory[r.output],q,r.quantity);return{ok:true,message:`Você recolheu ${r.quantity} × ${qualityName(r.output,q)}.`};
 }
 if(!i.transact({},{[m.kind]:1}))return fail('Libere espaço na mochila para recolher a máquina.');s.inventory=i.data;s.machines!.items=s.machines!.items.filter(x=>x.id!==id);
 return{ok:true,message:MACHINES[m.kind].name+' guardada na mochila.'};
});}
/** Forno vazio perto do jogador: E abre o caderno na aba do forno. */
export function nearEmptyOven(rt:MachineRuntime):PlacedMachine|undefined{const m=nearMachine(rt);return m?.kind==='clayOven'&&!m.job?m:undefined;}
/** Começa uma fornada com os ingredientes da receita e 1 madeira; salva antes de aplicar. */
export function loadOven(rt:MachineRuntime,id:number,dish:string){return commit(rt,s=>{
 const m=accessible(rt,s,id);if(!m||m.kind!=='clayOven')return fail('Aproxime-se do forno.');
 if(m.job)return fail(machineReady(s,m)?'Recolha a fornada pronta antes de assar outra.':'O forno já está assando.');
 const recipe=MACHINE_RECIPES.find(r=>r.machine==='clayOven'&&r.output===dish);if(!recipe?.ingredients)return fail('Esta receita não vai ao forno.');
 const check=cookCheck(s,dish,'oven');if(!check.ok)return check;
 const i=new Inventory(s.inventory);if(!i.spend(recipe.ingredients))return fail('Faltam ingredientes.');
 const q=takeIngredientsQuality(s,recipe.ingredients);
 const startedAt=groundClock(s);m.job={recipe:recipe.id,startedAt,readyAt:startedAt+recipe.minutes,...(q?{quality:q as 1|2}:{})};s.inventory=i.data;
 return{ok:true,message:`${ITEM_NAMES[recipe.output]} no forno. Fica pronto em meio dia.`};
});}
export function useMachineItem(rt:MachineRuntime,item:ItemId):{ok:boolean;message:string}|undefined{
 if(isMachine(item))return placeMachine(rt,item);
 if(machineIngredient(item)){const m=nearMachine(rt);return m?loadMachine(rt,m.id,item):fail('Fique perto da máquina e use o ingrediente.');}
}
export function interactMachine(rt:MachineRuntime,item?:ItemId|null):{ok:boolean;message:string}|undefined{
 const m=nearMachine(rt);if(!m)return;
 return !m.job&&item&&machineIngredient(item)?loadMachine(rt,m.id,item):collectMachine(rt,m.id);
}
export function machineHint(s:SaveData,m:PlacedMachine):string{
 const name=MACHINES[m.kind].name;
 if(m.job){const r=MACHINE_RECIPES.find(r=>r.id===m.job!.recipe)!;if(machineReady(s,m))return `${qualityName(r.output,m.job.quality??0)} · E recolher`;
 const minutes=Math.max(1,Math.ceil(m.job.readyAt-groundClock(s)));return `${name} trabalhando · ${Math.floor(minutes/60)}h ${minutes%60}min`;
 }
 if(m.kind==='clayOven')return name+' · E escolher a fornada no caderno';
 if(m.kind==='beehive')return name+' · as abelhas fazem mel';
 if(m.kind==='composter')return name+' · use 2 estercos com 3 capins ou 3 fibras · E guardar';
 if(m.kind==='preserveKeg')return name+' · use 3 morangos ou 3 melancias, com 1 mel · E guardar';
 return name+' · use '+MACHINE_RECIPES.filter(r=>r.machine===m.kind).map(r=>`${r.amount} ${ITEM_NAMES[r.input].toLowerCase()}`).join(' ou ')+' · E guardar máquina';
}
export function validMachineState(value:unknown,save:SaveData):value is MachineState{
 if(!value||typeof value!=='object'||Array.isArray(value))return false;const v=value as MachineState;
 if(v.version!==1||!Number.isSafeInteger(v.nextId)||v.nextId<1||v.nextId>1e9||!Array.isArray(v.items)||v.items.length>128)return false;
 const ids=new Set<number>(),cells=new Set<string>();
 return v.items.every(m=>{
  if(!m||!isMachine(m.kind)||!Number.isSafeInteger(m.id)||m.id<1||m.id>=v.nextId||ids.has(m.id)||!Number.isInteger(m.x)||!Number.isInteger(m.y)||m.x<1||m.y<1)return false;ids.add(m.id);
  let width=96,height=72;
  if(m.space!=='property'){
   if(typeof m.space!=='string'||!/^farm:[1-9]\d{0,8}$/.test(m.space))return false;
   const site=save.farmConstruction?.sites.find(s=>s.id===Number(m.space.slice(5)));if(!site?.finished||!hasInterior(site.kind))return false;
   const l=FARM_INTERIORS[site.kind]!;width=l.width;height=l.height;
   if(m.y>=height-2)return false;
   if(machineFootprint(m).some(t=>l.fixtures.some(f=>t.x*32<f.x+f.w+16&&(t.x+1)*32>f.x-16&&t.y*32<f.y+f.h+16&&(t.y+1)*32>f.y-16)))return false;
  }
  if(m.x+MACHINES[m.kind].width>=width||m.y+1>=height)return false;
  for(const t of machineFootprint(m)){const key=`${m.space}:${t.x},${t.y}`;if(cells.has(key)||m.space==='property'&&farmReserved(save,t.x,t.y))return false;cells.add(key);}
  if(m.job){const r=MACHINE_RECIPES.find(r=>r.id===m.job!.recipe&&r.machine===m.kind);if(!r||!Number.isFinite(m.job.startedAt)||m.job.startedAt<0||m.job.startedAt>groundClock(save)||!Number.isFinite(m.job.readyAt)||Math.abs(m.job.readyAt-(r.machine==='beehive'?nextHoneyReady(m.job.startedAt):m.job.startedAt+r.minutes))>.00001)return false;}
  if(m.job?.quality!==undefined&&m.job.quality!==1&&m.job.quality!==2)return false;
  if(m.harvests!==undefined&&(m.kind!=='beehive'||!Number.isSafeInteger(m.harvests)||m.harvests<0||m.harvests>1e6))return false;
  if(m.kind==='beehive'&&(m.space!=='property'||!m.job))return false;
  return true;
 });
}
