import {describe,it,expect} from 'vitest';
import {createNewSave,validateSave,migrateSave} from '../src/systems/save';
import {createCharacterProfile} from '../src/data/characters';
import {performVillageService} from '../src/systems/village-services';
import {Inventory,inventoryCapacity} from '../src/systems/inventory';
import {useConsumable} from '../src/systems/consumables';
import {craft} from '../src/systems/crafting';
const fixture=()=>{const s=createNewSave(createCharacterProfile('Serviços'));s.villageEconomy!.coins=1000;Object.assign(s.inventory,{wood:40,stone:40,metalPart:12,rareHerb:2,cloth:20,cord:12,fiber:50,herb:30});return s;};
describe('serviços reais da vila',()=>{
 it('remove o reforço instantâneo antigo sem modificar estoque ou carteira',()=>{const s=fixture(),before=structuredClone(s);expect(performVillageService(s,'upgrade-pickaxe').ok).toBe(false);expect(s).toEqual(before);});
 it('aprende receita com planta rara, fabrica e consome sem repetir desbloqueio',()=>{const s=fixture();expect(performVillageService(s,'learn-medicine').ok).toBe(true);const before=structuredClone(s);expect(performVillageService(s,'learn-medicine').ok).toBe(false);expect(s).toEqual(before);const i=new Inventory(s.inventory);expect(craft('bandage',i,false,s.villageProgress).ok).toBe(true);s.inventory=i.data;s.villageProgress!.vigor=50;expect(useConsumable(s,'bandage').ok).toBe(true);expect(s.villageProgress!.vigor).toBe(80);expect(migrateSave(s)?.villageProgress).toEqual(s.villageProgress);});
 it('entrega contrato parcialmente e paga uma única recompensa inclusive após recarregar',()=>{let s=fixture();expect(performVillageService(s,'contract-accept').ok).toBe(true);s.inventory.turnip=4;expect(performVillageService(s,'contract-deliver').ok).toBe(true);expect(s.villageProgress!.contract!.delivered).toBe(4);s.inventory.turnip=6;expect(performVillageService(s,'contract-deliver').ok).toBe(true);expect(s.villageEconomy!.coins).toBe(1220);s=migrateSave(s)!;const before=structuredClone(s);expect(performVillageService(s,'contract-deliver').ok).toBe(false);expect(s).toEqual(before);});
 it('amplia a mochila somente até dois níveis e mantém transação recusada intacta',()=>{const i=new Inventory({backpack:1});expect(inventoryCapacity(i.data)).toBe(40);expect(i.transact({},{backpack:1})).toBe(true);expect(inventoryCapacity(i.data)).toBe(50);const before={...i.data};expect(i.transact({},{backpack:1})).toBe(false);expect(i.data).toEqual(before);});
 it('instala bomba uma vez, rejeita sobreposição e conserva o item na recusa',()=>{const s=fixture();s.inventory.waterPump=2;expect(useConsumable(s,'waterPump',{x:40,y:40},()=>false).ok).toBe(true);expect(s.inventory.waterPump).toBe(1);expect(useConsumable(s,'waterPump',{x:40,y:40},()=>false).ok).toBe(false);expect(s.inventory.waterPump).toBe(1);expect(validateSave(s)).toBe(true);});
});
