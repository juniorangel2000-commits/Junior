import {describe,it,expect,vi} from 'vitest';
// O estábulo será feito pelo Codex; aqui um estábulo de teste representa qualquer
// construção pronta com animal 'horse'.
vi.mock('../src/data/farm-buildings',async importOriginal=>{
 const real=await importOriginal<typeof import('../src/data/farm-buildings')>();
 return{...real,FARM_KINDS:[...real.FARM_KINDS,'stable'],FARM_BUILDINGS:{...real.FARM_BUILDINGS,stable:{name:'Estábulo',width:7,height:6,bodyRows:4,cost:{wood:1},capacity:1,animal:'horse',description:''}}};
});
import {createNewSave,validateSave,migrateSave} from '../src/systems/save';
import {createCharacterProfile} from '../src/data/characters';
import {HORSE_ID,TAMING_DAYS,feedHorse,applyTamingLoss,feedingDay,settleHorseTaming,tamingPhase,nameHorse,startHorseEscort,transferHorseToProperty,validHorseName,horseTaming,placeBasket,pickUpBasket,stableReady} from '../src/systems/horse-taming';
import {deliverAnimalEscort,releaseAnimalEscort} from '../src/systems/animals';
import {assignFarmAnimal,farmAnchor,type FarmRuntime} from '../src/systems/farm-construction';
import {PROPERTY_FIELDS_RETURN} from '../src/data/open-fields';
import type {SaveData} from '../src/types';

const withStable=(s:SaveData)=>{s.farmConstruction={version:1,nextId:2,sites:[{id:1,kind:'stable' as never,x:20,y:30,delivered:{wood:1},finished:true,animals:[],hay:0,gateOpen:true}]};return s;};
const setup=(stable=false)=>{const s=createNewSave(createCharacterProfile('Doma'));s.activeArea='openFields';s.inventory.harvestBasket=3;if(stable)withStable(s);return s;};
const spot={x:1500,y:1200};
const tame=(s:SaveData)=>{for(let d=1;d<=TAMING_DAYS;d++){s.day=d;feedHorse(s,d);}return s;};

describe('confiança do cavalo',()=>{
 it('sobe no máximo um ponto por dia e fica domado no sétimo dia seguido',()=>{
  const s=setup();expect(feedHorse(s,1)).toMatchObject({ok:true,trust:1});
  expect(feedHorse(s,1).ok).toBe(false);expect(horseTaming(s).trust).toBe(1);
  for(let d=2;d<TAMING_DAYS;d++)expect(feedHorse(s,d)).toMatchObject({ok:true,trust:d,tamed:false});
  expect(feedHorse(s,TAMING_DAYS)).toMatchObject({ok:true,trust:TAMING_DAYS,tamed:true});
  expect(validateSave({...s,day:TAMING_DAYS})).toBe(true);
 });
 it('volta a zero quando passa um dia inteiro sem cesta',()=>{
  const s=setup();feedHorse(s,1);feedHorse(s,2);feedHorse(s,3);
  expect(applyTamingLoss(s,4)).toBe(false);expect(feedingDay(s,4)).toBe(4);
  expect(feedingDay(s,5)).toBe(1);expect(applyTamingLoss(s,5)).toBe(true);expect(horseTaming(s)).toMatchObject({trust:0,tamed:false});
  expect(feedHorse(s,6)).toMatchObject({ok:true,trust:1});
 });
 it('não perde a doma completa por falta de cesta',()=>{
  const s=tame(setup());expect(applyTamingLoss(s,30)).toBe(false);expect(horseTaming(s).tamed).toBe(true);
 });
 it('muda o comportamento por fase: de longe, tolerando e perto',()=>{
  expect(tamingPhase(1).clearance).toBeGreaterThan(tamingPhase(3).clearance);
  expect(tamingPhase(3).clearance).toBeGreaterThan(tamingPhase(5).clearance);
  expect(tamingPhase(2)).toEqual(tamingPhase(1));expect(tamingPhase(7)).toEqual(tamingPhase(5));
 });
});

describe('usar a cesta: ela fica no chão',()=>{
 it('sai da mochila e fica no chão como objeto, uma de cada vez',()=>{
  const s=setup();s.day=2;expect(placeBasket(s,spot,()=>true)).toMatchObject({ok:true});
  expect(s.inventory.harvestBasket).toBe(2);expect(horseTaming(s).basket).toEqual({...spot,day:2});expect(s.groundItems?.items??[]).toEqual([]);
  expect(placeBasket(s,spot,()=>true).message).toContain('Já há uma cesta');expect(validateSave(s)).toBe(true);
 });
 it('só funciona nos Campos, com cesta na mochila e sem salvar pela metade',()=>{
  const s=setup();s.activeArea='property';expect(placeBasket(s,spot,()=>true).ok).toBe(false);
  s.activeArea='openFields';const before=structuredClone(s);expect(placeBasket(s,spot,()=>false).ok).toBe(false);expect(s).toEqual(before);
  s.inventory.harvestBasket=0;expect(placeBasket(s,spot,()=>true).message).toContain('não tem');
 });
 it('pode ser recolhida de volta enquanto o cavalo não comeu',()=>{
  const s=setup();placeBasket(s,spot,()=>true);expect(pickUpBasket(s,()=>true).ok).toBe(true);
  expect(s.inventory.harvestBasket).toBe(3);expect(horseTaming(s).basket).toBeUndefined();
 });
 it('o cavalo come a cesta do dia com você fora; com você nos Campos ele vai até ela na cena',()=>{
  const s=setup();s.day=4;placeBasket(s,spot,()=>true);
  expect(settleHorseTaming(s,4,true)).toEqual([]);expect(horseTaming(s).basket).toBeDefined();
  expect(settleHorseTaming(s,4,false)).toMatchObject([{trust:1}]);expect(horseTaming(s)).toMatchObject({trust:1,lastFedDay:4});expect(horseTaming(s).basket).toBeUndefined();
 });
 it('cesta antiga conta só para um dia; os outros dias sem cesta zeram a confiança',()=>{
  const s=setup();s.day=1;placeBasket(s,spot,()=>true);s.day=9;
  expect(settleHorseTaming(s,9,false).map(r=>r.trust)).toEqual([1]);expect(horseTaming(s).trust).toBe(0);expect(feedingDay(s,9)).toBe(1);
 });
 it('o cavalo domado não precisa mais de cesta',()=>{
  const s=tame(setup());expect(placeBasket(s,spot,()=>true).message).toContain('já confia');
 });
});

describe('nome, corda e estábulo',()=>{
 it('a corda só depois da doma completa, do nome e com o estábulo pronto',()=>{
  const s=setup();s.inventory.cord=2;const at={...spot,direction:'down' as const};
  expect(startHorseEscort(s,at).message).toContain('doma completa');
  feedHorse(s,1);expect(startHorseEscort(s,at).ok).toBe(false);
  tame(s);expect(startHorseEscort(s,at).message).toContain('nome');
  expect(nameHorse(s,'  Trovão  ',()=>true)).toMatchObject({ok:true});expect(horseTaming(s).name).toBe('Trovão');
  expect(stableReady(s)).toBe(false);expect(startHorseEscort(s,at).message).toContain('estábulo');
  withStable(s);expect(stableReady(s)).toBe(true);
  expect(startHorseEscort(s,at)).toMatchObject({ok:true});expect(s.inventory.cord).toBe(1);
  expect(s.animalEscort).toEqual({id:HORSE_ID,area:'openFields'});expect(validateSave(s)).toBe(true);
 });
 it('valida nomes e não nomeia um cavalo ainda selvagem',()=>{
  expect(validHorseName('')).not.toBe('');expect(validHorseName('Estrela da Manhã')).toBe('');expect(validHorseName('R2D2')).not.toBe('');expect(validHorseName('a'.repeat(17))).not.toBe('');
  expect(nameHorse(setup(),'Pé de Pano',()=>true).ok).toBe(false);
 });
 it('atravessa para a Propriedade, vira do jogador ao soltar e mora no estábulo',()=>{
  const s=tame(setup(true));s.inventory.cord=1;nameHorse(s,'Trovão',()=>true);startHorseEscort(s,{x:1530,y:110,direction:'up'});
  const next=structuredClone(s);next.activeArea='property';next.player={...PROPERTY_FIELDS_RETURN};transferHorseToProperty(next,PROPERTY_FIELDS_RETURN);
  expect(next.animalEscort).toEqual({id:HORSE_ID,area:'property'});expect(validateSave(next)).toBe(true);
  expect(deliverAnimalEscort(next)).toBe(true);expect(next.recruitedAnimals).toContain(HORSE_ID);expect(next.inventory.cord).toBe(1);expect(validateSave(next)).toBe(true);
  const site=next.farmConstruction!.sites[0];next.animalPositions!.property=next.animalPositions!.property.map(p=>p.id===HORSE_ID?{...p,...farmAnchor(site)}:p);
  let saved=next;const rt:FarmRuntime={snapshot:()=>structuredClone(saved),write:()=>true,apply:d=>{saved=d;},player:()=>farmAnchor(site),placement:()=>''};
  expect(assignFarmAnimal(rt,1,HORSE_ID).ok).toBe(true);expect(saved.farmConstruction!.sites[0].animals).toEqual([HORSE_ID]);expect(validateSave(saved)).toBe(true);
 });
 it('soltar a corda nos Campos devolve a corda e o cavalo continua domado lá',()=>{
  const s=tame(setup(true));s.inventory.cord=1;nameHorse(s,'Trovão',()=>true);startHorseEscort(s,{...spot,direction:'down'});
  expect(releaseAnimalEscort(s)).toBe(true);expect(s.inventory.cord).toBe(1);expect(s.animalEscort).toBeUndefined();expect(validateSave(s)).toBe(true);
 });
});

describe('saves da doma',()=>{
 it('rejeita confiança impossível, cesta inválida, cavalo do jogador sem doma e nomes inválidos',()=>{
  const s=setup();s.horseTaming={version:1,trust:8,tamed:true};expect(validateSave(s)).toBe(false);
  s.horseTaming={version:1,trust:3,tamed:false};expect(validateSave(s)).toBe(false);
  s.horseTaming={version:1,trust:3,tamed:false,lastFedDay:s.day+1};expect(validateSave(s)).toBe(false);
  s.horseTaming={version:1,trust:2,tamed:false,lastFedDay:1,name:'Trovão'};expect(validateSave(s)).toBe(false);
  s.horseTaming={version:1,trust:0,tamed:false,basket:{x:5,y:5,day:1}};expect(validateSave(s)).toBe(false);
  s.horseTaming={version:1,trust:0,tamed:false,basket:{...spot,day:s.day+1}};expect(validateSave(s)).toBe(false);
  delete s.horseTaming;s.activeArea='property';s.recruitedAnimals=[HORSE_ID];expect(validateSave(s)).toBe(false);
 });
 it('saves antigos, sem doma, continuam válidos',()=>{
  const s=setup();delete s.horseTaming;expect(migrateSave(s)).not.toBeNull();
 });
});
