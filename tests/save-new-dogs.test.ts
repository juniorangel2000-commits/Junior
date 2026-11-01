import {SAVE_VERSION} from '../src/systems/save';
import { afterEach, expect, it, vi } from 'vitest';
import { createNewSave, loadSave, saveGame, SAVE_KEY, SAVE_RECENT_KEYS, SAVE_BACKUP_KEY, validateSave } from '../src/systems/save';
import { createDungeonProgress } from '../src/dungeons/progression';
const profile={name:'Companheiros',skin:'#e9bc98',hairColor:'#563b2c',outfit:'#457398',hairStyle:'preso' as const};
afterEach(()=>vi.unstubAllGlobals());
it('migrates v2, preserves its bytes even with an older backup, and reloads the new dog variants',()=>{
 const values=new Map<string,string>();vi.stubGlobal('localStorage',{getItem:(k:string)=>values.get(k)??null,setItem:(k:string,v:string)=>values.set(k,v),removeItem:(k:string)=>values.delete(k)});
 const previous={...createNewSave(profile),version:2,day:7,metLia:true};const raw=JSON.stringify(previous);
 const backup=JSON.stringify({...previous,day:2});values.set(SAVE_KEY,raw);values.set(SAVE_BACKUP_KEY,backup);
 const save=loadSave()!;expect(save.version).toBe(SAVE_VERSION);expect(save.day).toBe(7);expect(save.metLia).toBe(true);expect(values.get(SAVE_KEY)).toBe(raw);
 save.dungeons=createDungeonProgress();
 for(const species of ['golden-retriever','border-collie'] as const)for(const rare of [false,true])save.dungeons.pets.push({id:species+rare,species,rare,xp:0,attributes:{speed:0,resistance:0,perception:0,protection:0,efficiency:0}});
 expect(validateSave(save)).toBe(true);expect(saveGame(save)).toBe(true);expect(values.get(SAVE_RECENT_KEYS[0])).toBe(raw);expect(values.get(SAVE_BACKUP_KEY)).toBe(backup);
 expect(loadSave()!.dungeons!.pets).toEqual(save.dungeons.pets);
});
