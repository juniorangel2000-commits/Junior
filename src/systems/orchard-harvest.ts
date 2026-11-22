import { orchardFruitReady, type OrchardFruitSpot } from '../data/orchard';
import { ITEM_NAMES } from '../data/items';
import type { SaveData, TilePoint } from '../types';
import { Inventory } from './inventory';

const REACH=42;
export const fruitWithinReach=(fruit:OrchardFruitSpot,p:TilePoint)=>Math.hypot(p.x-fruit.x,p.y-fruit.y)<REACH;

export function collectOrchardFruit(save:SaveData,fruit:OrchardFruitSpot,player:TilePoint,write:(draft:SaveData)=>boolean):string{
  if(save.activeArea!=='orchard'||!fruitWithinReach(fruit,player)||!orchardFruitReady(save.orchardHarvest?.[fruit.id],save.day))return 'A fruta já foi recolhida ou está longe.';
  const inv=new Inventory(save.inventory);
  if(!inv.transact({},{[fruit.item]:1}))return 'A mochila está cheia.';
  const draft={...save,inventory:inv.data,orchardHarvest:{...save.orchardHarvest,[fruit.id]:save.day}};
  if(!write(draft))return 'Não foi possível salvar. A fruta ficou no chão.';
  save.inventory=draft.inventory;
  save.orchardHarvest=draft.orchardHarvest;
  return `${ITEM_NAMES[fruit.item]} na mochila.`;
}
