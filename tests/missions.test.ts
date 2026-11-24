import {beforeEach,describe,expect,it} from 'vitest';
import {createNewSave,loadSave,saveGame,validateSave} from '../src/systems/save';
import {createCharacterProfile} from '../src/data/characters';
import {CHAPTERS,FINAL_CHAPTER,missionKey} from '../src/data/missions';
import {chapterUnlocked,mergeMissionLogs,openChapters,trackMissions,validMissionLog} from '../src/systems/missions';
import {missionContext,newMissionLog} from '../src/systems/mission-checks';
import {homesteadGardenBeds} from '../src/data/property-homestead';
import {performVillageService} from '../src/systems/village-services';

const fresh=()=>createNewSave(createCharacterProfile('Missões'));
const memory=new Map<string,string>();
beforeEach(()=>{memory.clear();globalThis.localStorage={getItem:k=>memory.get(k)??null,setItem:(k,v)=>void memory.set(k,String(v)),removeItem:k=>void memory.delete(k),clear:()=>memory.clear(),key:i=>[...memory.keys()][i]??null,get length(){return memory.size;}} as Storage;});

describe('missões em capítulos (preview.49)',()=>{
 it('capítulos e missões têm nomes únicos, e cada pré-requisito existe',()=>{
  const ids=CHAPTERS.map(c=>c.id);expect(new Set(ids).size).toBe(ids.length);
  const keys=CHAPTERS.flatMap(c=>c.missions.map(m=>missionKey(c,m)));expect(new Set(keys).size).toBe(keys.length);
  for(const c of CHAPTERS)for(const a of c.after??[])expect(ids).toContain(a);
  expect(CHAPTERS.length).toBeGreaterThanOrEqual(40);expect(keys.length).toBeGreaterThanOrEqual(250);
 });
 it('a trilha é progressiva: no começo só o primeiro capítulo está aberto',()=>{
  const s=fresh();trackMissions(s);
  expect(openChapters(s).map(v=>v.chapter.id)).toEqual(['primeira-colheita']);
  const second=CHAPTERS.find(c=>c.id==='maos-a-obra')!;expect(chapterUnlocked(s.missions!,second)).toBe(false);
 });
 it('numa partida nova nenhuma missão do primeiro capítulo começa cumprida',()=>{
  const s=fresh();trackMissions(s);const v=openChapters(s)[0];
  expect(v.chapter.id).toBe('primeira-colheita');expect(v.missions.filter(x=>x.done).map(x=>x.mission.id)).toEqual([]);
 });
 it('cumprir o capítulo dá a conquista e abre o próximo',()=>{
  const s=fresh();s.homeSupplies={wateringCan:true,seedPacket:true};s.wateringCanWater=3;s.farmingProgress={prepared:true,planted:true,watered:true,harvested:true};
  const earned=trackMissions(s);expect(earned.map(c=>c.achievement)).toEqual(['Mãos na terra']);
  expect(s.missions!.achievements['primeira-colheita']).toBe(s.day);
  expect(openChapters(s).map(v=>v.chapter.id)).toEqual(expect.arrayContaining(['maos-a-obra','anos']));
 });
 it('Terra nova conta só os canteiros que o jogador abriu, não os da horta inicial',()=>{
  const s=fresh();s.preparedSoil=[...homesteadGardenBeds()];trackMissions(s);
  const ctx=missionContext(s,s.missions!);expect(ctx.newBeds()).toBe(0);
  s.preparedSoil.push({x:40,y:30},{x:41,y:30});expect(missionContext(s,s.missions!).newBeds()).toBe(2);
  s.crops=[{x:40,y:30,growth:0,watered:true,crop:'turnip',days:0,day:1} as never];expect(missionContext(s,s.missions!).plantedOnNewBed()).toBe(true);
 });
 it('save antigo, já avançado, recebe na hora as conquistas do que já fez',()=>{
  const s=fresh();s.homeSupplies={wateringCan:true,seedPacket:true};s.wateringCanWater=3;s.farmingProgress={prepared:true,planted:true,watered:true,harvested:true};
  s.progress={collected:true,craftedTools:true,harvested:true,processed:true,builtWorkbench:true,sawn:true,builtShelter:true};
  const earned=trackMissions(s);expect(earned.map(c=>c.id)).toEqual(expect.arrayContaining(['primeira-colheita','maos-a-obra']));
 });
 it('missão cumprida fica marcada mesmo que o item seja vendido depois',()=>{
  const s=fresh();s.inventory.fishingRod=1;trackMissions(s);s.inventory.fishingRod=0;trackMissions(s);
  expect(s.missions!.done).toContain('primeiro-anzol/rod');
  expect(s.missions!.seen).toContain('fishingRod');
 });
 it('juntar registros nunca perde progresso',()=>{
  const a={...newMissionLog(),areas:['village'],peak:500,achievements:{x:3}},b={...newMissionLog(),areas:['forest'],peak:200,achievements:{x:5,y:9},events:['train']};
  const m=mergeMissionLogs(a,b);expect(m.areas.sort()).toEqual(['forest','village']);expect(m.peak).toBe(500);expect(m.achievements).toEqual({x:3,y:9});expect(m.events).toEqual(['train']);
 });
 it('salvar uma cópia antiga do estado não apaga as conquistas já gravadas',()=>{
  const s=fresh();s.homeSupplies={wateringCan:true,seedPacket:true};s.wateringCanWater=3;s.farmingProgress={prepared:true,planted:true,watered:true,harvested:true};
  const old=structuredClone(s);delete old.missions;
  expect(saveGame(s)).toBe(true);expect(loadSave()!.missions!.achievements['primeira-colheita']).toBeDefined();
  old.inventory.hoe=0;old.farmingProgress={prepared:false,planted:false,watered:false,harvested:false};
  expect(saveGame(old)).toBe(true);expect(loadSave()!.missions!.achievements['primeira-colheita']).toBeDefined();
 });
 it('serviços dos moradores contam para as missões',()=>{
  const s=fresh();s.villageEconomy!.coins=500;s.time=20*60;
  expect(performVillageService(s,'inn-rest').ok).toBe(true);
  expect(s.missions?.events).toContain('service:inn-rest');
  expect(validateSave(s)).toBe(true);
 });
 it('o registro é validado no save',()=>{
  expect(validMissionLog(newMissionLog())).toBe(true);
  expect(validMissionLog({...newMissionLog(),peak:-1})).toBe(false);
  expect(validMissionLog({...newMissionLog(),achievements:{a:0}})).toBe(false);
  const s=fresh();(s as {missions?:unknown}).missions={areas:'x'};expect(validateSave(s)).toBe(false);
 });
 it('a conquista final exige todas as outras',()=>{
  const s=fresh();s.missions={...newMissionLog(),achievements:Object.fromEntries(CHAPTERS.filter(c=>c!==FINAL_CHAPTER).map(c=>[c.id,1]))};
  const earned=trackMissions(s);expect(earned.map(c=>c.id)).toContain(FINAL_CHAPTER.id);
 });
});
