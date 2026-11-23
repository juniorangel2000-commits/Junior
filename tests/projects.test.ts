import {describe,expect,it} from 'vitest';
import {createNewSave,validateSave} from '../src/systems/save';
import {createCharacterProfile} from '../src/data/characters';
import {performVillageService,listVillageServices,GLASS} from '../src/systems/village-services';
import {projectStatus,projectDone,projectsFinishedBetween} from '../src/systems/projects';
import {PROJECTS} from '../src/data/projects';
import {FORAGE_SPOTS} from '../src/systems/forage';

const rich=()=>{const s=createNewSave(createCharacterProfile('Obras'));s.villageEconomy!.coins=500_000;s.inventory.backpack=2;return s;};
describe('obras grandes (preview.48)',()=>{
 it('entrega aos poucos e a obra fica pronta depois dos dias de obra',()=>{
  const s=rich();s.villageEconomy!.coins=4000;s.inventory.plank=30;
  expect(performVillageService(s,'project-home-1').ok).toBe(true);
  expect(s.villageEconomy!.coins).toBe(0);expect(s.inventory.plank).toBe(0);expect(projectStatus(s,'home-1')).toBe('open');expect(validateSave(s)).toBe(true);
  s.villageEconomy!.coins=20_000;s.inventory.plank=40;s.inventory.stone=25;
  const r=performVillageService(s,'project-home-1');expect(r.ok).toBe(true);expect(r.message).toContain('fica pronta no dia');
  expect(s.villageEconomy!.coins).toBe(14_000);expect(s.inventory.plank).toBe(10);expect(s.inventory.stone).toBe(5);
  expect(projectStatus(s,'home-1')).toBe('building');expect(validateSave(s)).toBe(true);
  s.day+=2;expect(projectDone(s,'home-1')).toBe(true);expect(projectsFinishedBetween(s,s.day-1,s.day).map(p=>p.id)).toEqual(['home-1']);
 });
 it('cada etapa exige a anterior e recusa quando não há nada para entregar',()=>{
  const s=rich();expect(projectStatus(s,'home-2')).toBe('locked');expect(performVillageService(s,'project-home-2').ok).toBe(false);
  expect(projectStatus(s,'vale-ponte')).toBe('locked');
  s.villageEconomy!.coins=0;expect(performVillageService(s,'project-greenhouse').message).toContain('Você não tem nada');
 });
 it('cada obra está no menu do morador responsável, com o que falta',()=>{
  const s=rich();for(const d of PROJECTS){const o=listVillageServices(d.npc,s).find(x=>x.id===`project-${d.id}`);expect(o,d.id).toBeTruthy();}
  const o=listVillageServices('tobias',s).find(x=>x.id==='project-greenhouse')!;expect(o.cost?.coins).toBe(100_000);expect(o.cost?.items?.glass).toBe(30);
 });
 it('areia na praia e vidro no Bento',()=>{
  expect(FORAGE_SPOTS.filter(f=>f.item==='sand').length).toBe(12);
  const s=rich();s.inventory.sand=GLASS.sand;expect(performVillageService(s,'melt-glass').ok).toBe(true);expect(s.inventory.glass).toBe(GLASS.glass);expect(s.inventory.sand).toBe(0);
 });
 it('o save recusa progresso inventado',()=>{
  const s=rich();s.projects={'home-1':{coins:999_999,items:{}}};expect(validateSave(s)).toBe(false);
  s.projects={'nao-existe':{coins:1,items:{}}};expect(validateSave(s)).toBe(false);
 });
});
