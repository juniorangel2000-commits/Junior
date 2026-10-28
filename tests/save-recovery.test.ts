import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {createNewSave,inspectSave,loadSave,preserveInvalidSave,saveGame,SAVE_KEY,SAVE_BACKUP_KEY,SAVE_DAMAGED_KEY,SAVE_RECENT_KEYS} from '../src/systems/save';
import {createCharacterProfile} from '../src/data/characters';
const snapshot=()=>createNewSave(createCharacterProfile('Recuperação','farmer-female'));
let values:Map<string,string>;
let write:ReturnType<typeof vi.fn>;
beforeEach(()=>{
 values=new Map();write=vi.fn((key:string,value:string)=>{values.set(key,value);});
 vi.stubGlobal('localStorage',{getItem:(key:string)=>values.get(key)??null,setItem:write,removeItem:(key:string)=>values.delete(key)});
});
afterEach(()=>vi.unstubAllGlobals());
describe('preservação e recuperação de partidas',()=>{
 it.each(['{bad',JSON.stringify({...snapshot(),day:-1}),''])('não sobrescreve partida ilegível da mesma versão: %s',raw=>{
  values.set(SAVE_KEY,raw);expect(inspectSave().status).toBe('invalid');expect(saveGame(snapshot())).toBe(false);expect(values.get(SAVE_KEY)).toBe(raw);expect(write).not.toHaveBeenCalled();
 });
 it('rotaciona duas cópias válidas e recupera a mais recente sem escrever na leitura',()=>{
  const s=snapshot();saveGame(s);s.day=2;saveGame(s);s.day=3;saveGame(s);
  expect(JSON.parse(values.get(SAVE_RECENT_KEYS[0])!).day).toBe(2);expect(JSON.parse(values.get(SAVE_RECENT_KEYS[1])!).day).toBe(1);
  values.set(SAVE_KEY,'broken');write.mockClear();expect(inspectSave().status).toBe('recovered');expect(loadSave()?.day).toBe(2);expect(write).not.toHaveBeenCalled();
 });
 it('ignora backup inválido e tenta a próxima cópia e o backup legado',()=>{
  values.set(SAVE_KEY,'broken');values.set(SAVE_RECENT_KEYS[0],'bad');values.set(SAVE_BACKUP_KEY,JSON.stringify(snapshot()));expect(inspectSave().status).toBe('recovered');
 });
 it('preserva bytes após confirmação e só então permite substituir a partida ilegível',()=>{
  values.set(SAVE_KEY,'broken');expect(saveGame(snapshot())).toBe(false);expect(preserveInvalidSave()).toBe(true);expect(values.get(SAVE_DAMAGED_KEY)).toBe('broken');expect(saveGame(snapshot())).toBe(true);
 });
 it('não substitui outro original já preservado nem uma versão futura',()=>{
  values.set(SAVE_KEY,'broken');values.set(SAVE_DAMAGED_KEY,'other');expect(preserveInvalidSave()).toBe(false);expect(saveGame(snapshot())).toBe(false);
  values.set(SAVE_KEY,JSON.stringify({...snapshot(),version:99}));values.set(SAVE_RECENT_KEYS[0],JSON.stringify(snapshot()));expect(inspectSave().status).toBe('future');expect(preserveInvalidSave()).toBe(false);expect(saveGame(snapshot())).toBe(false);
 });
 it('mantém o slot principal quando falta espaço para o backup',()=>{
  const s=snapshot(),raw=JSON.stringify(s);values.set(SAVE_KEY,raw);s.day=2;write.mockImplementation(()=>{throw new Error('QuotaExceeded');});expect(saveGame(s)).toBe(false);expect(values.get(SAVE_KEY)).toBe(raw);
 });
 it('mantém slot e backup quando a escrita final falha',()=>{
  const s=snapshot(),raw=JSON.stringify(s);values.set(SAVE_KEY,raw);s.day=2;write.mockImplementation((key:string,value:string)=>{if(key===SAVE_KEY)throw new Error('QuotaExceeded');values.set(key,value);});expect(saveGame(s)).toBe(false);expect(values.get(SAVE_KEY)).toBe(raw);expect(values.get(SAVE_RECENT_KEYS[0])).toBe(raw);
 });
 it('recupera também quando o slot principal desapareceu',()=>{
  values.set(SAVE_RECENT_KEYS[0],JSON.stringify(snapshot()));expect(inspectSave().status).toBe('recovered');expect(write).not.toHaveBeenCalled();
 });
});
