import { describe, it, expect } from 'vitest';
import { assignQuickSlot, emptyQuickbar, inventoryEntries, quickAction, quickQuantity, validQuickbar } from '../src/systems/quickbar';
import { EMPTY_INVENTORY, INVENTORY_CAPACITY, Inventory, occupiedInventorySlots } from '../src/systems/inventory';
import { createNewSave, migrateSave } from '../src/systems/save';
const profile = { name: 'Mochila', skin: '#e9bc98', hairColor: '#563b2c', outfit: '#457398', hairStyle: 'preso' as const };
describe('Mochila e atalhos de itens', () => {
  it('usa 30 espaços e empilha itens iguais; regador só aparece após coleta', () => {
    const inventory = new Inventory({ seeds: 7, wood: 30 });
    inventory.add('wood', 20);
    expect(INVENTORY_CAPACITY).toBe(30);
    expect(occupiedInventorySlots(inventory.data)).toBe(2);
    expect(inventoryEntries(inventory.data, false)).toEqual(['item:wood', 'item:seeds']);
    expect(inventoryEntries(inventory.data, true)).toContain('item:wateringCan');
  });
  it('atribuir, substituir, repetir ou remover atalhos não altera as quantidades', () => {
    const inventory = new Inventory({ seeds: 7, hatchet: 1 });
    const before = { ...inventory.data };
    let slots = assignQuickSlot(emptyQuickbar(), 0, 'item:seeds');
    slots = assignQuickSlot(slots, 1, 'item:seeds');
    slots = assignQuickSlot(slots, 0, 'item:hatchet');
    slots = assignQuickSlot(slots, 0, null);
    expect(slots[0]).toBeNull(); expect(slots[1]).toBe('item:seeds');
    expect(inventory.data).toEqual(before);
    inventory.spend({ seeds: 7 });
    expect(quickQuantity(slots[1], inventory.data, false)).toBe(0);
  });
  it('converte itens utilizáveis para suas ações e mantém materiais na mochila', () => {
    expect(quickAction('item:seeds')).toBe('plant');
    expect(quickAction('item:wateringCan')).toBe('water');
    expect(quickAction('item:hatchet')).toBe('hatchet');
    expect(quickAction('item:pickaxe')).toBe('pickaxe');
    expect(quickAction('item:wood')).toBe('hand');
    expect(quickQuantity('item:wateringCan', EMPTY_INVENTORY, true)).toBe(1);
    expect(quickQuantity('item:wateringCan', EMPTY_INVENTORY, false)).toBe(0);
  });
  it('persiste itens e continua aceitando os atalhos de ações da 0.6.0', () => {
    const save = createNewSave(profile);
    save.quickbar = assignQuickSlot(emptyQuickbar(), 8, 'item:wateringCan');
    save.quickbar[0] = 'fence';
    expect(migrateSave(JSON.parse(JSON.stringify(save)))?.quickbar).toEqual(save.quickbar);
  });
  it('rejeita itens inexistentes, dados externos e índices fora da barra', () => {
    const slots = emptyQuickbar();
    for (const value of ['item:fake', '<img src=x>', {}, 'wood']) expect(assignQuickSlot(slots, 0, value)).toEqual(slots);
    expect(assignQuickSlot(slots, 9, 'item:wood')).toEqual(slots);
    expect(validQuickbar(['item:fake', ...slots.slice(1)])).toBe(false);
  });
});
