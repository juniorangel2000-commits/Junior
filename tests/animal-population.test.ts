import {describe,it,expect,vi} from 'vitest';
import type Phaser from 'phaser';
import {AnimalPopulation} from '../src/animals';
import {createNewSave} from '../src/systems/save';
import {createCharacterProfile} from '../src/data/characters';
import {farmDoorPoint} from '../src/systems/farm-interior';

const display=()=>({visible:true,setVisible(visible:boolean){this.visible=visible;return this;},setDepth(){return this;}});
vi.mock('../src/forest-art',()=>({animalSprite:()=>display()}));
const scene={add:{graphics:()=>({}),ellipse:()=>display()}} as unknown as Phaser.Scene;
function setup(inside=true,escort=false){
 const save=createNewSave(createCharacterProfile('Entrada'));
 save.recruitedAnimals=['forest-cow-1'];
 save.farmConstruction={version:1,nextId:2,sites:[{id:1,kind:'barn',x:40,y:30,delivered:{},finished:true,animals:['forest-cow-1'],hay:0,gateOpen:true,animalsOverride:{inside,until:999999}}]};
 const door=farmDoorPoint(save.farmConstruction.sites[0]);
 save.animalPositions={forest:[],property:[{id:'forest-cow-1',...door,direction:'down'}]};
 if(escort)save.animalEscort={id:'forest-cow-1',area:'property'};
 const population=new AnimalPopulation(scene,save,'property',()=>false,84);
 return{save,door,population,cow:population.animals[0]};
}
describe('animais recolhidos e colisão na entrada',()=>{
 it('ao carregar, a vaca no interior já está oculta e não desloca o jogador na porta',()=>{
  const {population,door,cow}=setup();
  expect(cow.sprite.visible).toBe(false);expect(cow.shadow?.visible).toBe(false);
  expect(population.blocksPoint(door.x,door.y)).toBe(false);
 });
 it('deixa de bloquear assim que é recolhida, antes do próximo quadro da animação',()=>{
  const {save,population,door}=setup(false);
  expect(population.blocksPoint(door.x,door.y)).toBe(true);
  save.farmConstruction!.sites[0].animalsOverride!.inside=true;
  expect(population.blocksPoint(door.x,door.y)).toBe(false);
 });
 it('mantém a colisão da vaca solta ou conduzida pela corda',()=>{
  for(const [inside,escort] of [[false,false],[true,true]]){
   const {population,door,cow}=setup(inside,escort);
   expect(cow.sprite.visible).toBe(true);expect(population.blocksPoint(door.x,door.y)).toBe(true);
  }
 });
});
