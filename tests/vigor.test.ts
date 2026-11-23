import {describe,expect,it} from 'vitest';
import {createNewSave} from '../src/systems/save';
import {createVillageProgress} from '../src/data/village-progress';
import {spendDurability,TOOL_VIGOR_COST} from '../src/systems/economy';
import {exhausted,playerSpeedFactor,restoreVigor} from '../src/systems/food-effects';

const save=()=>{const s=createNewSave({name:'Teste'} as never);s.villageProgress??=createVillageProgress();s.inventory.hatchet=1;return s;};
describe('vigor gasto pelas ferramentas (preview.48)',()=>{
 it('cada golpe gasta vigor, até zerar',()=>{
  const s=save();s.villageProgress!.vigor=2;
  expect(spendDurability(s,'hatchet')).toBe(true);expect(s.villageProgress!.vigor).toBe(2-TOOL_VIGOR_COST);
  spendDurability(s,'hatchet');spendDurability(s,'hatchet');expect(s.villageProgress!.vigor).toBe(0);
 });
 it('exausto anda mais devagar, e dormir recupera tudo',()=>{
  const s=save();const normal=playerSpeedFactor(s);s.villageProgress!.vigor=0;
  expect(exhausted(s)).toBe(true);expect(playerSpeedFactor(s)).toBeLessThan(normal);
  restoreVigor(s);expect(s.villageProgress!.vigor).toBe(100);expect(exhausted(s)).toBe(false);
 });
});
