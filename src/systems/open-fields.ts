import type {SaveData,TilePoint} from '../types';
import {CHARACTER_DIRECTIONS} from '../character-directions';
import {fieldPatch,FIELDS_ANIMALS,fieldsBlocked,type MeadowPatch} from '../data/open-fields';
import type {AnimalPosition} from './animals';
import {addGroundItems} from './ground-items';
import {inventoryToolCondition,wearInventoryTool} from './tool-instances';
export interface OpenFieldsState{version:1;cut:Record<string,number>;animals?:AnimalPosition[]}
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
export function validOpenFields(v:unknown,day:number):v is OpenFieldsState{
 if(!v||typeof v!=='object'||Array.isArray(v))return false;const s=v as OpenFieldsState;
 if(s.version!==1||!s.cut||typeof s.cut!=='object'||Array.isArray(s.cut)||Object.entries(s.cut).some(([id,n])=>!fieldPatch(id)||!Number.isInteger(n)||n<1||n>day))return false;
 if(s.animals!==undefined){if(!Array.isArray(s.animals)||s.animals.length>FIELDS_ANIMALS.length)return false;const ids=new Set<string>();for(const a of s.animals){if(!a||!FIELDS_ANIMALS.some(d=>d.id===a.id)||ids.has(a.id)||!Number.isFinite(a.x)||!Number.isFinite(a.y)||a.x<32||a.x>3040||a.y<32||a.y>2272||!CHARACTER_DIRECTIONS.includes(a.direction))return false;ids.add(a.id);}}
 return true;
}
