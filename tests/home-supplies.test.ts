import { describe, it, expect } from 'vitest';
import { collectHomeSupply } from '../src/systems/home-supplies';
import { Inventory } from '../src/systems/inventory';
import { createNewSave, migrateSave, validateSave } from '../src/systems/save';
import { emptyQuickbar } from '../src/systems/quickbar';
const profile = { name: 'Jardim', skin: '#e9bc98', hairColor: '#563b2c', outfit: '#457398', hairStyle: 'preso' as const };
describe('Coletas da casa e barra rápida', () => {
  for (const order of [['wateringCan', 'seedPacket'], ['seedPacket', 'wateringCan']] as const) {
    it(`salva, recarrega e impede duplicação: ${order.join(' → ')}`, () => {
      let state = createNewSave(profile);
      let inventory = new Inventory(state.inventory);
      for (const id of order) {
        expect(collectHomeSupply(state, inventory, id)).toBe(true);
        state.inventory = { ...inventory.data };
        expect(validateSave(state)).toBe(true);
        state = migrateSave(JSON.parse(JSON.stringify(state)))!;
        inventory = new Inventory(state.inventory);
        expect(collectHomeSupply(state, inventory, id)).toBe(false);
      }
      expect(state.wateringCanWater).toBe(0);
      expect(inventory.data.seeds).toBe(7);
      expect(state.homeSupplies).toEqual({ wateringCan: true, seedPacket: true });
    });
  }
  it('não perde o pacote quando o inventário está cheio', () => {
    const state = createNewSave(profile), inventory = new Inventory({ seeds: 999999 });
    expect(collectHomeSupply(state, inventory, 'seedPacket')).toBe(false);
    expect(state.homeSupplies?.seedPacket).toBe(false);
  });
  it('preserva slots escolhidos, aceita saves antigos e rejeita dados inválidos', () => {
    const state = createNewSave(profile);
    expect(state.quickbar).toEqual(emptyQuickbar());
    state.quickbar![8] = 'water';
    expect(migrateSave(state)?.quickbar?.[8]).toBe('water');
    delete state.quickbar; delete state.homeSupplies;
    expect(validateSave(state)).toBe(true);
    expect(validateSave({ ...state, quickbar: ['water'] })).toBe(false);
    expect(validateSave({ ...state, homeSupplies: { wateringCan: 'yes', seedPacket: false } })).toBe(false);
  });
});

it('preserva água ao salvar e rejeita quantidades inválidas', () => {
  const state = createNewSave(profile);
  for (const water of [0, 1, 8]) {
    state.wateringCanWater = water;
    expect(migrateSave(JSON.parse(JSON.stringify(state)))?.wateringCanWater).toBe(water);
  }
  for (const water of [-1, 9, .5, '8', null]) expect(validateSave({ ...state, wateringCanWater: water })).toBe(false);
});
