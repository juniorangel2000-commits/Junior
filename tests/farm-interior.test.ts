import {describe,it,expect,vi} from 'vitest';
import {createNewSave,validateSave} from '../src/systems/save';
import {createCharacterProfile} from '../src/data/characters';
import {FARM_BUILDINGS} from '../src/data/farm-buildings';
import {FARM_INTERIORS,hasInterior,interiorBlocked,interiorSafe,interiorSpawn,interiorExit,INTERIOR_TILE as T} from '../src/data/farm-interiors';
import {animalsInside,scheduledInside,nextTransition,farmClock,farmDoorPoint,nearFarmDoor,DAY_START,NIGHT_START} from '../src/systems/farm-interior';
import {setFarmAnimalsInside,farmAnchor,type FarmRuntime,type FarmSite} from '../src/systems/farm-construction';
import type {SaveData} from '../src/types';

const site=(kind:'coop'|'barn'|'silo'|'stable',extra:Partial<FarmSite>={}):FarmSite=>({id:1,kind,x:20,y:30,delivered:{...FARM_BUILDINGS[kind].cost},finished:true,animals:[],hay:0,gateOpen:true,...extra});
const at=(day:number,time:number)=>({day,time});

describe('rotina dos animais',()=>{
 it('ficam no cercado das 06:00 às 18:00 e dentro à noite',()=>{
  expect(scheduledInside(farmClock(at(1,DAY_START-1)))).toBe(true);
  expect(scheduledInside(farmClock(at(1,DAY_START)))).toBe(false);
  expect(scheduledInside(farmClock(at(1,NIGHT_START-1)))).toBe(false);
  expect(scheduledInside(farmClock(at(1,NIGHT_START)))).toBe(true);
  expect(scheduledInside(farmClock(at(3,0)))).toBe(true);
 });
 it('calcula a próxima virada',()=>{
  expect(nextTransition(farmClock(at(1,300)))).toBe(DAY_START);
  expect(nextTransition(farmClock(at(1,600)))).toBe(NIGHT_START);
  expect(nextTransition(farmClock(at(1,1200)))).toBe(1440+DAY_START);
 });
 it('"Recolher" vale até a noite e "Soltar" vale até a manhã',()=>{
  const s=site('coop',{animals:['forest-chicken-1']});
  s.animalsOverride={inside:true,until:nextTransition(farmClock(at(2,600)))};
  expect(animalsInside(s,at(2,600))).toBe(true);expect(animalsInside(s,at(2,NIGHT_START+10))).toBe(true);expect(animalsInside(s,at(3,DAY_START+1))).toBe(false);
  s.animalsOverride={inside:false,until:nextTransition(farmClock(at(2,1300)))};
  expect(animalsInside(s,at(2,1300))).toBe(false);expect(animalsInside(s,at(3,DAY_START-1))).toBe(false);expect(animalsInside(s,at(3,NIGHT_START))).toBe(true);
 });
 it('só galinheiro e curral prontos têm interior',()=>{
  expect(hasInterior('coop')).toBe(true);expect(hasInterior('barn')).toBe(true);expect(hasInterior('silo')).toBe(false);expect(hasInterior('stable')).toBe(false);
  expect(animalsInside(site('silo'),at(1,0))).toBe(false);expect(animalsInside(site('coop',{finished:false}),at(1,0))).toBe(false);
 });
});

describe('planta dos interiores',()=>{
 for(const kind of ['coop','barn'] as const){
  const l=FARM_INTERIORS[kind]!;
  it(`${kind}: paredes e objetos bloqueiam; porta e todo o chão livre ficam alcançáveis`,()=>{
   expect(interiorBlocked(l,T/2,3*T)).toBe(true);expect(interiorBlocked(l,3*T,T/2)).toBe(true);
   for(const f of l.fixtures.filter(f=>f.solid))expect(interiorBlocked(l,f.x+f.w/2,f.y+f.h/2),f.id).toBe(true);
   expect(interiorSafe(l,interiorSpawn(l))).toBe(true);
   const exit=interiorExit(l);expect(interiorBlocked(l,exit.x,exit.y)).toBe(false);
   // Busca em largura a partir da porta: todo ponto livre do chão precisa ser alcançável.
   const step=8,key=(x:number,y:number)=>`${x},${y}`,start=interiorSpawn(l),seen=new Set([key(start.x,start.y)]),queue=[start];
   for(let i=0;i<queue.length;i++){const p=queue[i];for(const[dx,dy]of[[step,0],[-step,0],[0,step],[0,-step]]){const q={x:p.x+dx,y:p.y+dy};if(!seen.has(key(q.x,q.y))&&q.y<l.height*T&&interiorSafe(l,q)){seen.add(key(q.x,q.y));queue.push(q);}}}
   for(let y=start.y%step;y<l.height*T;y+=step)for(let x=start.x%step;x<l.width*T;x+=step)if(interiorSafe(l,{x,y}))expect(seen.has(key(x,y)),`${x},${y}`).toBe(true);
  });
 }
 it('o galinheiro tem 6 ninhos; o curral, 4 baias',()=>{
  expect(FARM_INTERIORS.coop!.fixtures.filter(f=>f.kind==='nest')).toHaveLength(6);
  expect(FARM_INTERIORS.barn!.fixtures.filter(f=>f.kind==='stall'&&!f.solid)).toHaveLength(4);
 });
});

describe('recolher e soltar pelo painel',()=>{
 const setup=(time:number)=>{let s:SaveData=createNewSave(createCharacterProfile('Curral'));s.time=time;s.recruitedAnimals=['forest-chicken-1'];s.farmConstruction={version:1,nextId:2,sites:[site('coop',{animals:['forest-chicken-1']})]};const write=vi.fn(()=>true),rt:FarmRuntime={snapshot:()=>structuredClone(s),write,apply:d=>{s=d;},player:()=>farmAnchor(s.farmConstruction!.sites[0]),placement:()=>''};return{rt,get s(){return s;},write};};
 it('recolhe de dia, salva e mantém o save válido',()=>{
  const t=setup(600);expect(setFarmAnimalsInside(t.rt,1,true).ok).toBe(true);
  expect(animalsInside(t.s.farmConstruction!.sites[0],t.s)).toBe(true);expect(t.write).toHaveBeenCalled();expect(validateSave(t.s)).toBe(true);
  expect(setFarmAnimalsInside(t.rt,1,true).ok).toBe(false);
  expect(setFarmAnimalsInside(t.rt,1,false).ok).toBe(true);expect(animalsInside(t.s.farmConstruction!.sites[0],t.s)).toBe(false);
 });
 it('não recolhe sem animais e rejeita registros inválidos no save',()=>{
  const t=setup(600);t.s.farmConstruction!.sites[0].animals=[];expect(setFarmAnimalsInside(t.rt,1,true).ok).toBe(false);
  const s=setup(600).s;s.farmConstruction!.sites[0].animalsOverride={inside:'sim' as never,until:5};expect(validateSave(s)).toBe(false);
  const silo=setup(600).s;silo.farmConstruction!.sites=[site('silo',{animalsOverride:{inside:true,until:5}})];expect(validateSave(silo)).toBe(false);
 });
 it('a porta fica no cercado, à frente da construção',()=>{
  const s=createNewSave(createCharacterProfile('Porta'));s.farmConstruction={version:1,nextId:2,sites:[site('coop')]};const door=farmDoorPoint(s.farmConstruction.sites[0]);
  expect(door).toEqual({x:(20+2+.5)*32,y:(30+3+.5)*32});expect(nearFarmDoor(s,door)?.id).toBe(1);expect(nearFarmDoor(s,{x:door.x,y:door.y+80})).toBeUndefined();
 });
});
