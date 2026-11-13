import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const {PNG}=createRequire(import.meta.url)('pngjs');
import {CROP_CATALOG,NEW_CROP_ITEM_IDS} from '../src/data/crop-catalog';
import {CROPS,cropFromSeed,cropTexture} from '../src/data/crops';
import {ITEMS} from '../src/data/items';
import {MERCHANTS} from '../src/data/village-commerce';
import {SEASONS} from '../src/systems/calendar';
import {Farming} from '../src/systems/farming';
import {Inventory} from '../src/systems/inventory';
import {createNewSave,migrateSave,validateSave} from '../src/systems/save';
import {createCharacterProfile} from '../src/data/characters';

describe('integração das 19 plantas',()=>{
 it('mantém ids únicos, cobertura de todas as estações e itens descritos',()=>{
  expect(CROP_CATALOG).toHaveLength(19);expect(NEW_CROP_ITEM_IDS).toHaveLength(36);
  for(const season of SEASONS)expect(CROP_CATALOG.filter(c=>(c.seasons as readonly string[]).includes(season)).length).toBeGreaterThanOrEqual(3);
  for(const c of CROP_CATALOG){expect(cropFromSeed(c.seed)).toBe(c.id);expect(ITEMS[c.seed].name).toBeTruthy();expect(ITEMS[c.harvest].name).toBe(c.id==='turnip'?'Nabos':c.name);}
 });
 for(const c of CROP_CATALOG)it(`${c.name}: semente, ciclo diário, colheita e rebrota`,()=>{
  const def=CROPS[c.id],day=SEASONS.indexOf(def.seasons[0])*28+1,inv=new Inventory({[c.seed]:2}),f=new Farming();
  expect(f.plant(21,20,inv,day,c.id).ok).toBe(true);expect(inv.data[c.seed]).toBe(1);
  for(let d=day;d<day+def.days;d++){expect(f.water(21,20).ok).toBe(true);f.update(0,d+1);}
  expect(cropTexture(f.cropAt(21,20)!)).toBe(`crop-${c.id}-3`);
  expect(f.harvest(21,20,inv).ok).toBe(true);expect(inv.data[c.harvest]).toBe(def.yield);
  if(def.regrow){expect(f.cropAt(21,20)?.growth).toBeLessThan(1);for(let d=day+def.days;d<day+def.days+def.regrow;d++){f.water(21,20);f.update(0,d+1);}expect(f.harvest(21,20,inv).ok).toBe(true);expect(inv.data[c.harvest]).toBe(2*def.yield);}
  else expect(f.cropAt(21,20)).toBeUndefined();
  const forbidden=SEASONS.findIndex(s=>!def.seasons.includes(s));if(forbidden>=0){const before=inv.data[c.seed];expect(new Farming().plant(21,20,inv,forbidden*28+1,c.id).ok).toBe(false);expect(inv.data[c.seed]).toBe(before);}
 });
 it('vende todas as sementes na Rosa e só compra as colheitas dos jogadores',()=>{
  for(const c of CROP_CATALOG){expect(MERCHANTS.seeds.buy[c.seed]).toBe(c.seedPrice);expect(Object.values(MERCHANTS).some(m=>m.sell[c.harvest]!==undefined)).toBe(true);for(const m of Object.values(MERCHANTS))expect(m.buy[c.harvest]).toBeUndefined();}
  expect(MERCHANTS.herbalist.sell.mint).toBeGreaterThan(0);expect(MERCHANTS.tailor.sell.cotton).toBeGreaterThan(0);
 });
 it('migra inventário antigo e valida o cultivo equipado sem mudar os ids legados',()=>{
  const s=createNewSave(createCharacterProfile('Cultivos'));for(const id of NEW_CROP_ITEM_IDS)delete (s.inventory as Partial<typeof s.inventory>)[id];
  const loaded=migrateSave(s)!;expect(loaded).not.toBeNull();for(const id of NEW_CROP_ITEM_IDS)expect(loaded.inventory[id]).toBe(0);
  loaded.selectedCrop='carrot';expect(validateSave(loaded)).toBe(true);loaded.selectedCrop='inexistente' as never;expect(validateSave(loaded)).toBe(false);
 });
 it('entrega seis sprites por planta, transparentes e sem cortar as bordas',()=>{
  for(const c of CROP_CATALOG)for(const file of ['seed','stage-0','stage-1','stage-2','stage-3','harvest']){
   const p=PNG.sync.read(readFileSync(`public/assets/visual/crops/${c.id}/${file}.png`));expect([p.width,p.height]).toEqual([192,192]);let opaque=0;
   for(let y=0;y<p.height;y++)for(let x=0;x<p.width;x++){const a=p.data[(y*p.width+x)*4+3];if(a)opaque++;if(x===0||y===0||x===191||y===191)expect(a).toBe(0);}
   expect(opaque).toBeGreaterThan(20);
  }
 });
});
