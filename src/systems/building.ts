import type { BuildingData } from '../types';
import type { ActionResult } from './farming';
import { Inventory, type ItemCost } from './inventory';

export const BUILD_COSTS: Record<BuildingData['kind'], ItemCost> = {
  fence: { wood: 2 },
  bench: { wood: 4, stone: 2 },
};

export class Building {
  readonly buildings: BuildingData[];

  constructor(buildings: BuildingData[] = []) {
    this.buildings = buildings.map((building) => ({ ...building }));
  }

  at(x: number, y: number): BuildingData | undefined {
    return this.buildings.find((building) => building.x === x && building.y === y);
  }

  place(kind: BuildingData['kind'], x: number, y: number, inventory: Inventory, isBuildable: boolean): ActionResult {
    if (!isBuildable || !Number.isInteger(x) || !Number.isInteger(y) || x < 1 || x > 52 || y < 1 || y > 40) {
      return { ok: false, message: 'Escolha um espaço livre de grama perto de você.' };
    }
    if (this.at(x, y)) return { ok: false, message: 'Este espaço já está ocupado.' };
    if (!inventory.spend(BUILD_COSTS[kind])) return {
      ok: false,
      message: kind === 'fence' ? 'A cerca precisa de 2 madeiras.' : 'O banco precisa de 4 madeiras e 2 pedras.',
    };
    this.buildings.push({ x, y, kind });
    return { ok: true, message: kind === 'fence' ? 'Uma cerca para chamar de sua.' : 'Um banco para ver a vida voltar.' };
  }

  remove(x: number, y: number, inventory: Inventory): ActionResult {
    const building = this.at(x, y);
    if (!building) return { ok: false, message: 'Aponte para uma cerca ou banco que você construiu.' };
    for (const [item, amount] of Object.entries(BUILD_COSTS[building.kind])) {
      inventory.add(item as keyof typeof inventory.data, amount!);
    }
    this.buildings.splice(this.buildings.indexOf(building), 1);
    return { ok: true, message: 'Construção recolhida. Os materiais voltaram para a mochila.' };
  }
}
