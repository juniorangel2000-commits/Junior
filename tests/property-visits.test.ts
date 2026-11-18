import {describe,it,expect} from 'vitest';
import {createNewSave,validateSave,migrateSave} from '../src/systems/save';
import {createCharacterProfile} from '../src/data/characters';
import {ITEMS} from '../src/data/items';
import {createSocialRuntime} from '../src/systems/npc-social';
import {restDay,rainyDay,REST_WEEKDAY} from '../src/data/village-schedule';
import {propertyVisitor,visitingProperty,receiveVisitGift,propertyVisitDialogue,PROPERTY_VISIT_GIFTS,PROPERTY_VISIT} from '../src/systems/property-visits';
import {MerchantDailyRoutine} from '../src/systems/merchant-routine';
import type {RoutineId} from '../src/systems/merchant-routine';
import type {SaveData} from '../src/types';

const friends=(affinity:number)=>{const s=createNewSave(createCharacterProfile('Amiga'));
 s.npcSocial={version:1,players:Object.fromEntries(Object.keys(REST_WEEKDAY).map(id=>[id,{affinity}])),pairs:{},memories:{}};return s;};
const visitDay=(s:SaveData)=>{for(let d=2;d<400;d++){s.day=d;if(propertyVisitor(s))return d;}throw new Error('sem visita');};

describe('visitas à propriedade',()=>{
 it('os presentes existem e cada morador com folga tem presente',()=>{
  for(const id of Object.keys(REST_WEEKDAY)){const list=PROPERTY_VISIT_GIFTS[id as never]!;expect(list.length).toBeGreaterThan(0);
   for(const g of list)for(const item of Object.keys(g.items))expect(Object.hasOwn(ITEMS,item),`${id}: ${item}`).toBe(true);}
 });
 it('só vem quem tem amizade 8 ou mais, na folga e com tempo aberto',()=>{
  const s=friends(7);for(let d=1;d<200;d++){s.day=d;expect(propertyVisitor(s)).toBeUndefined();}
  const f=friends(8);let visits=0;
  for(let d=1;d<200;d++){f.day=d;const v=propertyVisitor(f);if(!v)continue;visits++;expect(restDay(v as RoutineId,d)).toBe(true);expect(rainyDay(d)).toBe(false);}
  expect(visits).toBeGreaterThan(20);
 });
 it('o visitante fica na propriedade à tarde e some da vila nesse horário',()=>{
  const s=friends(10),day=visitDay(s),id=propertyVisitor(s)!;
  s.time=PROPERTY_VISIT.start-1;expect(visitingProperty(id,s)).toBe(false);
  s.time=PROPERTY_VISIT.start;expect(visitingProperty(id,s)).toBe(true);
  s.time=PROPERTY_VISIT.end;expect(visitingProperty(id,s)).toBe(false);
  s.time=PROPERTY_VISIT.start+10;expect(s.day).toBe(day);
  const r=new MerchantDailyRoutine(id as RoutineId,{x:288,y:300,direction:'down',shop:true},{entry:{x:288,y:335},isBlocked:()=>false,validPosition:()=>true,stops:[{x:9,y:7}],tileSize:32} as never,undefined,6,()=>({entry:{x:288,y:335},isBlocked:()=>false,validPosition:()=>true,stops:[{x:9,y:7}],tileSize:32}) as never);
  expect(r.availability(s).message).toContain('Visitando a sua propriedade');
  const before={...r.state};r.step(.1,s,{blocked:()=>false,fits:()=>true,arrival:p=>p});expect(r.state.x).toBe(before.x);expect(r.state.y).toBe(before.y);
 });
 it('entrega o presente uma vez por dia, com +1 de amizade, e salva de forma compatível',()=>{
  const s=friends(10);visitDay(s);s.time=PROPERTY_VISIT.start+30;const id=propertyVisitor(s)!;
  const root={s},runtime=createSocialRuntime(()=>root.s,()=>true,()=>root.s);
  expect(propertyVisitDialogue(s,id)[0]).not.toContain('Obrigado por me receber');
  const before=structuredClone(s.inventory),r=receiveVisitGift(runtime,id);
  expect(r.ok).toBe(true);expect(root.s.propertyVisitDay).toBe(s.day);expect(root.s.npcSocial!.players[id]!.affinity).toBe(11);
  const gift=Object.entries(PROPERTY_VISIT_GIFTS[id]![s.day%PROPERTY_VISIT_GIFTS[id]!.length].items)[0];
  expect((root.s.inventory as Record<string,number>)[gift[0]]).toBe(((before as Record<string,number>)[gift[0]]??0)+gift[1]!);
  expect(receiveVisitGift(runtime,id).ok).toBe(false);
  expect(propertyVisitDialogue(root.s,id)[0]).toContain('Obrigado por me receber');
  const loaded=migrateSave(JSON.parse(JSON.stringify(root.s)))!;expect(loaded.propertyVisitDay).toBe(s.day);expect(validateSave(loaded)).toBe(true);
  expect(validateSave({...loaded,propertyVisitDay:-3})).toBe(false);
  const old=JSON.parse(JSON.stringify(root.s));delete old.propertyVisitDay;expect(validateSave(old)).toBe(true);
 });
 it('fora do horário não entrega presente',()=>{
  const s=friends(10);visitDay(s);s.time=PROPERTY_VISIT.end+5;const id=propertyVisitor(s)!,root={s};
  expect(receiveVisitGift(createSocialRuntime(()=>root.s,()=>true,()=>root.s),id).ok).toBe(false);
 });
});
