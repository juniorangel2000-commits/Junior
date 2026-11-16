import {describe,it,expect} from 'vitest';
import {createNewSave,validateSave} from '../src/systems/save';
import {createCharacterProfile} from '../src/data/characters';
import {mountProblem,ownsTamedHorse,INDOOR_SCENES} from '../src/systems/horse-riding';
import {HORSE_ID} from '../src/systems/horse-taming';
const fresh=()=>createNewSave(createCharacterProfile('Montaria'));
const withHorse=()=>{const s=fresh();s.recruitedAnimals=[HORSE_ID];s.horseTaming={version:1,trust:7,tamed:true,name:'Trovão',lastFedDay:1};s.animalPositions={forest:[],property:[{id:HORSE_ID,x:1200,y:900,direction:'down'}]};return s;};
describe('montaria',()=>{
 it('só monta quem tem o cavalo domado na Propriedade, sem corda',()=>{
  expect(mountProblem(fresh())).toContain('cavalo domado');expect(ownsTamedHorse(fresh())).toBe(false);
  const s=withHorse();expect(mountProblem(s)).toBe('');
  s.animalEscort={id:'forest-cow-1',area:'property'} as never;expect(mountProblem(s)).toContain('corda');
 });
 it('o save aceita montado só com o cavalo na Propriedade',()=>{
  const s=withHorse();s.riding=true;expect(validateSave(s)).toBe(true);
  const t=fresh();t.riding=true;expect(validateSave(t)).toBe(false);
  (s as any).riding=false;expect(validateSave(s)).toBe(false);
 });
 it('cenários fechados fazem descer',()=>{expect(INDOOR_SCENES).toEqual(expect.arrayContaining(['Interior','Mina','Mineracao']));});
});
