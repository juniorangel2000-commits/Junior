import { fenceStage } from '../data/fences';
import type { BuildingData, ItemId, TilePoint } from '../types';
import type { ActionResult } from './farming';
import { Inventory, ITEM_NAMES, type ItemCost } from './inventory';
import { BUILD_COSTS, BLUEPRINT_COST, BLUEPRINT_SHELTER } from '../data/blueprints';
import { WORLD_HEIGHT, WORLD_WIDTH } from '../data/regions';

export { BUILD_COSTS } from '../data/blueprints';

export const BUILD_NAMES: Record<BuildingData['kind'], string> = {
  gate: 'Porteira', fence: 'Cerca', bench: 'Banco', workbench: 'Bancada', wall: 'Parede', door: 'Porta',
  floor: 'Piso', window: 'Janela', roof: 'Cobertura',
};

export type BuildingLayer = 'floor' | 'structure' | 'roof';
export interface BuildContext { nearWorkbench: boolean; rotation?: 0 | 1 | 2 | 3; gateFlip?: boolean; day?: number }
export interface BuildRequirements { tools: readonly ItemId[]; nearWorkbench: boolean }
export type BuildValidator = (x: number, y: number, kind: BuildingData['kind']) => boolean;
export const BUILD_RECOVERY_RATE = 0.6;

export const BUILD_REQUIREMENTS: Record<BuildingData['kind'], BuildRequirements> = {
  gate: { tools: [], nearWorkbench: false },
  fence: { tools: [], nearWorkbench: false },
  bench: { tools: [], nearWorkbench: false },
  workbench: { tools: ['hammer'], nearWorkbench: false },
  wall: { tools: ['hammer'], nearWorkbench: true },
  door: { tools: ['hammer'], nearWorkbench: true },
  window: { tools: ['hammer'], nearWorkbench: true },
  floor: { tools: ['hammer'], nearWorkbench: true },
  roof: { tools: ['hammer'], nearWorkbench: true },
};

export function buildingLayer(kind: BuildingData['kind']): BuildingLayer {
  return kind === 'floor' ? 'floor' : kind === 'roof' ? 'roof' : 'structure';
}

export function buildingFootprint(building: BuildingData): TilePoint[] {
  const vertical = (building.rotation ?? 0) % 2 === 1;
  return Array.from({ length: building.kind === 'roof' ? 3 : 1 }, (_, offset) => ({
    x: building.x + (vertical ? 0 : offset),
    y: building.y + (vertical ? offset : 0),
  }));
}

function requirementsError(kind: BuildingData['kind'], inventory: Inventory, context: BuildContext): string | undefined {
  const requirements = BUILD_REQUIREMENTS[kind];
  if (requirements.tools.some((tool) => !inventory.has(tool))) {
    return 'Você precisa de um martelo na mochila para montar esta peça.';
  }
  if (requirements.nearWorkbench && !context.nearWorkbench) {
    return 'Aproxime-se de uma bancada para construir pisos, paredes, portas, janelas e coberturas.';
  }
}

function materialError(name: string, cost: ItemCost): ActionResult {
  const materials = Object.entries(cost)
    .map(([item, amount]) => `${ITEM_NAMES[item as ItemId]} ×${amount}`).join(' + ');
  return { ok: false, message: `${name}: materiais insuficientes. Custo: ${materials}.` };
}

const inBounds = (tile: TilePoint): boolean => Number.isInteger(tile.x) && Number.isInteger(tile.y)
  && tile.x >= 1 && tile.x <= WORLD_WIDTH - 2 && tile.y >= 1 && tile.y <= WORLD_HEIGHT - 2;

export class Building {
  readonly buildings: BuildingData[];

  constructor(buildings: BuildingData[] = [], day?: number) {
    this.buildings = buildings.map((building) => ({ ...building,
      ...(building.kind === 'roof' && building.rotation !== undefined ? { rotation: ((building.rotation % 2) as 0 | 1) } : {}),
      ...(building.kind === 'fence' && building.fenceBuiltDay === undefined && day !== undefined ? { fenceBuiltDay: day } : {}) }));
  }

  at(x: number, y: number, layer?: BuildingLayer): BuildingData | undefined {
    for (const candidateLayer of layer ? [layer] : ['structure', 'floor', 'roof'] as const) {
      const building = this.buildings.find((candidate) => buildingLayer(candidate.kind) === candidateLayer
        && buildingFootprint(candidate).some((tile) => tile.x === x && tile.y === y));
      if (building) return building;
    }
  }

  isBlocked(x: number, y: number): boolean {
    const building = this.at(x, y, 'structure');
    return !!building && !((building.kind === 'door' || building.kind === 'gate') && building.open === true);
  }

  place(kind: BuildingData['kind'], x: number, y: number, inventory: Inventory, isBuildable: boolean,
    context: BuildContext = { nearWorkbench: false }): ActionResult {
    const piece: BuildingData = kind === 'gate' ? { x, y, kind, open: false, rotation: context.rotation ?? 0, gateFlip: context.gateFlip ?? false }
      : kind === 'door' ? { x, y, kind, open: false }
      : kind === 'roof' ? { x, y, kind, rotation: ((context.rotation ?? 0) % 2) as 0 | 1 } : { x, y, kind };
    if (kind === 'fence' && context.day !== undefined) piece.fenceBuiltDay = context.day;
    const footprint = buildingFootprint(piece);
    if (!isBuildable || !footprint.every(inBounds)) {
      return { ok: false, message: 'Escolha um espaço livre de grama perto de você.' };
    }
    if (footprint.some((tile) => this.at(tile.x, tile.y, buildingLayer(kind)))) {
      return { ok: false, message: 'Esta camada do espaço já está ocupada.' };
    }
    const error = requirementsError(kind, inventory, context);
    if (error) return { ok: false, message: error };
    if (!inventory.transact(BUILD_COSTS[kind], {})) return materialError(BUILD_NAMES[kind], BUILD_COSTS[kind]);
    this.buildings.push(piece);
    return { ok: true, message: kind === 'fence' ? 'Uma cerca para chamar de sua.' : kind === 'bench'
      ? 'Um banco para ver a vida voltar.' : `${BUILD_NAMES[kind]} construída. Os materiais ganharam um novo propósito.` };
  }

  placeBlueprint(origin: TilePoint, inventory: Inventory, isBuildable: BuildValidator,
    context: BuildContext = { nearWorkbench: false }): ActionResult {
    const pieces = BLUEPRINT_SHELTER.map((piece) => ({ ...piece, x: piece.x + origin.x, y: piece.y + origin.y }));
    const occupied = new Set<string>();
    for (const piece of pieces) {
      const error = requirementsError(piece.kind, inventory, context);
      if (error) return { ok: false, message: error };
      const layer = buildingLayer(piece.kind);
      for (const tile of buildingFootprint(piece)) {
        const key = `${layer}:${tile.x},${tile.y}`;
        if (!inBounds(tile) || !isBuildable(tile.x, tile.y, piece.kind)) {
          return { ok: false, message: 'O projeto precisa de um espaço livre de 3×3, com acesso pela porta.' };
        }
        if (occupied.has(key) || this.at(tile.x, tile.y, layer)) {
          return { ok: false, message: 'O projeto se sobrepõe a uma construção existente na mesma camada.' };
        }
        occupied.add(key);
      }
    }
    if (!inventory.transact(BLUEPRINT_COST, {})) return materialError('Abrigo 3×3', BLUEPRINT_COST);
    this.buildings.push(...pieces);
    return { ok: true, message: 'Abrigo 3×3 montado com piso, janela, porta e cobertura. Entre e feche a porta.' };
  }

  remove(x: number, y: number, inventory: Inventory): ActionResult {
    const building = this.at(x, y);
    if (!building) return { ok: false, message: 'Aponte para uma construção sua para recolhê-la.' };
    const legacy = building.kind === 'fence' || building.kind === 'bench';
    const refund: ItemCost = {};
    for (const [item, amount] of Object.entries(BUILD_COSTS[building.kind])) {
      const quantity = legacy ? amount! : Math.floor(amount! * BUILD_RECOVERY_RATE);
      if (quantity > 0) refund[item as ItemId] = quantity;
    }
    if (!inventory.transact({}, refund)) {
      return { ok: false, message: 'A mochila está cheia. Libere espaço para recuperar todos os materiais.' };
    }
    this.buildings.splice(this.buildings.indexOf(building), 1);
    return { ok: true, message: legacy ? 'Construção recolhida. Os materiais voltaram para a mochila.'
      : Object.keys(refund).length ? 'Peça desmontada. Você recuperou 60% dos componentes, arredondados para baixo.'
        : 'Piso desmontado. O reembolso de 60% de uma tábua é arredondado para zero.' };
  }

  repairFence(x:number,y:number,inventory:Inventory,day:number):ActionResult {
    const fence=this.at(x,y,'structure');
    if(fence?.kind!=='fence')return {ok:false,message:'Aponte para uma cerca desgastada.'};
    if(fenceStage(fence,day)==='new')return {ok:false,message:'Esta cerca ainda está nova.'};
    if(!inventory.spend({wood:1}))return {ok:false,message:'Você precisa de 1 madeira para reparar a cerca.'};
    fence.fenceBuiltDay=day;
    return {ok:true,message:'Cerca restaurada. Custo: 1 madeira.'};
  }

  toggleGate(x:number,y:number,occupied=false):ActionResult {
    const gate=this.at(x,y,'structure');
    if(gate?.kind!=='gate')return {ok:false,message:'Não há uma porteira aqui.'};
    if(gate.open&&occupied)return {ok:false,message:'A passagem está ocupada. Afaste-se e espere o animal passar.'};
    gate.open=!gate.open;
    return {ok:true,message:gate.open?'Porteira aberta. Os animais podem passar.':'Porteira fechada.'};
  }

  toggleDoor(x: number, y: number): ActionResult {
    const door = this.at(x, y, 'structure');
    if (door?.kind !== 'door') return { ok: false, message: 'Não há uma porta aqui.' };
    door.open = !door.open;
    return { ok: true, message: door.open ? 'Porta aberta.' : 'Porta fechada.' };
  }
}
