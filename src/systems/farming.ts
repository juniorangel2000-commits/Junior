import type { CropData } from '../types';
import { Inventory } from './inventory';

export interface ActionResult { ok: boolean; message: string }
export const GROWTH_SECONDS = 45;
export const isFarmTile = (x: number, y: number): boolean =>
  Number.isInteger(x) && Number.isInteger(y) && x >= 21 && x <= 29 && y >= 20 && y <= 24;

export class Farming {
  readonly crops: CropData[];

  constructor(crops: CropData[] = []) {
    this.crops = crops.map((crop) => ({ ...crop }));
  }

  cropAt(x: number, y: number): CropData | undefined {
    return this.crops.find((crop) => crop.x === x && crop.y === y);
  }

  plant(x: number, y: number, inventory: Inventory): ActionResult {
    if (!isFarmTile(x, y)) return { ok: false, message: 'Plante na terra preparada da horta.' };
    if (this.cropAt(x, y)) return { ok: false, message: 'Já existe uma plantinha aqui.' };
    if (!inventory.spend({ seeds: 1 })) return { ok: false, message: 'Faltam sementes. Procure arbustos pela clareira.' };
    this.crops.push({ x, y, growth: 0, watered: false });
    return { ok: true, message: 'Nabo plantado! Agora é só regar e dar tempo ao tempo.' };
  }

  water(x: number, y: number): ActionResult {
    const crop = this.cropAt(x, y);
    if (!crop) return { ok: false, message: 'Plante uma semente antes de regar.' };
    if (crop.watered) return { ok: false, message: 'A terra já está úmida. Sua plantinha está crescendo.' };
    crop.watered = true;
    return { ok: true, message: 'Terra regada. Seu nabo fica pronto em 45 segundos de jogo.' };
  }

  harvest(x: number, y: number, inventory: Inventory): ActionResult {
    const crop = this.cropAt(x, y);
    if (!crop) return { ok: false, message: 'Um bom lugar para começar a plantar.' };
    if (crop.growth < 1) return {
      ok: false,
      message: crop.watered ? `Crescendo com calma… ${Math.floor(crop.growth * 100)}%.` : 'A plantinha está com sede. Use o regador.',
    };
    if (!inventory.transact({}, { turnip: 1, seeds: 1 })) return { ok: false, message: 'A mochila não comporta a colheita. Abra espaço antes de colher.' };
    this.crops.splice(this.crops.indexOf(crop), 1);
    return { ok: true, message: 'Colheita! +1 nabo e +1 semente para recomeçar.' };
  }

  update(deltaSeconds: number): void {
    if (!Number.isFinite(deltaSeconds) || deltaSeconds <= 0) return;
    for (const crop of this.crops) {
      if (crop.watered) crop.growth = Math.min(1, crop.growth + deltaSeconds / GROWTH_SECONDS);
    }
  }
}
