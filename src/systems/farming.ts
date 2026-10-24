import type { CropData, FarmingProgress, TilePoint } from '../types';
import { WORLD_WIDTH, WORLD_HEIGHT } from '../data/regions';
import { Inventory } from './inventory';

export interface ActionResult { ok: boolean; message: string }
export const GROWTH_SECONDS = 45;
export const isFarmTile = (x: number, y: number): boolean =>
  Number.isInteger(x) && Number.isInteger(y) && x >= 21 && x <= 29 && y >= 20 && y <= 24;
export const validSoilTile = (x: number, y: number): boolean => Number.isSafeInteger(x) && Number.isSafeInteger(y)
  && x >= 1 && y >= 1 && x < WORLD_WIDTH - 1 && y < WORLD_HEIGHT - 1;

export interface SoilGround {
  area: 'property' | 'forest';
  terrainAt(x: number, y: number): string;
  occupied(x: number, y: number): boolean;
  reserved(x: number, y: number): boolean;
}

/** Shared by the aim preview and the contact frame; never trust an old aim. */
export function soilGroundReason(x: number, y: number, ground: SoilGround): string {
  if (ground.area !== 'property') return 'Prepare sua horta na Propriedade Abandonada.';
  if (!validSoilTile(x, y)) return 'Escolha um chão dentro da propriedade.';
  if (ground.reserved(x, y)) return 'Deixe livres as entradas, saídas e o acesso à casa.';
  if (!['grass', 'meadow', 'forest', 'moss', 'soil'].includes(ground.terrainAt(x, y))) return 'Prepare terra ou grama; preserve caminhos, areia, água e pisos.';
  if (ground.occupied(x, y)) return 'Limpe este espaço antes de preparar ou plantar.';
  return '';
}

export class Farming {
  readonly crops: CropData[];
  readonly preparedSoil: TilePoint[];
  readonly restoredFarmSoil: TilePoint[];
  readonly progress: FarmingProgress;
  private readonly prepared = new Set<string>();
  private readonly restored = new Set<string>();

  constructor(crops: CropData[] = [], preparedSoil: TilePoint[] = [], progress?: FarmingProgress, restoredFarmSoil: TilePoint[] = []) {
    this.crops = crops.map((crop) => ({ ...crop }));
    this.preparedSoil = preparedSoil.map(point => ({ ...point }));
    this.restoredFarmSoil = restoredFarmSoil.map(point => ({ ...point }));
    for (const p of this.restoredFarmSoil) this.restored.add(`${p.x},${p.y}`);
    for (const p of this.preparedSoil) this.prepared.add(`${p.x},${p.y}`);
    this.progress = {
      prepared: this.preparedSoil.length > 0, planted: crops.length > 0,
      watered: crops.some(c => c.watered), harvested: false, ...progress,
    };
  }

  isPrepared(x: number, y: number): boolean { return isFarmTile(x, y) && !this.restored.has(`${x},${y}`) || this.prepared.has(`${x},${y}`); }

  get soilTiles(): TilePoint[] {
    const tiles = [...this.preparedSoil];
    for (let y=20;y<=24;y++) for (let x=21;x<=29;x++) if (!this.restored.has(`${x},${y}`) && !this.prepared.has(`${x},${y}`)) tiles.push({x,y});
    return tiles;
  }

  prepareReason(x: number, y: number, inventory: Inventory, ground: SoilGround): string {
    if (!inventory.has('hoe')) return 'Fabrique uma enxada com C antes de preparar o solo.';
    const reason = soilGroundReason(x, y, ground);
    if (reason) return reason;
    if (this.cropAt(x, y)) return 'Já existe uma plantinha aqui. Preserve sua colheita.';
    if (this.isPrepared(x, y)) return 'A terra já está preparada. Agora plante uma semente.';
    return '';
  }

  prepare(x: number, y: number, inventory: Inventory, ground: SoilGround): ActionResult {
    const message = this.prepareReason(x, y, inventory, ground);
    if (message) return { ok: false, message };
    if (isFarmTile(x,y)) {
      this.restored.delete(`${x},${y}`);
      this.restoredFarmSoil.splice(this.restoredFarmSoil.findIndex(p=>p.x===x&&p.y===y),1);
    } else { this.prepared.add(`${x},${y}`); this.preparedSoil.push({ x, y }); }
    this.progress.prepared = true;
    return { ok: true, message: 'Canteiro preparado! Equipe sementes para plantar.' };
  }

  restoreReason(x: number, y: number, inventory: Inventory): string {
    if (!inventory.has('hoe')) return 'Equipe uma enxada para desfazer o canteiro.';
    if (this.cropAt(x,y)) return 'Colha a planta antes de desfazer este canteiro.';
    if (!this.isPrepared(x,y)) return 'Escolha um canteiro preparado para desfazer.';
    return '';
  }

  restore(x: number, y: number, inventory: Inventory): ActionResult {
    const message = this.restoreReason(x,y,inventory);
    if (message) return {ok:false,message};
    if (isFarmTile(x,y)) {
      this.restored.add(`${x},${y}`);this.restoredFarmSoil.push({x,y});
    } else {
      this.prepared.delete(`${x},${y}`);
      this.preparedSoil.splice(this.preparedSoil.findIndex(p => p.x===x && p.y===y),1);
    }
    // The ground was only covered by an overlay. Removing it reveals exactly
    // the previous floor, including the author's imported map paint.
    return {ok:true,message:'Canteiro desfeito. O piso anterior foi restaurado.'};
  }

  cropAt(x: number, y: number): CropData | undefined {
    return this.crops.find((crop) => crop.x === x && crop.y === y);
  }

  plant(x: number, y: number, inventory: Inventory): ActionResult {
    if (!this.isPrepared(x, y)) return { ok: false, message: 'Prepare este solo com a enxada antes de plantar.' };
    if (this.cropAt(x, y)) return { ok: false, message: 'Já existe uma plantinha aqui.' };
    if (!inventory.spend({ seeds: 1 })) return { ok: false, message: 'Faltam sementes. Procure arbustos pela clareira.' };
    this.crops.push({ x, y, growth: 0, watered: false });
    this.progress.planted = true;
    return { ok: true, message: 'Nabo plantado! Agora é só regar e dar tempo ao tempo.' };
  }

  water(x: number, y: number): ActionResult {
    const crop = this.cropAt(x, y);
    if (!crop) return { ok: false, message: 'Plante uma semente antes de regar.' };
    if (crop.watered) return { ok: false, message: 'A terra já está úmida. Sua plantinha está crescendo.' };
    crop.watered = true;
    this.progress.watered = true;
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
    this.progress.harvested = true;
    return { ok: true, message: 'Colheita! +1 nabo e +1 semente para recomeçar.' };
  }

  update(deltaSeconds: number): void {
    if (!Number.isFinite(deltaSeconds) || deltaSeconds <= 0) return;
    for (const crop of this.crops) {
      if (crop.watered) crop.growth = Math.min(1, crop.growth + deltaSeconds / GROWTH_SECONDS);
    }
  }
}
