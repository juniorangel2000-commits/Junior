import {describe,it,expect} from 'vitest';
import fs from 'node:fs';
import {createNewSave,validateSave,migrateSave} from '../src/systems/save';
import {createCharacterProfile} from '../src/data/characters';
import {DISH_RECIPES,DISH_IDS,STOVE_FUEL,HELENA_DISHES} from '../src/data/kitchen';
const helenaKnown=(s:SaveData)=>knownDishes(s).filter(r=>HELENA_DISHES.includes(r));
import {ITEMS} from '../src/data/items';
import {MERCHANTS} from '../src/data/village-commerce';
import {cookDish,canCookDish,nextDishLesson,knownDishes,withWoodStove,dishIngredients} from '../src/systems/kitchen';
import {performVillageService,listVillageServices} from '../src/systems/village-services';
import {useConsumable} from '../src/systems/consumables';
import {createDefaultHome,validateHome,Home} from '../src/systems/home';
import type {SaveData} from '../src/types';

const fresh=():SaveData=>{const s=createNewSave(createCharacterProfile('Cozinha'));s.villageEconomy!.coins=2000;return s;};

describe('cozinha: dados e arte',()=>{
 it('14 receitas com ingredientes que existem e arte do SpriteCook para cada prato',()=>{
  expect(DISH_RECIPES).toHaveLength(21);expect(new Set(DISH_IDS).size).toBe(21);expect(HELENA_DISHES).toHaveLength(15);
  for(const r of DISH_RECIPES){
   for(const id of Object.keys(r.ingredients))expect(ITEMS[id as keyof typeof ITEMS],`${r.id}: ${id}`).toBeDefined();
   expect(fs.existsSync(`public/assets/visual/kitchen/dishes/${r.id}.png`),r.id).toBe(true);
  }
  for(const f of ['honey','duck-egg'])expect(fs.existsSync(`public/assets/visual/kitchen/${f}.png`),f).toBe(true);
  expect(fs.existsSync('public/assets/visual/kitchen/wood-stove.png')).toBe(true);
 });
});

describe('cozinha: aprender com a Helena',()=>{
 it('ensina uma receita por vez, na ordem, cobrando o preço de cada uma',()=>{
  const s=fresh();expect(nextDishLesson(s)!.id).toBe('kaleOmelette');
  const offer=listVillageServices('helena',s).find(o=>o.id==='learn-dish')!;expect(offer.label).toContain('omelete de couve');expect(offer.disabled).toBe(false);
  expect(performVillageService(s,'learn-dish').ok).toBe(true);
  expect(s.villageEconomy!.coins).toBe(2000-DISH_RECIPES[0].learnFee);expect(helenaKnown(s).map(r=>r.id)).toEqual(['kaleOmelette']);
 });
 it('sem coroas não aprende; depois da última, o serviço fica encerrado',()=>{
  const s=fresh();s.villageEconomy!.coins=5;expect(performVillageService(s,'learn-dish').ok).toBe(false);expect(helenaKnown(s)).toHaveLength(0);
  s.villageEconomy!.coins=2000;for(let i=0;i<15;i++)performVillageService(s,'learn-dish');
  expect(helenaKnown(s)).toHaveLength(15);expect(performVillageService(s,'learn-dish').ok).toBe(false);
  expect(listVillageServices('helena',s).find(o=>o.id==='learn-dish')!.disabled).toBe(true);
  expect(validateSave(s)).toBe(true);
 });
});

describe('cozinha: fogão a lenha',()=>{
 it('cozinha gastando os ingredientes e 1 madeira; o prato recupera vigor',()=>{
  const s=fresh();performVillageService(s,'learn-dish');const r=DISH_RECIPES[0];
  s.inventory.egg=2;s.inventory.kale=1;s.inventory.wood=0;
  expect(canCookDish(s,r)).toBe(false);expect(cookDish(s,r.id,()=>true).message).toContain('madeira');
  s.inventory.wood=3;expect(cookDish(s,r.id,()=>true).ok).toBe(true);
  expect(s.inventory).toMatchObject({egg:0,kale:0,wood:2,kaleOmelette:1});
  s.villageProgress!.vigor=30;expect(useConsumable(s,'kaleOmelette').ok).toBe(true);
  expect(s.villageProgress!.vigor).toBe(70);expect(s.inventory.kaleOmelette).toBe(0);
 });
 it('não cozinha receita não aprendida e preserva tudo se o save falhar',()=>{
  const s=fresh();s.inventory.egg=2;s.inventory.kale=1;s.inventory.wood=1;
  expect(cookDish(s,'kaleOmelette',()=>true).message).toContain('Helena');
  performVillageService(s,'learn-dish');const before=structuredClone(s.inventory);
  expect(cookDish(s,'kaleOmelette',()=>false).ok).toBe(false);expect(cookDish(s,'kaleOmelette',()=>{throw Error('x');}).ok).toBe(false);
  expect(s.inventory).toEqual(before);
 });
 it('mel (abelhas) e ovo de pato (patos) já têm fonte: nenhum ingrediente fica sem aviso',()=>{
  const s=fresh();const tea=DISH_RECIPES.find(r=>r.id==='chamomileTea')!,pie=DISH_RECIPES.find(r=>r.id==='strawberryPie')!;
  expect(dishIngredients(s,tea).find(i=>i.item==='honey')!.future).toBeUndefined();
  expect(dishIngredients(s,pie).find(i=>i.item==='duckEgg')!.future).toBeUndefined();
  expect(dishIngredients(s,tea).find(i=>i.item===STOVE_FUEL)!.need).toBe(1);
  s.villageProgress!.recipes.push('chamomileTea');s.inventory.chamomile=1;s.inventory.wood=1;
  expect(cookDish(s,'chamomileTea',()=>true).message).toContain('1 mel');
 });
 it('Helena compra todos os pratos; nenhuma loja vende',()=>{
  for(const r of DISH_RECIPES){expect(MERCHANTS.inn.sell[r.id]).toBe(r.price);for(const m of Object.values(MERCHANTS))expect(m.buy[r.id]).toBeUndefined();}
 });
});

describe('cozinha: o fogão na casa',()=>{
 it('a casa nova já vem com o fogão encostado na parede do fundo',()=>{
  const h=createDefaultHome();expect(validateHome(h)).toBe(true);
  expect(h.furniture.find(p=>p.kind==='woodStove')).toMatchObject({x:5,y:2});
  expect(new Home(h).furnitureNear('woodStove',{x:6,y:3},1.1)).toBeDefined();
 });
 it('saves antigos recebem o fogão num lugar livre, sem perder nada',()=>{
  const old:any=fresh(),home=createDefaultHome();home.furniture=home.furniture.filter(p=>p.kind!=='woodStove');old.home=home;
  for(const id of ['honey','duckEgg',...DISH_IDS])delete old.inventory[id];
  const m=migrateSave(old)!;expect(m).not.toBeNull();expect(m.home!.furniture.filter(p=>p.kind==='woodStove')).toHaveLength(1);
  expect(m.home!.furniture.filter(p=>p.kind!=='woodStove')).toEqual(old.home.furniture);expect(m.inventory.kaleOmelette).toBe(0);
 });
 it('com o jogador dentro de casa, o fogão não cai em cima dele',()=>{
  const old:any=fresh(),home=createDefaultHome();home.furniture=home.furniture.filter(p=>p.kind!=='woodStove');old.home=home;
  old.homePosition={x:5.5*32,y:2.7*32};expect(validateSave(old)).toBe(true);
  const m=migrateSave(old)!;expect(m).not.toBeNull();const stove=m.home!.furniture.find(p=>p.kind==='woodStove')!;
  expect(stove).toBeDefined();expect(new Home(m.home!).isBlocked(5,2)).toBe(false);
 });
 it('save sem casa própria, salvo no lugar do novo fogão, continua carregando',()=>{
  const old:any=fresh();delete old.home;old.homePosition={x:5.5*32,y:2.6*32};
  const m=migrateSave(old)!;expect(m).not.toBeNull();
  expect(new Home(m.home!).isBlocked(5,2)).toBe(false);expect(m.home!.furniture.filter(p=>p.kind==='woodStove')).toHaveLength(1);
 });
 it('uma casa sem lugar para o fogão continua como está',()=>{
  const h=createDefaultHome();h.furniture=h.furniture.filter(p=>p.kind!=='woodStove');
  expect(withWoodStove(h,()=>false)).toBe(h);
 });
});
