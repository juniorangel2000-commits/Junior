import {describe,it,expect,vi} from 'vitest';
// Plantas de teste: uma só de Primavera e uma com rebrota, sem mudar o catálogo real.
vi.mock('../src/data/crops',async importOriginal=>{
 const real=await importOriginal<typeof import('../src/data/crops')>();
 const CROPS={...real.CROPS,
  testSpring:{name:'Ervilha',seasons:['spring'],days:3,seed:'seeds',harvest:'turnip',yield:1},
  testBerry:{name:'Amora',seasons:['spring','summer','autumn','winter'],days:4,regrow:2,seed:'seeds',harvest:'turnip',yield:2},
 };
 return{...real,CROPS,CROP_IDS:Object.keys(CROPS),isCropId:(v:unknown)=>typeof v==='string'&&Object.hasOwn(CROPS,v),cropDefinition:(id?:string)=>(CROPS as Record<string,unknown>)[id??'turnip']};
});
import {Farming,advanceCrop,normalizeCrop,fertilizeCrop,cropStatus} from '../src/systems/farming';
import {CROPS} from '../src/data/crops';
import {Inventory} from '../src/systems/inventory';
import {createNewSave,validateSave} from '../src/systems/save';
import {createCharacterProfile} from '../src/data/characters';
import type {CropData} from '../src/types';

const stock=()=>new Inventory({seeds:10,turnip:0});
const growFor=(f:Farming,x:number,y:number,from:number,days:number)=>{for(let d=from;d<from+days;d++){f.water(x,y);f.update(0,d+1);}};

describe('catálogo de cultivos',()=>{
 it('registra o nabo com 4 dias regados, semente e colheita atuais',()=>{
  expect(CROPS.turnip).toMatchObject({name:'Nabo',days:4,seed:'seeds',harvest:'turnip',yield:1,seedReturn:1});
  // Etapa 3: o nabo passa a ser um cultivo de Primavera.
  expect(CROPS.turnip.seasons).toEqual(['spring']);
 });
});

describe('crescimento por dias regados',()=>{
 it('só conta os dias regados; dias secos e dias pulados não fazem crescer',()=>{
  const f=new Farming();f.plant(21,20,stock(),1);
  f.water(21,20);f.update(0,9);
  expect(f.cropAt(21,20)).toMatchObject({days:1,day:9,watered:false,growth:.25});
 });
 it('murcha na virada para uma estação fora da ficha e avisa qual planta foi',()=>{
  const f=new Farming();expect(f.plant(21,20,stock(),26,'testSpring' as never).ok).toBe(true);
  growFor(f,21,20,26,2);expect(f.cropAt(21,20)?.days).toBe(2);
  f.water(21,20);expect(f.update(0,29)).toEqual(['Ervilha']);
  expect(f.cropAt(21,20)).toBeUndefined();
 });
 it('recusa plantar fora de estação sem gastar semente e avisa quando faltam dias',()=>{
  const f=new Farming(),inv=stock();
  const r=f.plant(21,20,inv,29,'testSpring' as never);expect(r.ok).toBe(false);expect(r.message).toContain('Verão');expect(inv.data.seeds).toBe(10);
  expect(f.plant(21,20,inv,27,'testSpring' as never).message).toContain('faltam só 2 dias');
 });
 it('mantém plantas com rebrota no canteiro e produz de novo após os dias de rebrota',()=>{
  const f=new Farming(),inv=stock();f.plant(21,20,inv,1,'testBerry' as never);
  growFor(f,21,20,1,4);expect(f.harvest(21,20,inv)).toMatchObject({ok:true});
  expect(inv.data.turnip).toBe(2);expect(f.cropAt(21,20)).toMatchObject({days:2,growth:.5});
  expect(f.harvest(21,20,inv).ok).toBe(false);
  growFor(f,21,20,5,2);expect(f.harvest(21,20,inv).ok).toBe(true);expect(inv.data.turnip).toBe(4);
 });
 it('converte canteiros de saves antigos mantendo o progresso proporcional',()=>{
  const crop:CropData={x:21,y:20,growth:.7,watered:true};normalizeCrop(crop,40);
  expect(crop).toEqual({x:21,y:20,growth:.5,watered:true,crop:'turnip',days:2,day:40});
  const done:CropData={x:21,y:20,growth:1,watered:true};normalizeCrop(done,3);expect(done).toMatchObject({days:4,growth:1});
 });
 it('processa saltos enormes de calendário sem travar',()=>{
  const crop:CropData={x:1,y:1,growth:0,watered:true,crop:'turnip',days:0,day:1};
  expect(advanceCrop(crop,{...CROPS.turnip,seasons:['spring','summer','autumn','winter']},999999)).toBe(true);expect(crop).toMatchObject({days:1,day:999999,watered:false});
 });
 it('o adubo dá um dia extra de crescimento e rega o canteiro',()=>{
  const crop:CropData={x:1,y:1,growth:0,watered:false,crop:'turnip',days:0,day:1};
  expect(fertilizeCrop(crop,1)).toBe(true);expect(crop).toMatchObject({days:1,growth:.25,watered:true});
  expect(cropStatus(crop)).toBe('Nabo · faltam 3 dias regados · regado hoje');
  crop.days=4;crop.growth=1;expect(fertilizeCrop(crop,1)).toBe(false);expect(cropStatus(crop)).toBe('Colher nabo');
 });
});

describe('canteiros no save',()=>{
 const save=(crops:CropData[],day=5)=>{const s=createNewSave(createCharacterProfile('Horta'));s.day=day;s.crops=crops;return s;};
 it('aceita o formato antigo e o formato por dias regados',()=>{
  expect(validateSave(save([{x:21,y:20,growth:.5,watered:true}]))).toBe(true);
  expect(validateSave(save([{x:21,y:20,growth:.5,watered:false,crop:'turnip',days:2,day:5}]))).toBe(true);
 });
 it('rejeita planta desconhecida, dias além da ficha e data futura',()=>{
  expect(validateSave(save([{x:21,y:20,growth:0,watered:false,crop:'cactus' as never,days:0,day:5}]))).toBe(false);
  expect(validateSave(save([{x:21,y:20,growth:1,watered:false,crop:'turnip',days:5,day:5}]))).toBe(false);
  expect(validateSave(save([{x:21,y:20,growth:0,watered:false,crop:'turnip',days:0,day:6}]))).toBe(false);
  expect(validateSave(save([{x:21,y:20,growth:.5,watered:false}]))).toBe(false);
 });
});
