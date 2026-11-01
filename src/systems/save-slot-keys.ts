export const ACTIVE_SLOT_KEY = 'after-rain-active-save-slot';
export const SLOT_PREFIX = 'after-rain-save-slot-';
export const LEGACY_SAVE_KEY = 'depois-da-chuva-v1';
export function validSlotId(id:string):boolean { return id==='legacy'||/^[a-f0-9-]{36}$/.test(id); }
export function slotSaveKey(id:string):string {
  if(!validSlotId(id))throw Error('Identificador de partida inválido.');
  return id==='legacy'?LEGACY_SAVE_KEY:SLOT_PREFIX+id;
}
/** Invalid pointers are reported as unavailable, never silently redirected to another game. */
export function activeSaveKey():string {
  const id=localStorage.getItem(ACTIVE_SLOT_KEY);
  return id===null?LEGACY_SAVE_KEY:slotSaveKey(id);
}
export function saveKeys(base:string){
 return {main:base,backup:base+'-backup',recent:[base+'-recent-1',base+'-recent-2'],damaged:base+'-preserved-invalid',meta:base+'-meta'};
}
