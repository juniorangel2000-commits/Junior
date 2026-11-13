import {describe,it,expect} from 'vitest';
import {createNewSave,migrateSave} from '../src/systems/save';
import {createCharacterProfile} from '../src/data/characters';
import {performVillageService,listVillageServices} from '../src/systems/village-services';
import {EMPTY_INVENTORY,occupiedInventorySlots,MAX_ITEM_COUNT} from '../src/systems/inventory';
import {ITEM_IDS} from '../src/data/items';
import {individualTool} from '../src/systems/tool-instances';
import {CROPS} from '../src/data/crops';
const fixture=()=>{const s=createNewSave(createCharacterProfile('Cesta'));s.inventory={...EMPTY_INVENTORY,carrot:3,strawberry:3,corn:3};s.villageEconomy!.coins=100;return s;};
const prepare=(s:ReturnType<typeof fixture>)=>performVillageService(s,'create-harvest-basket');

describe('cesta de colheita da Helena',()=>{
 it('usa colheitas da Primavera e do Verão e consome a receita inteira por cesta',()=>{
  expect(CROPS.carrot.seasons).toEqual(['spring']);expect(CROPS.strawberry.seasons).toEqual(['spring']);expect(CROPS.corn.seasons).toEqual(['summer']);
  const s=fixture();expect(prepare(s).ok).toBe(true);expect(s.inventory).toMatchObject({carrot:2,strawberry:2,corn:2,harvestBasket:1});expect(s.villageEconomy!.coins).toBe(80);
  expect(prepare(s).ok).toBe(true);expect(s.inventory).toMatchObject({carrot:1,strawberry:1,corn:1,harvestBasket:2});expect(s.villageEconomy!.coins).toBe(60);
 });
 it('recusa cada ingrediente ausente e não aceita substituições',()=>{
  for(const item of ['carrot','strawberry','corn'] as const){const s=fixture();s.inventory[item]=0;s.inventory.turnip=10;s.inventory.wheat=10;const before=structuredClone(s);expect(prepare(s).ok).toBe(false);expect(s).toEqual(before);}
 });
 it('recusa falta de dinheiro sem consumir nenhuma colheita',()=>{
  const s=fixture();s.villageEconomy!.coins=19;const before=structuredClone(s);expect(prepare(s).ok).toBe(false);expect(s).toEqual(before);
 });
 it('só aparece na Helena, com ingredientes disponíveis e preço visíveis',()=>{
  const s=fixture(),offer=listVillageServices('helena',s).find(o=>o.id==='create-harvest-basket')!;expect(offer).toMatchObject({disabled:false,item:'harvestBasket',actionLabel:'Preparar 1 cesta'});expect(offer.description).toContain('20 C');expect(offer.description).toContain('Primavera');expect(offer.description).toContain('Verão');expect(listVillageServices('rosa',s).some(o=>o.id===offer.id)).toBe(false);
  s.inventory.corn=0;expect(listVillageServices('helena',s).find(o=>o.id===offer.id)?.disabled).toBe(true);
 });
 it('não perde materiais nem moedas com mochila cheia; permite ocupar o espaço liberado pela receita',()=>{
  const s=fixture();for(const id of ITEM_IDS){if(occupiedInventorySlots(s.inventory)>=30)break;if(!individualTool(id)&&id!=='harvestBasket'&&id!=='backpack'&&!s.inventory[id])s.inventory[id]=1;}
  expect(occupiedInventorySlots(s.inventory)).toBe(30);const before=structuredClone(s);expect(prepare(s).ok).toBe(false);expect(s).toEqual(before);
  s.inventory.carrot=1;expect(prepare(s).ok).toBe(true);expect(occupiedInventorySlots(s.inventory)).toBe(30);expect(s.inventory.harvestBasket).toBe(1);
 });
 it('recusa excesso de cestas e preserva estoque e carteira',()=>{
  const s=fixture();s.inventory.harvestBasket=MAX_ITEM_COUNT;const before=structuredClone(s);expect(prepare(s).ok).toBe(false);expect(s).toEqual(before);
 });
 it('preserva a cesta ao recarregar e migra partidas anteriores com zero cestas',()=>{
  const s=fixture();expect(prepare(s).ok).toBe(true);const loaded=migrateSave(s)!;expect(loaded.inventory.harvestBasket).toBe(1);expect(loaded.inventory.carrot).toBe(2);expect(loaded.villageEconomy!.coins).toBe(80);
  const old=fixture();delete (old.inventory as Partial<typeof old.inventory>).harvestBasket;expect(migrateSave(old)?.inventory.harvestBasket).toBe(0);
 });
});
