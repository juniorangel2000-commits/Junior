import type {SaveData,TilePoint} from '../types';
import {CHARACTER_DIRECTIONS} from '../character-directions';
import {fieldPatch,fieldIpe,FIELDS_ANIMALS,fieldsBlocked,IPE_HITS,IPE_REGROW_DAYS,IPE_REACH,type MeadowPatch} from '../data/open-fields';
import type {AnimalPosition} from './animals';
import {addGroundItems} from './ground-items';
import {inventoryToolCondition,wearInventoryTool} from './tool-instances';
/** felled: day each ipê was cut down; hits: blows already given to a standing ipê. */
export interface OpenFieldsState{version:1;cut:Record<string,number>;animals?:AnimalPosition[];felled?:Record<string,number>;hits?:Record<string,number>}
export const meadowGrowth=(s:SaveData,p:MeadowPatch)=>s.openFields?.cut[p.id]===undefined?1:Math.max(0,Math.min(1,(s.day-s.openFields.cut[p.id])/p.regrow));
export function harvestMeadow(s:SaveData,id:string,player:TilePoint,write:(d:SaveData)=>boolean):{ok:boolean;message:string}{
 const p=fieldPatch(id),fail=(message:string)=>({ok:false,message});
 if(s.activeArea!=='openFields'||!p||Math.hypot(p.x-player.x,p.y-player.y)>70||meadowGrowth(s,p)<1)return fail('Aproxime-se de uma moita crescida.');
 for(let i=1;i<=8;i++)if(fieldsBlocked(player.x+(p.x-player.x)*i/8,player.y+(p.y-player.y)*i/8))return fail('Aproxime-se pelo lado livre da moita.');
 if(p.kind==='grass'&&(!s.inventory.sickle||inventoryToolCondition(s.inventory,'sickle').durability<=0))return fail('Leve uma foice em boas condições para cortar o capim.');
 const d=structuredClone(s);d.openFields??={version:1,cut:{}};d.openFields.cut[id]=d.day;
 if(!addGroundItems(d,{[p.kind==='grass'?'freshGrass':p.kind]:p.kind==='grass'?2:1},'openFields',p))return fail('Recolha alguns itens do chão antes de continuar.');
 if(p.kind==='grass')wearInventoryTool(d.inventory,'sickle');
 try{if(!write(d))return fail('Não foi possível salvar. A coleta foi preservada.');}catch{return fail('Não foi possível salvar. A coleta foi preservada.');}
 Object.assign(s,d);return{ok:true,message:p.kind==='grass'?'Capim cortado. Leve ao silo para secar.':'Coleta disponível no chão.'};
}
/** Hardwood per felled ipê: none with stone, then one more per better metal. */
export const hardwoodYield=(tier:number)=>Math.max(0,Math.min(3,Math.floor(tier)));
export const ipeStanding=(s:SaveData,id:string)=>{const day=s.openFields?.felled?.[id];return day===undefined||s.day-day>=IPE_REGROW_DAYS;};
export const ipeHits=(s:SaveData,id:string)=>ipeStanding(s,id)?s.openFields?.hits?.[id]??0:0;
export function chopIpe(s:SaveData,id:string,player:TilePoint,write:(d:SaveData)=>boolean):{ok:boolean;message:string;felled?:boolean;hardwood?:number}{
 const p=fieldIpe(id),fail=(message:string)=>({ok:false,message});
 if(s.activeArea!=='openFields'||!p||Math.hypot(p.x-player.x,p.y-player.y)>IPE_REACH)return fail('Aproxime-se do tronco do ipê.');
 if(!ipeStanding(s,id))return fail('Este ipê está rebrotando. Volte em alguns dias.');
 if(!s.inventory.hatchet)return fail('Leve uma machadinha de ferro ou melhor para cortar o ipê.');
 const tool=inventoryToolCondition(s.inventory,'hatchet');
 if(tool.tier<1)return fail('Este ipê é duro demais. Você precisa de uma machadinha de ferro ou melhor.');
 if(tool.durability<=0)return fail('Repare esta machadinha antes de cortar o ipê.');
 const d=structuredClone(s),f=d.openFields??={version:1,cut:{}},hits=(f.hits?.[id]??0)+1;
 wearInventoryTool(d.inventory,'hatchet');
 let felled=false,hardwood=0;
 if(hits<IPE_HITS)(f.hits??={})[id]=hits;
 else{
  felled=true;hardwood=hardwoodYield(tool.tier);
  if(f.hits){delete f.hits[id];if(!Object.keys(f.hits).length)delete f.hits;}
  (f.felled??={})[id]=d.day;
  if(!addGroundItems(d,{hardwood,branch:2},'openFields',{x:p.x,y:p.y+30}))return fail('Recolha alguns itens do chão antes de derrubar o ipê.');
 }
 try{if(!write(d))return fail('Não foi possível salvar. O ipê e a machadinha foram preservados.');}catch{return fail('Não foi possível salvar. O ipê e a machadinha foram preservados.');}
 Object.assign(s,d);
 return felled?{ok:true,felled,hardwood,message:`Ipê derrubado: ${hardwood} madeira${hardwood>1?'s':''} nobre${hardwood>1?'s':''} e 2 galhos. Ele rebrota em ${IPE_REGROW_DAYS} dias.`}:{ok:true,felled,message:`Golpe ${hits} de ${IPE_HITS}.`};
}
export function validOpenFields(v:unknown,day:number):v is OpenFieldsState{
 if(!v||typeof v!=='object'||Array.isArray(v))return false;const s=v as OpenFieldsState;
 if(s.version!==1||!s.cut||typeof s.cut!=='object'||Array.isArray(s.cut)||Object.entries(s.cut).some(([id,n])=>!fieldPatch(id)||!Number.isInteger(n)||n<1||n>day))return false;
 if(s.animals!==undefined){if(!Array.isArray(s.animals)||s.animals.length>FIELDS_ANIMALS.length)return false;const ids=new Set<string>();for(const a of s.animals){if(!a||!FIELDS_ANIMALS.some(d=>d.id===a.id)||ids.has(a.id)||!Number.isFinite(a.x)||!Number.isFinite(a.y)||a.x<32||a.x>3040||a.y<32||a.y>2272||!CHARACTER_DIRECTIONS.includes(a.direction))return false;ids.add(a.id);}}

 if(s.felled!==undefined&&(!s.felled||typeof s.felled!=='object'||Array.isArray(s.felled)||Object.entries(s.felled).some(([id,n])=>!fieldIpe(id)||!Number.isInteger(n)||n<1||n>day)))return false;
 if(s.hits!==undefined&&(!s.hits||typeof s.hits!=='object'||Array.isArray(s.hits)||Object.entries(s.hits).some(([id,n])=>!fieldIpe(id)||!Number.isInteger(n)||n<1||n>=IPE_HITS)))return false;
 return true;
}
