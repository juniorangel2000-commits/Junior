import {describe,it,expect} from 'vitest';
import {HOMESTEAD_HOUSE,HOMESTEAD_GATE,homesteadGardenBeds,homesteadResourceReserved,initializeHomestead} from '../src/data/property-homestead';
import {PROPERTY_WELL,WELL_BASE,WELL_SOURCE_FOOT} from '../src/data/property-well';
import {createNewSave,validateSave,migrateSave} from '../src/systems/save';
import {Farming} from '../src/systems/farming';
import {Building} from '../src/systems/building';
import type {CharacterProfile} from '../src/types';

const profile:CharacterProfile={name:'Casa',skin:'#eac39a',hairColor:'#71462e',outfit:'#70a97c',hairStyle:'preso'};
const fresh=()=>createNewSave(profile);

describe('casa, poço e horta cercada',()=>{
 it('alinha as bases e mantém a porta no acesso existente, com a horta à esquerda',()=>{
  expect(HOMESTEAD_HOUSE.x).toBe(784);
  expect(PROPERTY_WELL.y-(256-WELL_SOURCE_FOOT)*PROPERTY_WELL.scale).toBeCloseTo(HOMESTEAD_HOUSE.groundY,8);
  expect(WELL_BASE.y).toBeCloseTo(487.42,8);
  expect(WELL_BASE.x).toBeGreaterThan(HOMESTEAD_HOUSE.x+128);
  const beds=homesteadGardenBeds();expect(beds).toHaveLength(30);
  expect(Math.max(...beds.map(p=>p.x*32+16))).toBeLessThan(HOMESTEAD_HOUSE.x-128);
 });
 it('semeia uma vez o cercado utilizável, sem retirar sementes ou dar itens e plantas grátis',()=>{
  const state=fresh(),inventory={...state.inventory},home=structuredClone(state.home),crops=structuredClone(state.crops);
  expect(initializeHomestead(state)).toBe(true);
  expect(state.inventory).toEqual(inventory);expect(state.home).toEqual(home);expect(state.crops).toEqual(crops);
  expect(state.preparedSoil).toEqual(homesteadGardenBeds());expect(state.restoredFarmSoil).toHaveLength(45);
  const garden=new Building(state.buildings),farming=new Farming(state.crops,state.preparedSoil,state.farmingProgress,state.restoredFarmSoil);
  expect(state.buildings).toHaveLength(26);expect(state.buildings.filter(b=>b.kind==='fence')).toHaveLength(25);
  expect(garden.at(HOMESTEAD_GATE.x,HOMESTEAD_GATE.y)).toMatchObject({kind:'gate',rotation:0,gateFlip:true,open:false});
  expect(garden.isBlocked(16,16)).toBe(true);expect(garden.toggleGate(16,16).ok).toBe(true);expect(garden.isBlocked(16,16)).toBe(false);
  expect(homesteadGardenBeds().every(p=>farming.isPrepared(p.x,p.y)&&!garden.isBlocked(p.x,p.y))).toBe(true);
  expect(farming.isPrepared(25,22)).toBe(false);expect(validateSave(state)).toBe(true);
  const saved=structuredClone(state);expect(initializeHomestead(state)).toBe(false);expect(state).toEqual(saved);
 });
 it('preserva plantações antigas e novas construções em vez de mudar seu local ou recompensa',()=>{
  const state=fresh();state.day=62;
  state.crops=[{x:22,y:21,growth:.6,watered:true},{x:13,y:12,growth:0,watered:false}];
  state.preparedSoil=[{x:13,y:12}];state.restoredFarmSoil=[{x:28,y:20}];
  state.buildings=[{x:28,y:20,kind:'bench'},{x:12,y:12,kind:'fence',fenceBuiltDay:1},{x:14,y:14,kind:'floor'}];
  const originals=structuredClone({crops:state.crops,buildings:state.buildings});
  state.mapEdits!.terrain['15,12']='paving';state.mapEdits!.objects['editor-stone-homestead']={x:16,y:12,kind:'stone'};
  expect(validateSave(state)).toBe(true);initializeHomestead(state);
  expect(state.crops).toEqual(originals.crops);
  for(const original of originals.buildings)expect(state.buildings.find(b=>b.x===original.x&&b.y===original.y)).toEqual(original);
  expect(state.restoredFarmSoil).not.toContainEqual({x:22,y:21});
  expect(state.restoredFarmSoil?.filter(p=>p.x===28&&p.y===20)).toHaveLength(1);
  expect(state.preparedSoil).not.toContainEqual({x:14,y:14});expect(state.preparedSoil).not.toContainEqual({x:15,y:12});expect(state.preparedSoil).not.toContainEqual({x:16,y:12});
  expect(state.mapEdits!.terrain['15,12']).toBe('paving');expect(state.mapEdits!.objects['editor-stone-homestead']).toEqual({x:16,y:12,kind:'stone'});
  expect(state.buildings.filter(b=>b.x===12&&b.y===12)).toHaveLength(1);
  expect(state.buildings.filter(b=>b.kind==='fence'&&b.fenceBuiltDay===62).length).toBeGreaterThan(0);
  expect(validateSave(state)).toBe(true);expect(migrateSave(JSON.parse(JSON.stringify(state)))).toEqual(state);
 });
 it('não restaura cerca removida nem canteiro desfeito ao salvar e recarregar',()=>{
  const state=fresh();initializeHomestead(state);
  state.buildings=state.buildings.filter(b=>!(b.x===12&&b.y===10));
  state.preparedSoil=state.preparedSoil!.filter(p=>!(p.x===13&&p.y===11));
  const loaded=migrateSave(JSON.parse(JSON.stringify(state)))!;
  expect(initializeHomestead(loaded)).toBe(false);
  expect(loaded.buildings.some(b=>b.x===12&&b.y===10)).toBe(false);
  expect(loaded.preparedSoil).not.toContainEqual({x:13,y:11});expect(validateSave(loaded)).toBe(true);
 });
 it('não fecha a cerca sobre os pés salvos do jogador nem sobre animais na borda do canteiro',()=>{
  const state=fresh();state.player={x:13*32-2,y:10.5*32,direction:'right'};
  state.recruitedAnimals=['forest-cow-1'];
  state.animalPositions={forest:[],property:[{id:'forest-cow-1',x:19*32-2,y:13.5*32,direction:'left'}]};
  const position=structuredClone(state.player),animals=structuredClone(state.animalPositions);
  expect(validateSave(state)).toBe(true);
  initializeHomestead(state);
  expect(state.buildings.some(b=>b.x===12&&b.y===10)).toBe(false);
  expect(state.buildings.some(b=>b.x===13&&b.y===10)).toBe(false);
  expect(state.buildings.some(b=>b.x===19&&b.y===13)).toBe(false);
  expect(state.preparedSoil).not.toContainEqual({x:18,y:13});
  expect(state.player).toEqual(position);expect(state.animalPositions).toEqual(animals);expect(validateSave(state)).toBe(true);
 });
 it('reserva somente a clareira da horta e o acesso da porta para os recursos aleatórios',()=>{
  expect(homesteadGardenBeds().every(p=>homesteadResourceReserved(p.x,p.y))).toBe(true);
  expect(homesteadResourceReserved(24,16)).toBe(true);expect(homesteadResourceReserved(80,40)).toBe(false);
 });
 it('aceita ausência do marcador legado e rejeita revisões não reconhecidas',()=>{
  const state=fresh();expect(validateSave(state)).toBe(true);
  for(const marker of [0,2,'1',null,true])expect(validateSave({...state,homesteadRevision:marker})).toBe(false);
  expect(validateSave({...state,homesteadRevision:1})).toBe(true);
 });
});
