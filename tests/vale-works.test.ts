import {describe,expect,it} from 'vitest';
import {createNewSave} from '../src/systems/save';
import {createCharacterProfile} from '../src/data/characters';
import {performVillageService,MILL_FEE} from '../src/systems/village-services';
import {fishingHabitat} from '../src/fishing-ui';
import {atTrainStop,TRAIN_STOPS,trainRunning} from '../src/train-travel';
import {PROJECTS} from '../src/data/projects';

const done=(...ids:string[])=>{const s=createNewSave(createCharacterProfile('Vale'));s.day=60;s.villageEconomy!.coins=1000;s.projects={};
 for(const id of ids){const d=PROJECTS.find(p=>p.id===id)!;s.projects[id]={coins:d.coins,items:{...d.items},funded:1};}return s;};
describe('obras do Vale (preview.48)',()=>{
 it('moinho: só depois da obra o Augusto mói os grãos na hora',()=>{
  const before=done();before.inventory.wheat=4;expect(performVillageService(before,'mill-grind').ok).toBe(false);
  const s=done('vale-moinho');s.inventory.wheat=4;s.inventory.corn=2;
  expect(performVillageService(s,'mill-grind').ok).toBe(true);
  expect(s.inventory.flour).toBe(4);expect(s.inventory.cornmeal).toBe(2);expect(s.inventory.wheat).toBe(0);expect(s.villageEconomy!.coins).toBe(1000-6*MILL_FEE);
 });
 it('farol: a Costa à noite vira ponto de peixe raro',()=>{
  const s=done('vale-moinho','vale-ponte','vale-farol');s.activeArea='coast';s.time=21*60;expect(fishingHabitat(s)).toBe('lighthouse');
  s.time=12*60;expect(fishingHabitat(s)).toBe('other');
  const no=done();no.activeArea='coast';no.time=21*60;expect(fishingHabitat(no)).toBe('other');
 });
 it('trem: só depois da obra da Estação, nos três pontos',()=>{
  const s=done('vale-moinho','vale-ponte','vale-farol','vale-estacao');expect(trainRunning(s)).toBe(true);
  const p=TRAIN_STOPS.village.stop;expect(atTrainStop(s,'village',{x:(p.x+.5)*32,y:(p.y+.5)*32})).toBe(true);
  expect(atTrainStop(done(),'village',{x:(p.x+.5)*32,y:(p.y+.5)*32})).toBe(false);
 });
 it('cada obra exige a anterior, na ordem moinho → ponte → farol → Estação',()=>{
  expect(PROJECTS.filter(p=>p.group==='vale').map(p=>[p.id,p.requires])).toEqual([['vale-moinho',undefined],['vale-ponte','vale-moinho'],['vale-farol','vale-ponte'],['vale-estacao','vale-farol']]);
 });
});
