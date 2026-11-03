import type {SaveData,ItemId,TilePoint} from '../types';
import {Inventory,MAX_ITEM_COUNT,type ItemCost} from './inventory';
import {ITEM_IDS,ITEM_NAMES} from '../data/items';
import {availableSpecimens} from './fishing-progress';
import {fishSpecies,validFishingReward,type FishSpecimen} from '../data/fishing-catches';
export const GROUND_ITEM_LIFETIME=2*1440;
const SPACES=['property','home','forest','village','cityForest','fishingLake','survivorCamp','highland','mine','mining','blacksmith','community'];
export const validGroundSpace=(s:unknown):s is string=>typeof s==='string'&&(SPACES.includes(s)||/^shop:[a-z]{2,24}$/.test(s));
export interface GroundItem extends TilePoint{id:number;item:ItemId;amount:number;space:string;born:number;manual?:boolean;armed?:boolean;specimens?:FishSpecimen[]}
export interface GroundItems{version:1;nextId:number;items:GroundItem[]}
export interface GroundRuntime{read?:()=>SaveData;snapshot:()=>SaveData;write:(d:SaveData)=>boolean;apply:(d:SaveData)=>void;player:()=>TilePoint;space:()=>string;blocked:(x:number,y:number)=>boolean;enabled:()=>boolean}
export const groundClock=(s:Pick<SaveData,'day'|'time'>)=>(s.day-1)*1440+s.time;
export const groundExpired=(s:SaveData,d:GroundItem)=>groundClock(s)-d.born>=GROUND_ITEM_LIFETIME;
export function groundItems(s:SaveData):GroundItem[]{return s.groundItems?.items??[];}
export function addGroundItems(s:SaveData,cost:ItemCost,space:string,p:TilePoint,manual=false,specimens?:FishSpecimen[]):boolean{
 const entries=Object.entries(cost)as [ItemId,number][];if(!validGroundSpace(space)||![p.x,p.y].every(n=>Number.isFinite(n)&&n>=0&&n<=10000)||!entries.length||entries.some(([id,n])=>!ITEM_IDS.includes(id)||!Number.isSafeInteger(n)||n<=0||n>MAX_ITEM_COUNT))return false;
 const next:GroundItems=structuredClone(s.groundItems??{version:1,nextId:1,items:[]});next.items=next.items.filter(d=>!groundExpired(s,d));if(next.items.length+entries.length>4096||next.nextId+entries.length>=1e9)return false;
 for(const[item,amount]of entries)next.items.push({id:next.nextId++,item,amount,space,x:p.x,y:p.y,born:groundClock(s),...(manual?{manual:true,armed:false}:{}),...(specimens?.length?{specimens:structuredClone(specimens)}:{})});s.groundItems=next;return true;
}
export function resourceGroundSink(s:SaveData,space:string,p:TilePoint):(cost:ItemCost)=>boolean{return cost=>addGroundItems(s,cost,space,{x:p.x*32+16,y:p.y*32+16});}
export function createGroundRuntime(snapshot:()=>SaveData,write:GroundRuntime['write'],root:()=>SaveData,stock:()=>SaveData['inventory'],player:GroundRuntime['player'],space:GroundRuntime['space'],blocked:GroundRuntime['blocked'],enabled:GroundRuntime['enabled'],changed:()=>void):GroundRuntime{return{read:root,snapshot:()=>structuredClone(snapshot()),write,player,space,blocked,enabled,apply:d=>{const s=root();s.groundItems=d.groundItems;s.inventory={...d.inventory};Object.assign(stock(),d.inventory);s.fishingProgress=d.fishingProgress;s.worldWeapon=d.worldWeapon;s.equippedTool=d.equippedTool;s.progress=d.progress;changed();}};}
const fail=(message:string)=>({ok:false,message});
function commit(rt:GroundRuntime,d:SaveData,message:string){try{if(!rt.write(d))return fail('Não foi possível salvar. Os itens foram preservados.');}catch{return fail('Não foi possível salvar. Os itens foram preservados.');}rt.apply(d);return{ok:true,message};}
export function dropInventoryItem(rt:GroundRuntime,item:ItemId,amount=1){const d=rt.snapshot(),inventory=new Inventory(d.inventory);if(!ITEM_IDS.includes(item)||!Number.isSafeInteger(amount)||amount<1||!inventory.spend({[item]:amount}))return fail('A mochila não permite soltar esta quantidade.');const p=rt.player();let point:TilePoint|undefined;
 for(const offset of [[32,0],[-32,0],[0,32],[0,-32],[0,0]]){const t={x:p.x+offset[0],y:p.y+offset[1]};if([[-4,-4],[4,-4],[-4,4],[4,4]].every(([dx,dy])=>!rt.blocked(t.x+dx,t.y+dy))){point=t;break;}}
 if(!point)return fail('Aproxime-se de um chão livre e seco para soltar itens.');
 let specimens:FishSpecimen[]|undefined;if((item==='fish'||item==='rareFish')&&d.fishingProgress){const basket=availableSpecimens(d),selected=basket.filter(f=>fishSpecies(f.species).stock===item).slice(-amount);specimens=selected;d.fishingProgress.basket=basket.filter(f=>!selected.includes(f));}
 if(!addGroundItems(d,{[item]:amount},rt.space(),point,true,specimens))return fail('Recolha alguns itens do chão antes de soltar mais.');d.inventory=inventory.data;if(item==='sword'&&!d.inventory.sword)d.worldWeapon='unarmed';if(item===d.equippedTool&&!d.inventory[item])d.equippedTool='hand';return commit(rt,d,`${amount} ${ITEM_NAMES[item]} no chão. Desaparece após dois dias do jogo.`);
}
/** Collect only reachable, mature drops; a full bag leaves every item on the ground. */
export function collectGroundItems(rt:GroundRuntime):{ok:boolean;message:string}{if(!rt.enabled()||!(rt.read?.().groundItems??rt.snapshot().groundItems)?.items.length)return fail('');const d=rt.snapshot(),p=rt.player(),clock=groundClock(d);let changed=false,picked=0;const keep:GroundItem[]=[];const inventory=new Inventory(d.inventory);
 for(const drop of groundItems(d)){
  if(groundExpired(d,drop)){changed=true;continue;}
  if(drop.space!==rt.space()){keep.push(drop);continue;}
  const distance=Math.hypot(drop.x-p.x,drop.y-p.y);
  if(drop.manual&&!drop.armed&&distance>48){drop.armed=true;changed=true;}
  if(distance>28){keep.push(drop);continue;}
  const samples=Math.max(2,Math.ceil(distance/5)),clear=Array.from({length:samples},(_,i)=>{const t=i/(samples-1);return!rt.blocked(p.x+(drop.x-p.x)*t,p.y+(drop.y-p.y)*t);}).every(Boolean);
  if(distance>28||clock-drop.born<.1||drop.manual&&!drop.armed||!clear||!inventory.transact({},{[drop.item]:drop.amount})){keep.push(drop);continue;}
  if(drop.specimens&&d.fishingProgress)d.fishingProgress.basket.push(...structuredClone(drop.specimens));picked+=drop.amount;changed=true;
 }
 if(!changed)return fail('');d.groundItems!.items=keep;d.inventory=inventory.data;if(d.fishingProgress)d.fishingProgress.basket=d.fishingProgress.basket.slice(-200);d.progress.collected ||= d.inventory.wood>0&&d.inventory.stone>0&&d.inventory.fiber>0;return commit(rt,d,picked?`${picked} ${picked===1?'item recolhido':'itens recolhidos'}.`:'');
}
export function validGroundItems(v:unknown):v is GroundItems{if(!v||typeof v!=='object'||Array.isArray(v))return false;const g=v as GroundItems;if(g.version!==1||!Number.isSafeInteger(g.nextId)||g.nextId<1||g.nextId>=1e9||!Array.isArray(g.items)||g.items.length>4096)return false;const ids=new Set<number>();return g.items.every(d=>{if(!d||!Number.isSafeInteger(d.id)||d.id<1||d.id>=g.nextId||ids.has(d.id)||!ITEM_IDS.includes(d.item)||!Number.isSafeInteger(d.amount)||d.amount<1||d.amount>MAX_ITEM_COUNT||!validGroundSpace(d.space)||![d.x,d.y,d.born].every(n=>Number.isFinite(n)&&n>=0)||d.x>10000||d.y>10000||d.born>1440e6||d.manual!==undefined&&typeof d.manual!=='boolean'||d.armed!==undefined&&typeof d.armed!=='boolean'||d.specimens!==undefined&&(!Array.isArray(d.specimens)||d.specimens.length>d.amount||d.specimens.length>200||!validFishingReward({kind:'fish',specimens:d.specimens})||d.specimens.some(f=>fishSpecies(f.species).stock!==d.item)))return false;ids.add(d.id);return true;});}
