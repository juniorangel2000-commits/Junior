import {describe,it,expect,vi} from 'vitest';
import {createNewSave,validateSave,migrateSave} from '../src/systems/save';
import {createCharacterProfile} from '../src/data/characters';
import {FIELDS_IPES} from '../src/data/open-fields';
import {placeHiveTrap,collectHiveTrap,swarmDay,trapSwarmed,nextHoneyReady,hiveHoney,validBeekeeping,SWARM_EVERY_DAYS,SWARM_CHANCE,type HiveTrap} from '../src/systems/beekeeping';
import {placeMachine,collectMachine,machineReady,type MachineRuntime,type MachineSpace} from '../src/systems/machines';
import {HIVE_MINUTES,CRAFTED_MACHINE_IDS} from '../src/data/machines';
import {calendarDate,DAYS_PER_SEASON} from '../src/systems/calendar';
import {performVillageService} from '../src/systems/village-services';
import {MERCHANTS} from '../src/data/village-commerce';
import {RECIPES} from '../src/data/recipes';
import type {SaveData} from '../src/types';

const fresh=():SaveData=>{const s=createNewSave(createCharacterProfile('Abelhas'));s.time=600;s.villageEconomy!.coins=1000;return s;};
const ipe=FIELDS_IPES[0],nearIpe={x:ipe.x+30,y:ipe.y+10};
const fields=()=>{const s=fresh();s.activeArea='openFields';s.inventory.emptyHive=2;return s;};

describe('colmeia vazia nos Campos',()=>{
 it('o Augusto vende a colmeia vazia; ela não se monta na bancada',()=>{
  const s=fresh();expect(performVillageService(s,'buy-empty-hive').ok).toBe(true);expect(s.inventory.emptyHive).toBe(1);expect(s.villageEconomy!.coins).toBe(880);
  expect(CRAFTED_MACHINE_IDS).not.toContain('beehive');expect(RECIPES.some(r=>r.id==='beehive')).toBe(false);
 });
 it('fica só junto a um ipê em pé, uma por ipê',()=>{
  const s=fields(),w=()=>true;
  expect(placeHiveTrap(s,{x:100,y:100},w).message).toContain('ipê');
  expect(placeHiveTrap(s,nearIpe,w).ok).toBe(true);expect(s.inventory.emptyHive).toBe(1);
  expect(placeHiveTrap(s,{x:ipe.x-30,y:ipe.y},w).message).toContain('já tem');
  s.openFields={...(s.openFields??{version:1,cut:{}}),felled:{[FIELDS_IPES[1].id]:s.day}} as any;
  expect(placeHiveTrap(s,{x:FIELDS_IPES[1].x+20,y:FIELDS_IPES[1].y},w).ok).toBe(false);
  const home=fresh();home.inventory.emptyHive=1;expect(placeHiveTrap(home,nearIpe,w).message).toContain('Campos');
 });
 it('o enxame vem num dia múltiplo de 5, pelo calendário (recarregar não sorteia de novo)',()=>{
  const trap:HiveTrap={id:1,ipe:ipe.id,x:nearIpe.x,y:nearIpe.y,day:1};
  const day=swarmDay(trap,1000)!;expect(day).toBeDefined();expect((day-1)%SWARM_EVERY_DAYS).toBe(0);
  expect(trapSwarmed(trap,day-1)).toBe(false);expect(trapSwarmed(trap,day)).toBe(true);expect(swarmDay(trap,1000)).toBe(day);
  let hits=0;for(let id=1;id<=400;id++)if(swarmDay({...trap,id},6)!==undefined)hits++;
  expect(hits/400).toBeGreaterThan(SWARM_CHANCE-.1);expect(hits/400).toBeLessThan(SWARM_CHANCE+.1);
 });
 it('recolher: com enxame vira colmeia povoada; sem enxame volta a vazia; falha ao salvar preserva',()=>{
  const s=fields();placeHiveTrap(s,nearIpe,()=>true);const trap=s.beekeeping!.traps[0];
  const before=structuredClone(s);expect(collectHiveTrap(s,trap.id,()=>false).ok).toBe(false);expect(s).toEqual(before);
  expect(collectHiveTrap(s,trap.id,()=>true).message).toContain('Ainda sem enxame');expect(s.inventory.emptyHive).toBe(2);
  placeHiveTrap(s,nearIpe,()=>true);const t2=s.beekeeping!.traps[0];s.day=swarmDay(t2,s.day+5000)!;
  expect(validateSave(s)).toBe(true);
  expect(collectHiveTrap(s,t2.id,()=>true).message).toContain('enxame');expect(s.inventory.beehive).toBe(1);expect(s.beekeeping!.traps).toHaveLength(0);
 });
 it('o save recusa colmeias longe do ipê ou no mesmo ipê',()=>{
  expect(validBeekeeping({version:1,nextId:2,traps:[{id:1,ipe:ipe.id,x:5,y:5,day:1}]},10)).toBe(false);
  expect(validBeekeeping({version:1,nextId:3,traps:[{id:1,ipe:ipe.id,x:nearIpe.x,y:nearIpe.y,day:1},{id:2,ipe:ipe.id,x:nearIpe.x,y:nearIpe.y,day:1}]},10)).toBe(false);
  expect(validBeekeeping({version:1,nextId:2,traps:[{id:1,ipe:ipe.id,x:nearIpe.x,y:nearIpe.y,day:1}]},10)).toBe(true);
 });
});

describe('colmeia povoada na Propriedade',()=>{
 function setup(){let s=fresh();s.inventory.beehive=1;const p={x:176,y:208,facing:{x:0,y:-1}};let space:MachineSpace|undefined='property';
  const rt:MachineRuntime={read:()=>s,snapshot:()=>structuredClone(s),write:vi.fn(()=>true),apply:d=>{s=d;},player:()=>p,space:()=>space,bounds:()=>({width:512,height:512}),blocked:()=>false,placement:()=>'',actors:()=>[],enabled:()=>true};
  return{rt,get s(){return s;},space:(v:typeof space)=>{space=v;}};}
 const go=(s:SaveData,minutes:number)=>{const n=(s.day-1)*1440+s.time+minutes;s.day=Math.floor(n/1440)+1;s.time=n%1440;};
 it('só ao ar livre; começa a fazer mel sozinha e dá mel a cada 4 dias, com cera a cada 3 coletas',()=>{
  const t=setup();t.space('farm:1');expect(placeMachine(t.rt,'beehive').ok).toBe(false);t.space('property');
  expect(placeMachine(t.rt,'beehive').ok).toBe(true);const hive=()=>t.s.machines!.items[0];expect(hive().job!.readyAt-hive().job!.startedAt).toBe(HIVE_MINUTES);
  expect(collectMachine(t.rt,hive().id).ok).toBe(false);
  for(let n=1;n<=3;n++){go(t.s,HIVE_MINUTES);expect(machineReady(t.s,hive())).toBe(true);expect(collectMachine(t.rt,hive().id).ok).toBe(true);}
  expect(t.s.inventory.honey).toBe(3);expect(t.s.inventory.beeswax).toBe(1);expect(hive().harvests).toBe(3);expect(validateSave(t.s)).toBe(true);
 });
 it('mel que ficaria pronto no Inverno passa para a Primavera',()=>{
  const winterStart=3*DAYS_PER_SEASON+1,start=(winterStart-3)*1440+600,ready=nextHoneyReady(start);
  expect(calendarDate(Math.floor(ready/1440)+1).season).toBe('spring');
  const autumn=(2*DAYS_PER_SEASON)*1440;expect(nextHoneyReady(autumn)).toBe(autumn+HIVE_MINUTES);
 });
 it('margaridas ou girassóis maduros perto dão mel de flor',()=>{
  const s=fresh();const hive={x:10,y:10};expect(hiveHoney(s,hive)).toBe('honey');
  s.crops=[{x:12,y:11,growth:1,watered:false,crop:'daisy'} as any];expect(hiveHoney(s,hive)).toBe('daisyHoney');
  s.crops.push({x:9,y:8,growth:1,watered:false,crop:'sunflower'} as any,{x:8,y:9,growth:1,watered:false,crop:'sunflower'} as any);expect(hiveHoney(s,hive)).toBe('sunflowerHoney');
  s.crops=[{x:12,y:11,growth:.5,watered:false,crop:'daisy'} as any,{x:20,y:20,growth:1,watered:false,crop:'daisy'} as any];expect(hiveHoney(s,hive)).toBe('honey');
 });
 it('Amélia compra mel e cera; Nilo paga mais pelo mel de flor; nenhuma loja vende',()=>{
  expect(MERCHANTS.herbalist.sell).toMatchObject({honey:40,beeswax:30,daisyHoney:70,sunflowerHoney:75});
  expect(MERCHANTS.traveler.sell).toMatchObject({daisyHoney:85,sunflowerHoney:90});
  for(const m of Object.values(MERCHANTS))for(const id of ['honey','beeswax','daisyHoney','sunflowerHoney'] as const)expect(m.buy[id]).toBeUndefined();
 });
 it('saves anteriores ganham os itens novos zerados',()=>{
  const old:any=fresh();for(const id of ['emptyHive','beehive','beeswax','daisyHoney','sunflowerHoney'])delete old.inventory[id];
  expect(migrateSave(old)!.inventory).toMatchObject({emptyHive:0,beehive:0,beeswax:0});
 });
});
