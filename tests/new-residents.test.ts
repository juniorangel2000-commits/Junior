import {describe,expect,it} from 'vitest';
import {createNewSave,validateSave} from '../src/systems/save';
import {createCharacterProfile} from '../src/data/characters';
import {performVillageService,listVillageServices} from '../src/systems/village-services';
import {PROJECTS} from '../src/data/projects';
import {animalQuality} from '../src/systems/animal-production';
import {MERCHANTS} from '../src/data/village-commerce';

const town=(...ids:string[])=>{const s=createNewSave(createCharacterProfile('Vila'));s.day=60;s.time=10*60;s.villageEconomy!.coins=20000;s.projects={};
 for(const id of ids){const d=PROJECTS.find(p=>p.id===id)!;s.projects[id]={coins:d.coins,items:{...d.items},funded:1};}return s;};
describe('moradores novos (preview.48)',()=>{
 it('a Lúcia só atende depois da reforma e no horário, pagando 30% a mais',()=>{
  const before=town();before.inventory.egg=5;expect(performVillageService(before,'lucia-buy').ok).toBe(false);
  const s=town('casa-leste');s.inventory.egg=5;const shop=Math.max(...Object.values(MERCHANTS).map(m=>(m.sell as Record<string,number>).egg??0));
  expect(performVillageService(s,'lucia-buy').ok).toBe(true);expect(s.villageEconomy!.coins).toBe(20000+5*Math.round(shop*1.3));expect(s.inventory.egg).toBe(0);
  const night=town('casa-leste');night.time=20*60;night.inventory.egg=1;expect(performVillageService(night,'lucia-buy').ok).toBe(false);
  expect(listVillageServices('lucia',s).length).toBeGreaterThanOrEqual(3);
 });
 it('o Jonas vende animal de raça, que vai para a propriedade e produz no mínimo bom',()=>{
  const s=town('casa-sul');expect(performVillageService(s,'jonas-breed-chicken').ok).toBe(true);
  const id=s.recruitedAnimals!.find(a=>a.startsWith('breed-chicken'))!;expect(id).toBeTruthy();expect(s.villageEconomy!.coins).toBe(18500);
  expect(animalQuality(s,id)).toBeGreaterThanOrEqual(1);expect(validateSave(s)).toBe(true);
 });
});
