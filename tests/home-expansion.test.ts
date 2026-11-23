import {describe,expect,it} from 'vitest';
import {createNewSave,validateSave} from '../src/systems/save';
import {createCharacterProfile} from '../src/data/characters';
import {Home,HOME_SIZES,validateHome,createDefaultHome,furnitureLimit} from '../src/systems/home';
import {homeLevel,playerHomeSize,hasKitchen} from '../src/systems/home-level';
import {cookCheck,dishIngredients} from '../src/systems/kitchen';
import {dishRecipe} from '../src/data/kitchen';
import {restoreVigor,BEDROOM_VIGOR} from '../src/systems/food-effects';

const withStages=(n:number)=>{const s=createNewSave(createCharacterProfile('Casa'));s.day=40;s.projects={};
 for(const [i,id] of ['home-1','home-2','home-3'].entries())if(i<n)s.projects[id]={coins:0,items:{},funded:1};
 // O teste só olha o nível: marca as etapas como pagas há muito tempo.
 for(const id of Object.keys(s.projects)){const def={'home-1':{coins:10000,items:{plank:60,stone:20}},'home-2':{coins:25000,items:{plank:80,hardwood:10,doorKit:1}},'home-3':{coins:40000,items:{stone:40,plank:30,glass:6}}}[id]!;s.projects[id]={...def,funded:1};}
 return s;};
describe('casa ampliada pelo Tobias (preview.48)',()=>{
 it('cada etapa pronta aumenta o cômodo',()=>{
  expect([0,1,2,3].map(n=>homeLevel(withStages(n)))).toEqual([0,1,2,3]);
  expect(playerHomeSize(withStages(3))).toEqual(HOME_SIZES[3]);
 });
 it('móvel além da parede antiga só vale na casa maior, e o limite de móveis dobra',()=>{
  const home=createDefaultHome();home.furniture.push({id:'home-plant-9',kind:'plant',x:13,y:9});
  expect(validateHome(home)).toBe(false);expect(validateHome(home,true,HOME_SIZES[1])).toBe(true);
  expect(furnitureLimit('chair',HOME_SIZES[1])).toBe(2*furnitureLimit('chair'));
  const s=withStages(1);s.home=home;expect(validateSave(s)).toBe(true);
  const small=withStages(0);small.home=home;expect(validateSave(small)).toBe(false);
  const h=new Home(home,true,HOME_SIZES[1]);expect(h.isBlocked(13,5)).toBe(false);expect(h.canReachExit({x:14,y:10})).toBe(true);
 });
 it('cozinha nova: sem lenha e pratos de forno no fogão de casa',()=>{
  const s=withStages(3),bread=dishRecipe('homemadeBread')!;expect(hasKitchen(s)).toBe(true);
  expect(dishIngredients(s,bread).some(i=>i.item==='wood')).toBe(false);
  s.villageProgress!.recipes.push('homemadeBread');Object.assign(s.inventory,{flour:2,egg:1,milk:1});
  expect(cookCheck(s,'homemadeBread','stove').ok).toBe(true);
  expect(cookCheck(withStages(2),'homemadeBread','stove').ok).toBe(false);
 });
 it('quarto: acorda com 120 de vigor, e o save aceita',()=>{
  const s=withStages(2);s.villageProgress!.vigor=3;restoreVigor(s,BEDROOM_VIGOR);expect(s.villageProgress!.vigor).toBe(120);expect(validateSave(s)).toBe(true);
 });
});
