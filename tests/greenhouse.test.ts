import {describe,expect,it} from 'vitest';
import {GreenhouseFarm,greenhousePlots,greenhouseLevel,findGreenhouseSpot,GREENHOUSE_FOOTPRINT,greenhouseReserved} from '../src/systems/greenhouse';
import {Inventory} from '../src/systems/inventory';
import {createNewSave,validateSave} from '../src/systems/save';
import {createCharacterProfile} from '../src/data/characters';
import {farmReserved} from '../src/systems/farm-construction';
import {calendarDate} from '../src/systems/calendar';

describe('estufa (preview.48)',()=>{
 it('planta fora de estação, não murcha na virada e só cresce regada',()=>{
  const winter=Array.from({length:112},(_,i)=>i+1).find(d=>calendarDate(d).season==='winter')!;
  const f=new GreenhouseFarm([],1),inv=new Inventory();inv.data.strawberrySeeds=2;
  const p=greenhousePlots(1)[0];expect(f.plant(p.x,p.y,inv,winter,'strawberry').ok).toBe(true);
  f.update(0,winter+1);expect(f.crops[0].days).toBe(0);
  f.water(p.x,p.y);f.update(0,winter+2);expect(f.crops[0].days).toBe(1);
  // Passa a virada do ano sem murchar.
  for(let d=winter+2;d<winter+40;d++){f.water(p.x,p.y);f.update(0,d+1);}
  expect(f.crops.length).toBe(1);expect(f.crops[0].growth).toBe(1);
 });
 it('24 canteiros; ampliada, 48',()=>{expect(greenhousePlots(1)).toHaveLength(24);expect(greenhousePlots(2)).toHaveLength(48);});
 it('o save só aceita a estufa depois da obra pronta e com plantas nos canteiros',()=>{
  const s=createNewSave(createCharacterProfile('Estufa'));s.day=30;
  s.greenhouse={x:50,y:30,crops:[]};expect(validateSave(s)).toBe(false);
  s.projects={greenhouse:{coins:100000,items:{plank:60,glass:30,hardwood:10},funded:1}};expect(greenhouseLevel(s)).toBe(1);expect(validateSave(s)).toBe(true);
  s.greenhouse.crops=[{x:1,y:1,growth:0,watered:false,crop:'turnip',days:0,day:3,care:{missed:0}}];expect(validateSave(s)).toBe(false);
  s.greenhouse.crops=[{x:2,y:2,growth:0,watered:false,crop:'turnip',days:0,day:3,care:{missed:0}}];expect(validateSave(s)).toBe(true);
 });
 it('o lugar escolhido é livre e fica reservado para ninguém construir em cima',()=>{
  const spot=findGreenhouseSpot((x,y)=>!(x<40&&y<40),GREENHOUSE_FOOTPRINT)!;expect(spot.x+GREENHOUSE_FOOTPRINT.left).toBeGreaterThanOrEqual(0);
  const s=createNewSave(createCharacterProfile('Estufa'));s.greenhouse={x:60,y:40,crops:[]};
  expect(greenhouseReserved(s,60,38)).toBe(true);expect(farmReserved(s,60,38)).toBe(true);expect(farmReserved(s,10,10)).toBe(false);
 });
});
