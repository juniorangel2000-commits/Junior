import {describe,it,expect} from 'vitest';
import {Building,BUILD_COSTS,buildingFootprint} from '../src/systems/building';
import {Inventory,INITIAL_INVENTORY} from '../src/systems/inventory';
import {AnimalBrain,startAnimalEscort,releaseAnimalEscort,transferAnimalEscort} from '../src/systems/animals';
import {createNewSave,migrateSave,validateSave} from '../src/systems/save';
import {FOREST_ANIMALS} from '../src/data/ancient-forest';
import {fenceConnections,fenceStage} from '../src/data/fences';
import type {BuildingData} from '../src/types';
const profile={name:'Cercado',skin:'#eac39a',hairColor:'#71462e',outfit:'#70a97c',hairStyle:'preso' as const};
const inv=()=>new Inventory({...INITIAL_INVENTORY,wood:100});
function pen():Building {
 const pieces:BuildingData[]=[];
 for(let x=10;x<=16;x++)for(let y=10;y<=16;y++)if(x===10||x===16||y===10||y===16)pieces.push({x,y,kind:x===13&&y===16?'gate':'fence',...(x===13&&y===16?{open:false,rotation:0 as const}:{fenceBuiltDay:1})});
 return new Building(pieces);
}
describe('porteiras, cercados e reparos',()=>{
 it('constrói nas quatro orientações e nos dois lados de abertura com custo único, sem martelo ou bancada',()=>{
  const b=new Building(),i=inv();
  for(const rotation of [0,1,2,3] as const)for(const gateFlip of [false,true]){
   const x=10+b.buildings.length;
   expect(b.place('gate',x,10,i,true,{nearWorkbench:false,rotation,gateFlip}).ok).toBe(true);
   expect(b.at(x,10)).toMatchObject({rotation,gateFlip,open:false});
   expect(b.isBlocked(x,10)).toBe(true);expect(b.toggleGate(x,10).ok).toBe(true);expect(b.isBlocked(x,10)).toBe(false);
  }
  expect(i.data.wood).toBe(100-8*BUILD_COSTS.gate.wood!);
  expect(b.place('gate',10,10,i,true).ok).toBe(false);expect(i.data.wood).toBe(68);
 });
 it('abre passagem para jogador/animais e recusa fechar ocupada',()=>{
  const b=pen();expect(b.isBlocked(13,16)).toBe(true);expect(b.toggleGate(13,16).ok).toBe(true);expect(b.isBlocked(13,16)).toBe(false);
  expect(b.toggleGate(13,16,true).ok).toBe(false);expect(b.at(13,16)?.open).toBe(true);
  expect(b.toggleGate(13,16).ok).toBe(true);expect(b.isBlocked(13,16)).toBe(true);
 });
 it.each(['cow','chicken'] as const)('reconhece a borda exata do corpo de %s antes de fechar',kind=>{
  const b=pen();b.toggleGate(13,16);const a=new AnimalBrain('edge',kind,13.5*32,16.5*32,false,(x,y)=>b.isBlocked(x,y));
  a.y=16.5*32-16-a.radius*.6;
  expect(a.canStand(a.x,a.y)).toBe(true);expect(a.occupiesTile(13,16)).toBe(true);
  expect(b.toggleGate(13,16,a.occupiesTile(13,16)).ok).toBe(false);
  a.y-=.01;expect(a.occupiesTile(13,16)).toBe(false);expect(b.toggleGate(13,16,a.occupiesTile(13,16)).ok).toBe(true);expect(a.canStand(a.x,a.y)).toBe(true);
 });
 it('conecta às cercas só no eixo correto, mesmo aberta',()=>{
  for(const rotation of [0,1,2,3] as const)for(const gateFlip of [false,true])for(const open of [false,true]){
   const g:BuildingData={kind:'gate',x:11,y:10,rotation,gateFlip,open};
   const vertical=rotation===1||rotation===3;
   expect(fenceConnections([g],10,10)).toBe(vertical?0:2);expect(fenceConnections([g],12,10)).toBe(vertical?0:8);
   expect(fenceConnections([g],11,9)).toBe(vertical?4:0);expect(fenceConnections([g],11,11)).toBe(vertical?1:0);
  }
  expect(fenceConnections([{kind:'gate',x:11,y:10}],10,10)).toBe(2);
 });
 it('salva as quatro orientações e os dois lados de abertura sem mudar porteiras antigas',()=>{
  const state=createNewSave(profile),b=new Building(),i=inv();
  for(const rotation of [0,1,2,3] as const)for(const gateFlip of [false,true]){
   const x=10+b.buildings.length;
   expect(b.place('gate',x,10,i,true,{nearWorkbench:false,rotation,gateFlip}).ok).toBe(true);
   if(gateFlip)b.toggleGate(x,10);
  }
  const legacy:BuildingData[]=[{kind:'gate',x:18,y:10,rotation:0,open:false},{kind:'gate',x:19,y:10,rotation:1,open:true},{kind:'gate',x:20,y:10}];
  state.buildings=[...b.buildings,...legacy];expect(validateSave(state)).toBe(true);
  const restored=migrateSave(JSON.parse(JSON.stringify(state)))!;
  expect(restored.buildings).toEqual(state.buildings);
  const loaded=new Building(restored.buildings);
  expect(loaded.buildings).toEqual(state.buildings);
  for(const gate of loaded.buildings){expect(gate.gateFlip??false).toBe(state.buildings.find(b=>b.x===gate.x)!.gateFlip??false);expect(loaded.isBlocked(gate.x,gate.y)).toBe(gate.open!==true)}
  expect(loaded.buildings.slice(-3)).toEqual(legacy);
 });
 it('mantém a cobertura nos dois eixos ao trocar da ferramenta de porteira',()=>{
  for(const [rotation,normalized]of [[0,0],[1,1],[2,0],[3,1]] as const){
   const source:BuildingData[]=[{kind:'roof',x:10,y:10,rotation}];
   const b=new Building(source),i=new Inventory({...INITIAL_INVENTORY,plank:10,fiber:10,hammer:1});
   expect(b.at(10,10,'roof')?.rotation).toBe(normalized);expect(source[0].rotation).toBe(rotation);
   const preview=buildingFootprint({kind:'roof',x:15,y:10,rotation});
   expect(b.place('roof',15,10,i,true,{nearWorkbench:true,rotation,gateFlip:true}).ok).toBe(true);
   const roof=b.at(15,10,'roof')!;expect(roof.rotation).toBe(normalized);expect(roof.gateFlip).toBeUndefined();
   expect(buildingFootprint(roof)).toEqual(preview);
   expect(preview).toEqual(normalized===1?[{x:15,y:10},{x:15,y:11},{x:15,y:12}]:[{x:15,y:10},{x:16,y:10},{x:17,y:10}]);
   const state=createNewSave(profile);state.buildings=b.buildings;expect(validateSave(state)).toBe(true);
  }
 });
 it('recusa rotação inválida, inversão não booleana e campos de porteira em outras peças',()=>{
  const state=createNewSave(profile),gate={kind:'gate',x:10,y:10,open:false,rotation:0,gateFlip:false};
  for(const rotation of [-1,4,1.5,'1',true,null])expect(validateSave({...state,buildings:[{...gate,rotation}]})).toBe(false);
  for(const gateFlip of [0,1,'false',null,{}])expect(validateSave({...state,buildings:[{...gate,gateFlip}]})).toBe(false);
  for(const kind of ['fence','bench','workbench','wall','door','floor','window','roof']){
   for(const gateFlip of [false,true])expect(validateSave({...state,buildings:[{x:10,y:10,kind,gateFlip}]})).toBe(false);
   if(kind!=='roof')expect(validateSave({...state,buildings:[{x:10,y:10,kind,rotation:0}]})).toBe(false);
  }
  for(const rotation of [2,3])expect(validateSave({...state,buildings:[{kind:'roof',x:10,y:10,rotation}]})).toBe(false);
  const b=new Building(),i=inv();expect(b.place('fence',10,10,i,true,{nearWorkbench:false,rotation:3,gateFlip:true}).ok).toBe(true);
  expect(b.at(10,10)).toEqual({kind:'fence',x:10,y:10});
 });
 it.each(['cow','chicken'] as const)('mantém %s andando no cercado fechado e deixa sair pela porteira aberta',kind=>{
  const b=pen(),blocked=(x:number,y:number)=>x<1||y<1||x>=95||y>=71||b.isBlocked(x,y);
  const a=new AnimalBrain('test-'+kind,kind,13.5*32,13.5*32,false,blocked,84);
  const player={x:30*32,y:30*32};
  // Check every simulated step, without allocating thousands of matcher objects.
  // Hosted Windows runners can share their CPU with the other world simulations.
  for(let i=0;i<4000;i++){
   a.update(.1,player,[a]);
   if(!(a.x>11*32&&a.x<16*32&&a.y>11*32&&a.y<16*32&&a.canStand(a.x,a.y)))throw new Error(`Animal left the closed pen at step ${i}: ${a.x},${a.y}`);
  }
  expect(a.distanceMoved).toBeGreaterThan(100);
  b.toggleGate(13,16);let escaped=false;
  for(let i=0;i<16000;i++){a.update(.1,player,[a]);if(a.y>17*32){escaped=true;break}}
  expect(escaped).toBe(true);
 },15000);
 it('restaura os três desgastes sem desmontar nem repetir o consumo',()=>{
  for(const day of [31,61,91]){const b=new Building([{kind:'fence',x:10,y:10,fenceBuiltDay:1}]),i=inv();
   expect(fenceStage(b.buildings[0],day)).not.toBe('new');expect(b.repairFence(10,10,i,day).ok).toBe(true);expect(i.data.wood).toBe(99);expect(fenceStage(b.buildings[0],day)).toBe('new');expect(b.repairFence(10,10,i,day).ok).toBe(false);expect(i.data.wood).toBe(99);expect(b.isBlocked(10,10)).toBe(true);
  }
  const b=pen(),empty=new Inventory();expect(b.repairFence(10,10,empty,31).ok).toBe(false);expect(b.at(10,10)?.fenceBuiltDay).toBe(1);expect(b.repairFence(13,16,inv(),31).ok).toBe(false);
 });
 it('preserva porteira, orientação, reparo, corda e animal no salvar/recarregar',()=>{
  const state=createNewSave(profile);state.day=62;state.buildings=[{kind:'gate',x:10,y:10,rotation:1,open:true},{kind:'fence',x:10,y:11,fenceBuiltDay:62}];state.activeArea='forest';state.inventory.cord=1;
  const a={id:FOREST_ANIMALS[0].id,x:500,y:500,direction:'down' as const};
  expect(startAnimalEscort(state,a)).toBe(true);transferAnimalEscort(state,{x:100,y:100});expect(validateSave(state)).toBe(true);
  const arrival=migrateSave(JSON.parse(JSON.stringify(state)))!;expect(arrival.animalEscort?.id).toBe(a.id);expect(arrival.inventory.cord).toBe(0);expect(arrival.recruitedAnimals??[]).toEqual([]);
  expect(releaseAnimalEscort(arrival)).toBe(true);expect(arrival.inventory.cord).toBe(1);expect(arrival.recruitedAnimals).toEqual([a.id]);expect(releaseAnimalEscort(arrival)).toBe(false);
  expect(startAnimalEscort(arrival,arrival.animalPositions!.property[0])).toBe(true);expect(validateSave(arrival)).toBe(true);
  const led=migrateSave(JSON.parse(JSON.stringify(arrival)))!;expect(led.buildings).toEqual(state.buildings);expect(led.animalEscort?.id).toBe(a.id);expect(releaseAnimalEscort(led)).toBe(true);expect(led.inventory.cord).toBe(1);expect(led.recruitedAnimals).toEqual([a.id]);expect(validateSave(led)).toBe(true);
  expect(validateSave({...led,buildings:[{kind:'gate',x:10,y:10,rotation:4}]})).toBe(false);
 });
});
