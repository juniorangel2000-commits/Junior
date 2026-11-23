import {describe,expect,it} from 'vitest';
import {WILD_ANIMAL_LIST,WILD_SPOTS} from '../src/data/wild-animals';
import {wildSpawns} from '../src/systems/wild-spawns';
import {FOREST_ENTRY,FOREST_WIDTH,FOREST_HEIGHT,forestBlocked} from '../src/data/ancient-forest';
import {fieldsSafe,FIELDS_ANIMALS} from '../src/data/open-fields';
import {isDomesticAnimal} from '../src/data/domestic-animals';
import {HORSE_ID} from '../src/systems/horse-taming';

describe('animais soltos com sorteio diário (preview.48)',()=>{
 it('cada id pertence a um só cenário e todos podem ser do jogador',()=>{
  const ids=WILD_ANIMAL_LIST.map(a=>a.id);expect(new Set(ids).size).toBe(ids.length);
  expect(ids.every(isDomesticAnimal)).toBe(true);expect(ids).not.toContain(HORSE_ID);
 });
 it('o mesmo dia dá o mesmo sorteio; dias diferentes variam',()=>{
  const none=new Set<string>();
  expect(wildSpawns('forest',10,none)).toEqual(wildSpawns('forest',10,none));
  const looks=new Set(Array.from({length:20},(_,d)=>JSON.stringify(wildSpawns('openFields',d+1,none))));
  expect(looks.size).toBeGreaterThan(10);
 });
 it('quem já é do jogador não aparece, e outro do mesmo tipo pode aparecer',()=>{
  const first=wildSpawns('openFields',5,new Set()).find(a=>a.kind==='cow')!;
  for(let d=1;d<60;d++)expect(wildSpawns('openFields',d,new Set([first.id])).some(a=>a.id===first.id)).toBe(false);
  expect(Array.from({length:30},(_,d)=>wildSpawns('openFields',d+1,new Set([first.id]))).some(l=>l.some(a=>a.kind==='cow'))).toBe(true);
 });
 it('pontos do Bosque alcançáveis da entrada; pontos dos Campos livres',()=>{
  const seen=new Set<string>(),q=[FOREST_ENTRY];
  for(let i=0;i<q.length;i++){const p=q[i],k=`${p.x},${p.y}`;if(seen.has(k)||forestBlocked(p.x,p.y)||p.x<0||p.y<0||p.x>=FOREST_WIDTH||p.y>=FOREST_HEIGHT)continue;seen.add(k);for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]])q.push({x:p.x+dx,y:p.y+dy});}
  for(const [x,y] of WILD_SPOTS.forest)expect(seen.has(`${x},${y}`),`${x},${y}`).toBe(true);
  for(const [x,y] of [...WILD_SPOTS.pasture,...WILD_SPOTS.river])expect(fieldsSafe({x,y}),`${x},${y}`).toBe(true);
 });
 it('o cavalo mora sempre nos Campos e não entra no sorteio',()=>{
  expect(FIELDS_ANIMALS.some(a=>a.id===HORSE_ID)).toBe(true);
  for(let d=1;d<40;d++)for(const area of ['forest','openFields'] as const)expect(wildSpawns(area,d,new Set()).some(a=>a.kind==='horse')).toBe(false);
 });
});

import {createNewSave,validateSave} from '../src/systems/save';
import {createCharacterProfile} from '../src/data/characters';
import {startAnimalEscort,transferTrailEscort,transferAnimalEscort,transferFieldEscortToProperty,deliverAnimalEscort} from '../src/systems/animals';
import {wildTaken} from '../src/systems/wild-spawns';
describe('Pântano e Costa com a corda (preview.48)',()=>{
 for(const [area,via] of [['swamp','forest'],['coast','openFields']] as const)it(`do ${area} passa por ${via} e chega à propriedade`,()=>{
  const s=createNewSave(createCharacterProfile('Corda'));s.inventory.cord=1;
  const a=wildSpawns(area,s.day,wildTaken(s))[0];expect(a).toBeTruthy();
  s.activeArea=area;expect(startAnimalEscort(s,{id:a.id,x:a.x,y:a.y,direction:'down'})).toBe(true);expect(validateSave(s)).toBe(true);
  transferTrailEscort(s,via,{x:1500,y:2000});s.activeArea=via;expect(s.animalEscort?.area).toBe(via);expect(validateSave(s)).toBe(true);
  if(via==='forest')transferAnimalEscort(s,{x:80,y:1600});else{transferFieldEscortToProperty(s,{x:816,y:2224});s.activeArea='property';}
  expect(deliverAnimalEscort(s)).toBe(true);expect(s.recruitedAnimals).toContain(a.id);expect(validateSave(s)).toBe(true);
  // Já é do jogador: sai do sorteio daquele cenário.
  for(let d=1;d<30;d++)expect(wildSpawns(area,d,wildTaken(s)).some(x=>x.id===a.id)).toBe(false);
 });
});
