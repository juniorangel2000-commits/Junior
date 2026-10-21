import { describe, expect, it } from 'vitest';
import type { BuildingData } from '../src/types';
import { Building, BUILD_COSTS, buildingFootprint, buildingLayer } from '../src/systems/building';
import { BLUEPRINT_COST, BLUEPRINT_SHELTER } from '../src/data/blueprints';
import { WORLD_HEIGHT, WORLD_WIDTH } from '../src/data/regions';
import { INITIAL_INVENTORY, Inventory, MAX_ITEM_COUNT } from '../src/systems/inventory';
import { detectShelter, SHELTER_MAX_TILES } from '../src/systems/shelter';

const stockedInventory = (): Inventory => new Inventory({
  ...INITIAL_INVENTORY, wood: 20, stone: 10, plank: 100, peg: 100, fiber: 100, hammer: 1,
});

function room(interiorWidth = 2, interiorHeight = 2): BuildingData[] {
  const result: BuildingData[] = [];
  const left = 5;
  const top = 5;
  const right = left + interiorWidth + 1;
  const bottom = top + interiorHeight + 1;
  for (let x = left; x <= right; x++) {
    result.push({ x, y: top, kind: 'wall' }, { x, y: bottom, kind: 'wall' });
  }
  for (let y = top + 1; y < bottom; y++) {
    result.push({ x: left, y, kind: 'wall' }, { x: right, y, kind: 'wall' });
  }
  result.find((tile) => tile.x === left + 1 && tile.y === bottom)!.kind = 'door';
  for (let y = top + 1; y < bottom; y++) {
    for (let x = left + 1; x < right; x++) result.push({ x, y, kind: 'floor' });
    for (let x = left + 1; x < right; x += 3) result.push({ x, y, kind: 'roof', rotation: 0 });
  }
  return result;
}

describe('construções e portas', () => {
  it.each(['fence', 'bench'] as const)('preserva os custos e o reembolso de %s sem bancada ou ferramenta', (kind) => {
    const inventory = stockedInventory();
    inventory.data.hammer = 0;
    const before = { ...inventory.data };
    const building = new Building();
    expect(building.place(kind, 19, 18, inventory, true).ok).toBe(true);
    expect(inventory.data.wood).toBe(before.wood - BUILD_COSTS[kind].wood!);
    expect(building.isBlocked(19, 18)).toBe(true);
    expect(building.remove(19, 18, inventory).ok).toBe(true);
    expect(inventory.data).toEqual(before);
  });

  it('monta a primeira bancada com martelo, tábuas e cavilhas, sem exigir outra bancada', () => {
    const inventory = stockedInventory();
    const building = new Building();
    const before = { ...inventory.data };
    expect(building.place('workbench', 19, 18, inventory, true).ok).toBe(true);
    expect(inventory.data.wood).toBe(before.wood);
    expect(inventory.data.plank).toBe(before.plank - 4);
    expect(inventory.data.peg).toBe(before.peg - 4);
    expect(inventory.data.hammer).toBe(1);
    inventory.data.hammer = 0;
    expect(building.place('workbench', 20, 18, inventory, true).ok).toBe(false);
  });

  it.each(['floor', 'wall', 'door', 'window', 'roof'] as const)('exige martelo e bancada, sem exigir serrote, para colocar %s', (kind) => {
    const inventory = stockedInventory();
    const building = new Building();
    const before = { ...inventory.data };
    expect(building.place(kind, 19, 18, inventory, true).ok).toBe(false);
    expect(inventory.data).toEqual(before);
    inventory.data.hammer = 0;
    expect(building.place(kind, 19, 18, inventory, true, { nearWorkbench: true }).ok).toBe(false);
    expect(inventory.data.plank).toBe(before.plank);
    inventory.data.hammer = 1;
    expect(building.place(kind, 19, 18, inventory, true, { nearWorkbench: true }).ok).toBe(true);
    expect(inventory.data.hammer).toBe(1);
    expect(inventory.data.plank).toBe(before.plank - BUILD_COSTS[kind].plank!);
  });

  it('não consome cavilhas parcialmente quando faltam tábuas nem cobra por espaço ocupado', () => {
    const inventory = stockedInventory();
    inventory.data.plank = 3;
    const building = new Building([{ x: 19, y: 18, kind: 'fence' }]);
    const before = { ...inventory.data };
    expect(building.place('workbench', 20, 18, inventory, true).ok).toBe(false);
    expect(building.place('door', 19, 18, inventory, true, { nearWorkbench: true }).ok).toBe(false);
    expect(inventory.data).toEqual(before);
    expect(building.buildings).toEqual([{ x: 19, y: 18, kind: 'fence' }]);
  });

  it('mantém construção e todos os materiais se algum reembolso não cabe na mochila', () => {
    const inventory = stockedInventory();
    inventory.data.stone = MAX_ITEM_COUNT;
    const before = { ...inventory.data };
    const building = new Building([{ x: 19, y: 18, kind: 'bench' }]);
    expect(building.remove(19, 18, inventory).ok).toBe(false);
    expect(inventory.data).toEqual(before);
    expect(building.at(19, 18)?.kind).toBe('bench');
  });

  it('permite piso, estrutura e cobertura no mesmo tile e prioriza a estrutura', () => {
    const inventory = stockedInventory();
    const building = new Building();
    const context = { nearWorkbench: true };
    expect(building.place('floor', 19, 18, inventory, true, context).ok).toBe(true);
    expect(building.isBlocked(19, 18)).toBe(false);
    expect(building.place('roof', 19, 18, inventory, true, context).ok).toBe(true);
    expect(building.isBlocked(19, 18)).toBe(false);
    expect(building.place('window', 19, 18, inventory, true, context).ok).toBe(true);
    expect(building.isBlocked(19, 18)).toBe(true);
    expect(building.at(19, 18)?.kind).toBe('window');
    expect(building.at(19, 18, 'floor')?.kind).toBe('floor');
    expect(building.at(21, 18, 'roof')?.kind).toBe('roof');
    const before = { ...inventory.data };
    expect(building.place('wall', 19, 18, inventory, true, context).ok).toBe(false);
    expect(building.place('floor', 19, 18, inventory, true, context).ok).toBe(false);
    expect(building.place('roof', 21, 18, inventory, true, context).ok).toBe(false);
    expect(inventory.data).toEqual(before);
  });

  it('gira a cobertura 1×3 e verifica todo seu comprimento nos limites do mapa', () => {
    expect(buildingLayer('roof')).toBe('roof');
    expect(buildingFootprint({ x: 19, y: 18, kind: 'roof' })).toEqual([
      { x: 19, y: 18 }, { x: 20, y: 18 }, { x: 21, y: 18 },
    ]);
    expect(buildingFootprint({ x: 19, y: 18, kind: 'roof', rotation: 1 })).toEqual([
      { x: 19, y: 18 }, { x: 19, y: 19 }, { x: 19, y: 20 },
    ]);
    const inventory = stockedInventory();
    const building = new Building();
    expect(building.place('roof', WORLD_WIDTH - 3, 18, inventory, true, { nearWorkbench: true }).ok).toBe(false);
    expect(building.place('roof', 19, WORLD_HEIGHT - 3, inventory, true, { nearWorkbench: true, rotation: 1 }).ok).toBe(false);
    expect(building.place('roof', 19, 18, inventory, true, { nearWorkbench: true, rotation: 1 }).ok).toBe(true);
    expect(building.at(19, 20, 'roof')?.rotation).toBe(1);
    expect(building.at(20, 18, 'roof')).toBeUndefined();
  });

  it('desmonta peças novas com 60% arredondados por componente e não duplica reembolso', () => {
    const inventory = stockedInventory();
    const building = new Building([{ x: 19, y: 18, kind: 'door' }, { x: 20, y: 18, kind: 'floor' }]);
    const before = { ...inventory.data };
    expect(building.remove(19, 18, inventory).ok).toBe(true);
    expect(inventory.data.plank).toBe(before.plank + 1);
    expect(inventory.data.peg).toBe(before.peg + 1);
    expect(building.remove(19, 18, inventory).ok).toBe(false);
    const afterDoor = { ...inventory.data };
    expect(building.remove(20, 18, inventory)).toMatchObject({ ok: true, message: expect.stringContaining('zero') });
    expect(inventory.data).toEqual(afterDoor);
  });

  it('abre e fecha a passagem da porta, sem alterar os dados recebidos no construtor', () => {
    const original: BuildingData[] = [{ x: 19, y: 18, kind: 'door' }];
    const building = new Building(original);
    expect(building.isBlocked(19, 18)).toBe(true);
    expect(building.toggleDoor(19, 18).ok).toBe(true);
    expect(building.isBlocked(19, 18)).toBe(false);
    expect(original[0].open).toBeUndefined();
    expect(building.toggleDoor(19, 18).ok).toBe(true);
    expect(building.isBlocked(19, 18)).toBe(true);
    expect(building.toggleDoor(1, 1).ok).toBe(false);
  });
});

describe('projeto pronto 3×3', () => {
  it('tem os mesmos custos da construção livre e resulta em abrigo com piso e cobertura', () => {
    expect(BLUEPRINT_COST).toEqual({ plank: 32, peg: 9, fiber: 9 });
    const inventory = stockedInventory();
    const manualInventory = stockedInventory();
    const building = new Building();
    const manual = new Building();
    const origin = { x: 20, y: 27 };
    const context = { nearWorkbench: true };
    expect(building.placeBlueprint(origin, inventory, () => true, context).ok).toBe(true);
    for (const piece of BLUEPRINT_SHELTER) {
      expect(manual.place(piece.kind, origin.x + piece.x, origin.y + piece.y, manualInventory, true,
        { ...context, rotation: piece.rotation }).ok).toBe(true);
    }
    expect(inventory.data).toEqual(manualInventory.data);
    expect(building.buildings).toEqual(manual.buildings);
    expect(detectShelter({ x: 21, y: 28 }, building.buildings)).toMatchObject({ sheltered: true, tiles: [{ x: 21, y: 28 }] });
  });

  it('não constrói nem cobra parcialmente se falta material, martelo, estação ou terreno em algum footprint', () => {
    const context = { nearWorkbench: true };
    const inventory = stockedInventory();
    const building = new Building();
    const before = { ...inventory.data };
    expect(building.placeBlueprint({ x: WORLD_WIDTH - 3, y: 27 }, inventory, () => true, context).ok).toBe(false);
    expect(building.placeBlueprint({ x: 20, y: 27 }, inventory, (x, y, kind) => !(x === 22 && y === 29 && kind === 'roof'), context).ok).toBe(false);
    expect(building.placeBlueprint({ x: 20, y: 27 }, inventory, () => true, { nearWorkbench: false }).ok).toBe(false);
    expect(inventory.data).toEqual(before);
    inventory.data.hammer = 0;
    expect(building.placeBlueprint({ x: 20, y: 27 }, inventory, () => true, context).ok).toBe(false);
    inventory.data.hammer = 1;
    inventory.data.fiber = 8;
    const insufficient = { ...inventory.data };
    expect(building.placeBlueprint({ x: 20, y: 27 }, inventory, () => true, context).ok).toBe(false);
    expect(inventory.data).toEqual(insufficient);
    expect(building.buildings).toEqual([]);
  });

  it('não substitui camadas existentes nem permite cobrança dupla pelo mesmo projeto', () => {
    const inventory = stockedInventory();
    const building = new Building();
    expect(building.placeBlueprint({ x: 20, y: 27 }, inventory, () => true, { nearWorkbench: true }).ok).toBe(true);
    const before = { ...inventory.data };
    expect(building.placeBlueprint({ x: 20, y: 27 }, inventory, () => true, { nearWorkbench: true }).ok).toBe(false);
    expect(inventory.data).toEqual(before);
    expect(building.buildings).toHaveLength(20);
  });
});

describe('abrigo simples', () => {
  it.each([
    { name: 'Bosque do Pinheiro', x: 70, y: 18 },
    { name: 'Campos Abertos', x: 23, y: 53 },
  ])('permite construir e reconhecer um abrigo em $name', ({ x, y }) => {
    const inventory = stockedInventory();
    const buildings = new Building();
    expect(buildings.placeBlueprint({ x, y }, inventory, () => true, { nearWorkbench: true }).ok).toBe(true);
    expect(detectShelter({ x: x + 1, y: y + 1 }, buildings.buildings).sheltered).toBe(true);
    const door = buildings.buildings.find((piece) => piece.kind === 'door')!;
    expect(buildings.toggleDoor(door.x, door.y).ok).toBe(true);
    expect(detectShelter({ x: x + 1, y: y + 1 }, buildings.buildings).sheltered).toBe(false);
  });

  it('reconhece o interior fechado e invalida o abrigo ao abrir ou remover a porta', () => {
    const building = new Building(room());
    const inside = { x: 6, y: 6 };
    expect(detectShelter(inside, building.buildings)).toMatchObject({ sheltered: true, tiles: expect.any(Array) });
    expect(detectShelter(inside, building.buildings).tiles).toHaveLength(4);
    const door = building.buildings.find((tile) => tile.kind === 'door')!;
    building.toggleDoor(door.x, door.y);
    expect(detectShelter(inside, building.buildings).sheltered).toBe(false);
    building.toggleDoor(door.x, door.y);
    expect(detectShelter(inside, building.buildings).sheltered).toBe(true);
    building.buildings.splice(building.buildings.indexOf(door), 1);
    expect(detectShelter(inside, building.buildings).sheltered).toBe(false);
  });

  it('recusa recinto sem porta e uma brecha na parede', () => {
    const withoutDoor = room().map((tile): BuildingData => tile.kind === 'door' ? { ...tile, kind: 'wall' } : tile);
    expect(detectShelter({ x: 6, y: 6 }, withoutDoor).sheltered).toBe(false);
    const gap = room().filter((tile) => !(tile.x === 5 && tile.y === 6));
    expect(detectShelter({ x: 6, y: 6 }, gap).sheltered).toBe(false);
  });

  it('uma porta aberta alcançada no interior também impede completar o abrigo', () => {
    const buildings = room();
    buildings.push({ x: 7, y: 7, kind: 'door', open: true });
    expect(detectShelter({ x: 6, y: 6 }, buildings).sheltered).toBe(false);
  });

  it('exige piso e cobertura em todos os espaços internos, em camadas independentes', () => {
    const buildings = room();
    const withoutFloor = buildings.filter((tile) => !(tile.kind === 'floor' && tile.x === 6 && tile.y === 7));
    expect(detectShelter({ x: 6, y: 6 }, withoutFloor)).toMatchObject({ sheltered: false, reason: expect.stringContaining('piso') });
    const withoutRoof = buildings.filter((tile) => !(tile.kind === 'roof' && tile.y === 7));
    expect(detectShelter({ x: 6, y: 6 }, withoutRoof)).toMatchObject({ sheltered: false, reason: expect.stringContaining('cobertura') });
    const windowed = buildings.map((tile): BuildingData => tile.kind === 'wall' && tile.x === 5 && tile.y === 6
      ? { ...tile, kind: 'window' } : tile);
    expect(detectShelter({ x: 6, y: 6 }, windowed).sheltered).toBe(true);
  });

  it.each(['fence', 'bench', 'workbench'] as const)('%s não substitui parede para fechar abrigo', (kind) => {
    const buildings = room();
    buildings.find((tile) => tile.x === 5 && tile.y === 6)!.kind = kind;
    expect(detectShelter({ x: 6, y: 6 }, buildings).sheltered).toBe(false);
  });

  it('aceita de 1 a 64 espaços internos e recusa área maior', () => {
    expect(detectShelter({ x: 6, y: 6 }, room(1, 1)).tiles).toHaveLength(1);
    const maxRoom = detectShelter({ x: 6, y: 6 }, room(8, 8));
    expect(maxRoom.sheltered).toBe(true);
    expect(maxRoom.tiles).toHaveLength(SHELTER_MAX_TILES);
    expect(detectShelter({ x: 6, y: 6 }, room(9, 8)).sheltered).toBe(false);
  });

  it('não usa bordas do mapa, móveis ou o tile de uma parede como interior', () => {
    expect(detectShelter({ x: 0, y: 6 }, room()).sheltered).toBe(false);
    expect(detectShelter({ x: 5, y: 6 }, room()).sheltered).toBe(false);
    expect(detectShelter({ x: 6, y: 6 }, [{ x: 7, y: 6, kind: 'bench' }]).sheltered).toBe(false);
  });
});
