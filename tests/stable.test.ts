import {describe,it,expect} from 'vitest';
import {createNewSave,validateSave,migrateSave} from '../src/systems/save';
import {createCharacterProfile} from '../src/data/characters';
import {FARM_BUILDINGS,FARM_KINDS} from '../src/data/farm-buildings';
import {createFarmRuntime,placeFarmBase,deliverFarmMaterials,finishFarmConstruction,farmSites,farmAnchor,farmHomePoint,farmSiteBlocked,farmSitePointBlocked,toggleFarmGate,assignFarmAnimal} from '../src/systems/farm-construction';
import {stableReady,HORSE_ID} from '../src/systems/horse-taming';
import {AnimalBrain} from '../src/systems/animals';
import {syncToolInstances} from '../src/systems/tool-instances';
const setup=()=>{
 let save=createNewSave(createCharacterProfile('Estábulo'));Object.assign(save.inventory,{wood:1000,stone:1000,plank:1000,hardwood:20,windowKit:4,hammer:1});syncToolInstances(save.inventory);
 let player={x:920,y:1168};const rt=createFarmRuntime(()=>save,()=>true,()=>save,()=>save.inventory,()=>player,()=>'',()=>{});
 return{get save(){return save},set save(v:typeof save){save=v},rt,setPlayer:(p:typeof player)=>{player=p}};
};
describe('estábulo aberto do cavalo',()=>{
 it('faz parte das construções, exige madeira nobre e só libera a corda ao concluir',()=>{
  const t=setup();expect(FARM_KINDS).toContain('stable');expect(FARM_BUILDINGS.stable).toMatchObject({animal:'horse',capacity:1,openYard:true});expect(FARM_BUILDINGS.stable.cost.hardwood).toBeGreaterThan(0);
  expect(placeFarmBase(t.rt,'stable',25,30).ok).toBe(true);const site=farmSites(t.save)[0];t.setPlayer(farmAnchor(site));expect(stableReady(t.save)).toBe(false);
  t.save.inventory.hardwood=0;expect(deliverFarmMaterials(t.rt,site.id).ok).toBe(true);expect(finishFarmConstruction(t.rt,site.id).ok).toBe(false);
  t.save.inventory.hardwood=12;expect(deliverFarmMaterials(t.rt,site.id).ok).toBe(true);expect(finishFarmConstruction(t.rt,site.id).ok).toBe(true);expect(stableReady(t.save)).toBe(true);expect(validateSave(t.save)).toBe(true);expect(migrateSave(t.save)?.farmConstruction).toEqual(t.save.farmConstruction);
 });
 it('não cria cerca ou porteira invisível, mas mantém a parede e os postes sólidos',()=>{
  const site={id:1,kind:'stable' as const,x:25,y:30,delivered:{...FARM_BUILDINGS.stable.cost},finished:true,animals:[],hay:0,gateOpen:false};const d=FARM_BUILDINGS.stable,left=site.x*32,bottom=(site.y+d.height)*32;
  expect(farmSiteBlocked(site,25,30)).toBe(true);expect(farmSiteBlocked(site,25,35)).toBe(false);
  for(const x of [left+5,left+70,left+112,left+155,left+218])expect(farmSitePointBlocked(site,x,bottom-4)).toBe(false);
  expect(farmSitePointBlocked(site,left+27,bottom-10)).toBe(true);expect(farmSitePointBlocked(site,left+197,bottom-10)).toBe(true);
  const t=setup();t.save.farmConstruction={version:1,nextId:2,sites:[site]};t.setPlayer(farmAnchor(site));const before=structuredClone(t.save);expect(toggleFarmGate(t.rt,1).ok).toBe(false);expect(t.save).toEqual(before);
 });
 it('aloja o cavalo real, mantém capacidade 1 e permite entrar e sair a pé sem atravessar estrutura',()=>{
  const t=setup();t.save.day=7;t.save.horseTaming={version:1,trust:7,tamed:true,lastFedDay:7,name:'Trovão'};
  expect(placeFarmBase(t.rt,'stable',25,30).ok).toBe(true);let site=farmSites(t.save)[0];const at=farmAnchor(site);t.setPlayer(at);deliverFarmMaterials(t.rt,site.id);finishFarmConstruction(t.rt,site.id);site=farmSites(t.save)[0];
  t.save.recruitedAnimals=[HORSE_ID];t.save.animalPositions={forest:[],property:[{id:HORSE_ID,...at,direction:'up'}]};expect(assignFarmAnimal(t.rt,site.id,HORSE_ID).ok).toBe(true);expect(assignFarmAnimal(t.rt,site.id,HORSE_ID).ok).toBe(false);expect(validateSave(t.save)).toBe(true);
  const h=new AnimalBrain(HORSE_ID,'horse',at.x,at.y,false,()=>false,84,()=>0,(x,y)=>farmSitePointBlocked(site,x,y)),home=farmHomePoint(site);let previous={x:h.x,y:h.y};
  for(let n=0;n<150;n++){h.update(.05,home,[h],true,2,false);expect(Math.hypot(h.x-previous.x,h.y-previous.y)).toBeLessThanOrEqual(5);previous={x:h.x,y:h.y};}
  expect(Math.hypot(h.x-home.x,h.y-home.y)).toBeLessThan(5);
  for(let n=0;n<150;n++)h.update(.05,at,[h],true,2,false);expect(Math.hypot(h.x-at.x,h.y-at.y)).toBeLessThan(5);
 });
});
