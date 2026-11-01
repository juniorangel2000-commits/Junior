import {inspectSave,validateSave,type SaveReadResult} from './save';
import type {SaveData} from '../types';
import {ACTIVE_SLOT_KEY,SLOT_PREFIX,LEGACY_SAVE_KEY,saveKeys,slotSaveKey,validSlotId} from './save-slot-keys';
export interface SavedGame {id:string;name:string;createdAt?:number;active:boolean;read:SaveReadResult}
const validName=(value:string)=>value.trim().length>0&&value.trim().length<=40&&!/[\u0000-\u001f]/.test(value);
function metadata(base:string):{name?:string;createdAt?:number}{
 try{const m=JSON.parse(localStorage.getItem(saveKeys(base).meta)||'null');return m&&typeof m.name==='string'&&validName(m.name)?{name:m.name,createdAt:typeof m.createdAt==='number'&&Number.isFinite(m.createdAt)?m.createdAt:undefined}:{};}catch{return {};}
}
export function listSavedGames():{games:SavedGame[];error?:string}{
 try{
  const ids=new Set<string>();
  const legacyKeys=saveKeys(LEGACY_SAVE_KEY);
  if([legacyKeys.main,...legacyKeys.recent,legacyKeys.backup].some(key=>localStorage.getItem(key)!==null))ids.add('legacy');
  for(let i=0;i<localStorage.length;i++){
   const key=localStorage.key(i);if(!key?.startsWith(SLOT_PREFIX))continue;
   const id=key.slice(SLOT_PREFIX.length, SLOT_PREFIX.length+36);
   if(!validSlotId(id))continue;
   const keys=saveKeys(slotSaveKey(id));
   if([keys.main,keys.meta,keys.backup,...keys.recent,keys.damaged].includes(key))ids.add(id);
  }
  const active=localStorage.getItem(ACTIVE_SLOT_KEY)??'legacy';
  const games=[...ids].map(id=>{const base=slotSaveKey(id),m=metadata(base),read=inspectSave(base);return{id,name:m.name??(id==='legacy'?'Minha primeira partida':read.data?.profile.name||'Partida'),createdAt:m.createdAt,active:active===id,read};});
  games.sort((a,b)=>Number(b.active)-Number(a.active)||(b.createdAt??0)-(a.createdAt??0));
  return {games};
 }catch{return {games:[],error:'Não foi possível acessar as partidas. Os dados foram preservados.'};}
}
/** A new game receives independent data and backup keys before it becomes active. */
export function createSavedGame(data:SaveData,name=data.profile.name):{ok:boolean;id?:string;message:string}{
 if(!validateSave(data)||!validName(name))return{ok:false,message:'Confira o nome da partida (1 a 40 caracteres).'};
 const id=crypto.randomUUID(),keys=saveKeys(slotSaveKey(id));
 try{
  localStorage.setItem(keys.main,JSON.stringify(data));
  localStorage.setItem(keys.meta,JSON.stringify({name:name.trim(),createdAt:Date.now()}));
  localStorage.setItem(ACTIVE_SLOT_KEY,id);
  return{ok:true,id,message:'Nova partida criada.'};
 }catch{
  // If activation failed, the old active game and all its backups remain untouched.
  try{localStorage.removeItem(keys.main);localStorage.removeItem(keys.meta);}catch{/* Orphaned data can still be inspected in the library. */}
  return{ok:false,message:'Não foi possível gravar uma nova partida. A anterior foi preservada.'};
 }
}
export function activateSavedGame(id:string):{ok:boolean;message:string}{
 try{
  const read=inspectSave(slotSaveKey(id));
  if(!read.data)return{ok:false,message:'Esta partida não pode ser carregada nesta versão. Os dados foram preservados.'};
  localStorage.setItem(ACTIVE_SLOT_KEY,id);return{ok:true,message:'Partida selecionada.'};
 }catch{return{ok:false,message:'Não foi possível selecionar a partida.'};}
}
export function renameSavedGame(id:string,name:string):{ok:boolean;message:string}{
 if(!validName(name))return{ok:false,message:'Use um nome com 1 a 40 caracteres.'};
 try{
  const base=slotSaveKey(id);if(!listSavedGames().games.some(s=>s.id===id))return{ok:false,message:'Partida não encontrada.'};
  localStorage.setItem(saveKeys(base).meta,JSON.stringify({...metadata(base),name:name.trim()}));return{ok:true,message:'Nome atualizado.'};
 }catch{return{ok:false,message:'Não foi possível renomear. O progresso foi preservado.'};}
}
/** The caller must obtain explicit in-game confirmation before deleting a slot. */
export function deleteSavedGame(id:string):{ok:boolean;message:string}{
 try{
  const keys=saveKeys(slotSaveKey(id));
  if((localStorage.getItem(ACTIVE_SLOT_KEY)??'legacy')===id)localStorage.removeItem(ACTIVE_SLOT_KEY);
  for(const key of [keys.main,keys.backup,...keys.recent,keys.damaged,keys.meta])localStorage.removeItem(key);
  return{ok:true,message:'Partida excluída.'};
 }catch{return{ok:false,message:'Não foi possível concluir a exclusão.'};}
}
