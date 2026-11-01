import {it,expect,vi,afterEach} from 'vitest';
import {createNewSave,saveGame,loadSave,inspectSave,SAVE_KEY,SAVE_BACKUP_KEY} from '../src/systems/save';
import {activateSavedGame,createSavedGame,listSavedGames,renameSavedGame,deleteSavedGame} from '../src/systems/save-library';
import {ACTIVE_SLOT_KEY,saveKeys,slotSaveKey} from '../src/systems/save-slot-keys';
const fresh=(name='Primeira')=>createNewSave({name,skin:'#e9bc98',hairColor:'#563b2c',outfit:'#457398',hairStyle:'preso'});
function store(){const values=new Map<string,string>();const storage={get length(){return values.size;},key:(i:number)=>[...values.keys()][i]??null,getItem:(k:string)=>values.get(k)??null,setItem:(k:string,v:string)=>{values.set(k,v);},removeItem:(k:string)=>{values.delete(k);}};vi.stubGlobal('localStorage',storage);return {values,storage};}
afterEach(()=>vi.unstubAllGlobals());
it('preserves the legacy game and creates independent named games without replacing it',()=>{
 const {values}=store(),old=JSON.stringify({...fresh('Antiga'),version:2,day:9});values.set(SAVE_KEY,old);
 expect(listSavedGames().games[0]).toMatchObject({id:'legacy',name:'Minha primeira partida',read:{status:'valid',data:{day:9}}});
 const a=createSavedGame(fresh('Ana'),'Fazenda da Ana');expect(a.ok).toBe(true);const b=createSavedGame(fresh('Beto'),'Segunda história');expect(b.ok).toBe(true);
 expect(listSavedGames().games).toHaveLength(3);expect(values.get(SAVE_KEY)).toBe(old);expect(loadSave()!.profile.name).toBe('Beto');
 expect(activateSavedGame(a.id!).ok).toBe(true);expect(loadSave()!.profile.name).toBe('Ana');expect(activateSavedGame('legacy').ok).toBe(true);expect(loadSave()!.day).toBe(9);
});
it('keeps autosaves and rotating recovery copies isolated between games',()=>{
 const {values}=store(),a=createSavedGame(fresh('A')),ka=saveKeys(slotSaveKey(a.id!));
 const s=loadSave()!;s.day=2;expect(saveGame(s)).toBe(true);
 const b=createSavedGame({...fresh('B'),day:7}),kb=saveKeys(slotSaveKey(b.id!));const t=loadSave()!;t.day=8;expect(saveGame(t)).toBe(true);
 expect(JSON.parse(values.get(ka.recent[0])!).day).toBe(1);expect(JSON.parse(values.get(kb.recent[0])!).day).toBe(7);
 values.set(ka.main,'broken');expect(activateSavedGame(a.id!).ok).toBe(true);expect(inspectSave()).toMatchObject({status:'recovered',data:{profile:{name:'A'},day:1}});
 expect(values.get(kb.main)).toContain('"day":8');expect(values.get(ka.main)).toBe('broken');
});
it('renames the game without changing its character or any save bytes and rejects blank/oversized names',()=>{
 const {values}=store(),a=createSavedGame(fresh('Maria')),key=slotSaveKey(a.id!),before=values.get(key);
 expect(renameSavedGame(a.id!,'  Refúgio da serra  ').ok).toBe(true);expect(listSavedGames().games[0].name).toBe('Refúgio da serra');expect(values.get(key)).toBe(before);expect(loadSave()!.profile.name).toBe('Maria');
 for(const name of ['', ' ', 'x'.repeat(41),'bad\nname'])expect(renameSavedGame(a.id!,name).ok).toBe(false);
});
it('leaves the active game and legacy backup intact when quota prevents creating or activating another game',()=>{
 const {storage,values}=store();values.set(SAVE_KEY,JSON.stringify(fresh('Original')));values.set(SAVE_BACKUP_KEY,'exact old backup');const a=createSavedGame(fresh('A'));
 const originalSet=storage.setItem;storage.setItem=(key,value)=>{if(key===ACTIVE_SLOT_KEY)throw Error('quota');originalSet(key,value);};
 const before=new Map(values);expect(createSavedGame(fresh('Failed')).ok).toBe(false);expect(values).toEqual(before);expect(loadSave()!.profile.name).toBe('A');
 expect(activateSavedGame('legacy').ok).toBe(false);expect(values.get(ACTIVE_SLOT_KEY)).toBe(a.id);
});
it('deletes only the chosen game and its recovery copies, preserving all other games',()=>{
 const {values}=store(),a=createSavedGame(fresh('A')),ka=saveKeys(slotSaveKey(a.id!));const s=loadSave()!;s.day=2;saveGame(s);
 const b=createSavedGame(fresh('B')),before=values.get(slotSaveKey(b.id!));expect(deleteSavedGame(a.id!).ok).toBe(true);
 for(const key of [ka.main,ka.meta,ka.backup,...ka.recent,ka.damaged])expect(values.has(key)).toBe(false);
 expect(values.get(slotSaveKey(b.id!))).toBe(before);expect(loadSave()!.profile.name).toBe('B');expect(listSavedGames().games).toHaveLength(1);
});
it('shows invalid and future games, refuses to load them and never redirects a damaged active pointer to another game',()=>{
 const {values}=store(),a=createSavedGame(fresh('A')),key=slotSaveKey(a.id!);values.set(key,JSON.stringify({...fresh('Future'),version:99}));
 expect(listSavedGames().games[0].read.status).toBe('future');expect(activateSavedGame(a.id!).ok).toBe(false);expect(inspectSave().status).toBe('future');
 values.set(ACTIVE_SLOT_KEY,'unexpected-key');const old=values.get(key);expect(inspectSave().status).toBe('unavailable');expect(saveGame(fresh()).valueOf()).toBe(false);expect(values.get(key)).toBe(old);
});
it('discovers a slot with only a recovery copy and no metadata',()=>{
 const {values}=store(),a=createSavedGame(fresh('Recovered')),key=slotSaveKey(a.id!);values.set(key+'-recent-1',values.get(key)!);values.delete(key);values.delete(key+'-meta');
 expect(listSavedGames().games[0]).toMatchObject({id:a.id,name:'Recovered',read:{status:'recovered'}});
});
