import type { CropData, FarmingProgress, TilePoint } from '../types';
import { WORLD_WIDTH, WORLD_HEIGHT } from '../data/regions';
import { Inventory } from './inventory';
import { CROPS, cropDefinition, type CropDefinition, type CropId } from '../data/crops';
import { calendarDate, daysLeftInSeason, SEASON_NAMES } from './calendar';

export interface ActionResult { ok: boolean; message: string }
/** Limite de dias processados de uma vez; protege saves com datas absurdas. */
const MAX_SETTLE_DAYS = 4000;

/** Converte um canteiro de save antigo (crescimento por segundos) para dias regados. */
export function normalizeCrop(crop: CropData, day: number): void {
  if (crop.day !== undefined && crop.days !== undefined && crop.crop !== undefined) return;
  const def = cropDefinition(crop.crop);
  crop.crop ??= 'turnip';
  crop.days ??= Math.min(def.days, Math.max(0, Math.floor(crop.growth * def.days + 1e-9)));
  crop.day ??= day;
  crop.growth = Math.min(1, crop.days / def.days);
}

/** Avança um canteiro do dia `crop.day` até `today`. Cada dia regado vale um dia de
 * crescimento; a rega vale só para o próprio dia. Na virada para uma estação fora
 * da ficha, a planta murcha. Retorna false se ela murchou. */
export function advanceCrop(crop: CropData, def: CropDefinition, today: number): boolean {
  if (crop.day === undefined || crop.days === undefined || !Number.isFinite(today)) return true;
  let day = crop.day;
  if (today - day > MAX_SETTLE_DAYS) day = today - MAX_SETTLE_DAYS;
  while (day < today) {
    if (crop.watered) crop.days = Math.min(def.days, crop.days + 1);
    crop.watered = false;
    const next = day + 1;
    if (calendarDate(next).season !== calendarDate(day).season && !def.seasons.includes(calendarDate(next).season)) return false;
    day = next;
  }
  crop.day = Math.max(crop.day, today);
  crop.growth = Math.min(1, crop.days / def.days);
  return true;
}

/** Texto curto do estado de um canteiro, para a interface. */
export function cropStatus(crop: CropData): string {
  const def = cropDefinition(crop.crop), done = crop.days ?? Math.floor(crop.growth * def.days);
  if (crop.growth >= 1) return `Colher ${def.name.toLowerCase()}`;
  const left = def.days - done;
  return `${def.name} · falta${left > 1 ? 'm' : ''} ${left} dia${left > 1 ? 's' : ''} regado${left > 1 ? 's' : ''}${crop.watered ? ' · regado hoje' : ' · precisa de água'}`;
}

/** Adubo: um dia extra de crescimento e a rega do dia. */
export function fertilizeCrop(crop: CropData, day: number): boolean {
  normalizeCrop(crop, day);
  const def = cropDefinition(crop.crop);
  if (crop.growth >= 1) return false;
  crop.days = Math.min(def.days, (crop.days ?? 0) + 1);
  crop.growth = Math.min(1, crop.days / def.days);
  crop.watered = true;
  return true;
}
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

  plant(x: number, y: number, inventory: Inventory, day = 1, id: CropId = 'turnip'): ActionResult {
    const def: CropDefinition = CROPS[id];
    if (!def) return { ok: false, message: 'Esta semente não é conhecida.' };
    if (!this.isPrepared(x, y)) return { ok: false, message: 'Prepare este solo com a enxada antes de plantar.' };
    if (this.cropAt(x, y)) return { ok: false, message: 'Já existe uma plantinha aqui.' };
    const season = calendarDate(day).season;
    if (!def.seasons.includes(season)) return { ok: false, message: `${def.name} não cresce no ${SEASON_NAMES[season]}. Guarde a semente para a estação certa.` };
    if (!inventory.spend({ [def.seed]: 1 })) return { ok: false, message: 'Faltam sementes. Procure arbustos pela clareira.' };
    this.crops.push({ x, y, growth: 0, watered: false, crop: id, days: 0, day });
    this.progress.planted = true;
    const left = daysLeftInSeason(day), short = def.seasons.length < 4 && left < def.days && !def.seasons.includes(calendarDate(day + left).season);
    return { ok: true, message: `${def.name} plantado! Regue todos os dias: são ${def.days} dias regados até a colheita.${short ? ` Atenção: faltam só ${left} dias nesta estação.` : ''}` };
  }

  water(x: number, y: number): ActionResult {
    const crop = this.cropAt(x, y);
    if (!crop) return { ok: false, message: 'Plante uma semente antes de regar.' };
    if (crop.watered) return { ok: false, message: 'A terra já está úmida hoje. Volte a regar amanhã.' };
    crop.watered = true;
    this.progress.watered = true;
    const def = cropDefinition(crop.crop), left = Math.max(0, def.days - (crop.days ?? Math.floor(crop.growth * def.days)));
    return { ok: true, message: left ? `Terra regada. ${left === 1 ? 'Amanhã' : `Em ${left} dias regados`} ${def.name.toLowerCase()} fica pronto.` : `Terra regada. ${def.name} já pode ser colhido.` };
  }

  harvest(x: number, y: number, inventory: Inventory,ground?:(cost:import('./inventory').ItemCost)=>boolean): ActionResult {
    const crop = this.cropAt(x, y);
    if (!crop) return { ok: false, message: 'Um bom lugar para começar a plantar.' };
    if (crop.growth < 1) return { ok: false, message: cropStatus(crop) + '.' };
    const def = cropDefinition(crop.crop), gain: Record<string, number> = { [def.harvest]: def.yield };
    if (def.seedReturn) gain[def.seed] = (gain[def.seed] ?? 0) + def.seedReturn;
    if (!(ground?ground(gain):inventory.transact({}, gain))) return { ok: false, message: 'A mochila não comporta a colheita. Abra espaço antes de colher.' };
    if (def.regrow) { crop.days = def.days - def.regrow; crop.growth = crop.days / def.days; }
    else this.crops.splice(this.crops.indexOf(crop), 1);
    this.progress.harvested = true;
    const name = def.name.toLowerCase();
    return { ok: true, message: `Colheita! +${def.yield} ${name}${def.seedReturn ? ` e +${def.seedReturn} semente para recomeçar` : ''}${def.regrow ? `. Produz de novo em ${def.regrow} dias regados` : ''}.` };
  }

  /** O crescimento conta por dias regados; `day` é o dia atual do calendário. Sem dia,
   * nada muda (o tempo em segundos não faz mais as plantas crescerem). */
  update(_deltaSeconds: number, day?: number): string[] {
    if (day === undefined || !Number.isSafeInteger(day) || day < 1) return [];
    const withered: string[] = [];
    for (const crop of [...this.crops]) {
      normalizeCrop(crop, day);
      if (crop.day! >= day) continue;
      const def = cropDefinition(crop.crop);
      if (!advanceCrop(crop, def, day)) { this.crops.splice(this.crops.indexOf(crop), 1); withered.push(def.name); }
    }
    return withered;
  }
}
