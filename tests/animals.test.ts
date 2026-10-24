import {describe,it,expect} from 'vitest';
import {AnimalBrain,ANIMAL_BEHAVIOR,startAnimalEscort,releaseAnimalEscort,transferAnimalEscort,deliverAnimalEscort} from '../src/systems/animals';
import {FOREST_ANIMALS,ANIMAL_KINDS} from '../src/data/ancient-forest';
import {createNewSave,validateSave,migrateSave} from '../src/systems/save';
import {Inventory,MAX_ITEM_COUNT} from '../src/systems/inventory';
import {craft} from '../src/systems/crafting';
const profile={name:'Animais',skin:'#d9a276',hairStyle:'preso' as const,hairColor:'#754323',outfit:'#638a9d'};
const bounds=(x:number,y:number)=>x<1||y<1||x>=95||y>=71;
const position={id:FOREST_ANIMALS[0].id,x:720,y:1776,direction:'right' as const};
function save(){const s=createNewSave(profile);s.activeArea='forest';s.inventory.cord=1;return s;}

describe('animal movement and pursuit',()=>{
 it('uses moderate awareness and a normalized speed 10% below the player',()=>{
  const a=new AnimalBrain('test','goat',976,976,true,bounds,84);
  a.update(.01,{x:a.x-145,y:a.y},[a]);expect(a.mode).toBe('idle');
  const x=a.x,y=a.y;a.update(.1,{x:x-143,y},[a]);expect(a.mode).toBe('flee');
  expect(Math.hypot(a.x-x,a.y-y)).toBeCloseTo(84*.9*.1,5);expect(ANIMAL_BEHAVIOR.detectionRadius).toBe(144);
 });
 it('allows a pursuit rather than instant capture, while the player eventually catches up',()=>{
  const a=new AnimalBrain('chase','chicken',976,976,true,bounds,84),p={x:832,y:976};let elapsed=0;
  for(;elapsed<20&&Math.hypot(a.x-p.x,a.y-p.y)>ANIMAL_BEHAVIOR.catchRadius;elapsed+=1/60){
   const d=Math.hypot(a.x-p.x,a.y-p.y);p.x+=(a.x-p.x)/d*84/60;p.y+=(a.y-p.y)/d*84/60;a.update(1/60,p,[a]);
  }
  expect(elapsed).toBeGreaterThan(3);expect(elapsed).toBeLessThan(20);
 });
 it.each(ANIMAL_KINDS)('gives %s relaxed autonomous movement',kind=>{
  const a=new AnimalBrain(`wander-${kind}`,kind,976,976,false,bounds,84),start={x:a.x,y:a.y};
  for(let i=0;i<600;i++)a.update(1/60,{x:400,y:400},[a]);
  expect(a.distanceMoved).toBeGreaterThan(20);expect(Math.hypot(a.x-start.x,a.y-start.y)).toBeGreaterThan(1);expect(a.mode).not.toBe('flee');
 });
 it('does not detect through a solid wall and routes around obstacles without crossing water',()=>{
  const wall=(x:number,y:number)=>bounds(x,y)||x===12&&y<15;
  const hidden=new AnimalBrain('hidden','sheep',13.5*32,10.5*32,true,wall);
  hidden.update(.01,{x:11.5*32,y:10.5*32},[hidden]);expect(hidden.mode).toBe('idle');
  const a=new AnimalBrain('avoid','goat',11.5*32,10.5*32,true,wall);
  for(let i=0;i<600;i++){a.update(1/60,{x:10*32,y:10.5*32},[a]);expect(a.canStand(a.x,a.y)).toBe(true);}
  const bank=(x:number,y:number)=>bounds(x,y)||x===12&&y===14;
  const led=new AnimalBrain('around-bank','goat',11.5*32,14.5*32,true,bank);let wentAround=false;
  for(let i=0;i<600;i++){led.update(1/60,{x:13.5*32,y:14.5*32},[led],true);expect(led.canStand(led.x,led.y)).toBe(true);if(led.x>13*32)wentAround=true;}
  expect(wentAround).toBe(true);
 });
 it('uses a calm delay and freezes without simulation time',()=>{
  const a=new AnimalBrain('calm','deer',976,976,true,bounds);a.update(.01,{x:850,y:976},[a]);expect(a.mode).toBe('flee');
  for(let i=0;i<30;i++)a.update(1/60,{x:16,y:16},[a]);expect(a.mode).toBe('flee');
  for(let i=0;i<180;i++)a.update(1/60,{x:16,y:16},[a]);expect(a.mode).not.toBe('flee');
  const p=a.snapshot();a.update(0,{x:a.x,y:a.y},[a]);expect(a.snapshot()).toEqual(p);
 });
 it('does not stop following just because the owner is close behind a corner',()=>{
  const bank=(x:number,y:number)=>bounds(x,y)||x===12&&y===14;
  const a=new AnimalBrain('near-corner','goat',377,457,true,bank),p={x:391,y:487};
  expect(a.lineClear(a,p)).toBe(false);
  for(let i=0;i<300;i++){a.update(1/60,p,[a],true);expect(a.canStand(a.x,a.y)).toBe(true);}
  expect(a.distanceMoved).toBeGreaterThan(0);expect(a.lineClear(a,p)).toBe(true);expect(Math.hypot(a.x-p.x,a.y-p.y)).toBeLessThanOrEqual(32);
 });
 it('follows on a lead without fleeing or overlapping another animal',()=>{
  const a=new AnimalBrain('lead','cow',976,976,true,bounds),p={x:1040,y:976};
  for(let i=0;i<120;i++)a.update(1/60,p,[a],true);
  expect(a.mode).toBe('led');expect(a.x).toBeGreaterThan(976);expect(Math.hypot(a.x-p.x,a.y-p.y)).toBeLessThan(45);
  const b=new AnimalBrain('peer','cow',a.x+20,a.y,false,bounds);
  for(let i=0;i<60;i++){a.update(1/60,{x:a.x-100,y:a.y},[a,b]);expect(Math.hypot(a.x-b.x,a.y-b.y)).toBeGreaterThanOrEqual(19);}
 });
});

describe('reusable fiber cord and animal transport',()=>{
 it('crafts one cord from three fibers and reserves it while leading, never putting the animal in the inventory',()=>{
  const inventory=new Inventory({fiber:3});expect(craft('cord',inventory,false).ok).toBe(true);expect(inventory.data.fiber).toBe(0);expect(inventory.data.cord).toBe(1);
  const s=save();Object.assign(s.inventory,inventory.data);expect(startAnimalEscort(s,position)).toBe(true);
  expect(s.inventory.cord).toBe(0);expect(s.recruitedAnimals??[]).toEqual([]);expect(Object.keys(s.inventory)).not.toContain(position.id);expect(deliverAnimalEscort(s)).toBe(false);expect(validateSave(s)).toBe(true);
  expect(startAnimalEscort(s,{...position,id:FOREST_ANIMALS[1].id})).toBe(false);
 });
 it('releases without recruiting, refunds once and persists a rope in transit',()=>{
  const s=save();startAnimalEscort(s,position);const restored=migrateSave(JSON.parse(JSON.stringify(s)))!;
  expect(restored.animalEscort).toEqual({id:position.id,area:'forest'});expect(restored.animalPositions?.forest).toEqual([position]);
  expect(releaseAnimalEscort(restored)).toBe(true);expect(restored.inventory.cord).toBe(1);expect(restored.recruitedAnimals??[]).toEqual([]);
  expect(releaseAnimalEscort(restored)).toBe(false);expect(restored.inventory.cord).toBe(1);
 });
 it('only welcomes after both cross to the property and never duplicates the rope or the animal',()=>{
  const s=save();startAnimalEscort(s,position);transferAnimalEscort(s,{x:80,y:1680});expect(validateSave(s)).toBe(true);
  expect(s.animalPositions?.forest).toEqual([]);expect(s.animalPositions?.property[0].id).toBe(position.id);
  const restored=migrateSave(JSON.parse(JSON.stringify(s)))!;expect(deliverAnimalEscort(restored)).toBe(true);expect(restored.inventory.cord).toBe(1);expect(restored.recruitedAnimals).toEqual([position.id]);
  expect(deliverAnimalEscort(restored)).toBe(false);expect(startAnimalEscort(restored,position)).toBe(false);expect(validateSave(restored)).toBe(true);
 });
 it('rejects missing cords/unknown animals and does not lose an allocated cord when refund is temporarily impossible',()=>{
  const s=save();s.inventory.cord=0;expect(startAnimalEscort(s,position)).toBe(false);s.inventory.cord=1;expect(startAnimalEscort(s,{...position,id:'unknown'})).toBe(false);
  startAnimalEscort(s,position);s.inventory.cord=MAX_ITEM_COUNT;expect(releaseAnimalEscort(s)).toBe(false);expect(s.animalEscort?.id).toBe(position.id);
  s.inventory.cord--;expect(releaseAnimalEscort(s)).toBe(true);expect(s.inventory.cord).toBe(MAX_ITEM_COUNT);
 });
 it('loads old saves and rejects corrupt or duplicated animal locations',()=>{
  const s=save();expect(validateSave(s)).toBe(true);startAnimalEscort(s,position);
  for(const bad of [
   {...s,animalEscort:{id:'bad',area:'forest'}},
   {...s,animalPositions:{forest:[{...position,x:NaN}],property:[]}},
   {...s,animalPositions:{forest:[position,position],property:[]}},
   {...s,animalEscort:{id:position.id,area:'property'}},
  ])expect(validateSave(bad)).toBe(false);
 });
});
